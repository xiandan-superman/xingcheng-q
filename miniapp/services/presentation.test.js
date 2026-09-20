const assert = require('assert')
const { question } = require('../services/presentation')

assert.strictEqual(question({ type: 'short', stemPlain: '固溶度' }).stem, '名词解释：固溶度')
assert.strictEqual(question({ type: 'short', stemPlain: '固溶度' }).type, '简答题')
assert.strictEqual(question({ type: 'short', subtype: '名词解释', stemPlain: '过冷度' }).type, '名词解释')
assert.strictEqual(question({ type: 'single', stemPlain: '共析转变发生的温度是？' }).stem, '共析转变发生的温度是？')
assert.ok(!question({ type: 'fill', stemPlain: '写出三个恒温转变' }).stem.startsWith('名词解释：'))

console.log('presentation stem ok')
