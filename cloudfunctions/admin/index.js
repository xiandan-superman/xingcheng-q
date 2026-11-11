const { toResult } = require('../shared/errors')
const { bindAdmin } = require('./identity')
const { dispatch } = require('./featureActions')

// 题库层级切片里的管理入口。不要用它覆盖 cloud1 上已有的 admin。
async function handle (ctx, event) {
  await bindAdmin(ctx)
  return dispatch(ctx, event || {})
}

async function main (event) {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const { createCloudRepo } = require('../shared/cloud-repo')
  const ctx = {
    repo: createCloudRepo(cloud.database()),
    openid: cloud.getWXContext().OPENID,
    now: () => new Date(),
  }
  try {
    const data = await handle(ctx, event)
    return { ok: true, data }
  } catch (err) {
    console.error(event && event.action, err)
    return toResult(err)
  }
}

module.exports = { main, handle }
