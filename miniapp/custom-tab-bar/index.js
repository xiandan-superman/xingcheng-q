Component({
  data: {
    selected: 0,
    hidden: false,
    popIdx: -1,
    reduceMotion: false,
    list: [
      { pagePath: '/pages/today/index', text: '今日', icon: '/assets/icons/tab-today.png', iconOn: '/assets/icons/tab-today-on.png', dot: false },
      { pagePath: '/pages/practice/index', text: '练习', icon: '/assets/icons/tab-practice.png', iconOn: '/assets/icons/tab-practice-on.png', dot: false },
      { pagePath: '/pages/wrong/index', text: '错题', icon: '/assets/icons/tab-wrong.png', iconOn: '/assets/icons/tab-wrong-on.png', dot: false },
      { pagePath: '/pages/me/index', text: '我的', icon: '/assets/icons/tab-me.png', iconOn: '/assets/icons/tab-me-on.png', dot: false }
    ]
  },
  lifetimes: {
    attached() {
      this.syncMotion()
      this.syncCurrentPage()
    },
    detached() {
      clearTimeout(this._popT)
    }
  },
  pageLifetimes: {
    show() {
      this.syncMotion()
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const top = pages.length ? pages[pages.length - 1] : null
      const keepHidden = !!(top && top.data && top.data.showMakeup)
      this.setData({ hidden: keepHidden })
      this.syncCurrentPage()
    }
  },
  methods: {
    /** tabBar 在页面节点树之外，拿不到 .reduce-motion，需自行读全局开关 */
    syncMotion() {
      const app = typeof getApp === 'function' ? getApp() : null
      const on = !!(app && app.globalData && app.globalData.reduceMotion)
      if (on !== this.data.reduceMotion) this.setData({ reduceMotion: on })
    },
    /** 供「我的」页切换开关后即时同步 */
    setReduceMotion(on) {
      const next = !!on
      if (next !== this.data.reduceMotion) this.setData({ reduceMotion: next })
    },
    syncCurrentPage() {
      if (typeof getCurrentPages !== 'function') return
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      if (!current || !current.route) return
      const index = this.data.list.findIndex((item) => item.pagePath.slice(1) === current.route)
      if (index >= 0 && index !== this.data.selected) this.setData({ selected: index })
    },
    /** 未掌握错题数 > 0 才亮红点 */
    setWrongDot(count) {
      const on = Math.max(0, Number(count) || 0) > 0
      const list = this.data.list.map((item, i) => (i === 2 ? { ...item, dot: on } : item))
      if (list[2].dot === this.data.list[2].dot) return
      this.setData({ list })
    },
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      const idx = Number(index)
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const top = pages.length ? pages[pages.length - 1] : null
      const route = top && top.route
      const pathRoute = String(path || '').replace(/^\//, '')
      const sameHighlight = idx === this.data.selected
      const sameRoute = route && pathRoute && route === pathRoute
      // 高亮已对且路由已是目标 → noop；高亮对但路由不一致仍允许切 / 强制 sync
      if (sameHighlight && sameRoute) return
      this.setData({ selected: idx, hidden: false, popIdx: idx })
      // 弹跳只在切换瞬间播一次：360ms 后摘掉 is-pop，避免任何后续
      // setData（如拨动减少动态）重算样式时把动画从头误触发
      clearTimeout(this._popT)
      this._popT = setTimeout(() => this.setData({ popIdx: -1 }), 360)
      if (!sameRoute) wx.switchTab({ url: path })
      else this.syncCurrentPage()
    }
  }
})
