/**
 * 本地存储工具函数
 */

const KEYS = {
  DISH_HISTORY: 'dishHistory',
  FAVORITES: 'favorites',
  CHAT_MESSAGES: 'chatMessages',
  USER_PREFERENCES: 'userPreferences'
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

module.exports = {
  KEYS,
  setStorage,
  getStorage,
  addToHistory,
  toggleFavorite,
  saveChatMessage,
  getChatHistory
}
