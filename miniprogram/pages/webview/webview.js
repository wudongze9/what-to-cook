Page({
  data: {
    url: '',
    title: '教学视频'
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '')
    const title = decodeURIComponent(options.title || '教学视频')

    if (!/^https?:\/\//.test(url)) {
      wx.showToast({ title: '视频链接无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }

    this.setData({ url, title })
    wx.setNavigationBarTitle({ title })
  },

  onCopyLink() {
    if (!this.data.url) return
    wx.setClipboardData({
      data: this.data.url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },

  onMessage() {
    // Reserved for messages from trusted web-view pages.
  }
})
