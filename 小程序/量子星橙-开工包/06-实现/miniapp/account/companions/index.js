const api=require('../../services/student'),avatar=require('../../utils/avatar'),catalog=require('../../utils/avatar-catalog'),nav=require('../../utils/nav-layout'),account=require('../../services/answer-draft')
const {revision}=require('../../services/data-revision')
Page({
  data:{loading:true,saving:false,message:'',saveMessage:'',cards:[],count:1,selected:['round']},
  onLoad(){this.setData(nav());this.load()},
  onShow(){if(this._loaded&&this._owner!==account.owner()){this._loaded=false;this.setData({loading:true,saving:false,cards:[],selected:['round'],count:1})}if(!this._pending&&(!this._loaded||this._owner!==account.owner()||this._growthRevision!==revision('growth')))this.load()},
  onUnload(){this._dead=true;this._loadToken=(this._loadToken||0)+1},
  async load(){
    if(this._pending)return
    this._pending=true;const owner=account.owner(),token=this._loadToken=(this._loadToken||0)+1
    this.setData({loading:true,message:'',saveMessage:''})
    try{
      const growth=await api.growthGet();if(this._dead||token!==this._loadToken||owner!==account.owner())return
      const owned=['round',...growth.cards.filter(c=>c.unlocked&&c.shape!=='round').map(c=>c.shape)]
      const oldDraft=this._loaded&&this._owner===owner?this.data.selected:null
      this._owner=owner;this._loaded=true;this._profile=growth.profile;this._rawCards=growth.cards;this._owned=owned;this._growthRevision=revision('growth')
      const selected=[...new Set(['round',...(oldDraft||growth.profile.homeCompanionShapes||owned)])].filter(id=>owned.includes(id)).slice(0,5)
      this.setData({loading:false,selected,count:selected.length});this.render()
    }catch(e){if(!this._dead&&token===this._loadToken&&owner===account.owner())this.setData({loading:false,message:e.message||'伙伴暂时没读取到，请重试'})}
    finally{this._pending=false;if(!this._dead&&owner!==account.owner())this.load()}
  },
  render(){
    const selected=this.data.selected
    this.setData({cards:catalog.shapes.map(shape=>{
      const unlocked=this._owned.includes(shape.id),raw=this._rawCards.find(c=>c.shape===shape.id||c.key==='reward-'+shape.id)||{}
      return {id:shape.id,name:unlocked?shape.name:'神秘伙伴',color:avatar.colorFor(this._profile,shape.id),unlocked,selected:selected.includes(shape.id),condition:raw.condition||'学习解锁'}
    })})
  },
  choose(e){
    if(this.data.loading||this.data.saving||!this._loaded||this._owner!==account.owner())return
    const id=e.currentTarget.dataset.id
    if(id==='round'){this.setData({saveMessage:'圆团会一直陪在首页。'});return}
    if(!this._owned.includes(id)){this.setData({saveMessage:'获得这位伙伴后，就可以选择展示。'});return}
    let selected=this.data.selected
    if(selected.includes(id))selected=selected.filter(x=>x!==id)
    else if(selected.length>=5){this.setData({saveMessage:'最多展示5只，请先取消一位伙伴。'});return}
    else selected=selected.concat(id)
    this.setData({selected,count:selected.length,saveMessage:''});this.render()
  },
  async save(){
    if(this.data.loading||this.data.saving||!this._loaded||this._owner!==account.owner())return
    const owner=this._owner,selected=[...this.data.selected];this.setData({saving:true,saveMessage:''})
    try{
      await api.homeCompanionsSave(selected);if(this._dead||owner!==account.owner())return
      wx.navigateBack({fail:()=>{if(!this._dead){this.setData({saving:false});wx.showToast({title:'已保存，请返回查看',icon:'none'})}}})
    }catch(e){if(!this._dead&&owner===account.owner())this.setData({saving:false,saveMessage:e.message||'保存失败，请重试'})}
  },
  editColors(){if(!this.data.saving)wx.navigateTo({url:'/account/wardrobe/index'})},
  back(){if(!this.data.saving)wx.navigateBack()}
})
