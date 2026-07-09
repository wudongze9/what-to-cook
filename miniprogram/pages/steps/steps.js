const { enrichIngredient } = require('../../utils/icon-map')
const {
  addToHistory,
  addToShoppingList,
  saveCookingProgress,
  getCookingProgress,
  clearCookingProgress
} = require('../../utils/storage')
const { normalizeDish, getStepDesc } = require('../../utils/video-match')

Page({
  data: {
    dish: {},
    steps: [],
    currentStep: 0,
    currentStepInfo: {},
    totalSteps: 0,
    progressPercent: 0,
    checkedCount: 0,
    timerSeconds: 0,
    timerTotalSeconds: 0,
    timerText: '00:00',
    timerRunning: false,
    completed: false
  },

  onLoad() {
    const app = getApp()
    const dish = normalizeDish(app.globalData.currentDish)

    if (!dish) {
      wx.showToast({ title: '未获取到菜品信息', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    // 处理食材数据（添加 checked 状态 + 保留 amount 用量）
    const ingredients = dish.ingredients.map(ingredient => {
      const enriched = enrichIngredient(ingredient)
      return {
        name: enriched.name,
        amount: typeof ingredient === 'string' ? '' : (ingredient && ingredient.amount) || '',
        icon: enriched.icon,
        checked: false
      }
    })

    const saved = getCookingProgress(dish.id)
    const rawStep = saved && typeof saved.currentStep === 'number' ? saved.currentStep : 0
    const currentStep = Math.max(0, Math.min(rawStep, dish.steps.length - 1))
    const checkedNames = saved && Array.isArray(saved.checkedIngredients) ? saved.checkedIngredients : []
    const prepared = ingredients.map(item => Object.assign({}, item, {
      checked: checkedNames.includes(item.name)
    }))

    this.setData({
      dish,
      steps: dish.steps,
      totalSteps: dish.steps.length,
      ingredients: prepared,
      checkedCount: prepared.filter(i => i.checked).length,
      currentStep,
      currentStepInfo: dish.steps[currentStep] || {},
      progressPercent: Math.round(((currentStep + 1) / dish.steps.length) * 100)
    })
    this._resetTimerForStep(currentStep)
    if (saved && typeof saved.timerSeconds === 'number' && saved.timerSeconds > 0) {
      this.setData({
        timerSeconds: saved.timerSeconds,
        timerText: this._formatSeconds(saved.timerSeconds)
      })
    }

    wx.setNavigationBarTitle({ title: dish.name + ' - 做法' })
  },

  onUnload() {
    this._clearTimer()
    this._saveProgress()
  },

  onHide() {
    this._saveProgress()
  },

  /**
   * 切换食材勾选
   */
  toggleIngredient(e) {
    const index = e.currentTarget.dataset.index
    const key = `ingredients[${index}].checked`
    const ingredients = this.data.ingredients
    const nextChecked = !ingredients[index].checked
    ingredients[index].checked = nextChecked
    const checkedCount = ingredients.filter(i => i.checked).length

    this.setData({ [key]: nextChecked, checkedCount })
    this._saveProgress()
  },

  /**
   * 下一步
   */
  onNextStep() {
    const { currentStep, totalSteps } = this.data

    if (currentStep >= totalSteps - 1) {
      // 已完成
      wx.showToast({
        title: '做好了！',
        icon: 'none',
        duration: 2000
      })
      // 保存到历史
      addToHistory(this.data.dish)
      clearCookingProgress(this.data.dish.id)
      this.setData({ completed: true })
      return
    }

    this._clearTimer()
    this.setData({
      currentStep: currentStep + 1,
      currentStepInfo: this.data.steps[currentStep + 1] || {},
      progressPercent: Math.round(((currentStep + 2) / totalSteps) * 100)
    })
    this._resetTimerForStep(currentStep + 1)
    this._saveProgress()

    // 滚动到当前步骤
    this._scrollToCurrentStep()
  },

  /**
   * 上一步
   */
  onPrevStep() {
    const { currentStep, totalSteps } = this.data
    if (currentStep <= 0) return

    this._clearTimer()
    this.setData({
      currentStep: currentStep - 1,
      currentStepInfo: this.data.steps[currentStep - 1] || {},
      progressPercent: Math.round(((currentStep) / totalSteps) * 100)
    })
    this._resetTimerForStep(currentStep - 1)
    this._saveProgress()

    this._scrollToCurrentStep()
  },

  onToggleTimer() {
    if (this.data.timerRunning) {
      this._clearTimer()
      this.setData({ timerRunning: false })
      this._saveProgress()
      return
    }

    if (this.data.timerSeconds <= 0) this._resetTimerForStep(this.data.currentStep)
    this.setData({ timerRunning: true })
    this._timer = setInterval(() => {
      const next = this.data.timerSeconds - 1
      if (next <= 0) {
        this._clearTimer()
        this.setData({
          timerSeconds: 0,
          timerText: '00:00',
          timerRunning: false
        })
        wx.showToast({ title: '本步骤时间到', icon: 'none' })
        this._saveProgress()
        return
      }
      this.setData({
        timerSeconds: next,
        timerText: this._formatSeconds(next)
      })
    }, 1000)
  },

  onResetTimer() {
    this._clearTimer()
    this._resetTimerForStep(this.data.currentStep)
    this._saveProgress()
  },

  onAddShoppingList() {
    addToShoppingList(this.data.dish)
    wx.showToast({ title: '已加入采购清单', icon: 'none' })
  },

  /**
   * 滚动到当前步骤
   */
  _scrollToCurrentStep() {
    wx.createSelectorQuery().select('.step-current').boundingClientRect(rect => {
      if (rect) {
        wx.pageScrollTo({
          scrollTop: rect.top - 200,
          duration: 300
        })
      }
    }).exec()
  },

  /**
   * 看教学视频
   */
  onWatchVideo() {
    const dish = this.data.dish
    if (dish && dish.id) {
      wx.navigateTo({
        url: `/pages/video-player/video-player?dishId=${dish.id}&dishName=${encodeURIComponent(dish.name || '')}`
      })
      return
    }
    wx.switchTab({ url: '/pages/videos/videos' })
  },

  /**
   * 问问数字人
   */
  onAskAssistant() {
    const app = getApp()
    const dish = this.data.dish
    app.globalData.pendingQuestion = dish.name + '的第' + (this.data.currentStep + 1) + '步怎么做？'
    wx.switchTab({ url: '/pages/chat/chat' })
  },

  _resetTimerForStep(index) {
    const step = this.data.steps[index] || {}
    const seconds = Math.max(0, Number(step.time || 0) * 60)
    const currentStepInfo = Object.assign({}, step, {
      desc: getStepDesc(step)
    })
    this.setData({
      currentStepInfo,
      timerSeconds: seconds,
      timerTotalSeconds: seconds,
      timerText: this._formatSeconds(seconds),
      timerRunning: false
    })
  },

  _clearTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  _formatSeconds(seconds) {
    const safe = Math.max(0, Number(seconds) || 0)
    const min = Math.floor(safe / 60)
    const sec = safe % 60
    return (min < 10 ? '0' + min : '' + min) + ':' + (sec < 10 ? '0' + sec : '' + sec)
  },

  _saveProgress() {
    if (this.data.completed || !this.data.dish || !this.data.dish.id) return
    saveCookingProgress(this.data.dish.id, {
      currentStep: this.data.currentStep,
      checkedIngredients: (this.data.ingredients || [])
        .filter(item => item.checked)
        .map(item => item.name),
      timerSeconds: this.data.timerSeconds
    })
  }
})
