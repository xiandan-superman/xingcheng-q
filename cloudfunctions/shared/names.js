function normName (value) {
  return String(value || '').normalize('NFKC').trim().replace(/\s+/g, '').toLowerCase()
}

module.exports = { normName }
