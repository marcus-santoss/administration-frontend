<template>
  <div class="dashboard page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="dashboard-hero reveal-up">
      <div class="hero-copy">
        <h1>{{ greeting }}, {{ firstName }}</h1>
        <p>
          Acompanhe a operação da instituição em um só lugar, com foco no que exige atenção agora:
          matrículas, cursos ativos, equipe e pagamentos pendentes.
        </p>

        <div class="hero-tags">
          <span class="hero-tag">
            <strong>{{ unreadNotifications }}</strong>
            notificações não lidas
          </span>
          <span class="hero-tag">
            <strong>{{ occupancyRate }}%</strong>
            ocupação média
          </span>
          <span class="hero-tag">
            <strong>{{ stats.pendingPayments }}</strong>
            pendências financeiras
          </span>
        </div>

        <div class="hero-actions">
          <router-link to="/cursos" class="btn btn-primary">Gerenciar Cursos</router-link>
          <router-link to="/agendamentos" class="btn btn-secondary">Ver Agenda</router-link>
          <router-link to="/notificacoes" class="btn btn-secondary">Abrir Notificações</router-link>
        </div>
      </div>

      <div class="hero-panel reveal-scale stagger-2">
        <div class="hero-panel-header">
          <span class="hero-panel-label">Resumo operacional</span>
          <span class="hero-panel-badge">Ao vivo</span>
        </div>

        <div class="hero-highlight">
          <div>
            <span class="hero-highlight-label">Base ativa</span>
            <strong>{{ stats.students + stats.professors }}</strong>
            <small>alunos e professores em acompanhamento</small>
          </div>
          <div class="hero-highlight-chart">
            <div class="chart-bar students" :style="{ height: `${Math.max(28, Math.min(stats.students * 2, 96))}px` }"></div>
            <div class="chart-bar courses" :style="{ height: `${Math.max(28, Math.min(stats.courses * 10, 96))}px` }"></div>
            <div class="chart-bar payments" :style="{ height: `${Math.max(28, Math.min(stats.pendingPayments * 14, 96))}px` }"></div>
          </div>
        </div>

        <div class="hero-metrics">
          <div class="hero-metric">
            <span>Alunos</span>
            <strong>{{ stats.students }}</strong>
          </div>
          <div class="hero-metric">
            <span>Professores</span>
            <strong>{{ stats.professors }}</strong>
          </div>
          <div class="hero-metric attention">
            <span>Pendências</span>
            <strong>{{ stats.pendingPayments }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="metrics-grid">
      <article class="metric-card metric-card-primary reveal-scale stagger-1">
        <div class="metric-card-top">
          <span class="metric-kicker">Catálogo</span>
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
        </div>
        <strong class="metric-value">{{ stats.courses }}</strong>
        <span class="metric-label">Cursos ativos</span>
        <p class="metric-note">{{ coursesWithOpenSpots }} com vagas disponíveis para novas matrículas.</p>
      </article>

      <article class="metric-card reveal-scale stagger-2">
        <div class="metric-card-top">
          <span class="metric-kicker">Matrículas</span>
          <div class="metric-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
        </div>
        <strong class="metric-value">{{ stats.students }}</strong>
        <span class="metric-label">Alunos matriculados</span>
        <p class="metric-note">Distribuídos em {{ stats.courses || 0 }} frentes de ensino.</p>
      </article>

      <article class="metric-card reveal-scale stagger-3">
        <div class="metric-card-top">
          <span class="metric-kicker">Equipe</span>
          <div class="metric-icon info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
        </div>
        <strong class="metric-value">{{ stats.professors }}</strong>
        <span class="metric-label">Professores ativos</span>
        <p class="metric-note">Corpo docente disponível para a grade atual.</p>
      </article>

      <article class="metric-card metric-card-alert reveal-scale stagger-4">
        <div class="metric-card-top">
          <span class="metric-kicker">Financeiro</span>
          <div class="metric-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
        </div>
        <strong class="metric-value">{{ stats.pendingPayments }}</strong>
        <span class="metric-label">Pagamentos pendentes</span>
        <p class="metric-note">Requerem acompanhamento para preservar a saúde da operação.</p>
      </article>
    </section>

    <section class="dashboard-main">
      <article class="card feature-card reveal-up stagger-2">
        <div class="card-header dashboard-card-header">
          <div>
            <span class="section-tag">Radar acadêmico</span>
            <h3 class="card-title">Cursos Recentes</h3>
          </div>
          <router-link to="/cursos" class="btn btn-sm btn-secondary">Ver todos</router-link>
        </div>

        <div v-if="recentCourses.length > 0" class="course-stack">
          <div v-for="course in recentCourses" :key="course.id" class="course-row">
            <div class="course-row-main">
              <div class="course-avatar">{{ getInitials(course.nome) }}</div>
              <div class="course-copy">
                <strong>{{ course.nome }}</strong>
                <span>{{ course.schedules?.length || 0 }} horário(s)</span>
              </div>
            </div>
            <div class="course-row-meta">
              <span class="course-price">R$ {{ course.valor_mensal.toFixed(2) }}</span>
              <div class="course-capacity">
                <span>{{ course.schedules?.length || 0 }}/{{ course.lotacao }}</span>
                <div class="capacity-track">
                  <div class="capacity-fill" :style="{ width: `${getCapacityPercent(course)}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          <p>Nenhum curso cadastrado</p>
        </div>
      </article>

      <aside class="dashboard-side">
        <article class="card insight-card reveal-up stagger-3">
          <div class="card-header dashboard-card-header">
            <div>
              <span class="section-tag">Pontos de atenção</span>
              <h3 class="card-title">Visão rápida</h3>
            </div>
          </div>

          <div class="insight-list">
            <div class="insight-item">
              <span class="insight-bullet primary"></span>
              <div>
                <strong>{{ unreadNotifications }}</strong>
                <span>notificações aguardando leitura</span>
              </div>
            </div>
            <div class="insight-item">
              <span class="insight-bullet success"></span>
              <div>
                <strong>{{ coursesWithOpenSpots }}</strong>
                <span>cursos ainda com vagas abertas</span>
              </div>
            </div>
            <div class="insight-item">
              <span class="insight-bullet warning"></span>
              <div>
                <strong>{{ stats.pendingPayments }}</strong>
                <span>itens financeiros em aberto</span>
              </div>
            </div>
          </div>
        </article>

        <article class="card reveal-up stagger-4">
          <div class="card-header dashboard-card-header">
            <div>
              <span class="section-tag">Comunicação</span>
              <h3 class="card-title">Notificações Recentes</h3>
            </div>
            <router-link to="/notificacoes" class="btn btn-sm btn-secondary">Ver todas</router-link>
          </div>

          <div v-if="recentNotifications.length > 0" class="notification-feed">
            <div v-for="notification in recentNotifications" :key="notification.id" class="notification-row" :class="{ unread: !notification.lida }">
              <div class="notification-dot" :class="notification.tipo"></div>
              <div class="notification-copy">
                <strong>{{ notification.titulo }}</strong>
                <span>{{ truncate(notification.mensagem, 88) }}</span>
              </div>
              <time class="notification-date">{{ formatDate(notification.created_at) }}</time>
            </div>
          </div>

          <div v-else class="empty-state compact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p>Nenhuma notificação</p>
          </div>
        </article>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const authStore = useAuthStore()
const loading = ref(true)
const courses = ref([])
const notifications = ref([])
const students = ref([])
const professors = ref([])
const payments = ref([])

const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'Usuário')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

const stats = computed(() => ({
  courses: courses.value.length,
  students: students.value.length,
  professors: professors.value.length,
  pendingPayments: payments.value.filter(p => p.status === 'pendente').length
}))

const unreadNotifications = computed(() => notifications.value.filter(notification => !notification.lida).length)
const recentCourses = computed(() => courses.value.slice(0, 5))
const recentNotifications = computed(() => notifications.value.slice(0, 5))

const coursesWithOpenSpots = computed(() =>
  courses.value.filter(course => (course.enrollments?.length || 0) < course.lotacao).length
)

const occupancyRate = computed(() => {
  const totalCapacity = courses.value.reduce((sum, course) => sum + (course.lotacao || 0), 0)
  const occupiedSeats = courses.value.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0)
  if (!totalCapacity) return 0
  return Math.round((occupiedSeats / totalCapacity) * 100)
})

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return 'Agora'
  if (hours < 24) return `${hours}h`
  if (hours < 48) return 'Ontem'
  return date.toLocaleDateString('pt-BR')
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? `${text.substring(0, length)}...` : text
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getCapacityPercent(course) {
  const enrolled = course.enrollments?.length || 0
  if (!course.lotacao) return 0
  return Math.min((enrolled / course.lotacao) * 100, 100)
}

async function fetchData() {
  try {
    const [coursesRes, notificationsRes, studentsRes, professorsRes, paymentsRes] = await Promise.all([
      api.get('/cursos'),
      api.get('/notificacoes'),
      api.get('/alunos'),
      api.get('/professores'),
      api.get('/pagamentos')
    ])
    courses.value = coursesRes.data
    notifications.value = notificationsRes.data
    students.value = studentsRes.data
    professors.value = professorsRes.data
    payments.value = paymentsRes.data
  } catch (error) {
    console.error('Failed to fetch data')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
  gap: 1.25rem;
  padding: 1.75rem;
  border-radius: 32px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.22), transparent 35%),
    radial-gradient(circle at bottom right, rgba(var(--secondary-rgb), 0.18), transparent 24%),
    linear-gradient(135deg, rgba(var(--primary-rgb), 0.18) 0%, rgba(var(--secondary-rgb), 0.22) 54%, rgba(var(--primary-rgb), 0.4) 100%),
    linear-gradient(135deg, #0f172a 0%, #172554 54%, #1d4ed8 100%);
  box-shadow: var(--shadow-lg);
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  inset: auto auto -120px -80px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 64%);
  pointer-events: none;
}

.hero-copy,
.hero-panel {
  position: relative;
  z-index: 1;
}

.hero-copy {
  color: white;
}

.hero-copy .eyebrow {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
}

.hero-copy h1 {
  color: white;
  font-size: clamp(2rem, 3.2vw, 3.25rem);
  margin-bottom: 0.75rem;
}

.hero-copy p {
  color: rgba(255, 255, 255, 0.78);
  max-width: 60ch;
  font-size: 1rem;
}

.hero-tags,
.hero-actions,
.hero-metrics,
.metrics-grid,
.dashboard-main {
  display: flex;
}

.hero-tags {
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.8125rem;
  backdrop-filter: blur(12px);
}

.hero-tag strong {
  color: white;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.hero-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border-color: rgba(255, 255, 255, 0.16);
}

.hero-actions .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.16);
  color: white;
}

.hero-panel {
  padding: 1.25rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(20px);
  color: white;
}

.hero-panel-header,
.hero-highlight,
.hero-metrics,
.metric-card-top,
.dashboard-card-header,
.course-row,
.course-row-main,
.course-row-meta,
.insight-item,
.notification-row {
  display: flex;
}

.hero-panel-header,
.metric-card-top,
.dashboard-card-header,
.course-row,
.notification-row {
  align-items: center;
  justify-content: space-between;
}

.hero-panel-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.72);
}

.hero-panel-badge {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.18);
  color: #a7f3d0;
}

.hero-highlight {
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
}

.hero-highlight-label {
  display: block;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
}

.hero-highlight strong {
  display: block;
  font-size: 2.5rem;
  line-height: 1;
}

.hero-highlight small {
  display: block;
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.72);
}

.hero-highlight-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.45rem;
  min-height: 96px;
}

.chart-bar {
  width: 18px;
  border-radius: 999px 999px 4px 4px;
}

.chart-bar.students {
  background: rgba(255, 255, 255, 0.9);
}

.chart-bar.courses {
  background: rgba(96, 165, 250, 0.92);
}

.chart-bar.payments {
  background: rgba(251, 191, 36, 0.92);
}

.hero-metrics {
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.hero-metric {
  flex: 1;
  padding: 0.85rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.hero-metric span {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 0.25rem;
}

.hero-metric strong {
  font-size: 1.375rem;
}

.hero-metric.attention {
  background: rgba(249, 115, 22, 0.16);
}

.metrics-grid {
  gap: 1rem;
}

.metric-card {
  flex: 1;
  min-width: 0;
  padding: 1.25rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: var(--shadow-sm);
}

.metric-card-primary {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0.96));
}

.metric-card-alert {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(255, 255, 255, 0.96));
}

.metric-kicker,
.section-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.metric-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--primary);
}

.metric-icon.success {
  background: var(--success-light);
  color: var(--success);
}

.metric-icon.info {
  background: var(--info-light);
  color: var(--info);
}

.metric-icon.warning {
  background: var(--warning-light);
  color: var(--warning);
}

.metric-icon svg {
  width: 20px;
  height: 20px;
}

.metric-value {
  display: block;
  margin-top: 1rem;
  font-size: 2.2rem;
  line-height: 1;
  color: var(--text);
}

.metric-label {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.metric-note {
  margin-top: 0.55rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.dashboard-main {
  gap: 1.25rem;
  align-items: stretch;
}

.feature-card {
  flex: 1.2;
}

.dashboard-side {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dashboard-card-header {
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.course-stack,
.notification-feed,
.insight-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.course-row {
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.92));
  border: 1px solid rgba(226, 232, 240, 0.9);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.course-row:hover,
.notification-row:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.course-row-main,
.course-row-meta,
.insight-item,
.notification-row {
  gap: 0.85rem;
}

.course-row-main {
  align-items: center;
  min-width: 0;
}

.course-avatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(249, 115, 22, 0.12));
  color: var(--primary-dark);
  font-weight: 700;
  flex-shrink: 0;
}

.course-copy {
  min-width: 0;
}

.course-copy strong,
.notification-copy strong {
  display: block;
  color: var(--text);
}

.course-copy span,
.notification-copy span {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.course-row-meta {
  align-items: center;
  flex-shrink: 0;
}

.course-price {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text);
}

.course-capacity {
  min-width: 110px;
}

.course-capacity span {
  display: block;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}

.capacity-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.insight-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.94));
}

.insight-item {
  align-items: center;
  padding: 0.9rem 0.95rem;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.86);
}

.insight-item div {
  display: flex;
  flex-direction: column;
}

.insight-item strong {
  color: var(--text);
}

.insight-item span:last-child {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.insight-bullet {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  flex-shrink: 0;
}

.insight-bullet.primary {
  background: var(--primary);
}

.insight-bullet.success {
  background: var(--success);
}

.insight-bullet.warning {
  background: var(--warning);
}

.notification-row {
  align-items: flex-start;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.86);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.notification-row.unread {
  border-color: rgba(37, 99, 235, 0.18);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(255, 255, 255, 0.95));
}

.notification-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 0.35rem;
  flex-shrink: 0;
  background: var(--primary);
}

.notification-dot.pagamento {
  background: var(--warning);
}

.notification-dot.evento {
  background: var(--info);
}

.notification-dot.material {
  background: var(--success);
}

.notification-copy {
  flex: 1;
  min-width: 0;
}

.notification-date {
  color: var(--text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.empty-state.compact {
  padding: 2rem 1rem;
}

@media (max-width: 1200px) {
  .dashboard-hero,
  .dashboard-main,
  .metrics-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    padding: 1.25rem;
    border-radius: 24px;
  }

  .hero-highlight,
  .hero-panel-header,
  .hero-metrics,
  .course-row,
  .course-row-meta,
  .notification-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-tag,
  .hero-actions .btn,
  .hero-panel,
  .metric-card {
    width: 100%;
  }

  .course-capacity,
  .notification-date {
    width: 100%;
  }
}
</style>
