import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const primeiroAcesso = ref(localStorage.getItem('primeiroAcesso') === 'true')
  
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCoordinator = computed(() => user.value?.role === 'coordinator')
  const isProfessor = computed(() => user.value?.role === 'professor')
  const isAdminOrCoordinator = computed(() => user.value?.role === 'admin' || user.value?.role === 'coordinator')

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.data.token
    user.value = response.data.user
    primeiroAcesso.value = response.data.primeiro_acesso
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('primeiroAcesso', primeiroAcesso.value ? 'true' : 'false')
    return response.data
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      primeiroAcesso.value = response.data.primeiro_acesso
      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('primeiroAcesso', primeiroAcesso.value ? 'true' : 'false')
    } catch (error) {
      logout()
    }
  }

  async function setPassword(password) {
    const response = await api.post('/auth/set-password', { password })
    primeiroAcesso.value = false
    localStorage.setItem('primeiroAcesso', 'false')
    return response.data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function register(data) {
    const response = await api.post('/auth/register', data)
    return response.data
  }

  return {
    user,
    token,
    primeiroAcesso,
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isAdminOrCoordinator,
    isProfessor,
    login,
    fetchUser,
    logout,
    register,
    setPassword
  }
})
