const assert = require('assert')
const { gradeFill, alignAnswersForSubmit, fillOrderMode } = require('./grade-fill')

const parallel = {
  type: 'fill',
  stemPlain: '写出三个恒温转变',
  blanks: [{}, {}, {}],
  answer: ['包晶', '共晶', '共析']
}

{
  const r = gradeFill(parallel, ['共析', '包晶', '共晶'])
  assert.strictEqual(r.mode, 'unordered')
  assert.strictEqual(r.matched, true)
  assert.deepStrictEqual(alignAnswersForSubmit(parallel, ['共析', '包晶', '共晶']), ['包晶', '共晶', '共析'])
}

{
  const ordered = {
    type: 'fill',
    stemPlain: '按顺序写出从液态冷却到室温的组织',
    blanks: [{ prompt: '高温' }, { prompt: '共析后' }],
    answer: ['奥氏体', '珠光体'],
    orderMatters: true
  }
  const r = gradeFill(ordered, ['珠光体', '奥氏体'])
  assert.strictEqual(r.mode, 'ordered')
  assert.strictEqual(r.matched, false)
  assert.strictEqual(gradeFill(ordered, ['奥氏体', '珠光体']).matched, true)
}

{
  const setKey = { type: 'fill', answer: '铁素体、珠光体、渗碳体' }
  assert.strictEqual(fillOrderMode(setKey, [['铁素体'], ['珠光体'], ['渗碳体']]), 'unordered')
  assert.strictEqual(gradeFill(setKey, ['渗碳体', '铁素体', '珠光体']).matched, true)
}

{
  const aliases = {
    type: 'fill',
    unordered: true,
    blanks: [
      { answers: ['γ', '奥氏体'] },
      { answers: ['α', '铁素体'] }
    ]
  }
  assert.strictEqual(gradeFill(aliases, ['铁素体', '奥氏体']).matched, true)
}

console.log('grade-fill ok')
