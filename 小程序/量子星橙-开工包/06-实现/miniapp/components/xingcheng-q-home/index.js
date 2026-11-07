const Appearance=require('../xingcheng-q-motion/appearance')
const Motion=require('../xingcheng-q-motion/core')
const Player=require('./player')
const {Director}=require('./director')
const Visibility=require('../../utils/animation-visibility')
const account=require('../../services/answer-draft')
const FRAME_MS=1000/60
Component({
  properties:{
    obscured:{type:Boolean,value:false,observer(){Visibility.sync(this)}},size:{type:Number,value:320},
    active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},
    motion:{type:String,value:'auto',observer(){this.pauseAnimation();Visibility.sync(this)}},
    welcoming:{type:Boolean,value:false},smallForeground:{type:Boolean,value:false},
    completed:{type:Boolean,value:false,observer(value,old){if(this._director&&value&&!old){this._director.returned('answer');this.notifyState()}}},
    playToken:{type:null,value:0,observer(){if(this._ready)this.restart()}}
  },
  data:{phase:'fallback',canvasReady:true,playing:false},
  lifetimes:{attached(){Visibility.attach(this,'.home-motion');this._initAttempts=0},ready(){this.init()},detached(){Visibility.detach(this);this._ready=false;this._player=null;clearTimeout(this._initTimer);this._initTimer=null}},
  pageLifetimes:{show(){this._visible=true;if(this._director){if(this._directorOwner!==account.owner())this.restart();else this._director.returned('tab')}Visibility.sync(this)},hide(){this._visible=false;Visibility.sync(this)}},
  methods:{
    stop(){this._runToken=(this._runToken||0)+1;if(this._canvas&&this._raf!=null)this._canvas.cancelAnimationFrame(this._raf);this._raf=null;this._running=false},
    pauseAnimation(){if(this._running&&this._director)this.step(Date.now());this.stop();if(this._attached!==false&&this.data.playing)this.setData({playing:false})},
    step(now){const dt=Math.max(0,(now-this._lastAt)/1000);this._lastAt=now;this._director.tick(dt,{welcoming:this.properties.welcoming,smallForeground:this.properties.smallForeground,reduced:this.isReduced()});this._elapsed=this._director.time;this._canvasMode=this._director.name},
    isReduced(){const app=typeof getApp==='function'&&getApp();return Motion.isStill(this.properties.motion)||!!(app&&app.globalData&&app.globalData.reduceMotion)},
    prepareDirector(){
      const owner=account.owner(),key=owner?'xingchengq:homeOpening:v1:'+owner:''
      this._directorOwner=owner
      let history={};try{if(key)history=wx.getStorageSync(key)||{}}catch(_){}
      this._director=new Director(Player.LIBRARY,{history,remember:value=>{try{if(key&&account.owner()===owner)wx.setStorageSync(key,value)}catch(_){}}})
      this._director.enter({welcoming:this.properties.welcoming})
    },
    notifyState(){
      const d=this._director,state={ready:!!this._ready,full:!!(d&&d.full&&!this.isReduced()),name:d?d.name:'idle',reason:d?d.reason:'quiet'}
      const signature=JSON.stringify(state);if(signature===this._stateSignature)return;this._stateSignature=signature
      if(this.triggerEvent)this.triggerEvent('statechange',state)
    },
    resumeAnimation(){
      if(!this._ready){if(this._attached&&Visibility.canPlay(this))this.init();return}
      if(!Visibility.canPlay(this)||this._running)return
      if(this.isReduced()){
        this._director.tick(0,{reduced:true,welcoming:this.properties.welcoming});this._elapsed=this._director.time
        if(this.data.phase!=='fallback')this.setData({phase:'fallback',playing:false})
        this.notifyState();return
      }
      this.runCanvas()
    },
    fail(){this.stop();this._ready=false;this._player=null;if(this._attached!==false){this.setData({canvasReady:false,phase:'fallback',playing:false});if(this.triggerEvent)this.triggerEvent('statechange',{ready:true,full:false,name:'idle',reason:'fallback'})}},
    init(){
      if(this._attached===false||this._initPending||this._ready)return
      this._initPending=true
      this.createSelectorQuery().select('#homeCanvas').fields({node:true,size:true}).exec(res=>{
        this._initPending=false;if(this._attached===false)return
        try{
          const item=res&&res[0]
          if(!item||!item.node||!item.width||!item.height){if(!Visibility.canPlay(this))return;if((this._initAttempts||0)<4){this._initAttempts=(this._initAttempts||0)+1;this._initTimer=setTimeout(()=>{this._initTimer=null;this.init()},60);return}this.fail();return}
          const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync(),dpr=Math.min(2,info.pixelRatio||1)
          this._canvas=item.node;const ctx=item.node.getContext('2d');if(!ctx){this.fail();return}
          item.node.width=Math.max(1,Math.round(item.width*dpr));item.node.height=Math.max(1,Math.round(item.height*dpr));Appearance.setViewport(ctx,item.width,item.node.width)
          const makeCanvas=(w,h)=>wx.createOffscreenCanvas({type:'2d',width:Math.min(w,item.node.width),height:Math.min(h,item.node.height)})
          this._player=new Player.Renderer(item.node,'candidate',makeCanvas)
          this._ready=true;this.restart()
        }catch(e){this.fail()}
      })
    },
    restart(){this.stop();this._elapsed=0;if(this._player)this._player.reset();this.prepareDirector();if(this._ready)this.resumeAnimation()},
    playIdle(){this.playCanvasMode('idle')},
    playCanvasMode(mode,startAt=0){
      if(!this._ready||(!Player.LIBRARY[mode]&&!mode.startsWith('feedback:')))return
      this.stop();this._director.select(mode);this._director.time=startAt;this._elapsed=startAt;this.resumeAnimation()
    },
    runCanvas(){
      if(!this._player||!this._director||!Visibility.canPlay(this)||this._running)return
      const token=this._runToken,frameDue=Motion.createFramePacer(FRAME_MS)
      this._running=true;this._lastAt=Date.now();this.setData({phase:'canvas',playing:true})
      this._player.render(this._director.name,this._director.time);this._scene=this._player.scene(this._director.name);this.notifyState()
      const tick=()=>{
        if(token!==this._runToken||!Visibility.canPlay(this))return
        try{
          const now=Date.now();this.step(now)
          if(frameDue(now))this._player.render(this._director.name,this._director.time)
          this.notifyState();this._raf=this._canvas.requestAnimationFrame(tick)
        }catch(e){this.fail()}
      }
      this._raf=this._canvas.requestAnimationFrame(tick)
    }
  }
})
