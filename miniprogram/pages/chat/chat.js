const { sendChatMessage, sendChatMessageStream, getQuickQuestions } = require('../../utils/api')
const { saveChatMessage, getChatHistory } = require('../../utils/storage')
const { startVoiceRecognition, stopVoiceRecognition, playTTS, stopTTS } = require('../../utils/ai-service')

Page({
  data: {
    messages: [],
    inputText: '',
    isTyping: false,
    isSpeaking: false,
    isRecording: false,
    recognizeText: '',
    scrollToId: '',
    showSuggestion: false,
    quickQuestions: [],
    recipePrompts: [
      { text: '番茄炒蛋', question: '番茄炒蛋怎么做？', icon: '/images/icons/tomato.svg' },
      { text: '红烧肉', question: '红烧肉怎么做？', icon: '/images/icons/meat.svg' },
      { text: '土豆片', question: '干锅土豆片怎么做？', icon: '/images/icons/potato.svg' }
    ],
    currentTTSIndex: -1
  },

  onLoad() {
    const history = getChatHistory()
    if (history.length > 0) {
      this.setData({ messages: history })
      this._scrollToBottom()
    } else {
      this._addAIMessage(
        '你好呀，我是小厨娘。\n你可以直接问我：“番茄炒蛋怎么做？”、“这道菜火候怎么掌握？”或者“没有某个食材能用什么替换？”',
        false
      )
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
      this._submitQuestion(question)
    }
  },

  onHide() {
    this._abortStream()
    stopTTS()
    this.setData({ isSpeaking: false, currentTTSIndex: -1 })
  },

  onUnload() {
    this._abortStream()
    stopTTS()
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    if (this.data.isTyping) {
      this.onStopGenerating()
      return
    }
    const text = this.data.inputText.trim()
    if (!text || this.data.isTyping) return
    this.setData({ inputText: '' })
    this._submitQuestion(text)
  },

  onStopGenerating() {
    this._abortStream()
    this.setData({ isTyping: false })
  },

  onQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    if (!question || this.data.isTyping) return
    this._submitQuestion(question)
  },

  onRecipePrompt(e) {
    const question = e.currentTarget.dataset.question
    if (!question || this.data.isTyping) return
    this._submitQuestion(question)
  },

  onAskRecipeGuide() {
    if (this.data.isTyping) return
    this.setData({ inputText: '番茄炒蛋怎么做？' })
    wx.showToast({
      title: '可改成你想学的菜名',
      icon: 'none',
      duration: 1600
    })
  },

  onSuggestionTap() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onVoiceTap() {
    if (this.data.isRecording) {
      stopVoiceRecognition()
      return
    }

    if (this.data.isTyping) return

    stopTTS()
    this.setData({
      isSpeaking: false,
      currentTTSIndex: -1,
      isRecording: true,
      recognizeText: ''
    })

    startVoiceRecognition({
      onRecognize: (text) => {
        this.setData({ recognizeText: text })
      },
      onStop: (text) => {
        const finalText = (text || '').trim()
        this.setData({ isRecording: false, recognizeText: '' })

        if (finalText) {
          this._submitQuestion(finalText)
        } else {
          wx.showToast({
            title: '没有听清，请再说一次',
            icon: 'none',
            duration: 1800
          })
        }
      },
      onError: () => {
        this.setData({ isRecording: false, recognizeText: '' })
        wx.showToast({
          title: '语音暂不可用，请先输入提问',
          icon: 'none',
          duration: 1800
        })
      }
    })
  },

  onToggleTTS(e) {
    const index = e.currentTarget.dataset.index
    const text = this.data.messages[index] ? this.data.messages[index].text : ''

    if (this.data.currentTTSIndex === index) {
      stopTTS()
      this._setMsgPlaying(index, false)
      this.setData({ isSpeaking: false, currentTTSIndex: -1 })
      return
    }

    stopTTS()
    if (this.data.currentTTSIndex >= 0) {
      this._setMsgPlaying(this.data.currentTTSIndex, false)
    }

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

  _submitQuestion(text) {
    if (!text || this.data.isTyping) return
    stopTTS()
    this.setData({ isSpeaking: false, currentTTSIndex: -1 })
    this._addUserMessage(text)
    this._getAIReply(text)
  },

  _setMsgPlaying(index, playing) {
    const messages = this.data.messages.slice()
    if (messages[index]) {
      messages[index] = Object.assign({}, messages[index], { playing })
      this.setData({ messages })
    }
  },

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
    return messages.length - 1
  },

  _updateAIMessage(index, text) {
    const messages = this.data.messages.slice()
    if (!messages[index]) return
    messages[index] = Object.assign({}, messages[index], { text })
    this.setData({ messages, showSuggestion: messages.length > 3 })
    this._scrollToBottom()
  },

  _abortStream() {
    if (this._streamTask && typeof this._streamTask.abort === 'function') {
      this._streamTask.abort()
    }
    this._streamTask = null
  },

  async _getAIReply(userMessage) {
    this.setData({ isTyping: true })
    this._scrollToBottom()

    const context = this.data.messages.slice(-6).map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text
    }))

    const aiIndex = this._addAIMessage('', false)
    let streamedText = ''

    try {
      const streamTask = sendChatMessageStream(userMessage, context, {
        onDelta: (chunk, fullText) => {
          streamedText = fullText || (streamedText + chunk)
          this._updateAIMessage(aiIndex, streamedText)
        },
        onDone: (text) => {
          streamedText = text || streamedText
        }
      })
      this._streamTask = streamTask
      const result = await streamTask.promise
      const replyText = (result && result.text) || streamedText
      this._streamTask = null
      this.setData({ isTyping: false })
      this._updateAIMessage(aiIndex, replyText)
      if (replyText) saveChatMessage({ text: replyText, isUser: false })
    } catch (err) {
      this._streamTask = null
      const isAbort = err && err.errMsg && err.errMsg.indexOf('abort') >= 0
      if (streamedText) {
        this.setData({ isTyping: false })
        this._updateAIMessage(aiIndex, streamedText)
        saveChatMessage({ text: streamedText, isUser: false })
        return
      }

      if (isAbort) {
        this.setData({ isTyping: false })
        this._updateAIMessage(aiIndex, '已停止生成')
        return
      }

      try {
        const result = await sendChatMessage(userMessage, context)
        const replyText = typeof result === 'string' ? result : result.text
        this.setData({ isTyping: false })
        this._updateAIMessage(aiIndex, replyText)
        if (replyText) saveChatMessage({ text: replyText, isUser: false })
      } catch (fallbackErr) {
        const errorText = '我刚刚有点没听清，可以换个问法再问我一次。'
        this.setData({ isTyping: false })
        this._updateAIMessage(aiIndex, errorText)
        saveChatMessage({ text: errorText, isUser: false })
      }
    }
  },

  _scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'msg-bottom' })
    }, 80)
  }
})
