const api = require('../../services/student')
const uvToast = require('../../utils/uv-toast')
const view = require('../../services/presentation')
const { syncWrongDot } = require('../../utils/tab-badge')

const MILESTONE_STREAKS = [7, 14, 21, 30, 50, 100]
const WAVE_KEY = 'xingchengq:todayWaveDate'
const PRESENT_KEY = 'xingchengq:todayPresentDate'
const MILESTONE_KEY = 'xingchengq:milestoneShown:'

Page({
  data: {
    question: null,
    completed: false,
    topPad: 20,
    reduceMotion: false,
    dateText: '',
    streak: 0,
    total: 0,
    tickets: 0,
    days: [],
    makeupDays: [],
    showMakeup: false,
    makeupOffset: 0,
    makeupTracking: false,
    makeupSuccess: false,
    makeupSheetPx: 520,
    makeupScrollPx: 240,
    selectedKey: '',
    loading: true,
    message: '',
    messageScene: 'empty',
    networkRecovered: false,
    completionMotion: 'still',
    qState: 'invite',
    qAccessory: 'none',
    qMotion: 'auto',
    qPlayToken: 0
  },

  onShow() {
    this._hidden = false
    this._enteringDaily = false
    uvToast.attach(this)
    const g = getApp().globalData
    this.setData({ topPad: (g.statusBarHeight || 20) + 2, reduceMotion: !!g.reduceMotion })
    const tab = this.getTabBar && this.getTabBar()
    if (tab) {
      tab.setData({ hidden: !!this.data.showMakeup })
      if (typeof tab.syncCurrentPage === 'function') tab.syncCurrentPage()
    }
    syncWrongDot(this)
    return this.load()
  },

  onHide() {
    this._hidden = true
    this._loadRevision = (this._loadRevision || 0) + 1
    for (const key of ['_waveFb', '_msFb', '_presentFb', '_transTimer']) clearTimeout(this[key])
    // 切 Tab / 进补卡停重循环
    this.pauseHomeLoop()
  },

  onUnload() { this.onHide(); this._unloaded = true; clearTimeout(this._networkRecoveredTimer) },

  pauseHomeLoop() {
    // 主体改静帧语义；组件 hide 也会卸 GIF
    const looping = ['idle-blink', 'today-curious', 'today-proud', 'curious-idle', 'proud-idle'].includes(this.data.qState)
    if (looping || this.data.qAccessory !== 'none') {
      this.setData({
        qAccessory: 'none',
        qMotion: 'still',
        qState: this.data.completed ? 'daily-complete' : 'invite'
      })
    }
  },

  resumeHomeLoopIfNeeded() {
    if (this.data.showMakeup || this.data.reduceMotion) return
    // 已完成也常驻眨眼，避免首页整日静帧
    if (this.data.completed) {
      this.enterIdleBlink()
      return
    }
    const today = (this.data.dateText && this._todayKey) || this._todayKey
    if (!today) return
    // 未做：先 wave 一次（同日仅一次），再 today-curious 重循环
    const waved = wx.getStorageSync(WAVE_KEY)
    if (waved !== today) {
      wx.setStorageSync(WAVE_KEY, today)
      this.setData({
        qState: 'invite',
        qAccessory: 'wave-invite',
        qMotion: 'auto',
        qPlayToken: Date.now()
      })
      this._afterWaveToIdle = true
      clearTimeout(this._waveFb)
      this._waveFb = setTimeout(() => this.enterIdleBlink(), 1600)
    } else {
      this.enterIdleBlink()
    }
  },

  enterIdleBlink() {
    this._afterWaveToIdle = false
    clearTimeout(this._waveFb)
    if (this.data.showMakeup) return
    // 未完成：today-curious（重循环）；已完成：today-proud（short-loop，不占 MotionLock）
    const loopState = this.data.completed ? 'today-proud' : 'today-curious'
    this.setData({
      qAccessory: 'none',
      qState: loopState,
      qMotion: 'auto',
      qPlayToken: Date.now()
    })
  },

  onQPlayEnd(e) {
    const d = (e && e.detail) || {}
    if (d.accessory === 'wave-invite' || this._afterWaveToIdle) {
      this.enterIdleBlink()
      return
    }
    if (d.state === 'transition' || this.data.qState === 'transition') {
      // startDaily 已设导航定时器
      return
    }
    if (d.accessory === 'present-result') {
      this.enterIdleBlink()
      return
    }
    if (this.data.qState === 'milestone' || d.state === 'milestone') {
      this.setData({
        qState: this.data.completed ? 'daily-complete' : 'invite',
        qMotion: 'still',
        qAccessory: 'none'
      })
    }
    if (this.data.qState === 'happy-jump' || d.state === 'happy-jump' ||
        this.data.qState === 'wink' || d.state === 'wink' ||
        this.data.qState === 'alert' || d.state === 'alert') {
      this.enterIdleBlink()
    }
  },

  async load() {
    if (this._hidden || this._unloaded) return
    const revision = this._loadRevision = (this._loadRevision || 0) + 1
    this.setData({ loading: true, message: '' })
    try {
      const [daily, calendar] = await Promise.all([api.getDaily(), api.getCheckins()])
      if (revision !== this._loadRevision) return
      if (this._hadLoadError) {
        this._hadLoadError = false
        this.setData({ networkRecovered: true })
        clearTimeout(this._networkRecoveredTimer)
        this._networkRecoveredTimer = setTimeout(() => { if (!this._unloaded) this.setData({ networkRecovered: false }) }, 6800)
      }
      const keys = view.dates(31), today = keys[keys.length - 1]
      this._todayKey = today
      const days = keys.map(key => ({
        key,
        day: Number(key.slice(8)),
        label: key === today ? '今天' : key.slice(5),
        state: calendar.dates.includes(key) ? 'done' : key === today ? 'today' : 'missed',
        canMakeup: key < today && !calendar.dates.includes(key)
      }))
      const completed = daily.state === 'completed'
      this.setData({
        question: view.question(daily.question),
        completed,
        dateText: today.slice(5).replace('-', '月') + '日',
        streak: calendar.streak,
        total: calendar.total,
        tickets: calendar.makeupBalance,
        days: days.slice(-7),
        makeupDays: days.slice(0, -1),
        message: daily.state === 'empty' ? '星题补给中，题目发布后即可开始' : daily.state === 'offline' ? '今日题目已下架，请稍后再来' : '',
        messageScene: daily.state === 'offline' ? 'offline' : 'empty'
      })
      this.applyCompletedOrIdle(completed, calendar.streak, today)
    } catch (e) {
      this._hadLoadError = true
      if (revision === this._loadRevision) this.setData({ message: e.message, messageScene: 'offline', question: null })
    } finally {
      if (revision === this._loadRevision) this.setData({ loading: false })
    }
  },

  applyCompletedOrIdle(completed, streak, today) {
    if (this.data.showMakeup) {
      this.setData({ qState: completed ? 'daily-complete' : 'invite', qAccessory: 'none', qMotion: 'still' })
      return
    }
    if (completed) {
      // 里程碑一次（按 streak 档位记本地）
      const hit = MILESTONE_STREAKS.indexOf(streak) >= 0
      const mk = MILESTONE_KEY + streak
      if (hit && !wx.getStorageSync(mk)) {
        wx.setStorageSync(mk, today)
        this.setData({ qState: 'milestone', qAccessory: 'none', qMotion: 'still', qPlayToken: Date.now() })
        clearTimeout(this._msFb)
        this._msFb = setTimeout(() => {
          this.playPresentIfNeeded(today)
        }, 1200)
        return
      }
      this.playPresentIfNeeded(today)
      return
    }
    this.resumeHomeLoopIfNeeded()
  },

  playPresentIfNeeded(today) {
    // 已完成：daily-complete；可选 present-result 一次；返回不重播
    const shown = wx.getStorageSync(PRESENT_KEY)
    if (shown !== today) {
      wx.setStorageSync(PRESENT_KEY, today)
      this.setData({
        completionMotion: this.data.reduceMotion ? 'still' : 'auto',
        qState: 'daily-complete',
        qAccessory: 'present-result',
        qMotion: 'auto',
        qPlayToken: Date.now()
      })
      clearTimeout(this._presentFb)
      this._presentFb = setTimeout(() => {
        this.enterIdleBlink()
      }, 1700)
    } else {
      this.setData({ completionMotion: 'still' })
      this.enterIdleBlink()
    }
  },

  startDaily() {
    if (this.data.loading || this._hidden || this._unloaded || !this.data.question || this._enteringDaily) return
    this._enteringDaily = true
    // 跳转期间提供反馈，不额外强制等待动画。
    this.setData({
      qAccessory: 'none',
      qState: 'transition',
      qMotion: 'auto',
      qPlayToken: Date.now()
    })
    wx.navigateTo({ url: '/pages/quiz/index?scene=daily', fail: () => {
      this._enteringDaily = false
      this.setData({ qState: 'invite', qMotion: 'still' })
      this.uvToast({ type: 'err', text: '进入失败，请重试' })
    } })
  },

  reviewDaily() { wx.navigateTo({ url: '/pages/result/index?review=1' }) },
  setTabBarHidden(hidden) { const tab = this.getTabBar && this.getTabBar(); if (tab) tab.setData({ hidden }) },
  makeupLayout() {
    const sys = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync() || {}
    const winH = sys.windowHeight || 667
    const status = sys.statusBarHeight || 20
    const safeBottom = sys.safeArea && Number.isFinite(sys.safeArea.bottom) ? Math.max(0, winH - sys.safeArea.bottom) : 34
    const sheetPx = Math.max(360, Math.round(Math.min(winH * 0.78, winH - status - 44)))
    const headPx = 188
    const footPx = 96 + safeBottom
    const scrollPx = Math.max(200, sheetPx - headPx - footPx)
    return { makeupSheetPx: sheetPx, makeupScrollPx: scrollPx }
  },
  openMakeup() {
    this.pauseHomeLoop()
    this.setData({ showMakeup: true, makeupSuccess: false, makeupOffset: 0, makeupTracking: false, qMotion: 'still', ...this.makeupLayout() })
    this.setTabBarHidden(true)
  },
  closeMakeup() {
    this._makeupStartY = null
    this._makeupLastMoveAt = 0
    this.setData({ showMakeup: false, makeupSuccess: false, makeupOffset: 0, makeupTracking: false })
    this.setTabBarHidden(false)
    this.resumeHomeLoopIfNeeded()
  },
  onMakeupGripStart(e) {
    const touch = e.touches && e.touches[0]
    this._makeupStartY = touch ? touch.clientY : null
    this.setData({ makeupTracking: true })
  },
  onMakeupGripMove(e) {
    if (this._makeupStartY == null) return
    const touch = e.touches && e.touches[0]
    if (!touch) return
    const now = Date.now()
    if (this._makeupLastMoveAt && now - this._makeupLastMoveAt < 16) return
    this._makeupLastMoveAt = now
    this.setData({ makeupOffset: Math.max(0, touch.clientY - this._makeupStartY) })
  },
  onMakeupGripEnd() {
    const dy = this.data.makeupOffset
    this._makeupStartY = null
    this._makeupLastMoveAt = 0
    if (dy > 110) return this.closeMakeup()
    this.setData({ makeupTracking: false, makeupOffset: 0 })
  },
  noop() {},
  pickDay(e) {
    if (this.data.tickets <= 0) return this.uvToast({ type: 'err', text: '暂无补能券' })
    if (e.currentTarget.dataset.makeup) this.setData({ selectedKey: e.currentTarget.dataset.key })
  },
  async onPullDownRefresh() {
    if (this.data.showMakeup) {
      wx.stopPullDownRefresh()
      return
    }
    await this.load()
    wx.stopPullDownRefresh()
  },

  async confirmMakeup() {
    if (this.busy) return
    if (this.data.tickets <= 0) return this.uvToast({ type: 'err', text: '暂无补能券' })
    if (!this.data.selectedKey) return this.uvToast({ type: 'err', text: '请先选择补能日期' })
    this.busy = true
    try {
      await api.useMakeup(this.data.selectedKey)
      await this.load()
      this.setData({ showMakeup: true, makeupSuccess: true, selectedKey: '' })
      wx.vibrateShort({ type: 'light' })
      this.uvToast({ type: 'star', text: '星能已补上' })
    } catch (e) { view.error(e) } finally { this.busy = false }
  },
  openOnboarding() { wx.navigateTo({ url: '/pages/onboarding/index' }) }
})
