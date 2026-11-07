'use strict'
function checkpoint(user = {}) {
  const revision = Number(user.achievementRevision) || 0
  const countRevision = user.achievementCountRevision
  const version = user.achievementCountVersion
  const count = user.achievementAnswerCount
  return { revision, countRevision, version, count,
    current: [1, 2].includes(version) && countRevision === revision && Number.isSafeInteger(count) && count >= 0 }
}
function same(a, b) {
  return a.revision === b.revision && a.countRevision === b.countRevision && a.version === b.version && a.count === b.count
}
async function calibrate(db, openid, allUserRows) {
  const attempts = db.collection('attempts')
  if (typeof attempts.aggregate !== 'function') {
    const rows = await allUserRows(attempts, {userId:openid}, {questionId:true})
    return new Set(rows.data.map(row=>row.questionId).filter(Boolean)).size
  }
  // Exact distinct count runs on the database. Lifetime answer rows never need
  // to be paged through the function even during a first-time/legacy calibration.
  const result = await attempts.aggregate()
    .match({userId:openid,questionId:{$exists:true,$nin:[null,'',false,0]}})
    .group({_id:'$questionId'}).group({_id:null,count:{$sum:1}}).end()
  const rows = result.list || result.data
  if (!Array.isArray(rows) || (rows.length && (!Number.isSafeInteger(rows[0].count) || rows[0].count<0))) throw Error('成就计数暂不可用，请稍后重试')
  return rows.length ? rows[0].count : 0
}
module.exports = { checkpoint, same, calibrate }
