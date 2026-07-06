/**
 * API 服务层
 * 优先调用 FastAPI 后端；后端不可用时自动降级到本地 Mock。
 */

const BASE_URL = 'http://localhost:8001/api'
// 微信开发者工具默认会拦截 localhost 请求；本地预览先走 mock，联调后端时再改为 true。
const USE_API = false

function request(url, options = {}) {
  if (!USE_API) {
    return Promise.reject({
      errMsg: 'api disabled, using local mock',
      url: BASE_URL + url
    })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: { 'Content-Type': 'application/json' },
      timeout: 3500,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
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
  const { category, spiceLevel, ingredientCount, ingredientType } = options
  const { performShuffle } = require('../utils/shuffle')

  const apiCall = () => {
    const params = []
    if (category && category !== '全部' && category !== 'all') params.push('category=' + encodeURIComponent(category))
    if (spiceLevel && spiceLevel !== 'all') params.push('spice_level=' + encodeURIComponent(spiceLevel))
    if (ingredientCount) params.push('count=' + encodeURIComponent(ingredientCount))
    if (ingredientType && ingredientType !== 'all') params.push('type=' + encodeURIComponent(ingredientType))
    const query = params.length ? '?' + params.join('&') : ''
    return request(`/dishes/random${query}`)
  }

  return withFallback(apiCall, () => performShuffle(options))
}

function getDishDetail(dishId) {
  const { dishes } = require('../mock/dishes')
  return withFallback(
    () => request(`/dishes/${dishId}`).then(r => r.dish),
    () => dishes.find(d => d.id === dishId) || null
  )
}

function getDishList(category) {
  const { dishes } = require('../mock/dishes')
  return withFallback(
    () => request(`/dishes${category && category !== '全部' ? `?category=${encodeURIComponent(category)}` : ''}`).then(r => r.dishes),
    () => category && category !== '全部' ? dishes.filter(d => d.category === category) : dishes
  )
}

function getVideoList(category) {
  const { videos } = require('../mock/videos')
  return withFallback(
    () => request(`/videos${category && category !== '全部' ? `?category=${encodeURIComponent(category)}` : ''}`),
    () => {
      const result = category && category !== '全部'
        ? videos.filter(v => v.category === category)
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
  return withFallback(
    () => request(`/videos/${videoId}`),
    () => {
      const video = videos.find(v => v.id === videoId)
      return {
        video,
        related: video ? videos.filter(v => v.id !== videoId && v.category === video.category).slice(0, 4) : []
      }
    }
  )
}

function sendChatMessage(message, context = []) {
  const { getAIReply } = require('../mock/ai-replies')
  return withFallback(
    () => request('/chat', {
      method: 'POST',
      data: { message, context }
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
  getSpiceLevels
}
