const { shuffleDish, getDishDetail } = require('../../utils/api')
const { addToHistory, getStorage, getUserPreferences, setUserPreferences, isLoggedIn } = require('../../utils/storage')
const { ingredientTypes, cuisineTypes, spiceLevels } = require('../../mock/dishes')
const { enrichIngredientType, enrichCuisine, enrichSpice } = require('../../utils/icon-map')

Page({
  data: {
    spinning: false,
    history: [],
    isLoggedIn: false,
    ingredientCounts: [2, 3, 4],
    activeCount: 3,
    ingredientTypes: ingredientTypes.map(enrichIngredientType),
    activeIngredientType: 'all',
    cuisineTypes: cuisineTypes.map(enrichCuisine),
    activeCuisine: 'all',
    spiceLevels: spiceLevels.map(enrichSpice),
    activeSpiceLevel: 'all'
  },

  onLoad() {
    const prefs = getUserPreferences()
    this.setData({
      activeCount: prefs.ingredientCount || this.data.activeCount,
      activeIngredientType: prefs.ingredientType || this.data.activeIngredientType,
      activeCuisine: prefs.cuisine || this.data.activeCuisine,
      activeSpiceLevel: prefs.spiceLevel || this.data.activeSpiceLevel
    })
    this._loadHistory()
  },

  onShow() {
    this._loadHistory()
    this.setData({ isLoggedIn: isLoggedIn() })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  _loadHistory() {
    const history = getStorage('dishHistory', [])
    this.setData({ history: history.slice(0, 10) })
  },

  onShuffleTap() {
    if (this.data.spinning) return
    wx.vibrateShort({ type: 'medium' })
    this.setData({ spinning: true })
    const machine = this.selectComponent('#slotMachine')
    if (machine) machine.startSpin()
  },

  async onSpinEnd(e) {
    // 使用摇杆机实际摇出的食材作为匹配依据
    const selectedIngredients = (e && e.detail && e.detail.selectedIngredients) || []
    const preferredDishId = e && e.detail && e.detail.preferredDishId

    const options = {
      category: this.data.activeCuisine,
      spiceLevel: this.data.activeSpiceLevel,
      ingredientCount: this.data.activeCount,
      ingredientType: this.data.activeIngredientType,
      selectedIngredients: selectedIngredients.map(i => i.name),
      preferredDishId
    }

    try {
      const result = await shuffleDish(options)
      const dish = result.matchedDish || result.matched_dish
      const matchedDishes = result.matchedDishes || result.matched_dishes || []
      this.setData({ spinning: false })

      if (!dish) {
        wx.showToast({ title: '暂时没找到合适菜品', icon: 'none' })
        return
      }

      addToHistory(dish)
      const app = getApp()
      app.globalData.currentDish = dish
      app.globalData.matchedDishes = matchedDishes
      setTimeout(() => { wx.navigateTo({ url: '/pages/result/result' }) }, 420)
    } catch (err) {
      this.setData({ spinning: false })
      wx.showToast({ title: '推荐失败，请再试一次', icon: 'none' })
    }
  },

  onCuisineTap(e) {
    const activeCuisine = e.currentTarget.dataset.cuisine
    this.setData({ activeCuisine })
    this._savePreferences({ cuisine: activeCuisine })
  },

  onSpiceTap(e) {
    const activeSpiceLevel = e.currentTarget.dataset.spice
    this.setData({ activeSpiceLevel })
    this._savePreferences({ spiceLevel: activeSpiceLevel })
  },

  onCountTap(e) {
    const activeCount = e.currentTarget.dataset.count
    this.setData({ activeCount })
    this._savePreferences({ ingredientCount: activeCount })
  },

  onTypeTap(e) {
    const activeIngredientType = e.currentTarget.dataset.type.key
    this.setData({ activeIngredientType })
    this._savePreferences({ ingredientType: activeIngredientType })
  },

  _savePreferences(patch) {
    setUserPreferences(Object.assign({
      ingredientCount: this.data.activeCount,
      ingredientType: this.data.activeIngredientType,
      cuisine: this.data.activeCuisine,
      spiceLevel: this.data.activeSpiceLevel
    }, patch || {}))
  },

  async onHistoryTap(e) {
    const dish = e.currentTarget.dataset.dish
    const fullDish = await getDishDetail(dish.id)
    if (fullDish) {
      const app = getApp()
      app.globalData.currentDish = fullDish
      wx.navigateTo({ url: '/pages/result/result' })
    }
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有推荐记录吗？',
      confirmColor: '#FF6B1A',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('dishHistory')
          this.setData({ history: [] })
        }
      }
    })
  }
})
