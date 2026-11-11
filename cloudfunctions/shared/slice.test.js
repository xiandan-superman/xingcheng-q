const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createMemoryRepo } = require('./memory-repo')
const { handle: adminHandle } = require('../admin/index')
const { handle: callbackHandle } = require('../http_callback/index')
const { toResult } = require('./errors')
const { COLLECTIONS } = require('./collections')

const now = () => new Date('2026-09-23T01:00:00Z')
process.env.IMPORT_CALLBACK_TOKEN = 'test-token'

function repo () {
  return createMemoryRepo({
    subjects: [{ _id: 'phychem', name: '物理化学', enabled: true }],
    admins: [{ _id: 'admin1', openid: 'op-admin' }],
    knowledge_l1: [
      { _id: 'l1', subjectId: 'phychem', order: 1, name: '气体的pVT关系', enabled: true },
      { _id: 'l5', subjectId: 'phychem', order: 5, name: '相平衡', enabled: true },
    ],
    knowledge_points: [
      { _id: 'kp1', subjectId: 'phychem', name: '理想气体状态方程', l1Id: 'l1', enabled: true, publishedCount: 1 },
      { _id: 'kp5', subjectId: 'phychem', name: '相律', l1Id: 'l5', enabled: true, publishedCount: 0 },
      { _id: 'kpLoose', subjectId: 'phychem', name: '未挂章', enabled: true, publishedCount: 1 },
    ],
    users: [{
      _id: 'stu1',
      subjectIds: ['phychem'],
      deepestL1IdBySubject: { phychem: 'l5' },
      deepestL1OrderBySubject: { phychem: 5 },
    }],
    questions: [{
      _id: 'old-ok',
      subjectId: 'phychem',
      status: 'published',
      reviewStatus: 'approved',
      knowledgePointIds: ['kp1', 'kp5'],
      publishedCountIgnored: true,
    }, {
      _id: 'old-bad',
      subjectId: 'phychem',
      status: 'published',
      reviewStatus: 'approved',
      knowledgePointIds: ['kpLoose'],
    }],
  })
}

async function admin (store, event) {
  try {
    const data = await adminHandle({ repo: store, openid: 'op-admin', now }, event)
    return { ok: true, data }
  } catch (err) {
    return toResult(err)
  }
}

test('学生身份不能走管理动作', async () => {
  const store = repo()
  const res = await adminHandle({ repo: store, openid: 'stu1', now }, { action: 'l1List', subjectId: 'phychem' })
    .then((data) => ({ ok: true, data }))
    .catch(toResult)
  assert.equal(res.error.code, 'NOT_ADMIN')
})

test('L2 学科内唯一，不能跨学科，审核改 L2 后按最大序号重算', async () => {
  const store = repo()
  const dup = await admin(store, {
    action: 'l2Upsert',
    subjectId: 'phychem',
    name: '相律',
    l1Id: 'l1',
  })
  assert.equal(dup.error.code, 'L2_NAME_TAKEN')

  const created = await admin(store, {
    action: 'importCreate',
    subjectId: 'phychem',
    fileID: 'cloud://cloud1/bank/基础.docx',
  })
  assert.equal(created.data.status, 'uploaded')
  const pdf = await admin(store, {
    action: 'importCreate',
    subjectId: 'phychem',
    fileID: 'cloud://cloud1/bank/scan.pdf',
  })
  assert.equal(pdf.error.code, 'UNSUPPORTED_FILE')

  process.env.IMPORT_CALLBACK_TOKEN = 'test-token'
  const parsed = await callbackHandle({ repo: store, now }, {
    token: 'test-token',
    action: 'mineruCallback',
    importJobId: created.data.importJobId,
    items: [{
      type: '综合题',
      stemMd: '大题',
      answer: '答',
      analysis: '析',
      parts: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      warnings: ['formula_loss'],
    }],
  })
  assert.equal(parsed.total, 1)
  assert.equal(store.dump('questions').filter((q) => q.importJobId === created.data.importJobId).length, 1)
  const questionId = parsed.questionIds[0]
  const drafted = await store.get('questions', questionId)
  assert.equal(drafted.parts.length, 3)
  assert.equal(drafted.reviewStatus, 'pending_review')
  assert.ok(drafted.qualityFlags.includes('formula_loss'))
  assert.equal(store.dump('knowledge_candidates').length, 0)

  const tagged = await callbackHandle({ repo: store, now }, {
    token: 'test-token',
    action: 'jevCallback',
    importJobId: created.data.importJobId,
    tags: [{ questionId, l2Ids: ['kp5', 'made-up'] }],
  })
  assert.equal(tagged.tagged, 1)
  assert.deepEqual((await store.get('questions', questionId)).knowledgePointIds, ['kp5'])
  assert.equal(store.dump('knowledge_candidates').length, 0)

  const setL2 = await admin(store, {
    action: 'reviewSetL2',
    questionId,
    knowledgePointIds: ['kp1', 'kp5'],
  })
  assert.equal(setL2.data.l1Id, 'l5')
  assert.equal(setL2.data.l1Order, 5)
  assert.equal(setL2.data.resolveError, null)

  const approved = await admin(store, { action: 'reviewApprove', questionId })
  assert.equal(approved.data.question.reviewStatus, 'approved')
  assert.equal(approved.data.question.status, 'pending')
  const blocked = await admin(store, { action: 'questionPublish', questionId })
  assert.equal(blocked.error.code, 'PUBLISH_BLOCKED')
  assert.ok(blocked.error.reasons.includes('QUALITY_RED'))

  await store.update('questions', questionId, { qualityFlags: [] })
  const published = await admin(store, { action: 'questionPublish', questionId })
  assert.equal(published.data.question.status, 'published')
  assert.equal((await store.get('knowledge_points', 'kp1')).publishedCount, 2)
  assert.equal((await store.get('knowledge_points', 'kp5')).publishedCount, 1)
  assert.equal(store.dump('gen_tasks').length, 0)

  const moved = await admin(store, { action: 'l2Move', l2Id: 'kp1', l1Id: 'l5' })
  assert.equal(moved.ok, true)
  assert.equal((await store.get('questions', questionId)).l1Id, 'l5')

  await store.insert('subjects', { _id: 'mse', name: '材料科学基础', enabled: true })
  await store.insert('knowledge_l1', {
    _id: 'l1-mse',
    subjectId: 'mse',
    order: 1,
    name: '材料章',
    enabled: true,
  })
  const crossed = await admin(store, { action: 'l2Move', l2Id: 'kp5', l1Id: 'l1-mse' })
  assert.equal(crossed.error.code, 'CROSS_SUBJECT')
})

test('调序后刷新题上 l1Order 和用户 order，停用章则航程失效', async () => {
  const store = repo()
  await store.update('questions', 'old-ok', { l1Id: 'l5', l1Order: 5, legacyMapStatus: 'ok' })
  const reordered = await admin(store, {
    action: 'l1Reorder',
    subjectId: 'phychem',
    items: [
      { id: 'l1', order: 2 },
      { id: 'l5', order: 8 },
    ],
  })
  assert.equal(reordered.data.job.status, 'done')
  assert.equal((await store.get('questions', 'old-ok')).l1Order, 8)
  assert.equal((await store.get('users', 'stu1')).deepestL1OrderBySubject.phychem, 8)
  assert.equal((await store.get('users', 'stu1')).deepestL1IdBySubject.phychem, 'l5')

  const disabled = await admin(store, {
    action: 'l1Upsert',
    id: 'l5',
    subjectId: 'phychem',
    name: '相平衡',
    order: 8,
    enabled: false,
  })
  assert.equal(disabled.ok, true)
  const user = await store.get('users', 'stu1')
  assert.equal(user.deepestStaleBySubject.phychem, true)
  assert.equal(user.deepestL1OrderBySubject.phychem, undefined)
  assert.equal(user.deepestL1IdBySubject.phychem, 'l5')
})

test('旧 published 映射失败则下架并写入报告，修好后不自动再发布', async () => {
  const store = repo()
  const report = await admin(store, {
    action: 'legacyMapRun',
    subjectId: 'phychem',
    rows: [
      { order: 1, chapter: '气体的pVT关系', l2Name: '理想气体状态方程' },
      { order: 5, chapter: '相平衡', l2Name: '没有的知识点' },
    ],
  })
  assert.equal(report.ok, true)
  const okRow = report.data.ok.find((row) => row.questionId === 'old-ok')
  const badRow = report.data.failed.find((row) => row.questionId === 'old-bad')
  assert.equal(okRow.l1Order, 5)
  assert.equal((await store.get('questions', 'old-ok')).status, 'published')
  assert.equal((await store.get('questions', 'old-bad')).status, 'offline')
  assert.equal((await store.get('questions', 'old-bad')).legacyMapStatus, 'failed')
  assert.deepEqual(badRow.errors, ['L2_WITHOUT_L1'])
  assert.ok(report.data.unmatchedL2Names.includes('没有的知识点'))
  assert.equal((await store.get('knowledge_points', 'kp1')).publishedCount, 1)
  assert.equal((await store.get('knowledge_points', 'kpLoose')).publishedCount, 0)

  await store.update('knowledge_points', 'kpLoose', { l1Id: 'l1' })
  const again = await admin(store, { action: 'legacyMapRun', subjectId: 'phychem' })
  const fixed = again.data.ok.find((row) => row.questionId === 'old-bad')
  assert.equal(fixed.status, 'offline')
  assert.equal((await store.get('questions', 'old-bad')).legacyMapStatus, 'ok')
  const loaded = await admin(store, { action: 'legacyMapReport', reportId: report.data._id })
  assert.equal(loaded.data._id, report.data._id)
})

test('setup 集合名覆盖实际读写', () => {
  const root = path.join(__dirname)
  const used = new Set()
  fs.readdirSync(root).filter((name) => name.endsWith('.js') && !name.endsWith('.test.js')).forEach((name) => {
    const text = fs.readFileSync(path.join(root, name), 'utf8')
    const matched = text.matchAll(/repo\.(?:get|find|insert|update)\('([a-z0-9_]+)'/g)
    for (const item of matched) used.add(item[1])
  })
  used.forEach((name) => assert.ok(COLLECTIONS.includes(name), name))
  assert.equal(used.has('knowledge_candidates'), false)
  assert.equal(used.has('gen_tasks'), false)
  const importText = fs.readFileSync(path.join(root, 'import-flow.js'), 'utf8')
  assert.equal(importText.includes('knowledge_candidates'), false)
  assert.equal(importText.includes('/v1/generate'), false)
})
