const { coded } = require('./errors')

// 半残标红。tag_empty 是「没打上 L2」，补上合法 L2 后去掉，不在这张表里。
const RED_FLAGS = ['parse_partial', 'formula_loss', 'empty_answer']

// 草案 §2 的唯一实现。多 L2 跨多个 L1 时取 order 最大的那个。
// 同序号不同 L1 视为数据损坏（学科内序号必须唯一），不另选一个。
function resolveL1 (l2Docs) {
  if (!l2Docs || !l2Docs.length) throw coded('NO_L2', '题目没有二级知识点')
  let best = null
  const orderOwner = new Map()
  for (const l2 of l2Docs) {
    if (!l2 || !l2.l1Id || !l2.l1 || !l2.l1._id || l2.l1._id !== l2.l1Id) {
      throw coded('L2_WITHOUT_L1', '二级知识点没有合法一级')
    }
    const order = l2.l1.order
    if (!Number.isInteger(order) || order < 1) {
      throw coded('L2_WITHOUT_L1', '一级序号非法')
    }
    const prev = orderOwner.get(order)
    if (prev && prev !== l2.l1._id) throw coded('L1_ORDER_TIE', '同一学科存在重复一级序号')
    orderOwner.set(order, l2.l1._id)
    if (!best || order > best.order) best = l2.l1
  }
  return { l1Id: best._id, l1Order: best.order }
}

// 发布 / 审核通过前的 L2 检查：存在、同科、启用、挂着合法 L1。
function resolveForSubject (subjectId, l2Docs) {
  if (!l2Docs || !l2Docs.length) throw coded('NO_L2', '题目没有二级知识点')
  for (const l2 of l2Docs) {
    if (!l2) throw coded('L2_WITHOUT_L1', '二级知识点不存在')
    if (l2.subjectId !== subjectId) throw coded('L2_SUBJECT_MISMATCH', '二级知识点不属于该学科')
    if (l2.enabled === false) throw coded('L2_DISABLED', '二级知识点已停用')
    if (!l2.l1 || l2.l1.subjectId !== subjectId) {
      throw coded('L2_WITHOUT_L1', '二级知识点没有合法一级')
    }
  }
  return resolveL1(l2Docs)
}

function hasRedFlags (qualityFlags) {
  return (qualityFlags || []).some((flag) => RED_FLAGS.includes(flag))
}

// 发布闸门。返回阻断原因 code 列表；空数组表示可以发布。
function publishBlockers (question, l2Docs) {
  const reasons = []
  if (!question || question.reviewStatus !== 'approved') reasons.push('NOT_APPROVED')
  if (question && question.legacyMapStatus === 'failed') reasons.push('LEGACY_MAP_FAILED')
  if (question && hasRedFlags(question.qualityFlags)) reasons.push('QUALITY_RED')
  try {
    const resolved = resolveForSubject(question.subjectId, l2Docs)
    if (!question.l1Id || question.l1Id !== resolved.l1Id || question.l1Order !== resolved.l1Order) {
      reasons.push('L1_STALE')
    }
  } catch (err) {
    reasons.push(err.code || 'L1_INVALID')
  }
  return reasons
}

module.exports = {
  RED_FLAGS,
  resolveL1,
  resolveForSubject,
  hasRedFlags,
  publishBlockers,
}
