<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection, DataAnalysis, Dish, Document, Film, Fold, Operation,
  Refresh, Search, SwitchButton, User, VideoCamera,
} from '@element-plus/icons-vue'
import { api, errorMessage } from './api'

type ViewKey = 'dashboard' | 'users' | 'dishes' | 'videos' | 'audit'

const token = ref(localStorage.getItem('admin_token') || '')
const currentUser = ref<any>(JSON.parse(localStorage.getItem('admin_user') || 'null'))
const loginForm = reactive({ username: '', password: '' })
const loggingIn = ref(false)
const activeView = ref<ViewKey>('dashboard')
const loading = ref(false)
const collapsed = ref(false)

const dashboard = reactive<any>({ users: 0, admins: 0, disabled_users: 0, dishes: 0, videos: 0, playable_videos: 0, favorites: 0, complete_dishes: 0, incomplete_dishes: 0, recent_logs: [] })
const users = ref<any[]>([])
const userTotal = ref(0)
const userPage = ref(1)
const userKeyword = ref('')
const dishes = ref<any[]>([])
const dishTotal = ref(0)
const dishPage = ref(1)
const dishKeyword = ref('')
const videos = ref<any[]>([])
const videoTotal = ref(0)
const videoPage = ref(1)
const videoKeyword = ref('')
const videoSource = ref('')
const logs = ref<any[]>([])
const auditTotal = ref(0)
const auditPage = ref(1)
const auditKeyword = ref('')
const auditAction = ref('')
const actionLoading = ref('')

const dishDialog = ref(false)
const dishSaving = ref(false)
const uploadingDishImage = ref(false)
const dishTab = ref('basic')
const ingredientOptions = ref<any[]>([])
const dishIngredients = ref<any[]>([])
const dishSteps = ref<any[]>([])
const dishForm = reactive<any>({ id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home', cover: '', servings: 1, tips: '' })
const videoDialog = ref(false)
const uploadingVideo = ref(false)
const videoForm = reactive<any>({ id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false })
const passwordDialog = ref(false)
const changingPassword = ref(false)
const passwordForm = reactive({ old_password: '', new_password: '', confirm_password: '' })

const auditActions = [
  ['create_dish', '新增菜品'], ['update_dish', '编辑菜品'], ['delete_dish', '删除菜品'],
  ['replace_dish_ingredients', '更新菜品食材'], ['replace_steps', '更新烹饪步骤'],
  ['upload_dish_image', '上传菜品图片'], ['save_video', '保存视频'], ['delete_video', '删除视频'], ['upload_video', '上传视频'],
  ['toggle_user_active', '变更账号状态'], ['set_user_admin', '变更管理员角色'],
  ['reset_user_password', '重置用户密码'], ['change_own_password', '修改本人密码'],
  ['bootstrap_admin_credentials', '初始化管理员凭据'],
]

const viewMeta = computed(() => ({
  dashboard: ['运营概览', '查看核心内容与用户状态'],
  users: ['用户与角色', '管理账号状态、权限与临时密码'],
  dishes: ['菜品内容', '维护菜品基础信息和烹饪内容'],
  videos: ['教学视频', '维护外链与小程序内可播放资源'],
  audit: ['审计日志', '追踪管理员敏感操作'],
}[activeView.value]))

async function login() {
  if (!loginForm.username || !loginForm.password) return ElMessage.warning('请输入用户名和密码')
  loggingIn.value = true
  try {
    const { data } = await api.post('/auth/login', loginForm)
    if (!data.user?.is_admin) throw new Error('该账号不是管理员')
    token.value = data.token
    currentUser.value = data.user
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
    await loadCurrentView()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally { loggingIn.value = false }
}

function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  token.value = ''
  currentUser.value = null
}

async function selectView(view: ViewKey) {
  activeView.value = view
  await loadCurrentView()
}

async function loadCurrentView() {
  loading.value = true
  try {
    if (activeView.value === 'dashboard') Object.assign(dashboard, (await api.get('/admin/dashboard')).data)
    if (activeView.value === 'users') {
      const { data } = await api.get('/admin/users', { params: { keyword: userKeyword.value, page: userPage.value, page_size: 20 } })
      users.value = data.users; userTotal.value = data.total
    }
    if (activeView.value === 'dishes') {
      const { data } = await api.get('/admin/dishes', { params: { keyword: dishKeyword.value, page: dishPage.value, page_size: 20 } })
      dishes.value = data.dishes; dishTotal.value = data.total
    }
    if (activeView.value === 'videos') {
      const { data } = await api.get('/videos/admin/list', { params: { keyword: videoKeyword.value, source: videoSource.value, page: videoPage.value, page_size: 20 } })
      videos.value = data.videos || []; videoTotal.value = data.total || 0
    }
    if (activeView.value === 'audit') {
      const { data } = await api.get('/admin/audit-logs', { params: { keyword: auditKeyword.value, action: auditAction.value, page: auditPage.value, page_size: 30 } })
      logs.value = data.logs || []; auditTotal.value = data.total || 0
    }
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { loading.value = false }
}

async function toggleUser(user: any) {
  if (isSelf(user)) return ElMessage.warning('不能停用当前登录账号')
  actionLoading.value = `user-toggle-${user.id}`
  try { await api.put(`/admin/users/${user.id}/toggle`); ElMessage.success('账号状态已更新'); await loadCurrentView() }
  catch (error) { ElMessage.error(errorMessage(error)) }
  finally { actionLoading.value = '' }
}

async function toggleAdmin(user: any) {
  if (isSelf(user)) return ElMessage.warning('不能修改自己的管理员权限')
  actionLoading.value = `user-admin-${user.id}`
  try { await api.put(`/admin/users/${user.id}/admin`, null, { params: { is_admin: !user.is_admin } }); ElMessage.success('角色已更新'); await loadCurrentView() }
  catch (error) { ElMessage.error(errorMessage(error)) }
  finally { actionLoading.value = '' }
}

async function resetPassword(user: any) {
  if (isSelf(user)) return ElMessage.warning('请从右上角安全设置修改自己的密码')
  try {
    await ElMessageBox.confirm(`为 ${user.nickname || user.username} 生成一次性临时密码？`, '重置密码', { type: 'warning' })
    actionLoading.value = `user-password-${user.id}`
    const { data } = await api.put(`/admin/users/${user.id}/password`)
    await navigator.clipboard.writeText(data.temporary_password)
    await ElMessageBox.alert(`临时密码：${data.temporary_password}\n已复制到剪贴板。`, '重置完成')
  } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(errorMessage(error)) }
  finally { actionLoading.value = '' }
}

async function deleteUser(user: any) {
  if (isSelf(user)) return ElMessage.warning('不能删除当前登录账号')
  try {
    await ElMessageBox.confirm(`永久删除用户 ${user.username}？`, '危险操作', { type: 'error' })
    actionLoading.value = `user-delete-${user.id}`
    await api.delete(`/admin/users/${user.id}`); ElMessage.success('用户已删除'); await loadCurrentView()
  } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(errorMessage(error)) }
  finally { actionLoading.value = '' }
}

function isSelf(user: any) { return Number(user?.id) === Number(currentUser.value?.id) }

function resetDishForm() {
  Object.assign(dishForm, { id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home', cover: '', servings: 1, tips: '' })
  dishIngredients.value = []
  dishSteps.value = []
  dishTab.value = 'basic'
}

async function openDish(row?: any) {
  resetDishForm()
  dishDialog.value = true
  try {
    if (!ingredientOptions.value.length) ingredientOptions.value = (await api.get('/admin/ingredients')).data.ingredients || []
    if (row?.id) {
      const detail = (await api.get(`/admin/dishes/${row.id}`)).data.dish
      Object.assign(dishForm, detail, { id: row.id, spice_level: detail.spiceLevel || detail.spice_level || '不辣' })
      dishIngredients.value = (detail.ingredients || []).map((item: any) => ({ ingredient_id: item.id, amount: item.amount || '', is_main: !!item.is_main }))
      dishSteps.value = (detail.steps || []).map((item: any) => ({ title: item.title || '', description: item.desc || item.description || '', time: Number(item.time || 0) }))
    }
  } catch (error) { ElMessage.error(errorMessage(error)); dishDialog.value = false }
}

async function saveDish() {
  if (!dishForm.name.trim()) return ElMessage.warning('请填写菜品名称')
  if (!dishForm.cover) { dishTab.value = 'basic'; return ElMessage.warning('请上传菜品封面') }
  if (!dishIngredients.value.length) { dishTab.value = 'ingredients'; return ElMessage.warning('请至少添加一种食材') }
  if (!dishSteps.value.length || dishSteps.value.some(step => !step.description.trim())) { dishTab.value = 'steps'; return ElMessage.warning('请补充完整的烹饪步骤') }
  const payload = { ...dishForm }; delete payload.id; delete payload.category_name
  dishSaving.value = true
  try {
    const { data } = dishForm.id ? await api.put(`/admin/dishes/${dishForm.id}`, payload) : await api.post('/admin/dishes', payload)
    const dishId = dishForm.id || data.dish.id
    await Promise.all([
      api.put(`/admin/dishes/${dishId}/ingredients`, dishIngredients.value),
      api.put(`/admin/dishes/${dishId}/steps`, dishSteps.value),
    ])
    dishDialog.value = false; ElMessage.success('菜品内容已完整保存'); await loadCurrentView()
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { dishSaving.value = false }
}

function addDishIngredient() { dishIngredients.value.push({ ingredient_id: '', amount: '', is_main: false }) }
function addDishStep() { dishSteps.value.push({ title: `步骤 ${dishSteps.value.length + 1}`, description: '', time: 0 }) }
function assetUrl(value: string) { if (!value || /^https?:\/\//.test(value)) return value; return `${new URL(api.defaults.baseURL || 'http://localhost:8002/api').origin}${value}` }

async function uploadDishImage(options: any) {
  uploadingDishImage.value = true
  try {
    const form = new FormData(); form.append('file', options.file)
    dishForm.cover = (await api.post('/admin/dish-images', form)).data.url
    ElMessage.success('封面上传成功')
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { uploadingDishImage.value = false }
}

async function deleteDish(row: any) {
  const { data } = await api.get(`/admin/dishes/${row.id}/delete-impact`)
  const impact = data.impact
  await ElMessageBox.confirm(
    `删除“${row.name}”将同时移除 ${impact.ingredients} 项食材关联、${impact.steps} 个步骤、${impact.videos} 个视频、${impact.favorites} 条收藏和 ${impact.history} 条历史记录。此操作不可恢复。`,
    '危险操作', { type: 'error', confirmButtonText: '确认永久删除' },
  )
  await api.delete(`/admin/dishes/${row.id}`); ElMessage.success('菜品已删除'); await loadCurrentView()
}

function openVideo(row?: any) {
  Object.assign(videoForm, { id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false })
  if (row) Object.assign(videoForm, {
    id: row.id || '', dish_id: row.dishId || row.dish_id || '', dish_name: row.dishName || row.dish_name || '',
    title: row.title || '', source: row.source || 'bilibili', author: row.author || '',
    external_url: row.externalUrl || row.external_url || '', video_url: row.videoUrl || row.video_url || '',
    playable_in_miniprogram: !!(row.playableInMiniprogram ?? row.playable_in_miniprogram),
  })
  videoDialog.value = true
}

async function saveVideo() {
  if (!videoForm.dish_id || !videoForm.title) return ElMessage.warning('菜品 ID 和标题必填')
  try {
    await api.post('/videos/admin/add', { ...videoForm, dish_id: Number(videoForm.dish_id) })
    videoDialog.value = false; ElMessage.success('视频已保存'); await loadCurrentView()
  } catch (error) { ElMessage.error(errorMessage(error)) }
}

async function uploadVideo(options: any) {
  uploadingVideo.value = true
  try {
    const form = new FormData()
    form.append('file', options.file)
    const { data } = await api.post('/videos/admin/upload', form)
    videoForm.video_url = data.url
    videoForm.source = 'direct'
    videoForm.playable_in_miniprogram = true
    ElMessage.success('视频上传成功')
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { uploadingVideo.value = false }
}

async function deleteVideo(row: any) {
  try {
    await ElMessageBox.confirm(`删除视频“${row.title}”？`, '确认删除', { type: 'warning' })
    await api.delete(`/videos/admin/${row.id}`); ElMessage.success('视频已删除'); await loadCurrentView()
  } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(errorMessage(error)) }
}

function previewVideo(row: any) {
  const url = row.videoUrl || row.video_url || row.externalUrl || row.external_url
  if (!url) return ElMessage.warning('该视频没有可预览地址')
  window.open(assetUrl(url), '_blank', 'noopener,noreferrer')
}

function actionLabel(action: string) { return auditActions.find(item => item[0] === action)?.[1] || action }

function showAuditDetail(row: any) {
  ElMessageBox.alert(
    `管理员：${row.admin_username || '-'}\n操作：${actionLabel(row.action)}\n对象：${row.target_type || '-'} ${row.target_id || ''}\n时间：${row.created_at || '-'}\n详情：${row.detail || '无补充详情'}`,
    '审计记录详情', { confirmButtonText: '关闭' },
  )
}

async function changePassword() {
  if (passwordForm.new_password.length < 10) return ElMessage.warning('新密码至少 10 位')
  if (passwordForm.new_password !== passwordForm.confirm_password) return ElMessage.warning('两次输入的新密码不一致')
  changingPassword.value = true
  try {
    await api.put('/auth/password', { old_password: passwordForm.old_password, new_password: passwordForm.new_password })
    passwordDialog.value = false
    Object.assign(passwordForm, { old_password: '', new_password: '', confirm_password: '' })
    ElMessage.success('密码修改成功，请妥善保存')
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { changingPassword.value = false }
}

async function refreshCurrentUser() {
  try {
    const { data } = await api.get('/auth/me')
    currentUser.value = data.user || data
    localStorage.setItem('admin_user', JSON.stringify(currentUser.value))
  } catch { /* 401 interceptor handles expired sessions */ }
}

onMounted(async () => { if (token.value) { await refreshCurrentUser(); await loadCurrentView() } })
</script>

<template>
  <main v-if="!token" class="login-page">
    <div class="login-backdrop" aria-hidden="true"><span></span><span></span><span></span></div>
    <section class="login-shell">
      <div class="login-story">
        <div class="story-brand">
          <span class="story-logo"><img src="/logo.png" alt="" /></span>
          <div><strong>今天吃什么</strong><small>What to Cook</small></div>
        </div>
        <div class="story-copy">
          <span class="eyebrow eyebrow-light">内容运营工作台</span>
          <h1>让每一道好菜，<br />都被认真看见。</h1>
          <p>集中管理用户、菜谱与教学内容，为小程序持续提供可靠、清晰且有温度的烹饪体验。</p>
        </div>
        <div class="story-features" aria-label="平台能力">
          <article><el-icon><Dish /></el-icon><div><strong>菜谱内容</strong><span>结构化维护食材与步骤</span></div></article>
          <article><el-icon><DataAnalysis /></el-icon><div><strong>运营洞察</strong><span>掌握用户与内容状态</span></div></article>
          <article><el-icon><Collection /></el-icon><div><strong>安全审计</strong><span>关键操作全程可追溯</span></div></article>
        </div>
        <p class="story-footnote">专注烹饪内容运营 · 数据安全可追踪</p>
      </div>

      <div class="login-panel-wrap">
        <section class="login-panel" aria-labelledby="login-title">
          <div class="login-heading">
            <span class="eyebrow">管理员入口</span>
            <h2 id="login-title">欢迎回来</h2>
            <p>使用管理员账号登录运营管理台</p>
          </div>
          <el-form label-position="top" @submit.prevent="login">
            <el-form-item label="管理员账号">
              <el-input v-model="loginForm.username" size="large" autocomplete="username" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item label="登录密码">
              <el-input v-model="loginForm.password" size="large" type="password" show-password autocomplete="current-password" placeholder="请输入密码" @keyup.enter="login" />
            </el-form-item>
            <el-button class="login-submit" type="primary" size="large" :loading="loggingIn" @click="login">登录管理台</el-button>
          </el-form>
          <div class="login-security"><span class="status-dot"></span>仅授权管理员可访问，操作将记录至审计日志</div>
        </section>
        <p class="login-copyright">© 2026 今天吃什么 · 运营管理系统</p>
      </div>
    </section>
  </main>

  <div v-else class="admin-shell">
    <aside :class="['sidebar', { collapsed }]">
      <div class="brand"><span class="brand-logo"><img src="/logo.png" alt="" /></span><div><strong>今天吃什么</strong><span>运营管理台</span></div></div>
      <p class="nav-label">工作空间</p>
      <nav aria-label="管理台导航">
        <button :class="{ active: activeView === 'dashboard' }" @click="selectView('dashboard')"><el-icon><DataAnalysis /></el-icon><span>运营概览</span></button>
        <button :class="{ active: activeView === 'users' }" @click="selectView('users')"><el-icon><User /></el-icon><span>用户与角色</span></button>
        <button :class="{ active: activeView === 'dishes' }" @click="selectView('dishes')"><el-icon><Dish /></el-icon><span>菜品内容</span></button>
        <button :class="{ active: activeView === 'videos' }" @click="selectView('videos')"><el-icon><VideoCamera /></el-icon><span>教学视频</span></button>
        <button :class="{ active: activeView === 'audit' }" @click="selectView('audit')"><el-icon><Document /></el-icon><span>审计日志</span></button>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-profile"><span>{{ (currentUser?.nickname || currentUser?.username || '管').slice(0, 1) }}</span><div><strong>{{ currentUser?.nickname || currentUser?.username }}</strong><small>管理员</small></div></div>
        <button class="collapse-button" title="收起侧边栏" @click="collapsed = !collapsed"><el-icon><Fold /></el-icon><span>收起导航</span></button>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div><span class="topbar-eyebrow">今天吃什么 · 内容中心</span><h1>{{ viewMeta[0] }}</h1><p>{{ viewMeta[1] }}</p></div>
        <div class="account"><div class="account-copy"><strong>{{ currentUser?.nickname || currentUser?.username }}</strong><span>在线</span></div><span class="account-avatar">{{ (currentUser?.nickname || currentUser?.username || '管').slice(0, 1) }}</span><el-button class="security-button" @click="passwordDialog = true">安全设置</el-button><el-button :icon="SwitchButton" circle title="退出登录" @click="logout" /></div>
      </header>
      <div v-loading="loading" class="content">
        <template v-if="activeView === 'dashboard'">
          <section class="welcome-card">
            <div><span class="eyebrow eyebrow-light">运营概览</span><h2>把内容照顾好，用户自然会留下来。</h2><p>这里汇总平台的核心数据与服务状态，帮助你快速判断今天优先处理什么。</p></div>
            <div class="welcome-mark" aria-hidden="true"><span></span><el-icon><Dish /></el-icon></div>
          </section>
          <div class="metric-grid">
            <article class="metric-card metric-users"><div class="metric-heading"><span>全部用户</span><el-icon><User /></el-icon></div><strong>{{ dashboard.users }}</strong><small><b>{{ dashboard.admins }}</b> 位管理员正在协作</small></article>
            <article class="metric-card metric-dishes"><div class="metric-heading"><span>菜品总量</span><el-icon><Dish /></el-icon></div><strong>{{ dashboard.dishes }}</strong><small>持续维护菜谱与烹饪内容</small></article>
            <article class="metric-card metric-videos"><div class="metric-heading"><span>教学视频</span><el-icon><Film /></el-icon></div><strong>{{ dashboard.videos }}</strong><small>外链与站内播放资源</small></article>
            <article class="metric-card metric-favorites"><div class="metric-heading"><span>用户收藏</span><el-icon><Collection /></el-icon></div><strong>{{ dashboard.favorites }}</strong><small><b>{{ dashboard.disabled_users }}</b> 个账号当前停用</small></article>
          </div>
          <section class="status-band"><div class="status-copy"><span class="status-icon"><span class="status-dot"></span></span><div><strong>平台服务运行正常</strong><p>API 与数据库连接稳定，内容服务可用</p></div></div><div class="status-meta"><span>刚刚更新</span><el-button :icon="Refresh" @click="loadCurrentView">刷新数据</el-button></div></section>
          <div class="ops-grid">
            <section class="ops-card"><div class="ops-card-head"><div><span class="eyebrow">内容质量</span><h3>菜品完整度</h3></div><strong>{{ dashboard.dishes ? Math.round(dashboard.complete_dishes / dashboard.dishes * 100) : 0 }}%</strong></div><div class="quality-bar"><span :style="{ width: `${dashboard.dishes ? dashboard.complete_dishes / dashboard.dishes * 100 : 0}%` }"></span></div><p>{{ dashboard.complete_dishes }} 道内容完整，{{ dashboard.incomplete_dishes }} 道仍需补充封面、食材或步骤。</p><el-button text type="primary" @click="selectView('dishes')">前往完善菜品</el-button></section>
            <section class="ops-card"><div class="ops-card-head"><div><span class="eyebrow">播放能力</span><h3>站内视频覆盖</h3></div><strong>{{ dashboard.videos ? Math.round(dashboard.playable_videos / dashboard.videos * 100) : 0 }}%</strong></div><div class="quality-bar video-quality"><span :style="{ width: `${dashboard.videos ? dashboard.playable_videos / dashboard.videos * 100 : 0}%` }"></span></div><p>{{ dashboard.playable_videos }} 个视频可在小程序内播放，其余内容将跳转第三方平台。</p><el-button text type="primary" @click="selectView('videos')">检查视频资源</el-button></section>
            <section class="ops-card recent-card"><div class="ops-card-head"><div><span class="eyebrow">最近操作</span><h3>审计动态</h3></div></div><ul v-if="dashboard.recent_logs?.length"><li v-for="item in dashboard.recent_logs.slice(0, 3)" :key="item.id"><span>{{ actionLabel(item.action) }}</span><small>{{ item.admin_username }} · {{ item.created_at }}</small></li></ul><div v-else class="compact-empty">暂无管理操作</div><el-button text type="primary" @click="selectView('audit')">查看全部日志</el-button></section>
          </div>
        </template>

        <template v-if="activeView === 'users'">
          <section class="data-panel"><div class="panel-head"><div><h2>用户列表</h2><p>共 {{ userTotal }} 个账号，支持角色与状态管理</p></div></div><div class="toolbar"><el-input v-model="userKeyword" :prefix-icon="Search" placeholder="搜索用户名或昵称" clearable @keyup.enter="userPage=1; loadCurrentView()" /><el-button type="primary" @click="userPage=1; loadCurrentView()">搜索用户</el-button></div>
            <el-table :data="users" row-key="id"><el-table-column prop="id" label="ID" width="70" /><el-table-column label="用户" min-width="190"><template #default="{ row }"><div class="user-cell"><span>{{ (row.nickname || row.username || '用').slice(0, 1) }}</span><div><strong>{{ row.nickname || row.username }}</strong><small class="secondary">@{{ row.username }}</small></div></div></template></el-table-column><el-table-column label="角色" width="110"><template #default="{ row }"><el-tag :type="row.is_admin ? 'warning' : 'info'">{{ row.is_admin ? '管理员' : '用户' }}</el-tag></template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? '正常' : '停用' }}</el-tag></template></el-table-column><el-table-column prop="last_login" label="最近登录" min-width="170" /><el-table-column label="操作" width="350" fixed="right"><template #default="{ row }"><span v-if="isSelf(row)" class="self-account-note">当前账号由安全设置管理</span><template v-else><el-button link type="primary" :loading="actionLoading === `user-toggle-${row.id}`" @click="toggleUser(row)">{{ row.is_active ? '停用' : '启用' }}</el-button><el-button link :loading="actionLoading === `user-admin-${row.id}`" @click="toggleAdmin(row)">{{ row.is_admin ? '取消管理' : '设为管理' }}</el-button><el-button link :loading="actionLoading === `user-password-${row.id}`" @click="resetPassword(row)">重置密码</el-button><el-button link type="danger" :loading="actionLoading === `user-delete-${row.id}`" @click="deleteUser(row)">删除</el-button></template></template></el-table-column></el-table>
            <el-pagination v-model:current-page="userPage" background layout="prev, pager, next, total" :total="userTotal" :page-size="20" @current-change="loadCurrentView" />
          </section>
        </template>

        <template v-if="activeView === 'dishes'">
          <section class="data-panel"><div class="panel-head"><div><h2>菜品内容库</h2><p>维护菜品基础信息与烹饪内容</p></div><el-button type="primary" @click="openDish()">新增菜品</el-button></div><div class="toolbar"><el-input v-model="dishKeyword" :prefix-icon="Search" placeholder="输入菜品名称搜索" clearable @keyup.enter="dishPage=1; loadCurrentView()" /><el-button @click="dishPage=1; loadCurrentView()">搜索</el-button></div>
            <el-table :data="dishes" row-key="id"><el-table-column prop="id" label="ID" width="70" /><el-table-column prop="name" label="菜品" min-width="180" /><el-table-column prop="category_name" label="分类" width="110" /><el-table-column label="内容完整度" min-width="180"><template #default="{ row }"><div class="content-checks"><el-tag :type="row.cover || row.image_url ? 'success' : 'danger'">封面</el-tag><el-tag :type="row.ingredient_count ? 'success' : 'danger'">食材 {{ row.ingredient_count }}</el-tag><el-tag :type="row.step_count ? 'success' : 'danger'">步骤 {{ row.step_count }}</el-tag></div></template></el-table-column><el-table-column prop="difficulty" label="难度" width="90" /><el-table-column prop="time" label="时间/分钟" width="105" /><el-table-column prop="calories" label="热量/kcal" width="105" /><el-table-column label="操作" width="140"><template #default="{ row }"><el-button link type="primary" @click="openDish(row)">编辑</el-button><el-button link type="danger" @click="deleteDish(row)">删除</el-button></template></el-table-column></el-table>
            <el-pagination v-model:current-page="dishPage" background layout="prev, pager, next, total" :total="dishTotal" :page-size="20" @current-change="loadCurrentView" />
          </section>
        </template>

        <template v-if="activeView === 'videos'">
          <section class="data-panel"><div class="panel-head"><div><h2>教学视频库</h2><p>管理自有视频与合规第三方内容</p></div><el-button type="primary" @click="openVideo()">新增视频</el-button></div>
            <div class="toolbar"><el-input v-model="videoKeyword" :prefix-icon="Search" placeholder="搜索菜品、标题或作者" clearable @keyup.enter="videoPage=1; loadCurrentView()" /><el-select v-model="videoSource" clearable placeholder="全部来源" @change="videoPage=1; loadCurrentView()"><el-option v-for="item in ['bilibili','douyin','xiaohongshu','direct']" :key="item" :label="item" :value="item" /></el-select><el-button type="primary" @click="videoPage=1; loadCurrentView()">筛选视频</el-button></div>
            <el-table :data="videos" row-key="id"><el-table-column prop="dishName" label="菜品" width="150" /><el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip /><el-table-column prop="source" label="来源" width="110" /><el-table-column prop="author" label="作者" width="140" /><el-table-column label="播放方式" width="120"><template #default="{ row }"><el-tag :type="row.playableInMiniprogram ? 'success' : 'info'">{{ row.playableInMiniprogram ? '小程序内' : '外部打开' }}</el-tag></template></el-table-column><el-table-column label="操作" width="190"><template #default="{ row }"><el-button link @click="previewVideo(row)">预览</el-button><el-button link type="primary" @click="openVideo(row)">编辑</el-button><el-button link type="danger" @click="deleteVideo(row)">删除</el-button></template></el-table-column><template #empty><div class="table-empty"><strong>没有找到视频</strong><span>调整筛选条件或新增教学视频</span></div></template></el-table>
            <el-pagination v-model:current-page="videoPage" background layout="prev, pager, next, total" :total="videoTotal" :page-size="20" @current-change="loadCurrentView" />
          </section>
        </template>

        <template v-if="activeView === 'audit'">
          <section class="data-panel"><div class="panel-head"><div><h2>敏感操作记录</h2><p>追踪操作者、对象与发生时间</p></div><el-button :icon="Refresh" @click="loadCurrentView">刷新日志</el-button></div>
            <div class="toolbar"><el-input v-model="auditKeyword" :prefix-icon="Search" placeholder="搜索管理员、对象 ID 或详情" clearable @keyup.enter="auditPage=1; loadCurrentView()" /><el-select v-model="auditAction" clearable placeholder="全部操作" @change="auditPage=1; loadCurrentView()"><el-option v-for="item in auditActions" :key="item[0]" :label="item[1]" :value="item[0]" /></el-select><el-button type="primary" @click="auditPage=1; loadCurrentView()">筛选日志</el-button></div>
            <el-table :data="logs" row-key="id"><el-table-column prop="created_at" label="时间" width="180" /><el-table-column prop="admin_username" label="管理员" width="140" /><el-table-column label="操作" width="190"><template #default="{ row }"><strong>{{ actionLabel(row.action) }}</strong><small class="secondary">{{ row.action }}</small></template></el-table-column><el-table-column prop="target_type" label="对象" width="110" /><el-table-column prop="target_id" label="对象 ID" width="110" /><el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip /><el-table-column label="操作" width="80"><template #default="{ row }"><el-button link type="primary" @click="showAuditDetail(row)">查看</el-button></template></el-table-column><template #empty><div class="table-empty"><strong>暂无审计记录</strong><span>管理员的敏感操作会在这里自动记录</span></div></template></el-table>
            <el-pagination v-model:current-page="auditPage" background layout="prev, pager, next, total" :total="auditTotal" :page-size="30" @current-change="loadCurrentView" />
          </section>
        </template>
      </div>
    </section>
  </div>

  <el-dialog v-model="dishDialog" class="editor-dialog dish-editor" :title="dishForm.id ? '编辑菜品内容' : '新增菜品内容'" width="860px" :close-on-click-modal="false">
    <p class="dialog-intro">菜品必须具备封面、至少一种食材和一个完整步骤，才能保存为可发布内容。</p>
    <el-tabs v-model="dishTab">
      <el-tab-pane label="1. 基础信息" name="basic"><el-form label-position="top"><div class="form-grid"><el-form-item label="菜品名称"><el-input v-model="dishForm.name" placeholder="例如：番茄炒蛋" /></el-form-item><el-form-item label="菜系 Key"><el-input v-model="dishForm.cuisine" placeholder="例如：home" /></el-form-item><el-form-item label="难度"><el-select v-model="dishForm.difficulty"><el-option v-for="item in ['简单','中等','困难']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="辣度"><el-select v-model="dishForm.spice_level"><el-option v-for="item in ['不辣','微辣','中辣','重辣']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="时间（分钟）"><el-input-number v-model="dishForm.time" :min="1" /></el-form-item><el-form-item label="热量（kcal）"><el-input-number v-model="dishForm.calories" :min="0" /></el-form-item><el-form-item label="份数"><el-input-number v-model="dishForm.servings" :min="1" /></el-form-item></div><el-form-item label="菜品简介"><el-input v-model="dishForm.description" type="textarea" :rows="3" /></el-form-item><el-form-item label="烹饪提示"><el-input v-model="dishForm.tips" type="textarea" :rows="2" /></el-form-item><el-form-item label="菜品封面"><div class="cover-editor"><img v-if="dishForm.cover" :src="assetUrl(dishForm.cover)" alt="菜品封面预览" /><div v-else class="cover-placeholder">尚未上传封面</div><div><el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadDishImage"><el-button :loading="uploadingDishImage">选择并上传图片</el-button></el-upload><small>支持 JPG、PNG、WebP，最大 8MB</small></div></div></el-form-item></el-form></el-tab-pane>
      <el-tab-pane :label="`2. 食材（${dishIngredients.length}）`" name="ingredients"><div class="editor-section-head"><div><h3>菜品食材</h3><p>选择食材并填写实际用量，可标记主要食材。</p></div><el-button type="primary" @click="addDishIngredient">添加食材</el-button></div><div v-if="dishIngredients.length" class="ingredient-editor-list"><div v-for="(item, index) in dishIngredients" :key="index" class="ingredient-editor-row"><el-select v-model="item.ingredient_id" filterable placeholder="选择食材"><el-option v-for="ingredient in ingredientOptions" :key="ingredient.id" :label="ingredient.name" :value="ingredient.id" /></el-select><el-input v-model="item.amount" placeholder="用量，如 2 个 / 200g" /><el-checkbox v-model="item.is_main">主要食材</el-checkbox><el-button type="danger" plain @click="dishIngredients.splice(index, 1)">移除</el-button></div></div><div v-else class="editor-empty"><strong>尚未添加食材</strong><span>至少添加一种食材后才能保存菜品。</span></div></el-tab-pane>
      <el-tab-pane :label="`3. 步骤（${dishSteps.length}）`" name="steps"><div class="editor-section-head"><div><h3>烹饪步骤</h3><p>按实际操作顺序录入，步骤会按照当前顺序展示。</p></div><el-button type="primary" @click="addDishStep">添加步骤</el-button></div><div v-if="dishSteps.length" class="step-editor-list"><article v-for="(step, index) in dishSteps" :key="index" class="step-editor-card"><div class="step-number">{{ index + 1 }}</div><div class="step-fields"><el-input v-model="step.title" placeholder="步骤标题" /><el-input v-model="step.description" type="textarea" :rows="2" placeholder="详细说明操作方法、火候和注意事项" /><label>预计用时 <el-input-number v-model="step.time" :min="0" /> 分钟</label></div><el-button type="danger" text @click="dishSteps.splice(index, 1)">删除</el-button></article></div><div v-else class="editor-empty"><strong>尚未添加步骤</strong><span>至少添加一个带有详细说明的烹饪步骤。</span></div></el-tab-pane>
    </el-tabs>
    <template #footer><el-button @click="dishDialog=false">取消</el-button><el-button type="primary" :loading="dishSaving" @click="saveDish">检查并保存菜品</el-button></template>
  </el-dialog>

  <el-dialog v-model="videoDialog" class="editor-dialog" :title="videoForm.id ? '编辑视频' : '新增视频'" width="620px"><p class="dialog-intro">第三方内容仅保存来源与跳转链接，自有视频可上传 MP4。</p><el-form label-position="top"><div class="form-grid"><el-form-item label="菜品 ID"><el-input v-model="videoForm.dish_id" /></el-form-item><el-form-item label="菜品名称"><el-input v-model="videoForm.dish_name" /></el-form-item><el-form-item label="视频标题"><el-input v-model="videoForm.title" /></el-form-item><el-form-item label="来源"><el-select v-model="videoForm.source"><el-option v-for="item in ['bilibili','douyin','xiaohongshu','direct']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="作者"><el-input v-model="videoForm.author" /></el-form-item><el-form-item label="小程序内播放"><el-switch v-model="videoForm.playable_in_miniprogram" /></el-form-item></div><el-form-item label="外部链接"><el-input v-model="videoForm.external_url" /></el-form-item><el-form-item label="MP4/HLS 地址"><el-input v-model="videoForm.video_url" /></el-form-item><el-form-item label="上传自有 MP4"><el-upload :show-file-list="false" accept="video/mp4" :http-request="uploadVideo"><el-button :loading="uploadingVideo">选择并上传</el-button></el-upload></el-form-item></el-form><template #footer><el-button @click="videoDialog=false">取消</el-button><el-button type="primary" @click="saveVideo">保存视频</el-button></template></el-dialog>

  <el-dialog v-model="passwordDialog" class="editor-dialog" title="管理员安全设置" width="480px"><p class="dialog-intro">修改当前管理员密码。新密码至少 10 位，建议包含大小写字母、数字和符号。</p><el-form label-position="top"><el-form-item label="当前密码"><el-input v-model="passwordForm.old_password" type="password" show-password autocomplete="current-password" /></el-form-item><el-form-item label="新密码"><el-input v-model="passwordForm.new_password" type="password" show-password autocomplete="new-password" /></el-form-item><el-form-item label="确认新密码"><el-input v-model="passwordForm.confirm_password" type="password" show-password autocomplete="new-password" @keyup.enter="changePassword" /></el-form-item></el-form><template #footer><el-button @click="passwordDialog=false">取消</el-button><el-button type="primary" :loading="changingPassword" @click="changePassword">更新密码</el-button></template></el-dialog>
</template>
