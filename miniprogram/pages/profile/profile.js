const { getStorage, toggleFavorite } = require('../../utils/storage')
const { getDishDetail } = require('../../utils/api')

Page({
  data: {
    historyCount: 0,
    favoritesCount: 0,
    favorites: [],
    history: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this._loadData()
  },

  _loadData() {
    const history = getStorage('dishHistory', [])
    const favorites = getStorage('favorites', [])
    this.setData({
      history,
      historyCount: history.length,
      favorites,
      favoritesCount: favorites.length
    })
  },

  async onDishTap(e) {
    const dish = e.currentTarget.dataset.dish
    const fullDish = await getDishDetail(dish.id)
    if (fullDish) {
      const app = getApp()
      app.globalData.currentDish = fullDish
      wx.navigateTo({ url: '/pages/result/result' })
    }
  },

  onRemoveFavorite(e) {
    const dish = e.currentTarget.dataset.dish
    const result = toggleFavorite(dish)
    this.setData({
      favorites: result.favorites,
      favoritesCount: result.favorites.length
    })
    wx.showToast({ title: '已取消收藏', icon: 'none' })
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有推荐记录吗？',
      confirmColor: '#FF6B1A',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('dishHistory')
          this.setData({ history: [], historyCount: 0 })
        }
      }
    })
  },

  onAbout() {
    wx.showModal({
      title: '今天吃什么',
      content: '帮你解决每天吃什么的终极难题。摇一摇随机推荐菜品，步骤教学、视频教程、AI 问答都在这里。',
      showCancel: false,
      confirmColor: '#FF6B1A'
    })
  }
})
