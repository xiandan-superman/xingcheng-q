// 学科层级：L1 章 + L2 知识点。动作名与草案 §7.1 一致。
const catalog = require('../shared/catalog')

module.exports = {
  l1List: (ctx, event) => catalog.l1List(ctx.repo, event),
  l1Upsert: (ctx, event) => catalog.l1Upsert(ctx.repo, event, ctx.now),
  l1Reorder: (ctx, event) => catalog.l1Reorder(ctx.repo, event, ctx.now),
  l2List: (ctx, event) => catalog.l2List(ctx.repo, event),
  l2Upsert: (ctx, event) => catalog.l2Upsert(ctx.repo, event, ctx.now),
  l2Move: (ctx, event) => catalog.l2Move(ctx.repo, event, ctx.now),
}
