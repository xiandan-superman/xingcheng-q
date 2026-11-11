const accountSession = require('../../services/account-session')
const correctionDraft = require('../../services/correction-draft')
const { questionImages } = require('../../services/question-images')
const api = require('../../services/student')
const uvToast = require('../../utils/uv-toast')
const view = require('../../services/presentation')
const { renderFormula } = require('../../utils/formula')
const { gradeFill } = require('../../utils/grade-fill')
const { withTaskPrefix } = require('../../utils/stem')
const text = (x) => Array.isArray(x) ? x.join('、') : typeof x === 'object' ? JSON.stringify(x) : String(x == null ? '' : x)

Page({
  data: {
    images: [], imageMessage: '', imagesLoading: false,
    topPad: 26, reduceMotion: false, scene: 'daily', review: false, finished: false, answers: [], correctCount: 0, allCorrect: false,
    verdict: '', verdictState: '', partColors: ['orange', 'cyan', 'pink'], parts: [], mistakeTips: '', loading: true, message: '',
    submitting: false, hasNext: false, showPracticeSummary: false, practiceSummary: null,
    deferAnalysis: false, practiceReview: false, reviewIndex: 0, reviewTotal: 0, hasPrevious: false,
    showCorrection: false, correctionOffset: 0, correctionTracking: false, correctionType: '题干有误', correctionText: '', correctionTypes: ['题干有误', '答案有误', '解析不清', '图片看不清', '其他'],
    corrSubject: '', corrType: '', corrStem: '',
    correctionLocalPath: '', correctionLocalSaved: false, correctionFileId: '', sendingCorrection: false, correctionSuccess: false,
    qState: 'rest', qAccessory: 'none', qMotion: 'still', qPlayToken: 0, _qIntroDone: false,
    resultMotion: 'still'
  },

  async onLoad(options) {
    if (this._loadingResult || this._unloaded) return
    this._loadingResult = true
    uvToast.attach(this)
    this.options = options
    this.setData({
      loading: true, message: '',
      topPad: getApp().globalData.statusBarHeight + 6,
      reduceMotion: !!getApp().globalData.reduceMotion,
      scene: options.scene || 'daily',
      review: !!options.review,
      resultMotion: getApp().globalData.reduceMotion || !!options.review || !!options.session ? 'still' : 'auto'
    })
    try {
      let packet = getApp().globalData.answerResult
      this.practiceReview = this.data.scene === 'practice' && !!options.session
      if (this.practiceReview) {
        const request = { sessionId: options.session }
        if (options.index !== undefined) request.index = Number(options.index)
        const response = await api.reviewPractice(request)
        if (this._unloaded) return
        packet = response.packet
        const old = getApp().globalData.practiceSession
        getApp().globalData.practiceSession = {
          sessionId: response.sessionId, flowVersion: 2, index: response.index,
          questions: response.questionIds.map(id => (old && old.sessionId === response.sessionId && old.questions.find(q => q._id === id)) || { _id: id }),
          results: response.results, status: response.status
        }
        this.setData({ practiceReview: true, reviewIndex: response.index, reviewTotal: response.questionIds.length, hasPrevious: response.index > 0 })
        accountSession.saveReview(response.sessionId)
      }
      if (options.review) {
        const d = await api.reviewDaily(options.date)
        if (this._unloaded) return
        if (!d.attempt) throw new Error('暂无可回看的作答记录')
        packet = { question: d.question, payload: { answers: d.attempt.answers, dailyDate: d.date }, result: { ...d.question, result: d.attempt.result, partResults: d.attempt.partResults }, subjective: false }
      }
      if (!packet) throw new Error('作答记录已过期，请返回重新进入')
      this.packet = packet
      const q = packet.question
      await this.loadQuestionImages()
      if (this._unloaded) return
      const r = this.applyFillGrade(q, packet)
      const finished = !packet.subjective || !!options.review
      const source = q.type === 'composite'
        ? (r.parts || [])
        : [{ title: '答案与解析', answer: ['judge', 'truefalse'].includes(q.type) ? (String(r.answer) === 'true' ? '正确' : String(r.answer) === 'false' ? '错误' : r.answer) : text(r.answer), analysis: r.analysisMd }]
      const parts = source.map((p, i) => ({
        title: p.title || '小问 ' + (i + 1),
        answer: text(p.answer),
        answerNodes: renderFormula(text(p.answer)),
        promptNodes: renderFormula(p.prompt || p.promptMd || p.stemMd || ''),
        analysisNodes: renderFormula(p.analysisMd || p.analysis || r.analysisMd || ''),
        analysis: p.analysisMd || p.analysis || r.analysisMd || '',
        state: finished ? (Array.isArray(r.partResults) && r.partResults.length ? r.partResults[i] : r.result) : 'pending'
      }))
      const answers = q.type === 'composite' ? packet.payload.answers : [['judge', 'truefalse'].includes(q.type) ? (String(packet.payload.answers) === 'true' ? '正确' : '错误') : text(packet.payload.answers)]
      const s = getApp().globalData.practiceSession
      const hasNext = this.data.scene === 'practice' && !!s && s.index + 1 < s.questions.length
      const deferAnalysis = this.data.scene === 'practice' && hasNext && !this.practiceReview
      const qv = view.question(q)
      const stemSource = (qv && qv.stem) || withTaskPrefix(q.stemMd || q.stemPlain || '', q)
      const stemPlain = String((qv && qv.summary) || stemSource).replace(/\s+/g, ' ').trim()
      this.setData({
        parts,
        isComposite: q.type === 'composite',
        answers,
        resultStemNodes: renderFormula(stemSource),
        resultOptions: (qv.options || []).map(o => ({ key: o.key, mark: o.mark, nodes: renderFormula(o.text) })),
        mistakeTips: deferAnalysis ? '' : (q.mistakeTipsMd || r.mistakeTipsMd || ''),
        finished,
        dailyDateLabel: this.data.scene === 'daily' ? String(packet.payload.dailyDate || r.date || view.dates(1)[0]).slice(5).replace('-', '月') + '日' : '',
        review: finished,
        hasNext,
        deferAnalysis,
        corrSubject: (qv && qv.subject) || q.subjectId || '',
        corrType: (qv && qv.type) || q.type || '',
        corrStem: stemPlain.length > 48 ? stemPlain.slice(0, 48) + '…' : stemPlain
      })
      this.restoreCorrectionDraft(q._id)
      if (finished) {
        this.refreshVerdict(parts, r.result)
        this.rememberPracticeResult(r.result)
        this.maybeShowPracticeSummary(hasNext)
        this.playResultQ(true)
      } else {
        this.playResultQ(false)
      }
    } catch (e) {
      if (!this._unloaded) this.setData({ message: e.message })
    } finally {
      this._loadingResult = false
      if (!this._unloaded) this.setData({ loading: false })
    }
  },

  onShow() { this._hidden = false },

  onHide() {
    this._hidden = true
    this.flushCorrectionDraft()
    for (const key of ['_presentFb', '_jumpFb', '_alertFb']) clearTimeout(this[key])
    this.setData({ qAccessory: 'none', qMotion: 'still' })
  },
  onUnload() {
    this.onHide()
    this._unloaded = true
    clearTimeout(this._correctionDraftTimer)
    clearTimeout(this._correctionSuccessTimer)
  },

  onQPlayEnd(e) {
    if (this._hidden || this._unloaded) return
    const d = (e && e.detail) || {}
    if (d.accessory === 'present-result' || this.data.qAccessory === 'present-result') {
      clearTimeout(this._presentFb)
      this.setData({ qAccessory: 'none', qState: 'rest', qMotion: 'still' })
      return
    }
    if (this.data.qState === 'happy-jump' || this.data.qState === 'result-celebrate' || d.state === 'result-celebrate' || d.state === 'happy-jump') {
      clearTimeout(this._jumpFb)
      this.setData({ qState: 'today-proud', qAccessory: 'none', qMotion: 'auto', qPlayToken: Date.now() })
      return
    }
    if (this.data.qState === 'needs-review' || d.state === 'needs-review') {
      this.setData({ qMotion: 'still' })
    }
  },

  playResultQ(finished) {
    if (this._hidden || this._unloaded) return
    if (this.data.reduceMotion) {
      const st = finished ? (this.data.allCorrect ? 'today-proud' : 'needs-review') : 'rest'
      this.setData({ qState: st, qAccessory: 'none', qMotion: 'still', _qIntroDone: true })
      return
    }
    if (!finished) {
      this.setData({ qState: 'rest', qAccessory: 'present-result', qMotion: 'auto', qPlayToken: Date.now() })
      clearTimeout(this._presentFb)
      this._presentFb = setTimeout(() => {
        this.setData({ qAccessory: 'none', qState: 'rest', qMotion: 'still', _qIntroDone: true })
      }, 1700)
      return
    }
    if (this.data.allCorrect) {
      this.setData({ qState: 'result-celebrate', qAccessory: 'none', qMotion: 'auto', qPlayToken: Date.now(), _qIntroDone: true })
      clearTimeout(this._jumpFb)
      this._jumpFb = setTimeout(() => {
        this.setData({ qState: 'today-proud', qAccessory: 'none', qMotion: 'auto', qPlayToken: Date.now() })
      }, 1500)
    } else {
      this.setData({ qState: 'alert', qAccessory: 'none', qMotion: 'auto', qPlayToken: Date.now(), _qIntroDone: true })
      clearTimeout(this._alertFb)
      this._alertFb = setTimeout(() => {
        this.setData({ qState: 'needs-review', qAccessory: 'none', qMotion: 'still' })
      }, 1400)
    }
  },

  applyFillGrade(q, packet) {
    const r = Object.assign({}, packet.result || {})
    if (!q || q.type !== 'fill') return r
    const graded = gradeFill(q, packet.payload && packet.payload.answers, r)
    if (graded.mode === 'unknown' || !graded.keyTokens.length) return r
    if (graded.matched && r.result !== 'correct') {
      r.result = 'correct'
      r.partResults = Array.isArray(r.partResults) && r.partResults.length
        ? r.partResults.map(() => 'correct')
        : r.partResults
      packet.result = r
    }
    return r
  },

  setPartState(e) {
    if (this.data.finished || this.data.submitting) return
    const i = Number(e.currentTarget.dataset.index)
    const state = e.currentTarget.dataset.state
    if (!['correct', 'wrong'].includes(state)) return
    this.setData({ parts: this.data.parts.map((p, n) => n === i ? { ...p, state } : p) })
  },

  refreshVerdict(parts, result) {
    const correctCount = parts.filter((p) => p.state === 'correct').length
    const allCorrect = result ? result === 'correct' : correctCount === parts.length
    this.setData({ correctCount, allCorrect, verdict: allCorrect ? '星轨吻合' : '星轨偏移', verdictState: allCorrect ? 'ok' : 'err' })
  },

  async finish() {
    if (this._unloaded || this._hidden || this.data.loading || this.data.submitting || this.data.finished || !this.packet || this.data.imagesLoading || this.data.imageMessage) return
    if (this.data.parts.some((p) => p.state === 'pending')) return this.uvToast({ type: 'err', text: '请完成每个小问的自评' })
    const states = this.data.parts.map((p) => p.state)
    const payload = { ...this.packet.payload, partResults: this.packet.question.type === 'short' ? states[0] : states }
    this.setData({ submitting: true })
    try {
      const result = await (this.data.scene === 'daily' ? api.submitDaily(payload) : this.data.scene === 'practice' ? api.submitPractice(payload) : api.submitWrong(payload))
      if (this._unloaded) return
      this.packet.result = { ...this.packet.result, ...result, partResults: states }
      this.packet.subjective = false
      this.setData({ finished: true, review: true })
      this.rememberPracticeResult(result.result)
      const s = getApp().globalData.practiceSession
      const hasNext = this.data.scene === 'practice' && !!s && s.index + 1 < s.questions.length
      if (hasNext && !this._hidden) {
        const previousIndex = s.index
        s.index += 1
        this.openResultPage( this.practiceReview ? '/pages/result/index?scene=practice&session=' + encodeURIComponent(s.sessionId) + '&index=' + s.index : '/pages/quiz/index?scene=practice', s, previousIndex)
        return
      }
      this.setData({ finished: true, review: true, hasNext, deferAnalysis: false })
      wx.vibrateShort({ type: 'medium' })
      this.refreshVerdict(this.data.parts, result.result)
      this.maybeShowPracticeSummary(hasNext)
      this.playResultQ(true)
    } catch (e) {
      if (!this._unloaded) view.error(e)
    } finally {
      if (!this._unloaded) this.setData({ submitting: false })
    }
  },

  rememberPracticeResult(result) {
    if (this.data.scene !== 'practice' || !this.packet) return
    const s = getApp().globalData.practiceSession
    if (!s) return
    s.results = s.results || []
    const questionId = this.packet.question._id
    const next = result === 'correct' ? 'correct' : 'wrong'
    const existing = s.results.find((x) => x.questionId === questionId)
    if (existing) {
      existing.result = next
      return
    }
    const stem = this.packet.question.stemPlain || String(this.packet.question.stemMd || '').slice(0, 40)
    s.results.push({ questionId, result: next, stem })
  },

  maybeShowPracticeSummary(hasNext) {
    if (this.data.scene !== 'practice' || hasNext) return
    const s = getApp().globalData.practiceSession
    if (!s || !s.results || !s.results.length) return
    const total = s.results.length
    if (this.practiceReview && total !== s.questions.length) return
    const ordered = s.questions.map(q => s.results.find(r => r.questionId === q._id)).filter(Boolean)
    const correct = s.results.filter((x) => x.result === 'correct').length
    const wrong = total - correct
    let narrative = ''
    if (wrong === 0) narrative = '整段星轨都对准了！星橙Q在舱外转了个小圈，替你记下这场漂亮的校准。'
    else if (correct === 0) narrative = '这一程全是待校准信号。别急，星橙Q会陪你把偏移一点点扳回来。'
    else if (correct >= wrong) narrative = `本段校准完成：${correct} 题星轨吻合，${wrong} 题还在漂移。星橙Q说——偏移也是航线的一部分。`
    else narrative = `本段校准完成：${correct} 题对上了，${wrong} 题还要再飞一程。星橙Q已经把偏移点标进星图啦。`
    this.setData({
      showPracticeSummary: true,
      practiceSummary: {
        total, correct, wrong, narrative,
        items: ordered.map((x, i) => ({ index: i + 1, result: x.result, stem: x.stem || ('第 ' + (i + 1) + ' 题') }))
      }
    })
  },

  openResultPage(url, session, previousIndex) {
    if (this._navigating || this._unloaded || this._hidden) return
    this._navigating = true
    wx.redirectTo({ url, fail: () => {
      this._navigating = false
      if (session && getApp().globalData.practiceSession === session && session.index === previousIndex + 1) session.index = previousIndex
      if (!this._unloaded && !this._hidden) view.error(new Error('页面打开失败，请重试'))
    } })
  },

  next() {
    if (this.data.submitting || this._navigating || this._unloaded || this._hidden) return
    const s = getApp().globalData.practiceSession
    if (!this.data.finished || !s || s.index + 1 >= s.questions.length) return
    const previousIndex = s.index
    s.index += 1
    this.openResultPage( this.practiceReview ? '/pages/result/index?scene=practice&session=' + encodeURIComponent(s.sessionId) + '&index=' + s.index : '/pages/quiz/index?scene=practice', s, previousIndex)
  },

  previous() {
    if (this.data.submitting || this._navigating || this._unloaded || this._hidden) return
    const s = getApp().globalData.practiceSession
    if (!this.practiceReview || !s || s.index < 1) return
    this.openResultPage( '/pages/result/index?scene=practice&session=' + encodeURIComponent(s.sessionId) + '&index=' + (s.index - 1))
  },

  reviewItem(e) {
    if (this.data.submitting || this._navigating || this._unloaded || this._hidden) return
    const s = getApp().globalData.practiceSession
    const index = Number(e.currentTarget.dataset.index)
    if (!this.practiceReview || !s || !Number.isInteger(index) || index < 0 || index >= s.questions.length) return
    this.openResultPage( '/pages/result/index?scene=practice&session=' + encodeURIComponent(s.sessionId) + '&index=' + index)
  },

  async loadQuestionImages() {
    if (this._imagePending || this._unloaded) return
    this._imagePending = true
    this.setData({ imagesLoading: true, imageMessage: '', images: [] })
    try {
      const images = await questionImages(this.packet.question, wx)
      if (!this._unloaded) this.setData({ images })
    } catch (e) { if (!this._unloaded) this.setData({ imageMessage: '题图加载失败，请重试后再自评' }) }
    finally { this._imagePending = false; if (!this._unloaded) this.setData({ imagesLoading: false }) }
  },
  imageFailed() { this.setData({ imageMessage: '题图加载失败，请重试后再自评' }) },
  previewDiagram(e) {
    const url = e.currentTarget.dataset.url
    if (url) wx.previewImage({ urls: this.data.images, current: url })
  },

  retryResult() { return this.onLoad(this.options) },

  goPractice() { wx.switchTab({ url: '/pages/practice/index' }) },
  goWrong() { wx.switchTab({ url: '/pages/wrong/index' }) },
  goMe() { wx.switchTab({ url: '/pages/me/index' }) },
  goToday() { wx.switchTab({ url: '/pages/today/index' }) },
  goBack() {
    if (this.data.scene === 'practice') wx.switchTab({ url: '/pages/practice/index' })
    else wx.switchTab({ url: '/pages/today/index' })
  },

  openCorrection() {
    if (!this.packet || !this.packet.question) return this.uvToast({ type: 'err', text: '当前没有可反馈的题目' })
    this.setData({ showCorrection: true, correctionOffset: 0, correctionTracking: false })
  },
  correctionQuestionId() { return this.packet && this.packet.question && this.packet.question._id || '' },
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
    if (this.data.sendingCorrection || !this.packet || !this.packet.question) return
    if (!this.data.correctionType) return this.uvToast({ type: 'err', text: '请选择问题类型' })
    const draft = { questionId: this.packet.question._id, type: this.data.correctionType, text: this.data.correctionText || '' }
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
    } catch (e) {
      view.error(e)
    } finally {
      this.setData({ sendingCorrection: false })
    }
  }
})
