const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveL1, publishBlockers } = require('./l1-resolve')

test('多 L2 取序号最大的唯一 L1', () => {
  const resolved = resolveL1([
    { l1Id: 'l1', l1: { _id: 'l1', order: 1, name: '气体的pVT关系' } },
    { l1Id: 'l5', l1: { _id: 'l5', order: 5, name: '相平衡' } },
  ])
  assert.deepEqual(resolved, { l1Id: 'l5', l1Order: 5 })
})

test('没有 L2 或 L2 没有合法 L1 时不能归属', () => {
  assert.throws(() => resolveL1([]), (err) => err.code === 'NO_L2')
  assert.throws(() => resolveL1([{ l1Id: 'l1' }]), (err) => err.code === 'L2_WITHOUT_L1')
})

test('同一序号落到两个章上时拒绝', () => {
  assert.throws(() => resolveL1([
    { l1Id: 'a', l1: { _id: 'a', order: 5 } },
    { l1Id: 'b', l1: { _id: 'b', order: 5 } },
  ]), (err) => err.code === 'L1_ORDER_TIE')
})

test('发布闸门挡住未审、半残、映射失败和过期 L1', () => {
  const l2 = [{
    subjectId: 'phychem',
    enabled: true,
    l1Id: 'l5',
    l1: { _id: 'l5', subjectId: 'phychem', order: 5 },
  }]
  const base = {
    subjectId: 'phychem',
    reviewStatus: 'approved',
    l1Id: 'l5',
    l1Order: 5,
    legacyMapStatus: 'ok',
    qualityFlags: [],
  }
  assert.deepEqual(publishBlockers(base, l2), [])
  assert.ok(publishBlockers(Object.assign({}, base, { reviewStatus: 'pending_review' }), l2).includes('NOT_APPROVED'))
  assert.ok(publishBlockers(Object.assign({}, base, { qualityFlags: ['formula_loss'] }), l2).includes('QUALITY_RED'))
  assert.ok(publishBlockers(Object.assign({}, base, { legacyMapStatus: 'failed' }), l2).includes('LEGACY_MAP_FAILED'))
  assert.ok(publishBlockers(Object.assign({}, base, { l1Order: 1 }), l2).includes('L1_STALE'))
  assert.ok(publishBlockers(Object.assign({}, base, { knowledgePointIds: [] }), []).includes('NO_L2'))
})
