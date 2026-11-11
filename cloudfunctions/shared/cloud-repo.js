// wx-server-sdk 适配。只在云函数 main 里构造，单测不加载。
function translate (db, query) {
  const command = db.command
  const out = {}
  Object.entries(query || {}).forEach(([key, expected]) => {
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      const parts = []
      if ('$lte' in expected) parts.push(command.lte(expected.$lte))
      if ('$gte' in expected) parts.push(command.gte(expected.$gte))
      if ('$in' in expected) parts.push(command.in(expected.$in))
      if ('$ne' in expected) parts.push(command.neq(expected.$ne))
      if ('$exists' in expected) parts.push(command.exists(expected.$exists))
      out[key] = parts.length === 1 ? parts[0] : command.and(parts)
      return
    }
    out[key] = expected
  })
  return out
}

function createCloudRepo (db) {
  const pageSize = 100
  const maxDocs = 5000

  return {
    async get (name, id) {
      try {
        const res = await db.collection(name).doc(id).get()
        return res.data || null
      } catch (err) {
        return null
      }
    },
    async insert (name, doc) {
      const res = await db.collection(name).add({ data: doc })
      return Object.assign({}, doc, { _id: doc._id || res._id })
    },
    async update (name, id, patch) {
      await db.collection(name).doc(id).update({ data: patch })
      const res = await db.collection(name).doc(id).get()
      return res.data
    },
    async find (name, query) {
      const where = translate(db, query)
      const all = []
      for (let skip = 0; skip < maxDocs; skip += pageSize) {
        const res = await db.collection(name).where(where).skip(skip).limit(pageSize).get()
        const batch = res.data || []
        all.push(...batch)
        if (batch.length < pageSize) return all
      }
      const err = new Error('单次读取超过分页上限，重算任务需续跑')
      err.code = 'PAGE_LIMIT'
      throw err
    },
  }
}

module.exports = { createCloudRepo, translate }
