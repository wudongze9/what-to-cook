const {
  adminGetUsers,
  adminToggleUserActive,
  adminResetUserPassword,
  adminDeleteUser,
  adminSetUserAdmin
} = require('../../utils/api')
const { getUserInfo } = require('../../utils/storage')

Page({
  data: {
    users: [],
    keyword: '',
    page: 1,
    pageSize: 20,
    total: 0,
    maxPage: 1,
    loading: false,
    currentUserId: 0
  },

  onLoad() {
    const userInfo = getUserInfo()
    this.setData({ currentUserId: userInfo ? userInfo.id : 0 })
    this._loadUsers()
  },

  async _loadUsers() {
    this.setData({ loading: true })
    try {
      const resp = await adminGetUsers(this.data.keyword, this.data.page, this.data.pageSize)
      this.setData({
        users: resp.users || [],
        total: resp.total || 0,
        maxPage: Math.ceil((resp.total || 0) / this.data.pageSize) || 1,
        loading: false
      })
    } catch (err) {
      const msg = (err && err.detail) || '加载失败'
      wx.showToast({ title: msg, icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ page: 1 })
    this._loadUsers()
  },

  async onToggleActive(e) {
    const userId = e.currentTarget.dataset.id
    try {
      await adminToggleUserActive(userId)
      this._loadUsers()
      wx.showToast({ title: '状态已更新', icon: 'success' })
    } catch (err) {
      const msg = (err && err.detail) || '操作失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  async onToggleAdmin(e) {
    const userId = e.currentTarget.dataset.id
    const isAdmin = e.currentTarget.dataset.admin
    try {
      await adminSetUserAdmin(userId, !isAdmin)
      this._loadUsers()
      wx.showToast({ title: '已更新', icon: 'success' })
    } catch (err) {
      const msg = (err && err.detail) || '操作失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  onResetPassword(e) {
    const userId = e.currentTarget.dataset.id
    const username = e.currentTarget.dataset.username
    wx.showModal({
      title: '重置密码',
      content: '确认将用户「' + username + '」的密码重置为 123456？',
      confirmColor: '#FF6B1A',
      success: async (res) => {
        if (res.confirm) {
          try {
            await adminResetUserPassword(userId)
            wx.showToast({ title: '密码已重置为 123456', icon: 'none' })
          } catch (err) {
            const msg = (err && err.detail) || '操作失败'
            wx.showToast({ title: msg, icon: 'none' })
          }
        }
      }
    })
  },

  onDeleteUser(e) {
    const userId = e.currentTarget.dataset.id
    const username = e.currentTarget.dataset.username
    wx.showModal({
      title: '删除用户',
      content: '确认删除用户「' + username + '」？此操作不可恢复。',
      confirmColor: '#E74C3C',
      success: async (res) => {
        if (res.confirm) {
          try {
            await adminDeleteUser(userId)
            this._loadUsers()
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            const msg = (err && err.detail) || '操作失败'
            wx.showToast({ title: msg, icon: 'none' })
          }
        }
      }
    })
  },

  onPrevPage() {
    if (this.data.page > 1) {
      this.setData({ page: this.data.page - 1 })
      this._loadUsers()
    }
  },

  onNextPage() {
    const maxPage = Math.ceil(this.data.total / this.data.pageSize)
    if (this.data.page < maxPage) {
      this.setData({ page: this.data.page + 1 })
      this._loadUsers()
    }
  }
})
