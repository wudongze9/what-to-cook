import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Collection, DataAnalysis, Dish, Document, Film, Fold, Refresh, Search, SwitchButton, User, VideoCamera, } from '@element-plus/icons-vue';
import { api, errorMessage } from './api';
const token = ref(localStorage.getItem('admin_token') || '');
const currentUser = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'));
const loginForm = reactive({ username: '', password: '' });
const loggingIn = ref(false);
const activeView = ref('dashboard');
const loading = ref(false);
const collapsed = ref(false);
const dashboard = reactive({ users: 0, admins: 0, disabled_users: 0, dishes: 0, videos: 0, favorites: 0 });
const users = ref([]);
const userTotal = ref(0);
const userPage = ref(1);
const userKeyword = ref('');
const dishes = ref([]);
const dishTotal = ref(0);
const dishPage = ref(1);
const dishKeyword = ref('');
const videos = ref([]);
const logs = ref([]);
const dishDialog = ref(false);
const dishForm = reactive({ id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home' });
const videoDialog = ref(false);
const videoForm = reactive({ id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false });
const viewMeta = computed(() => ({
    dashboard: ['运营概览', '查看核心内容与用户状态'],
    users: ['用户与角色', '管理账号状态、权限与临时密码'],
    dishes: ['菜品内容', '维护菜品基础信息和烹饪内容'],
    videos: ['教学视频', '维护外链与小程序内可播放资源'],
    audit: ['审计日志', '追踪管理员敏感操作'],
}[activeView.value]));
async function login() {
    if (!loginForm.username || !loginForm.password)
        return ElMessage.warning('请输入用户名和密码');
    loggingIn.value = true;
    try {
        const { data } = await api.post('/auth/login', loginForm);
        if (!data.user?.is_admin)
            throw new Error('该账号不是管理员');
        token.value = data.token;
        currentUser.value = data.user;
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        await loadCurrentView();
    }
    catch (error) {
        ElMessage.error(errorMessage(error));
    }
    finally {
        loggingIn.value = false;
    }
}
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    token.value = '';
    currentUser.value = null;
}
async function selectView(view) {
    activeView.value = view;
    await loadCurrentView();
}
async function loadCurrentView() {
    loading.value = true;
    try {
        if (activeView.value === 'dashboard')
            Object.assign(dashboard, (await api.get('/admin/dashboard')).data);
        if (activeView.value === 'users') {
            const { data } = await api.get('/admin/users', { params: { keyword: userKeyword.value, page: userPage.value, page_size: 20 } });
            users.value = data.users;
            userTotal.value = data.total;
        }
        if (activeView.value === 'dishes') {
            const { data } = await api.get('/admin/dishes', { params: { keyword: dishKeyword.value, page: dishPage.value, page_size: 20 } });
            dishes.value = data.dishes;
            dishTotal.value = data.total;
        }
        if (activeView.value === 'videos')
            videos.value = (await api.get('/videos/all/list')).data.videos || [];
        if (activeView.value === 'audit')
            logs.value = (await api.get('/admin/audit-logs', { params: { page_size: 80 } })).data.logs || [];
    }
    catch (error) {
        ElMessage.error(errorMessage(error));
    }
    finally {
        loading.value = false;
    }
}
async function toggleUser(user) {
    try {
        await api.put(`/admin/users/${user.id}/toggle`);
        ElMessage.success('账号状态已更新');
        await loadCurrentView();
    }
    catch (error) {
        ElMessage.error(errorMessage(error));
    }
}
async function toggleAdmin(user) {
    try {
        await api.put(`/admin/users/${user.id}/admin`, null, { params: { is_admin: !user.is_admin } });
        ElMessage.success('角色已更新');
        await loadCurrentView();
    }
    catch (error) {
        ElMessage.error(errorMessage(error));
    }
}
async function resetPassword(user) {
    await ElMessageBox.confirm(`为 ${user.nickname || user.username} 生成一次性临时密码？`, '重置密码', { type: 'warning' });
    const { data } = await api.put(`/admin/users/${user.id}/password`);
    await navigator.clipboard.writeText(data.temporary_password);
    ElMessageBox.alert(`临时密码：${data.temporary_password}\n已复制到剪贴板。`, '重置完成');
}
async function deleteUser(user) {
    await ElMessageBox.confirm(`永久删除用户 ${user.username}？`, '危险操作', { type: 'error' });
    await api.delete(`/admin/users/${user.id}`);
    ElMessage.success('用户已删除');
    await loadCurrentView();
}
function openDish(row) {
    Object.assign(dishForm, { id: null, name: '', description: '', difficulty: '简单', time: 15, calories: 0, spice_level: '不辣', cuisine: 'home' }, row || {});
    dishDialog.value = true;
}
async function saveDish() {
    if (!dishForm.name.trim())
        return ElMessage.warning('请填写菜品名称');
    const payload = { ...dishForm };
    delete payload.id;
    delete payload.category_name;
    if (dishForm.id)
        await api.put(`/admin/dishes/${dishForm.id}`, payload);
    else
        await api.post('/admin/dishes', payload);
    dishDialog.value = false;
    ElMessage.success('菜品已保存');
    await loadCurrentView();
}
async function deleteDish(row) {
    await ElMessageBox.confirm(`删除菜品“${row.name}”及其步骤、视频关联？`, '危险操作', { type: 'error' });
    await api.delete(`/admin/dishes/${row.id}`);
    ElMessage.success('菜品已删除');
    await loadCurrentView();
}
function openVideo(row) {
    Object.assign(videoForm, { id: '', dish_id: '', dish_name: '', title: '', source: 'bilibili', author: '', external_url: '', video_url: '', playable_in_miniprogram: false }, row || {});
    videoDialog.value = true;
}
async function saveVideo() {
    if (!videoForm.dish_id || !videoForm.title)
        return ElMessage.warning('菜品 ID 和标题必填');
    await api.post('/videos/admin/add', { ...videoForm, dish_id: Number(videoForm.dish_id) });
    videoDialog.value = false;
    ElMessage.success('视频已保存');
    await loadCurrentView();
}
async function deleteVideo(row) {
    await ElMessageBox.confirm(`删除视频“${row.title}”？`, '确认删除', { type: 'warning' });
    await api.delete(`/videos/admin/${row.id}`);
    ElMessage.success('视频已删除');
    await loadCurrentView();
}
onMounted(() => { if (token.value)
    loadCurrentView(); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (!__VLS_ctx.token) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "login-page" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "login-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: "/logo.png",
        alt: "今天吃什么",
        ...{ class: "login-logo" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    const __VLS_0 = {}.ElForm;
    /** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onSubmit: (__VLS_ctx.login)
    };
    __VLS_3.slots.default;
    const __VLS_8 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        label: "管理员账号",
    }));
    const __VLS_10 = __VLS_9({
        label: "管理员账号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    const __VLS_12 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        modelValue: (__VLS_ctx.loginForm.username),
        size: "large",
        autocomplete: "username",
    }));
    const __VLS_14 = __VLS_13({
        modelValue: (__VLS_ctx.loginForm.username),
        size: "large",
        autocomplete: "username",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    var __VLS_11;
    const __VLS_16 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        label: "密码",
    }));
    const __VLS_18 = __VLS_17({
        label: "密码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    const __VLS_20 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.loginForm.password),
        size: "large",
        type: "password",
        showPassword: true,
        autocomplete: "current-password",
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.loginForm.password),
        size: "large",
        type: "password",
        showPassword: true,
        autocomplete: "current-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onKeyup: (__VLS_ctx.login)
    };
    var __VLS_23;
    var __VLS_19;
    const __VLS_28 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        type: "primary",
        size: "large",
        loading: (__VLS_ctx.loggingIn),
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        type: "primary",
        size: "large",
        loading: (__VLS_ctx.loggingIn),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_32;
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = {
        onClick: (__VLS_ctx.login)
    };
    __VLS_31.slots.default;
    var __VLS_31;
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-shell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: (['sidebar', { collapsed: __VLS_ctx.collapsed }]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: "/logo.png",
        alt: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        'aria-label': "管理台导航",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.selectView('dashboard');
            } },
        ...{ class: ({ active: __VLS_ctx.activeView === 'dashboard' }) },
    });
    const __VLS_36 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    const __VLS_40 = {}.DataAnalysis;
    /** @type {[typeof __VLS_components.DataAnalysis, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({}));
    const __VLS_42 = __VLS_41({}, ...__VLS_functionalComponentArgsRest(__VLS_41));
    var __VLS_39;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.selectView('users');
            } },
        ...{ class: ({ active: __VLS_ctx.activeView === 'users' }) },
    });
    const __VLS_44 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
    const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    const __VLS_48 = {}.User;
    /** @type {[typeof __VLS_components.User, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
    const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
    var __VLS_47;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.selectView('dishes');
            } },
        ...{ class: ({ active: __VLS_ctx.activeView === 'dishes' }) },
    });
    const __VLS_52 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({}));
    const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    const __VLS_56 = {}.Dish;
    /** @type {[typeof __VLS_components.Dish, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({}));
    const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
    var __VLS_55;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.selectView('videos');
            } },
        ...{ class: ({ active: __VLS_ctx.activeView === 'videos' }) },
    });
    const __VLS_60 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
    const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    const __VLS_64 = {}.VideoCamera;
    /** @type {[typeof __VLS_components.VideoCamera, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({}));
    const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
    var __VLS_63;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.selectView('audit');
            } },
        ...{ class: ({ active: __VLS_ctx.activeView === 'audit' }) },
    });
    const __VLS_68 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
    const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    const __VLS_72 = {}.Document;
    /** @type {[typeof __VLS_components.Document, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({}));
    const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
    var __VLS_71;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                __VLS_ctx.collapsed = !__VLS_ctx.collapsed;
            } },
        ...{ class: "collapse-button" },
        title: "收起侧边栏",
    });
    const __VLS_76 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({}));
    const __VLS_78 = __VLS_77({}, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    const __VLS_80 = {}.Fold;
    /** @type {[typeof __VLS_components.Fold, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({}));
    const __VLS_82 = __VLS_81({}, ...__VLS_functionalComponentArgsRest(__VLS_81));
    var __VLS_79;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "workspace" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "topbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.viewMeta[0]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.viewMeta[1]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.currentUser?.nickname || __VLS_ctx.currentUser?.username);
    const __VLS_84 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        ...{ 'onClick': {} },
        icon: (__VLS_ctx.SwitchButton),
        circle: true,
        title: "退出登录",
    }));
    const __VLS_86 = __VLS_85({
        ...{ 'onClick': {} },
        icon: (__VLS_ctx.SwitchButton),
        circle: true,
        title: "退出登录",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    let __VLS_88;
    let __VLS_89;
    let __VLS_90;
    const __VLS_91 = {
        onClick: (__VLS_ctx.logout)
    };
    var __VLS_87;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
    if (__VLS_ctx.activeView === 'dashboard') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        const __VLS_92 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({}));
        const __VLS_94 = __VLS_93({}, ...__VLS_functionalComponentArgsRest(__VLS_93));
        __VLS_95.slots.default;
        const __VLS_96 = {}.User;
        /** @type {[typeof __VLS_components.User, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({}));
        const __VLS_98 = __VLS_97({}, ...__VLS_functionalComponentArgsRest(__VLS_97));
        var __VLS_95;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.dashboard.users);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.dashboard.admins);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        const __VLS_100 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({}));
        const __VLS_102 = __VLS_101({}, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_103.slots.default;
        const __VLS_104 = {}.Dish;
        /** @type {[typeof __VLS_components.Dish, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({}));
        const __VLS_106 = __VLS_105({}, ...__VLS_functionalComponentArgsRest(__VLS_105));
        var __VLS_103;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.dashboard.dishes);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        const __VLS_108 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({}));
        const __VLS_110 = __VLS_109({}, ...__VLS_functionalComponentArgsRest(__VLS_109));
        __VLS_111.slots.default;
        const __VLS_112 = {}.Film;
        /** @type {[typeof __VLS_components.Film, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({}));
        const __VLS_114 = __VLS_113({}, ...__VLS_functionalComponentArgsRest(__VLS_113));
        var __VLS_111;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.dashboard.videos);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        const __VLS_116 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({}));
        const __VLS_118 = __VLS_117({}, ...__VLS_functionalComponentArgsRest(__VLS_117));
        __VLS_119.slots.default;
        const __VLS_120 = {}.Collection;
        /** @type {[typeof __VLS_components.Collection, ]} */ ;
        // @ts-ignore
        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({}));
        const __VLS_122 = __VLS_121({}, ...__VLS_functionalComponentArgsRest(__VLS_121));
        var __VLS_119;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.dashboard.favorites);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.dashboard.disabled_users);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "status-band" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "status-dot" },
        });
        const __VLS_124 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            ...{ 'onClick': {} },
            icon: (__VLS_ctx.Refresh),
        }));
        const __VLS_126 = __VLS_125({
            ...{ 'onClick': {} },
            icon: (__VLS_ctx.Refresh),
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        let __VLS_128;
        let __VLS_129;
        let __VLS_130;
        const __VLS_131 = {
            onClick: (__VLS_ctx.loadCurrentView)
        };
        __VLS_127.slots.default;
        var __VLS_127;
    }
    if (__VLS_ctx.activeView === 'users') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "toolbar" },
        });
        const __VLS_132 = {}.ElInput;
        /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
        // @ts-ignore
        const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
            ...{ 'onKeyup': {} },
            modelValue: (__VLS_ctx.userKeyword),
            prefixIcon: (__VLS_ctx.Search),
            placeholder: "搜索用户名或昵称",
            clearable: true,
        }));
        const __VLS_134 = __VLS_133({
            ...{ 'onKeyup': {} },
            modelValue: (__VLS_ctx.userKeyword),
            prefixIcon: (__VLS_ctx.Search),
            placeholder: "搜索用户名或昵称",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_133));
        let __VLS_136;
        let __VLS_137;
        let __VLS_138;
        const __VLS_139 = {
            onKeyup: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'users'))
                    return;
                __VLS_ctx.userPage = 1;
                __VLS_ctx.loadCurrentView();
            }
        };
        var __VLS_135;
        const __VLS_140 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_142 = __VLS_141({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        let __VLS_144;
        let __VLS_145;
        let __VLS_146;
        const __VLS_147 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'users'))
                    return;
                __VLS_ctx.userPage = 1;
                __VLS_ctx.loadCurrentView();
            }
        };
        __VLS_143.slots.default;
        var __VLS_143;
        const __VLS_148 = {}.ElTable;
        /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
        // @ts-ignore
        const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
            data: (__VLS_ctx.users),
            rowKey: "id",
        }));
        const __VLS_150 = __VLS_149({
            data: (__VLS_ctx.users),
            rowKey: "id",
        }, ...__VLS_functionalComponentArgsRest(__VLS_149));
        __VLS_151.slots.default;
        const __VLS_152 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
            prop: "id",
            label: "ID",
            width: "70",
        }));
        const __VLS_154 = __VLS_153({
            prop: "id",
            label: "ID",
            width: "70",
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        const __VLS_156 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
            label: "用户",
            minWidth: "190",
        }));
        const __VLS_158 = __VLS_157({
            label: "用户",
            minWidth: "190",
        }, ...__VLS_functionalComponentArgsRest(__VLS_157));
        __VLS_159.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_159.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (row.nickname || row.username);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({
                ...{ class: "secondary" },
            });
            (row.username);
        }
        var __VLS_159;
        const __VLS_160 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
            label: "角色",
            width: "110",
        }));
        const __VLS_162 = __VLS_161({
            label: "角色",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_161));
        __VLS_163.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_163.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_164 = {}.ElTag;
            /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
            // @ts-ignore
            const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
                type: (row.is_admin ? 'warning' : 'info'),
            }));
            const __VLS_166 = __VLS_165({
                type: (row.is_admin ? 'warning' : 'info'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_165));
            __VLS_167.slots.default;
            (row.is_admin ? '管理员' : '用户');
            var __VLS_167;
        }
        var __VLS_163;
        const __VLS_168 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
            label: "状态",
            width: "100",
        }));
        const __VLS_170 = __VLS_169({
            label: "状态",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_169));
        __VLS_171.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_171.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_172 = {}.ElTag;
            /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
            // @ts-ignore
            const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
                type: (row.is_active ? 'success' : 'danger'),
            }));
            const __VLS_174 = __VLS_173({
                type: (row.is_active ? 'success' : 'danger'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_173));
            __VLS_175.slots.default;
            (row.is_active ? '正常' : '停用');
            var __VLS_175;
        }
        var __VLS_171;
        const __VLS_176 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
            prop: "last_login",
            label: "最近登录",
            minWidth: "170",
        }));
        const __VLS_178 = __VLS_177({
            prop: "last_login",
            label: "最近登录",
            minWidth: "170",
        }, ...__VLS_functionalComponentArgsRest(__VLS_177));
        const __VLS_180 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
            label: "操作",
            width: "330",
            fixed: "right",
        }));
        const __VLS_182 = __VLS_181({
            label: "操作",
            width: "330",
            fixed: "right",
        }, ...__VLS_functionalComponentArgsRest(__VLS_181));
        __VLS_183.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_183.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_184 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_186 = __VLS_185({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_185));
            let __VLS_188;
            let __VLS_189;
            let __VLS_190;
            const __VLS_191 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'users'))
                        return;
                    __VLS_ctx.toggleUser(row);
                }
            };
            __VLS_187.slots.default;
            (row.is_active ? '停用' : '启用');
            var __VLS_187;
            const __VLS_192 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
                ...{ 'onClick': {} },
                link: true,
            }));
            const __VLS_194 = __VLS_193({
                ...{ 'onClick': {} },
                link: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_193));
            let __VLS_196;
            let __VLS_197;
            let __VLS_198;
            const __VLS_199 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'users'))
                        return;
                    __VLS_ctx.toggleAdmin(row);
                }
            };
            __VLS_195.slots.default;
            (row.is_admin ? '取消管理' : '设为管理');
            var __VLS_195;
            const __VLS_200 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
                ...{ 'onClick': {} },
                link: true,
            }));
            const __VLS_202 = __VLS_201({
                ...{ 'onClick': {} },
                link: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_201));
            let __VLS_204;
            let __VLS_205;
            let __VLS_206;
            const __VLS_207 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'users'))
                        return;
                    __VLS_ctx.resetPassword(row);
                }
            };
            __VLS_203.slots.default;
            var __VLS_203;
            const __VLS_208 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }));
            const __VLS_210 = __VLS_209({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }, ...__VLS_functionalComponentArgsRest(__VLS_209));
            let __VLS_212;
            let __VLS_213;
            let __VLS_214;
            const __VLS_215 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'users'))
                        return;
                    __VLS_ctx.deleteUser(row);
                }
            };
            __VLS_211.slots.default;
            var __VLS_211;
        }
        var __VLS_183;
        var __VLS_151;
        const __VLS_216 = {}.ElPagination;
        /** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
        // @ts-ignore
        const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
            ...{ 'onCurrentChange': {} },
            currentPage: (__VLS_ctx.userPage),
            background: true,
            layout: "prev, pager, next, total",
            total: (__VLS_ctx.userTotal),
            pageSize: (20),
        }));
        const __VLS_218 = __VLS_217({
            ...{ 'onCurrentChange': {} },
            currentPage: (__VLS_ctx.userPage),
            background: true,
            layout: "prev, pager, next, total",
            total: (__VLS_ctx.userTotal),
            pageSize: (20),
        }, ...__VLS_functionalComponentArgsRest(__VLS_217));
        let __VLS_220;
        let __VLS_221;
        let __VLS_222;
        const __VLS_223 = {
            onCurrentChange: (__VLS_ctx.loadCurrentView)
        };
        var __VLS_219;
    }
    if (__VLS_ctx.activeView === 'dishes') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "toolbar" },
        });
        const __VLS_224 = {}.ElInput;
        /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
        // @ts-ignore
        const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
            ...{ 'onKeyup': {} },
            modelValue: (__VLS_ctx.dishKeyword),
            prefixIcon: (__VLS_ctx.Search),
            placeholder: "搜索菜品",
            clearable: true,
        }));
        const __VLS_226 = __VLS_225({
            ...{ 'onKeyup': {} },
            modelValue: (__VLS_ctx.dishKeyword),
            prefixIcon: (__VLS_ctx.Search),
            placeholder: "搜索菜品",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_225));
        let __VLS_228;
        let __VLS_229;
        let __VLS_230;
        const __VLS_231 = {
            onKeyup: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'dishes'))
                    return;
                __VLS_ctx.dishPage = 1;
                __VLS_ctx.loadCurrentView();
            }
        };
        var __VLS_227;
        const __VLS_232 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
            ...{ 'onClick': {} },
        }));
        const __VLS_234 = __VLS_233({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_233));
        let __VLS_236;
        let __VLS_237;
        let __VLS_238;
        const __VLS_239 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'dishes'))
                    return;
                __VLS_ctx.dishPage = 1;
                __VLS_ctx.loadCurrentView();
            }
        };
        __VLS_235.slots.default;
        var __VLS_235;
        const __VLS_240 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_242 = __VLS_241({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_241));
        let __VLS_244;
        let __VLS_245;
        let __VLS_246;
        const __VLS_247 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'dishes'))
                    return;
                __VLS_ctx.openDish();
            }
        };
        __VLS_243.slots.default;
        var __VLS_243;
        const __VLS_248 = {}.ElTable;
        /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
        // @ts-ignore
        const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
            data: (__VLS_ctx.dishes),
            rowKey: "id",
        }));
        const __VLS_250 = __VLS_249({
            data: (__VLS_ctx.dishes),
            rowKey: "id",
        }, ...__VLS_functionalComponentArgsRest(__VLS_249));
        __VLS_251.slots.default;
        const __VLS_252 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_253 = __VLS_asFunctionalComponent(__VLS_252, new __VLS_252({
            prop: "id",
            label: "ID",
            width: "70",
        }));
        const __VLS_254 = __VLS_253({
            prop: "id",
            label: "ID",
            width: "70",
        }, ...__VLS_functionalComponentArgsRest(__VLS_253));
        const __VLS_256 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_257 = __VLS_asFunctionalComponent(__VLS_256, new __VLS_256({
            prop: "name",
            label: "菜品",
            minWidth: "160",
        }));
        const __VLS_258 = __VLS_257({
            prop: "name",
            label: "菜品",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_257));
        const __VLS_260 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_261 = __VLS_asFunctionalComponent(__VLS_260, new __VLS_260({
            prop: "category_name",
            label: "分类",
            width: "120",
        }));
        const __VLS_262 = __VLS_261({
            prop: "category_name",
            label: "分类",
            width: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_261));
        const __VLS_264 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_265 = __VLS_asFunctionalComponent(__VLS_264, new __VLS_264({
            prop: "difficulty",
            label: "难度",
            width: "100",
        }));
        const __VLS_266 = __VLS_265({
            prop: "difficulty",
            label: "难度",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_265));
        const __VLS_268 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_269 = __VLS_asFunctionalComponent(__VLS_268, new __VLS_268({
            prop: "time",
            label: "时间/分钟",
            width: "110",
        }));
        const __VLS_270 = __VLS_269({
            prop: "time",
            label: "时间/分钟",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_269));
        const __VLS_272 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_273 = __VLS_asFunctionalComponent(__VLS_272, new __VLS_272({
            prop: "calories",
            label: "热量/kcal",
            width: "110",
        }));
        const __VLS_274 = __VLS_273({
            prop: "calories",
            label: "热量/kcal",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_273));
        const __VLS_276 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_277 = __VLS_asFunctionalComponent(__VLS_276, new __VLS_276({
            label: "操作",
            width: "140",
        }));
        const __VLS_278 = __VLS_277({
            label: "操作",
            width: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_277));
        __VLS_279.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_279.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_280 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_281 = __VLS_asFunctionalComponent(__VLS_280, new __VLS_280({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_282 = __VLS_281({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_281));
            let __VLS_284;
            let __VLS_285;
            let __VLS_286;
            const __VLS_287 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'dishes'))
                        return;
                    __VLS_ctx.openDish(row);
                }
            };
            __VLS_283.slots.default;
            var __VLS_283;
            const __VLS_288 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_289 = __VLS_asFunctionalComponent(__VLS_288, new __VLS_288({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }));
            const __VLS_290 = __VLS_289({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }, ...__VLS_functionalComponentArgsRest(__VLS_289));
            let __VLS_292;
            let __VLS_293;
            let __VLS_294;
            const __VLS_295 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'dishes'))
                        return;
                    __VLS_ctx.deleteDish(row);
                }
            };
            __VLS_291.slots.default;
            var __VLS_291;
        }
        var __VLS_279;
        var __VLS_251;
        const __VLS_296 = {}.ElPagination;
        /** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
        // @ts-ignore
        const __VLS_297 = __VLS_asFunctionalComponent(__VLS_296, new __VLS_296({
            ...{ 'onCurrentChange': {} },
            currentPage: (__VLS_ctx.dishPage),
            background: true,
            layout: "prev, pager, next, total",
            total: (__VLS_ctx.dishTotal),
            pageSize: (20),
        }));
        const __VLS_298 = __VLS_297({
            ...{ 'onCurrentChange': {} },
            currentPage: (__VLS_ctx.dishPage),
            background: true,
            layout: "prev, pager, next, total",
            total: (__VLS_ctx.dishTotal),
            pageSize: (20),
        }, ...__VLS_functionalComponentArgsRest(__VLS_297));
        let __VLS_300;
        let __VLS_301;
        let __VLS_302;
        const __VLS_303 = {
            onCurrentChange: (__VLS_ctx.loadCurrentView)
        };
        var __VLS_299;
    }
    if (__VLS_ctx.activeView === 'videos') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "toolbar" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "toolbar-spacer" },
        });
        const __VLS_304 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_305 = __VLS_asFunctionalComponent(__VLS_304, new __VLS_304({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_306 = __VLS_305({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_305));
        let __VLS_308;
        let __VLS_309;
        let __VLS_310;
        const __VLS_311 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.token))
                    return;
                if (!(__VLS_ctx.activeView === 'videos'))
                    return;
                __VLS_ctx.openVideo();
            }
        };
        __VLS_307.slots.default;
        var __VLS_307;
        const __VLS_312 = {}.ElTable;
        /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
        // @ts-ignore
        const __VLS_313 = __VLS_asFunctionalComponent(__VLS_312, new __VLS_312({
            data: (__VLS_ctx.videos),
            rowKey: "id",
        }));
        const __VLS_314 = __VLS_313({
            data: (__VLS_ctx.videos),
            rowKey: "id",
        }, ...__VLS_functionalComponentArgsRest(__VLS_313));
        __VLS_315.slots.default;
        const __VLS_316 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_317 = __VLS_asFunctionalComponent(__VLS_316, new __VLS_316({
            prop: "dishName",
            label: "菜品",
            width: "150",
        }));
        const __VLS_318 = __VLS_317({
            prop: "dishName",
            label: "菜品",
            width: "150",
        }, ...__VLS_functionalComponentArgsRest(__VLS_317));
        const __VLS_320 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_321 = __VLS_asFunctionalComponent(__VLS_320, new __VLS_320({
            prop: "title",
            label: "标题",
            minWidth: "260",
            showOverflowTooltip: true,
        }));
        const __VLS_322 = __VLS_321({
            prop: "title",
            label: "标题",
            minWidth: "260",
            showOverflowTooltip: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_321));
        const __VLS_324 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_325 = __VLS_asFunctionalComponent(__VLS_324, new __VLS_324({
            prop: "source",
            label: "来源",
            width: "110",
        }));
        const __VLS_326 = __VLS_325({
            prop: "source",
            label: "来源",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_325));
        const __VLS_328 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_329 = __VLS_asFunctionalComponent(__VLS_328, new __VLS_328({
            prop: "author",
            label: "作者",
            width: "140",
        }));
        const __VLS_330 = __VLS_329({
            prop: "author",
            label: "作者",
            width: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_329));
        const __VLS_332 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_333 = __VLS_asFunctionalComponent(__VLS_332, new __VLS_332({
            label: "播放方式",
            width: "120",
        }));
        const __VLS_334 = __VLS_333({
            label: "播放方式",
            width: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_333));
        __VLS_335.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_335.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_336 = {}.ElTag;
            /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
            // @ts-ignore
            const __VLS_337 = __VLS_asFunctionalComponent(__VLS_336, new __VLS_336({
                type: (row.playableInMiniprogram ? 'success' : 'info'),
            }));
            const __VLS_338 = __VLS_337({
                type: (row.playableInMiniprogram ? 'success' : 'info'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_337));
            __VLS_339.slots.default;
            (row.playableInMiniprogram ? '小程序内' : '外部打开');
            var __VLS_339;
        }
        var __VLS_335;
        const __VLS_340 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_341 = __VLS_asFunctionalComponent(__VLS_340, new __VLS_340({
            label: "操作",
            width: "140",
        }));
        const __VLS_342 = __VLS_341({
            label: "操作",
            width: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_341));
        __VLS_343.slots.default;
        {
            const { default: __VLS_thisSlot } = __VLS_343.slots;
            const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_344 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_345 = __VLS_asFunctionalComponent(__VLS_344, new __VLS_344({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_346 = __VLS_345({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_345));
            let __VLS_348;
            let __VLS_349;
            let __VLS_350;
            const __VLS_351 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'videos'))
                        return;
                    __VLS_ctx.openVideo(row);
                }
            };
            __VLS_347.slots.default;
            var __VLS_347;
            const __VLS_352 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_353 = __VLS_asFunctionalComponent(__VLS_352, new __VLS_352({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }));
            const __VLS_354 = __VLS_353({
                ...{ 'onClick': {} },
                link: true,
                type: "danger",
            }, ...__VLS_functionalComponentArgsRest(__VLS_353));
            let __VLS_356;
            let __VLS_357;
            let __VLS_358;
            const __VLS_359 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.token))
                        return;
                    if (!(__VLS_ctx.activeView === 'videos'))
                        return;
                    __VLS_ctx.deleteVideo(row);
                }
            };
            __VLS_355.slots.default;
            var __VLS_355;
        }
        var __VLS_343;
        var __VLS_315;
    }
    if (__VLS_ctx.activeView === 'audit') {
        const __VLS_360 = {}.ElTable;
        /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
        // @ts-ignore
        const __VLS_361 = __VLS_asFunctionalComponent(__VLS_360, new __VLS_360({
            data: (__VLS_ctx.logs),
            rowKey: "id",
        }));
        const __VLS_362 = __VLS_361({
            data: (__VLS_ctx.logs),
            rowKey: "id",
        }, ...__VLS_functionalComponentArgsRest(__VLS_361));
        __VLS_363.slots.default;
        const __VLS_364 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_365 = __VLS_asFunctionalComponent(__VLS_364, new __VLS_364({
            prop: "created_at",
            label: "时间",
            width: "180",
        }));
        const __VLS_366 = __VLS_365({
            prop: "created_at",
            label: "时间",
            width: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_365));
        const __VLS_368 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_369 = __VLS_asFunctionalComponent(__VLS_368, new __VLS_368({
            prop: "admin_username",
            label: "管理员",
            width: "140",
        }));
        const __VLS_370 = __VLS_369({
            prop: "admin_username",
            label: "管理员",
            width: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_369));
        const __VLS_372 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_373 = __VLS_asFunctionalComponent(__VLS_372, new __VLS_372({
            prop: "action",
            label: "操作",
            width: "190",
        }));
        const __VLS_374 = __VLS_373({
            prop: "action",
            label: "操作",
            width: "190",
        }, ...__VLS_functionalComponentArgsRest(__VLS_373));
        const __VLS_376 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_377 = __VLS_asFunctionalComponent(__VLS_376, new __VLS_376({
            prop: "target_type",
            label: "对象",
            width: "110",
        }));
        const __VLS_378 = __VLS_377({
            prop: "target_type",
            label: "对象",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_377));
        const __VLS_380 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_381 = __VLS_asFunctionalComponent(__VLS_380, new __VLS_380({
            prop: "target_id",
            label: "对象 ID",
            width: "110",
        }));
        const __VLS_382 = __VLS_381({
            prop: "target_id",
            label: "对象 ID",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_381));
        const __VLS_384 = {}.ElTableColumn;
        /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
        // @ts-ignore
        const __VLS_385 = __VLS_asFunctionalComponent(__VLS_384, new __VLS_384({
            prop: "detail",
            label: "详情",
            minWidth: "220",
        }));
        const __VLS_386 = __VLS_385({
            prop: "detail",
            label: "详情",
            minWidth: "220",
        }, ...__VLS_functionalComponentArgsRest(__VLS_385));
        var __VLS_363;
    }
}
const __VLS_388 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_389 = __VLS_asFunctionalComponent(__VLS_388, new __VLS_388({
    modelValue: (__VLS_ctx.dishDialog),
    title: (__VLS_ctx.dishForm.id ? '编辑菜品' : '新增菜品'),
    width: "620px",
}));
const __VLS_390 = __VLS_389({
    modelValue: (__VLS_ctx.dishDialog),
    title: (__VLS_ctx.dishForm.id ? '编辑菜品' : '新增菜品'),
    width: "620px",
}, ...__VLS_functionalComponentArgsRest(__VLS_389));
__VLS_391.slots.default;
const __VLS_392 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_393 = __VLS_asFunctionalComponent(__VLS_392, new __VLS_392({
    labelPosition: "top",
}));
const __VLS_394 = __VLS_393({
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_393));
__VLS_395.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-grid" },
});
const __VLS_396 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_397 = __VLS_asFunctionalComponent(__VLS_396, new __VLS_396({
    label: "菜品名称",
}));
const __VLS_398 = __VLS_397({
    label: "菜品名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_397));
__VLS_399.slots.default;
const __VLS_400 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_401 = __VLS_asFunctionalComponent(__VLS_400, new __VLS_400({
    modelValue: (__VLS_ctx.dishForm.name),
}));
const __VLS_402 = __VLS_401({
    modelValue: (__VLS_ctx.dishForm.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_401));
var __VLS_399;
const __VLS_404 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_405 = __VLS_asFunctionalComponent(__VLS_404, new __VLS_404({
    label: "菜系 Key",
}));
const __VLS_406 = __VLS_405({
    label: "菜系 Key",
}, ...__VLS_functionalComponentArgsRest(__VLS_405));
__VLS_407.slots.default;
const __VLS_408 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_409 = __VLS_asFunctionalComponent(__VLS_408, new __VLS_408({
    modelValue: (__VLS_ctx.dishForm.cuisine),
}));
const __VLS_410 = __VLS_409({
    modelValue: (__VLS_ctx.dishForm.cuisine),
}, ...__VLS_functionalComponentArgsRest(__VLS_409));
var __VLS_407;
const __VLS_412 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_413 = __VLS_asFunctionalComponent(__VLS_412, new __VLS_412({
    label: "难度",
}));
const __VLS_414 = __VLS_413({
    label: "难度",
}, ...__VLS_functionalComponentArgsRest(__VLS_413));
__VLS_415.slots.default;
const __VLS_416 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_417 = __VLS_asFunctionalComponent(__VLS_416, new __VLS_416({
    modelValue: (__VLS_ctx.dishForm.difficulty),
}));
const __VLS_418 = __VLS_417({
    modelValue: (__VLS_ctx.dishForm.difficulty),
}, ...__VLS_functionalComponentArgsRest(__VLS_417));
__VLS_419.slots.default;
for (const [item] of __VLS_getVForSourceType((['简单', '中等', '困难']))) {
    const __VLS_420 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_421 = __VLS_asFunctionalComponent(__VLS_420, new __VLS_420({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_422 = __VLS_421({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_421));
}
var __VLS_419;
var __VLS_415;
const __VLS_424 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_425 = __VLS_asFunctionalComponent(__VLS_424, new __VLS_424({
    label: "辣度",
}));
const __VLS_426 = __VLS_425({
    label: "辣度",
}, ...__VLS_functionalComponentArgsRest(__VLS_425));
__VLS_427.slots.default;
const __VLS_428 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_429 = __VLS_asFunctionalComponent(__VLS_428, new __VLS_428({
    modelValue: (__VLS_ctx.dishForm.spice_level),
}));
const __VLS_430 = __VLS_429({
    modelValue: (__VLS_ctx.dishForm.spice_level),
}, ...__VLS_functionalComponentArgsRest(__VLS_429));
__VLS_431.slots.default;
for (const [item] of __VLS_getVForSourceType((['不辣', '微辣', '中辣', '重辣']))) {
    const __VLS_432 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_433 = __VLS_asFunctionalComponent(__VLS_432, new __VLS_432({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_434 = __VLS_433({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_433));
}
var __VLS_431;
var __VLS_427;
const __VLS_436 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_437 = __VLS_asFunctionalComponent(__VLS_436, new __VLS_436({
    label: "时间（分钟）",
}));
const __VLS_438 = __VLS_437({
    label: "时间（分钟）",
}, ...__VLS_functionalComponentArgsRest(__VLS_437));
__VLS_439.slots.default;
const __VLS_440 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_441 = __VLS_asFunctionalComponent(__VLS_440, new __VLS_440({
    modelValue: (__VLS_ctx.dishForm.time),
    min: (1),
}));
const __VLS_442 = __VLS_441({
    modelValue: (__VLS_ctx.dishForm.time),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_441));
var __VLS_439;
const __VLS_444 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_445 = __VLS_asFunctionalComponent(__VLS_444, new __VLS_444({
    label: "热量（kcal）",
}));
const __VLS_446 = __VLS_445({
    label: "热量（kcal）",
}, ...__VLS_functionalComponentArgsRest(__VLS_445));
__VLS_447.slots.default;
const __VLS_448 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_449 = __VLS_asFunctionalComponent(__VLS_448, new __VLS_448({
    modelValue: (__VLS_ctx.dishForm.calories),
    min: (0),
}));
const __VLS_450 = __VLS_449({
    modelValue: (__VLS_ctx.dishForm.calories),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_449));
var __VLS_447;
const __VLS_452 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_453 = __VLS_asFunctionalComponent(__VLS_452, new __VLS_452({
    label: "简介",
}));
const __VLS_454 = __VLS_453({
    label: "简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_453));
__VLS_455.slots.default;
const __VLS_456 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_457 = __VLS_asFunctionalComponent(__VLS_456, new __VLS_456({
    modelValue: (__VLS_ctx.dishForm.description),
    type: "textarea",
    rows: (4),
}));
const __VLS_458 = __VLS_457({
    modelValue: (__VLS_ctx.dishForm.description),
    type: "textarea",
    rows: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_457));
var __VLS_455;
var __VLS_395;
{
    const { footer: __VLS_thisSlot } = __VLS_391.slots;
    const __VLS_460 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_461 = __VLS_asFunctionalComponent(__VLS_460, new __VLS_460({
        ...{ 'onClick': {} },
    }));
    const __VLS_462 = __VLS_461({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_461));
    let __VLS_464;
    let __VLS_465;
    let __VLS_466;
    const __VLS_467 = {
        onClick: (...[$event]) => {
            __VLS_ctx.dishDialog = false;
        }
    };
    __VLS_463.slots.default;
    var __VLS_463;
    const __VLS_468 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_469 = __VLS_asFunctionalComponent(__VLS_468, new __VLS_468({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_470 = __VLS_469({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_469));
    let __VLS_472;
    let __VLS_473;
    let __VLS_474;
    const __VLS_475 = {
        onClick: (__VLS_ctx.saveDish)
    };
    __VLS_471.slots.default;
    var __VLS_471;
}
var __VLS_391;
const __VLS_476 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_477 = __VLS_asFunctionalComponent(__VLS_476, new __VLS_476({
    modelValue: (__VLS_ctx.videoDialog),
    title: (__VLS_ctx.videoForm.id ? '编辑视频' : '新增视频'),
    width: "620px",
}));
const __VLS_478 = __VLS_477({
    modelValue: (__VLS_ctx.videoDialog),
    title: (__VLS_ctx.videoForm.id ? '编辑视频' : '新增视频'),
    width: "620px",
}, ...__VLS_functionalComponentArgsRest(__VLS_477));
__VLS_479.slots.default;
const __VLS_480 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_481 = __VLS_asFunctionalComponent(__VLS_480, new __VLS_480({
    labelPosition: "top",
}));
const __VLS_482 = __VLS_481({
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_481));
__VLS_483.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-grid" },
});
const __VLS_484 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_485 = __VLS_asFunctionalComponent(__VLS_484, new __VLS_484({
    label: "菜品 ID",
}));
const __VLS_486 = __VLS_485({
    label: "菜品 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_485));
__VLS_487.slots.default;
const __VLS_488 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_489 = __VLS_asFunctionalComponent(__VLS_488, new __VLS_488({
    modelValue: (__VLS_ctx.videoForm.dish_id),
}));
const __VLS_490 = __VLS_489({
    modelValue: (__VLS_ctx.videoForm.dish_id),
}, ...__VLS_functionalComponentArgsRest(__VLS_489));
var __VLS_487;
const __VLS_492 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_493 = __VLS_asFunctionalComponent(__VLS_492, new __VLS_492({
    label: "菜品名称",
}));
const __VLS_494 = __VLS_493({
    label: "菜品名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_493));
__VLS_495.slots.default;
const __VLS_496 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_497 = __VLS_asFunctionalComponent(__VLS_496, new __VLS_496({
    modelValue: (__VLS_ctx.videoForm.dish_name),
}));
const __VLS_498 = __VLS_497({
    modelValue: (__VLS_ctx.videoForm.dish_name),
}, ...__VLS_functionalComponentArgsRest(__VLS_497));
var __VLS_495;
const __VLS_500 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_501 = __VLS_asFunctionalComponent(__VLS_500, new __VLS_500({
    label: "视频标题",
}));
const __VLS_502 = __VLS_501({
    label: "视频标题",
}, ...__VLS_functionalComponentArgsRest(__VLS_501));
__VLS_503.slots.default;
const __VLS_504 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_505 = __VLS_asFunctionalComponent(__VLS_504, new __VLS_504({
    modelValue: (__VLS_ctx.videoForm.title),
}));
const __VLS_506 = __VLS_505({
    modelValue: (__VLS_ctx.videoForm.title),
}, ...__VLS_functionalComponentArgsRest(__VLS_505));
var __VLS_503;
const __VLS_508 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_509 = __VLS_asFunctionalComponent(__VLS_508, new __VLS_508({
    label: "来源",
}));
const __VLS_510 = __VLS_509({
    label: "来源",
}, ...__VLS_functionalComponentArgsRest(__VLS_509));
__VLS_511.slots.default;
const __VLS_512 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_513 = __VLS_asFunctionalComponent(__VLS_512, new __VLS_512({
    modelValue: (__VLS_ctx.videoForm.source),
}));
const __VLS_514 = __VLS_513({
    modelValue: (__VLS_ctx.videoForm.source),
}, ...__VLS_functionalComponentArgsRest(__VLS_513));
__VLS_515.slots.default;
for (const [item] of __VLS_getVForSourceType((['bilibili', 'douyin', 'xiaohongshu', 'direct']))) {
    const __VLS_516 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_517 = __VLS_asFunctionalComponent(__VLS_516, new __VLS_516({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_518 = __VLS_517({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_517));
}
var __VLS_515;
var __VLS_511;
const __VLS_520 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_521 = __VLS_asFunctionalComponent(__VLS_520, new __VLS_520({
    label: "作者",
}));
const __VLS_522 = __VLS_521({
    label: "作者",
}, ...__VLS_functionalComponentArgsRest(__VLS_521));
__VLS_523.slots.default;
const __VLS_524 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_525 = __VLS_asFunctionalComponent(__VLS_524, new __VLS_524({
    modelValue: (__VLS_ctx.videoForm.author),
}));
const __VLS_526 = __VLS_525({
    modelValue: (__VLS_ctx.videoForm.author),
}, ...__VLS_functionalComponentArgsRest(__VLS_525));
var __VLS_523;
const __VLS_528 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_529 = __VLS_asFunctionalComponent(__VLS_528, new __VLS_528({
    label: "小程序内播放",
}));
const __VLS_530 = __VLS_529({
    label: "小程序内播放",
}, ...__VLS_functionalComponentArgsRest(__VLS_529));
__VLS_531.slots.default;
const __VLS_532 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_533 = __VLS_asFunctionalComponent(__VLS_532, new __VLS_532({
    modelValue: (__VLS_ctx.videoForm.playable_in_miniprogram),
}));
const __VLS_534 = __VLS_533({
    modelValue: (__VLS_ctx.videoForm.playable_in_miniprogram),
}, ...__VLS_functionalComponentArgsRest(__VLS_533));
var __VLS_531;
const __VLS_536 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_537 = __VLS_asFunctionalComponent(__VLS_536, new __VLS_536({
    label: "外部链接",
}));
const __VLS_538 = __VLS_537({
    label: "外部链接",
}, ...__VLS_functionalComponentArgsRest(__VLS_537));
__VLS_539.slots.default;
const __VLS_540 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_541 = __VLS_asFunctionalComponent(__VLS_540, new __VLS_540({
    modelValue: (__VLS_ctx.videoForm.external_url),
}));
const __VLS_542 = __VLS_541({
    modelValue: (__VLS_ctx.videoForm.external_url),
}, ...__VLS_functionalComponentArgsRest(__VLS_541));
var __VLS_539;
const __VLS_544 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_545 = __VLS_asFunctionalComponent(__VLS_544, new __VLS_544({
    label: "MP4/HLS 地址",
}));
const __VLS_546 = __VLS_545({
    label: "MP4/HLS 地址",
}, ...__VLS_functionalComponentArgsRest(__VLS_545));
__VLS_547.slots.default;
const __VLS_548 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_549 = __VLS_asFunctionalComponent(__VLS_548, new __VLS_548({
    modelValue: (__VLS_ctx.videoForm.video_url),
}));
const __VLS_550 = __VLS_549({
    modelValue: (__VLS_ctx.videoForm.video_url),
}, ...__VLS_functionalComponentArgsRest(__VLS_549));
var __VLS_547;
var __VLS_483;
{
    const { footer: __VLS_thisSlot } = __VLS_479.slots;
    const __VLS_552 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_553 = __VLS_asFunctionalComponent(__VLS_552, new __VLS_552({
        ...{ 'onClick': {} },
    }));
    const __VLS_554 = __VLS_553({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_553));
    let __VLS_556;
    let __VLS_557;
    let __VLS_558;
    const __VLS_559 = {
        onClick: (...[$event]) => {
            __VLS_ctx.videoDialog = false;
        }
    };
    __VLS_555.slots.default;
    var __VLS_555;
    const __VLS_560 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_561 = __VLS_asFunctionalComponent(__VLS_560, new __VLS_560({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_562 = __VLS_561({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_561));
    let __VLS_564;
    let __VLS_565;
    let __VLS_566;
    const __VLS_567 = {
        onClick: (__VLS_ctx.saveVideo)
    };
    __VLS_563.slots.default;
    var __VLS_563;
}
var __VLS_479;
/** @type {__VLS_StyleScopedClasses['login-page']} */ ;
/** @type {__VLS_StyleScopedClasses['login-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['login-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['collapse-button']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['account']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['status-band']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-spacer']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Collection: Collection,
            DataAnalysis: DataAnalysis,
            Dish: Dish,
            Document: Document,
            Film: Film,
            Fold: Fold,
            Refresh: Refresh,
            Search: Search,
            SwitchButton: SwitchButton,
            User: User,
            VideoCamera: VideoCamera,
            token: token,
            currentUser: currentUser,
            loginForm: loginForm,
            loggingIn: loggingIn,
            activeView: activeView,
            loading: loading,
            collapsed: collapsed,
            dashboard: dashboard,
            users: users,
            userTotal: userTotal,
            userPage: userPage,
            userKeyword: userKeyword,
            dishes: dishes,
            dishTotal: dishTotal,
            dishPage: dishPage,
            dishKeyword: dishKeyword,
            videos: videos,
            logs: logs,
            dishDialog: dishDialog,
            dishForm: dishForm,
            videoDialog: videoDialog,
            videoForm: videoForm,
            viewMeta: viewMeta,
            login: login,
            logout: logout,
            selectView: selectView,
            loadCurrentView: loadCurrentView,
            toggleUser: toggleUser,
            toggleAdmin: toggleAdmin,
            resetPassword: resetPassword,
            deleteUser: deleteUser,
            openDish: openDish,
            saveDish: saveDish,
            deleteDish: deleteDish,
            openVideo: openVideo,
            saveVideo: saveVideo,
            deleteVideo: deleteVideo,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
