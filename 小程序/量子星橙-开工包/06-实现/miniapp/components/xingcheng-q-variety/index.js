const Appearance=require('../xingcheng-q-motion/appearance')
const Visibility=require('../../utils/animation-visibility')
const Motion=require('../xingcheng-q-motion/core')
const Followup=require('../xingcheng-q-motion/followup')
const Emotions=require('../xingcheng-q-motion/emotions')
const Draw=require('./draw')
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t
function ease(n,t){const x=clamp(t);if(/inOut/.test(n))return-(Math.cos(Math.PI*x)-1)/2;if(/backOut/.test(n)){const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}if(/out/.test(n))return 1-Math.pow(1-x,/expo/.test(n)?7:3);if(/in/.test(n))return Math.pow(x,3);return x}
function valueAt(track,t,fallback){if(!track)return fallback;let v=fallback;for(const q of track){if(t<q.start)break;if(t>=q.end)v=q.to;else return mix(q.from,q.to,ease(q.ease,(t-q.start)/(q.end-q.start)))}return v}
function compile(initial,tweens){const tracks={};tweens.slice().sort((a,b)=>a[0]-b[0]).forEach(([start,duration,props,e='inOut'])=>Object.keys(props).forEach(k=>{const tr=tracks[k]||(tracks[k]=[]);tr.push({start,end:start+duration,from:valueAt(tr,start,initial[k]),to:props[k],ease:e})}));return tracks}

const CALIBRATE=[
 [.2,.65,{trackAlpha:1},'out'],[.55,.7,{x:172,y:342,rotation:8,scaleX:.86,scaleY:.86},'out'],[1.32,.55,{x:235,y:322,rotation:-7,eyeX:-14,eyeY:-8},'inOut'],[1.92,.55,{x:300,y:326,rotation:7,eyeX:14},'inOut'],[2.52,.4,{x:256,y:344,rotation:0,eyeX:0,eyeY:7,scaleX:1.08,scaleY:.82},'backOut'],
 [3.02,.55,{split:1,scaleX:.6,scaleY:1.28,eyeOpenL:1.16,eyeOpenR:1.16},'out'],[3.62,.9,{cloneBeat:3.4,repair:.28},'inOut'],[4.62,1.05,{cloneBeat:7.2,repair:.64},'inOut'],[5.77,1.15,{cloneBeat:11.4,repair:1},'inOut'],[7.02,.38,{split:.72,sparkle:.75},'backOut'],[7.42,.48,{split:0,x:256,y:321,scaleX:.88,scaleY:1.12,smile:1},'backOut'],
 [8.05,.55,{x:338,y:267,rotation:-18,scaleX:.76,scaleY:.76},'inOut'],[8.62,.5,{x:405,y:247,rotation:12},'inOut'],[9.14,.48,{x:328,y:286,rotation:-7},'inOut'],[9.72,.4,{x:256,y:318,rotation:0,scaleX:1,scaleY:1,smile:0,wink:.92,sparkle:1},'backOut'],[10.2,.32,{wink:0,sparkle:.28},'backOut'],[10.85,.8,{trackAlpha:.42,sparkle:0,y:326},'out']
]
const SEAL=[
 [.25,.8,{mapAlpha:1,mapScale:1},'backOut'],[1.18,.45,{eyeY:18,y:154,scaleX:.9,scaleY:.76},'inOut'],[1.7,.35,{handAlpha:1,handLX:164,handLY:176,handRX:348,handRY:176,eyeX:-10,rotation:-5},'backOut'],[2.12,.38,{eyeX:12,rotation:5},'inOut'],[2.65,.42,{handAlpha:0,y:115,scaleX:.62,scaleY:1.28,stamp:.35,eyeX:0,eyeY:8},'in'],
 [3.07,.45,{stamp:1,scaleX:1.18,scaleY:.68,y:150,rotation:4},'backOut'],[3.62,.42,{y:267,scaleX:1.38,scaleY:.44,stamp:1.2,eyeOpenL:.22,eyeOpenR:.22},'in'],[4.04,.24,{sealGlow:1,sealTurn:2.5,mapScale:1.08,sparkle:1},'out'],[4.38,.45,{y:191,scaleX:.78,scaleY:1.18,stamp:.62,eyeOpenL:1.08,eyeOpenR:1.08},'backOut'],[4.88,.36,{y:231,scaleX:1.1,scaleY:.8,stamp:.25,rotation:-6},'in'],
 [5.35,.5,{x:164,y:302,scaleX:.62,scaleY:.62,stamp:0,rotation:-16,eyeX:15,eyeY:-10},'backOut'],[5.96,.28,{x:188,y:285,rotation:7,wink:.9},'inOut'],[6.38,.52,{wink:0,x:256,y:173,scaleX:.9,scaleY:.9,rotation:0,smile:1},'backOut'],[7.02,.65,{sealTurn:5.2,sealGlow:1.22,sparkle:.7},'inOut'],[7.78,.34,{y:153,scaleX:.84,scaleY:.96,rotation:-4},'inOut'],[8.12,.34,{y:169,rotation:4},'inOut'],[8.62,.15,{smile:0,wink:.92,rotation:0},'in'],[8.77,.34,{wink:0,sparkle:.22,sealGlow:.92},'backOut'],[9.45,.8,{mapScale:.92,mapAlpha:.88,y:173,scaleX:.88,scaleY:.88,sparkle:0},'out']
]
const RECHARGE=[
 [.2,.9,{moonAlpha:1,moonScale:1,moonRotation:.04},'backOut'],[.72,.72,{y:240,rotation:16,scaleX:.72,scaleY:1.18},'in'],[1.44,.42,{y:303,rotation:-7,scaleX:1.22,scaleY:.64,bean:.8},'backOut'],[1.86,.5,{y:275,rotation:3,scaleX:1.02,scaleY:.9,bean:.48},'backOut'],[2.55,.5,{eyeOpenL:.2,eyeOpenR:.2,eyeY:8,rotation:-5,bean:.72},'inOut'],
 [3.08,1.1,{charge:.28,moonRotation:-.025,y:281,scaleX:1.04,scaleY:.86},'inOut'],[4.28,1.15,{charge:.58,moonRotation:.03,y:271,scaleX:.98,scaleY:.94},'inOut'],[5.1,.55,{beadAlpha:1,beadX:391,beadY:159,beadTurn:2.2},'out'],[5.72,.55,{beadX:330,beadY:209,beadTurn:4.4},'inOut'],[6.3,.35,{beadX:288,beadY:242,beadScale:.78},'in'],
 [6.65,.28,{x:244,y:281,rotation:-12,scaleX:1.12,scaleY:.78,eyeOpenL:1.18,eyeOpenR:1.18,eyeX:14,eyeY:-12,beadX:312,beadY:208},'backOut'],[7.02,.52,{beadX:368,beadY:176,beadTurn:7.5,eyeX:18,rotation:8},'inOut'],[7.58,.5,{beadX:297,beadY:245,beadScale:.48,eyeX:5,rotation:-4},'in'],[8.08,.35,{beadAlpha:0,charge:1,sparkle:1,smile:1,scaleX:.94,scaleY:1.02,bean:.34,y:265},'out'],
 [8.5,.4,{y:250,rotation:7},'backOut'],[8.94,.36,{y:273,rotation:-5},'inOut'],[9.42,.15,{smile:0,wink:.92,rotation:0},'in'],[9.57,.4,{wink:0,eyeOpenL:.32,eyeOpenR:.32,eyeY:8,sparkle:.28},'backOut'],[10.2,1.2,{y:279,scaleX:1.03,scaleY:.87,moonRotation:-.02},'inOut'],[11.4,1.2,{y:269,scaleX:.98,scaleY:.94,moonRotation:.018},'inOut'],[12.62,.8,{sparkle:0,moonRotation:0,charge:1,y:274,scaleX:1,scaleY:.91,bean:.46},'out']
]

function make(name){const s=Draw.base();let mode='calibrate',list=CALIBRATE,duration=12.4;if(name==='completion-seal'){mode='seal';list=SEAL;duration=11.6;Object.assign(s,{x:256,y:142,scaleX:.82,scaleY:.82,eyeY:11,mapAlpha:0,mapScale:.18})}else if(name==='moon-recharge'){mode='recharge';list=RECHARGE;duration=14.2;Object.assign(s,{x:256,y:-118,scaleX:.78,scaleY:.78,moonX:256,moonY:244,moonScale:.2,bean:0,beadX:448,beadY:97})}else Object.assign(s,{x:86,y:373,scaleX:.76,scaleY:.76,eyeX:12,eyeY:-9});return{initial:s,tracks:compile(s,list),duration,mode}}
function playback(name){
  const scene=make(name)
  scene.sample=t=>{const state=Object.assign({},scene.initial);Object.keys(scene.tracks).forEach(key=>{state[key]=valueAt(scene.tracks[key],t,state[key])});return state}
  if(name==='completion-seal')scene.motion=Motion.createMotion(scene,'complete')
  else if(name==='orbit-repair'||name==='moon-recharge')scene.motion=Followup.createMotion(scene,name==='moon-recharge'?'recharge':'calibrate')
  const emotion={'completion-seal':'proud','orbit-repair':'regroup','moon-recharge':'restful'}[name]
  if(emotion){const original=scene.motion;scene.motion={sample(t,mode){return Emotions.emotionPose(original.sample(t,mode),emotion,t,mode)}}}
  return scene
}

const FRAME_MS=32
const POLISHED_FRAME_MS=1000/60
Component({
  properties:{obscured:{type:Boolean,value:false,observer(){Visibility.sync(this)}},active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},scene:{type:String,value:'orbit-repair',observer(){this.restart(true)}},size:{type:Number,value:144,observer(){this.refreshFallback()}},motion:{type:String,value:'auto',observer(){this.restart()}},playToken:{type:null,value:0,observer(){this.restart(true)}},loop:{type:Boolean,value:false}},
  data:{canvasReady:true,fallbackSrc:'/assets/xingcheng-q/static/06-calibrate.png'},
  lifetimes:{attached(){Visibility.attach(this,'.xingcheng-q-variety');wx.nextTick(()=>{if(this._attached)this.init()})},detached(){Visibility.detach(this);this._ready=false}},
  pageLifetimes:{show(){this._visible=true;Visibility.sync(this)},hide(){this._visible=false;Visibility.sync(this)}},
  methods:{
    viewportWidth(){
      try{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();return Number(info.windowWidth)||0;}catch(e){return 0;}
    },
    fallbackFor(src){return Appearance.assetForSize(src,this.properties.size,this.viewportWidth());},
    refreshFallback(){
      const src=this.properties.scene==='completion-seal'?'/assets/xingcheng-q/static/07-seal.png':this.properties.scene==='moon-recharge'?'/assets/xingcheng-q/static/08-recharge.png':'/assets/xingcheng-q/static/06-calibrate.png',next=this.fallbackFor(src),width=this.viewportWidth();
      if(this.data.fallbackSrc!==next)this.setData({fallbackSrc:next});
      if(this._ctx&&this._canvas&&width>0)Appearance.setViewport(this._ctx,Number(this.properties.size)*width/750,this._canvas.width);
    },
    pauseAnimation(){this.stop()},
    resumeAnimation(){if(!this._ready)return;if(this._finished&&this.properties.loop&&!Motion.isStill(this.properties.motion))this.restart(true);else if(!this._finished)this.play()},
    fail(){const src=this.properties.scene==='completion-seal'?'/assets/xingcheng-q/static/07-seal.png':this.properties.scene==='moon-recharge'?'/assets/xingcheng-q/static/08-recharge.png':'/assets/xingcheng-q/static/06-calibrate.png';this.stop();this._ready=false;this.setData({canvasReady:false,fallbackSrc:this.fallbackFor(src)})},
    init(){if(this._attached===false)return;this.createSelectorQuery().select('#qCanvas').fields({node:true,size:true}).exec(r=>{if(this._attached===false)return;try{const i=r&&r[0];if(!i||!i.node){this.fail();return}const d=Math.min(2,wx.getWindowInfo?wx.getWindowInfo().pixelRatio:wx.getSystemInfoSync().pixelRatio);this._canvas=i.node;this._ctx=i.node.getContext('2d');if(!this._ctx){this.fail();return}i.node.width=Math.max(1,Math.round(i.width*d));i.node.height=Math.max(1,Math.round(i.height*d));this._ctx.setTransform(i.node.width/512,0,0,i.node.height/512,0,0);Appearance.setViewport(this._ctx,i.width,i.node.width);this._ready=true;this.restart(true)}catch(e){this.fail()}})},
    draw(t){
      try{
        if(!this._ctx)return false
        const scene=this._scene||(this._scene=playback(this.properties.scene))
        const state=scene.motion?scene.motion.sample(t,this.properties.motion):scene.sample(t)
        Draw.paint(this._canvas,this._ctx,state,scene.mode)
        return true
      }catch(e){this.fail();return false}
    },
    play(){
      if(!this._ready||!this._canvas||this._raf!=null||!Visibility.canPlay(this)||Motion.isStill(this.properties.motion))return
      const scene=this._scene||(this._scene=playback(this.properties.scene))
      const started=Date.now()-(this._elapsed||0)*1000,token=this._runToken
      const frameMs=scene.motion?POLISHED_FRAME_MS:FRAME_MS
      const frameDue=scene.motion?Motion.createFramePacer(frameMs):null
      this._lastDrawAt=0
      const tick=()=>{
        if(token!==this._runToken||!Visibility.canPlay(this))return
        const now=Date.now(),t=Math.min(scene.duration,(now-started)/1000)
        this._elapsed=t
        const due=frameDue?frameDue(now,t>=scene.duration):!this._lastDrawAt||now-this._lastDrawAt>=frameMs||t>=scene.duration
        if(due){this._lastDrawAt=now;if(!this.draw(t))return}
        if(t>=scene.duration){
          this._raf=null;this._finished=true;this._elapsed=scene.duration
          this.triggerEvent('playend',{scene:this.properties.scene})
          if(token===this._runToken&&this.properties.loop&&Visibility.canPlay(this)&&!Motion.isStill(this.properties.motion))this._loopTimer=setTimeout(()=>{this._loopTimer=null;if(token===this._runToken&&Visibility.canPlay(this))this.restart(true)},900)
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
      if(this._loopTimer)clearTimeout(this._loopTimer);this._loopTimer=null
    },
    restart(force){
      this.refreshFallback()
      this.stop();this._elapsed=0;this._finished=false;this._scene=playback(this.properties.scene)
      if(!this._ready||!Visibility.canPlay(this))return
      if(Motion.isStill(this.properties.motion))this.draw(this._scene.duration)
      else if(force||this.properties.motion==='auto')this.play()
    }
  }
})
