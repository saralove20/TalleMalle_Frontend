import { createRouter, createWebHistory } from 'vue-router'
import { useRecruitStore } from '@/stores/recruit'
import Main from '@/views/service/Main.vue'
import Login from '@/views/auth/Login.vue'
import SocialLoginSuccess from '@/views/auth/SocialLoginSuccess.vue'
import Signup from '@/views/auth/Signup.vue'
import SignupOldVersion from '@/views/auth/SignupOldVersion.vue'
import signupExtraInfo from '@/views/auth/SignupExtraInfo.vue'
import Chat from '@/views/service/Chat.vue'
import MyPage from '@/views/user/MyPage.vue'
import FindPassword from '@/views/auth/FindPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Setting from '@/views/info/Setting.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'
import BlockList from '@/views/info/BlockList.vue'
import Notice from '@/views/info/Notice.vue'
import Notification from '@/views/info/Notification.vue'
import Terms from '@/views/info/Terms.vue'
import Privacy from '@/views/info/Privacy.vue'
import DriverLogin from '@/views/driver/DriverLogin.vue'
import DriverSignup from '@/views/driver/DriverSignup.vue'
import DriverPage from '@/views/driver/DriverPage.vue'
import NoticeDetail from '@/views/info/NoticeDetail.vue'
import SafeNumberSetting from '@/views/info/SafeNumberSetting.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', alias: '/main', name: 'main', component: Main, meta: { requiresAuth: true } },
    {
      path: '/chat/:id?',
      name: 'chat',
      component: Chat,
      meta: { requiresAuth: true, requiresActiveStatus: true },
    },
    { path: '/mypage', name: 'mypage', component: MyPage, meta: { requiresAuth: true } },
    { path: '/setting', name: 'setting', component: Setting, meta: { requiresAuth: true } },
    {
      path: '/changepassword',
      name: 'changepassword',
      component: ChangePassword,
      meta: { requiresAuth: true },
    },
    { path: '/blocklist', name: 'blocklist', component: BlockList, meta: { requiresAuth: true } },
    {
      path: '/safenumber',
      name: 'safenumber',
      component: SafeNumberSetting,
      meta: { requiresAuth: true },
    },
    { path: '/notice', name: 'notice', component: Notice, meta: { requiresAuth: true } },
    {
      path: '/noticedetail/:num',
      name: 'noticedetail',
      component: NoticeDetail,
      meta: { requiresAuth: true },
    },
    {
      path: '/notification',
      name: 'notification',
      component: Notification,
      meta: { requiresAuth: true },
    },
    { path: '/terms', name: 'terms', component: Terms, meta: { requiresAuth: true } },
    { path: '/privacy', name: 'privacy', component: Privacy, meta: { requiresAuth: true } },
    // hideNavbar: true 로그인 페이지에선 사이드바 숨김
    { path: '/login', name: 'login', component: Login, meta: { hideNavbar: true } },
    {
      path: '/social/success',
      name: 'SocialLoginSuccess',
      component: SocialLoginSuccess,
      meta: { hideNavbar: true },
    },
    { path: '/signup', name: 'signup', component: Signup, meta: { hideNavbar: true } },
    {
      path: '/signup/extra',
      name: 'signupExtraInfo',
      component: signupExtraInfo,
      meta: { hideNavbar: true },
    },
    {
      path: '/findpassword',
      name: 'findpassword',
      component: FindPassword,
      meta: { hideNavbar: true },
    },
    {
      path: '/resetpassword',
      name: 'resetpassword',
      component: ResetPassword,
      meta: { hideNavbar: true },
    },
    // hideDriverNavbar
    {
      path: '/driverlogin',
      name: 'driverlogin',
      component: DriverLogin,
      meta: { hideDriverNavbar: true },
    },
    {
      path: '/driversignup',
      name: 'driversignup',
      component: DriverSignup,
      meta: { hideDriverNavbar: true },
    },
    {
      path: '/driverpage',
      name: 'driverpage',
      component: DriverPage,
      meta: { hideDriverNavbar: false },
    },
    // 잘못된 주소로 접속하면 다른 페이지로 리다이렉트 아래 둘 중 하나 선택
    // 1. 메인으로 가게 처리
    // { path: '/:pathMatch(.*)*', redirect: '' },
    // 2. 에러 페이지로 이동
    {
      path: '/:pathMatch(.*)*',
      component: {
        template: '<div></div>',
        setup() {
          throw new Error('존재하지 않는 페이지입니다. 주소를 확인해주세요.')
        },
      },
    },
  ],
})

// 네비게이션 가드
router.beforeEach((to, from, next) => {
  const recruitStore = useRecruitStore()
  const user = localStorage.getItem('USERINFO')
  const hasToken = document.cookie.includes('ATOKEN')
  const myStatus = localStorage.getItem('myStatus')

  console.log('체크 결과 - 유저정보:', !!user, '토큰존재:', hasToken)

  // 로그인 체크 (requiresAuth)
  if (to.meta.requiresAuth && !user && !hasToken) {
    alert('로그인이 필요한 서비스입니다.')
    next('/login')
  } else {
    return next()
  }

  // 참여 상태 체크
  if (to.meta.requiresActiveStatus) {
    if (recruitStore.status === 'IDLE') {
      alert('참여 중인 채팅방이 없습니다.')
      next('/') // 메인으로 강제 이동
      return
    }
  }

  next()
})

export default router
