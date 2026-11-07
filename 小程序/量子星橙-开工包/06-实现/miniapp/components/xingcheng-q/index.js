const Appearance=require('../xingcheng-q-motion/appearance')
const ALIASES = { rest:'peek', invite:'launch', loading:'peek', submitting:'snap', correct:'confirm', 'needs-review':'calibrate', 'daily-complete':'seal', attention:'ponder', empty:'peek', offline:'peek', notification:'launch', transition:'launch', milestone:'seal', 'waiting-access':'peek' }

const STATES = {
  peek: { file: '01-peek', label: '星橙Q探头到站', duration: 3000 },
  launch: { file: '02-launch', label: '星橙Q点亮出发', duration: 3000 },
  snap: { file: '03-snap', label: '星橙Q吸入知识点', duration: 3000 },
  ponder: { file: '04-ponder', label: '星橙Q想法冒泡', duration: 3000 },
  confirm: { file: '05-confirm', label: '星橙Q捕星确认', duration: 3000 },
  calibrate: { file: '06-calibrate', label: '星橙Q温和校准', duration: 3000 },
  seal: { file: '07-seal', label: '星橙Q今日封印', duration: 3000 },
  recharge: { file: '08-recharge', label: '星橙Q月湾充能', duration: 4000 }
}

Component({
  properties: {
    state: { type: String, value: 'peek' },
    animated: { type: Boolean, value: false },
    once: { type: Boolean, value: true },
    size: { type: Number, value: 176 },
    motion: { type: String, value: 'auto' },
    playToken: { type: null, value: 0 },
    accessory: { type: String, value: 'none' }
  },

  data: {
    motionSrc: '',
    staticSrc: '',
    label: '',
    showMotion: false
  },

  observers: {
    'state, animated, once, motion, playToken, size': function () {
      this.refresh()
    }
  },

  lifetimes: {
    attached() {
      this.refresh()
    },
    detached() {
      clearTimeout(this.motionTimer)
    }
  },

  pageLifetimes: {
    show() { this._visible = true; this.refresh() },
    hide() { this._visible = false; clearTimeout(this.motionTimer); this.setData({ showMotion: false }) }
  },

  methods: {
    fallbackFor(src){
      let width=0;
      try{width=Number((wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()).windowWidth)||0;}catch(e){}
      return Appearance.assetForSize(src,this.properties?this.properties.size:this.data.size,width);
    },
    refresh() {
      clearTimeout(this.motionTimer)
      const state = STATES[ALIASES[this.data.state] || this.data.state] || STATES.peek
      const root = '/assets/xingcheng-q'
      this.setData({
        motionSrc: this.fallbackFor(`${root}/static/${state.file}.png`),
        staticSrc: this.fallbackFor(`${root}/static/${state.file}.png`),
        label: state.label,
        showMotion: false
      })
      const app = getApp && getApp()
      const reduceMotion = !!(app && app.globalData && app.globalData.reduceMotion)
      if (this._visible === false || !this.data.animated || this.data.motion === 'still' || reduceMotion) return
      this.setData({ showMotion: true })
      if (this.data.once) {
        this.motionTimer = setTimeout(() => {
          this.setData({ showMotion: false })
          this.triggerEvent('playend', { state: this.data.state, accessory: this.data.accessory })
        }, state.duration)
      }
    },

    replay() {
      this.refresh()
    }
  }
})
