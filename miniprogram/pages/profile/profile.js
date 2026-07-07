const {
  getStorage,
  toggleFavorite,
  getShoppingList,
  toggleShoppingItem,
  clearCheckedShoppingItems,
  isLoggedIn,
  getUserInfo,
  removeToken
} = require('../../utils/storage')
const {
  getDishDetail,
  getMyFavorites,
  removeMyFavorite,
  getMyHistory,
  clearMyHistory
} = require('../../utils/api')
const { groupShoppingList } = require('../../utils/ingredient-tools')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    historyCount: 0,
    favoritesCount: 0,
    shoppingCount: 0,
    favorites: [],
    history: [],
    shoppingGroups: [],
    loadingCloud: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this._loadData()
  },

  async _loadData() {
    const loggedIn = isLoggedIn()
    const userInfo = getUserInfo()
    this.setData({ isLoggedIn: loggedIn, userInfo })

    const shoppingList = getShoppingList()
    const shoppingGroups = groupShoppingList(shoppingList)

    if (loggedIn) {
      // 已登录：从云端加载收藏和历史
      this.setData({ loadingCloud: true })
      try {
        const [favorites, history] = await Promise.all([
          getMyFavorites().catch(() => []),
          getMyHistory().catch(() => [])
        ])
        this.setData({
          favorites,
          favoritesCount: favorites.length,
          history,
          historyCount: history.length,
          shoppingCount: shoppingList.filter(item => !item.checked).length,
          shoppingGroups,
          loadingCloud: false
        })
      } catch (e) {
        this.setData({ loadingCloud: false })
      }
    } else {
      // 未登录：使用本地数据
      const history = getStorage('dishHistory', [])
      const favorites = getStorage('favorites', [])
      this.setData({
        history,
        historyCount: history.length,
        favorites,
        favoritesCount: favorites.length,
        shoppingCount: shoppingList.filter(item => !item.checked).length,
        shoppingGroups
      })
    }
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后收藏和历史将不再同步，确定退出登录吗？',
      confirmColor: '#FF6B1A',
      success: (res) => {
        if (res.confirm) {
          removeToken()
          const app = getApp()
          app.globalData.token = ''
          app.globalData.userInfo = null
          wx.showToast({ title: '已退出登录', icon: 'none' })
          this._loadData()
        }
      }
    })
  },

  onAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
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

  async onRemoveFavorite(e) {
    const dish = e.currentTarget.dataset.dish
    if (this.data.isLoggedIn) {
      try {
        await removeMyFavorite(dish.id)
        this._loadData()
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    } else {
      const result = toggleFavorite(dish)
      this.setData({
        favorites: result.favorites,
        favoritesCount: result.favorites.length
      })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    }
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有推荐记录吗？',
      confirmColor: '#FF6B1A',
      success: async (res) => {
        if (res.confirm) {
          if (this.data.isLoggedIn) {
            try {
              await clearMyHistory()
              this._loadData()
            } catch (err) {
              wx.showToast({ title: '清空失败', icon: 'none' })
            }
          } else {
            wx.removeStorageSync('dishHistory')
            this.setData({ history: [], historyCount: 0 })
          }
        }
      }
    })
  },

  onToggleShoppingItem(e) {
    const id = e.currentTarget.dataset.id
    const list = toggleShoppingItem(id)
    this.setData({
      shoppingCount: list.filter(item => !item.checked).length,
      shoppingGroups: groupShoppingList(list)
    })
  },

  onClearCheckedShopping() {
    const list = clearCheckedShoppingItems()
    this.setData({
      shoppingCount: list.filter(item => !item.checked).length,
      shoppingGroups: groupShoppingList(list)
    })
    wx.showToast({ title: '已清空已买食材', icon: 'none' })
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
