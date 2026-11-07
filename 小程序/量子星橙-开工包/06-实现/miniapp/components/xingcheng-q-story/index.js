const Appearance=require('../xingcheng-q-motion/appearance')
const Visibility=require('../../utils/animation-visibility')
const Motion=require('../xingcheng-q-motion/core')
const Followup=require('../xingcheng-q-motion/followup')
const Expressions=require('../xingcheng-q-motion/expressions')
const Emotions=require('../xingcheng-q-motion/emotions')
const Draw = require('./draw')

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const mix = (a, b, t) => a + (b - a) * t
const easing = (name, t) => {
  const x = clamp(t)
  if (/inOut/.test(name)) return -(Math.cos(Math.PI * x) - 1) / 2
  if (/backOut/.test(name)) { const c1 = 1.70158; return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }
  if (/out/.test(name)) return 1 - Math.pow(1 - x, /expo/.test(name) ? 7 : 3)
  if (/in/.test(name)) return Math.pow(x, 3)
  return x
}

function valueAt(track, t, fallback) {
  if (!track || !track.length) return fallback
  let value = fallback
  for (const seg of track) {
    if (t < seg.start) break
    if (t >= seg.end) value = seg.to
    else return mix(seg.from, seg.to, easing(seg.ease, (t - seg.start) / (seg.end - seg.start)))
  }
  return value
}

function compile(initial, tweens) {
  const tracks = {}
  tweens.slice().sort((a, b) => a[0] - b[0]).forEach(([start, duration, props, ease = 'inOut']) => {
    Object.keys(props).forEach((key) => {
      const track = tracks[key] || (tracks[key] = [])
      track.push({ start, end:start + duration, from:valueAt(track, start, initial[key]), to:props[key], ease })
    })
  })
  return tracks
}

const IDEA = [
  [.15,.7,{rotation:-5,eyeX:-14,eyeY:8,scaleX:1.04,scaleY:.96},'inOut'], [.9,.7,{rotation:5,eyeX:12},'inOut'], [1.5,.18,{eyeOpenL:.18,eyeOpenR:.18,y:334},'in'], [1.68,.28,{eyeOpenL:.8,eyeOpenR:.9,y:326},'backOut'],
  [2.05,.52,{thoughtAlpha:1,thoughtScale:1,eyeX:16,eyeY:-17,rotation:3,confusion:1},'backOut'], [2.6,1.05,{thoughtOrbit:2.4},'inOut'], [2.85,.36,{handAlpha:1,handLX:-92,handLY:-15,handRX:103,handRY:-48,pebble:.4},'backOut'], [3.28,.66,{handRX:78,handRY:-78,thoughtOrder:.45,thoughtOrbit:4.4},'inOut'], [3.94,.3,{handRX:112,handRY:-20,thoughtOrder:.08,rotation:-8,scaleX:1.12,scaleY:.88},'backOut'], [4.24,.34,{rotation:0,scaleX:1,scaleY:1},'backOut'],
  [4.72,.4,{eyeX:0,eyeY:-13,confusion:.35,handLX:-75,handLY:-54,handRX:75,handRY:-52},'inOut'], [5.18,.26,{eyeOpenL:.2,eyeOpenR:.2,y:334,scaleX:1.08,scaleY:.92},'in'], [5.44,.52,{eyeOpenL:1.02,eyeOpenR:1.02,y:315,scaleX:.94,scaleY:1.08,thoughtOrder:1,thoughtOrbit:6.2,confusion:0},'backOut'], [5.96,.32,{y:326,scaleX:1,scaleY:1},'out'],
  [6.38,.3,{thoughtSolved:1,starGlow:1.3,halo:.62,realization:1,eyeOpenL:1.18,eyeOpenR:1.18},'out'], [6.88,.48,{x:238,y:294,smile:1,cheek:.9,joy:1,handLX:-118,handLY:-32,handRX:116,handRY:-34,rotation:5},'backOut'], [7.42,.28,{rotation:-5,y:305},'inOut'], [7.7,.28,{rotation:4,y:294},'inOut'],
  [8.15,.54,{thoughtScale:.72,thoughtX:305,thoughtY:202,thoughtSolved:.7,handLX:-75,handLY:-78,handRX:78,handRY:-78,realization:0},'inOut'], [8.69,.38,{thoughtScale:.18,thoughtX:250,thoughtY:252,thoughtAlpha:0,thoughtSolved:0,starGlow:1.55,sparkle:1,sparkleSpread:1.25,scaleX:1.12,scaleY:.9},'in'], [9.07,.34,{y:276,scaleX:.92,scaleY:1.12},'backOut'], [9.41,.28,{y:304,scaleX:1.03,scaleY:.97},'in'], [9.69,.3,{y:294,scaleX:1,scaleY:1,rotation:0},'backOut'],
  [10.05,.16,{smile:0,wink:.92,handRX:118,handRY:-20},'in'], [10.21,.34,{wink:0,smile:.35,joy:.25,sparkle:.3},'backOut'], [10.72,.68,{smile:0,cheek:0,joy:0,sparkle:0,handAlpha:0,starGlow:.32,y:304},'out']
]

const CATCH = [
  [.25,.7,{resultAlpha:1,resultX:382,resultY:108,resultScale:1,resultRotation:2.2,eyeX:16,eyeY:-17,eyeOpenL:1.08,eyeOpenR:1.08,rotation:4},'out'], [1.02,.62,{resultX:324,resultY:175,resultRotation:4.4,handAlpha:1,handRX:112,handRY:-54,eyeX:12},'inOut'], [1.65,.35,{handRX:74,handRY:-86,x:261,y:292,scaleX:.94,scaleY:1.08},'backOut'],
  [2.05,.42,{resultX:174,resultY:262,resultRotation:7.2,handRX:90,handRY:-10,eyeX:-18,eyeY:-8,rotation:-10},'in'], [2.47,.38,{resultX:91,resultY:356,resultScale:.78,resultRotation:9.5,x:280,rotation:9,scaleX:1.14,scaleY:.86},'in'], [2.85,.28,{resultX:48,resultY:427,resultAlpha:.15,realization:1,eyeOpenL:1.2,eyeOpenR:1.2,handLX:-122,handLY:20,handRX:120,handRY:18},'in'], [3.13,.3,{resultAlpha:0,x:252,y:318,rotation:0,scaleX:1.08,scaleY:.92},'backOut'], [3.48,.38,{realization:0,confusion:1,eyeX:-10,eyeY:9,rotation:-5,handLX:-92,handLY:45,handRX:92,handRY:45},'inOut'],
  [4.15,.42,{confusion:0,signalAlpha:1,signalX:416,signalY:112,signalScale:.7,eyeX:17,eyeY:-16,rotation:4},'backOut'], [4.57,.35,{signalAlpha:0,resultAlpha:1,resultX:397,resultY:118,resultScale:.88,resultRotation:11,handLX:-92,handLY:-62,handRX:92,handRY:-62},'out'], [4.98,.42,{y:334,scaleX:1.2,scaleY:.78,eyeX:0,eyeY:-16,handLX:-76,handLY:-82,handRX:76,handRY:-82},'in'], [5.4,.48,{catchArc:1,resultX:254,resultY:173,resultScale:1.16,resultRotation:13.2,y:274,scaleX:.86,scaleY:1.17,handLX:-65,handLY:-95,handRX:65,handRY:-95},'backOut'],
  [5.95,.36,{resultX:254,resultY:225,resultScale:.76,resultRotation:14.2,catchArc:.25,y:302,scaleX:1.08,scaleY:.92,starGlow:1.15},'in'], [6.31,.25,{resultAlpha:0,catchArc:0,starGlow:1.65,halo:.7,sparkle:1,sparkleSpread:1.3,smile:1,cheek:.95,joy:1,scaleX:.94,scaleY:1.1},'out'], [6.65,.42,{y:276,rotation:7,handLX:-124,handLY:-18,handRX:124,handRY:-18},'backOut'], [7.1,.3,{y:300,rotation:-6},'inOut'], [7.4,.3,{y:282,rotation:4},'inOut'],
  [7.85,.48,{checkAlpha:1,checkScale:1,checkDraw:1,smile:.72,eyeX:11,eyeY:-9},'backOut'], [8.42,.34,{x:241,rotation:-4,handRX:101,handRY:-66},'inOut'], [8.76,.28,{x:256,rotation:0,handRX:116,handRY:-45},'backOut'], [9.16,.15,{smile:0,wink:.92,starGlow:.86},'in'], [9.31,.34,{wink:0,smile:.3,starGlow:.42},'backOut'], [9.82,.72,{smile:0,cheek:0,joy:.15,sparkle:.18,handAlpha:0,checkScale:.86,checkAlpha:.88,y:300},'out'], [10.54,.38,{joy:0,sparkle:0},'out']
]

function createScene(name) {
  const s = Draw.baseState()
  const idea = name === 'idea-bubble'
  Object.assign(s, idea
    ? {x:222,y:326,pebble:.22,eyeX:-7,eyeY:6,eyeOpenL:.78,eyeOpenR:.88,handAlpha:0,thoughtX:350,thoughtY:142}
    : {x:248,y:310,eyeY:-6,handAlpha:0,resultX:448,resultY:50,resultScale:.65})
  return { initial:s, tracks:compile(s, idea ? IDEA : CATCH), duration:idea ? 11.8 : 11.2 }
}

function playback(name,expression){
  if(name==='curiosity-discovery'){
    const duration=Emotions.SCENES.curiosity.duration
    return {duration,motion:{sample(t,mode){const state=Emotions.curiosityBase(Draw.baseState(),t,mode);return Emotions.emotionPose(state,'curiosity',t,mode)}}}
  }
  if(name==='focus-companion'){
    const duration=Expressions.SCENES.focus.duration
    return {duration,loop:true,motion:{sample(t,mode){const time=Motion.isStill(mode)?duration:clamp(t,0,duration);return Expressions.expressionPose(Expressions.focusBase(Draw.baseState(),time),'focus',time,mode)}}}
  }
  const scene=createScene(name)
  scene.sample=t=>{const state=Object.assign({},scene.initial);Object.keys(scene.tracks).forEach(key=>{state[key]=valueAt(scene.tracks[key],t,state[key])});return state}
  if(name==='idea-bubble')scene.motion=Motion.createMotion(scene,'thinking')
  else if(name==='star-catch'||name==='result-catch')scene.motion=Followup.createMotion(scene,'capture')
  const emotion=name==='idea-bubble'?'insight':expression==='approval'&&scene.motion?'approval':''
  if(emotion){const original=scene.motion;scene.motion={sample(t,mode){return Expressions.expressionPose(original.sample(t,mode),emotion,t,mode)}}}
  return scene
}

const FRAME_MS=32
const POLISHED_FRAME_MS=1000/60
Component({
  properties: {
    obscured:{type:Boolean,value:false,observer(){Visibility.sync(this)}},
    active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},
    scene: {type:String,value:'idea-bubble',observer(){this.restart(true)}},
    size: {type:Number,value:152,observer(){this.refreshFallback()}},
    expression: {type:String,value:'',observer(){this.restart(true)}},
    motion: {type:String,value:'auto',observer(){this.restart()}},
    playToken: {type:null,value:0,observer(){this.restart(true)}}
  },
  data:{canvasReady:true,fallbackSrc:'/assets/xingcheng-q/static/04-ponder.png'},
  lifetimes: {attached(){Visibility.attach(this,'.xingcheng-q-scene');wx.nextTick(()=>{if(this._attached)this.initCanvas()})},detached(){Visibility.detach(this);this._ready=false}},
  pageLifetimes:{show(){this._visible=true;Visibility.sync(this)},hide(){this._visible=false;Visibility.sync(this)}},
  methods: {
    viewportWidth(){
      try{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();return Number(info.windowWidth)||0;}catch(e){return 0;}
    },
    fallbackFor(src){return Appearance.assetForSize(src,this.properties.size,this.viewportWidth());},
    refreshFallback(){
      const src=(this.properties.scene==='result-catch'||this.properties.scene==='star-catch')?'/assets/xingcheng-q/static/05-confirm.png':'/assets/xingcheng-q/static/04-ponder.png',next=this.fallbackFor(src),width=this.viewportWidth();
      if(this.data.fallbackSrc!==next)this.setData({fallbackSrc:next});
      if(this._ctx&&this._canvas&&width>0)Appearance.setViewport(this._ctx,Number(this.properties.size)*width/750,this._canvas.width);
    },
    pauseAnimation(){this.stop()},
    resumeAnimation(){if(this._ready&&!this._finished)this.play()},
    fail(){this.stop();this._ready=false;this.setData({canvasReady:false,fallbackSrc:this.fallbackFor((this.properties.scene==='result-catch'||this.properties.scene==='star-catch')?'/assets/xingcheng-q/static/05-confirm.png':'/assets/xingcheng-q/static/04-ponder.png')})},
    initCanvas(){
      if(this._attached===false)return
      this.createSelectorQuery().select('#qCanvas').fields({node:true,size:true}).exec((res)=>{if(this._attached===false)return;try{
        const item=res&&res[0];if(!item||!item.node){this.fail();return}
        const dpr=Math.min(2,wx.getWindowInfo?wx.getWindowInfo().pixelRatio:wx.getSystemInfoSync().pixelRatio)
        this._canvas=item.node;this._ctx=item.node.getContext('2d');if(!this._ctx){this.fail();return}
        item.node.width=Math.max(1,Math.round(item.width*dpr));item.node.height=Math.max(1,Math.round(item.height*dpr))
        this._ctx.setTransform(item.node.width/512,0,0,item.node.height/512,0,0);Appearance.setViewport(this._ctx,item.width,item.node.width);this._ready=true;this.restart(true)
      }catch(e){this.fail()}})
    },
    draw(t){
      try{
        if(!this._ctx)return false
        const scene=this._scene||(this._scene=playback(this.properties.scene,this.properties.expression))
        const state=scene.motion?scene.motion.sample(t,this.properties.motion):scene.sample(t)
        Draw.paint(this._canvas,this._ctx,state)
        return true
      }catch(e){this.fail();return false}
    },
    play(){
      if(!this._ready||!this._canvas||this._raf!=null||!Visibility.canPlay(this)||Motion.isStill(this.properties.motion))return
      const scene=this._scene||(this._scene=playback(this.properties.scene,this.properties.expression))
      const started=Date.now()-(this._elapsed||0)*1000,token=this._runToken
      const frameMs=scene.motion?POLISHED_FRAME_MS:FRAME_MS
      const frameDue=scene.motion?Motion.createFramePacer(frameMs):null
      this._lastDrawAt=0
      const tick=()=>{
        if(token!==this._runToken||!Visibility.canPlay(this))return
        const now=Date.now(),elapsed=(now-started)/1000,t=scene.loop?elapsed%scene.duration:Math.min(scene.duration,elapsed)
        this._elapsed=elapsed
        const due=frameDue?frameDue(now,!scene.loop&&t>=scene.duration):!this._lastDrawAt||now-this._lastDrawAt>=frameMs||t>=scene.duration
        if(due){this._lastDrawAt=now;if(!this.draw(t))return}
        if(!scene.loop&&t>=scene.duration){
          this._raf=null;this._finished=true;this._elapsed=scene.duration
          this.triggerEvent('playend',{scene:this.properties.scene})
          
          return
        }
        this._raf=this._canvas.requestAnimationFrame(tick)
      }
      this._raf=this._canvas.requestAnimationFrame(tick)
    },
    stop(){
      this._runToken=(this._runToken||0)+1
      if(this._canvas&&this._raf!=null)this._canvas.cancelAnimationFrame(this._raf)
      this._raf=null
      
    },
    restart(force){
      this.refreshFallback()
      this.stop();this._elapsed=0;this._finished=false;this._scene=playback(this.properties.scene,this.properties.expression)
      if(!this._ready||!Visibility.canPlay(this))return
      if(Motion.isStill(this.properties.motion))this.draw(this._scene.duration)
      else if(force||this.properties.motion==='auto')this.play()
    }
  }
})
