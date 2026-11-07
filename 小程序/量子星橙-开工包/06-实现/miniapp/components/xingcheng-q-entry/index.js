const Appearance=require('../xingcheng-q-motion/appearance')
const Visibility=require('../../utils/animation-visibility')
const Draw = require('./draw')

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const mix = (a, b, t) => a + (b - a) * t
const ease = (name, t) => {
  const x = clamp(t)
  if (/inOut/.test(name)) return -(Math.cos(Math.PI * x) - 1) / 2
  if (/backOut/.test(name)) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }
  if (/out/.test(name)) return 1 - Math.pow(1 - x, /expo/.test(name) ? 7 : 3)
  if (/in/.test(name)) return Math.pow(x, 3)
  return x
}

function valueAt(track, t, fallback) {
  if (!track || !track.length) return fallback
  // Later tweens take ownership as soon as they start. Walking backwards avoids
  // finishing an older overlapping tween and then jumping into a partly elapsed one.
  for (let i = track.length - 1; i >= 0; i--) {
    const seg = track[i]
    if (t < seg.start) continue
    if (t >= seg.end) return seg.to
    return mix(seg.from, seg.to, ease(seg.ease, (t - seg.start) / (seg.end - seg.start)))
  }
  return fallback
}

function compile(initial, tweens) {
  const tracks = {}
  tweens.slice().sort((a, b) => a[0] - b[0]).forEach(([start, duration, props, easing = 'inOut']) => {
    Object.keys(props).forEach((key) => {
      const track = tracks[key] || (tracks[key] = [])
      const from = valueAt(track, start, initial[key])
      track.push({ start, end: start + duration, from, to: props[key], ease: easing })
    })
  })
  return tracks
}

const FIRST_TWEENS = [
  [.2,.85,{portalAlpha:1,portalOpen:1,portalRotation:110},'out'], [.36,.52,{signalAlpha:1,signalX:111,signalY:147,signalScale:.7,signalRotation:2.2},'backOut'], [.96,.28,{signalAlpha:0,signalScale:.2},'in'],
  [1.08,.55,{x:-43,eyeX:18,eyeY:-5,eyeOpenL:.72,eyeOpenR:1.15,rotation:5,confusion:1},'out'], [1.66,.11,{eyeOpenL:.18,eyeOpenR:.18},'in'], [1.77,.2,{eyeOpenL:1,eyeOpenR:1},'backOut'], [2.12,.28,{x:-132,eyeX:5,confusion:0},'in'],
  [2.5,.38,{x:-55,y:318,rotation:-8,eyeX:20,eyeY:-10,eyeOpenL:1.12,eyeOpenR:.74,confusion:.78},'backOut'], [3.02,.25,{x:-118,y:266,confusion:0},'in'],
  [3.38,.88,{x:142,y:266,scaleX:.48,scaleY:1.22,pebble:.55,eyeX:13,eyeY:0,portalRotation:270},'inOut'], [4.26,.42,{x:264,scaleX:1.2,scaleY:.78,cloud:.9,pebble:0,rotation:14,portalRotation:390},'backOut'],
  [4.68,.3,{y:302,scaleX:1.14,scaleY:.74,cloud:.45,eyeY:12},'in'], [4.98,.38,{y:270,scaleX:.92,scaleY:1.1,cloud:.15,eyeY:-5,realization:.82},'backOut'], [5.36,.42,{y:278,scaleX:1,scaleY:1,cloud:0,rotation:0,eyeX:0,eyeY:0,realization:0},'inOut'],
  [5.88,.34,{eyeX:-14,rotation:-5,pebble:.25},'inOut'], [6.28,.4,{eyeX:15,rotation:5},'inOut'], [6.76,.34,{handAlpha:1,handLX:-90,handLY:-16,handRX:92,handRY:34,eyeX:-5,rotation:-2},'backOut'],
  [7.12,.46,{handLX:-62,handLY:-66,handRX:66,handRY:-12,starGlow:.85},'inOut'], [7.58,.26,{handLX:-84,handLY:-38,handRX:80,handRY:-34,starGlow:1.35,halo:.65},'out'], [7.84,.26,{x:275,rotation:8,scaleX:.9,scaleY:1.1,eyeOpenL:1.18,eyeOpenR:1.18,sparkle:1,sparkleSpread:1.15,realization:1},'backOut'], [8.1,.42,{realization:.3},'out'],
  [8.63,.42,{x:256,rotation:0,scaleX:1.03,scaleY:.97,pebble:0,handLX:-105,handLY:35,handRX:118,handRY:-18,portalAlpha:.3,realization:0,smile:1,cheek:.85,joy:1},'out'], [9.13,.22,{handRX:126,handRY:-52},'inOut'], [9.35,.22,{handRX:115,handRY:-12},'inOut'], [9.57,.22,{handRX:126,handRY:-50},'inOut'],
  [9.91,.15,{smile:0,wink:.92,starGlow:.8},'in'], [10.06,.32,{wink:0,smile:.35,starGlow:.34,sparkle:0,portalAlpha:0,joy:.2},'backOut'], [10.48,.62,{handAlpha:0,scaleX:1,scaleY:1,smile:0,cheek:0,joy:0},'out']
]

const WELCOME_TWEENS = [
  [.18,.75,{y:280,scaleX:1.02,scaleY:.98},'inOut'], [.54,.16,{eyeOpenL:.72,eyeOpenR:.72},'in'], [.7,.22,{eyeOpenL:.94,eyeOpenR:.94},'out'], [.94,.75,{y:287,scaleX:.99,scaleY:1.02},'inOut'],
  [1.42,.62,{signalAlpha:1,signalX:405,signalY:170,signalRotation:4},'out'], [1.58,.28,{eyeX:16,eyeY:-10,eyeOpenL:.72,eyeOpenR:1.14,rotation:3,confusion:1},'out'], [2.05,.5,{signalX:370,signalY:236,signalRotation:7},'inOut'], [2.16,.26,{eyeX:-12,eyeY:2,rotation:-4},'inOut'], [2.46,.28,{handAlpha:.72,handRX:104,handRY:26},'backOut'], [2.52,.4,{signalX:356,signalY:285},'inOut'],
  [2.96,.34,{eyeX:-15,eyeY:4,x:238,rotation:-6,pebble:.28},'inOut'], [3.4,.18,{eyeX:12,eyeY:0},'out'], [3.58,.34,{signalX:337,signalY:287,signalScale:.82},'in'], [3.62,.16,{eyeX:-14},'inOut'], [3.92,.22,{x:224,scaleX:1.12,scaleY:.88,eyeX:18,eyeOpenL:1.15,eyeOpenR:1.15,rotation:-10,confusion:0,realization:1},'backOut'],
  [4.58,.52,{x:278,y:154,rotation:28,scaleX:.88,scaleY:1.15,cloud:.45,handAlpha:1,handLX:-120,handLY:0,handRX:122,handRY:-4,ribbonAlpha:.95,ribbonRotation:95,halo:.48,realization:0,smile:1,cheek:.9,joy:1},'out'],
  [5.1,.58,{x:302,y:252,rotation:168,scaleX:1.12,scaleY:.78,cloud:.75,ribbonRotation:220,signalX:388,signalY:183},'inOut'], [5.68,.5,{x:252,y:318,rotation:330,scaleX:1.18,scaleY:.7,cloud:.35,ribbonRotation:340,signalX:320,signalY:266},'in'],
  [6.18,.34,{y:270,rotation:370,scaleX:.92,scaleY:1.1,cloud:.12,ribbonAlpha:.55},'backOut'], [6.52,.34,{y:282,rotation:360,scaleX:1,scaleY:1,cloud:0,pebble:0},'inOut'],
  [6.9,.36,{handRX:90,handRY:-56,signalX:350,signalY:214,eyeX:13,eyeY:-8,rotation:4},'out'], [7.28,.16,{handRX:100,handRY:-66,signalX:355,signalY:208,signalScale:1.35,starGlow:1.35,sparkle:1,sparkleSpread:1.2,joy:1.25},'out'],
  [7.44,.3,{handRX:88,handRY:-48,signalScale:.78,signalAlpha:.25,x:245,scaleX:1.08,scaleY:.92},'out'], [7.74,.28,{x:256,scaleX:.97,scaleY:1.04,rotation:-2},'backOut'], [8.02,.28,{scaleX:1,scaleY:1},'out'],
  [8.3,.3,{eyeX:-12,eyeY:2,handAlpha:0,signalAlpha:0,ribbonAlpha:0,sparkle:.4,smile:0,cheek:.25,joy:0},'inOut'], [8.58,.5,{eyeX:0,eyeY:10,rotation:0,handAlpha:.92,handLX:-118,handLY:111,handRX:118,handRY:111,signAlpha:1,signY:421,signScale:1,signRotation:0},'backOut'], [9.04,.15,{wink:.92,starGlow:.8},'in'], [9.19,.34,{wink:0,eyeY:3,starGlow:.32,sparkle:0,cheek:0},'backOut'], [9.58,.55,{y:282,halo:.14},'out']
]

const RETURN_ARRIVAL_DURATION = 2.8
const RETURN_ARRIVAL = [
  [0,.22,{galaxyAlpha:1,shipAlpha:1,shipThrust:1,ribbonAlpha:.55},'out'],
  [0,1.6,{shipX:238,shipY:286,shipScale:1,shipRotation:.08,galaxyTurn:3.4,x:238,y:251,scaleX:.58,scaleY:.58,alpha:1,ribbonRotation:280,halo:.5},'inOut'],
  [1.6,.42,{shipX:270,shipY:294,shipRotation:-.05,shipThrust:.18,x:270,y:254,scaleX:.64,scaleY:.64,sparkle:.8,sparkleSpread:1.35},'inOut'],
  [2.02,.52,{shipAlpha:0,shipScale:1.18,galaxyAlpha:.28,x:256,y:282,scaleX:1.05,scaleY:.95,rotation:0,ribbonAlpha:.18,starGlow:.85},'inOut'],
  [2.54,.26,{galaxyAlpha:0,ribbonAlpha:0,sparkle:.18,scaleX:1,scaleY:1,starGlow:.34},'out']
]

function makeScene(name) {
  const s = Draw.baseState()
  const first = name === 'first-login'
  Object.assign(s, first
    ? { x:-150,y:266,eyeOpenL:1,eyeOpenR:1,portalX:112,portalY:266 }
    : { x:448,y:64,scaleX:.14,scaleY:.14,eyeX:0,eyeY:0,pebble:.08,handAlpha:0,alpha:1,galaxyAlpha:.12,shipAlpha:.15 })
  if (first) return { initial:s, tracks:compile(s,FIRST_TWEENS), duration:11.3, startAt:.24 }
  s.renderLite = 1
  const continuation = WELCOME_TWEENS.filter((item)=>item[0]>=1.35).map((item)=>[item[0]+RETURN_ARRIVAL_DURATION-1.35,item[1],item[2],item[3]])
  return { initial:s, tracks:compile(s,RETURN_ARRIVAL.concat(continuation)), duration:RETURN_ARRIVAL_DURATION+10.4-1.35, startAt:0 }
}

const FRAME_MS = 16
Component({
  properties: {
    active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},
    scene: { type:String, value:'first-login', observer(){ this.restart(true) } },
    size: { type:Number, value:220 ,observer(){this.refreshFallback()}},
    motion: { type:String, value:'auto', observer(){ this.restart() } },
    playToken: { type:null, value:0, observer(){ this.restart(true) } }
  },
  data: { canvasReady:true, fallbackSrc:'/assets/xingcheng-q/static/02-launch.png' },
  lifetimes: { attached(){ Visibility.attach(this,'.xingcheng-q-entry');wx.nextTick(() => {if(this._attached)this.initCanvas()}) }, detached(){ Visibility.detach(this);this._ready=false } },
  pageLifetimes: { show(){this._visible=true;Visibility.sync(this)},hide(){this._visible=false;Visibility.sync(this)} },
  methods: {
    viewportWidth(){
      try{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();return Number(info.windowWidth)||0;}catch(e){return 0;}
    },
    fallbackFor(src){return Appearance.assetForSize(src,this.properties.size,this.viewportWidth());},
    refreshFallback(){
      const src=this.properties.scene==='first-login'?'/assets/xingcheng-q/static/02-launch.png':'/assets/xingcheng-q/static/01-peek.png',next=this.fallbackFor(src),width=this.viewportWidth();
      if(this.data.fallbackSrc!==next)this.setData({fallbackSrc:next});
      if(this._ctx&&this._canvas&&width>0)Appearance.setViewport(this._ctx,Number(this.properties.size)*width/750,this._canvas.width);
    },
    pauseAnimation(){this.stop()},
    resumeAnimation(){if(this._ready&&!this._finished)this.play()},
    fail(){ this.stop(); this._ready=false; this.setData({canvasReady:false,fallbackSrc:this.fallbackFor(this.properties.scene==='first-login'?'/assets/xingcheng-q/static/02-launch.png':'/assets/xingcheng-q/static/01-peek.png')}) },
    initCanvas(){
      if(this._attached===false)return
      this.createSelectorQuery().select('#qCanvas').fields({node:true,size:true}).exec((res) => {
        if(this._attached===false)return
        try {
          const item = res && res[0]; if (!item || !item.node) { this.fail(); return }
          const deviceDpr = Number(wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 1
          const dpr = Math.min(this.properties.scene === 'welcome-back' ? 1.5 : 2, deviceDpr)
          this._canvas = item.node; this._ctx = item.node.getContext('2d'); if (!this._ctx) { this.fail(); return }
          item.node.width = Math.max(1, Math.round(item.width * dpr)); item.node.height = Math.max(1, Math.round(item.height * dpr))
          this._ctx.setTransform(item.node.width / 512,0,0,item.node.height / 512,0,0);Appearance.setViewport(this._ctx,item.width,item.node.width)
          this._ready = true; this.restart(true)
        } catch (e) { this.fail() }
      })
    },
    draw(t){
      try {
        if (!this._ctx) return false
        const scene = this._scene || (this._scene = makeScene(this.properties.scene))
        const s = Object.assign({}, scene.initial)
        Object.keys(scene.tracks).forEach((key) => { s[key] = valueAt(scene.tracks[key], t, s[key]) })
        Draw.paint(this._canvas, this._ctx, s); return true
      } catch (e) { this.fail(); return false }
    },
    play(){
      if (!this._canvas || this._raf!=null || !Visibility.canPlay(this) || this.properties.motion==='still' || this.properties.motion==='reduced') return
      const scene = this._scene || (this._scene = makeScene(this.properties.scene))
      this._startedAt = Date.now() - (this._elapsed == null ? scene.startAt || 0 : this._elapsed) * 1000; this._lastDrawAt=0
      const token=this._runToken
      const tick = () => {
        if(token!==this._runToken||!Visibility.canPlay(this))return
        const now=Date.now(),t=(now-this._startedAt)/1000; this._elapsed=t
        const due=!this._lastDrawAt||now-this._lastDrawAt>=FRAME_MS||t>=scene.duration
        if (due) { this._lastDrawAt=now; if (!this.draw(t)) return }
        if (t >= scene.duration) { this._raf=null; this._finished=true; this._elapsed=scene.duration; this.triggerEvent('playend',{scene:this.properties.scene}); return }
        this._raf = this._canvas.requestAnimationFrame(tick)
      }
      this._raf = this._canvas.requestAnimationFrame(tick)
    },
    stop(){ this._runToken=(this._runToken||0)+1;if (this._canvas && this._raf!=null) this._canvas.cancelAnimationFrame(this._raf); this._raf=null },
    restart(force){
      this.refreshFallback()
      this.stop(); this._scene=makeScene(this.properties.scene); this._elapsed=this._scene.startAt || 0; this._finished=false
      if (!this._ready || !Visibility.canPlay(this)) return
      if ((this.properties.motion === 'still' || this.properties.motion === 'reduced')) this.draw(this._scene.duration)
      else if (force || this.properties.motion === 'auto') { this.draw(this._elapsed); this.play() }
    }
  }
})
