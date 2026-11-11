const { coded } = require('../shared/errors')
const catalog = require('./knowledge-catalog')
const review = require('../shared/review')
const imported = require('../shared/import-flow')
const legacy = require('../shared/legacy-map')

const actions = Object.assign({}, catalog, {
  importCreate (ctx, event) {
    return imported.importCreate(ctx.repo, Object.assign({ createdBy: ctx.openid }, event), ctx.now)
  },
  importGet (ctx, event) {
    return imported.importGet(ctx.repo, event)
  },
  reviewQueue (ctx, event) {
    return review.reviewQueue(ctx.repo, event)
  },
  reviewGet (ctx, event) {
    return review.reviewGet(ctx.repo, event)
  },
  reviewSetL2 (ctx, event) {
    return review.reviewSetL2(ctx.repo, event, ctx.now)
  },
  reviewApprove (ctx, event) {
    return review.reviewApprove(ctx.repo, event, ctx.now)
  },
  reviewReject (ctx, event) {
    return review.reviewReject(ctx.repo, event, ctx.now)
  },
  questionPublish (ctx, event) {
    return review.questionPublish(ctx.repo, event, ctx.now)
  },
  questionOffline (ctx, event) {
    return review.questionOffline(ctx.repo, event, ctx.now)
  },
  questionBatchPublish (ctx, event) {
    return review.questionBatchPublish(ctx.repo, event, ctx.now)
  },
  legacyMapRun (ctx, event) {
    return legacy.legacyMapRun(ctx.repo, event, ctx.now)
  },
  legacyMapReport (ctx, event) {
    return legacy.legacyMapReport(ctx.repo, event)
  },
})

async function dispatch (ctx, event) {
  const handler = actions[event && event.action]
  if (!handler) throw coded('UNKNOWN_ACTION', '未知操作')
  return handler(ctx, event || {})
}

module.exports = { actions, dispatch }
