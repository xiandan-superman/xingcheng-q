const TERM_TYPE_RE = /名词解释|term[-_ ]?explain|^definition$|^term$|^explain$/i
const TASK_PREFIX_RE = /^\s*名词解释\s*[：:]/
const TASK_HINT_RE = /名词解释|简述|试述|请|解释|分析|写出|计算|何谓|什么是|为何|为什么|[？?。！]/
const BARE_TERM_RE = /^[\u4e00-\u9fffA-Za-z0-9α-ωΑ-Ω₀-₉+\-··\s]+$/

function metaHay(q) {
  const parts = [q.type, q.subtype, q.subType, q.category, q.questionCategory, q.skill, q.taskType, q.stemKind, q.itemType]
  if (Array.isArray(q.tags)) parts.push.apply(parts, q.tags)
  return parts.filter(Boolean).map((x) => String(x)).join(' ')
}

function isTermExplain(q) {
  if (!q) return false
  return TERM_TYPE_RE.test(metaHay(q))
}

function looksLikeBareTerm(stem) {
  const s = String(stem || '').replace(/\s+/g, ' ').trim()
  if (!s || s.length < 2 || s.length > 12) return false
  if (TASK_HINT_RE.test(s)) return false
  if (/的应用|过程|分析|计算|原因|影响|区别|比较|冷却组织/.test(s)) return false
  return BARE_TERM_RE.test(s)
}

function withTaskPrefix(stem, q) {
  const raw = String(stem || '').trim()
  if (!raw || TASK_PREFIX_RE.test(raw)) return raw
  const shortLike = !q ? false : (q.type === 'short' || q.type === '名词解释' || q.type === 'definition' || q.type === 'term' || isTermExplain(q))
  if (isTermExplain(q) || (shortLike && looksLikeBareTerm(raw))) return '名词解释：' + raw
  return raw
}

module.exports = { isTermExplain, looksLikeBareTerm, withTaskPrefix }
