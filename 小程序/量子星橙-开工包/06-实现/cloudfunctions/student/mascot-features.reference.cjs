// Extracted mascot handlers from profile-features.js; review integration before use.
'use strict'
const identity = require('./identity')
const { checkpoint, calibrate } = require('./achievement-counter')
module.exports = function createFeatures({cloud,db,getDoc,runTransaction,allUserRows,now,fail,ok}) {
  const users = db.collection('users')
  async function active(openid) {
    const user = await getDoc(users,openid)
    if (!user || user.deletedAt) fail('ACCOUNT_UNAVAILABLE','账号不可用')
    return user
  }
  async function updateActive(openid,data) {
    return runTransaction(async tx=>{
      const ref=tx.collection('users').doc(openid),user=(await ref.get()).data
      if(!user||user.deletedAt)fail('ACCOUNT_UNAVAILABLE','账号不可用')
      await ref.update({data});return {...user,...data}
    })
  }
  async function growth(openid) {
    const configuration = await getDoc(db.collection('config'),'global')
    const rules = identity.validateRules((configuration && configuration.avatarRewards) || identity.DEFAULT_RULES)
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now())
    // A new attempt advances a revision in the same transaction as the attempt.
    // No new collection or approximate answer counter: repeated questions remain deduplicated.
    for (let retry = 0; retry < 4; retry++) {
      const snapshot = await active(openid)
      const counter = checkpoint(snapshot), revision = counter.revision
      const recount = !counter.current
      const scannedAnswerCount = recount ? await calibrate(db,openid,allUserRows) : 0
      const result = await runTransaction(async tx=>{
        const ref = tx.collection('users').doc(openid), user = (await ref.get()).data
        if (!user || user.deletedAt) fail('ACCOUNT_UNAVAILABLE','账号不可用')
        if ((Number(user.achievementRevision) || 0) !== revision) return null
        const answerCount = recount ? Math.max(scannedAnswerCount, Number(user.achievementAnswerCount) || 0) : Number(user.achievementAnswerCount) || 0
        const nextUser = {...user}
        if (!nextUser.lastLoginDate || nextUser.lastLoginDate < today) {
          nextUser.loginDays = (Number(nextUser.loginDays) || 0) + 1; nextUser.lastLoginDate = today
        }
        const grants = identity.grantsFor(nextUser,rules,answerCount,now())
        const previousGrants = identity.normalizeGrants(user.avatarGrants)
        const selected = identity.homeCompanions(nextUser,grants)
        if (Array.isArray(user.homeCompanionShapes)) for (const shape of identity.SHAPES) {
          if (selected.length < 5 && grants[shape] && !previousGrants[shape] && !selected.includes(shape)) selected.push(shape)
        }
        const avatarProfile = identity.publicProfile({...nextUser,avatarGrants:grants,homeCompanionShapes:selected})
        const next = {avatarGrants:grants,avatarShape:avatarProfile.avatarShape,avatarColor:avatarProfile.avatarColor,avatarColors:avatarProfile.avatarColors,
          homeCompanionShapes:selected,
          achievementAnswerCount:answerCount,loginDays:nextUser.loginDays || 0,lastLoginDate:nextUser.lastLoginDate,
          achievementCountVersion:2,achievementCountRevision:revision,achievementCountDate:today}
        const update = Object.fromEntries(Object.entries(next).filter(([key,value])=>JSON.stringify(user[key])!==JSON.stringify(value)))
        // Explicit field replacement removes migrated legacy keys; a plain nested update merges them.
        if (update.avatarGrants) update.avatarGrants = db.command.set(grants)
        if (update.avatarColors) update.avatarColors = db.command.set(avatarProfile.avatarColors)
        if (Object.keys(update).length) await ref.update({data:update})
        Object.assign(nextUser,next)
        const cards = [{key:'round',shape:'round',unlocked:true,progress:1,target:1,condition:'初始形象'}]
        rules.forEach(r=>{const grant=grants[r.shape],count=r.metric==='answers'?answerCount:nextUser.loginDays || 0
          cards.push({key:'reward-'+r.shape,shape:grant?r.shape:'',unlocked:!!grant,progress:Math.min(count,r.target),target:r.target,
            condition:r.enabled ? (r.metric==='answers'?'累计完成不同题目':'累计登录天数')+' '+r.target+(r.metric==='answers'?' 道':' 天') : '暂未开放',
            unlockedAt:grant?grant.unlockedAt:null,isNew:!!grant&&!grant.seenAt})
        })
        return {profile:identity.publicProfile(nextUser),cards,loginDays:nextUser.loginDays || 0,answerCount}
      })
      if (result) return result
    }
    fail('GROWTH_REFRESH_RETRY','学习记录正在更新，请稍后查看新形象')
  }

  return {
    async growthGet({openid}) { return ok(await growth(openid)) },
    async homeCompanionsSave({openid,event}) {
      const shapes = event.shapes
      if (!Array.isArray(shapes) || shapes.length < 1 || shapes.length > 5 || shapes.some(id=>!identity.normalizeShape(id))) fail('INVALID_COMPANIONS','请选择1至5位伙伴')
      const selected = shapes.map(identity.normalizeShape)
      if (!selected.includes('round') || new Set(selected).size !== selected.length) fail('INVALID_COMPANIONS','圆形Q常驻，请勿重复选择伙伴')
      return runTransaction(async tx=>{
        const ref=tx.collection('users').doc(openid),user=(await ref.get()).data
        if(!user||user.deletedAt) fail('ACCOUNT_UNAVAILABLE','账号不可用')
        const grants=identity.normalizeGrants(user.avatarGrants)
        if(selected.some(id=>id!=='round'&&!grants[id])) fail('AVATAR_LOCKED','获得伙伴后即可选择展示')
        const homeCompanionShapes=['round',...selected.filter(id=>id!=='round')]
        await ref.update({data:{homeCompanionShapes,updatedAt:now()}})
        return ok({homeCompanionShapes})
      })
    },
    async avatarSave({openid,event}) {
      const shape = identity.normalizeShape(event.shape)
      const patch=identity.parseColorPatch(event.avatarColors)
      if (!shape||!identity.COLORS.includes(event.color)||!patch||(Object.prototype.hasOwnProperty.call(patch,shape)&&patch[shape]!==event.color)) fail('INVALID_AVATAR','形象或颜色无效')
      return runTransaction(async tx=>{
        const ref=tx.collection('users').doc(openid),user=(await ref.get()).data
        if(!user||user.deletedAt) fail('ACCOUNT_UNAVAILABLE','账号不可用')
        const grants = identity.normalizeGrants(user.avatarGrants)
        if([shape,...Object.keys(patch)].some(id=>id!=='round'&&!grants[id])) fail('AVATAR_LOCKED','该形象尚未解锁')
        const avatarColors={...identity.normalizeColors(user),...patch,[shape]:event.color}
        await ref.update({data:{avatarShape:shape,avatarColor:event.color,avatarColors:db.command.set(avatarColors),avatarGrants:db.command.set(grants),updatedAt:now()}})
        return ok({avatarShape:shape,avatarColor:event.color,avatarColors})
      })
    },
    async rewardSeen({openid,event}) {
      if(!Array.isArray(event.shapes)||event.shapes.length>identity.SHAPES.length||event.shapes.some(s=>!identity.normalizeShape(s))) fail('INVALID_REWARD','奖励无效')
      return runTransaction(async tx=>{
        const ref=tx.collection('users').doc(openid), user=(await ref.get()).data
        if(!user||user.deletedAt) fail('ACCOUNT_UNAVAILABLE','账号不可用')
        const grants=identity.normalizeGrants(user.avatarGrants)
        event.shapes.map(identity.normalizeShape).forEach(shape=>{if(grants[shape]&&!grants[shape].seenAt) grants[shape]={...grants[shape],seenAt:now()}})
        await ref.update({data:{avatarGrants:db.command.set(grants)}});return ok()
      })
    }
  }
}
