const { coded } = require('./errors')
const { nid } = require('./ids')
const { normName } = require('./names')
const { loadL2Bundle } = require('./l2-bundle')
const { resolveForSubject } = require('./l1-resolve')
const { shiftPublishedCount } = require('./review')

function rowOrder (row) {
  if (row.order != null) return Number(row.order)
  if (row['序号'] != null) return Number(row['序号'])
  return NaN
}

function rowChapter (row) {
  return String(row.chapter || row.name || row['章'] || '').trim()
}

function rowL2 (row) {
  return String(row.l2Name || row['原二级标题'] || '').trim()
}

async function upsertChapter (repo, subjectId, order, chapter, now, created) {
  const all = await repo.find('knowledge_l1', { subjectId })
  let l1 = all.find((item) => item.order === order) || all.find((item) => normName(item.name) === normName(chapter))
  if (!l1) {
    l1 = await repo.insert('knowledge_l1', {
      _id: nid('l1'),
      subjectId,
      order,
      name: chapter,
      enabled: true,
      createdAt: now(),
      updatedAt: now(),
    })
    created.push(l1._id)
    return l1
  }
  if (l1.order !== order || l1.name !== chapter) {
    const taken = all.some((item) => item._id !== l1._id && item.order === order)
    if (taken) throw coded('L1_ORDER_TAKEN', '迁移章序号冲突')
    l1 = await repo.update('knowledge_l1', l1._id, { order, name: chapter, updatedAt: now() })
  }
  return l1
}

async function legacyMapRun (repo, event, now) {
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const subjectId = event.subjectId
  const upsertedL1 = []
  const linkedL2 = []
  const unmatchedL2Names = []
  for (const row of event.rows || []) {
    const order = rowOrder(row)
    const chapter = rowChapter(row)
    const l2Name = rowL2(row)
    if (!Number.isInteger(order) || order < 1 || !chapter) {
      throw coded('LEGACY_ROW_INVALID', '层级行缺少序号或章名')
    }
    const l1 = await upsertChapter(repo, subjectId, order, chapter, now, upsertedL1)
    if (!l2Name) continue
    const points = await repo.find('knowledge_points', { subjectId })
    const point = points.find((item) => normName(item.name) === normName(l2Name))
    if (!point) {
      if (!unmatchedL2Names.includes(l2Name)) unmatchedL2Names.push(l2Name)
      continue
    }
    await repo.update('knowledge_points', point._id, {
      l1Id: l1._id,
      legacyMapped: true,
      updatedAt: now(),
    })
    if (!linkedL2.includes(point._id)) linkedL2.push(point._id)
  }

  const published = await repo.find('questions', { subjectId, status: 'published' })
  const retries = await repo.find('questions', { subjectId, status: 'offline', legacyMapStatus: 'failed' })
  const targets = published.concat(retries.filter((row) => !published.some((item) => item._id === row._id)))
  const ok = []
  const failed = []
  for (const question of targets) {
    const wasPublished = question.status === 'published'
    try {
      const bundle = await loadL2Bundle(repo, question.knowledgePointIds)
      const resolved = resolveForSubject(subjectId, bundle)
      const status = wasPublished ? 'published' : 'offline'
      await repo.update('questions', question._id, {
        l1Id: resolved.l1Id,
        l1Order: resolved.l1Order,
        legacyMapStatus: 'ok',
        legacyMapErrors: [],
        legacyMappedAt: now(),
        status,
        updatedAt: now(),
      })
      ok.push({ questionId: question._id, l1Id: resolved.l1Id, l1Order: resolved.l1Order, status })
    } catch (err) {
      if (wasPublished) await shiftPublishedCount(repo, question.knowledgePointIds, -1, now)
      const errors = [err.code || 'MAP_FAILED']
      await repo.update('questions', question._id, {
        status: 'offline',
        legacyMapStatus: 'failed',
        legacyMapErrors: errors,
        legacyMappedAt: now(),
        updatedAt: now(),
      })
      failed.push({ questionId: question._id, errors })
    }
  }
  const report = await repo.insert('legacy_map_reports', {
    _id: nid('lmap'),
    subjectId,
    createdAt: now(),
    ok,
    failed,
    unmatchedL2Names,
    upsertedL1,
    linkedL2,
  })
  return report
}

async function legacyMapReport (repo, event) {
  if (event.reportId) {
    const report = await repo.get('legacy_map_reports', event.reportId)
    if (!report) throw coded('REPORT_NOT_FOUND', '映射报告不存在')
    return report
  }
  if (!event.subjectId) throw coded('SUBJECT_REQUIRED', '请指定学科')
  const reports = await repo.find('legacy_map_reports', { subjectId: event.subjectId })
  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return reports[0] || null
}

module.exports = { legacyMapRun, legacyMapReport }
