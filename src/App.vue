<template>
  <div class="app-container">
    <Sidebar v-if="authStore.isAuthenticated" />
    <div class="main-wrapper" :class="{ 'full-width': !authStore.isAuthenticated }">
      <Navbar v-if="authStore.isAuthenticated" />
      <main class="main-content">
        <router-view v-slot="{ Component, route }">
          <transition name="route" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const authStore = useAuthStore()
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  background: transparent;
}

.main-wrapper.full-width {
  margin-left: 0;
}

.main-wrapper.full-width .main-content {
  max-width: none;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0;
  position: relative;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>
