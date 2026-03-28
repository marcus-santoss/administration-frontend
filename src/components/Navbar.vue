<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="menu-toggle" @click="toggleMenu" aria-label="Abrir menu lateral">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="breadcrumb">
        <span class="breadcrumb-label">Painel</span>
        <span class="breadcrumb-item">{{ currentPageTitle }}</span>
      </div>
    </div>
    <div class="navbar-right">
      <button class="icon-btn notification-btn" @click="goToNotifications" aria-label="Abrir notificações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
      </button>
      <div class="user-dropdown">
        <button class="user-btn" @click="toggleDropdown">
          <div class="user-avatar">{{ userInitials }}</div>
          <span class="user-name">{{ authStore.user?.name }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron" :class="{ open: dropdownOpen }">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </button>
        <transition name="menu-fade">
          <div v-if="dropdownOpen" class="dropdown-menu">
            <div class="dropdown-header">
              <span class="dropdown-name">{{ authStore.user?.name }}</span>
              <span class="dropdown-email">{{ authStore.user?.email }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <button @click="logout" class="dropdown-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifications = ref([])
const dropdownOpen = ref(false)

const unreadCount = computed(() => notifications.value.filter(n => !n.lida).length)

const userInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const currentPageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/cursos': 'Cursos',
    '/usuarios': 'Usuários',
    '/agendamentos': 'Grade de Cursos',
    '/alunos': 'Alunos',
    '/pagamentos': 'Pagamentos',
    '/presenca': 'Diário de Aula',
    '/notificacoes': 'Notificações',
    '/organizacoes': 'Organizações',
    '/calendario': 'Calendário',
    '/administracao/sistema': 'Administração'
  }
  return titles[route.path] || 'Dashboard'
})

async function fetchNotifications() {
  try {
    const response = await api.get('/notificacoes')
    notifications.value = response.data
  } catch (error) {
    console.error('Failed to fetch notifications')
  }
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar')
  sidebar?.classList.toggle('open')
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function goToNotifications() {
  router.push('/notificacoes')
}

function logout() {
  dropdownOpen.value = false
  authStore.logout()
  router.push('/login')
}

function handleClickOutside(event) {
  if (!event.target.closest('.user-dropdown')) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  fetchNotifications()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: var(--navbar-height);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}

.navbar-left {
  gap: 1rem;
}

.navbar-right {
  gap: 0.75rem;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.menu-toggle:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.menu-toggle svg,
.icon-btn svg {
  width: 20px;
  height: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.breadcrumb-label {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(var(--primary-rgb), 0.08);
  color: var(--primary-dark);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.breadcrumb-item {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  position: relative;
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
  transform: translateY(-1px);
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--error);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 16px;
  text-align: center;
}

.user-dropdown {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.user-btn:hover {
  background: var(--surface-hover);
  border-color: var(--text-muted);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
  min-width: 220px;
  overflow: hidden;
  z-index: 100;
}

.dropdown-header {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.dropdown-name {
  font-weight: 600;
  color: var(--text);
}

.dropdown-email {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  font-size: 0.875rem;
  color: var(--text);
  text-align: left;
}

.dropdown-item:hover {
  background: var(--surface-hover);
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}

.dropdown-item.danger {
  color: var(--error);
}

.dropdown-item.danger:hover {
  background: var(--error-light);
}

.dropdown-item.danger svg {
  opacity: 1;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  .breadcrumb-label,
  .user-name {
    display: none;
  }
}
</style>
