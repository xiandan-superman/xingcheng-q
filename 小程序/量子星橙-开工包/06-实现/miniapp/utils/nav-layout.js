function finite(value) {
  return Number.isFinite(value)
}

module.exports = function navLayout() {
  const app = typeof getApp === 'function' ? getApp() : null
  const globalData = (app && app.globalData) || {}
  let windowInfo = {}
  try {
    windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  } catch (error) {}

  const statusBarHeight = finite(windowInfo.statusBarHeight)
    ? windowInfo.statusBarHeight
    : (globalData.statusBarHeight || 20)
  const windowWidth = finite(windowInfo.windowWidth) && windowInfo.windowWidth > 0
    ? windowInfo.windowWidth
    : 375
  const pageSide = windowWidth * 36 / 750
  let topPad = statusBarHeight + 6
  let navHeight = 32
  let capsuleReserve = Math.round(Math.min(96, Math.max(72, windowWidth * 0.24)))

  try {
    const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
    const valid = menu && finite(menu.top) && finite(menu.left) && finite(menu.height) && menu.height > 0
    if (valid) {
      topPad = menu.top
      navHeight = menu.height
      capsuleReserve = Math.max(0, Math.round(windowWidth - pageSide - menu.left + 8))
    }
  } catch (error) {}

  return {
    topPad: Math.round(topPad),
    navHeight: Math.round(navHeight),
    capsuleReserve
  }
}
