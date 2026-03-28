<template>
  <div class="login-shell">
    <div class="login-background" aria-hidden="true">
      <span class="aurora aurora-blue"></span>
      <span class="aurora aurora-orange"></span>
      <span class="grid-overlay"></span>
    </div>

    <section class="login-layout">
      <aside class="login-showcase">
        <div class="showcase-badge reveal-up">Painel institucional</div>

        <div class="showcase-copy reveal-up">
          <h1>Gestão acadêmica com presença de produto, não de formulário comum.</h1>
          <p>
            Acesso ao núcleo operacional da plataforma com o mesmo contraste, profundidade e
            linguagem visual do shell principal do sistema.
          </p>
        </div>

        <div class="showcase-highlight reveal-scale stagger-1">
          <div class="highlight-top">
            <div class="highlight-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              </svg>
            </div>
            <div>
              <strong>{{ systemStore.systemName }}</strong>
              <span>{{ systemStore.systemTagline }}</span>
            </div>
          </div>

          <div class="highlight-metrics">
            <div class="metric-item">
              <span>Monitoramento</span>
              <strong>Ao vivo</strong>
            </div>
            <div class="metric-item">
              <span>Ambiente</span>
              <strong>Seguro</strong>
            </div>
            <div class="metric-item accent">
              <span>Entrada</span>
              <strong>Imediata</strong>
            </div>
          </div>
        </div>

        <div class="showcase-points">
          <article class="point-card reveal-up stagger-2">
            <span class="point-index">01</span>
            <div>
              <strong>Navegação com contraste alto</strong>
              <p>Mesmo clima visual da sidebar: profundidade escura, brilho azul e acento quente.</p>
            </div>
          </article>

          <article class="point-card reveal-up stagger-3">
            <span class="point-index">02</span>
            <div>
              <strong>Leitura rápida e foco no CTA</strong>
              <p>Hierarquia forte para reduzir hesitação e dar clareza no primeiro acesso.</p>
            </div>
          </article>

          <article class="point-card reveal-up stagger-4">
            <span class="point-index">03</span>
            <div>
              <strong>Experiência responsiva de verdade</strong>
              <p>Estrutura preservada no mobile sem perder presença visual nem conforto de uso.</p>
            </div>
          </article>
        </div>
      </aside>

      <section class="login-panel reveal-scale">
        <div class="panel-frame">
          <div class="panel-kicker">Acesso restrito</div>

          <div class="panel-header">
            <div class="panel-brand">
              <div class="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
              <div>
                <h2>Entrar no sistema</h2>
                <p>Use suas credenciais para acessar o painel administrativo.</p>
              </div>
            </div>

            <button type="button" class="demo-fill" @click="fillDemo">
              Usar acesso demo
            </button>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="admin@admin.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="password">Senha</label>
                <span>Min. 8 caracteres</span>
              </div>

              <div class="password-input">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Digite sua senha"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="toggle-password"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    v-if="showPassword"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="error" class="error-message" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ error }}
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-full login-submit" :disabled="loading">
              <svg v-if="loading" class="spinner-icon" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="3"
                  fill="none"
                  stroke-dasharray="30 70"
                />
              </svg>
              <span v-else>Entrar no painel</span>
            </button>
          </form>

          <footer class="panel-footer">
            <div class="demo-credentials">
              <span class="demo-label">Credenciais de demonstração</span>
              <div class="demo-codes">
                <code>admin@admin.com</code>
                <code>admin123</code>
              </div>
            </div>

            <div class="security-note">
              <span class="status-dot"></span>
              Sessão protegida e pronta para acesso em {{ currentYear }}
            </div>
          </footer>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSystemStore } from '../stores/system'

const router = useRouter()
const authStore = useAuthStore()
const systemStore = useSystemStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const currentYear = computed(() => new Date().getFullYear())

function fillDemo() {
  email.value = 'admin@admin.com'
  password.value = 'admin123'
  error.value = ''
}

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Credenciais inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-shell {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.22), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(var(--secondary-rgb), 0.2), transparent 18%),
    linear-gradient(135deg, rgba(var(--primary-rgb), 0.18) 0%, rgba(var(--secondary-rgb), 0.12) 36%, rgba(var(--primary-rgb), 0.08) 68%, rgba(255, 255, 255, 0) 68%),
    linear-gradient(135deg, #020617 0%, #0f172a 36%, #111c34 68%, #eaf1f8 68%, #f8fafc 100%);
}

.login-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.aurora {
  position: absolute;
  border-radius: 999px;
  filter: blur(24px);
  opacity: 0.75;
}

.aurora-blue {
  width: 28rem;
  height: 28rem;
  top: -8rem;
  left: -8rem;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.4) 0%, rgba(var(--primary-rgb), 0) 72%);
}

.aurora-orange {
  width: 22rem;
  height: 22rem;
  right: 10%;
  bottom: 8%;
  background: radial-gradient(circle, rgba(var(--secondary-rgb), 0.24) 0%, rgba(var(--secondary-rgb), 0) 72%);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 82%);
}

.login-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 460px);
  gap: 2rem;
  align-items: center;
  padding: 1.5rem clamp(1.25rem, 2.4vw, 2.5rem);
  position: relative;
  z-index: 1;
}

.login-showcase {
  color: white;
  padding: 0.5rem 0 0.5rem 0.5rem;
  max-width: 720px;
}

.showcase-badge,
.panel-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.showcase-badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.showcase-copy {
  margin-top: 1.1rem;
}

.showcase-copy h1 {
  max-width: 13ch;
  font-size: clamp(2.35rem, 4.3vw, 4.15rem);
  line-height: 0.94;
  color: white;
  letter-spacing: -0.05em;
}

.showcase-copy p {
  margin-top: 0.9rem;
  max-width: 54ch;
  font-size: 0.96rem;
  line-height: 1.65;
  color: rgba(226, 232, 240, 0.82);
}

.showcase-highlight {
  margin-top: 1.35rem;
  max-width: 560px;
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.52) 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(16px);
}

.highlight-top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.highlight-logo,
.brand-mark {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.highlight-logo {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.26) 0%, rgba(59, 130, 246, 0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.28);
}

.highlight-logo svg,
.brand-mark svg {
  width: 24px;
  height: 24px;
}

.highlight-top strong,
.panel-brand h2 {
  display: block;
  font-size: 1.2rem;
  line-height: 1.1;
}

.highlight-top span {
  color: rgba(226, 232, 240, 0.62);
  font-size: 0.82rem;
}

.highlight-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}

.metric-item {
  padding: 0.75rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.metric-item span {
  display: block;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.56);
}

.metric-item strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.92rem;
  color: white;
}

.metric-item.accent {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0.08) 100%);
  border-color: rgba(249, 115, 22, 0.24);
}

.showcase-points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.point-card {
  min-height: 100%;
  padding: 0.95rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(12px);
}

.point-index {
  display: inline-flex;
  margin-bottom: 0.75rem;
  color: rgba(249, 115, 22, 0.92);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}

.point-card strong {
  display: block;
  font-size: 0.92rem;
  color: white;
}

.point-card p {
  margin-top: 0.45rem;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.82rem;
  line-height: 1.55;
}

.login-panel {
  justify-self: end;
  width: 100%;
}

.panel-frame {
  width: 100%;
  padding: 1.15rem;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(20px);
}

.panel-kicker {
  color: var(--primary-dark);
  background: rgba(37, 99, 235, 0.08);
}

.panel-header {
  margin-top: 0.8rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.panel-brand {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.brand-mark {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.24);
}

.panel-brand p {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.55;
}

.demo-fill {
  min-height: 40px;
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
}

.demo-fill:hover {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.2);
  transform: translateY(-1px);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-group label,
.label-row span:first-child {
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.label-row span {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.form-group input {
  min-height: 48px;
  padding-left: 1rem;
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(148, 163, 184, 0.28);
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 3.25rem;
}

.toggle-password {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  background: rgba(15, 23, 42, 0.05);
  color: var(--text);
}

.toggle-password svg {
  width: 18px;
  height: 18px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.14);
  color: #b91c1c;
  font-size: 0.82rem;
}

.error-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-full {
  width: 100%;
}

.login-submit {
  min-height: 50px;
  margin-top: 0.2rem;
  border-radius: 14px;
}

.login-submit:disabled {
  opacity: 0.8;
  cursor: wait;
}

.spinner-icon {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.panel-footer {
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.demo-credentials {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.demo-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.demo-codes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.demo-codes code {
  padding: 0.3rem 0.55rem;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.06);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.74rem;
}

.security-note {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  text-align: right;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.14);
  flex-shrink: 0;
}

.reveal-up {
  opacity: 0;
  animation: revealUp 560ms var(--ease-out) forwards;
}

.reveal-scale {
  opacity: 0;
  animation: revealScale 520ms var(--ease-out) forwards;
}

.stagger-1 {
  animation-delay: 70ms;
}

.stagger-2 {
  animation-delay: 130ms;
}

.stagger-3 {
  animation-delay: 190ms;
}

.stagger-4 {
  animation-delay: 250ms;
}

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes revealScale {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-up,
  .reveal-scale,
  .spinner-icon {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 1080px) {
  .login-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .login-showcase {
    padding: 0;
    max-width: none;
  }

  .showcase-copy h1 {
    max-width: 12ch;
  }

  .login-panel {
    justify-self: stretch;
  }
}

@media (max-width: 768px) {
  .login-shell {
    background:
      radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.18), transparent 30%),
      radial-gradient(circle at top right, rgba(var(--secondary-rgb), 0.14), transparent 26%),
      linear-gradient(180deg, rgba(var(--primary-rgb), 0.12) 0%, rgba(var(--secondary-rgb), 0.08) 48%, rgba(255, 255, 255, 0) 48%),
      linear-gradient(180deg, #020617 0%, #0f172a 48%, #f8fafc 48%, #f8fafc 100%);
  }

  .login-layout {
    padding: 1.25rem;
    gap: 1.5rem;
  }

  .showcase-copy h1 {
    font-size: clamp(2.15rem, 12vw, 3.25rem);
  }

  .showcase-highlight,
  .showcase-points {
    max-width: none;
  }

  .showcase-points {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .panel-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .security-note {
    text-align: left;
  }
}

@media (max-width: 560px) {
  .highlight-top,
  .panel-brand {
    flex-direction: column;
  }

  .highlight-metrics {
    grid-template-columns: 1fr;
  }

  .panel-frame {
    padding: 1.1rem;
    border-radius: 24px;
  }
}
</style>
