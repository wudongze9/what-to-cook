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
      primary: '#9A3412',
      primaryDark: '#7C2D12',
      primaryLight: '#FB923C',
      primaryLightest: '#FFF1E8',
      accent: '#FF5A1F',
      cta: '#FF3D6E',
      purple: '#5B2B6F',
      bg: '#FFFBEB',
      bgSecondary: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#2A1735',
      textSecondary: '#6D536C',
      textTertiary: '#A78A96',
      border: '#FED7AA',
      success: '#15803D',
      warning: '#B45309',
      error: '#B42318'
    }
  }
})
