const Appearance=require('../xingcheng-q-motion/appearance')
const Visibility=require('../../utils/animation-visibility')
const BUILDERS={loading:require('./scenes/loading'),empty:require('./scenes/empty'),offline:require('./scenes/offline'),failure:require('./scenes/failure'),recovered:require('./scenes/recovered'),resume:require('./scenes/resume'),reminder:require('./scenes/reminder'),report:require('./scenes/report'),makeup:require('./scenes/makeup'),signal:require('./scenes/signal'),waiting:require('./scenes/waiting')}
const META={
  loading:['01-加载-量子点扫描-V1-结束静态图.png','星橙Q正在扫描星题',6.4],empty:['02-空数据-Q寻找后摊手-V1-结束静态图.png','星橙Q没有找到内容',8.4],offline:['03-断网-天线打结-V1-结束静态图.png','星橙Q正在检查网络',8.8],failure:['04-提交失败-信号舱熄火-V2-结束静态图.png','星橙Q提交失败',7.8],recovered:['05-网络恢复-青色信号接入-V1-结束静态图.png','星橙Q已重新连接网络',6.6],resume:['06-继续练习-进度接续-V2-结束静态图.png','星橙Q接续未完成练习',6.4],reminder:['07-提醒成功-提醒确认-V2-结束静态图.png','星橙Q已设置提醒',6.4],report:['01-星轨报告-分享静态图-V2.png','星橙Q展开星轨报告',11.8],makeup:['02-回溯补能-倒转打捞-V1-静态终帧.png','星橙Q完成回溯补能',11.4],signal:['03-校准反馈-靶心确认-V2-静态终帧.png','星橙Q已提交反馈',6.2],waiting:['04-等待邀请-邀请卡等待-V2-静态终帧.png','星橙Q等待邀请',6.5]
}
const Motion=require('../xingcheng-q-motion/core')
const LoadingMotion=require('./loading-motion')
const FRAME_MS=32
Component({
  properties:{active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},scene:{type:String,value:'loading',observer(){this.restart()}},size:{type:Number,value:160,observer(){this.refreshFallback()}},motion:{type:String,value:'auto',observer(){this.restart()}},playToken:{type:null,value:0,observer(){this.restart()}},once:{type:Boolean,value:true}},
  data:{fallbackSrc:'/assets/xingcheng-q/formal/01-加载-量子点扫描-V1-结束静态图.png',label:'',canvasReady:true,settled:false,canvasShown:false,settling:false},
  lifetimes:{attached(){Visibility.attach(this,'.scene-motion');this._runId=0;this.restart()},detached(){Visibility.detach(this);this.release()}},
  pageLifetimes:{show(){this._visible=true;Visibility.sync(this)},hide(){this._visible=false;Visibility.sync(this)}},
  methods:{
    viewportWidth(){
      try{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();return Number(info.windowWidth)||0;}catch(e){return 0;}
    },
    fallbackFor(src){return Appearance.assetForSize(src,this.properties.size,this.viewportWidth());},
    refreshFallback(){
      const src='/assets/xingcheng-q/formal/'+META[this.sceneName()][0],next=this.fallbackFor(src),width=this.viewportWidth();
      if(this.data.fallbackSrc!==next)this.setData({fallbackSrc:next});
      if(this._ctx&&this._canvas&&width>0)Appearance.setViewport(this._ctx,Number(this.properties.size)*width/750,this._canvas.width);
    },
    pauseAnimation(){this._runId=(this._runId||0)+1;this.stop()},
    resumeAnimation(){
      if(this._raf!=null||this._delay!=null||!Visibility.canPlay(this)||Motion.isStill(this.properties.motion)||this.data.settled)return
      if(this._loopRemaining!=null){this.scheduleLoop(this._loopRemaining,this._runId);return}
      if(this._ready&&this._scene)this.play(this.sceneName(),META[this.sceneName()][2],this._runId)
      else this.restart()
    },
    scheduleLoop(ms,run){
      if(!Visibility.canPlay(this))return
      this._loopRemaining=ms;this._delayDeadline=Date.now()+ms
      this._delay=setTimeout(()=>{this._delay=null;this._delayDeadline=null;this._loopRemaining=null;if(run===this._runId&&Visibility.canPlay(this))this.restart(true)},ms)
    },
    sceneName(){return BUILDERS[this.properties.scene]?this.properties.scene:'loading'},
    fail(name,run){if(run!==undefined&&run!==this._runId)return;const key=BUILDERS[name]?name:'loading',meta=META[key];this.stop();this.release();this.setData({canvasReady:false,settled:true,canvasShown:false,settling:false,fallbackSrc:this.fallbackFor('/assets/xingcheng-q/formal/'+meta[0]),label:meta[1]})},
    release(){this._ready=false;this._canvas=null;this._ctx=null;this._scene=null},
    stop(){if(this._canvas&&this._raf!=null)this._canvas.cancelAnimationFrame(this._raf);this._raf=null;if(this._delay!=null){this._loopRemaining=Math.max(0,(this._delayDeadline||Date.now())-Date.now());clearTimeout(this._delay)}this._delay=null;this._delayDeadline=null;if(this._settleTimer)clearTimeout(this._settleTimer);this._settleTimer=null},
    restart(fromLoop){
      this.refreshFallback()
      const run=this._runId=(this._runId||0)+1;this.stop();this._elapsed=0;this._cycle=0;this._loopRemaining=null;if(!this._attached)return
      const name=this.sceneName(),meta=META[name],app=getApp&&getApp(),still=Motion.isStill(this.properties.motion)||!!(app&&app.globalData&&app.globalData.reduceMotion)
      const base={label:meta[1],fallbackSrc:this.fallbackFor('/assets/xingcheng-q/formal/'+meta[0]),canvasReady:true,canvasShown:false,settling:false}
      if(still){this.release();this.setData(Object.assign(base,{settled:true}));return}
      if(!Visibility.canPlay(this)){this.setData(Object.assign(base,{settled:false}));return}
      if(!this._ready||this.data.settled){this.release();this.setData(Object.assign(base,{settled:false}),()=>wx.nextTick(()=>this.init(fromLoop,run)));return}
      this.begin(name,fromLoop,run)
    },
    init(fromLoop,run){
      if(run!==this._runId||!Visibility.canPlay(this)||this.data.settled)return
      this.createSelectorQuery().select('#sceneCanvas').fields({node:true,size:true}).exec(res=>{
        if(run!==this._runId)return
        const name=this.sceneName()
        try{
          const item=res&&res[0];if(!item||!item.node){this.fail(name,run);return}
          const dpr=Math.min(2,wx.getWindowInfo?wx.getWindowInfo().pixelRatio:wx.getSystemInfoSync().pixelRatio)
          this._canvas=item.node;this._ctx=item.node.getContext('2d');if(!this._ctx){this.fail(name,run);return}
          item.node.width=Math.max(1,Math.round(item.width*dpr));item.node.height=Math.max(1,Math.round(item.height*dpr));this._ctx.setTransform(item.node.width/512,0,0,item.node.height/512,0,0);Appearance.setViewport(this._ctx,item.width,item.node.width)
          this._ready=true;this.begin(name,fromLoop,run)
        }catch(e){this.fail(name,run)}
      })
    },
    begin(name,fromLoop,run){
      if(run!==this._runId)return
      try{this._scene=name==='loading'?LoadingMotion(this._canvas):BUILDERS[name](this._canvas);this.play(name,META[name][2],run)}catch(e){this.fail(name,run)}
    },
    settle(name,run){
      if(run!==this._runId)return;const meta=META[name];this.release();if(this._attached)this.setData({settled:true,canvasShown:false,settling:false,canvasReady:true,fallbackSrc:this.fallbackFor('/assets/xingcheng-q/formal/'+meta[0]),label:meta[1]});this.triggerEvent('playend',{scene:name})
    },
    play(name,duration,run){
      const started=Date.now()-(this._elapsed||0)*1000,scene=this._scene,canvas=this._canvas,continuous=name==='loading'
      const frameDue=continuous?Motion.createFramePacer(1000/60):null
      let cycle=this._cycle||0;this._lastDrawAt=0
      const tick=()=>{try{
        if(run!==this._runId||!Visibility.canPlay(this))return
        const now=Date.now(),t=(now-started)/1000;this._elapsed=t
        if(frameDue?frameDue(now):!this._lastDrawAt||now-this._lastDrawAt>=FRAME_MS||t>=duration){this._lastDrawAt=now;scene.timeline.seek(continuous?t:Math.min(t,scene.timeline.duration()));if(!this.data.canvasShown)this.setData({canvasShown:true})}
        if(continuous){
          const completed=Math.floor(t/duration)
          if(completed>cycle){cycle=completed;this._cycle=cycle;this.triggerEvent('playend',{scene:name})}
          if(run===this._runId&&Visibility.canPlay(this))this._raf=canvas.requestAnimationFrame(tick)
          return
        }
        if(t>=duration){this._raf=null;if(name==='loading'||name==='waiting'||!this.properties.once){this.triggerEvent('playend',{scene:name});this.scheduleLoop(name==='waiting'?4000:40,run)}else this.settle(name,run);return}
        this._raf=canvas.requestAnimationFrame(tick)
      }catch(e){this.fail(name,run)}}
      this._raf=canvas.requestAnimationFrame(tick)
    }
  }
})
