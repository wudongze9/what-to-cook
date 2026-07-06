const { enrichIngredient } = require('../../utils/icon-map')

Page({
  data: {
    dish: {},
    steps: [],
    currentStep: 0,
    totalSteps: 0,
    progressPercent: 0,
    checkedCount: 0
  },

  onLoad() {
    const app = getApp()
    const dish = app.globalData.currentDish

    if (!dish) {
      wx.showToast({ title: '未获取到菜品信息', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    // 处理食材数据（添加 checked 状态）
    const ingredients = dish.ingredients.map(name => ({
      name: enrichIngredient(name).name,
      icon: enrichIngredient(name).icon,
      checked: false
    }))

    this.setData({
      dish,
      steps: dish.steps,
      totalSteps: dish.steps.length,
      ingredients,
      currentStep: 0,
      progressPercent: Math.round(100 / dish.steps.length)
    })

    wx.setNavigationBarTitle({ title: dish.name + ' - 做法' })
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
  },

  /**
   * 下一步
   */
  onNextStep() {
    const { currentStep, totalSteps } = this.data

    if (currentStep >= totalSteps - 1) {
      // 已完成
      wx.showToast({
        title: '🎉 做好了！',
        icon: 'none',
        duration: 2000
      })
      // 保存到历史
      const { addToHistory } = require('../../utils/storage')
      addToHistory(this.data.dish)
      return
    }

    this.setData({
      currentStep: currentStep + 1,
      progressPercent: Math.round(((currentStep + 2) / totalSteps) * 100)
    })

    // 滚动到当前步骤
    this._scrollToCurrentStep()
  },

  /**
   * 上一步
   */
  onPrevStep() {
    const { currentStep, totalSteps } = this.data
    if (currentStep <= 0) return

    this.setData({
      currentStep: currentStep - 1,
      progressPercent: Math.round(((currentStep) / totalSteps) * 100)
    })

    this._scrollToCurrentStep()
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
  }
})
