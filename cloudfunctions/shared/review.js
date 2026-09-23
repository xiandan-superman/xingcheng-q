const { coded } = require('./errors')
const { loadL2Bundle } = require('./l2-bundle')
const { RED_FLAGS, publishBlockers, resolveForSubject } = require('./l1-resolve')

function dedupe (ids) {
  const out = []
  ;(ids || []).forEach((id) => {
    if (id && !out.includes(id)) out.push(id)
  })
  return out
}

async function mustQuestion (repo, questionId) {
  const question = await repo.get('questions', questionId)
  if (!question) throw coded('QUESTION_NOT_FOUND', '题目不存在')
  return question
}

async function shiftPublishedCount (repo, ids, delta, now) {
  for (const id of dedupe(ids)) {
    const point = await repo.get('knowledge_points', id)
    if (!point) continue
    const publishedCount = Math.max(0, (point.publishedCount || 0) + delta)
    await repo.update('knowledge_points', id, { publishedCount, updatedAt: now() })
  }
}

async function bumpJob (repo, importJobId, field, now) {
  if (!importJobId) return
  const job = await repo.get('import_jobs', importJobId)
  if (!job) return
  const stats = Object.assign({}, job.stats || {})
  stats[field] = (stats[field] || 0) + 1
  await repo.update('import_jobs', importJobId, { stats, updatedAt: now() })
}

function isRed (question) {
  return (question.qualityFlags || []).some((flag) => RED_FLAGS.includes(flag))
}

async function reviewQueue (repo, event) {
  const query = {}
  if (event.subjectId) query.subjectId = event.subjectId
  if (event.reviewStatus) query.reviewStatus = event.reviewStatus
  const rows = await repo.find('questions', query)
  const items = rows
    .filter((question) => (event.partialOnly ? isRed(question) : true))
    .map((question) => Object.assign({}, question, { red: isRed(question) }))
  return { items }
}

async function reviewGet (repo, event) {
  const question = await mustQuestion(repo, event.questionId)
  const bundle = await loadL2Bundle(repo, question.knowledgePointIds)
  return {
    question: Object.assign({}, question, { red: isRed(question) }),
    l2: bundle.filter(Boolean).map((point) => ({
      id: point._id,
      name: point.name,
      l1Id: point.l1Id,
      l1Order: point.l1 ? point.l1.order : null,
      l1Name: point.l1 ? point.l1.name : '',
    })),
  }
}

async function reviewSetL2 (repo, event, now) {
  const question = await mustQuestion(repo, event.questionId)
  if (question.status === 'published') throw coded('QUESTION_PUBLISHED', '已发布的题请先下架再改知识点')
  if (question.reviewStatus === 'rejected') throw coded('REVIEW_CLOSED', '已驳回的题不能直接改知识点')
  const knowledgePointIds = dedupe(event.knowledgePointIds)
  const bundle = await loadL2Bundle(repo, knowledgePointIds)
  let l1Id = null
  let l1Order = null
  let resolveError = null
  try {
    const resolved = resolveForSubject(question.subjectId, bundle)
    l1Id = resolved.l1Id
    l1Order = resolved.l1Order
  } catch (err) {
    resolveError = err.code || 'L1_INVALID'
  }
  const qualityFlags = (question.qualityFlags || []).filter((flag) => flag !== 'tag_empty')
  if (!knowledgePointIds.length) qualityFlags.push('tag_empty')
  const updated = await repo.update('questions', question._id, {
    knowledgePointIds,
    l1Id,
    l1Order,
    qualityFlags,
    updatedAt: now(),
  })
  return { question: updated, l1Id, l1Order, resolveError }
}

async function reviewApprove (repo, event, now) {
  const question = await mustQuestion(repo, event.questionId)
  if (question.reviewStatus === 'rejected') throw coded('REVIEW_CLOSED', '已驳回的题不能通过')
  const bundle = await loadL2Bundle(repo, question.knowledgePointIds)
  const resolved = resolveForSubject(question.subjectId, bundle)
  const updated = await repo.update('questions', question._id, {
    reviewStatus: 'approved',
    l1Id: resolved.l1Id,
    l1Order: resolved.l1Order,
    updatedAt: now(),
  })
  await bumpJob(repo, question.importJobId, 'approved', now)
  return { question: updated }
}

async function reviewReject (repo, event, now) {
  const question = await mustQuestion(repo, event.questionId)
  const updated = await repo.update('questions', question._id, {
    reviewStatus: 'rejected',
    updatedAt: now(),
  })
  return { question: updated }
}

async function questionPublish (repo, event, now) {
  const question = await mustQuestion(repo, event.questionId)
  const bundle = await loadL2Bundle(repo, question.knowledgePointIds)
  const reasons = publishBlockers(question, bundle)
  if (reasons.length) throw coded('PUBLISH_BLOCKED', '不满足发布条件', { reasons })
  if (question.status === 'published') return { question }
  await shiftPublishedCount(repo, question.knowledgePointIds, 1, now)
  const updated = await repo.update('questions', question._id, {
    status: 'published',
    updatedAt: now(),
  })
  await bumpJob(repo, question.importJobId, 'published', now)
  return { question: updated }
}

async function questionOffline (repo, event, now) {
  const question = await mustQuestion(repo, event.questionId)
  if (question.status === 'published') {
    await shiftPublishedCount(repo, question.knowledgePointIds, -1, now)
  }
  const updated = await repo.update('questions', question._id, {
    status: 'offline',
    updatedAt: now(),
  })
  return { question: updated }
}

async function questionBatchPublish (repo, event, now) {
  const results = []
  for (const questionId of event.questionIds || []) {
    try {
      const data = await questionPublish(repo, { questionId }, now)
      results.push({ questionId, ok: true, status: data.question.status })
    } catch (err) {
      results.push({
        questionId,
        ok: false,
        error: { code: err.code || 'INTERNAL', message: err.message, reasons: err.extra && err.extra.reasons },
      })
    }
  }
  return { results }
}

module.exports = {
  reviewQueue,
  reviewGet,
  reviewSetL2,
  reviewApprove,
  reviewReject,
  questionPublish,
  questionOffline,
  questionBatchPublish,
  shiftPublishedCount,
}
