const api = require('../../services/student')
const avatar = require('../../utils/avatar')
const nav = require('../../utils/nav-layout')

function reduceMotion() {
  const app = typeof getApp === 'function' ? getApp() : null
  return !!(app && app.globalData && app.globalData.reduceMotion)
}

Page({
  data: {
    loading: true,
    saving: false,
    message: '',
    cards: [],
    colors: avatar.colors,
    primaryColors: avatar.primaryColors,
    moreColors: avatar.moreColors,
    showMoreColors: false,
    shape: 'round',
    color: 'xingcheng',
    avatarColors: {},
    preview: '',
    previewFrom: '',
    previewTo: '',
    shapeName: '',
    motionPhase: '',
    layered: false,
    fxActive: false,
    colorFxActive: false,
    motionBusy: false
  },
  onLoad() { this.setData(nav()); this.load() },
  onHide() {
    this._hidden = true
    const target = this._motionTarget, pending = this._pendingAction
    this._pendingAction = null
    this.clearMotion()
    let shape=this.data.shape
    const avatarColors={...this.data.avatarColors}
    for(const action of [target,pending])if(action){if(action.type==='shape')shape=action.value;else if(action.type==='color')avatarColors[avatar.normalizeShape(shape)]=action.value}
    const color=avatarColors[avatar.normalizeShape(shape)]||'xingcheng'
    this.setData({shape,color,avatarColors,motionPhase:'',layered:false,fxActive:false,colorFxActive:false,motionBusy:false,previewFrom:'',previewTo:''})
    this.render()
  },
  onShow() { this._hidden = false },
  onUnload() { this._dead = true; this.clearMotion() },
  back() { if (!this.data.saving && !this._returning && !this._dead) wx.navigateBack() },
  returnAfterSave() {
    this._returning = true
    wx.navigateBack({ fail: () => {
      if (this._dead) return
      this._returning = false
      this.setData({ saving: false })
      wx.showToast({ title: '形象已保存，返回失败，请重试', icon: 'none' })
    } })
  },
  async load() {
    this.setData({ loading: true, message: '' })
    try {
      const result = await api.growthGet()
      if (this._dead) return
      const avatarColors=avatar.normalizeColors(result.profile),shape=avatar.normalizeShape(result.profile.avatarShape),color=avatarColors[shape]
      this._loadedColors={...avatarColors}
      this.setData({shape,color,avatarColors,rawCards:result.cards,
        showMoreColors:avatar.moreColors.some(item=>item.id===color),loading:false})
      this.render()
    } catch (error) {
      if (!this._dead) this.setData({ loading: false, message: error.message })
    }
  },
  cardData(shape, color) {
    return (this.data.rawCards || []).map(card => {
      const ownColor=avatar.normalizeShape(card.shape)===avatar.normalizeShape(shape)?color:this.colorForShape(card.shape)
      return Object.assign({}, card, {
        name: card.unlocked ? avatar.names[card.shape] : '神秘形象',
        src: card.unlocked ? avatar.image(card.shape,ownColor) : '',
        selected: card.shape === shape
      })
    })
  },
  colorForShape(shape) { return this.data.avatarColors[avatar.normalizeShape(shape)]||'xingcheng' },
  render() {
    this.setData({
      preview: avatar.image(this.data.shape, this.data.color),
      shapeName: avatar.names[this.data.shape],
      cards: this.cardData(this.data.shape, this.data.color)
    })
  },
  clearMotion() {
    const timers = this._motionTimers || []
    timers.forEach(function (timer) { clearTimeout(timer) })
    this._motionTimers = []
    this._motion = ''
    this._motionTarget = null
  },
  later(fn, delay) {
    const timer = setTimeout(fn, delay)
    if (!this._motionTimers) this._motionTimers = []
    this._motionTimers.push(timer)
  },
  finishMotion() {
    this._motion = ''
    this._motionTarget = null
    this._motionTimers = []
    const pending = this._pendingAction
    this._pendingAction = null
    if (!pending || this._dead) {
      if (!this._dead) this.setData({ motionBusy: false })
      return
    }
    if (pending.type === 'color') this.startColor(pending.value)
    else this.startShape(pending.value)
  },
  chooseShape(event) {
    if (this.data.saving) return
    const card = this.data.cards.find(function (item) { return item.key === event.currentTarget.dataset.key })
    if (!card || !card.unlocked) { wx.showToast({ title: '达成成就后解锁', icon: 'none' }); return }
    if (card.shape === this.data.shape && !this._motion) return
    if (this._motion) { this._pendingAction = { type: 'shape', value: card.shape }; return }
    this.startShape(card.shape)
  },
  startShape(next) {
    const nextColor=this.colorForShape(next)
    if (reduceMotion()) {
      this.setData({ shape:next,color:nextColor,showMoreColors:this.data.showMoreColors||avatar.moreColors.some(c=>c.id===nextColor),motionPhase:'',layered:false,fxActive:false,colorFxActive:false,motionBusy:false })
      this.render()
      return
    }
    this.clearMotion()
    this._motionTarget = { type: 'shape', value: next }
    this._motion = 'shape'
    this.setData({ motionPhase: 'shape-out', layered: false, fxActive: true, colorFxActive: false, motionBusy: true })
    this.later(() => {
      if (this._dead || this._motion !== 'shape') return
      this.setData({shape:next,color:nextColor,showMoreColors:this.data.showMoreColors||avatar.moreColors.some(c=>c.id===nextColor),preview:avatar.image(next,nextColor),shapeName:avatar.names[next],cards:this.cardData(next,nextColor),motionPhase:'shape-in'})
    }, 660)
    this.later(() => {
      if (this._dead || this._motion !== 'shape') return
      this.setData({ motionPhase: '', fxActive: false })
      this.finishMotion()
    }, 1700)
  },
  chooseColor(event) {
    if (this.data.saving) return
    const color = event.currentTarget.dataset.id
    if (!avatar.colors.some(function (item) { return item.id === color })) return
    if (color === this.data.color && !this._motion) return
    if (this._motion) { this._pendingAction = { type: 'color', value: color }; return }
    this.startColor(color)
  },
  toggleMoreColors() { this.setData({ showMoreColors: !this.data.showMoreColors }) },
  startColor(next) {
    this.setData({avatarColors:{...this.data.avatarColors,[avatar.normalizeShape(this.data.shape)]:next}})
    if (reduceMotion()) {
      this.setData({ color: next, motionPhase: '', layered: false, colorFxActive: false, motionBusy: false })
      this.render()
      return
    }
    this.clearMotion()
    this._motionTarget = { type: 'color', value: next }
    this._motion = 'color'
    const shape = this.data.shape
    const current = this.data.color
    const oldLower = avatar.image(shape, current, { lookX: -5, lookY: 4 })
    const newLower = avatar.image(shape, next, { lookX: -5, lookY: 4 })
    this.setData({ color: next, preview: avatar.image(shape, current, { lookX: 6, lookY: -5 }), cards: this.cardData(shape, next), layered: false, motionPhase: 'color-look-up', colorFxActive: true, motionBusy: true })
    this.later(() => {
      if (this._dead || this._motion !== 'color') return
      this.setData({ preview: oldLower, motionPhase: 'color-look-down' })
    }, 650)
    this.later(() => {
      if (this._dead || this._motion !== 'color') return
      this.setData({ preview: newLower, motionPhase: 'color-change' })
    }, 1100)
    this.later(() => {
      if (this._dead || this._motion !== 'color') return
      this.setData({ preview: avatar.image(shape, next), motionPhase: 'color-settle' })
    }, 1800)
    this.later(() => {
      if (this._dead || this._motion !== 'color') return
      this.setData({ preview: avatar.image(shape, next), previewFrom: '', previewTo: '', layered: false, motionPhase: '', colorFxActive: false })
      this.finishMotion()
    }, 2300)
  },
  async save() {
    if (this._dead || this._returning || this.data.saving || this.data.loading || this.data.message || this._motion) return
    this.setData({ saving: true })
    try {
      const draft=avatar.normalizeColors({avatarShape:this.data.shape,avatarColor:this.data.color,avatarColors:this.data.avatarColors})
      draft[avatar.normalizeShape(this.data.shape)]=this.data.color
      const baseline=this._loadedColors||avatar.normalizeColors({}),patch={}
      Object.keys(draft).forEach(id=>{if(draft[id]!==baseline[id])patch[id]=draft[id]})
      const result=await api.avatarSave({shape:this.data.shape,color:this.data.color,avatarColors:patch})
      if (this._dead) return
      this._loadedColors=result&&result.avatarColors?avatar.normalizeColors(result):draft
      this.setData({avatarColors:{...this._loadedColors}})
      wx.showToast({ title: '形象已更新' })
      this.returnAfterSave()
    } catch (error) {
      if (!this._dead) wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      if (!this._dead && !this._returning) this.setData({ saving: false })
    }
  }
})
