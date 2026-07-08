/**
 * API 服务层
 * 优先调用 FastAPI 后端；后端不可用时自动降级到本地 Mock。
 */

const BASE_URL = 'http://localhost:8001/api'
// 微信开发者工具默认会拦截 localhost 请求；本地预览先走 mock，联调后端时再改为 true。
const USE_API = true
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

function request(url, options = {}) {
  if (!USE_API) {
    return Promise.reject({
      errMsg: 'api disabled, using local mock',
      url: BASE_URL + url
    })
  }

  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: Object.assign(header, options.header || {}),
      timeout: options.timeout || 3500,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 失效，清除登录态
          const { removeToken } = require('./storage')
          removeToken()
          reject(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
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
  const { category, spiceLevel, ingredientCount, ingredientType, selectedIngredients, preferredDishId } = options
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
          spice_level: (spiceLevel && spiceLevel !== 'all') ? spiceLevel : null
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
    () => apiCall().then(normalizeShuffleResult),
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
  const { videos } = require('../mock/videos')
  return withFallback(
    () => request(`/videos${!isAllCategory(category) ? `?category=${encodeURIComponent(category)}` : ''}`),
    () => {
      const result = !isAllCategory(category)
        ? videos.filter(v => videoMatchesCategory(v, category))
        : videos
      return {
        featured: result.find(v => v.isFeatured) || null,
        videos: result.filter(v => !v.isFeatured),
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
      timeout: 120000
    }).then(r => r.reply),
    () => getAIReply(message)
  )
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
  sendChatMessage,
  getQuickQuestions,
  getCuisineTypes,
  getSpiceLevels,
  register,
  login,
  wxLogin,
  getMe,
  updateProfile,
  changePassword,
  getMyFavorites,
  addMyFavorite,
  removeMyFavorite,
  checkMyFavorite,
  getMyHistory,
  addMyHistory,
  clearMyHistory,
  adminGetUsers,
  adminToggleUserActive,
  adminSetUserAdmin,
  adminResetUserPassword,
  adminDeleteUser
}
