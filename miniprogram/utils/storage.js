/**
 * 本地存储工具函数
 */

const KEYS = {
  DISH_HISTORY: 'dishHistory',
  FAVORITES: 'favorites',
  CHAT_MESSAGES: 'chatMessages',
  USER_PREFERENCES: 'userPreferences',
  SHOPPING_LIST: 'shoppingList',
  COOKING_PROGRESS: 'cookingProgress',
  TOKEN: 'auth_token',
  USER_INFO: 'auth_user_info'
}

/**
 * 保存数据
 */
function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data)
    return true
  } catch (e) {
    console.error('Storage set error:', key, e)
    return false
  }
}

/**
 * 读取数据
 */
function getStorage(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key)
    return data || defaultValue
  } catch (e) {
    console.error('Storage get error:', key, e)
    return defaultValue
  }
}

/**
 * 添加到历史记录（最多保留 50 条）
 */
function addToHistory(dish) {
  const history = getStorage(KEYS.DISH_HISTORY, [])
  // 去重：如果已有相同菜品，移到最前面
  const existIndex = history.findIndex(item => item.id === dish.id)
  if (existIndex > -1) {
    history.splice(existIndex, 1)
  }
  history.unshift({
    id: dish.id,
    name: dish.name,
    category: dish.category,
    timestamp: Date.now()
  })
  // 最多保留 50 条
  if (history.length > 50) {
    history.length = 50
  }
  setStorage(KEYS.DISH_HISTORY, history)
  return history
}

/**
 * 收藏/取消收藏
 */
function toggleFavorite(dish) {
  const favorites = getStorage(KEYS.FAVORITES, [])
  const existIndex = favorites.findIndex(item => item.id === dish.id)
  
  if (existIndex > -1) {
    favorites.splice(existIndex, 1)
  } else {
    favorites.unshift({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      difficulty: dish.difficulty,
      time: dish.time,
      timestamp: Date.now()
    })
  }
  
  setStorage(KEYS.FAVORITES, favorites)
  return { favorites, isFavorited: existIndex === -1 }
}

/**
 * 保存聊天记录
 */
function saveChatMessage(message) {
  const messages = getStorage(KEYS.CHAT_MESSAGES, [])
  const item = Object.assign({}, message)
  item.timestamp = Date.now()
  messages.push(item)
  // 最多保留 200 条
  if (messages.length > 200) {
    messages.splice(0, messages.length - 200)
  }
  setStorage(KEYS.CHAT_MESSAGES, messages)
}

/**
 * 获取聊天记录
 */
function getChatHistory() {
  return getStorage(KEYS.CHAT_MESSAGES, [])
}

function getUserPreferences() {
  return getStorage(KEYS.USER_PREFERENCES, {})
}

function setUserPreferences(prefs) {
  const current = getUserPreferences()
  const next = Object.assign({}, current, prefs || {}, { updatedAt: Date.now() })
  setStorage(KEYS.USER_PREFERENCES, next)
  return next
}

function addToShoppingList(dish) {
  const list = getStorage(KEYS.SHOPPING_LIST, [])
  const ingredients = dish && Array.isArray(dish.ingredients) ? dish.ingredients : []
  const dishId = dish && dish.id ? String(dish.id) : 'unknown'
  const dishName = dish && dish.name ? dish.name : '未命名菜品'
  const next = list.slice()

  ingredients.forEach((ingredient) => {
    // 兼容旧字符串格式与新对象格式 {name, amount}
    const name = typeof ingredient === 'string' ? ingredient : (ingredient && ingredient.name) || ''
    const amount = typeof ingredient === 'string' ? '' : (ingredient && ingredient.amount) || ''
    if (!name) return
    const id = dishId + '::' + name
    const exist = next.find(item => item.id === id)
    if (exist) {
      exist.checked = false
      exist.amount = amount || exist.amount
      exist.updatedAt = Date.now()
      return
    }
    next.unshift({
      id,
      name,
      amount,
      dishId,
      dishName,
      checked: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  })

  setStorage(KEYS.SHOPPING_LIST, next)
  return next
}

function getShoppingList() {
  return getStorage(KEYS.SHOPPING_LIST, [])
}

function toggleShoppingItem(id) {
  const list = getShoppingList()
  const next = list.map(item => {
    if (item.id !== id) return item
    return Object.assign({}, item, {
      checked: !item.checked,
      updatedAt: Date.now()
    })
  })
  setStorage(KEYS.SHOPPING_LIST, next)
  return next
}

function clearCheckedShoppingItems() {
  const next = getShoppingList().filter(item => !item.checked)
  setStorage(KEYS.SHOPPING_LIST, next)
  return next
}

function saveCookingProgress(dishId, progress) {
  const all = getStorage(KEYS.COOKING_PROGRESS, {})
  all[String(dishId)] = Object.assign({}, progress || {}, { updatedAt: Date.now() })
  setStorage(KEYS.COOKING_PROGRESS, all)
  return all[String(dishId)]
}

function getCookingProgress(dishId) {
  const all = getStorage(KEYS.COOKING_PROGRESS, {})
  return all[String(dishId)] || null
}

function clearCookingProgress(dishId) {
  const all = getStorage(KEYS.COOKING_PROGRESS, {})
  delete all[String(dishId)]
  setStorage(KEYS.COOKING_PROGRESS, all)
  return all
}

// ==================== 登录态管理 ====================

function getToken() {
  return getStorage(KEYS.TOKEN, '')
}

function setToken(token) {
  setStorage(KEYS.TOKEN, token)
}

function removeToken() {
  try { wx.removeStorageSync(KEYS.TOKEN) } catch (e) {}
  try { wx.removeStorageSync(KEYS.USER_INFO) } catch (e) {}
}

function getUserInfo() {
  return getStorage(KEYS.USER_INFO, null)
}

function setUserInfo(user) {
  setStorage(KEYS.USER_INFO, user)
}

function isLoggedIn() {
  return !!getToken()
}

module.exports = {
  KEYS,
  setStorage,
  getStorage,
  addToHistory,
  toggleFavorite,
  saveChatMessage,
  getChatHistory,
  getUserPreferences,
  setUserPreferences,
  addToShoppingList,
  getShoppingList,
  toggleShoppingItem,
  clearCheckedShoppingItems,
  saveCookingProgress,
  getCookingProgress,
  clearCookingProgress,
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  isLoggedIn
}
