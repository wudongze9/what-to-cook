const { login, register, wxLogin } = require('../../utils/api')
const { setToken, setUserInfo } = require('../../utils/storage')

Page({
  data: {
    mode: 'login',        // login | register
    username: '',
    password: '',
    nickname: '',
    loading: false
  },

  onSwitchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  async onSubmit() {
    const { mode, username, password, nickname } = this.data
    if (!username || username.length < 2) {
      wx.showToast({ title: '用户名至少2个字符', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (mode === 'register' && !nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      let resp
      if (mode === 'login') {
        resp = await login(username, password)
      } else {
        resp = await register(username, password, nickname)
      }
      this._onAuthSuccess(resp)
    } catch (err) {
      const msg = (err && err.detail) || (err && err.message) || '操作失败，请重试'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onWxLogin() {
    this.setData({ loading: true })
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      if (!loginRes.code) {
        wx.showToast({ title: '获取微信凭证失败', icon: 'none' })
        return
      }
      const resp = await wxLogin(loginRes.code, '', '')
      this._onAuthSuccess(resp)
    } catch (err) {
      const msg = (err && err.detail) || (err && err.message) || '微信登录失败'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  _onAuthSuccess(resp) {
    // 保存登录态
    setToken(resp.token)
    setUserInfo(resp.user)
    const app = getApp()
    app.globalData.token = resp.token
    app.globalData.userInfo = resp.user

    wx.showToast({ title: resp.message || '成功', icon: 'success' })

    // 延迟返回上一页或跳转到我的页面
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/profile/profile' })
      }
    }, 800)
  }
})
