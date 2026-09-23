// 每日一题池：已发布 ∩ 学科 ∩ l1Order≤N ∩ 映射未失败。
// 比较用数字序号。null <= N 在 JS 里会变成 true，这里明确拒绝非数字。
function inDailyPool (question, maxOrder) {
  if (!question || question.status !== 'published') return false
  if (question.legacyMapStatus === 'failed') return false
  if (typeof question.l1Order !== 'number') return false
  if (typeof maxOrder !== 'number') return false
  return question.l1Order <= maxOrder
}

// 耗尽后退化：只去掉排除集，不放宽到 >N。
function dailyPool (questions, maxOrder, excludedIds) {
  const excluded = excludedIds || new Set()
  return (questions || []).filter((question) => inDailyPool(question, maxOrder) && !excluded.has(question._id))
}

// 专项 / 错题：只按 L2，不用 deepest 截断。
function matchesL2 (question, knowledgePointIds) {
  if (!question || question.status !== 'published') return false
  if (question.legacyMapStatus === 'failed') return false
  const wanted = knowledgePointIds || []
  const owned = question.knowledgePointIds || []
  return wanted.some((id) => owned.includes(id))
}

module.exports = { inDailyPool, dailyPool, matchesL2 }
