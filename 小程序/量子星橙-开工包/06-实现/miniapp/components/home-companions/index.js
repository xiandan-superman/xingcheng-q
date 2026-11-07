const {Stage,neutral}=require('./behavior')
const createAppearance=require('./appearance')
const createCollection=require('./collection')
const Visibility=require('../../utils/animation-visibility')
const account=require('../../services/answer-draft')
Component({
  properties:{
    growth:{type:Object,value:null,observer(value){if(this._attached)this.applyGrowth(value)}},
    active:{type:Boolean,value:true,observer(){Visibility.sync(this)}},
    obscured:{type:Boolean,value:false,observer(){Visibility.sync(this)}},
    motion:{type:String,value:'auto',observer(){this.pauseAnimation();Visibility.sync(this)}},
    calm:{type:Boolean,value:false},heroReady:{type:Boolean,value:false}
  },
  data:{canvasReady:true,displayCards:[]},
  lifetimes:{
    attached(){this._appearance=createAppearance();this._Collection=createCollection(this._appearance).Collection;this.bindOwner();Visibility.attach(this,'.companion-band');if(this.properties.growth)this.applyGrowth(this.properties.growth)},
    ready(){this.init()},
    detached(){this.persist();this.touchCancel();Visibility.detach(this);clearTimeout(this._initTimer)}
  },
  pageLifetimes:{show(){this.bindOwner();this._visible=true;Visibility.sync(this)},hide(){this.persist();this.touchCancel();this._visible=false;Visibility.sync(this)}},
  methods:{
    bindOwner(){
      const owner=account.owner();if(this._collection&&this._owner===owner)return
      this.pauseAnimation();this._owner=owner;this._storageKey=owner?'xingchengq:homeCompanions:v1:'+owner:''
      let cache={};try{if(this._storageKey)cache=wx.getStorageSync(this._storageKey)||{}}catch(_){}
      this._behaviorHistory=cache.behaviorHistory;this._behaviorRevision=-1
      this._welcomed=Array.isArray(cache.welcomed)?cache.welcomed:[];this._welcomeQueue=Array.isArray(cache.queue)?cache.queue:[]
      this._collection=new this._Collection({owned:cache.owned||['round'],selected:cache.selected||['round'],profile:cache.profile||{}})
      this._growthReady=false;this._stage=null;this._resume=cache.resume;this.seed(this._collection.selected)
      this.updateCards()
    },
    seed(ids){
      const history=this._stage?this._stage.behaviorHistory:this._behaviorHistory
      const stage=this._stage=new Stage(this._width||300,1,this._appearance,{history});stage.setScale(this._scale||1);stage.setRoster(ids.length?ids:['round']);stage.clip=null
      stage.pets.forEach((p,i)=>Object.assign(p,neutral,{id:p.id,x:ids.length===1?stage.width*.5:22+i*(stage.width-44)/Math.max(1,ids.length-1),alpha:1}))
    },
    applyGrowth(growth){
      if(!growth||!growth.profile||!Array.isArray(growth.cards))return
      this.bindOwner();if(growth.owner&&growth.owner!==this._owner)return
      this._cards=growth.cards
      const owned=['round',...growth.cards.filter(c=>c.unlocked&&c.shape!=='round').map(c=>c.shape)]
      const first=!this._growthReady,selected=growth.profile.homeCompanionShapes||this._collection.selected
      this._collection=new this._Collection({owned,selected:growth.profile.homeCompanionShapes?selected:owned,profile:growth.profile})
      const newIds=growth.cards.filter(c=>c.isNew&&c.unlocked&&c.shape!=='round').map(c=>c.shape)
      this._welcomeQueue=this._collection.selected.filter(id=>(newIds.includes(id)||this._welcomeQueue.includes(id))&&!this._welcomed.includes(id))
      const current=this._appearance.normalize(this._stage&&this._stage.clip&&this._stage.clip.plan.welcomeId)
      const ids=this._collection.selected.filter(id=>!this._welcomeQueue.includes(id)||id===current)
      if(first){this.seed(ids);if(this._resume&&this._collection.selected.includes(this._resume.clip&&this._resume.clip.plan.welcomeId))try{this._stage.restore(this._resume);this._stage.resize(this._width||300)}catch(_){this.seed(ids)}this._resume=null}
      else if(JSON.stringify(this._stage.pets.map(p=>this._appearance.normalize(p.id)))!==JSON.stringify(ids))this._stage.setRoster(ids)
      this._growthReady=true;this.updateCards();this.persist();this.resumeAnimation()
    },
    updateCards(){
      if(!this._collection)return
      const displayCards=this._collection.selected.map(id=>({id,color:this._appearance.get(id).color.id}))
      this.setData({displayCards})
    },
    persist(){
      if(!this._storageKey||this._owner!==account.owner()||!this._collection)return
      const profile=this._collection.profile,resume=this._stage&&this._stage.clip&&this._stage.clip.plan.name==='welcome'?this._stage.serialize():null
      const behaviorHistory=this._stage&&this._stage.behaviorHistory
      try{wx.setStorageSync(this._storageKey,{owned:this._collection.owned,selected:this._collection.selected,profile:{avatarShape:profile.avatarShape,avatarColors:profile.avatarColors},welcomed:this._welcomed,queue:this._welcomeQueue,resume,behaviorHistory})}catch(_){}
    },
    init(){
      if(this._attached===false||this._ready||this._initPending||!this.data.canvasReady)return
      this._initPending=true
      this.createSelectorQuery().select('#companionCanvas').fields({node:true,size:true}).exec(result=>{
        this._initPending=false;if(this._attached===false)return
        const item=result&&result[0]
        if(!item||!item.node||!item.width||!item.height){if(!Visibility.canPlay(this))return;if((this._attempts||0)<4){this._attempts=(this._attempts||0)+1;this._initTimer=setTimeout(()=>this.init(),60);return}this.fallback();return}
        try{
          const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync(),dpr=Math.min(2,info.pixelRatio||1)
          this._canvas=item.node;this._ctx=item.node.getContext('2d');if(!this._ctx)throw Error('No canvas')
          item.node.width=Math.round(item.width*dpr);item.node.height=Math.round(item.height*dpr);this._ctx.scale(dpr,dpr)
          this._width=item.width;this._height=item.height;this._scale=(info.windowWidth||390)/390
          this._stage.resize(item.width);this._stage.setScale(this._scale);this._ready=true;this.paint();this.resumeAnimation()
        }catch(_){this.fallback()}
      })
    },
    fallback(){this.pauseAnimation();this._ready=false;this.setData({canvasReady:false});this.notifyActivity()},
    pauseAnimation(){this._runToken=(this._runToken||0)+1;if(this._canvas&&this._raf!=null)this._canvas.cancelAnimationFrame(this._raf);this._raf=null;this._running=false},
    resumeAnimation(){
      if(!this._attached||!this._collection||!Visibility.canPlay(this))return
      if(!this._ready){if(this.data.canvasReady)this.init();return}
      if(this.properties.motion==='still'){this._welcomed=[...new Set([...this._welcomed,...this._welcomeQueue])];this._welcomeQueue=[];this.seed(this._collection.selected);this.persist();this.paint();this.notifyActivity();return}
      if(this._running)return
      const token=this._runToken;this._running=true;this._lastAt=Date.now();this._lastPaint=0
      const tick=()=>{
        if(token!==this._runToken||!Visibility.canPlay(this))return
        try{
          const now=Date.now(),dt=Math.min(.1,Math.max(0,(now-this._lastAt)/1000));this._lastAt=now
          this._stage.tick(dt,{calm:this.properties.calm});this.consumeFinished();this.maybeWelcome();this.notifyActivity()
          if(this._behaviorRevision!==this._stage.mixer.revision){this.persist();this._behaviorRevision=this._stage.mixer.revision}
          if(now-this._lastPaint>=1000/30){this.paint();this._lastPaint=now}
          if(this._stage.clip&&this._stage.clip.plan.name==='welcome'&&now-(this._persistAt||0)>500){this.persist();this._persistAt=now}
          this._raf=this._canvas.requestAnimationFrame(tick)
        }catch(_){this.fallback()}
      };this._raf=this._canvas.requestAnimationFrame(tick)
    },
    maybeWelcome(){
      if(!this.properties.heroReady||this.properties.calm||this._stage.playing||!this._welcomeQueue.length)return
      const id=this._welcomeQueue[0]
      if(this._stage.pets.some(p=>this._appearance.normalize(p.id)===id)){this._welcomeQueue.shift();return}
      this._stage.start('welcome',{id})
    },
    consumeFinished(){
      while(this._stage.finished.length){const event=this._stage.finished.shift();if(event.name==='welcome'){
        if(!this._welcomed.includes(event.id))this._welcomed.push(event.id)
        this._welcomeQueue=this._welcomeQueue.filter(id=>id!==event.id)
        if(!this._stage.playing)this._stage.pets.forEach(p=>{p.id=this._appearance.normalize(p.id)||p.id})
        this.persist()
      }}
    },
    notifyActivity(){
      const clip=this._stage&&this._stage.clip,name=clip?clip.plan.name:'',state={welcoming:name==='welcome',foreground:Boolean(name&&name!=='quiet'&&name!=='gather')}
      const signature=JSON.stringify(state);if(signature===this._activity)return;this._activity=signature;this.triggerEvent('activitychange',state)
    },
    paint(){
      const c=this._ctx,stage=this._stage;if(!c||!stage)return
      c.clearRect(0,0,this._width,this._height);const floor=this._height-4*this._scale,r=stage.radius
      for(const p of stage.pets){if(p.alpha<=0)continue;c.save();c.globalAlpha=(p.alpha||0)*.12;c.fillStyle='#574021';c.beginPath();c.ellipse(p.x,floor+1,r*.83/(1+p.lift/45),2.1*this._scale,0,0,Math.PI*2);c.fill();c.restore()}
      if(stage.prop){const p=stage.prop;c.save();c.globalAlpha=p.alpha;c.fillStyle='#ff9a31';c.translate(p.x,floor-p.lift);c.beginPath();[[0,-p.r],[p.r*.25,-p.r*.25],[p.r,0],[p.r*.25,p.r*.25],[0,p.r],[-p.r*.25,p.r*.25],[-p.r,0],[-p.r*.25,-p.r*.25]].forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill();c.restore()}
      for(const p of stage.pets)this._appearance.draw(c,this._appearance.get(p.id),p.x,floor,r,p)
    },
    touchStart(e){
      if(this.properties.motion==='still'||this.properties.obscured)return
      const touch=e.touches&&e.touches[0];if(!touch)return
      const pending=this._touch={id:'',x:touch.clientX,y:touch.clientY,long:false}
      this.createSelectorQuery().select('.companion-touch').boundingClientRect(rect=>{
        if(!rect||!this._stage||this._touch!==pending)return
        const x=touch.clientX-rect.left,y=touch.clientY-rect.top,floor=rect.height-4*this._scale
        const p=this._stage.pets.find(p=>{const m=this._stage.measure(p);return Math.abs(p.x-x)<Math.max(22,m.width/2)&&y>floor-p.lift-m.height-12&&y<floor-p.lift+12})
        if(!p)return;this._touch={id:p.id,x:touch.clientX,y:touch.clientY,long:false};this._hold=setTimeout(()=>{if(this._touch){this._touch.long=true;this._stage.react(p.id,true)}},550)
      }).exec()
    },
    touchMove(e){const t=e.touches&&e.touches[0];if(t&&this._touch&&Math.hypot(t.clientX-this._touch.x,t.clientY-this._touch.y)>9)this.touchCancel()},
    touchEnd(){if(this._touch&&this._touch.id&&!this._touch.long)this._stage.react(this._touch.id,false);this.touchCancel()},
    touchCancel(){clearTimeout(this._hold);this._hold=null;this._touch=null}
  }
})
