const { coded } = require('../shared/errors')

async function bindStudent (ctx) {
  if (!ctx.openid) throw coded('UNAUTHENTICATED', '缺少用户身份')
  const user = await ctx.repo.get('users', ctx.openid)
  if (!user) throw coded('USER_NOT_FOUND', '用户不存在')
  ctx.user = user
  return ctx
}

module.exports = { bindStudent }
