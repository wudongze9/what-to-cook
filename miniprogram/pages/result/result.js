const { toggleFavorite, getStorage } = require('../../utils/storage')
const { getDishDetail } = require('../../utils/api')
const { enrichIngredient } = require('../../utils/icon-map')

Page({
  data: {
    dish: {},
    isFavorited: false,
    matchedDishes: []  // Top 3 备选菜品
  },

  onLoad() {
    const app = getApp()
    const dish = app.globalData.currentDish

    if (dish) {
      // 检查是否已收藏
      const favorites = getStorage('favorites', [])
      const isFavorited = favorites.some(f => f.id === dish.id)

      // 获取备选菜品列表（排除当前选中的）
      const matchedDishes = (app.globalData.matchedDishes || [])
        .filter(d => d.id !== dish.id)

      const dishView = Object.assign({}, dish)
      dishView.ingredientItems = (dish.ingredients || []).map(enrichIngredient)

      this.setData({ dish: dishView, isFavorited, matchedDishes })
      wx.setNavigationBarTitle({ title: dish.name })
    } else {
      wx.showToast({ title: '未获取到菜品信息', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  /**
   * 收藏/取消收藏
   */
  onToggleFavorite() {
    const result = toggleFavorite(this.data.dish)
    this.setData({ isFavorited: result.isFavorited })
    wx.showToast({
      title: result.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  /**
   * 切换到备选菜品
   */
  async onSwitchDish(e) {
    const dish = e.currentTarget.dataset.dish
    const fullDish = await getDishDetail(dish.id)
    if (!fullDish) return

    const app = getApp()
    app.globalData.currentDish = fullDish

    // 重新检查收藏状态
    const favorites = getStorage('favorites', [])
    const isFavorited = favorites.some(f => f.id === fullDish.id)

    // 重新生成备选列表
    const matchedDishes = (app.globalData.matchedDishes || [])
      .filter(d => d.id !== fullDish.id)

    this.setData({
      dish: Object.assign({}, fullDish, {
        ingredientItems: (fullDish.ingredients || []).map(enrichIngredient)
      }),
      isFavorited,
      matchedDishes
    })
    wx.setNavigationBarTitle({ title: fullDish.name })
  },

  /**
   * 开始做菜
   */
  onStartCooking() {
    wx.navigateTo({
      url: '/pages/steps/steps'
    })
  },

  /**
   * 看教学视频
   */
  onWatchVideo() {
    const dish = this.data.dish
    let url = '/pages/videos/videos'
    if (dish && dish.videoId) {
      url += `?videoId=${dish.videoId}`
    }
    wx.switchTab({ url: '/pages/videos/videos' })
  },

  /**
   * 问问数字人
   */
  onAskAssistant() {
    const app = getApp()
    app.globalData.pendingQuestion = this.data.dish.name + '怎么做？'
    wx.switchTab({ url: '/pages/chat/chat' })
  }
})
