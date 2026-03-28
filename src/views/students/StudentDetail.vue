<template>
  <div class="student-detail">
    <div class="page-header">
      <div>
        <router-link to="/alunos" class="back-link">← Voltar</router-link>
        <h1>{{ studentData?.student?.nome || 'Detalhes do Aluno' }}</h1>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="studentData">
      <div v-if="studentData.has_pending" class="alert alert-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Este aluno possui pendências financeiras. Regularize para continuar utilizando os serviços.</span>
      </div>

      <div class="student-info-grid">
        <div class="card">
          <h3>Informações Pessoais</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Nome</span>
              <span class="info-value">{{ studentData.student.nome || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data de Nascimento</span>
              <span class="info-value">{{ formatDate(studentData.student.data_nascimento) }}</span>
            </div>
            <div class="info-item" v-if="studentData.user">
              <span class="info-label">Email</span>
              <span class="info-value">{{ studentData.user.email || '-' }}</span>
            </div>
            <div class="info-item" v-if="studentData.responsible">
              <span class="info-label">Responsável</span>
              <span class="info-value">{{ studentData.responsible.name || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="tags-header">
            <h3>Tags</h3>
            <button @click="showTagModal = true" class="btn btn-primary btn-sm">+ Adicionar Tag</button>
          </div>
          <div v-if="studentData.tags?.length > 0" class="tags-list">
            <div v-for="tag in studentData.tags" :key="tag.id" class="tag-item">
              <span class="tag-name">{{ tag.tag_name }}</span>
              <span class="tag-professor">por {{ tag.professor?.name || '-' }}</span>
              <button @click="removeTag(tag.id)" class="tag-remove">×</button>
            </div>
          </div>
          <p v-else class="empty-state">Nenhuma tag adicionada</p>
        </div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <h3>Cursos Matriculados</h3>
        <div v-if="groupedEnrollments.length > 0">
          <div v-for="group in groupedEnrollments" :key="group.organizationId" class="org-group">
            <h4 class="org-title">{{ group.organizationName }}</h4>
            <DataTable
              :columns="enrollmentColumns"
              :rows="group.enrollments"
              :filters-visible="false"
              empty-message="Nenhum curso matriculado"
            >
              <template #cell-curso="{ row }">
                <strong>{{ row.course?.nome || '-' }}</strong>
              </template>
              <template #cell-horario="{ row }">
                <span class="monospace">
                  {{ getDayName(row.schedule?.dia_semana) }} - {{ row.schedule?.hora_inicio }} - {{ row.schedule?.hora_fim }}
                </span>
              </template>
              <template #cell-status="{ row }">
                <span :class="['badge', row.status === 'ativo' ? 'badge-success' : 'badge-secondary']">
                  {{ row.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                </span>
              </template>

              <template #cell-acoes="{ row }">
                <TableActionButton :to="`/cursos/${row.course?.id}`" icon="view" />
              </template>
            </DataTable>
          </div>
        </div>
        <p v-else class="empty-state">Nenhum curso matriculado</p>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <h3>Histórico de Pagamentos</h3>
        <DataTable
          v-if="studentData.payments?.length > 0"
          :columns="paymentColumns"
          :rows="studentData.payments"
          :filters-visible="false"
          empty-message="Nenhum pagamento registrado"
        >
          <template #cell-mes="{ row }">
            <span class="monospace">{{ row.mes_referencia }}</span>
          </template>
          <template #cell-valor="{ row }">
            <span>R$ {{ row.valor?.toFixed(2) }}</span>
          </template>
          <template #cell-vencimento="{ row }">
            <span class="monospace">{{ formatDate(row.data_vencimento) }}</span>
          </template>
          <template #cell-pagamento="{ row }">
            <span class="monospace">{{ row.data_pagamento ? formatDate(row.data_pagamento) : '-' }}</span>
          </template>
          <template #cell-status="{ row }">
            <span :class="['badge', getPaymentStatusClass(row.status)]">
              {{ getPaymentStatusName(row.status) }}
            </span>
          </template>
        </DataTable>
        <p v-else class="empty-state">Nenhum pagamento registrado</p>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <div class="tabs-header">
          <h3>Presença por Curso</h3>
          <select v-model="selectedCourseForAttendance" class="course-select" :disabled="attendanceData.length === 0">
            <option value="">Selecione um curso</option>
            <option v-for="c in attendanceData" :key="c.course_id" :value="c.course_id">
              {{ c.course_name }}
            </option>
          </select>
        </div>
        
        <div v-if="attendanceData.length === 0" class="empty-state">
          <p>Este aluno não está matriculado em nenhum curso</p>
        </div>
        <div v-else-if="selectedAttendanceData" class="attendance-chart-container">
          <div class="attendance-summary">
            <div class="summary-item">
              <span class="summary-value">{{ selectedAttendanceData.total_aulas }}</span>
              <span class="summary-label">Total de Aulas</span>
            </div>
            <div class="summary-item present">
              <span class="summary-value">{{ selectedAttendanceData.aulas_presentes }}</span>
              <span class="summary-label">Presenças</span>
            </div>
            <div class="summary-item absent">
              <span class="summary-value">{{ selectedAttendanceData.aulas_ausentes }}</span>
              <span class="summary-label">Ausências</span>
            </div>
            <div class="summary-item percentage">
              <span class="summary-value">{{ selectedAttendanceData.percentual?.toFixed(1) }}%</span>
              <span class="summary-label">Frequência</span>
            </div>
          </div>
          
          <div class="chart-wrapper" v-if="selectedAttendanceData.history?.length > 0">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <p v-else class="empty-state">Nenhum registro de presença para este curso</p>
        </div>
        <p v-else class="empty-state">Selecione um curso para ver o gráfico de presença</p>
      </div>
    </div>

    <div v-if="showTagModal" class="modal-overlay" @click.self="showTagModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Adicionar Tag</h3>
          <button class="modal-close" @click="showTagModal = false">×</button>
        </div>
        <form @submit.prevent="addTag" class="modal-body">
          <div class="form-group">
            <label>Nome da Tag</label>
            <input v-model="newTag" placeholder="Ex: Apto para graduação, Nível iniciante..." required />
          </div>
          <div class="modal-footer">
            <button type="button" @click="showTagModal = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { useToast } from '../../stores/toast'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const route = useRoute()
const { success, error } = useToast()

const loading = ref(true)
const studentData = ref(null)
const showTagModal = ref(false)
const newTag = ref('')
const attendanceData = ref([])
const selectedCourseForAttendance = ref('')

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const enrollmentColumns = [
  { key: 'curso', label: 'Curso', sortable: true },
  { key: 'horario', label: 'Horário', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

const paymentColumns = [
  { key: 'mes', label: 'Mês', sortable: true },
  { key: 'valor', label: 'Valor', sortable: true },
  { key: 'vencimento', label: 'Vencimento', sortable: true },
  { key: 'pagamento', label: 'Pagamento', sortable: false },
  { key: 'status', label: 'Status', sortable: true }
]

const selectedAttendanceData = computed(() => {
  if (!selectedCourseForAttendance.value || !attendanceData.value) return null
  return attendanceData.value.find(a => a.course_id === parseInt(selectedCourseForAttendance.value))
})

const chartData = computed(() => {
  if (!selectedAttendanceData.value?.history) return { labels: [], datasets: [] }
  
  const history = selectedAttendanceData.value.history
  const labels = history.map(h => formatDate(h.data))
  const data = history.map(h => h.presente ? 1 : 0)
  
  return {
    labels,
    datasets: [
      {
        label: 'Presença',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: '#22c55e',
        data: data,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: data.map(v => v === 1 ? '#22c55e' : '#ef4444')
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: -0.2,
      max: 1.2,
      ticks: {
        stepSize: 1,
        callback: function(value) {
          return value === 1 ? 'Presente' : value === 0 ? 'Ausente' : ''
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.raw === 1 ? 'Presente' : 'Ausente'
        }
      }
    }
  }
}

const groupedEnrollments = computed(() => {
  if (!studentData.value?.enrollments) return []
  
  const groups = {}
  studentData.value.enrollments.forEach(e => {
    const orgId = e.organization.id
    if (!groups[orgId]) {
      groups[orgId] = {
        organizationId: orgId,
        organizationName: e.organization.nome,
        enrollments: []
      }
    }
    groups[orgId].enrollments.push(e)
  })
  
  return Object.values(groups)
})

function getDayName(dayIndex) {
  return days[dayIndex] || ''
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function getPaymentStatusClass(status) {
  const classes = {
    pendente: 'badge-warning',
    pago: 'badge-success',
    atrasado: 'badge-error'
  }
  return classes[status] || 'badge-secondary'
}

function getPaymentStatusName(status) {
  const names = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado'
  }
  return names[status] || status
}

async function fetchStudentData() {
  loading.value = true
  try {
    const response = await api.get(`/alunos/${route.params.id}/detalhes`)
    studentData.value = response.data
  } catch (err) {
    console.error('Failed to fetch student details', err)
    error('Erro ao carregar dados do aluno')
  } finally {
    loading.value = false
  }
}

async function fetchAttendanceData() {
  try {
    const response = await api.get(`/alunos/${route.params.id}/presenca`)
    attendanceData.value = response.data
  } catch (err) {
    console.error('Failed to fetch attendance data', err)
  }
}

async function addTag() {
  try {
    await api.post(`/alunos/${route.params.id}/tags`, { tag_name: newTag.value })
    success('Tag adicionada com sucesso')
    showTagModal.value = false
    newTag.value = ''
    fetchStudentData()
  } catch (err) {
    console.error('Failed to add tag', err)
    error(err.response?.data?.error || 'Erro ao adicionar tag')
  }
}

async function removeTag(tagId) {
  try {
    await api.delete(`/alunos/tags/${tagId}`)
    success('Tag removida com sucesso')
    fetchStudentData()
  } catch (err) {
    console.error('Failed to remove tag', err)
    error(err.response?.data?.error || 'Erro ao remover tag')
  }
}

onMounted(() => {
  fetchStudentData()
  fetchAttendanceData()
})
</script>

<style scoped>
.student-detail {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-link {
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 0.5rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #d97706;
}

.alert-warning svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.student-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.info-value {
  font-weight: 500;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tags-header h3 {
  margin: 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.tag-professor {
  font-size: 0.75rem;
  opacity: 0.8;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.tag-remove:hover {
  opacity: 0.7;
}

.org-group {
  margin-bottom: 1.5rem;
}

.org-group:last-child {
  margin-bottom: 0;
}

.org-title {
  font-size: 1rem;
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.monospace {
  font-family: var(--font-mono);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.badge-secondary {
  background: var(--background);
  color: var(--text-secondary);
}

.modal-overlay .modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.tabs-header h3 {
  margin: 0;
}

.course-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  min-width: 200px;
}

.attendance-chart-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.attendance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-md);
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.summary-item.present .summary-value {
  color: #22c55e;
}

.summary-item.absent .summary-value {
  color: #ef4444;
}

.summary-item.percentage .summary-value {
  color: var(--primary);
}

.chart-wrapper {
  height: 250px;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-md);
}
</style>
