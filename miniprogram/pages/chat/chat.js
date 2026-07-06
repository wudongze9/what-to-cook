const { sendChatMessage, getQuickQuestions } = require('../../utils/api')
const { saveChatMessage, getChatHistory } = require('../../utils/storage')
const { startVoiceRecognition } = require('../../utils/ai-service')

Page({
  data: {
    messages: [],
    inputText: '',
    isTyping: false,
    scrollToId: '',
    showSuggestion: false,
    quickQuestions: []
  },

  onLoad() {
    const history = getChatHistory()
    if (history.length > 0) {
      this.setData({ messages: history })
      this._scrollToBottom()
    } else {
      this._addAIMessage('你好呀，我是小厨娘。告诉我你有什么食材、想吃什么口味，或者直接问做菜问题，我来帮你把今天这顿饭安排明白。', false)
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

  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isTyping) return
    this._addUserMessage(text)
    this._getAIReply(text)
    this.setData({ inputText: '' })
  },

  onQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    this._addUserMessage(question)
    this._getAIReply(question)
  },

  onSuggestionTap() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  async onVoiceInput() {
    try {
      wx.showLoading({ title: '正在聆听...' })
      const text = await startVoiceRecognition()
      wx.hideLoading()
      if (text) {
        this.setData({ inputText: text })
        this.onSend()
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '语音识别暂未接入，请手动输入',
        icon: 'none'
      })
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
      const index = this.data.messages.length
      this.setData({ scrollToId: `msg-${index}` })
    }, 80)
  }
})
