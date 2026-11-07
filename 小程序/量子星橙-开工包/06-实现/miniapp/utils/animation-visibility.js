// Visibility only controls scheduling. It never changes poses, timing or the brand mark.
function canPlay(component) {
  return component._attached !== false && component._visible !== false && component._inViewport !== false && component.properties.active !== false && component.properties.obscured !== true
}
function sync(component) {
  if (canPlay(component)) component.resumeAnimation()
  else component.pauseAnimation()
}
function attach(component, selector) {
  component._attached = true; component._visible = true; component._inViewport = true
  if (!component.createIntersectionObserver) return
  const observe = () => {
    if (component._attached === false || !component.createIntersectionObserver) return
    try {
      component._visibilityObserver = component.createIntersectionObserver({thresholds:[0,0.01]})
      component._visibilityObserver.relativeToViewport().observe(selector, entry => {
        if (component._attached === false) return
        const visible = entry.intersectionRatio > 0
        if (visible === component._inViewport) return
        component._inViewport = visible; sync(component)
      })
    } catch (e) { /* Platforms without viewport observation retain page/overlay guards. */ }
  }
  if (typeof wx.nextTick === 'function') wx.nextTick(observe)
}
function detach(component) {
  component._attached = false; component._visible = false
  if (component._visibilityObserver) component._visibilityObserver.disconnect()
  component._visibilityObserver = null
  component.pauseAnimation()
}
module.exports = {canPlay,sync,attach,detach}
