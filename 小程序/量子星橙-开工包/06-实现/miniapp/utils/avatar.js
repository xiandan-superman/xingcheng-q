const catalog = require('./avatar-catalog')
const coloration = require('./avatar-colors')(catalog)
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const names = {}
catalog.shapes.forEach(shape => { names[shape.id] = shape.name })
Object.keys(catalog.legacyShapeAliases).forEach(id => { names[id] = names[catalog.legacyShapeAliases[id]] })
const cache = new Map()
const colors = catalog.colors.map(item => Object.assign({}, item, {
  paint: 'linear-gradient(135deg,' + item.ramp[1] + ',' + item.ramp[2] + ' 55%,' + item.ramp[4] + ')'
}))

function normalizeShape(id) {
  if (typeof id !== 'string') return catalog.defaultShape
  if (catalog.shapes.some(shape => shape.id === id)) return id
  return own(catalog.legacyShapeAliases, id) ? catalog.legacyShapeAliases[id] : catalog.defaultShape
}
function number(n) { return Math.round(n * 1000000) / 1000000 }
function eye(x, y, w, h) {
  const rx = w / 2, ry = h * .2, line = h / 2 - ry
  const left = number(x - rx), right = number(x + rx), top = number(y - line), bottom = number(y + line)
  return 'M' + left + ' ' + top + 'A' + rx + ' ' + ry + ' 0 0 1 ' + right + ' ' + top + 'L' + right + ' ' + bottom + 'A' + rx + ' ' + ry + ' 0 0 1 ' + left + ' ' + bottom + 'Z'
}
function starPath(star) {
  const [x, y, d] = star, k = 3.1819805153395 / 33
  return 'M' + [[0,-.5],[k,-k],[.5,0],[k,k],[0,.5],[-k,k],[-.5,0],[-k,-k]].map(p => number(x + p[0] * d) + ' ' + number(y + p[1] * d)).join('L') + 'Z'
}
function gaze(value) { return Number.isFinite(Number(value)) ? Math.max(-8, Math.min(8, Number(value))) : 0 }
function svg(shape, color, options) {
  const body = catalog.shapes.find(item => item.id === normalizeShape(shape))
  const ink = colors.find(item => item.id === color) || colors[0]
  const [cx, cy, gap, w, h] = body.face, opts = options || {}
  const stops = [0,.3,.65,.88,1].map((offset, i) => '<stop offset="' + offset + '" stop-color="' + ink.ramp[i] + '"/>').join('')
  // Preserve accepted contours, capsule eyes and the attached upper-left four-point star.
  // SVG text is ASCII, so wx.arrayBufferToBase64 receives exact portable bytes.
  return '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="-180 -180 360 360"><defs><radialGradient id="body" gradientUnits="userSpaceOnUse" cx="-45.36" cy="-63" r="211.68">' + stops + '</radialGradient><radialGradient id="depth" gradientUnits="userSpaceOnUse" cx="-2.52" cy="-25.2" r="168.84"><stop stop-color="' + ink.shade + '" stop-opacity="0"/><stop offset=".58" stop-color="' + ink.shade + '" stop-opacity="0"/><stop offset="1" stop-color="' + ink.shade + '" stop-opacity=".11764706"/></radialGradient><clipPath id="clip"><path d="' + body.body + '"/></clipPath></defs><path d="' + body.body + '" fill="url(#body)"/><path d="' + body.body + '" fill="url(#depth)"/><g clip-path="url(#clip)"><g fill="' + ink.eyes + '" transform="translate(' + gaze(opts.lookX) + ' ' + gaze(opts.lookY) + ')"><path d="' + eye(cx - gap,cy,w,h) + '"/><path d="' + eye(cx + gap,cy,w,h) + '"/></g><path fill="' + ink.star + '" d="' + starPath(body.star) + '"/></g></svg>'
}
function image(shape, color, options) {
  const id = normalizeShape(shape), ink = colors.find(item => item.id === color) || colors[0], opts = options || {}
  const key = [id,ink.id,gaze(opts.lookX),gaze(opts.lookY)].join(':')
  if (cache.has(key)) return cache.get(key)
  const source = svg(id,ink.id,opts), bytes = new Uint8Array(source.length)
  for (let i = 0; i < source.length; i++) bytes[i] = source.charCodeAt(i)
  const result = 'data:image/svg+xml;base64,' + wx.arrayBufferToBase64(bytes.buffer)
  if (cache.size >= 192) cache.delete(cache.keys().next().value)
  cache.set(key,result)
  return result
}
module.exports = {
  image, svg, names, colors, normalizeShape,
  normalizeColors:coloration.normalize, colorFor:coloration.colorFor,
  primaryColors:colors.filter(item => item.group === 'primary'),
  moreColors:colors.filter(item => item.group === 'more')
}
