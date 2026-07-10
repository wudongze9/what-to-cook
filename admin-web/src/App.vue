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

const dashboard = reactive({ users: 0, admins: 0, disabled_users: 0, dishes: 0, videos: 0, favorites: 0 })
const users = ref<any[]>([])
const userTotal = ref(0)
const userPage = ref(1)
const userKeyword = ref('')
const dishes = ref<any[]>([])
const dishTotal = ref(0)
const dishPage = ref(1)
const dishKeyword = ref('')
const videos = ref<any[]>([])
const logs = ref<any[]>([])

const dishDialog = ref(false)
const dishForm = reactive<any>({ id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home' })
const videoDialog = ref(false)
const videoForm = reactive<any>({ id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false })

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
    if (activeView.value === 'videos') videos.value = (await api.get('/videos/all/list')).data.videos || []
    if (activeView.value === 'audit') logs.value = (await api.get('/admin/audit-logs', { params: { page_size: 80 } })).data.logs || []
  } catch (error) { ElMessage.error(errorMessage(error)) }
  finally { loading.value = false }
}

async function toggleUser(user: any) {
  try { await api.put(`/admin/users/${user.id}/toggle`); ElMessage.success('账号状态已更新'); await loadCurrentView() }
  catch (error) { ElMessage.error(errorMessage(error)) }
}

async function toggleAdmin(user: any) {
  try { await api.put(`/admin/users/${user.id}/admin`, null, { params: { is_admin: !user.is_admin } }); ElMessage.success('角色已更新'); await loadCurrentView() }
  catch (error) { ElMessage.error(errorMessage(error)) }
}

async function resetPassword(user: any) {
  await ElMessageBox.confirm(`为 ${user.nickname || user.username} 生成一次性临时密码？`, '重置密码', { type: 'warning' })
  const { data } = await api.put(`/admin/users/${user.id}/password`)
  await navigator.clipboard.writeText(data.temporary_password)
  ElMessageBox.alert(`临时密码：${data.temporary_password}\n已复制到剪贴板。`, '重置完成')
}

async function deleteUser(user: any) {
  await ElMessageBox.confirm(`永久删除用户 ${user.username}？`, '危险操作', { type: 'error' })
  await api.delete(`/admin/users/${user.id}`); ElMessage.success('用户已删除'); await loadCurrentView()
}

function openDish(row?: any) {
  Object.assign(dishForm, { id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home' }, row || {})
  dishDialog.value = true
}

async function saveDish() {
  if (!dishForm.name.trim()) return ElMessage.warning('请填写菜品名称')
  const payload = { ...dishForm }; delete payload.id; delete payload.category_name
  if (dishForm.id) await api.put(`/admin/dishes/${dishForm.id}`, payload)
  else await api.post('/admin/dishes', payload)
  dishDialog.value = false; ElMessage.success('菜品已保存'); await loadCurrentView()
}

async function deleteDish(row: any) {
  await ElMessageBox.confirm(`删除菜品“${row.name}”及其步骤、视频关联？`, '危险操作', { type: 'error' })
  await api.delete(`/admin/dishes/${row.id}`); ElMessage.success('菜品已删除'); await loadCurrentView()
}

function openVideo(row?: any) {
  Object.assign(videoForm, { id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false }, row || {})
  videoDialog.value = true
}

async function saveVideo() {
  if (!videoForm.dish_id || !videoForm.title) return ElMessage.warning('菜品 ID 和标题必填')
  await api.post('/videos/admin/add', { ...videoForm, dish_id: Number(videoForm.dish_id) })
  videoDialog.value = false; ElMessage.success('视频已保存'); await loadCurrentView()
}

async function deleteVideo(row: any) {
  await ElMessageBox.confirm(`删除视频“${row.title}”？`, '确认删除', { type: 'warning' })
  await api.delete(`/videos/admin/${row.id}`); ElMessage.success('视频已删除'); await loadCurrentView()
}

onMounted(() => { if (token.value) loadCurrentView() })
</script>

<template>
  <main v-if="!token" class="login-page">
    <section class="login-panel">
      <img src="/logo.png" alt="今天吃什么" class="login-logo" />
      <div><h1>运营管理台</h1><p>登录后管理用户、菜品与教学内容</p></div>
      <el-form label-position="top" @submit.prevent="login">
        <el-form-item label="管理员账号"><el-input v-model="loginForm.username" size="large" autocomplete="username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="loginForm.password" size="large" type="password" show-password autocomplete="current-password" @keyup.enter="login" /></el-form-item>
        <el-button type="primary" size="large" :loading="loggingIn" @click="login">登录管理台</el-button>
      </el-form>
    </section>
  </main>

  <div v-else class="admin-shell">
    <aside :class="['sidebar', { collapsed }]">
      <div class="brand"><img src="/logo.png" alt="" /><div><strong>今天吃什么</strong><span>运营管理台</span></div></div>
      <nav aria-label="管理台导航">
        <button :class="{ active: activeView === 'dashboard' }" @click="selectView('dashboard')"><el-icon><DataAnalysis /></el-icon><span>运营概览</span></button>
        <button :class="{ active: activeView === 'users' }" @click="selectView('users')"><el-icon><User /></el-icon><span>用户与角色</span></button>
        <button :class="{ active: activeView === 'dishes' }" @click="selectView('dishes')"><el-icon><Dish /></el-icon><span>菜品内容</span></button>
        <button :class="{ active: activeView === 'videos' }" @click="selectView('videos')"><el-icon><VideoCamera /></el-icon><span>教学视频</span></button>
        <button :class="{ active: activeView === 'audit' }" @click="selectView('audit')"><el-icon><Document /></el-icon><span>审计日志</span></button>
      </nav>
      <button class="collapse-button" title="收起侧边栏" @click="collapsed = !collapsed"><el-icon><Fold /></el-icon><span>收起导航</span></button>
    </aside>

    <section class="workspace">
      <header class="topbar"><div><h1>{{ viewMeta[0] }}</h1><p>{{ viewMeta[1] }}</p></div><div class="account"><span>{{ currentUser?.nickname || currentUser?.username }}</span><el-button :icon="SwitchButton" circle title="退出登录" @click="logout" /></div></header>
      <div v-loading="loading" class="content">
        <template v-if="activeView === 'dashboard'">
          <div class="metric-grid">
            <article><el-icon><User /></el-icon><span>全部用户</span><strong>{{ dashboard.users }}</strong><small>{{ dashboard.admins }} 位管理员</small></article>
            <article><el-icon><Dish /></el-icon><span>菜品总量</span><strong>{{ dashboard.dishes }}</strong><small>持续维护菜谱内容</small></article>
            <article><el-icon><Film /></el-icon><span>教学视频</span><strong>{{ dashboard.videos }}</strong><small>外链与直播放映资源</small></article>
            <article><el-icon><Collection /></el-icon><span>用户收藏</span><strong>{{ dashboard.favorites }}</strong><small>{{ dashboard.disabled_users }} 个停用账号</small></article>
          </div>
          <section class="status-band"><div><strong>服务状态</strong><span class="status-dot"></span>API 与数据库连接正常</div><el-button :icon="Refresh" @click="loadCurrentView">刷新数据</el-button></section>
        </template>

        <template v-if="activeView === 'users'">
          <div class="toolbar"><el-input v-model="userKeyword" :prefix-icon="Search" placeholder="搜索用户名或昵称" clearable @keyup.enter="userPage=1; loadCurrentView()" /><el-button type="primary" @click="userPage=1; loadCurrentView()">搜索</el-button></div>
          <el-table :data="users" row-key="id"><el-table-column prop="id" label="ID" width="70" /><el-table-column label="用户" min-width="190"><template #default="{ row }"><strong>{{ row.nickname || row.username }}</strong><small class="secondary">@{{ row.username }}</small></template></el-table-column><el-table-column label="角色" width="110"><template #default="{ row }"><el-tag :type="row.is_admin ? 'warning' : 'info'">{{ row.is_admin ? '管理员' : '用户' }}</el-tag></template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? '正常' : '停用' }}</el-tag></template></el-table-column><el-table-column prop="last_login" label="最近登录" min-width="170" /><el-table-column label="操作" width="330" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="toggleUser(row)">{{ row.is_active ? '停用' : '启用' }}</el-button><el-button link @click="toggleAdmin(row)">{{ row.is_admin ? '取消管理' : '设为管理' }}</el-button><el-button link @click="resetPassword(row)">重置密码</el-button><el-button link type="danger" @click="deleteUser(row)">删除</el-button></template></el-table-column></el-table>
          <el-pagination v-model:current-page="userPage" background layout="prev, pager, next, total" :total="userTotal" :page-size="20" @current-change="loadCurrentView" />
        </template>

        <template v-if="activeView === 'dishes'">
          <div class="toolbar"><el-input v-model="dishKeyword" :prefix-icon="Search" placeholder="搜索菜品" clearable @keyup.enter="dishPage=1; loadCurrentView()" /><el-button @click="dishPage=1; loadCurrentView()">搜索</el-button><el-button type="primary" @click="openDish()">新增菜品</el-button></div>
          <el-table :data="dishes" row-key="id"><el-table-column prop="id" label="ID" width="70" /><el-table-column prop="name" label="菜品" min-width="160" /><el-table-column prop="category_name" label="分类" width="120" /><el-table-column prop="difficulty" label="难度" width="100" /><el-table-column prop="time" label="时间/分钟" width="110" /><el-table-column prop="calories" label="热量/kcal" width="110" /><el-table-column label="操作" width="140"><template #default="{ row }"><el-button link type="primary" @click="openDish(row)">编辑</el-button><el-button link type="danger" @click="deleteDish(row)">删除</el-button></template></el-table-column></el-table>
          <el-pagination v-model:current-page="dishPage" background layout="prev, pager, next, total" :total="dishTotal" :page-size="20" @current-change="loadCurrentView" />
        </template>

        <template v-if="activeView === 'videos'">
          <div class="toolbar"><div class="toolbar-spacer"></div><el-button type="primary" @click="openVideo()">新增视频</el-button></div>
          <el-table :data="videos" row-key="id"><el-table-column prop="dishName" label="菜品" width="150" /><el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip /><el-table-column prop="source" label="来源" width="110" /><el-table-column prop="author" label="作者" width="140" /><el-table-column label="播放方式" width="120"><template #default="{ row }"><el-tag :type="row.playableInMiniprogram ? 'success' : 'info'">{{ row.playableInMiniprogram ? '小程序内' : '外部打开' }}</el-tag></template></el-table-column><el-table-column label="操作" width="140"><template #default="{ row }"><el-button link type="primary" @click="openVideo(row)">编辑</el-button><el-button link type="danger" @click="deleteVideo(row)">删除</el-button></template></el-table-column></el-table>
        </template>

        <template v-if="activeView === 'audit'">
          <el-table :data="logs" row-key="id"><el-table-column prop="created_at" label="时间" width="180" /><el-table-column prop="admin_username" label="管理员" width="140" /><el-table-column prop="action" label="操作" width="190" /><el-table-column prop="target_type" label="对象" width="110" /><el-table-column prop="target_id" label="对象 ID" width="110" /><el-table-column prop="detail" label="详情" min-width="220" /></el-table>
        </template>
      </div>
    </section>
  </div>

  <el-dialog v-model="dishDialog" :title="dishForm.id ? '编辑菜品' : '新增菜品'" width="620px"><el-form label-position="top"><div class="form-grid"><el-form-item label="菜品名称"><el-input v-model="dishForm.name" /></el-form-item><el-form-item label="菜系 Key"><el-input v-model="dishForm.cuisine" /></el-form-item><el-form-item label="难度"><el-select v-model="dishForm.difficulty"><el-option v-for="item in ['简单','中等','困难']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="辣度"><el-select v-model="dishForm.spice_level"><el-option v-for="item in ['不辣','微辣','中辣','重辣']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="时间（分钟）"><el-input-number v-model="dishForm.time" :min="1" /></el-form-item><el-form-item label="热量（kcal）"><el-input-number v-model="dishForm.calories" :min="0" /></el-form-item></div><el-form-item label="简介"><el-input v-model="dishForm.description" type="textarea" :rows="4" /></el-form-item></el-form><template #footer><el-button @click="dishDialog=false">取消</el-button><el-button type="primary" @click="saveDish">保存</el-button></template></el-dialog>

  <el-dialog v-model="videoDialog" :title="videoForm.id ? '编辑视频' : '新增视频'" width="620px"><el-form label-position="top"><div class="form-grid"><el-form-item label="菜品 ID"><el-input v-model="videoForm.dish_id" /></el-form-item><el-form-item label="菜品名称"><el-input v-model="videoForm.dish_name" /></el-form-item><el-form-item label="视频标题"><el-input v-model="videoForm.title" /></el-form-item><el-form-item label="来源"><el-select v-model="videoForm.source"><el-option v-for="item in ['bilibili','douyin','xiaohongshu','direct']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="作者"><el-input v-model="videoForm.author" /></el-form-item><el-form-item label="小程序内播放"><el-switch v-model="videoForm.playable_in_miniprogram" /></el-form-item></div><el-form-item label="外部链接"><el-input v-model="videoForm.external_url" /></el-form-item><el-form-item label="MP4/HLS 地址"><el-input v-model="videoForm.video_url" /></el-form-item></el-form><template #footer><el-button @click="videoDialog=false">取消</el-button><el-button type="primary" @click="saveVideo">保存</el-button></template></el-dialog>
</template>
