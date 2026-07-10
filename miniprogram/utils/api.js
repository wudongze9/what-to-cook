/**
 * API 服务层
 * 优先调用 FastAPI 后端；后端不可用时自动降级到本地 Mock。
 */

const runtime = require('../config/env')
const BASE_URL = runtime.API_BASE_URL
const USE_API = runtime.USE_API
const REQUEST_TIMEOUT = runtime.REQUEST_TIMEOUT
const STREAM_TIMEOUT = runtime.STREAM_TIMEOUT
const { normalizeDish, normalizeDishList, normalizeShuffleResult } = require('./video-match')
const { getToken } = require('./storage')

function isAllCategory(category) {
  return !category || category === '全部' || category === 'all'
}

function videoMatchesCategory(video, category) {
  if (isAllCategory(category)) return true
  const categories = video.matchCategories || [video.category]
  return video.category === category || categories.includes(category)
}

function normalizeRequestError(error, url, statusCode) {
  if (error && error.detail) return error
  const message = (error && error.errMsg) || '网络请求失败，请稍后重试'
  return { detail: message, statusCode, url: BASE_URL + url, cause: error }
}

function request(url, options = {}) {
  if (!USE_API) {
    return Promise.reject({
      errMsg: 'api disabled, using local mock',
      url: BASE_URL + url
    })
  }

  const method = options.method || 'GET'
  const retries = options.retries === undefined ? (method === 'GET' ? 1 : 0) : options.retries

  const execute = (attempt) => new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }
    wx.request({
      url: BASE_URL + url,
      method,
      data: options.data,
      header: Object.assign(header, options.header || {}),
      timeout: options.timeout || REQUEST_TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 失效，清除登录态
          const { removeToken } = require('./storage')
          removeToken()
          reject(Object.assign(normalizeRequestError(res.data, url, res.statusCode), { statusCode: res.statusCode }))
        } else {
          reject(Object.assign(normalizeRequestError(res.data, url, res.statusCode), { statusCode: res.statusCode }))
        }
      },
      fail: (error) => reject(normalizeRequestError(error, url, 0))
    })
  })

  return execute(0).catch((error) => {
    if (retries <= 0) throw error
    return new Promise((resolve) => setTimeout(resolve, 350)).then(() => execute(1))
  })
}

function withFallback(apiFn, fallbackFn) {
  if (!USE_API) return Promise.resolve(fallbackFn())
  return apiFn().catch((err) => {
    console.warn('[api fallback]', err)
    return fallbackFn()
  })
}

function getCategories() {
  const { getCategories } = require('../mock/dishes')
  return withFallback(
    () => request('/dishes/categories').then(r => r.categories),
    () => getCategories()
  )
}

function shuffleDish(options = {}) {
  const { category, spiceLevel, ingredientCount, ingredientType, selectedIngredients, preferredDishId, excludedIngredients } = options
  const { performShuffle } = require('../utils/shuffle')

  // 有摇出食材时走 POST，把食材作为匹配依据传给后端
  const apiCall = () => {
    if (selectedIngredients && selectedIngredients.length) {
      return request('/dishes/random', {
        method: 'POST',
        data: {
          selected_ingredients: selectedIngredients,
          preferred_dish_id: preferredDishId,
          category: (category && category !== '全部' && category !== 'all') ? category : null,
          spice_level: (spiceLevel && spiceLevel !== 'all') ? spiceLevel : null,
          excluded_ingredients: excludedIngredients || []
        }
      })
    }
    // 无摇出食材时走 GET（兜底）
    const params = []
    if (category && category !== '全部' && category !== 'all') params.push('category=' + encodeURIComponent(category))
    if (spiceLevel && spiceLevel !== 'all') params.push('spice_level=' + encodeURIComponent(spiceLevel))
    if (ingredientCount) params.push('count=' + encodeURIComponent(ingredientCount))
    if (ingredientType && ingredientType !== 'all') params.push('type=' + encodeURIComponent(ingredientType))
    const query = params.length ? '?' + params.join('&') : ''
    return request(`/dishes/random${query}`)
  }

  return withFallback(
    () => apiCall().then(normalizeShuffleResult).then(result => {
      if (!result || !result.matchedDish) {
        return Promise.reject({ detail: '后端没有返回匹配菜品', code: 'EMPTY_RECOMMENDATION' })
      }
      return result
    }),
    () => normalizeShuffleResult(performShuffle(options))
  )
}

function getDishDetail(dishId) {
  const { dishes } = require('../mock/dishes')
  return withFallback(
    () => request(`/dishes/${dishId}`).then(r => normalizeDish(r.dish)),
    () => normalizeDish(dishes.find(d => d.id === dishId) || null)
  )
}

function getDishList(category) {
  const { dishes } = require('../mock/dishes')
  return withFallback(
    () => request(`/dishes${!isAllCategory(category) ? `?category=${encodeURIComponent(category)}` : ''}`).then(r => normalizeDishList(r.dishes)),
    () => normalizeDishList(!isAllCategory(category) ? dishes.filter(d => d.category === category) : dishes)
  )
}

function getVideoList(category) {
  const dishVideosMock = require('../mock/dish-videos')
  return withFallback(
    () => request(`/videos/all/list${!isAllCategory(category) ? `?category=${encodeURIComponent(category)}` : ''}`).then(r => {
      const videos = r.videos || []
      return {
        featured: videos[0] || null,
        videos: videos.slice(1),
        total: videos.length
      }
    }),
    () => {
      const result = dishVideosMock.getAllVideos(category)
      return {
        featured: result[0] || null,
        videos: result.slice(1),
        total: result.length
      }
    }
  )
}

function getVideoCategories() {
  const { categories } = require('../mock/videos')
  return withFallback(
    () => request('/videos/categories').then(r => r.categories),
    () => categories
  )
}

function getVideoDetail(videoId) {
  const { videos } = require('../mock/videos')
  const { dishes } = require('../mock/dishes')
  return withFallback(
    () => request(`/videos/${videoId}`),
    () => {
      let video = videos.find(v => v.id === videoId)
      if (!video) {
        const dish = normalizeDish(dishes.find(d => normalizeDish(d).videoId === videoId))
        if (dish) {
          video = {
            id: videoId,
            title: dish.name + ' - 跟做教学',
            chef: '小厨娘',
            chefAvatar: '/images/icons/chef.svg',
            cover: '/images/video-cover-food.svg',
            duration: dish.time + ':00',
            views: '新课',
            category: dish.category,
            isFeatured: false,
            videoUrl: 'https://example.com/videos/placeholder.mp4',
            description: dish.description
          }
        }
      }
      return {
        video,
        related: video ? videos.filter(v => v.id !== videoId && v.category === video.category).slice(0, 4) : []
      }
    }
  )
}

// ==================== 菜品教学视频（新版：一菜多视频，外链为主）====================

/**
 * 按菜品 ID 查询所有教学视频
 * 后端：GET /videos/dish/{dish_id} → { dishId, videos, total }
 * 降级：从 mock/dish-videos.js 查询
 */
function getDishVideos(dishId) {
  const dishVideosMock = require('../mock/dish-videos')
  return withFallback(
    () => request(`/videos/dish/${dishId}`).then(r => r.videos),
    () => dishVideosMock.getVideosByDish(dishId)
  )
}

/**
 * 获取所有菜品教学视频（管理/浏览用）
 * 后端：GET /videos/all/list?category=xxx → { videos, total }
 */
function getAllDishVideos(category) {
  const dishVideosMock = require('../mock/dish-videos')
  return withFallback(
    () => request(`/videos/all/list${!isAllCategory(category) ? `?category=${encodeURIComponent(category)}` : ''}`).then(r => r.videos),
    () => dishVideosMock.getAllVideos(category)
  )
}

/**
 * 获取菜品视频详情（新版 dish_videos 表）
 * 后端：GET /videos/{video_id} → { video, related, source }
 * 降级：从 mock/dish-videos.js 查询并组装相关视频
 */
function getDishVideoDetail(videoId) {
  const dishVideosMock = require('../mock/dish-videos')
  return withFallback(
    () => request(`/videos/${videoId}`),
    () => {
      const video = dishVideosMock.getVideoById(videoId)
      if (!video) return { video: null, related: [], source: 'mock' }
      const related = dishVideosMock.getAllVideos(video.category)
        .filter(v => v.id !== videoId)
        .slice(0, 4)
      return { video, related, source: 'mock' }
    }
  )
}

/**
 * 获取所有视频来源平台
 * 后端：GET /videos/sources/list → { sources }
 */
function getDishVideoSources() {
  const dishVideosMock = require('../mock/dish-videos')
  return withFallback(
    () => request('/videos/sources/list').then(r => r.sources),
    () => dishVideosMock.getSources()
  )
}

function sendChatMessage(message, context = []) {
  const { getAIReply } = require('../mock/ai-replies')
  return withFallback(
    () => request('/chat', {
      method: 'POST',
      data: { message, context },
      timeout: STREAM_TIMEOUT
    }).then(r => r.reply),
    () => getAIReply(message)
  )
}

function arrayBufferToString(buffer) {
  const bytes = new Uint8Array(buffer)
  let text = ''
  for (let i = 0; i < bytes.length; i += 1) {
    text += String.fromCharCode(bytes[i])
  }
  return text
}

function createMockStream(message, handlers = {}) {
  const { getAIReply } = require('../mock/ai-replies')
  const result = getAIReply(message)
  const text = typeof result === 'string' ? result : (result.text || '')
  let aborted = false
  let index = 0
  let timer = null
  let rejectStream = null

  const promise = new Promise((resolve, reject) => {
    rejectStream = reject
    const tick = () => {
      if (aborted) {
        reject({ errMsg: 'request:fail abort' })
        return
      }
      if (index >= text.length) {
        if (handlers.onDone) handlers.onDone(text)
        resolve({ text })
        return
      }
      const chunk = text.slice(index, index + 4)
      index += 4
      if (handlers.onDelta) handlers.onDelta(chunk)
      timer = setTimeout(tick, 36)
    }
    timer = setTimeout(tick, 120)
  })

  return {
    promise,
    abort() {
      aborted = true
      if (timer) clearTimeout(timer)
      if (rejectStream) rejectStream({ errMsg: 'request:fail abort' })
    }
  }
}

function sendChatMessageStream(message, context = [], handlers = {}) {
  if (!USE_API) {
    return createMockStream(message, handlers)
  }

  let lineBuffer = ''
  let fullText = ''
  let didChunk = false
  let settled = false
  let task = null

  const finish = (resolve, value) => {
    if (settled) return
    settled = true
    resolve(value)
  }

  const fail = (reject, err) => {
    if (settled) return
    settled = true
    reject(err)
  }

  const handleEvent = (event, resolve, reject) => {
    if (!event || !event.type) return
    if (event.type === 'delta') {
      const text = event.text || ''
      fullText += text
      if (handlers.onDelta) handlers.onDelta(text, fullText)
      return
    }
    if (event.type === 'done') {
      const text = event.text || fullText
      if (handlers.onDone) handlers.onDone(text)
      finish(resolve, { text })
      return
    }
    if (event.type === 'error') {
      fail(reject, event)
    }
  }

  const processText = (text, resolve, reject) => {
    lineBuffer += text
    const lines = lineBuffer.split('\n')
    lineBuffer = lines.pop() || ''
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      try {
        handleEvent(JSON.parse(trimmed), resolve, reject)
      } catch (err) {
        fail(reject, err)
      }
    })
  }

  const promise = new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }

    task = wx.request({
      url: BASE_URL + '/chat/stream',
      method: 'POST',
      data: { message, context },
      header,
      timeout: STREAM_TIMEOUT,
      enableChunked: true,
      responseType: 'arraybuffer',
      success: (res) => {
        if (!didChunk) {
          fail(reject, { errMsg: 'chunk unsupported', statusCode: res.statusCode })
          return
        }
        if (!settled) {
          if (lineBuffer.trim()) {
            processText('\n', resolve, reject)
          }
          if (!settled) {
            if (handlers.onDone) handlers.onDone(fullText)
            finish(resolve, { text: fullText })
          }
        }
      },
      fail: (err) => fail(reject, err)
    })

    if (!task || typeof task.onChunkReceived !== 'function') {
      if (task && typeof task.abort === 'function') task.abort()
      fail(reject, { errMsg: 'onChunkReceived unsupported' })
      return
    }

    task.onChunkReceived((res) => {
      didChunk = true
      processText(arrayBufferToString(res.data), resolve, reject)
    })
  })

  return {
    promise,
    abort() {
      if (task && typeof task.abort === 'function') {
        task.abort()
      }
    }
  }
}

function getQuickQuestions() {
  return withFallback(
    () => request('/chat/quick-questions').then(r => r.questions),
    () => [
      '炒菜怎么不粘锅？',
      '番茄怎么炒出汁？',
      '怎么让肉变嫩？',
      '火候怎么掌握？'
    ]
  )
}

function getCuisineTypes() {
  const { cuisineTypes } = require('../mock/dishes')
  return withFallback(
    () => request('/dishes/cuisines').then(r => r.cuisines),
    () => cuisineTypes
  )
}

function getSpiceLevels() {
  const { spiceLevels } = require('../mock/dishes')
  return withFallback(
    () => request('/dishes/spice-levels').then(r => r.levels),
    () => spiceLevels
  )
}

// ==================== 用户认证 ====================

function register(username, password, nickname) {
  return withFallback(
    () => request('/auth/register', {
      method: 'POST',
      data: { username, password, nickname: nickname || '' }
    }),
    () => ({
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'local-' + username,
        username,
        nickname: nickname || username,
        role: 'user'
      },
      message: '注册成功'
    })
  )
}

function login(username, password) {
  return withFallback(
    () => request('/auth/login', {
      method: 'POST',
      data: { username, password }
    }),
    () => ({
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'local-' + username,
        username,
        nickname: username,
        role: 'user'
      },
      message: '登录成功'
    })
  )
}

function wxLogin(code, nickname, avatar) {
  return withFallback(
    () => request('/auth/wx-login', {
      method: 'POST',
      data: { code, nickname: nickname || '', avatar: avatar || '' }
    }),
    () => ({
      token: 'mock-wx-token-' + Date.now(),
      user: {
        id: 'wx-local',
        username: 'wechat_user',
        nickname: nickname || '微信用户',
        avatar: avatar || '',
        role: 'user'
      },
      message: '微信登录成功'
    })
  )
}

function getMe() {
  return request('/auth/me')
}

function updateProfile(data) {
  return request('/auth/profile', { method: 'PUT', data })
}

function getPreferences() {
  return request('/auth/preferences').then(r => r.preferences || {})
}

function updatePreferences(data) {
  return request('/auth/preferences', { method: 'PUT', data })
}

function uploadAvatar(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    wx.uploadFile({
      url: BASE_URL + '/auth/avatar',
      filePath,
      name: 'file',
      header: token ? { Authorization: 'Bearer ' + token } : {},
      timeout: REQUEST_TIMEOUT,
      success: (response) => {
        let data = response.data
        try { data = JSON.parse(response.data) } catch (e) {}
        if (response.statusCode === 200) {
          if (data && data.avatar && data.avatar.indexOf('/') === 0) {
            data.avatar = BASE_URL.replace(/\/api\/?$/, '') + data.avatar
          }
          resolve(data)
        }
        else reject(normalizeRequestError(data, '/auth/avatar'))
      },
      fail: (error) => reject(normalizeRequestError(error, '/auth/avatar'))
    })
  })
}

function changePassword(oldPassword, newPassword) {
  return request('/auth/password', {
    method: 'PUT',
    data: { old_password: oldPassword, new_password: newPassword }
  })
}

// ==================== 用户数据（收藏/历史）====================

function getMyFavorites() {
  return request('/user/favorites').then(r => r.favorites)
}

function addMyFavorite(dishId) {
  return request('/user/favorites', { method: 'POST', data: { dish_id: dishId } })
}

function removeMyFavorite(dishId) {
  return request('/user/favorites/' + dishId, { method: 'DELETE' })
}

function checkMyFavorite(dishId) {
  return request('/user/favorites/' + dishId + '/check')
}

function getMyHistory() {
  return request('/user/history').then(r => r.history)
}

function addMyHistory(dishId) {
  return request('/user/history', { method: 'POST', data: { dish_id: dishId } })
}

function clearMyHistory() {
  return request('/user/history', { method: 'DELETE' })
}

function getCloudShoppingList() {
  return request('/user/shopping-list').then(r => r.items || [])
}

function syncCloudShoppingList(items) {
  return request('/user/shopping-list', {
    method: 'PUT',
    data: {
      items: (items || []).map(item => ({
        id: String(item.id),
        name: item.name,
        amount: item.amount || '',
        dish_id: String(item.dishId || 'manual'),
        dish_name: item.dishName || '手动添加',
        checked: !!item.checked
      }))
    }
  })
}

// ==================== 管理员 ====================

function adminGetUsers(keyword, page, pageSize) {
  const params = []
  if (keyword) params.push('keyword=' + encodeURIComponent(keyword))
  params.push('page=' + (page || 1))
  params.push('page_size=' + (pageSize || 20))
  return request('/admin/users?' + params.join('&'))
}

function adminToggleUserActive(userId) {
  return request('/admin/users/' + userId + '/toggle', { method: 'PUT' })
}

function adminSetUserAdmin(userId, isAdmin) {
  return request('/admin/users/' + userId + '/admin?is_admin=' + (isAdmin ? 'true' : 'false'), { method: 'PUT' })
}

function adminResetUserPassword(userId) {
  return request('/admin/users/' + userId + '/password', { method: 'PUT' })
}

function adminDeleteUser(userId) {
  return request('/admin/users/' + userId, { method: 'DELETE' })
}

module.exports = {
  BASE_URL,
  USE_API,
  getCategories,
  shuffleDish,
  getDishDetail,
  getDishList,
  getVideoList,
  getVideoCategories,
  getVideoDetail,
  getDishVideos,
  getAllDishVideos,
  getDishVideoDetail,
  getDishVideoSources,
  sendChatMessage,
  sendChatMessageStream,
  getQuickQuestions,
  getCuisineTypes,
  getSpiceLevels,
  register,
  login,
  wxLogin,
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  changePassword,
  getMyFavorites,
  addMyFavorite,
  removeMyFavorite,
  checkMyFavorite,
  getMyHistory,
  addMyHistory,
  clearMyHistory,
  getCloudShoppingList,
  syncCloudShoppingList,
  adminGetUsers,
  adminToggleUserActive,
  adminSetUserAdmin,
  adminResetUserPassword,
  adminDeleteUser
}
