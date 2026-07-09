const { getDishVideoDetail, getDishVideos } = require('../../utils/api')

const SOURCE_LABELS = {
  bilibili: 'B站',
  douyin: '抖音',
  xiaohongshu: '小红书',
  youtube: 'YouTube',
  other: '外部'
}

Page({
  data: {
    // list | playable | external | empty
    mode: 'list',
    dishId: null,
    dishName: '',
    videoList: [],
    video: null,
    videoPoster: '',
    relatedVideos: [],
    sourceLabels: SOURCE_LABELS
  },

  async onLoad(options) {
    if (options.videoId) {
      await this._loadVideoDetail(options.videoId)
      return
    }

    if (options.dishId) {
      const dishId = parseInt(options.dishId, 10)
      this.setData({ dishId })
      await this._loadDishVideos(dishId, options.dishName || '')
      return
    }

    this._showError('参数缺失')
  },

  async _loadVideoDetail(videoId) {
    wx.showLoading({ title: '加载中' })
    try {
      const data = await getDishVideoDetail(videoId)
      wx.hideLoading()

      if (data && data.video) {
        this._renderSingleVideo(data.video, data.related || [])
        return
      }

      this._showError('视频不存在')
    } catch (err) {
      wx.hideLoading()
      this._showError('加载失败')
    }
  },

  async _loadDishVideos(dishId, dishName) {
    wx.showLoading({ title: '加载中' })
    try {
      const videos = await getDishVideos(dishId)
      wx.hideLoading()

      if (!videos || videos.length === 0) {
        this.setData({ mode: 'empty', dishName, videoList: [] })
        wx.setNavigationBarTitle({ title: dishName ? `${dishName}教学视频` : '教学视频' })
        return
      }

      if (videos.length === 1) {
        this._renderSingleVideo(videos[0], [])
        return
      }

      this.setData({
        mode: 'list',
        dishName: dishName || videos[0].dishName || '',
        videoList: videos
      })
      wx.setNavigationBarTitle({ title: (dishName || videos[0].dishName || '菜品') + '教学视频' })
    } catch (err) {
      wx.hideLoading()
      this._showError('加载失败')
    }
  },

  _renderSingleVideo(video, related) {
    const playable = video.playableInMiniprogram && video.videoUrl
    this.setData({
      mode: playable ? 'playable' : 'external',
      video,
      videoPoster: this._getVideoPoster(video),
      relatedVideos: related || []
    })
    wx.setNavigationBarTitle({ title: video.title || '视频播放' })
  },

  onSelectVideo(e) {
    const video = e.currentTarget.dataset.video
    if (!video) return
    this._renderSingleVideo(video, [])
  },

  onVideoError(e) {
    console.error('视频播放错误:', e.detail)
    wx.showToast({ title: '视频加载失败，请检查网络', icon: 'none' })
  },

  onOpenExternal() {
    const url = this.data.video && this.data.video.externalUrl
    if (!url) {
      wx.showToast({ title: '暂无视频链接', icon: 'none' })
      return
    }

    const title = this.data.video.title || '教学视频'
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      fail: () => this._copyExternalLink(url, true)
    })
  },

  onCopyLink() {
    const url = this.data.video && this.data.video.externalUrl
    if (!url) {
      wx.showToast({ title: '暂无视频链接', icon: 'none' })
      return
    }
    this._copyExternalLink(url)
  },

  _copyExternalLink(url, showModal) {
    wx.setClipboardData({
      data: url,
      success: () => {
        if (showModal) {
          wx.showModal({
            title: '无法直接打开',
            content: `已为你复制视频链接，请粘贴到浏览器访问。\n\n${url}`,
            showCancel: false,
            confirmText: '我知道了'
          })
          return
        }
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  onRelatedVideo(e) {
    const video = e.currentTarget.dataset.video
    if (!video) return
    this._renderSingleVideo(video, [])
  },

  onBackToList() {
    if (this.data.videoList.length > 0) {
      this.setData({ mode: 'list', video: null, relatedVideos: [] })
    } else {
      wx.navigateBack()
    }
  },

  _getVideoPoster(video) {
    const cover = video && video.cover ? video.cover : ''
    return /^https?:\/\//.test(cover) ? cover : ''
  },

  _showError(msg) {
    wx.showToast({ title: msg || '出错了', icon: 'none' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
