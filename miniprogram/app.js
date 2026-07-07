const { getToken, getUserInfo } = require('./utils/storage')

App({
  onLaunch() {
    // 初始化本地存储
    const history = wx.getStorageSync('dishHistory') || []
    const favorites = wx.getStorageSync('favorites') || []
    this.globalData.dishHistory = history
    this.globalData.favorites = favorites

    // 恢复登录态
    const token = getToken()
    const userInfo = getUserInfo()
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  },

  globalData: {
    dishHistory: [],
    favorites: [],
    currentDish: null,
    token: '',
    userInfo: null,
    // 颜色主题
    theme: {
      primary: '#F28C38',
      primaryDark: '#D96A14',
      primaryLight: '#F9B77A',
      primaryLightest: '#FFF3E4',
      bg: '#FFF9F3',
      bgSecondary: '#FFF1E4',
      surface: '#FFFFFF',
      text: '#3D2B1F',
      textSecondary: '#7A6258',
      textTertiary: '#A89288',
      border: '#F0DCC8',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#E74C3C'
    }
  }
})
