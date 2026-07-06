const { getVideoDetail } = require('../../utils/api')

Page({
  data: {
    video: null,
    relatedVideos: []
  },

  async onLoad(options) {
    const videoId = options.videoId

    if (videoId) {
      const data = await getVideoDetail(videoId)
      if (data && data.video) {
        this.setData({
          video: data.video,
          relatedVideos: data.related || []
        })
        wx.setNavigationBarTitle({ title: data.video.title })
      } else {
        this._showError()
      }
    } else {
      this._showError()
    }
  },

  /**
   * 视频播放错误
   */
  onVideoError(e) {
    console.error('视频播放错误:', e.detail)
    wx.showToast({
      title: '视频加载失败，请检查网络',
      icon: 'none'
    })
  },

  /**
   * 查看相关视频
   */
  onRelatedVideo(e) {
    const video = e.currentTarget.dataset.video
    wx.redirectTo({
      url: `/pages/video-player/video-player?videoId=${video.id}`
    })
  },

  _showError() {
    wx.showToast({ title: '视频不存在', icon: 'none' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})