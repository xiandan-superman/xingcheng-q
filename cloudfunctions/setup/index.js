const { COLLECTIONS } = require('../shared/collections')

// 只补缺失集合，不清库、不删文档。
async function main () {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const db = cloud.database()
  const created = []
  const existed = []
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name)
      created.push(name)
    } catch (err) {
      existed.push(name)
    }
  }
  return { ok: true, data: { created, existed, collections: COLLECTIONS } }
}

module.exports = { main, COLLECTIONS }
