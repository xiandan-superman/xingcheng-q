'use strict'
const catalog = require('./avatar-catalog.json')
const coloration = require('./avatar-colors')(catalog)
const SHAPES = catalog.shapes.map(s => s.id)
const COLORS = catalog.colors.map(c => c.id)
const DEFAULT_RULES = catalog.rules
const aliases = catalog.legacyShapeAliases
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const LEGACY_REWARDS = ['blob','star','capsule','rice','hexagon','cloud','drop']
function normalizeShape(id) {
  if (typeof id !== 'string') return ''
  if (SHAPES.includes(id)) return id
  return own(aliases,id) ? aliases[id] : ''
}
function validateRules(rules) {
  if (!Array.isArray(rules) || ![7,10].includes(rules.length)) throw new Error('必须保留十种形象的奖励配置')
  const normalized = new Map()
  for (const r of rules) {
    const shape = r && normalizeShape(r.shape)
    if (!r || !SHAPES.slice(1).includes(shape) || normalized.has(shape) || !['answers','logins'].includes(r.metric) || !Number.isInteger(r.target) || r.target < 1 || r.target > 100000 || typeof r.enabled !== 'boolean') throw new Error('奖励配置无效')
    normalized.set(shape,{shape,metric:r.metric,target:r.target,enabled:r.enabled})
  }
  // Upgrade precisely the old seven-rule configuration; never silently fill an incomplete new one.
  if (rules.length === 7 && !LEGACY_REWARDS.every(shape => normalized.has(shape))) throw new Error('旧版奖励配置不完整')
  return DEFAULT_RULES.map(rule => normalized.get(rule.shape) || {...rule})
}
function earlier(a,b) {
  if (a === undefined || a === null) return b
  if (b === undefined || b === null) return a
  const first = new Date(a).getTime(), second = new Date(b).getTime()
  return Number.isFinite(second) && (!Number.isFinite(first) || second < first) ? b : a
}
function normalizeGrants(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const grants = {}
  // Canonical grants win metadata conflicts; an older grant date or seen flag is never lost.
  for (const id of SHAPES) if (own(source,id) && source[id] && typeof source[id] === 'object' && !Array.isArray(source[id])) grants[id] = {...source[id]}
  for (const [oldID,id] of Object.entries(aliases)) {
    const old = own(source,oldID) && source[oldID]
    if (!old || typeof old !== 'object' || Array.isArray(old)) continue
    if (!grants[id]) grants[id] = {...old}
    else {
      const current = grants[id]
      grants[id] = {...old,...current,unlockedAt:earlier(old.unlockedAt,current.unlockedAt)}
      if (old.seenAt || current.seenAt) grants[id].seenAt = earlier(old.seenAt,current.seenAt)
    }
  }
  return grants
}
function homeCompanions(user, grants = normalizeGrants(user.avatarGrants)) {
  const owned = SHAPES.filter(id => id === 'round' || grants[id])
  const selected = Array.isArray(user.homeCompanionShapes) ? user.homeCompanionShapes.map(normalizeShape) : owned
  return [...new Set(['round',...selected])].filter(id => owned.includes(id)).slice(0,5)
}
function publicProfile(user) {
  const avatarShape=normalizeShape(user.avatarShape)||catalog.defaultShape,avatarColors=coloration.normalize(user)
  return { nickname: user.nickname || '星橙学生', gender: user.gender || 'undisclosed',
    schoolId:user.schoolId || '', schoolName:user.schoolName || '', schoolVersion:user.schoolVersion || '',
    phoneMasked:user.phoneNumber ? user.phoneNumber.slice(0,3)+'****'+user.phoneNumber.slice(-4) : '',
    phoneBound:!!user.phoneNumber, avatarShape, avatarColor:avatarColors[avatarShape],avatarColors,homeCompanionShapes:homeCompanions(user) }
}
function grantsFor(user, rules, answerCount, stamp) {
  const grants = normalizeGrants(user.avatarGrants)
  if (!grants.round) grants.round = {unlockedAt:user.createdAt || stamp,reason:'default'}
  for (const r of rules) if (r.enabled && !grants[r.shape] && (r.metric === 'answers' ? answerCount : user.loginDays || 0) >= r.target) {
    grants[r.shape] = {unlockedAt:stamp,reason:r.metric,target:r.target}
  }
  return grants
}
module.exports = {SHAPES,COLORS,DEFAULT_RULES,validateRules,normalizeShape,normalizeGrants,publicProfile,grantsFor,homeCompanions,normalizeColors:coloration.normalize,parseColorPatch:coloration.parsePatch}
