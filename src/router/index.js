import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/primeiro-acesso',
    name: 'PrimeiroAcesso',
    component: () => import('../views/PrimeiroAcesso.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/organizacoes',
    name: 'Organizations',
    component: () => import('../views/organizations/OrganizationList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cursos',
    name: 'Courses',
    component: () => import('../views/courses/CourseList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cursos/:id',
    name: 'CourseDetail',
    component: () => import('../views/courses/CourseDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/agendamentos',
    name: 'Schedule',
    component: () => import('../views/schedule/WeeklySchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alunos',
    name: 'Students',
    component: () => import('../views/students/StudentList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alunos/:id',
    name: 'StudentDetail',
    component: () => import('../views/students/StudentDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pagamentos',
    name: 'Payments',
    component: () => import('../views/payments/PaymentList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/presenca',
    name: 'Attendance',
    component: () => import('../views/attendance/AttendanceSheet.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios',
    name: 'Users',
    component: () => import('../views/users/UserList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notificacoes',
    name: 'Notifications',
    component: () => import('../views/notifications/NotificationList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendario',
    name: 'Calendar',
    component: () => import('../views/events/CalendarView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/administracao/sistema',
    name: 'SystemSettings',
    component: () => import('../views/admin/SystemSettingsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const primeiroAcesso = localStorage.getItem('primeiroAcesso') === 'true'
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else if (primeiroAcesso && to.path !== '/primeiro-acesso') {
    next('/primeiro-acesso')
  } else {
    next()
  }
})

export default router
