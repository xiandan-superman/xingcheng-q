const api=require('../../services/student'),avatar=require('../../utils/avatar')
const account=require('../../services/answer-draft')
Component({
  properties:{enabled:{type:Boolean,value:true,observer(value){this.notifyVisibility(Boolean(value&&this.data.reward));if(value)this.check()}}},
  data:{reward:null,busy:false,message:''},
  lifetimes:{attached(){this._active=true;this.check()},detached(){this._active=false}},
  pageLifetimes:{show(){this._active=true;this.setData({busy:false});this.check()},hide(){this._active=false;this.setData({reward:null},()=>this.notifyVisibility(false))}},
  methods:{
    notifyVisibility(visible){if(this._rewardVisible===visible)return;this._rewardVisible=visible;this.triggerEvent('visibilitychange',{visible})},
    async check(){if(!this._active||this._pending||!this.properties.enabled)return;this._pending=true
      try{const owner=account.owner(),r=await api.growthGet();if(!this._active||!this.properties.enabled||owner!==account.owner())return;this._cards=r.cards;this._owner=owner;this._rewards=r.cards.filter(c=>c.isNew&&c.unlocked);this._profile=r.profile;this.notifyGrowth();this.next()}
      catch(e){/* Reward evaluation is retried on the next visible page; learning stays usable. */}
      finally{this._pending=false}
    },
    notifyGrowth(){this.triggerEvent('growthupdated',{profile:this._profile,cards:this._cards,owner:this._owner})},
    next(){const card=this._rewards&&this._rewards[0],visible=Boolean(card&&this.properties.enabled);if(visible)this.notifyVisibility(true);this.setData({reward:card?{...card,name:avatar.names[card.shape],color:avatar.colorFor(this._profile||{},card.shape)}:null,message:''},()=>{if(!visible)this.notifyVisibility(false)})},
    async accept(e){if(this.data.busy||!this.data.reward)return;this.setData({busy:true,message:''})
      try{const shape=this.data.reward.shape,color=this.data.reward.color;if(e.currentTarget.dataset.use){const saved=await api.avatarSave({shape,color});if(saved)this._profile={...this._profile,...saved};this.triggerEvent('avatarupdated',{shape,color,avatarColors:this._profile&&this._profile.avatarColors})}
        await api.rewardSeen([shape]);if(!this._active||this._owner!==account.owner())return;this._cards=this._cards.map(c=>c.shape===shape?{...c,isNew:false}:c);this._rewards.shift();this.notifyGrowth();this.next()
      }catch(e){if(this._active)this.setData({message:e.message})}finally{if(this._active)this.setData({busy:false})}
    }
  }
})
