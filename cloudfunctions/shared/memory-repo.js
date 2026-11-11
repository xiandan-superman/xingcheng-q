// 本地自测用的文档库。云函数走 cloud-repo.js，两边认同一套查询形状。
function clone (value) {
  return value == null ? value : structuredClone(value)
}

function getPath (obj, path) {
  return String(path).split('.').reduce((current, key) => (current == null ? undefined : current[key]), obj)
}

function setPath (obj, path, value) {
  const parts = String(path).split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (current[parts[i]] == null || typeof current[parts[i]] !== 'object') current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

function unsetPath (obj, path) {
  const parts = String(path).split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (current == null) return
    current = current[parts[i]]
  }
  if (current) delete current[parts[parts.length - 1]]
}

function matchValue (actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if ('$lte' in expected) {
      if (typeof actual !== 'number' || actual > expected.$lte) return false
    }
    if ('$gte' in expected) {
      if (typeof actual !== 'number' || actual < expected.$gte) return false
    }
    if ('$in' in expected) {
      const list = expected.$in
      const hit = Array.isArray(actual) ? actual.some((item) => list.includes(item)) : list.includes(actual)
      if (!hit) return false
    }
    if ('$ne' in expected && actual === expected.$ne) return false
    if ('$exists' in expected) {
      const exists = actual !== undefined && actual !== null
      if (expected.$exists !== exists) return false
    }
    return true
  }
  if (Array.isArray(actual) && !Array.isArray(expected)) return actual.includes(expected)
  return actual === expected
}

function matches (doc, query) {
  return Object.entries(query || {}).every(([key, expected]) => matchValue(getPath(doc, key), expected))
}

function applyPatch (doc, patch) {
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.$unset) {
      unsetPath(doc, key)
      return
    }
    setPath(doc, key, clone(value))
  })
}

let seq = 0
function nid (prefix) {
  seq += 1
  return `${prefix}_${seq.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function createMemoryRepo (seed) {
  const tables = {}
  Object.entries(seed || {}).forEach(([name, docs]) => {
    tables[name] = (docs || []).map((doc) => clone(doc))
  })

  function table (name) {
    if (!tables[name]) tables[name] = []
    return tables[name]
  }

  return {
    async get (name, id) {
      const found = table(name).find((doc) => doc._id === id)
      return found ? clone(found) : null
    },
    async insert (name, doc) {
      const stored = clone(doc)
      if (!stored._id) stored._id = nid(name)
      table(name).push(stored)
      return clone(stored)
    },
    async update (name, id, patch) {
      const found = table(name).find((doc) => doc._id === id)
      if (!found) return null
      applyPatch(found, patch)
      return clone(found)
    },
    async find (name, query) {
      return table(name).filter((doc) => matches(doc, query)).map((doc) => clone(doc))
    },
    dump (name) {
      return table(name).map((doc) => clone(doc))
    },
  }
}

module.exports = { createMemoryRepo, nid }
