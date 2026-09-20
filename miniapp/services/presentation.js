const { isTermExplain, withTaskPrefix } = require('../utils/stem')

const subjects = { mse: '材料科学基础', phychem: '物理化学' }
const types = {
  truefalse: '判断题', single: '单选题', multi: '多选题', judge: '判断题',
  fill: '填空题', short: '简答题', composite: '综合题',
  definition: '名词解释', term: '名词解释', explain: '名词解释', '名词解释': '名词解释'
}

function displayType(q) {
  if (isTermExplain(q)) return '名词解释'
  return types[q.type] || q.type
}

function displayKind(q) {
  if (q.type === 'truefalse') return 'judge'
  if (isTermExplain(q) || q.type === 'definition' || q.type === 'term' || q.type === '名词解释') return 'short'
  return q.type
}

function question(q) {
  if (!q) return null
  const kind = displayKind(q)
  const rawParts = q.type === 'composite' ? q.parts || [] : q.type === 'fill' ? q.blanks || [] : [{}]
  const stem = withTaskPrefix(q.stemMd || q.stemPlain || '', q)
  const summary = withTaskPrefix(q.stemPlain || q.stemMd || '', q)
  return { ...q, id: q._id, kind, type: displayType(q), subject: subjects[q.subjectId] || q.subjectId,
    summary, stem,
    parts: rawParts.map((p, i) => ({ ...p, id: p.id || String(i), title: p.title || (q.type === 'fill' ? '第 ' + (i + 1) + ' 空' : '作答 ' + (i + 1)), prompt: p.prompt || p.promptMd || p.stemMd || '', placeholder: q.type === 'fill' ? '填写此空' : '写下你的答案' })),
    options: (q.type === 'judge' || q.type === 'truefalse'
      ? [{ key: 'true', text: '正确', mark: '正' }, { key: 'false', text: '错误', mark: '误' }]
      : q.options || []
    ).map((o, i) => {
      if (typeof o === 'string') {
        const key = String.fromCharCode(65 + i)
        return { key, text: o, mark: key }
      }
      const key = String(o.key || o.id || String.fromCharCode(65 + i))
      const text = o.text || o.md || o.content || o.label || ''
      // 判断题禁止在方框露 raw true/false
      const mark = o.mark || (/^(true|false)$/i.test(key)
        ? (String(key).toLowerCase() === 'true' ? '正' : '误')
        : key)
      return { key, text, mark }
    }) }
}
function error(err) { wx.showToast({ title: err.message || '连接失败，请重试', icon: 'none' }) }
function dates(count = 7) {
  const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
  return Array.from({ length: count }, (_, i) => new Date(Date.parse(today + 'T00:00:00Z') - (count - 1 - i) * 86400000).toISOString().slice(0, 10))
}
module.exports = { question, error, dates, subjects, displayType, displayKind }
