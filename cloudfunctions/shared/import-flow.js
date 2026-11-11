const { coded } = require('./errors')
const { nid } = require('./ids')

const PIPELINE = 'word_mineru_jev_v1'
const FLAG_FROM_WARNING = {
  parse_partial: 'parse_partial',
  formula_loss: 'formula_loss',
  empty_answer: 'empty_answer',
  partial: 'parse_partial',
  formula: 'formula_loss',
}

function assertDocx (fileID) {
  const name = String(fileID || '')
  if (/\.(pdf|png|jpe?g|gif|webp)(\?|$)/i.test(name)) {
    throw coded('UNSUPPORTED_FILE', '本期不支持 PDF / 图片')
  }
  if (!/\.docx(\?|$)/i.test(name)) throw coded('UNSUPPORTED_FILE', '本期仅支持 Word（.docx）')
}

function flagsFrom (item) {
  const flags = []
  ;(item.warnings || []).forEach((warning) => {
    const mapped = FLAG_FROM_WARNING[String(warning)]
    if (mapped && !flags.includes(mapped)) flags.push(mapped)
  })
  if (!String(item.stemMd || item.stem || '').trim() && !flags.includes('parse_partial')) {
    flags.push('parse_partial')
  }
  if ((item.answer == null || item.answer === '') && !flags.includes('empty_answer')) {
    flags.push('empty_answer')
  }
  return flags
}

async function importCreate (repo, event, now) {
  assertDocx(event.fileID)
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const subject = await repo.get('subjects', event.subjectId)
  if (!subject || subject.enabled === false) throw coded('UNKNOWN_SUBJECT', '学科不存在或已停用')
  const job = await repo.insert('import_jobs', {
    _id: nid('job'),
    subjectId: event.subjectId,
    sourceFileId: event.fileID,
    pipeline: PIPELINE,
    status: 'uploaded',
    questionIds: [],
    stats: { total: 0, partial: 0, tagged: 0, approved: 0, published: 0 },
    error: '',
    createdBy: event.createdBy || '',
    createdAt: now(),
    updatedAt: now(),
  })
  return { importJobId: job._id, status: job.status }
}

async function importGet (repo, event) {
  const job = await repo.get('import_jobs', event.importJobId)
  if (!job) throw coded('IMPORT_NOT_FOUND', '入库任务不存在')
  return job
}

async function mineruCallback (repo, event, now) {
  const job = await importGet(repo, event)
  if (!['uploaded', 'parsing'].includes(job.status)) throw coded('IMPORT_STATE', '当前状态不能接收拆题结果')
  const items = event.items || []
  if (!items.length) {
    await repo.update('import_jobs', job._id, {
      status: 'failed',
      error: event.error || '拆题失败',
      updatedAt: now(),
    })
    return { importJobId: job._id, status: 'failed' }
  }
  const questionIds = []
  let partial = 0
  for (const item of items) {
    const qualityFlags = flagsFrom(item)
    if (qualityFlags.some((flag) => flag === 'parse_partial' || flag === 'formula_loss' || flag === 'empty_answer')) {
      partial += 1
    }
    const question = await repo.insert('questions', {
      _id: nid('q'),
      subjectId: job.subjectId,
      type: item.type || '',
      stemMd: item.stemMd || item.stem || '',
      answer: item.answer == null ? '' : item.answer,
      analysis: item.analysis || '',
      parts: Array.isArray(item.parts) ? item.parts : [],
      knowledgePointIds: [],
      status: 'pending',
      reviewStatus: 'pending_review',
      qualityFlags,
      importJobId: job._id,
      l1Id: null,
      l1Order: null,
      createdAt: now(),
      updatedAt: now(),
    })
    questionIds.push(question._id)
  }
  await repo.update('import_jobs', job._id, {
    status: 'tagging',
    questionIds,
    stats: { total: questionIds.length, partial, tagged: 0, approved: 0, published: 0 },
    error: '',
    updatedAt: now(),
  })
  return { importJobId: job._id, status: 'tagging', questionIds, total: questionIds.length, partial }
}

async function jevCallback (repo, event, now) {
  const job = await importGet(repo, event)
  if (job.status !== 'tagging') throw coded('IMPORT_STATE', '当前状态不能接收打标结果')
  const legal = await repo.find('knowledge_points', { subjectId: job.subjectId, enabled: true })
  const legalIds = new Set(legal.filter((point) => point.l1Id).map((point) => point._id))
  const tags = new Map((event.tags || []).map((tag) => [tag.questionId, tag.l2Ids || tag.l2_ids || []]))
  let tagged = 0
  for (const questionId of job.questionIds || []) {
    const question = await repo.get('questions', questionId)
    if (!question) continue
    const raw = tags.get(questionId) || []
    const accepted = []
    raw.forEach((id) => {
      if (legalIds.has(id) && !accepted.includes(id)) accepted.push(id)
    })
    const qualityFlags = (question.qualityFlags || []).filter((flag) => flag !== 'tag_empty')
    if (!accepted.length) qualityFlags.push('tag_empty')
    else tagged += 1
    await repo.update('questions', questionId, {
      knowledgePointIds: accepted,
      qualityFlags,
      jevMeta: { model: 'jev', scoredAt: now(), rawL2Ids: raw },
      updatedAt: now(),
    })
  }
  const stats = Object.assign({}, job.stats || {}, { tagged })
  await repo.update('import_jobs', job._id, { status: 'await_review', stats, updatedAt: now() })
  return { importJobId: job._id, status: 'await_review', tagged }
}

module.exports = {
  importCreate,
  importGet,
  mineruCallback,
  jevCallback,
  assertDocx,
}
