const { coded } = require('../shared/errors')
const flow = require('../shared/student-flow')

// 练习相关 action 只读已发布题，不调用生题。
const actions = {
  bootstrap (ctx) {
    return flow.bootstrap(ctx.repo, ctx.user, ctx.now)
  },
  setDeepestL1 (ctx, event) {
    return flow.setDeepestL1(ctx.repo, ctx.user, event, ctx.now)
  },
  dailyGet (ctx, event) {
    return flow.dailyGet(ctx.repo, ctx.user, event, ctx.now)
  },
  dailyEnter (ctx, event) {
    return flow.dailyEnter(ctx.repo, ctx.user, event, ctx.now)
  },
  dailySubmit (ctx, event) {
    return flow.dailySubmit(ctx.repo, ctx.user, event, ctx.now)
  },
  practiceStart (ctx, event) {
    return flow.practiceStart(ctx.repo, ctx.user, event)
  },
  practiceRecommend (ctx) {
    return flow.practiceRecommend(ctx.repo, ctx.user)
  },
  wrongList (ctx, event) {
    return flow.wrongList(ctx.repo, ctx.user, event)
  },
  wrongEnter (ctx, event) {
    return flow.wrongEnter(ctx.repo, ctx.user, event)
  },
}

async function dispatch (ctx, event) {
  const handler = actions[event && event.action]
  if (!handler) throw coded('UNKNOWN_ACTION', '未知操作')
  return handler(ctx, event || {})
}

module.exports = { actions, dispatch }
