<template>
  <div class="course-detail">
    <div class="page-header">
      <div>
        <router-link to="/cursos" class="back-link">← Voltar</router-link>
        <h1>{{ course?.nome }}</h1>
      </div>
    </div>

    <div v-if="courseStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="course-info-grid">
        <div class="card info-card">
          <h3>Informações do Curso</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Descrição</span>
              <span class="info-value">{{ course?.descricao || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Valor Mensal</span>
              <span class="info-value">R$ {{ course?.valor_mensal?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Lotação</span>
              <span class="info-value">{{ course?.lotacao }} alunos por turma</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duração da Aula</span>
              <span class="info-value">{{ course?.duracao_aula_minutos }} min</span>
            </div>
          </div>
        </div>

        <div class="card schedule-card">
          <h3>Grade de Horários</h3>
          <div v-if="course?.schedules?.length > 0" class="schedule-list">
            <div v-for="schedule in course.schedules" :key="schedule.id" class="schedule-item">
              <div class="schedule-time">
                <span class="day">{{ getDayName(schedule.dia_semana) }}</span>
                <span class="time">{{ schedule.hora_inicio }} - {{ schedule.hora_fim }}</span>
              </div>
              <div class="schedule-info">
                <span class="professor">Prof. {{ schedule.professor?.name || '-' }}</span>
                <span class="organization" v-if="schedule.slot?.organization">
                  {{ schedule.slot.organization.nome }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="empty-state">Nenhum horário agendado</p>
          <router-link v-if="authStore.isAdmin || authStore.isCoordinator" to="/agendamentos"
            class="btn btn-primary btn-sm" style="margin-top: 1rem;">
            Gerenciar Horários
          </router-link>
        </div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <div class="enrolled-header">
          <h3>Alunos Matriculados</h3>
          <button v-if="authStore.isAdmin || authStore.isCoordinator" @click="showEnrollModal = true"
            class="btn btn-primary btn-sm">
            Matricular Aluno
          </button>
        </div>
        <DataTable
          v-if="enrolledStudents.length > 0"
          :columns="tableColumns"
          :rows="enrolledStudents"
          :filters-visible="false"
          search-placeholder="Buscar alunos..."
          empty-message="Nenhum aluno matriculado"
        >
          <template #cell-nome_aluno="{ row }">
            <div class="student-cell">
              <strong>{{ row.student?.nome || '-' }}</strong>
            </div>
          </template>

          <template #cell-horario_turma="{ row }">
            <span class="monospace">
              {{ getDayName(row.schedule?.dia_semana) }} - {{ row.schedule?.hora_inicio }} - {{ row.schedule?.hora_fim }}
            </span>
          </template>

          <template #cell-organizacao="{ row }">
            <span>{{ row.schedule?.slot?.organization?.nome || '-' }}</span>
          </template>

          <template #cell-status="{ row }">
            <span :class="['badge', row.status === 'ativo' ? 'badge-success' : 'badge-secondary']">
              {{ row.status === 'ativo' ? 'Ativo' : 'Inativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <TableActionButton :to="`/alunos/${row.student?.id}`" icon="view" />
          </template>
        </DataTable>
        <p v-else class="empty-state">Nenhum aluno matriculado</p>
      </div>
    </div>

    <div v-if="showEnrollModal" class="modal-overlay" @click.self="showEnrollModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Matricular Aluno</h3>
          <button class="modal-close" @click="showEnrollModal = false">×</button>
        </div>
        <form @submit.prevent="enrollStudent" class="modal-body">
          <div class="form-group">
            <label>Horário</label>
            <select v-model="enrollData.schedule_id" required>
              <option value="">Selecione...</option>
              <option v-for="s in course?.schedules" :key="s.id" :value="s.id">
                {{ getDayName(s.dia_semana) }} - {{ s.hora_inicio }} - {{ s.hora_fim }} (Prof. {{ s.professor?.name }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Aluno</label>
            <select v-model="enrollData.student_id" required>
              <option value="">Selecione...</option>
              <option v-for="s in availableStudents" :key="s.id" :value="s.id">{{ s.nome }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showEnrollModal = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Matricular</button>
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
import { useAuthStore } from '../../stores/auth'
import { useCourseStore } from '../../stores/courses'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'

const route = useRoute()
const courseStore = useCourseStore()
const authStore = useAuthStore()

const courseId = computed(() => route.params.id)
const course = computed(() => courseStore.currentCourse)
const enrolledStudents = ref([])
const allStudents = ref([])
const showEnrollModal = ref(false)
const enrollData = ref({ schedule_id: '', student_id: '' })
const scheduledEnrollments = ref([])

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const tableColumns = [
  { key: 'nome_aluno', label: 'Nome do Aluno', sortable: true, searchable: true },
  { key: 'horario_turma', label: 'Horário da Turma', sortable: true },
  { key: 'organizacao', label: 'Nome da Organização', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

function getDayName(dayIndex) {
  return days[dayIndex] || ''
}

async function fetchCourseData() {
  await courseStore.fetchCourse(courseId.value)
  const studentsRes = await api.get(`/cursos/${courseId.value}/alunos`)
  enrolledStudents.value = studentsRes.data
}

const availableStudents = computed(() => {
  const enrolledIds = new Set(scheduledEnrollments.value.map(enrollment => enrollment.student_id))
  return allStudents.value.filter(student => !enrolledIds.has(student.id))
})

async function fetchStudents() {
  const response = await api.get('/alunos')
  allStudents.value = response.data
}

async function fetchScheduleEnrollments(scheduleId) {
  if (!scheduleId) {
    scheduledEnrollments.value = []
    return
  }
  const response = await api.get(`/agendamentos/${scheduleId}/alunos`)
  scheduledEnrollments.value = response.data
}

async function enrollStudent() {
  try {
    await api.post(`/agendamentos/${enrollData.value.schedule_id}/matricular`, { student_id: enrollData.value.student_id })
    showEnrollModal.value = false
    enrollData.value = { schedule_id: '', student_id: '' }
    scheduledEnrollments.value = []
    fetchCourseData()
  } catch (error) {
    console.error('Failed to enroll student')
  }
}

watch(() => enrollData.value.schedule_id, scheduleId => {
  fetchScheduleEnrollments(scheduleId)
})

onMounted(() => {
  fetchCourseData()
  fetchStudents()
})
</script>

<style scoped>
.course-detail {
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

.course-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .course-info-grid {
    grid-template-columns: 1fr;
  }
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

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-md);
}

.schedule-time {
  display: flex;
  flex-direction: column;
}

.schedule-time .day {
  font-weight: 500;
}

.schedule-time .time {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.schedule-info .professor {
  color: var(--primary);
  font-size: 0.875rem;
}

.schedule-info .organization {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.enrolled-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.enrolled-header h3 {
  margin: 0;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.monospace {
  font-family: var(--font-mono);
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
</style>
