// 把题目上的 L2 id 收成带所属 L1 的文档，供归属算法使用。
async function loadL2Bundle (repo, ids) {
  const unique = []
  ;(ids || []).forEach((id) => {
    if (id && !unique.includes(id)) unique.push(id)
  })
  const docs = []
  for (const id of unique) {
    const l2 = await repo.get('knowledge_points', id)
    if (!l2) {
      docs.push(null)
      continue
    }
    const l1 = l2.l1Id ? await repo.get('knowledge_l1', l2.l1Id) : null
    docs.push(Object.assign({}, l2, { l1: l1 || null }))
  }
  return docs
}

module.exports = { loadL2Bundle }
