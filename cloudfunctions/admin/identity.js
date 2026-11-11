const { coded } = require('../shared/errors')

async function bindAdmin (ctx) {
  if (!ctx.openid) throw coded('UNAUTHENTICATED', '缺少用户身份')
  const rows = await ctx.repo.find('admins', { openid: ctx.openid })
  if (!rows.length) throw coded('NOT_ADMIN', '需要管理员权限')
  ctx.admin = rows[0]
  return ctx
}

module.exports = { bindAdmin }
