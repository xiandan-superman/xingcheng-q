const accountSession = require('../../services/account-session')
const practiceDraft = require('../../services/practice-draft')
const correctionDraft = require('../../services/correction-draft')
const studyOutbox = require('../../services/study-outbox')
const { questionImages } = require('../../services/question-images')
const api = require('../../services/student')
const uvToast = require('../../utils/uv-toast')
const view = require('../../services/presentation')
const { renderFormula } = require('../../utils/formula')
const { alignAnswersForSubmit } = require('../../utils/grade-fill')

const CHOICE_KINDS = ['single', 'multi', 'judge', 'truefalse']
const PART_COLORS = ['orange', 'cyan', 'pink']
const TIME_FLUSH_SEC = 5
const ANSWER_THROTTLE_MS = 250
const KB_DEBOUNCE_MS = 120

Page({
  data: {
    topPad: 26,
    reduceMotion: false,
    question: null,
    partColors: PART_COLORS,
    answers: [],
    selectedOptions: [],
    answeredCount: 0,
    segments: [0, 0, 0],
    stageText: '正在加载',
    stageKey: 'read',
    seconds: 0,
    timeText: '00:00',
    submitting: false,
    submitFailure: false,
    scene: 'daily',
    kbHeight: 0,
    kbPad: 200,
    scrollH: 500,
    scrollIntoView: '',
    focusIdx: -1,
    loading: true,
    message: '',
    images: [],
    imageRetryable: false,
    isChoice: false,
    submitLabel: '提交答案',
    isLastInGroup: false,
    stemNodes: [],
    optionNodes: [],
    // 题组（practice）
    isGroup: false,
    groupIndex: 0,
    groupTotal: 0,
    // 顶栏：主=科目，副=场景
    navMain: '',
    navSub: '综合星题',
    sourceTitle: '',
    // 纠错
    showCorrection: false,
    correctionOffset: 0,
    correctionTracking: false,
    correctionType: '题干有误',
    correctionText: '',
    correctionTypes: ['题干有误', '答案有误', '解析不清', '图片看不清', '其他'],
    corrSubject: '',
    corrType: '',
    corrStem: '',
    correctionLocalPath: '',
    correctionLocalSaved: false,
    correctionFileId: '',
    sendingCorrection: false,
    correctionSuccess: false,
    // 星橙Q v1.1：读题 thinking-micro；输入 answer-writing；提交 orbit-lite；禁 wave/jump/present
    qState: 'loading',
    qAccessory: 'none',
    qMotion: 'auto'
  },

  onLoad(options) {
    uvToast.attach(this)
    this.options = options || {}
    const g = (getApp() && getApp().globalData) || {}
    const scene = this.options.scene || 'daily'
    const sceneLabel = scene === 'practice' ? '星轨训练舱' : scene === 'wrong' ? '重新校准' : '综合星题'
    this.setData({
      topPad: (g.navTotalHeight || (g.statusBarHeight || 20) + 44) + 6,
      reduceMotion: !!g.reduceMotion,
      scene,
      navSub: sceneLabel,
      navMain: sceneLabel,
      sourceTitle: this.options.title ? decodeURIComponent(this.options.title) : ''
    })
    this._sys = wx.getSystemInfoSync() || {}
    this._kbHandler = (r) => {
      clearTimeout(this._kbDebounce)
      this._kbDebounce = setTimeout(() => {
        const kbHeight = (r && r.height) || 0
        this.applyKeyboardLayout(kbHeight)
      }, KB_DEBOUNCE_MS)
    }
    wx.onKeyboardHeightChange(this._kbHandler)
    this.applyKeyboardLayout(0)
    this.load()
  },

  // R8: 固定底栏 + 键盘避让；内容区高度随键盘收缩，避免白缝与悬空重叠
  applyKeyboardLayout(kbHeight) {
    const sys = this._sys || wx.getSystemInfoSync() || {}
    const winH = sys.windowHeight || 667
    const topPad = this.data.topPad || 26
    const topbarH = 48 // 导航行近似高度
    const actionH = kbHeight > 0 ? 64 : 72 // px approx action-bar
    const scrollH = Math.max(220, winH - topPad - topbarH - actionH - kbHeight)
    const kbPad = actionH + 24
    this.setData({ kbHeight, scrollH, kbPad })
  },

  retryLoad() {
    this.load()
  },

  async load() {
    if (this._loadPending || this._unloaded) return
    this._loadPending = true
    this._questionReady = false
    clearInterval(this.timer); this.timer = null
    this.stopHeartbeat(true)
    const previous = this.raw && { questionId: this.raw._id, answers: (this._answers || this.data.answers).slice(), selectedOptions: this.data.selectedOptions.slice(), seconds: this._seconds || 0, nonce: this.nonce }
    this.setData({ loading: true, message: '', qState: 'loading', qAccessory: 'none', qMotion: 'auto' })
    try {
      const g = getApp().globalData
      if (this.data.scene === 'practice' && !g.practiceSession) g.practiceSession = practiceDraft.restore()
      const s = g.practiceSession
      const isGroup = this.data.scene === 'practice' && s && s.questions && s.questions.length
      this.setData({
        isGroup: !!isGroup,
        groupTotal: isGroup ? s.questions.length : 0,
        groupIndex: isGroup ? s.index : 0
      })

      if (this.data.scene === 'practice' && !isGroup) throw new Error('练习会话已结束，请返回练习舱重新进入')
      let q
      if (isGroup) {
        q = s.questions[s.index]
        this.sessionId = s.sessionId
      } else if (this.data.scene === 'wrong') {
        const entry = await api.enterWrong(this.options.id)
        if (this._unloaded) return
        q = entry.question
      } else {
        const d = await api.enterDaily(this.dailyDate)
        if (this._unloaded) return
        this.dailyDate = d.date
        if (d.state === 'completed') { wx.redirectTo({ url: '/pages/result/index?review=1&date=' + encodeURIComponent(this.dailyDate || '') }); return }
        q = d.question
      }
      if (!q) throw new Error('当前没有可作答的题目')

      this.raw = q
      const question = view.question(q)
      question.parts = question.parts.map(part => ({ ...part, promptNodes: renderFormula(part.prompt) }))
      const isChoice = CHOICE_KINDS.indexOf(q.type) >= 0
      const saved = previous && previous.questionId === q._id ? previous : (isGroup && s.current && s.current.questionId === q._id ? s.current : null)
      const answers = saved && Array.isArray(saved.answers) ? saved.answers : question.parts.map(() => '')
      const selectedOptions = saved && Array.isArray(saved.selectedOptions) ? saved.selectedOptions : []
      this._answers = answers.slice()

      const stemPlain = (question.summary || question.stem || '').replace(/\s+/g, ' ').trim()
      const corrStem = stemPlain.length > 48 ? stemPlain.slice(0, 48) + '…' : stemPlain
      const isLastInGroup = !!(isGroup && s && s.index + 1 >= s.questions.length)
      const submitLabel = isGroup
        ? (isLastInGroup ? '发送本轨信号' : '进入下一轨')
        : (isChoice ? '提交答案' : '发送信号')

      this.setData({
        question,
        isChoice,
        answers,
        selectedOptions,
        stageText: '已读题干',
        stageKey: 'read',
        answeredCount: 0,
        segments: [0, 0, 0],
        stemNodes: renderFormula(question.stem || question.summary),
        optionNodes: (question.options || []).map((o) => ({ ...o, nodes: renderFormula(o.text), mark: o.mark || o.key, selected: selectedOptions.includes(o.key) })),
        navMain: question.subject || this.data.navSub,
        corrSubject: question.subject || '',
        corrType: question.type || '',
        corrStem,
        submitLabel,
        isLastInGroup,
        images: [],
        imageRetryable: false,
        message: '',
        // 读题/未输入：thinking-micro 轻循环（禁 loading 冒充思考）
        qState: 'quiz-thinking',
        qAccessory: 'none',
        qMotion: 'auto'
      })
      this.restoreCorrectionDraft(q._id)

      this.nonce = saved && saved.nonce || Date.now().toString(36) + Math.random().toString(36).slice(2)
      this._seconds = saved && Number.isFinite(saved.seconds) ? saved.seconds : 0
      await this.loadQuestionImages(q)
      if (this._unloaded) return

      this.flushAnswerProgress(true)
      this.flushTimeText(true)
      this._questionReady = true
      this.resumeTimer()
      this.startHeartbeat()
    } catch (e) {
      if (!this._unloaded) this.setData({ message: e.message || '加载失败' })
    } finally {
      this._loadPending = false
      if (!this._unloaded) this.setData({ loading: false })
    }
  },

  formatTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
  },

  /** 本地累加秒数；仅周期性或离开页时 setData，避免每秒触发渲染 */
  flushTimeText(force) {
    const s = this._seconds || 0
    const timeText = this.formatTime(s)
    if (!force && timeText === this.data.timeText && s === this.data.seconds) return
    this.setData({ seconds: s, timeText })
  },

  resumeTimer() {
    if (this.timer || this._unloaded || this._hidden || !this._questionReady) return
    this._seconds = this._seconds || 0
    this.timer = setInterval(() => {
      this._seconds = (this._seconds || 0) + 1
      if ((this._seconds % TIME_FLUSH_SEC) === 0) this.flushTimeText()
    }, 1000)
  },

  /** 每日、专项、错题重做：约30秒心跳，离开页补报。 */
  shouldHeartbeat() {
    return ['daily', 'practice', 'wrong'].includes(this.data.scene)
  },
  startHeartbeat() {
    if (!this.shouldHeartbeat() || this._hbTimer || this._unloaded || this._hidden || !this._questionReady) return
    this._hbPendingMs = this._hbPendingMs || 0
    this._hbLastTick = Date.now()
    this._hbTimer = setInterval(() => this.tickHeartbeat(false), 30000)
  },
  tickHeartbeat(forceFlush) {
    if (!this.shouldHeartbeat()) return
    const end = Date.now(), start = this._hbLastTick
    if (start && end > start) {
      try {
        studyOutbox.enqueue(start, end)
        this._hbLastTick = forceFlush ? null : end
      } catch (e) {
        this.uvToast({ type: 'err', text: '学习时长暂未保存，请保持页面并重试' })
        return
      }
    } else this._hbLastTick = forceFlush ? null : end
    this.flushHeartbeat()
  },
  flushHeartbeat() {
    return studyOutbox.flush().catch(() => {}) // Retained on disk; next heartbeat/launch retries.
  },
  stopHeartbeat(flush) {
    if (this._hbTimer) { clearInterval(this._hbTimer); this._hbTimer = null }
    if (flush) this.tickHeartbeat(true)
    else this._hbLastTick = null
  },

  onShow() {
    this._hidden = false
    if (this._questionReady) {
      this.resumeTimer()
      this._hbLastTick = Date.now()
      this.startHeartbeat()
    }
  },
  onPageScroll() {
    // 滚动中短暂降载，停滚后恢复读题/作答微动（避免整页永久静帧）
    if (this.data.submitting) return
    clearTimeout(this._scrollMotionTimer)
    if (this.data.qMotion !== 'still' && (this.data.qAccessory === 'answer-writing' || this.data.qState === 'quiz-thinking')) {
      this.setData({ qMotion: 'still' })
    }
    this._scrollMotionTimer = setTimeout(() => {
      if (this.data.submitting) return
      if (this.data.focusIdx >= 0) {
        this.setData({ qState: 'rest', qAccessory: 'answer-writing', qMotion: 'auto', qPlayToken: Date.now() })
      } else {
        this.setData({ qState: 'quiz-thinking', qAccessory: 'none', qMotion: 'auto', qPlayToken: Date.now() })
      }
    }, 420)
  },

  onHide() {
    this._hidden = true
    this.savePracticeDraft()
    this.flushCorrectionDraft()
    clearTimeout(this._scrollMotionTimer)
    clearInterval(this.timer); this.timer = null
    this.flushTimeText(true)
    this.flushAnswerProgress(true)
    this.stopHeartbeat(true)
    // 停播卸循环（组件 page hide 也会切静帧）
    if (this.data.qMotion !== 'still' || this.data.qAccessory !== 'none') {
      this.setData({ qAccessory: 'none', qMotion: 'still', qState: this.data.submitting ? 'orbit-lite' : 'quiz-thinking' })
    }
  },
  onUnload() {
    this.onHide()
    this._unloaded = true
    if (this.data.submitting) wx.hideLoading()
    clearTimeout(this._correctionDraftTimer)
    clearTimeout(this._kbDebounce)
    clearTimeout(this._answerThrottle)
    clearTimeout(this._correctionSuccessTimer)
    clearTimeout(this._submitFailureTimer)
    if (this._kbHandler) wx.offKeyboardHeightChange(this._kbHandler)
  },

  savePracticeDraft() {
    const session = getApp().globalData.practiceSession
    if (this.data.scene !== 'practice' || !this.raw || !session || session.flowVersion !== 2 || session.sessionId !== this.sessionId || session.questions[session.index]._id !== this.raw._id) return true
    const current = { questionId: this.raw._id, answers: (this._answers || this.data.answers || []).slice(), selectedOptions: this.data.selectedOptions.slice(), seconds: this._seconds || 0, nonce: this.nonce }
    try {
      if (!practiceDraft.save(session.sessionId, session.index, session.drafts || [], current)) return true
      session.current = current
      this._draftErrorShown = false
      return true
    } catch (e) {
      if (!this._draftErrorShown) view.error(new Error('草稿保存失败，请暂勿退出并检查手机存储空间'))
      this._draftErrorShown = true
      return false
    }
  },

  back() {
    if (this.data.submitting) { this.uvToast({ type: 'info', text: '正在提交答案，请稍候' }); return }
    if (this.savePracticeDraft()) wx.navigateBack()
  },

  // 短答/填空/综合文字作答：value 受控绑定；答案即时写入 data，进度字段仍节流
  answerInput(e) {
    if (this.data.submitting || this._unloaded) return
    const idx = Number(e.currentTarget.dataset.index)
    const value = e.detail.value
    if (!this._answers) this._answers = (this.data.answers || []).slice()
    this._answers[idx] = value
    this.savePracticeDraft()
    // 受控 textarea 必须同步 value，否则界面仍显示旧内容/空框
    this.setData({ [`answers[${idx}]`]: value })
    clearTimeout(this._answerThrottle)
    this._answerThrottle = setTimeout(() => this.flushAnswerProgress(), ANSWER_THROTTLE_MS)
  },
  flushAnswerProgress(force) {
    clearTimeout(this._answerThrottle)
    this._answerThrottle = null
    const answers = (this._answers || this.data.answers || []).slice()
    const n = answers.filter((x) => String(x).trim()).length
    const total = answers.length || 1
    const stageText = n === 0 ? '已读题干' : (n === total ? '可以发送' : '作答中')
    const stageKey = n === 0 ? 'read' : 'answer'
    const segments = [0, 1, 2].map((i) => (n / total > i / 3 ? 2 : 0))
    const same =
      !force &&
      this.data.answeredCount === n &&
      this.data.stageText === stageText &&
      this.data.stageKey === stageKey &&
      JSON.stringify(this.data.segments) === JSON.stringify(segments) &&
      JSON.stringify(this.data.answers) === JSON.stringify(answers)
    if (same) return
    this.setData({ answers, answeredCount: n, stageText, stageKey, segments })
  },
  onFocus(e) {
    const idx = Number(e.currentTarget.dataset.index)
    this.setData({
      focusIdx: idx,
      scrollIntoView: 'sq-' + idx,
      qState: 'rest',
      qAccessory: 'answer-writing',
      qMotion: 'auto'
    })
  },
  onBlur() {
    this.flushAnswerProgress(true)
    this.setData({ focusIdx: -1, scrollIntoView: '', qState: 'quiz-thinking', qAccessory: 'none', qMotion: 'auto' })
  },

  // 选择题选项
  choose(e) {
    if (this.data.submitting) return
    const key = e.currentTarget.dataset.key
    const kind = this.raw.type
    let selected = this.data.selectedOptions
    if (kind === 'multi') {
      selected = selected.indexOf(key) >= 0 ? selected.filter((x) => x !== key) : selected.concat(key)
    } else {
      selected = [key]
    }
    const optionNodes = this.data.optionNodes.map((o) => ({ ...o, selected: selected.indexOf(o.key) >= 0 }))
    this.setData({ selectedOptions: selected, optionNodes })
    this.savePracticeDraft()
  },

  previewDiagram(e) {
    const url = (e.currentTarget.dataset && e.currentTarget.dataset.url) || this.data.images[0]
    if (url) wx.previewImage({ urls: this.data.images, current: url })
  },

  async loadQuestionImages(q) {
    try {
      const images = await questionImages(q, wx)
      if (this._unloaded) return
      this.setData({ images, imageRetryable: false, message: '' })
    } catch (e) {
      if (this._unloaded) return
      // R9: 失败态由 load catch 展示，并提供重试
      this.setData({ images: [], imageRetryable: true, question: null })
      throw new Error('题图加载失败，请返回后重试，避免缺图答题')
    }
  },

  imageFailed() {
    if (this._unloaded) return
    this._questionReady = false
    clearInterval(this.timer); this.timer = null
    this.stopHeartbeat(true)
    this.setData({
      message: '题图加载失败，请返回后重试，避免缺图答题',
      imageRetryable: true,
      question: null
    })
  },

  // 纠错（类型必填；文字可空；附图可选）
  correctionQuestionId() { return this.raw && this.raw._id || '' },
  correctionFingerprint() {
    const draft = { questionId: this.correctionQuestionId(), type: this.data.correctionType, text: this.data.correctionText || '' }
    return JSON.stringify([draft, this.data.correctionLocalPath || ''])
  },
  removeSavedCorrectionFile(path, saved) {
    if (saved && path && wx.removeSavedFile) wx.removeSavedFile({ filePath: path, fail: () => {} })
  },
  restoreCorrectionDraft(questionId) {
    const saved = correctionDraft.restore(questionId) || {}
    this.correctionRequest = saved && saved.requestId && saved.fingerprint ? { requestId: saved.requestId, fingerprint: saved.fingerprint } : null
    this.setData({
      correctionType: saved.type || '题干有误',
      correctionText: saved.text || '',
      correctionLocalPath: saved.localPath || '',
      correctionLocalSaved: Boolean(saved.localSaved),
      correctionFileId: saved.fileId || ''
    })
  },
  scheduleCorrectionDraft() {
    clearTimeout(this._correctionDraftTimer)
    this._correctionDraftTimer = setTimeout(() => this.flushCorrectionDraft(), 250)
  },
  flushCorrectionDraft() {
    clearTimeout(this._correctionDraftTimer)
    this._correctionDraftTimer = null
    const questionId = this.correctionQuestionId()
    if (!questionId) return true
    const meaningful = Boolean(this.data.correctionText || this.data.correctionLocalPath || this.data.correctionFileId || this.data.correctionType !== '题干有误' || this.correctionRequest)
    try {
      if (!meaningful) {
        correctionDraft.clear(questionId)
        return true
      }
      const fingerprint = this.correctionFingerprint()
      const request = this.correctionRequest && this.correctionRequest.fingerprint === fingerprint ? this.correctionRequest : null
      const saved = correctionDraft.save({
        questionId,
        type: this.data.correctionType,
        text: this.data.correctionText || '',
        localPath: this.data.correctionLocalPath || '',
        localSaved: this.data.correctionLocalSaved,
        fileId: this.data.correctionFileId || '',
        requestId: request && request.requestId || '',
        fingerprint: request && request.fingerprint || ''
      })
      ;(saved.evicted || []).forEach(item => this.removeSavedCorrectionFile(item.localPath, item.localSaved))
      this._correctionDraftErrorShown = false
      return true
    } catch (e) {
      if (!this._correctionDraftErrorShown) view.error(new Error('纠错草稿保存失败，请暂勿退出并检查手机存储空间'))
      this._correctionDraftErrorShown = true
      return false
    }
  },
  openCorrection() { if (this.raw) this.setData({ showCorrection: true, correctionOffset: 0, correctionTracking: false }) },
  closeCorrection() {
    this._correctionStartY = null
    this._correctionLastMoveAt = 0
    if (this.data.sendingCorrection || !this.flushCorrectionDraft()) {
      this.setData({ correctionOffset: 0, correctionTracking: false })
      return
    }
    this.setData({ showCorrection: false, correctionOffset: 0, correctionTracking: false })
  },
  onCorrectionGripStart(e) {
    const touch = e.touches && e.touches[0]
    this._correctionStartY = touch ? touch.clientY : null
    this.setData({ correctionTracking: true })
  },
  onCorrectionGripMove(e) {
    if (this._correctionStartY == null) return
    const touch = e.touches && e.touches[0]
    if (!touch) return
    const now = Date.now()
    if (this._correctionLastMoveAt && now - this._correctionLastMoveAt < 16) return
    this._correctionLastMoveAt = now
    this.setData({ correctionOffset: Math.max(0, touch.clientY - this._correctionStartY) })
  },
  onCorrectionGripEnd() {
    const dy = this.data.correctionOffset
    this._correctionStartY = null
    this._correctionLastMoveAt = 0
    if (dy > 110) return this.closeCorrection()
    this.setData({ correctionTracking: false, correctionOffset: 0 })
  },
  pickCorrection(e) { if (this.data.sendingCorrection) return; this.setData({ correctionType: e.currentTarget.dataset.type }); this.scheduleCorrectionDraft() },
  correctionInput(e) { if (this.data.sendingCorrection) return; this.setData({ correctionText: e.detail.value }); this.scheduleCorrectionDraft() },
  noop() {},
  pickCorrectionImage() {
    if (this.data.sendingCorrection) return
    const apply = (res) => {
      const file = (res.tempFiles && res.tempFiles[0]) || null
      const path = (file && (file.tempFilePath || file.path)) || (res.tempFilePaths && res.tempFilePaths[0]) || ''
      if (!path) return
      if (!wx.saveFile) return view.error(new Error('附图暂时无法保存，请稍后重试'))
      wx.saveFile({ tempFilePath: path, success: ({ savedFilePath }) => {
        if (!savedFilePath) return view.error(new Error('附图暂时无法保存，请稍后重试'))
        const previous = { path: this.data.correctionLocalPath, saved: this.data.correctionLocalSaved, fileId: this.data.correctionFileId, request: this.correctionRequest }
        this.correctionRequest = null
        this.setData({ correctionLocalPath: savedFilePath, correctionLocalSaved: true, correctionFileId: '' })
        if (this.flushCorrectionDraft()) {
          if (previous.path !== savedFilePath) this.removeSavedCorrectionFile(previous.path, previous.saved)
        } else {
          this.correctionRequest = previous.request
          this.setData({ correctionLocalPath: previous.path, correctionLocalSaved: previous.saved, correctionFileId: previous.fileId })
          if (savedFilePath !== previous.path) this.removeSavedCorrectionFile(savedFilePath, true)
        }
      }, fail: () => view.error(new Error('附图暂时无法保存，请检查手机存储空间')) })
    }
    if (wx.chooseMedia) {
      wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: apply, fail: () => {} })
      return
    }
    if (wx.chooseImage) {
      wx.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: apply, fail: () => {} })
      return
    }
    this.uvToast({ type: 'err', text: '当前基础库不支持选图' })
  },
  previewCorrectionImage() {
    if (this.data.correctionLocalPath) wx.previewImage({ urls: [this.data.correctionLocalPath], current: this.data.correctionLocalPath })
  },
  async uploadCorrectionImage() {
    if (!this.data.correctionLocalPath) return ''
    if (this.data.correctionFileId) return this.data.correctionFileId
    if (!wx.cloud || !wx.cloud.uploadFile) throw new Error('当前无法上传附图，请稍后重试')
    const cloudPath = `corrections/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const up = await wx.cloud.uploadFile({ cloudPath, filePath: this.data.correctionLocalPath })
    const fileId = up.fileID || up.fileId || ''
    if (!fileId) throw new Error('附图上传未完成，请重试')
    this.setData({ correctionFileId: fileId })
    if (!this.flushCorrectionDraft()) throw new Error('纠错草稿保存失败，请检查手机存储空间')
    return fileId
  },
  async sendCorrection() {
    if (this.data.sendingCorrection || !this.raw) return
    if (!this.data.correctionType) return this.uvToast({ type: 'err', text: '请选择问题类型' })
    const draft = { questionId: this.raw._id, type: this.data.correctionType, text: this.data.correctionText || '' }
    const fingerprint = JSON.stringify([draft, this.data.correctionLocalPath || ''])
    if (!this.correctionRequest || this.correctionRequest.fingerprint !== fingerprint) this.correctionRequest = { fingerprint, requestId: `corr-${Date.now()}-${Math.random().toString(36).slice(2)}` }
    draft.requestId = this.correctionRequest.requestId
    if (!this.flushCorrectionDraft()) return
    this.setData({ sendingCorrection: true })
    try {
      const fileId = await this.uploadCorrectionImage()
      const imageFileIds = fileId ? [fileId] : []
      await api.submitCorrection({ ...draft, imageFileIds })
      const savedPath = this.data.correctionLocalPath
      const localSaved = this.data.correctionLocalSaved
      correctionDraft.clear(draft.questionId)
      this.correctionRequest = null
      this.setData({ showCorrection: false, correctionOffset: 0, correctionTracking: false, correctionText: '', correctionLocalPath: '', correctionLocalSaved: false, correctionFileId: '', correctionSuccess: true })
      clearTimeout(this._correctionSuccessTimer)
      this._correctionSuccessTimer = setTimeout(() => { if (!this._unloaded) this.setData({ correctionSuccess: false }) }, 6400)
      this.removeSavedCorrectionFile(savedPath, localSaved)
      this.uvToast({ type: 'star', text: '反馈已提交' })
    } catch (e) { view.error(e) } finally { this.setData({ sendingCorrection: false }) }
  },

  openAnswerPage(url, restore) {
    if (this._navigating || this._unloaded) return
    this._navigating = true
    wx.redirectTo({ url, fail: () => {
      this._navigating = false
      if (this._unloaded) return
      try { if (restore) restore() } catch (e) { view.error(new Error('页面未打开，草稿恢复失败，请暂勿退出')); return }
      view.error(new Error('页面打开失败，请重试'))
    } })
  },

  // 提交
  async submit() {
    if (this._navigating || this.data.submitting || !this.raw || !this._questionReady || this._hidden || this._unloaded) return
    this.flushAnswerProgress(true)
    this.flushTimeText(true)
    if (!this.savePracticeDraft()) return
    const kind = this.raw.type
    const isChoice = CHOICE_KINDS.indexOf(kind) >= 0
    let answers = isChoice ? this.data.selectedOptions : (this._answers || this.data.answers)
    if (!answers.length || answers.some((x) => !String(x).trim())) {
      this.uvToast({ type: 'err', text: isChoice ? '请先选择一个选项' : '请完成所有作答' })
      return
    }
    wx.vibrateShort({ type: 'light' })
    if (kind === 'fill') answers = alignAnswersForSubmit(this.raw, answers)
    if (['single', 'judge', 'truefalse', 'short', 'definition', 'term', '名词解释'].includes(kind)) answers = Array.isArray(answers) ? answers[0] : answers

    const payload = {
      questionId: this.raw._id,
      heartbeatVersion: 2,
      dailyDate: this.data.scene === 'daily' ? this.dailyDate : undefined,
      sessionId: this.sessionId || '',
      answers,
      durationMs: (this._seconds || this.data.seconds || 0) * 1000,
      submitNonce: this.nonce,
      scene: this.data.scene
    }
    this.setData({ submitting: true, stageKey: 'wait', qState: 'orbit-lite', qAccessory: 'none', qMotion: 'auto' })
    wx.showLoading({ title: '信号发送中…', mask: true })
    try {
      const session = getApp().globalData.practiceSession
      if (this.data.scene === 'practice' && session && session.flowVersion === 2) {
        session.drafts = session.drafts || []
        session.drafts[session.index] = { questionId: this.raw._id, answers, durationMs: payload.durationMs }
        if (session.index + 1 < session.questions.length) {
          const previousIndex = session.index, previousCurrent = session.current
          practiceDraft.save(session.sessionId, session.index + 1, session.drafts, null)
          session.index += 1
          session.current = null
          wx.hideLoading()
          this.openAnswerPage('/pages/quiz/index?scene=practice', () => {
            if (getApp().globalData.practiceSession !== session || session.index !== previousIndex + 1) return
            session.index = previousIndex; session.current = previousCurrent
            practiceDraft.save(session.sessionId, previousIndex, session.drafts, previousCurrent)
          })
          return
        }
        practiceDraft.save(session.sessionId, session.index, session.drafts, session.current || null)
        await api.preparePractice({ sessionId: session.sessionId, drafts: session.drafts })
        if (this._unloaded) return
        accountSession.saveReview(session.sessionId)
        practiceDraft.clear(session.sessionId)
        wx.hideLoading()
        this.openAnswerPage('/pages/result/index?scene=practice&session=' + encodeURIComponent(session.sessionId) + '&index=0')
        return
      }
      const subjective = ['short', 'composite', 'definition', 'term', '名词解释'].includes(kind)
      const result = subjective
        ? await api.answerGuide(payload)
        : this.data.scene === 'daily' ? await api.submitDaily(payload)
          : this.data.scene === 'practice' ? await api.submitPractice(payload)
            : await api.submitWrong(payload)
      if (this._unloaded) return
      getApp().globalData.answerResult = { question: this.raw, payload, result, subjective }
      wx.hideLoading()

      // 训练舱/专项：过程无解析；客观题中途直接下一题，整套后再进小结
      if (this.data.scene === 'practice') {
        const s = getApp().globalData.practiceSession
        if (s && s.questions && s.questions.length) {
          if (!subjective) {
            s.results = s.results || []
            const qid = this.raw._id
            if (!s.results.some((x) => x.questionId === qid)) {
              const stem = this.raw.stemPlain || String(this.raw.stemMd || '').replace(/\s+/g, ' ').trim().slice(0, 40)
              s.results.push({
                questionId: qid,
                result: result && result.result === 'correct' ? 'correct' : 'wrong',
                stem
              })
            }
            if (s.index + 1 < s.questions.length) {
              s.index += 1
              wx.redirectTo({ url: '/pages/quiz/index?scene=practice' })
              return
            }
            wx.redirectTo({ url: '/pages/result/index?scene=practice&setDone=1' })
            return
          }
          wx.redirectTo({ url: '/pages/result/index?scene=practice' })
          return
        }
      }

      this.openAnswerPage('/pages/result/index?scene=' + this.data.scene)
    } catch (e) {
      if (!this._unloaded) {
        this.setData({ submitFailure: true })
        clearTimeout(this._submitFailureTimer)
        this._submitFailureTimer = setTimeout(() => { if (!this._unloaded) this.setData({ submitFailure: false }) }, 8000)
        view.error(e)
      }
    } finally {
      if (!this._unloaded) { wx.hideLoading(); this.setData({ submitting: false }) }
    }
  }
})
