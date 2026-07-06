const { getTabIcon } = require('../utils/icon-map')

Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '摇一摇', icon: getTabIcon('shake') },
      { pagePath: '/pages/videos/videos', text: '视频', icon: getTabIcon('video') },
      { pagePath: '/pages/chat/chat', text: '问答', icon: getTabIcon('chat') },
      { pagePath: '/pages/profile/profile', text: '我的', icon: getTabIcon('profile') }
    ]
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      if (this.data.selected === index) return
      wx.switchTab({ url: path })
    }
  }
})
