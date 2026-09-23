const { coded, toResult } = require('../shared/errors')
const imported = require('../shared/import-flow')

function tokenOf (event) {
  const headers = event.headers || {}
  return event.token || headers['x-import-token'] || headers['X-Import-Token'] || ''
}

function assertToken (event) {
  const expected = process.env.IMPORT_CALLBACK_TOKEN || ''
  if (!expected || tokenOf(event) !== expected) throw coded('CALLBACK_UNAUTHORIZED', '回调未授权')
}

function payloadOf (event) {
  if (typeof event.body === 'string' && event.body) return JSON.parse(event.body)
  if (event.body && typeof event.body === 'object') return event.body
  return event
}

async function handle (ctx, event) {
  assertToken(event || {})
  const body = payloadOf(event || {})
  const action = body.action || event.action
  if (action === 'mineruCallback') return imported.mineruCallback(ctx.repo, body, ctx.now)
  if (action === 'jevCallback') return imported.jevCallback(ctx.repo, body, ctx.now)
  throw coded('UNKNOWN_ACTION', '未知回调')
}

async function main (event) {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const { createCloudRepo } = require('../shared/cloud-repo')
  const ctx = {
    repo: createCloudRepo(cloud.database()),
    now: () => new Date(),
  }
  try {
    const data = await handle(ctx, event || {})
    return { ok: true, data }
  } catch (err) {
    console.error(err)
    return toResult(err)
  }
}

module.exports = { main, handle }
