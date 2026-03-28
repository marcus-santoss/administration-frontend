<template>
  <div class="primeiro-acesso-page">
    <div class="primeiro-acesso-card">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h1>Bem-vindo!</h1>
      <p class="subtitle">Configure sua senha para acessar o sistema</p>
      
      <form @submit.prevent="setPassword">
        <div class="form-group">
          <label>Nova Senha</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            minlength="6"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div class="form-group">
          <label>Confirmar Senha</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            required
            placeholder="Confirme sua senha"
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar Senha' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function setPassword() {
  error.value = ''
  
  if (password.value.length < 6) {
    error.value = 'A senha deve ter pelo menos 6 caracteres'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'As senhas não coincidem'
    return
  }
  
  loading.value = true
  try {
    await authStore.setPassword(password.value)
    router.push('/')
  } catch (err) {
    error.value = 'Erro ao configurar senha. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.primeiro-acesso-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--background) 100%);
}

.primeiro-acesso-card {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: var(--primary-100);
  border-radius: var(--radius-lg);
  color: var(--primary);
  margin-bottom: 1.5rem;
}

.logo svg {
  width: 36px;
  height: 36px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.form-group {
  text-align: left;
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
}

.error-message {
  color: var(--error);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.btn-lg {
  width: 100%;
  padding: 0.875rem;
}
</style>