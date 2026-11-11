const { coded } = require('./errors')
const { nid } = require('./ids')
const { normName } = require('./names')
const { loadL2Bundle } = require('./l2-bundle')
const { resolveForSubject } = require('./l1-resolve')

async function l1List (repo, event) {
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const items = await repo.find('knowledge_l1', { subjectId: event.subjectId })
  items.sort((a, b) => a.order - b.order)
  return { items }
}

async function l2List (repo, event) {
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const query = { subjectId: event.subjectId }
  if (event.l1Id) query.l1Id = event.l1Id
  const items = await repo.find('knowledge_points', query)
  items.sort((a, b) => normName(a.name).localeCompare(normName(b.name), 'zh'))
  return { items }
}

async function runRecalc (repo, subjectId, now) {
  const chapters = await repo.find('knowledge_l1', { subjectId })
  const byId = new Map(chapters.map((chapter) => [chapter._id, chapter]))
  const questions = await repo.find('questions', { subjectId })
  let processedQuestions = 0
  for (const question of questions) {
    if (!question.l1Id) continue
    const chapter = byId.get(question.l1Id)
    if (!chapter || question.l1Order === chapter.order) continue
    await repo.update('questions', question._id, { l1Order: chapter.order, updatedAt: now() })
    processedQuestions += 1
  }
  const users = await repo.find('users', {})
  let processedUsers = 0
  for (const user of users) {
    const l1Id = user.deepestL1IdBySubject && user.deepestL1IdBySubject[subjectId]
    if (!l1Id) continue
    processedUsers += 1
    const chapter = byId.get(l1Id)
    const ids = Object.assign({}, user.deepestL1IdBySubject)
    const orders = Object.assign({}, user.deepestL1OrderBySubject || {})
    const stale = Object.assign({}, user.deepestStaleBySubject || {})
    if (!chapter || chapter.subjectId !== subjectId || chapter.enabled === false) {
      delete orders[subjectId]
      stale[subjectId] = true
    } else {
      orders[subjectId] = chapter.order
      stale[subjectId] = false
    }
    await repo.update('users', user._id, {
      deepestL1IdBySubject: ids,
      deepestL1OrderBySubject: orders,
      deepestStaleBySubject: stale,
      updatedAt: now(),
    })
  }
  return repo.insert('l1_recalc_jobs', {
    _id: nid('recalc'),
    subjectId,
    status: 'done',
    processedQuestions,
    processedUsers,
    createdAt: now(),
    updatedAt: now(),
  })
}

async function l1Upsert (repo, event, now) {
  const subjectId = event.subjectId
  const name = String(event.name || '').trim()
  const order = Number(event.order)
  if (!subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  if (!name) throw coded('L1_NAME_REQUIRED', '请填写章名')
  if (!Number.isInteger(order) || order < 1) throw coded('L1_ORDER_INVALID', '序号必须是正整数')
  const subject = await repo.get('subjects', subjectId)
  if (!subject) throw coded('UNKNOWN_SUBJECT', '学科不存在')
  const all = await repo.find('knowledge_l1', { subjectId })
  const currentId = event._id || event.id || null
  if (all.some((row) => row.order === order && row._id !== currentId)) {
    throw coded('L1_ORDER_TAKEN', '序号已被占用')
  }
  if (all.some((row) => normName(row.name) === normName(name) && row._id !== currentId)) {
    throw coded('L1_NAME_TAKEN', '章名重复')
  }
  const enabled = event.enabled !== false
  if (currentId) {
    const existing = await repo.get('knowledge_l1', currentId)
    if (!existing || existing.subjectId !== subjectId) throw coded('L1_NOT_FOUND', '找不到该章')
    const l1 = await repo.update('knowledge_l1', currentId, { name, order, enabled, updatedAt: now() })
    const wasEnabled = existing.enabled !== false
    const job = existing.order !== order || wasEnabled !== enabled
      ? await runRecalc(repo, subjectId, now)
      : null
    return { l1, job }
  }
  const l1 = await repo.insert('knowledge_l1', {
    _id: nid('l1'),
    subjectId,
    name,
    order,
    enabled,
    createdAt: now(),
    updatedAt: now(),
  })
  return { l1, job: null }
}

async function l1Reorder (repo, event, now) {
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const items = event.items || []
  const all = await repo.find('knowledge_l1', { subjectId: event.subjectId })
  if (items.length !== all.length) throw coded('L1_REORDER_INCOMPLETE', '需要提交该学科全部一级')
  const known = new Set(all.map((row) => row._id))
  const orders = new Set()
  items.forEach((item) => {
    if (!known.has(item._id || item.id)) throw coded('L1_NOT_FOUND', '重排包含未知的章')
    const order = Number(item.order)
    if (!Number.isInteger(order) || order < 1) throw coded('L1_ORDER_INVALID', '序号必须是正整数')
    if (orders.has(order)) throw coded('L1_ORDER_TAKEN', '序号重复')
    orders.add(order)
  })
  for (const item of items) {
    await repo.update('knowledge_l1', item._id || item.id, { order: Number(item.order), updatedAt: now() })
  }
  const job = await runRecalc(repo, event.subjectId, now)
  return { subjectId: event.subjectId, job }
}

async function assertL1ForL2 (repo, subjectId, l1Id) {
  if (!l1Id) throw coded('L2_L1_REQUIRED', '启用的二级知识点必须选择一级')
  const l1 = await repo.get('knowledge_l1', l1Id)
  if (!l1) throw coded('L1_NOT_FOUND', '找不到该章')
  if (l1.subjectId !== subjectId) throw coded('CROSS_SUBJECT', '二级不能跨学科')
  if (l1.enabled === false) throw coded('L1_DISABLED', '停用的章不能挂新的二级')
  return l1
}

async function l2Upsert (repo, event, now) {
  const subjectId = event.subjectId
  const name = String(event.name || '').trim()
  if (!subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  if (!name) throw coded('L2_NAME_REQUIRED', '请填写知识点名称')
  const subject = await repo.get('subjects', subjectId)
  if (!subject) throw coded('UNKNOWN_SUBJECT', '学科不存在')
  const enabled = event.enabled !== false
  const currentId = event._id || event.id || null
  const points = await repo.find('knowledge_points', { subjectId })
  if (points.some((point) => normName(point.name) === normName(name) && point._id !== currentId)) {
    throw coded('L2_NAME_TAKEN', '本学科已有同名知识点')
  }
  if (enabled) await assertL1ForL2(repo, subjectId, event.l1Id)
  else if (event.l1Id) await assertL1ForL2(repo, subjectId, event.l1Id).catch((err) => {
    if (err.code !== 'L1_DISABLED') throw err
  })
  if (currentId) {
    const existing = await repo.get('knowledge_points', currentId)
    if (!existing || existing.subjectId !== subjectId) throw coded('L2_NOT_FOUND', '找不到该知识点')
    const point = await repo.update('knowledge_points', currentId, {
      name,
      l1Id: event.l1Id || existing.l1Id || null,
      enabled,
      description: event.description != null ? event.description : existing.description || '',
      updatedAt: now(),
    })
    return { point }
  }
  const point = await repo.insert('knowledge_points', {
    _id: nid('kp'),
    subjectId,
    name,
    l1Id: event.l1Id || null,
    enabled,
    description: event.description || '',
    publishedCount: 0,
    legacyMapped: event.legacyMapped === true,
    createdAt: now(),
    updatedAt: now(),
  })
  return { point }
}

async function recalcQuestionsForL2 (repo, subjectId, l2Id, now) {
  const questions = await repo.find('questions', {
    subjectId,
    knowledgePointIds: { $in: [l2Id] },
  })
  for (const question of questions) {
    if (question.reviewStatus === 'rejected') continue
    try {
      const bundle = await loadL2Bundle(repo, question.knowledgePointIds)
      const resolved = resolveForSubject(subjectId, bundle)
      await repo.update('questions', question._id, {
        l1Id: resolved.l1Id,
        l1Order: resolved.l1Order,
        updatedAt: now(),
      })
    } catch (err) {
      await repo.update('questions', question._id, {
        l1Id: null,
        l1Order: null,
        updatedAt: now(),
      })
    }
  }
}

async function l2Move (repo, event, now) {
  const point = await repo.get('knowledge_points', event.l2Id || event.id)
  if (!point) throw coded('L2_NOT_FOUND', '找不到该知识点')
  const l1 = await assertL1ForL2(repo, point.subjectId, event.l1Id)
  if (l1.subjectId !== point.subjectId) throw coded('CROSS_SUBJECT', '二级不能跨学科')
  const updated = await repo.update('knowledge_points', point._id, { l1Id: l1._id, updatedAt: now() })
  await recalcQuestionsForL2(repo, point.subjectId, point._id, now)
  return { point: updated }
}

module.exports = {
  l1List,
  l1Upsert,
  l1Reorder,
  l2List,
  l2Upsert,
  l2Move,
  runRecalc,
}
