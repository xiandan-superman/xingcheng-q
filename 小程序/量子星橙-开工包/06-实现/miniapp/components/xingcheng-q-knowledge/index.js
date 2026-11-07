const DURATION = 6.2
const TAU = Math.PI * 2

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const mix = (a, b, t) => a + (b - a) * t
const phase = (t, start, duration) => clamp((t - start) / duration)
const smooth = (v) => v * v * (3 - 2 * v)
const outCubic = (v) => 1 - Math.pow(1 - v, 3)
const inCubic = (v) => v * v * v
const inOutSine = (v) => -(Math.cos(Math.PI * v) - 1) / 2

function between(t, keys) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const prev = keys[i - 1]
    const next = keys[i]
    if (t <= next[0]) return mix(prev[1], next[1], inOutSine((t - prev[0]) / (next[0] - prev[0])))
  }
  return keys[keys.length - 1][1]
}

function sceneAt(t) {
  const s = {
    x: 234, y: 286, rotation: 0, scaleX: 1, scaleY: 1,
    eyeX: 0, eyeY: 0, eyeOpenL: 0.94, eyeOpenR: 0.94,
    pull: 0, pullAngle: -0.55, starGlow: 0.26, halo: 0.14,
    orbit: 0, intake: 0, absorbPulse: 0,
    moteA: 0, moteB: 0, moteC: 0, moteProgress: 0,
    sparkle: 0, wink: 0
  }

  s.moteA = outCubic(phase(t, 0.12, 0.2))
  s.moteB = outCubic(phase(t, 0.42, 0.2))
  s.moteC = outCubic(phase(t, 0.7, 0.2))
  s.orbit = outCubic(phase(t, 0.72, 0.26))
  s.moteProgress = inCubic(phase(t, 0.72, 2.55))

  s.eyeX = between(t, [[0,0],[0.22,0],[0.52,15],[0.82,7],[1.12,17],[1.48,-8],[1.82,14],[2.18,-7],[2.54,18],[3.22,0],[6.2,0]])
  s.eyeY = between(t, [[0,0],[0.22,0],[0.52,-10],[0.82,-14],[1.12,-5],[1.48,-13],[1.82,-3],[2.18,-12],[2.54,-10],[3.22,11],[3.72,0],[6.2,0]])
  s.x = between(t, [[0,234],[1.02,234],[1.42,247],[1.78,222],[2.16,249],[2.52,226],[2.92,250],[3.18,234],[3.5,234],[3.72,234],[6.2,234]])
  s.y = between(t, [[0,286],[1.02,286],[1.42,276],[1.78,298],[2.16,276],[2.52,296],[2.92,276],[3.18,304],[3.42,260],[3.72,286],[6.2,286]])
  s.rotation = between(t, [[0,0],[0.52,5],[1.02,0],[1.42,-7],[1.78,8],[2.16,-8],[2.52,7],[2.92,-5],[3.18,0],[4.42,0],[4.68,-4],[4.96,0],[6.2,0]])
  s.scaleX = between(t, [[0,1],[1.02,1],[1.42,1.09],[1.78,.93],[2.16,1.1],[2.52,.92],[2.92,1.14],[3.18,1.22],[3.42,.88],[3.72,1.04],[4.02,1],[6.2,1]])
  s.scaleY = between(t, [[0,1],[1.02,1],[1.42,.92],[1.78,1.08],[2.16,.91],[2.52,1.09],[2.92,.88],[3.18,.78],[3.42,1.18],[3.72,.97],[4.02,1],[6.2,1]])

  if (t >= 1.1 && t < 3.24) s.pull = t < 1.48 ? smooth(phase(t, 1.1, .38)) * 1.28 : t < 2.96 ? 1.28 : mix(1.28, 0, smooth(phase(t, 2.96, .28)))
  if (t >= 1.28 && t < 3.06) s.intake = inCubic(phase(t, 1.28, 1.78))
  if (t >= 2.28) s.moteC = t < 2.4 ? 1 - inCubic(phase(t, 2.28, .12)) : 0
  if (t >= 2.58) s.moteB = t < 2.7 ? 1 - inCubic(phase(t, 2.58, .12)) : 0
  if (t >= 2.88) s.moteA = t < 3 ? 1 - inCubic(phase(t, 2.88, .12)) : 0

  if (t >= 2.28 && t < 3.2) {
    const first = t < 2.52 ? outCubic(phase(t, 2.28, .14)) : mix(1, .25, phase(t, 2.52, .18))
    const second = t >= 2.58 && t < 2.84 ? outCubic(phase(t, 2.58, .14)) : 0
    const third = t >= 2.88 ? outCubic(phase(t, 2.88, .14)) : 0
    const beat = Math.max(first, second, third)
    s.absorbPulse = beat
    s.starGlow = mix(.26, 1.65, beat)
    s.halo = mix(.14, .72, beat)
  }
  if (t >= 3.12 && t < 4.18) s.sparkle = t < 3.38 ? outCubic(phase(t, 3.12, .26)) : 1 - smooth(phase(t, 3.38, .8))
  if (t >= 4.18 && t < 4.58) {
    const close = phase(t, 4.18, .1)
    const open = phase(t, 4.28, .3)
    s.eyeOpenL = s.eyeOpenR = t < 4.28 ? mix(.94, .16, close) : mix(.16, 1, outCubic(open))
  }
  if (t >= 4.62 && t < 5.1) s.wink = t < 4.76 ? phase(t, 4.62, .14) * .9 : mix(.9, 0, outCubic(phase(t, 4.76, .34)))
  return s
}

function roundedCapsule(ctx, x, y, w, h, rotation, alpha) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha *= alpha
  const r = Math.min(w, h) / 2
  ctx.beginPath()
  ctx.moveTo(-w / 2 + r, -h / 2)
  ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r)
  ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r)
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r)
  ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r)
  ctx.closePath()
  ctx.fillStyle = '#FFF8EE'
  ctx.fill()
  ctx.restore()
}

function fourStar(ctx, x, y, outer, inner, fill, alpha, rotation) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation || 0)
  ctx.globalAlpha *= alpha == null ? 1 : alpha
  ctx.beginPath()
  for (let i = 0; i < 8; i += 1) {
    const a = -Math.PI / 2 + i * Math.PI / 4
    const r = i % 2 === 0 ? outer : inner
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}

const motes = [
  { color: '#FFC857', orbit: 176, phase: -.25, size: 11, kind: 'star' },
  { color: '#35C7D8', orbit: 144, phase: .58, size: 8, kind: 'ring' },
  { color: '#FF7B42', orbit: 116, phase: 1.38, size: 7, kind: 'dot' }
]

function bodyPath(ctx, s) {
  ctx.beginPath()
  for (let i = 0; i <= 96; i += 1) {
    const theta = i / 96 * TAU
    const delta = Math.atan2(Math.sin(theta - s.pullAngle), Math.cos(theta - s.pullAngle))
    const nose = Math.exp(-(delta * delta) / .15) * s.pull * .36
    const counter = Math.exp(-Math.pow(Math.abs(delta) - Math.PI, 2) / .65) * s.pull * .06
    const soft = Math.sin(theta * 2 + .45) * s.pull * .022
    const r = 126 * (1 + nose - counter + soft)
    const x = Math.cos(theta) * r + nose * 18
    const y = Math.sin(theta) * r + nose * 10
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function orbitPoint(s, m, progress, index) {
  const theta = m.phase + progress * Math.PI * 1.56 + index * .18
  const ex = Math.cos(theta) * m.orbit
  const ey = Math.sin(theta) * m.orbit * .43
  const tilt = -.52
  let x = 248 + ex * Math.cos(tilt) - ey * Math.sin(tilt)
  let y = 267 + ex * Math.sin(tilt) + ey * Math.cos(tilt)
  if (s.intake > 0) {
    const tx = s.x + Math.cos(s.pullAngle) * 115
    const ty = s.y + Math.sin(s.pullAngle) * 115
    const k = Math.min(1, s.intake * (1.15 + index * .1))
    x = mix(x, tx, k); y = mix(y, ty, k)
  }
  return { x, y }
}

function drawCharacter(ctx, s) {
  ctx.save()
  ctx.translate(s.x, s.y)
  ctx.rotate(s.rotation * Math.PI / 180)
  ctx.scale(s.scaleX, s.scaleY)
  const body = ctx.createRadialGradient(-48, -62, 10, 8, 14, 154)
  body.addColorStop(0, '#FFB43F'); body.addColorStop(.34, '#FF9225'); body.addColorStop(.76, '#FF6A1A'); body.addColorStop(1, '#EF4828')
  ctx.fillStyle = body
  ctx.shadowColor = 'rgba(240,68,36,.2)'; ctx.shadowBlur = 20
  bodyPath(ctx, s); ctx.fill(); ctx.shadowBlur = 0
  ctx.save(); bodyPath(ctx, s); ctx.clip()
  const gloss = ctx.createRadialGradient(-54, -68, 0, -48, -62, 70)
  gloss.addColorStop(0, 'rgba(255,255,255,.32)'); gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss; ctx.beginPath(); ctx.arc(-38, -50, 82, 0, TAU); ctx.fill()
  fourStar(ctx, -60, -58, 29 + 5 * s.starGlow, 7, '#FFF3CE', .92, 0)
  roundedCapsule(ctx, -21 + s.eyeX, -3 + s.eyeY, 24, 61 * Math.max(.09, s.eyeOpenL * (1 - s.wink)), 0, 1)
  roundedCapsule(ctx, 25 + s.eyeX, -2 + s.eyeY, 24, 61 * Math.max(.09, s.eyeOpenR), 0, 1)
  ctx.restore(); ctx.restore()
}

function drawTrail(ctx, s, m, index, alpha) {
  if (alpha <= .01 || s.orbit <= .01) return
  ctx.save(); ctx.lineCap = 'round'
  const head = s.moteProgress - index * .055
  for (let i = 0; i < 30; i += 1) {
    const u0 = i / 30, u1 = (i + 1) / 30
    const p0 = orbitPoint(s, m, head - .32 + u0 * .32, index)
    const p1 = orbitPoint(s, m, head - .32 + u1 * .32, index)
    const strength = Math.pow(u1, 1.7)
    ctx.globalAlpha = alpha * s.orbit * (.15 + .85 * strength)
    ctx.strokeStyle = m.color; ctx.lineWidth = 2 + 5 * strength
    ctx.shadowColor = m.color; ctx.shadowBlur = 5
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
  }
  ctx.restore()
}

function drawMote(ctx, s, m, index, alpha) {
  if (alpha <= .01) return
  const p = orbitPoint(s, m, s.moteProgress - index * .055, index)
  ctx.save(); ctx.globalAlpha = alpha * (1 - Math.max(0, s.intake - .72) / .28)
  ctx.shadowColor = m.color; ctx.shadowBlur = 16
  if (m.kind === 'star') fourStar(ctx, p.x, p.y, m.size + 4, 3.2, m.color, 1, s.moteProgress * 3)
  else if (m.kind === 'ring') { ctx.strokeStyle = m.color; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, p.y, m.size, 0, TAU); ctx.stroke() }
  else { ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(p.x, p.y, m.size, 0, TAU); ctx.fill() }
  ctx.restore()
}

function drawFrame(ctx, s) {
  ctx.clearRect(0, 0, 512, 512)
  const alphas = [s.moteA, s.moteB, s.moteC]
  motes.forEach((m, i) => drawTrail(ctx, s, m, i, alphas[i]))
  drawCharacter(ctx, s)
  motes.forEach((m, i) => drawMote(ctx, s, m, i, alphas[i]))
  if (s.sparkle > .01) {
    const stars = [[-41,-24,13,3],[35,-29,9,2],[48,14,7,2],[-29,36,8,2],[3,-47,6,1.5]]
    stars.forEach((p, i) => fourStar(ctx, s.x - 56 + p[0] * s.sparkle, s.y - 58 + p[1] * s.sparkle, p[2] * Math.min(1, s.sparkle * 1.8), p[3], i % 2 ? '#35C7D8' : '#FFC857', 1 - s.sparkle * .18, 0))
  }
}

const FRAME_MS = 32
const INTRO_MS = 620
const START_AT = 0.62
const STOP_AT = 5.1
const DURATION_MS = 6200

Component({
  properties: {
    size: { type: Number, value: 300 },
    motion: { type: String, value: 'auto', observer() { this.restart() } },
    playToken: { type: null, value: 0, observer() { this.restart(true) } }
  },
  data: { phase: 'intro', canvasReady: true },
  lifetimes: {
    attached() { this._visible = true },
    ready() { this.initCanvas() },
    detached() { this.stop() }
  },
  pageLifetimes: {
    show() { this._visible = true; if (this._ready) this.restart() },
    hide() { this._visible = false; this.stop() }
  },
  methods: {
    stop() {
      if (this._phaseTimer) clearTimeout(this._phaseTimer)
      if (this._endTimer) clearTimeout(this._endTimer)
      this._phaseTimer = null
      this._endTimer = null
      if (this._canvas && this._raf) this._canvas.cancelAnimationFrame(this._raf)
      this._raf = null
    },
    fail() {
      this.stop()
      this._ready = false
      this.setData({ canvasReady: false, phase: 'intro' })
    },
    initCanvas() {
      this.createSelectorQuery().select('#qCanvas').fields({ node: true, size: true }).exec((res) => {
        try {
          const item = res && res[0]
          if (!item || !item.node || !item.width || !item.height) { this.fail(); return }
          const dpr = Math.min(2, wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio)
          this._canvas = item.node
          this._ctx = item.node.getContext('2d')
          if (!this._ctx) { this.fail(); return }
          item.node.width = Math.max(1, Math.round(item.width * dpr))
          item.node.height = Math.max(1, Math.round(item.height * dpr))
          this._ctx.setTransform(item.node.width / 512, 0, 0, item.node.height / 512, 0, 0)
          this._ready = true
          this.restart()
        } catch (e) { this.fail() }
      })
    },
    draw(t) {
      try {
        if (!this._ctx) return false
        drawFrame(this._ctx, sceneAt(clamp(t, 0, 6.2)))
        return true
      } catch (e) { this.fail(); return false }
    },
    restart() {
      this.stop()
      if (!this._ready) return
      const app = getApp && getApp()
      const still = this.properties.motion === 'still' || !!(app && app.globalData && app.globalData.reduceMotion) || !this._visible
      if (still) { this.setData({ phase: 'intro' }); return }
      this.setData({ phase: '' }, () => wx.nextTick(() => {
        this.setData({ phase: 'intro' })
        this._phaseTimer = setTimeout(() => this.playCanvas(), INTRO_MS)
      }))
    },
    playCanvas() {
      this._phaseTimer = null
      if (!this.draw(START_AT)) return
      const startedAt = Date.now() - START_AT * 1000
      this.setData({ phase: 'canvas' })
      const tick = () => {
        const now = Date.now()
        const t = (now - startedAt) / 1000
        if (!this._lastDrawAt || now - this._lastDrawAt >= FRAME_MS || t >= STOP_AT) {
          this._lastDrawAt = now
          if (!this.draw(Math.min(t, STOP_AT))) return
        }
        if (t >= STOP_AT) {
          this._raf = null
          this.setData({ phase: 'outro' })
          this._endTimer = setTimeout(() => {
            this._endTimer = null
            this.triggerEvent('playend', { scene: 'quiz-knowledge-stage2' })
          }, DURATION_MS - STOP_AT * 1000)
          return
        }
        this._raf = this._canvas.requestAnimationFrame(tick)
      }
      this._raf = this._canvas.requestAnimationFrame(tick)
    }
  }
})
