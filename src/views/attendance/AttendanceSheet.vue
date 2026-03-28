<template>
  <div class="attendance-sheet page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Diário de Aula</h1>
        <p>Registre presença por curso, horário e data com o mesmo padrão estrutural da página de Agendamentos.</p>
      </div>
    </section>

    <div class="card filters-card reveal-up stagger-2">
      <select v-model="selectedCourse" @change="fetchSchedule">
        <option value="">Selecione o curso</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.nome }}</option>
      </select>
      <select v-model="selectedSchedule" @change="onScheduleChange">
        <option value="">Selecione o horário</option>
        <option v-for="s in schedules" :key="s.id" :value="s.id">
          {{ getDayName(s.dia_semana) }} - {{ s.hora_inicio }}
        </option>
      </select>
      <div class="date-input-wrapper">
        <input 
          v-model="attendanceDate" 
          type="date" 
          :max="maxDate"
          @change="fetchAttendance"
          :disabled="!selectedSchedule"
        />
        <span v-if="selectedSchedule && !isValidDate" class="date-warning">
          Selecione uma {{ getDayName(selectedScheduleData?.dia_semana) }} passada ou hoje
        </span>
      </div>
    </div>

    <div v-if="selectedSchedule && isValidDate && enrolledStudents.length > 0" class="card reveal-up stagger-2">
      <h3>Lista de Presença</h3>
      <div class="attendance-list">
        <div v-for="student in enrolledStudents" :key="student.id" class="attendance-row">
          <div class="student-info">
            <span class="student-name">{{ student.student?.nome }}</span>
            <div class="student-fields">
              <input 
                type="text" 
                :value="getObservacao(student.student_id)"
                @change="(e) => updateField(student.student_id, 'observacao', e.target.value)"
                placeholder="Anotações..."
                class="field-input"
              />
              <input 
                type="text" 
                :value="getConceito(student.student_id)"
                @change="(e) => updateField(student.student_id, 'conceito', e.target.value)"
                placeholder="Conceito..."
                class="field-input conceito-input"
              />
            </div>
          </div>
          <div class="attendance-actions">
            <button 
              @click="markAttendance(student, true)" 
              :class="['btn', getAttendance(student.student_id) ? 'btn-success' : 'btn-secondary']"
            >
              Presente
            </button>
            <button 
              @click="markAttendance(student, false)" 
              :class="['btn', getAttendance(student.student_id) === false ? 'btn-danger' : 'btn-secondary']"
            >
              Ausente
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedSchedule && isValidDate" class="empty-state card reveal-up stagger-2">
      <p>Nenhum aluno matriculado neste horário</p>
    </div>
    
    <div v-else-if="selectedSchedule && !isValidDate" class="empty-state card reveal-up stagger-2">
      <p>Selecione um dia {{ getDayName(selectedScheduleData?.dia_semana) }} para lançar presença</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useToast } from '../../stores/toast'

const { success, error } = useToast()
const loading = ref(true)

const courses = ref([])
const schedules = ref([])
const enrolledStudents = ref([])
const attendances = ref([])
const selectedCourse = ref('')
const selectedSchedule = ref('')
const attendanceDate = ref(new Date().toISOString().split('T')[0])
const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const selectedScheduleData = computed(() => {
  return schedules.value.find(s => s.id === parseInt(selectedSchedule.value))
})

const isValidDate = computed(() => {
  if (!selectedScheduleData.value || !attendanceDate.value) return false
  const date = new Date(attendanceDate.value + 'T00:00:00')
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  if (date > today) return false
  
  const dayOfWeek = date.getDay()
  return dayOfWeek === selectedScheduleData.value.dia_semana
})

const maxDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

function getDayName(dayIndex) {
  return days[dayIndex] || ''
}

async function fetchCourses() {
  try {
    const response = await api.get('/cursos')
    courses.value = response.data
  } catch (error) {
    console.error('Failed to fetch courses')
  } finally {
    loading.value = false
  }
}

async function fetchSchedule() {
  if (!selectedCourse.value) {
    schedules.value = []
    return
  }
  const response = await api.get(`/cursos/${selectedCourse.value}`)
  schedules.value = response.data.schedules || []
}

function onScheduleChange() {
  if (!selectedSchedule.value) {
    enrolledStudents.value = []
    return
  }
  
  const schedule = selectedScheduleData.value
  if (schedule) {
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    if (dayOfWeek === schedule.dia_semana) {
      attendanceDate.value = today.toISOString().split('T')[0]
    } else {
      const currentDay = schedule.dia_semana
      const diff = (dayOfWeek - currentDay + 7) % 7
      const lastValidDate = new Date(today)
      lastValidDate.setDate(today.getDate() - diff)
      attendanceDate.value = lastValidDate.toISOString().split('T')[0]
    }
  }
  
  fetchAttendance()
}

async function fetchAttendance() {
  if (!selectedSchedule.value || !isValidDate.value) {
    enrolledStudents.value = []
    return
  }
  const [studentsRes, attendanceRes] = await Promise.all([
    api.get(`/agendamentos/${selectedSchedule.value}/alunos`),
    api.get(`/presenca/aula/${selectedSchedule.value}`)
  ])
  enrolledStudents.value = studentsRes.data
  attendances.value = attendanceRes.data.filter(a => a.data.startsWith(attendanceDate.value))
}

function getAttendanceRecord(studentId) {
  return attendances.value.find(a => a.student_id === studentId)
}

function getAttendance(studentId) {
  const record = getAttendanceRecord(studentId)
  return record?.presente
}

function getObservacao(studentId) {
  const record = getAttendanceRecord(studentId)
  return record?.observacao || ''
}

function getConceito(studentId) {
  const record = getAttendanceRecord(studentId)
  return record?.conceito || ''
}

async function markAttendance(student, presente) {
  if (!isValidDate.value) {
    error('Selecione um dia válido para este agendamento')
    return
  }
  
  const record = getAttendanceRecord(student.student_id)
  
  try {
    await api.post('/presenca', {
      schedule_id: selectedSchedule.value,
      student_id: student.student_id,
      presente,
      observacao: record?.observacao || '',
      conceito: record?.conceito || '',
      data: attendanceDate.value
    })
    success(presente ? 'Presença registrada' : 'Ausência registrada')
    fetchAttendance()
  } catch (err) {
    console.error('Failed to mark attendance', err)
    error(err.response?.data?.error || 'Erro ao registrar presença')
  }
}

async function updateField(studentId, field, value) {
  if (!isValidDate.value) {
    error('Selecione um dia válido para este agendamento')
    return
  }
  
  const record = getAttendanceRecord(studentId)
  
  const data = {
    schedule_id: selectedSchedule.value,
    student_id: studentId,
    presente: record?.presente ?? false,
    [field]: value,
    data: attendanceDate.value
  }
  
  if (!record) {
    if (field === 'observacao' || field === 'conceito') {
      data.presente = false
    }
  }

  try {
    await api.post('/presenca', data)
    fetchAttendance()
  } catch (err) {
    console.error('Failed to update field', err)
    error(err.response?.data?.error || 'Erro ao atualizar')
  }
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.attendance-sheet {
  min-height: calc(100vh - var(--navbar-height));
}

.filters-card {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filters-card > * {
  flex: 1 1 220px;
}

.date-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input-wrapper input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-warning {
  font-size: 0.75rem;
  color: var(--warning);
}

.card h3 {
  margin-bottom: 1.5rem;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attendance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-md);
  gap: 1rem;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.student-name {
  font-weight: 500;
}

.student-fields {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.field-input {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 0.8125rem;
  min-width: 150px;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary);
}

.field-input::placeholder {
  color: var(--text-secondary);
}

.conceito-input {
  max-width: 120px;
}

.attendance-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.empty-state {
  margin: 0;
}

@media (max-width: 640px) {
  .attendance-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .attendance-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .attendance-actions .btn {
    flex: 1;
  }
  
  .student-fields {
    width: 100%;
  }
  
  .field-input {
    flex: 1;
    min-width: 100px;
  }
  
  .conceito-input {
    max-width: none;
  }
}
</style>
