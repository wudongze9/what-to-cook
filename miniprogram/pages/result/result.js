const { toggleFavorite, getStorage, addToShoppingList } = require('../../utils/storage')
const { getDishDetail } = require('../../utils/api')
const { enrichIngredientWithSubstitutes } = require('../../utils/ingredient-tools')
const { normalizeDish } = require('../../utils/video-match')

Page({
  data: {
    dish: {},
    isFavorited: false,
    matchedDishes: []  // Top 3 备选菜品
  },

  onLoad() {
    const app = getApp()
    const dish = normalizeDish(app.globalData.currentDish)

    if (dish) {
      // 检查是否已收藏
      const favorites = getStorage('favorites', [])
      const isFavorited = favorites.some(f => f.id === dish.id)

      // 获取备选菜品列表（排除当前选中的）
      const matchedDishes = (app.globalData.matchedDishes || []).map(normalizeDish)
        .filter(d => d.id !== dish.id)

      const dishView = Object.assign({}, dish)
      dishView.ingredientItems = (dish.ingredients || []).map(enrichIngredientWithSubstitutes)

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
    const matchedDishes = (app.globalData.matchedDishes || []).map(normalizeDish)
      .filter(d => d.id !== fullDish.id)

    this.setData({
      dish: Object.assign({}, fullDish, {
        ingredientItems: (fullDish.ingredients || []).map(enrichIngredientWithSubstitutes)
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

  onAddShoppingList() {
    const list = addToShoppingList(this.data.dish)
    wx.showToast({
      title: '已加入采购清单',
      icon: 'none'
    })
    this.setData({ shoppingCount: list.length })
  },

  /**
   * 看教学视频
   * 统一按菜品 ID 进入视频页，由视频页查询该菜品的所有教学视频。
   * 若该菜暂无视频，视频页会展示空状态。
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
    app.globalData.pendingQuestion = this.data.dish.name + '怎么做？'
    wx.switchTab({ url: '/pages/chat/chat' })
  }
})
