const { getVideoList, getVideoCategories } = require('../../utils/api')
const { videos: mockVideos, categories: mockCategories } = require('../../mock/videos')

function normalizeVideo(video) {
  const result = Object.assign({}, video)
  result.cover = video.cover || '/images/video-cover-food.svg'
  result.chefAvatar = video.chefAvatar || '/images/icons/chef.svg'
  return result
}

function localVideoData(category) {
  const result = category && category !== '全部'
    ? mockVideos.filter(v => v.category === category)
    : mockVideos
  return {
    featured: result.find(v => v.isFeatured) || result[0] || null,
    videos: result.filter(v => !v.isFeatured),
    total: result.length
  }
}

Page({
  data: {
    categories: mockCategories,
    activeCategory: '全部',
    featuredVideo: null,
    filteredVideos: [],
    allVideos: []
  },

  onLoad() {
    getVideoCategories().then(categories => {
      const usable = Array.isArray(categories) && categories.includes('全部') ? categories : mockCategories
      this.setData({ categories: usable })
    })
    this._loadVideos()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async _loadVideos(category) {
    let data = await getVideoList(category)
    if (!data || (!data.featured && (!data.videos || data.videos.length === 0))) {
      data = localVideoData(category)
    }
    const featured = data.featured ? normalizeVideo(data.featured) : null
    const videos = (data.videos || []).map(normalizeVideo)
    this.setData({
      allVideos: (featured ? [featured] : []).concat(videos),
      featuredVideo: featured,
      filteredVideos: videos
    })
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this._loadVideos(category)
  },

  onPlayVideo(e) {
    const { video } = e.detail
    wx.navigateTo({
      url: `/pages/video-player/video-player?videoId=${video.id}`
    })
  },

  onAskAssistant() {
    wx.switchTab({ url: '/pages/chat/chat' })
  }
})
