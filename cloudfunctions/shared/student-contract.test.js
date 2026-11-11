const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createMemoryRepo } = require('./memory-repo')
const { handle } = require('../student/index')
const { toResult } = require('./errors')

const now = () => new Date('2026-09-23T01:00:00Z')

function seed () {
  return createMemoryRepo({
    subjects: [{ _id: 'phychem', name: '物理化学', enabled: true }],
    knowledge_l1: [
      { _id: 'l1_phychem_1', subjectId: 'phychem', order: 1, name: '气体的pVT关系', enabled: true },
      { _id: 'l1_phychem_5', subjectId: 'phychem', order: 5, name: '相平衡', enabled: true },
      { _id: 'l1_phychem_9', subjectId: 'phychem', order: 9, name: '停用章', enabled: false },
    ],
    knowledge_points: [
      { _id: 'kp1', subjectId: 'phychem', name: '理想气体状态方程', l1Id: 'l1_phychem_1', enabled: true, publishedCount: 1 },
      { _id: 'kp5', subjectId: 'phychem', name: '相律', l1Id: 'l1_phychem_5', enabled: true, publishedCount: 1 },
    ],
    questions: [
      {
        _id: 'q1',
        subjectId: 'phychem',
        status: 'published',
        reviewStatus: 'approved',
        l1Id: 'l1_phychem_1',
        l1Order: 1,
        legacyMapStatus: 'ok',
        knowledgePointIds: ['kp1'],
        stemMd: '第 1 章题',
        type: '选择题',
      },
      {
        _id: 'q5',
        subjectId: 'phychem',
        status: 'published',
        reviewStatus: 'approved',
        l1Id: 'l1_phychem_5',
        l1Order: 5,
        legacyMapStatus: 'ok',
        knowledgePointIds: ['kp5'],
        stemMd: '第 5 章题',
        type: '选择题',
      },
    ],
    users: [{
      _id: 'stu1',
      subjectIds: ['phychem'],
      deepestL1IdBySubject: {},
      deepestL1OrderBySubject: {},
    }],
  })
}

async function call (repo, event) {
  try {
    const data = await handle({ repo, openid: 'stu1', now }, event)
    return { ok: true, data }
  } catch (err) {
    return toResult(err)
  }
}

test('bootstrap 只给启用章，并带上两份 deepest 映射', async () => {
  const repo = seed()
  const res = await call(repo, { action: 'bootstrap' })
  assert.equal(res.ok, true)
  assert.deepEqual(res.data.l1BySubject.phychem, [
    { id: 'l1_phychem_1', order: 1, name: '气体的pVT关系' },
    { id: 'l1_phychem_5', order: 5, name: '相平衡' },
  ])
  res.data.l1BySubject.phychem.forEach((item) => {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'name', 'order'])
  })
  assert.deepEqual(res.data.deepestL1OrderBySubject, {})
  assert.deepEqual(res.data.deepestL1IdBySubject, {})
})

test('setDeepestL1 同时写入 id 和 order', async () => {
  const repo = seed()
  const missing = await call(repo, { action: 'setDeepestL1', subjectId: 'phychem', order: 1 })
  assert.equal(missing.ok, false)
  assert.equal(missing.error.code, 'L1_INPUT')

  const saved = await call(repo, {
    action: 'setDeepestL1',
    subjectId: 'phychem',
    order: 1,
    l1Id: 'l1_phychem_1',
  })
  assert.equal(saved.ok, true)
  assert.equal(saved.data.l1Id, 'l1_phychem_1')
  assert.equal(saved.data.order, 1)
  assert.deepEqual(saved.data.deepestL1IdBySubject, { phychem: 'l1_phychem_1' })
  assert.deepEqual(saved.data.deepestL1OrderBySubject, { phychem: 1 })

  const user = await repo.get('users', 'stu1')
  assert.equal(user.deepestL1IdBySubject.phychem, 'l1_phychem_1')
  assert.equal(user.deepestL1OrderBySubject.phychem, 1)

  const wrongSubject = await call(repo, {
    action: 'setDeepestL1',
    subjectId: 'mse',
    order: 1,
    l1Id: 'l1_phychem_1',
  })
  assert.equal(wrongSubject.error.code, 'L1_SUBJECT_MISMATCH')

  const disabled = await call(repo, {
    action: 'setDeepestL1',
    subjectId: 'phychem',
    order: 9,
    l1Id: 'l1_phychem_9',
  })
  assert.equal(disabled.error.code, 'L1_DISABLED')
  const still = await repo.get('users', 'stu1')
  assert.equal(still.deepestL1IdBySubject.phychem, 'l1_phychem_1')
})

test('未设航程时每日一题返回 DEEPEST_REQUIRED，且文案含航程', async () => {
  const repo = seed()
  const res = await call(repo, { action: 'dailyGet' })
  assert.equal(res.ok, false)
  assert.equal(res.error.code, 'DEEPEST_REQUIRED')
  assert.match(res.error.message, /航程/)
  assert.deepEqual(res.error.subjectIds, ['phychem'])
  const entered = await call(repo, { action: 'dailyEnter' })
  assert.equal(entered.error.code, 'DEEPEST_REQUIRED')
  assert.equal(repo.dump('gen_tasks').length, 0)
  assert.equal(repo.dump('daily_locks').length, 0)
})

test('每日一题只抽 l1Order≤N，池空不放宽', async () => {
  const repo = seed()
  await call(repo, { action: 'setDeepestL1', subjectId: 'phychem', order: 1, l1Id: 'l1_phychem_1' })
  const entered = await call(repo, { action: 'dailyEnter', rng: () => 0 })
  assert.equal(entered.ok, true)
  assert.equal(entered.data.question.id, 'q1')
  assert.equal(entered.data.question.l1Order, 1)
  assert.equal(entered.data.scope.order, 1)
  assert.equal(entered.data.scope.text, '出题范围：第 1～1 章 · 气体的pVT关系')

  const again = await call(repo, { action: 'dailyGet' })
  assert.equal(again.data.question.id, 'q1')
  assert.equal(again.data.redrawn, false)

  const onlyFar = createMemoryRepo({
    subjects: [{ _id: 'phychem', name: '物理化学', enabled: true }],
    knowledge_l1: [
      { _id: 'l1_phychem_1', subjectId: 'phychem', order: 1, name: '气体的pVT关系', enabled: true },
    ],
    questions: [
      {
        _id: 'q5',
        subjectId: 'phychem',
        status: 'published',
        l1Id: 'l1_phychem_5',
        l1Order: 5,
        legacyMapStatus: 'ok',
        knowledgePointIds: ['kp5'],
        stemMd: '超纲',
      },
    ],
    users: [{
      _id: 'stu1',
      subjectIds: ['phychem'],
      deepestL1IdBySubject: { phychem: 'l1_phychem_1' },
      deepestL1OrderBySubject: { phychem: 1 },
    }],
  })
  const empty = await call(onlyFar, { action: 'dailyEnter', rng: () => 0 })
  assert.equal(empty.ok, false)
  assert.equal(empty.error.code, 'POOL_EMPTY')
  assert.equal(empty.error.message.includes('航程'), false)
  assert.equal(onlyFar.dump('gen_tasks').length, 0)
  assert.equal(onlyFar.dump('daily_locks').length, 0)
})

test('耗尽退化仍不越过 N', async () => {
  const repo = seed()
  await repo.insert('attempts', { userId: 'stu1', questionId: 'q1' })
  await repo.update('users', 'stu1', {
    deepestL1IdBySubject: { phychem: 'l1_phychem_1' },
    deepestL1OrderBySubject: { phychem: 1 },
  })
  const entered = await call(repo, { action: 'dailyEnter', rng: () => 0 })
  assert.equal(entered.ok, true)
  assert.equal(entered.data.degraded, true)
  assert.equal(entered.data.question.id, 'q1')
})

test('专项和错题不按 deepest 截断', async () => {
  const repo = seed()
  await repo.update('users', 'stu1', {
    deepestL1IdBySubject: { phychem: 'l1_phychem_1' },
    deepestL1OrderBySubject: { phychem: 1 },
  })
  await repo.insert('wrong_items', {
    _id: 'w5',
    userId: 'stu1',
    questionId: 'q5',
    subjectId: 'phychem',
    knowledgePointIds: ['kp5'],
    mastered: false,
  })
  const practice = await call(repo, { action: 'practiceStart', knowledgePointIds: ['kp5'] })
  assert.deepEqual(practice.data.questionIds, ['q5'])
  assert.equal(practice.data.deepestApplied, false)
  const wrongs = await call(repo, { action: 'wrongList' })
  assert.deepEqual(wrongs.data.items.map((item) => item.questionId), ['q5'])
  assert.equal(wrongs.data.deepestApplied, false)
})

test('学生练习路径源码不触发生题', () => {
  const root = path.join(__dirname, '..')
  const files = [
    'student/index.js',
    'student/featureActions.js',
    'student/identity.js',
    'shared/student-flow.js',
    'shared/pools.js',
  ]
  files.forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    assert.equal(text.includes('/v1/generate'), false, file)
    assert.equal(text.includes('gen_tasks'), false, file)
    assert.equal(text.includes('generateQuestion'), false, file)
  })
})
