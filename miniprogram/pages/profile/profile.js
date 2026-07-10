const {
  setStorage,
  getStorage,
  toggleFavorite,
  getShoppingList,
  toggleShoppingItem,
  clearCheckedShoppingItems,
  upsertShoppingItem,
  removeShoppingItem,
  setAllShoppingItemsChecked,
  getUserPreferences,
  setUserPreferences,
  isLoggedIn,
  getUserInfo,
  setUserInfo,
  removeToken
} = require('../../utils/storage')
const {
  getDishDetail,
  getMyFavorites,
  removeMyFavorite,
  getMyHistory,
  clearMyHistory,
  getCloudShoppingList,
  syncCloudShoppingList,
  updateProfile,
  getMe,
  getPreferences,
  updatePreferences,
  uploadAvatar
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
    loadingCloud: false,
    showProfileEditor: false,
    savingProfile: false,
    profileDraft: { nickname: '', signature: '', avatar: '' },
    showPreferenceEditor: false,
    preferenceSummary: '尚未设置饮食偏好',
    preferenceDraft: {},
    selectedDietaryMap: {},
    dietaryOptions: ['减脂', '高蛋白', '素食', '少油', '少盐'],
    spiceOptions: [
      { key: 'all', label: '不限' },
      { key: '不辣', label: '不辣' },
      { key: '微辣', label: '微辣' },
      { key: '中辣', label: '中辣' },
      { key: '重辣', label: '重辣' }
    ],
    showShoppingEditor: false,
    shoppingDraft: { id: '', name: '', amount: '' },
    avatarOptions: [
      { path: '/images/ai-chef-v2.png' },
      { path: '/images/icons/chef.svg' },
      { path: '/images/icons/user.svg' },
      { path: '/images/icons/ai.svg' }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this._loadData()
  },

  async _loadData() {
    let loggedIn = isLoggedIn()
    let userInfo = getUserInfo()
    this.setData({ isLoggedIn: loggedIn, userInfo })

    const shoppingList = getShoppingList()
    const shoppingGroups = groupShoppingList(shoppingList)

    if (loggedIn) {
      try {
        const session = await getMe()
        userInfo = session.user || userInfo
        if (userInfo) setUserInfo(userInfo)
        this.setData({ userInfo })
      } catch (error) {
        if (error && error.statusCode === 401) {
          removeToken()
          loggedIn = false
          userInfo = null
          this.setData({ isLoggedIn: false, userInfo: null })
        }
      }
    }

    if (loggedIn) {
      // 已登录：从云端加载收藏和历史
      this.setData({ loadingCloud: true })
      try {
        const [favorites, history, preferences, cloudShopping] = await Promise.all([
          getMyFavorites().catch(() => []),
          getMyHistory().catch(() => []),
          getPreferences().catch(() => getUserPreferences()),
          getCloudShoppingList().catch(() => [])
        ])
        setUserPreferences(preferences)
        const syncedShopping = cloudShopping.length ? cloudShopping : shoppingList
        if (cloudShopping.length) setStorage('shoppingList', cloudShopping)
        if (!cloudShopping.length && shoppingList.length) syncCloudShoppingList(shoppingList).catch(() => {})
        this.setData({
          favorites,
          favoritesCount: favorites.length,
          history,
          historyCount: history.length,
          shoppingCount: syncedShopping.filter(item => !item.checked).length,
          shoppingGroups: groupShoppingList(syncedShopping),
          loadingCloud: false,
          preferenceSummary: this._preferenceSummary(preferences)
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
        shoppingGroups,
        preferenceSummary: this._preferenceSummary(getUserPreferences())
      })
    }
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onEditProfile() {
    if (!this.data.isLoggedIn || !this.data.userInfo) {
      this.onLogin()
      return
    }
    const user = this.data.userInfo
    this.setData({
      showProfileEditor: true,
      profileDraft: {
        nickname: user.nickname || user.username || '',
        signature: user.signature || '',
        avatar: user.avatar || '/images/ai-chef-v2.png'
      }
    })
  },

  onCloseProfileEditor() {
    if (this.data.savingProfile) return
    this.setData({ showProfileEditor: false })
  },

  onProfileEditorTap() {},

  onSelectAvatar(e) {
    this.setData({ 'profileDraft.avatar': e.currentTarget.dataset.avatar })
  },

  async onChooseAvatar(e) {
    const filePath = e.detail.avatarUrl
    if (!filePath) return
    if (!this.data.isLoggedIn) {
      this.setData({ 'profileDraft.avatar': filePath })
      return
    }
    wx.showLoading({ title: '上传中' })
    try {
      const result = await uploadAvatar(filePath)
      this.setData({ 'profileDraft.avatar': result.avatar || filePath })
    } catch (error) {
      wx.showToast({ title: (error && error.detail) || '头像上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onNicknameInput(e) {
    this.setData({ 'profileDraft.nickname': e.detail.value })
  },

  onSignatureInput(e) {
    this.setData({ 'profileDraft.signature': e.detail.value })
  },

  async onSaveProfile() {
    const draft = this.data.profileDraft
    const nickname = (draft.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    this.setData({ savingProfile: true })
    try {
      const result = await updateProfile({
        nickname,
        signature: (draft.signature || '').trim(),
        avatar: draft.avatar || '/images/ai-chef-v2.png'
      })
      const user = result.user || Object.assign({}, this.data.userInfo, draft, { nickname })
      setUserInfo(user)
      const app = getApp()
      app.globalData.userInfo = user
      this.setData({ userInfo: user, savingProfile: false, showProfileEditor: false })
      wx.showToast({ title: '资料已保存', icon: 'success' })
    } catch (err) {
      this.setData({ savingProfile: false })
      wx.showToast({ title: (err && err.detail) || '保存失败', icon: 'none' })
    }
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

  onToggleAllShopping() {
    const list = getShoppingList()
    const shouldCheck = list.some(item => !item.checked)
    this._applyShoppingList(setAllShoppingItemsChecked(shouldCheck))
  },

  onAddShoppingItem() {
    this.setData({
      showShoppingEditor: true,
      shoppingDraft: { id: '', name: '', amount: '' }
    })
  },

  onEditShoppingItem(e) {
    const id = e.currentTarget.dataset.id
    const item = getShoppingList().find(current => current.id === id)
    if (!item) return
    this.setData({
      showShoppingEditor: true,
      shoppingDraft: { id: item.id, name: item.name, amount: item.amount || '' }
    })
  },

  onShoppingDraftInput(e) {
    this.setData({ ['shoppingDraft.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  onSaveShoppingItem() {
    const draft = this.data.shoppingDraft
    if (!(draft.name || '').trim()) {
      wx.showToast({ title: '请填写食材名称', icon: 'none' })
      return
    }
    this._applyShoppingList(upsertShoppingItem(draft))
    this.setData({ showShoppingEditor: false })
  },

  onDeleteShoppingItem() {
    const id = this.data.shoppingDraft.id
    if (id) this._applyShoppingList(removeShoppingItem(id))
    this.setData({ showShoppingEditor: false })
  },

  onCloseShoppingEditor() {
    this.setData({ showShoppingEditor: false })
  },

  onShareShoppingList() {
    const text = getShoppingList()
      .filter(item => !item.checked)
      .map(item => '- ' + item.name + (item.amount ? ' ' + item.amount : ''))
      .join('\n')
    if (!text) {
      wx.showToast({ title: '暂无待买食材', icon: 'none' })
      return
    }
    wx.setClipboardData({ data: '今天的采购清单\n' + text })
  },

  _applyShoppingList(list) {
    this.setData({
      shoppingCount: list.filter(item => !item.checked).length,
      shoppingGroups: groupShoppingList(list)
    })
    if (this.data.isLoggedIn) syncCloudShoppingList(list).catch(() => {
      wx.showToast({ title: '清单已保存在本地，云端同步失败', icon: 'none' })
    })
  },

  onEditPreferences() {
    const prefs = getUserPreferences()
    const spiceAliases = { mild: '不辣', light: '微辣', medium: '中辣', hot: '重辣' }
    const selectedDietaryMap = {}
    ;(prefs.dietary_tags || []).forEach(tag => { selectedDietaryMap[tag] = true })
    this.setData({
      showPreferenceEditor: true,
      selectedDietaryMap,
      preferenceDraft: {
        dietary_tags: prefs.dietary_tags || [],
        dislikedText: (prefs.disliked_ingredients || []).join('、'),
        allergenText: (prefs.allergens || []).join('、'),
        household_size: prefs.household_size || 1,
        default_spice: spiceAliases[prefs.default_spice] || prefs.default_spice || 'all'
      }
    })
  },

  onClosePreferenceEditor() { this.setData({ showPreferenceEditor: false }) },
  onPreferenceEditorTap() {},

  onToggleDietaryTag(e) {
    const tag = e.currentTarget.dataset.tag
    const tags = (this.data.preferenceDraft.dietary_tags || []).slice()
    const index = tags.indexOf(tag)
    if (index >= 0) tags.splice(index, 1)
    else tags.push(tag)
    const selectedDietaryMap = Object.assign({}, this.data.selectedDietaryMap, { [tag]: index < 0 })
    this.setData({ 'preferenceDraft.dietary_tags': tags, selectedDietaryMap })
  },

  onPreferenceTextInput(e) {
    this.setData({ ['preferenceDraft.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  onHouseholdStep(e) {
    const delta = Number(e.currentTarget.dataset.delta || 0)
    const current = Number(this.data.preferenceDraft.household_size || 1)
    this.setData({ 'preferenceDraft.household_size': Math.max(1, Math.min(20, current + delta)) })
  },

  onSelectDefaultSpice(e) {
    this.setData({ 'preferenceDraft.default_spice': e.currentTarget.dataset.spice })
  },

  async onSavePreferences() {
    const draft = this.data.preferenceDraft
    const split = value => String(value || '').split(/[、,，]/).map(item => item.trim()).filter(Boolean)
    const preferences = {
      dietary_tags: draft.dietary_tags || [],
      disliked_ingredients: split(draft.dislikedText),
      allergens: split(draft.allergenText),
      household_size: Number(draft.household_size || 1),
      default_spice: draft.default_spice || 'all'
    }
    setUserPreferences(preferences)
    if (this.data.isLoggedIn) {
      try { await updatePreferences(preferences) } catch (error) {
        wx.showToast({ title: '已保存本地，云端同步失败', icon: 'none' })
      }
    }
    this.setData({
      showPreferenceEditor: false,
      preferenceSummary: this._preferenceSummary(preferences)
    })
  },

  _preferenceSummary(preferences) {
    const parts = []
    if (preferences.household_size) parts.push(preferences.household_size + '人用餐')
    if (preferences.dietary_tags && preferences.dietary_tags.length) parts.push(preferences.dietary_tags.join('、'))
    if (preferences.allergens && preferences.allergens.length) parts.push('避开' + preferences.allergens.join('、'))
    return parts.length ? parts.join(' · ') : '尚未设置饮食偏好'
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
