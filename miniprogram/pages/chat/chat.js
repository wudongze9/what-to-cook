const { sendChatMessage, getQuickQuestions } = require('../../utils/api')
const { saveChatMessage, getChatHistory } = require('../../utils/storage')
const { startVoiceRecording, stopVoiceRecording, playTTS, stopTTS } = require('../../utils/ai-service')

Page({
  data: {
    messages: [],
    inputText: '',
    isTyping: false,
    isSpeaking: false,
    isRecording: false,
    scrollToId: '',
    showSuggestion: false,
    quickQuestions: [],
    currentTTSIndex: -1
  },

  onLoad() {
    const history = getChatHistory()
    if (history.length > 0) {
      this.setData({ messages: history })
      this._scrollToBottom()
    } else {
      this._addAIMessage('你好呀，我是小厨娘 😊\n告诉我你有什么食材、想吃什么口味，或者直接问做菜问题，我来帮你把今天这顿饭安排明白。', false)
    }

    getQuickQuestions().then(questions => {
      this.setData({ quickQuestions: questions })
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }

    const app = getApp()
    if (app.globalData.pendingQuestion) {
      const question = app.globalData.pendingQuestion
      app.globalData.pendingQuestion = null
      this._addUserMessage(question)
      this._getAIReply(question)
    }
  },

  onHide() {
    // 离开页面时停止 TTS
    stopTTS()
    this.setData({ isSpeaking: false, currentTTSIndex: -1 })
  },

  onUnload() {
    stopTTS()
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isTyping) return
    // 发送时停止 TTS
    stopTTS()
    this.setData({ isSpeaking: false, currentTTSIndex: -1 })
    this._addUserMessage(text)
    this._getAIReply(text)
    this.setData({ inputText: '' })
  },

  onQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    if (this.data.isTyping) return
    stopTTS()
    this.setData({ isSpeaking: false, currentTTSIndex: -1 })
    this._addUserMessage(question)
    this._getAIReply(question)
  },

  onSuggestionTap() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  // ==================== 长按录音 ====================

  onVoiceStart(e) {
    this.setData({ isRecording: true })
    startVoiceRecording((res) => {
      // 录音结束回调
      this.setData({ isRecording: false })
      if (res && res.tempFilePath) {
        wx.showToast({
          title: '语音识别暂未接入\n已保留录音',
          icon: 'none',
          duration: 2000
        })
        console.log('录音文件:', res.tempFilePath, '时长:', res.duration + 'ms')
      }
    })
  },

  onVoiceEnd() {
    if (this.data.isRecording) {
      stopVoiceRecording()
    }
  },

  // ==================== TTS 语音播报 ====================

  onToggleTTS(e) {
    const index = e.currentTarget.dataset.index
    const text = this.data.messages[index] ? this.data.messages[index].text : ''

    // 如果当前正在播报这条消息，停止
    if (this.data.currentTTSIndex === index) {
      stopTTS()
      this._setMsgPlaying(index, false)
      this.setData({ isSpeaking: false, currentTTSIndex: -1 })
      return
    }

    // 停止之前的播报
    stopTTS()
    if (this.data.currentTTSIndex >= 0) {
      this._setMsgPlaying(this.data.currentTTSIndex, false)
    }

    // 开始播报
    this._setMsgPlaying(index, true)
    this.setData({ isSpeaking: true, currentTTSIndex: index })

    playTTS(text, {
      onEnded: () => {
        this._setMsgPlaying(index, false)
        this.setData({ isSpeaking: false, currentTTSIndex: -1 })
      },
      onError: () => {
        this._setMsgPlaying(index, false)
        this.setData({ isSpeaking: false, currentTTSIndex: -1 })
        wx.showToast({ title: '语音播报失败', icon: 'none' })
      }
    })
  },

  _setMsgPlaying(index, playing) {
    const messages = this.data.messages.slice()
    if (messages[index]) {
      messages[index] = Object.assign({}, messages[index], { playing })
      this.setData({ messages })
    }
  },

  // ==================== 消息处理 ====================

  _addUserMessage(text) {
    const messages = this.data.messages.concat([{ text, isUser: true }])
    this.setData({ messages, showSuggestion: false })
    saveChatMessage({ text, isUser: true })
    this._scrollToBottom()
  },

  _addAIMessage(text, persist = true) {
    const messages = this.data.messages.concat([{ text, isUser: false }])
    this.setData({ messages, showSuggestion: messages.length > 3 })
    if (persist) saveChatMessage({ text, isUser: false })
    this._scrollToBottom()
  },

  async _getAIReply(userMessage) {
    this.setData({ isTyping: true })
    this._scrollToBottom()

    const context = this.data.messages.slice(-6).map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text
    }))

    try {
      const result = await sendChatMessage(userMessage, context)
      const replyText = typeof result === 'string' ? result : result.text
      const delay = typeof result === 'string' ? 520 : (result.delay || 520)

      setTimeout(() => {
        this.setData({ isTyping: false })
        this._addAIMessage(replyText)
      }, delay)
    } catch (err) {
      this.setData({ isTyping: false })
      this._addAIMessage('我刚刚有点没听清，可以换个问法再问我一次。')
    }
  },

  _scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'msg-bottom' })
    }, 80)
  }
})
