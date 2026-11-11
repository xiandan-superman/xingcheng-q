const { coded } = require('./errors')
const { dailyPool, matchesL2 } = require('./pools')

// 学生端航程。抽题比较以章 id 对应的当前 order 为准，不信任客户端传来的旧序号。
function l1Card (l1) {
  return { id: l1._id, order: l1.order, name: l1.name }
}

function formatDate (date) {
  const shifted = new Date(date.getTime() + 8 * 3600 * 1000)
  return shifted.toISOString().slice(0, 10)
}

function publicQuestion (question) {
  return {
    id: question._id,
    subjectId: question.subjectId,
    type: question.type || '',
    stemMd: question.stemMd || '',
    parts: (question.parts || []).map((part) => ({
      id: part.id,
      title: part.title,
      prompt: part.prompt,
    })),
    l1Id: question.l1Id || null,
    l1Order: question.l1Order,
    knowledgePointIds: question.knowledgePointIds || [],
  }
}

async function healDeepest (repo, user, now) {
  const ids = Object.assign({}, user.deepestL1IdBySubject || {})
  const orders = Object.assign({}, user.deepestL1OrderBySubject || {})
  const stale = Object.assign({}, user.deepestStaleBySubject || {})
  let changed = false
  for (const subjectId of Object.keys(ids)) {
    const l1 = await repo.get('knowledge_l1', ids[subjectId])
    if (!l1 || l1.subjectId !== subjectId || l1.enabled === false) {
      if (Object.prototype.hasOwnProperty.call(orders, subjectId) || stale[subjectId] !== true) changed = true
      delete orders[subjectId]
      stale[subjectId] = true
      continue
    }
    if (orders[subjectId] !== l1.order || stale[subjectId]) changed = true
    orders[subjectId] = l1.order
    stale[subjectId] = false
  }
  if (!changed) {
    return Object.assign({}, user, {
      deepestL1IdBySubject: ids,
      deepestL1OrderBySubject: orders,
      deepestStaleBySubject: stale,
    })
  }
  return repo.update('users', user._id, {
    deepestL1OrderBySubject: orders,
    deepestStaleBySubject: stale,
    updatedAt: now(),
  })
}

// 各科只返回 enabled 的章。停用章不出现在选择器里。
async function bootstrap (repo, user, now) {
  const healed = await healDeepest(repo, user, now)
  const subjects = await repo.find('subjects', {})
  const visibleSubjects = subjects.filter((subject) => subject.enabled !== false)
  const l1BySubject = {}
  for (const subject of visibleSubjects) {
    const chapters = await repo.find('knowledge_l1', { subjectId: subject._id })
    l1BySubject[subject._id] = chapters
      .filter((chapter) => chapter.enabled !== false)
      .sort((a, b) => a.order - b.order)
      .map(l1Card)
  }
  return {
    subjectIds: healed.subjectIds || [],
    subjects: visibleSubjects.map((subject) => ({ id: subject._id, name: subject.name })),
    l1BySubject,
    deepestL1OrderBySubject: healed.deepestL1OrderBySubject || {},
    deepestL1IdBySubject: healed.deepestL1IdBySubject || {},
    deepestStaleBySubject: healed.deepestStaleBySubject || {},
  }
}

async function setDeepestL1 (repo, user, event, now) {
  const subjectId = event.subjectId
  const l1Id = event.l1Id
  if (!subjectId || event.order == null || event.order === '' || !l1Id) {
    throw coded('L1_INPUT', '请提供学科、章序号和章 id')
  }
  const order = Number(event.order)
  if (!Number.isInteger(order) || order < 1) throw coded('L1_ORDER_INVALID', '章序号必须是正整数')
  const l1 = await repo.get('knowledge_l1', l1Id)
  if (!l1) throw coded('L1_NOT_FOUND', '找不到该章')
  if (l1.subjectId !== subjectId) throw coded('L1_SUBJECT_MISMATCH', '该章不属于所选学科')
  if (l1.enabled === false) throw coded('L1_DISABLED', '该章已停用')
  if (l1.order !== order) throw coded('L1_ORDER_MISMATCH', '章序号与章不一致')
  const deepestL1IdBySubject = Object.assign({}, user.deepestL1IdBySubject || {}, { [subjectId]: l1._id })
  const deepestL1OrderBySubject = Object.assign({}, user.deepestL1OrderBySubject || {}, { [subjectId]: l1.order })
  const deepestStaleBySubject = Object.assign({}, user.deepestStaleBySubject || {}, { [subjectId]: false })
  await repo.update('users', user._id, {
    deepestL1IdBySubject,
    deepestL1OrderBySubject,
    deepestStaleBySubject,
    updatedAt: now(),
  })
  return {
    subjectId,
    l1Id: l1._id,
    order: l1.order,
    name: l1.name,
    deepestL1IdBySubject,
    deepestL1OrderBySubject,
  }
}

async function rangesFor (repo, user) {
  const subjectIds = user.subjectIds || []
  if (!subjectIds.length) throw coded('SUBJECT_REQUIRED', '请先选择学科')
  const required = []
  const stale = []
  const ranges = []
  for (const subjectId of subjectIds) {
    const l1Id = user.deepestL1IdBySubject && user.deepestL1IdBySubject[subjectId]
    if (!l1Id) {
      required.push(subjectId)
      continue
    }
    const l1 = await repo.get('knowledge_l1', l1Id)
    if (!l1 || l1.subjectId !== subjectId || l1.enabled === false) {
      stale.push(subjectId)
      continue
    }
    ranges.push({ subjectId, maxOrder: l1.order, l1 })
  }
  if (required.length) {
    throw coded('DEEPEST_REQUIRED', '先定学习航程，再开始今日跃迁', { subjectIds: required })
  }
  if (stale.length) {
    throw coded('DEEPEST_STALE', '原航段已更新，请重新选择航程', { subjectIds: stale })
  }
  return ranges
}

async function exclusionIds (repo, userId) {
  const attempts = await repo.find('attempts', { userId })
  const wrongs = await repo.find('wrong_items', { userId })
  const ids = new Set(attempts.map((row) => row.questionId))
  wrongs.forEach((row) => {
    if (row.mastered !== true) ids.add(row.questionId)
  })
  return ids
}

async function collectPool (repo, ranges, excluded) {
  const pool = []
  for (const range of ranges) {
    const questions = await repo.find('questions', {
      subjectId: range.subjectId,
      status: 'published',
      l1Order: { $lte: range.maxOrder },
    })
    dailyPool(questions, range.maxOrder, excluded).forEach((question) => {
      if (!pool.some((item) => item._id === question._id)) pool.push(question)
    })
  }
  return pool
}

function scopeFor (ranges, question) {
  const range = ranges.find((item) => item.subjectId === question.subjectId)
  const order = range ? range.maxOrder : question.l1Order
  const name = range ? range.l1.name : ''
  return {
    subjectId: question.subjectId,
    order,
    l1Id: range ? range.l1._id : question.l1Id,
    name,
    text: `出题范围：第 1～${order} 章 · ${name}`,
  }
}

async function lockedPayload (repo, lock, ranges) {
  const question = await repo.get('questions', lock.questionId)
  return {
    locked: true,
    redrawn: false,
    dailyDate: lock.dailyDate,
    question: question ? publicQuestion(question) : null,
    scope: lock.scope || (question ? scopeFor(ranges, question) : null),
  }
}

async function openDaily (repo, user, event, now, lockNow) {
  const dailyDate = event.dailyDate || formatDate(now())
  const existing = (await repo.find('daily_locks', { userId: user._id, dailyDate }))[0]
  if (existing) {
    const ranges = await rangesFor(repo, user).catch(() => [])
    return lockedPayload(repo, existing, Array.isArray(ranges) ? ranges : [])
  }
  const ranges = await rangesFor(repo, user)
  const excluded = await exclusionIds(repo, user._id)
  let pool = await collectPool(repo, ranges, excluded)
  let degraded = false
  if (!pool.length && excluded.size) {
    pool = await collectPool(repo, ranges, new Set())
    degraded = pool.length > 0
  }
  if (!pool.length) throw coded('POOL_EMPTY', '题量不足')
  if (!lockNow) {
    return {
      locked: false,
      dailyDate,
      poolEmpty: false,
      scope: ranges.map((range) => ({
        subjectId: range.subjectId,
        order: range.maxOrder,
        l1Id: range.l1._id,
        name: range.l1.name,
        text: `出题范围：第 1～${range.maxOrder} 章 · ${range.l1.name}`,
      })),
    }
  }
  const rng = event.rng || Math.random
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  const question = pool[index]
  const scope = scopeFor(ranges, question)
  await repo.insert('daily_locks', {
    userId: user._id,
    dailyDate,
    questionId: question._id,
    scope,
    createdAt: now(),
  })
  return {
    locked: true,
    redrawn: true,
    degraded,
    dailyDate,
    question: publicQuestion(question),
    scope,
  }
}

function dailyGet (repo, user, event, now) {
  return openDaily(repo, user, event, now, false)
}

function dailyEnter (repo, user, event, now) {
  return openDaily(repo, user, event, now, true)
}

async function dailySubmit (repo, user, event, now) {
  const dailyDate = event.dailyDate || formatDate(now())
  const lock = (await repo.find('daily_locks', { userId: user._id, dailyDate }))[0]
  if (!lock || lock.questionId !== event.questionId) throw coded('DAILY_LOCK_MISMATCH', '没有这道今日题')
  const question = await repo.get('questions', event.questionId)
  await repo.insert('attempts', {
    userId: user._id,
    questionId: event.questionId,
    subjectId: question && question.subjectId,
    l1Id: question && question.l1Id,
    l1Order: question && question.l1Order,
    correct: event.correct === true,
    source: 'daily',
    dailyDate,
    createdAt: now(),
  })
  if (event.correct !== true && question) {
    await repo.insert('wrong_items', {
      userId: user._id,
      questionId: question._id,
      subjectId: question.subjectId,
      knowledgePointIds: question.knowledgePointIds || [],
      mastered: false,
      createdAt: now(),
    })
  }
  return { submitted: true, dailyDate }
}

async function practiceStart (repo, user, event) {
  const ids = event.knowledgePointIds || []
  if (!ids.length) throw coded('L2_REQUIRED', '请选择知识点')
  if (ids.length > 3) throw coded('L2_LIMIT', '最多选择 3 个知识点')
  const subjectIds = user.subjectIds || []
  const pool = []
  for (const subjectId of subjectIds) {
    const questions = await repo.find('questions', {
      subjectId,
      status: 'published',
      knowledgePointIds: { $in: ids },
    })
    questions.forEach((question) => {
      if (!matchesL2(question, ids)) return
      if (!pool.some((item) => item._id === question._id)) pool.push(question)
    })
  }
  return {
    questionIds: pool.map((question) => question._id),
    total: pool.length,
    filteredBy: 'l2',
    deepestApplied: false,
  }
}

async function practiceRecommend (repo, user) {
  const items = []
  for (const subjectId of user.subjectIds || []) {
    const points = await repo.find('knowledge_points', { subjectId, enabled: true })
    points.forEach((point) => {
      if (!point.l1Id) return
      items.push({
        id: point._id,
        name: point.name,
        subjectId: point.subjectId,
        l1Id: point.l1Id,
      })
    })
  }
  return { items, filteredBy: 'l2', deepestApplied: false }
}

async function wrongList (repo, user, event) {
  const rows = await repo.find('wrong_items', { userId: user._id })
  const items = []
  for (const row of rows) {
    if (event.knowledgePointId && !(row.knowledgePointIds || []).includes(event.knowledgePointId)) continue
    const question = await repo.get('questions', row.questionId)
    if (!question || !matchesL2(question, question.knowledgePointIds || [])) continue
    if (event.knowledgePointId && !(question.knowledgePointIds || []).includes(event.knowledgePointId)) continue
    items.push({
      id: row._id,
      questionId: row.questionId,
      subjectId: row.subjectId,
      knowledgePointIds: question.knowledgePointIds || [],
      l1Order: question.l1Order,
      mastered: row.mastered === true,
    })
  }
  return { items, filteredBy: 'l2', deepestApplied: false }
}

async function wrongEnter (repo, user, event) {
  const rows = await repo.find('wrong_items', { userId: user._id, questionId: event.questionId })
  if (!rows.length) throw coded('WRONG_NOT_FOUND', '错题不存在')
  const question = await repo.get('questions', event.questionId)
  if (!question || question.status !== 'published' || question.legacyMapStatus === 'failed') {
    throw coded('QUESTION_HIDDEN', '题目当前不可见')
  }
  return { question: publicQuestion(question), deepestApplied: false }
}

module.exports = {
  bootstrap,
  setDeepestL1,
  dailyGet,
  dailyEnter,
  dailySubmit,
  practiceStart,
  practiceRecommend,
  wrongList,
  wrongEnter,
  formatDate,
}
