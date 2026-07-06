const { shuffleDish, getDishDetail } = require('../../utils/api')
const { addToHistory, getStorage } = require('../../utils/storage')
const { ingredientTypes, cuisineTypes, spiceLevels } = require('../../mock/dishes')
const { enrichIngredientType, enrichCuisine, enrichSpice } = require('../../utils/icon-map')

Page({
  data: {
    spinning: false,
    history: [],
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
    this._loadHistory()
  },

  onShow() {
    this._loadHistory()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
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

  async onSpinEnd() {
    const options = {
      category: this.data.activeCuisine,
      spiceLevel: this.data.activeSpiceLevel,
      ingredientCount: this.data.activeCount,
      ingredientType: this.data.activeIngredientType
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
    this.setData({ activeCuisine: e.currentTarget.dataset.cuisine })
  },

  onSpiceTap(e) {
    this.setData({ activeSpiceLevel: e.currentTarget.dataset.spice })
  },

  onCountTap(e) {
    this.setData({ activeCount: e.currentTarget.dataset.count })
  },

  onTypeTap(e) {
    this.setData({ activeIngredientType: e.currentTarget.dataset.type.key })
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
