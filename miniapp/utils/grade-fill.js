// 填空题多空比对。顺序规则（与 PR 说明一致）：
// 1. 题目/空位元数据显式 ordered|strict|sequence → 按空位顺序比对
// 2. unordered|anyOrder|parallel|set|顺序不限 → 多重集合比对（并列答案可换序）
// 3. 元数据不明时：多空且答案是并列集合（无差异化空位提示，或答案写成 A、B、C 一组）
//    → 不计顺序；有「依次 / 先后」或各空提示不同 → 仍按序

function normalizeToken(value) {
  return String(value == null ? '' : value)
    .replace(/[\u3000\s]+/g, '')
    .replace(/[“”"'‘’]/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .toLowerCase()
}

function splitTokenList(value) {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return value.flatMap(splitTokenList).filter((x) => String(x).trim())
  return String(value).split(/\s*(?:、|，|,|;|；|\/|／|｜|\||或)\s*/).map((x) => x.trim()).filter(Boolean)
}

function blankAccepts(blank) {
  if (blank == null) return []
  if (typeof blank !== 'object') return splitTokenList(blank)
  const bag = []
  ;['answer', 'answers', 'accepted', 'acceptedAnswers', 'aliases', 'key', 'keys'].forEach((k) => {
    if (blank[k] != null) bag.push.apply(bag, splitTokenList(blank[k]))
  })
  return bag
}

function extractKeyTokens(question, result) {
  const q = question || {}
  const r = result || {}
  if (Array.isArray(q.blanks) && q.blanks.length) {
    const fromBlanks = q.blanks.map((b) => blankAccepts(b))
    if (fromBlanks.every((x) => x.length)) return fromBlanks
  }
  const raw = r.answer != null ? r.answer : (q.answer != null ? q.answer : q.answers)
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item) => (item && typeof item === 'object' ? blankAccepts(item) : splitTokenList(item)))
  }
  if (typeof raw === 'string' && raw.trim()) {
    return splitTokenList(raw).map((p) => [p])
  }
  return []
}

function readOrderMeta(question) {
  const q = question || {}
  const meta = q.orderSensitive != null ? q.orderSensitive
    : q.orderMatters != null ? q.orderMatters
    : q.blankOrder != null ? q.blankOrder
    : q.fillOrder != null ? q.fillOrder
    : q.answerOrder != null ? q.answerOrder
    : undefined
  if (meta === true || meta === 'ordered' || meta === 'strict' || meta === 'sequence' || meta === 'index') return 'ordered'
  if (meta === false || meta === 'any' || meta === 'unordered' || meta === 'parallel' || meta === 'set' || meta === 'anyOrder') return 'unordered'
  if (q.unordered === true || q.anyOrder === true || q.parallel === true || q.orderInsensitive === true) return 'unordered'
  if (q.ordered === true) return 'ordered'
  const blanks = q.blanks || []
  if (blanks.some((b) => b && (b.ordered === true || b.orderSensitive === true))) return 'ordered'
  if (blanks.some((b) => b && (b.unordered === true || b.anyOrder === true || b.parallel === true))) return 'unordered'
  return null
}

function stemSuggestsOrder(question) {
  const stem = String((question && (question.stemMd || question.stemPlain || question.stem)) || '')
  if (/顺序不限|任意顺序|不分先后|并列写出|可颠倒/.test(stem)) return 'unordered'
  if (/依次|先后顺序|按顺序|从左到右|先填/.test(stem)) return 'ordered'
  return null
}

function blanksLookParallel(question, keyTokens) {
  const blanks = (question && question.blanks) || []
  const prompts = blanks.map((b) => String((b && (b.prompt || b.promptMd || b.title || b.stemMd)) || '').trim()).filter(Boolean)
  const distinct = prompts.filter((p) => !/^作答\s*\d+$/.test(p) && !/^第?\s*\d+\s*空$/.test(p))
  if (distinct.length >= 2) return false
  return keyTokens.length >= 2
}

function fillOrderMode(question, keyTokens) {
  const meta = readOrderMeta(question)
  if (meta) return meta
  const stem = stemSuggestsOrder(question)
  if (stem) return stem
  if (keyTokens.length >= 2 && blanksLookParallel(question, keyTokens)) return 'unordered'
  return 'ordered'
}

function tokenMatches(student, accepted) {
  const s = normalizeToken(student)
  if (!s) return false
  return (accepted || []).some((a) => {
    const k = normalizeToken(a)
    return !!k && s === k
  })
}

function matchOrdered(students, keyTokens) {
  if (students.length !== keyTokens.length) return false
  return keyTokens.every((accepted, i) => tokenMatches(students[i], accepted))
}

function matchUnordered(students, keyTokens) {
  if (students.length !== keyTokens.length) return false
  const used = keyTokens.map(() => false)
  return students.every((s) => {
    const idx = keyTokens.findIndex((accepted, i) => !used[i] && tokenMatches(s, accepted))
    if (idx < 0) return false
    used[idx] = true
    return true
  })
}

function studentTokens(answers) {
  if (answers == null) return []
  if (Array.isArray(answers)) return answers.map((a) => String(a == null ? '' : a).trim())
  return splitTokenList(answers)
}

function alignToKey(students, keyTokens) {
  const leftover = []
  const placed = keyTokens.map(() => null)
  const used = students.map(() => false)
  students.forEach((s, i) => {
    const idx = keyTokens.findIndex((accepted, k) => placed[k] == null && tokenMatches(s, accepted))
    if (idx >= 0) {
      placed[idx] = s
      used[i] = true
    }
  })
  students.forEach((s, i) => { if (!used[i]) leftover.push(s) })
  return placed.map((v) => (v == null ? leftover.shift() || '' : v))
}

function gradeFill(question, studentAnswers, result) {
  const keyTokens = extractKeyTokens(question, result)
  const students = studentTokens(studentAnswers)
  if (!keyTokens.length) return { matched: false, mode: 'unknown', aligned: students, keyTokens }
  const mode = fillOrderMode(question, keyTokens)
  const matched = mode === 'unordered' ? matchUnordered(students, keyTokens) : matchOrdered(students, keyTokens)
  const aligned = mode === 'unordered' ? alignToKey(students, keyTokens) : students.slice()
  return { matched, mode, aligned, keyTokens }
}

function alignAnswersForSubmit(question, answers) {
  const graded = gradeFill(question, answers, null)
  if (graded.mode !== 'unordered' || !graded.keyTokens.length) return Array.isArray(answers) ? answers.slice() : studentTokens(answers)
  return graded.aligned
}

module.exports = {
  normalizeToken,
  extractKeyTokens,
  fillOrderMode,
  gradeFill,
  alignAnswersForSubmit
}
