<template>
  <div class="schedule-page page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Grade de Cursos</h1>
        <p>Cadastro de cursos ofertados por por organização</p>
      </div>
      <div class="hero-actions">
        <label class="org-select-group">
          <span class="org-select-label">Organização</span>
          <select v-model="selectedOrgId" @change="onOrgChange" class="org-select">
            <option value="">Selecione uma organização...</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.nome }}</option>
          </select>
        </label>
        <div v-if="selectedOrgId" class="schedule-legend">
          <span class="legend-item">
            <i class="legend-swatch occupied"></i>
            Agendado
          </span>
          <span class="legend-item">
            <i class="legend-swatch available"></i>
            Disponível
          </span>
          <span class="legend-item">
            <i class="legend-swatch selecting"></i>
            Seleção por arraste
          </span>
        </div>
      </div>
    </section>

    <div v-if="selectedOrgId && slots.length > 0" class="schedule-container card reveal-up stagger-2">
      <div class="schedule-grid">
        <div v-for="dayIndex in activeDays" :key="dayIndex" class="day-column" :style="getDayTheme(dayIndex)">
          <div class="day-header">
            <span class="day-name">{{ getDayLabel(dayIndex) }}</span>
            <span class="day-count">{{ slotsByDay[dayIndex]?.length || 0 }} slots</span>
          </div>
          <div class="day-slots">
            <div v-for="slot in slotsByDay[dayIndex]" :key="slot.id" class="slot-card" :class="{
              'slot-occupied': !!slot.schedule,
              'slot-available': !slot.schedule,
              'slot-selected': selectedSlot?.id === slot.id,
              'slot-range-selected': selectedSlotIds.includes(slot.id)
            }" @mousedown.prevent="startSlotSelection(slot)" @mouseenter="extendSlotSelection(slot)"
              @mouseup="finishSlotSelection(slot)" @click="handleSlotClick(slot)">
              <div class="slot-topline">
                <span class="slot-time">{{ slot.hora_inicio }} - {{ slot.hora_fim }}</span>
                <span class="slot-status">{{ slot.schedule ? 'Agendado' : 'Disponível' }}</span>
              </div>
              <span v-if="slot.schedule" class="slot-course">
                {{ slot.schedule.course?.nome }}
                <small>{{ slot.schedule.professor?.name || 'Professor não definido' }}</small>
              </span>
              <span v-else class="slot-empty-spacer" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedOrgId" class="empty-state card reveal-up stagger-2">
      <p>Nenhum horário disponível para esta organização.</p>
      <p class="hint">Crie os slots na página de Organizações.</p>
    </div>

    <div v-else class="empty-state card reveal-up stagger-2">
      <p>Selecione uma organização para visualizar a grade de horários.</p>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedSlot?.schedule ? 'Agendamento' : 'Novo Agendamento' }}</h3>
          <button class="modal-close" @click="showModal = false" aria-label="Fechar modal">×</button>
        </div>
        <div class="modal-body">
          <div class="slot-info" v-if="selectedSlot">
            <p><strong>Dia:</strong> {{ getDayLabel(selectedSlot.dia_semana) }}</p>
            <p><strong>Horário:</strong> {{ selectionSummary }}</p>
            <p v-if="selectedSlotIds.length > 1"><strong>Slots:</strong> {{ selectedSlotIds.length }} slots selecionados
            </p>
          </div>

          <template v-if="!selectedSlot?.schedule">
            <div class="form-group">
              <label>Curso</label>
              <select v-model="newSchedule.course_id" required>
                <option value="">Selecione...</option>
                <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.nome }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Professor</label>
              <select v-model="newSchedule.professor_id" required>
                <option value="">Selecione...</option>
                <option v-for="professor in professors" :key="professor.id" :value="professor.id">{{ professor.name }}
                </option>
              </select>
            </div>
          </template>

          <div v-else class="course-info">
            <p><strong>Curso:</strong> {{ selectedSlot.schedule.course?.nome }}</p>
            <p><strong>Professor:</strong> {{ selectedSlot.schedule.professor?.name || '-' }}</p>
            <p><strong>Matrículas:</strong> {{ selectedSlot.schedule.enrollments?.length || 0 }}</p>
          </div>

          <div class="modal-footer">
            <button v-if="selectedSlot?.schedule" @click="showMoveModal" class="btn btn-secondary">Mover
              horário</button>
            <button v-if="selectedSlot?.schedule" @click="removeSchedule" class="btn btn-danger">Remover</button>
            <button type="button" @click="showModal = false" class="btn btn-secondary">{{ selectedSlot?.schedule ?
              'Fechar' :
              'Cancelar' }}</button>
            <button v-if="!selectedSlot?.schedule" @click="createSchedule" class="btn btn-primary">Salvar</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMoveModalFlag" class="modal-overlay" @click.self="showMoveModalFlag = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Mover Agendamento</h3>
          <button class="modal-close" @click="showMoveModalFlag = false" aria-label="Fechar modal">×</button>
        </div>
        <div class="modal-body">
          <p class="move-info">Selecione um novo slot para <strong>{{ selectedSlot?.schedule?.course?.nome }}</strong>
          </p>

          <div class="available-slots-grid">
            <div v-for="slot in availableSlots" :key="slot.id" class="slot-option"
              :class="{ 'slot-option-selected': newSlotId === slot.id }" :style="getDayTheme(slot.dia_semana)"
              @click="newSlotId = slot.id">
              <span class="slot-day">{{ getDayLabel(slot.dia_semana) }}</span>
              <span class="slot-time">{{ slot.hora_inicio }} - {{ slot.hora_fim }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showMoveModalFlag = false" class="btn btn-secondary">Cancelar</button>
            <button @click="moveSchedule" :disabled="!newSlotId" class="btn btn-primary">Mover</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const organizations = ref([])
const professors = ref([])
const selectedOrgId = ref('')
const slots = ref([])
const courses = ref([])
const showModal = ref(false)
const selectedSlot = ref(null)
const newSchedule = ref({ course_id: '', professor_id: '' })
const showMoveModalFlag = ref(false)
const newSlotId = ref(null)
const availableSlots = ref([])
const selectedSlotIds = ref([])
const dragAnchorSlotId = ref(null)
const dragDay = ref(null)
const isDraggingSelection = ref(false)

const dayLabels = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
}

const dayThemes = {
  0: { accent: '#EA580C', soft: 'rgba(234, 88, 12, 0.12)', border: 'rgba(234, 88, 12, 0.22)' },
  1: { accent: '#2563EB', soft: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.22)' },
  2: { accent: '#0891B2', soft: 'rgba(8, 145, 178, 0.12)', border: 'rgba(8, 145, 178, 0.22)' },
  3: { accent: '#7C3AED', soft: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.22)' },
  4: { accent: '#059669', soft: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.22)' },
  5: { accent: '#D97706', soft: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.22)' },
  6: { accent: '#DC2626', soft: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.22)' }
}

const activeDays = computed(() => {
  const days = new Set()
  slots.value.forEach(slot => days.add(slot.dia_semana))
  return Array.from(days).sort((a, b) => a - b)
})

const slotsByDay = computed(() => {
  const grouped = {}
  slots.value.forEach(slot => {
    if (!grouped[slot.dia_semana]) {
      grouped[slot.dia_semana] = []
    }
    grouped[slot.dia_semana].push(slot)
  })
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  })
  return grouped
})

const selectionSummary = computed(() => {
  if (!selectedSlotIds.value.length) {
    return selectedSlot.value ? `${selectedSlot.value.hora_inicio} - ${selectedSlot.value.hora_fim}` : '-'
  }

  const daySlots = slotsByDay.value[selectedSlot.value?.dia_semana] || []
  const selectedSlots = daySlots.filter(slot => selectedSlotIds.value.includes(slot.id))
  if (!selectedSlots.length) {
    return selectedSlot.value ? `${selectedSlot.value.hora_inicio} - ${selectedSlot.value.hora_fim}` : '-'
  }

  return `${selectedSlots[0].hora_inicio} - ${selectedSlots[selectedSlots.length - 1].hora_fim}`
})

function getDayLabel(dayIndex) {
  return dayLabels[dayIndex] || ''
}

function getDayTheme(dayIndex) {
  const theme = dayThemes[dayIndex] || dayThemes[1]
  return {
    '--day-accent': theme.accent,
    '--day-soft': theme.soft,
    '--day-border': theme.border
  }
}

async function fetchOrganizations() {
  try {
    const response = await api.get('/organizacoes')
    organizations.value = response.data
    if (organizations.value.length > 0) {
      selectedOrgId.value = organizations.value[0].id
      await Promise.all([fetchSlots(), fetchCourses(), fetchProfessors()])
    }
  } catch (error) {
    console.error('Failed to fetch organizations')
  } finally {
    loading.value = false
  }
}

async function fetchSlots() {
  if (!selectedOrgId.value) return
  try {
    const response = await api.get(`/organizacoes/${selectedOrgId.value}/slots`)
    slots.value = response.data
  } catch (error) {
    console.error('Failed to fetch slots')
  }
}

async function fetchCourses() {
  try {
    const response = await api.get('/cursos')
    courses.value = response.data
  } catch (error) {
    console.error('Failed to fetch courses')
  }
}

async function fetchProfessors() {
  try {
    const response = await api.get('/professores')
    professors.value = response.data
  } catch (error) {
    console.error('Failed to fetch professors')
  }
}

async function onOrgChange() {
  clearSlotSelection()
  await fetchSlots()
}

function selectSlot(slot) {
  if (authStore.isAdmin || authStore.isCoordinator) {
    if (slot.schedule) {
      selectedSlotIds.value = []
      selectedSlot.value = slot
    } else {
      if (!selectedSlotIds.value.length || !selectedSlotIds.value.includes(slot.id)) {
        selectedSlotIds.value = [slot.id]
      }
      const selectedSlots = getSlotsFromSelection(slot.dia_semana, selectedSlotIds.value)
      selectedSlot.value = selectedSlots[0] || slot
    }
    newSchedule.value = { course_id: '', professor_id: '' }
    showModal.value = true
  }
}

function handleSlotClick(slot) {
  if (isDraggingSelection.value) return
  if (!selectedSlotIds.value.length || slot.schedule) {
    selectSlot(slot)
  }
}

function startSlotSelection(slot) {
  if (!authStore.isAdmin && !authStore.isCoordinator) return
  if (slot.schedule) return

  dragAnchorSlotId.value = slot.id
  dragDay.value = slot.dia_semana
  isDraggingSelection.value = true
  selectedSlotIds.value = [slot.id]
}

function extendSlotSelection(slot) {
  if (!isDraggingSelection.value) return
  if (slot.dia_semana !== dragDay.value) return

  selectedSlotIds.value = buildSlotRange(dragDay.value, dragAnchorSlotId.value, slot.id)
}

function finishSlotSelection(slot) {
  if (!isDraggingSelection.value) return
  if (slot.dia_semana === dragDay.value) {
    selectedSlotIds.value = buildSlotRange(dragDay.value, dragAnchorSlotId.value, slot.id)
  }
  isDraggingSelection.value = false
  openSelectionModal()
}

function stopDraggingSelection() {
  isDraggingSelection.value = false
  dragAnchorSlotId.value = null
  dragDay.value = null
}

function clearSlotSelection() {
  stopDraggingSelection()
  selectedSlotIds.value = []
}

function openSelectionModal() {
  if (!authStore.isAdmin && !authStore.isCoordinator) return
  if (!selectedSlotIds.value.length) return

  const dayIndex = dragDay.value ?? selectedSlot.value?.dia_semana
  if (dayIndex == null) return

  const selectedSlots = getSlotsFromSelection(dayIndex, selectedSlotIds.value)
  if (!selectedSlots.length) return

  selectedSlot.value = selectedSlots[0]
  newSchedule.value = { course_id: '', professor_id: '' }
  showModal.value = true
}

function buildSlotRange(dayIndex, startId, endId) {
  const daySlots = slotsByDay.value[dayIndex] || []
  const startIndex = daySlots.findIndex(slot => slot.id === startId)
  const endIndex = daySlots.findIndex(slot => slot.id === endId)
  if (startIndex === -1 || endIndex === -1) {
    return startId ? [startId] : []
  }

  const step = startIndex <= endIndex ? 1 : -1
  const collected = []

  for (let index = startIndex; ; index += step) {
    const slot = daySlots[index]
    if (!slot || slot.schedule) {
      break
    }
    collected.push(slot.id)
    if (index === endIndex) {
      break
    }
  }

  return collected.length ? collected.sort((a, b) => {
    const slotA = daySlots.find(slot => slot.id === a)
    const slotB = daySlots.find(slot => slot.id === b)
    return slotA.hora_inicio.localeCompare(slotB.hora_inicio)
  }) : [startId]
}

function getSlotsFromSelection(dayIndex, slotIds) {
  const daySlots = slotsByDay.value[dayIndex] || []
  return daySlots.filter(slot => slotIds.includes(slot.id))
}

function showMoveModal() {
  availableSlots.value = slots.value.filter(slot => !slot.schedule && slot.id !== selectedSlot.value.id)
  newSlotId.value = null
  showMoveModalFlag.value = true
}

async function moveSchedule() {
  if (!selectedSlot.value?.schedule?.id || !newSlotId.value) return
  try {
    await api.put(`/agendamentos/${selectedSlot.value.schedule.id}`, {
      organization_slot_id: newSlotId.value
    })
    showMoveModalFlag.value = false
    showModal.value = false
    await fetchSlots()
  } catch (error) {
    alert(`Erro ao mover agendamento: ${error.response?.data?.error || error.message}`)
  }
}

async function createSchedule() {
  if (!selectedSlot.value || !newSchedule.value.course_id || !newSchedule.value.professor_id) return
  try {
    await api.post('/agendamentos', {
      course_id: Number(newSchedule.value.course_id),
      professor_id: Number(newSchedule.value.professor_id),
      organization_slot_id: selectedSlotIds.value[0] || selectedSlot.value.id,
      organization_slot_ids: selectedSlotIds.value.length > 1 ? selectedSlotIds.value : undefined
    })
    showModal.value = false
    clearSlotSelection()
    await fetchSlots()
  } catch (error) {
    alert(`Erro ao criar agendamento: ${error.response?.data?.error || error.message}`)
  }
}

async function removeSchedule() {
  if (!selectedSlot.value?.schedule?.id) return
  try {
    await api.delete(`/agendamentos/${selectedSlot.value.schedule.id}`)
    showModal.value = false
    clearSlotSelection()
    await fetchSlots()
  } catch (error) {
    alert(`Erro ao remover agendamento: ${error.response?.data?.error || error.message}`)
  }
}

onMounted(() => {
  window.addEventListener('mouseup', stopDraggingSelection)
  fetchOrganizations()
})

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', stopDraggingSelection)
})
</script>

<style scoped>
.schedule-page {
  min-height: calc(100vh - var(--navbar-height));
}

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.org-select-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 320px;
}

.org-select-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.org-select {
  min-width: 320px;
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow: var(--shadow-sm);
}

.schedule-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  display: inline-block;
}

.legend-swatch.occupied {
  background: rgba(37, 99, 235, 0.18);
  border: 1px solid rgba(37, 99, 235, 0.35);
}

.legend-swatch.available {
  background: rgba(5, 150, 105, 0.1);
  border: 1px solid rgba(5, 150, 105, 0.28);
}

.legend-swatch.selecting {
  background: rgba(217, 119, 6, 0.18);
  border: 1px solid rgba(217, 119, 6, 0.35);
}

.schedule-container {
  padding: 1rem;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.875rem;
}

.day-column {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 255, 0.94));
  border-radius: var(--radius-lg);
  border: 1px solid var(--day-border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.day-header {
  padding: 0.85rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--day-soft), rgba(255, 255, 255, 0.92));
  border-bottom: 1px solid var(--day-border);
}

.day-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text);
}

.day-count {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--day-accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.day-slots {
  padding: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-card {
  padding: 0.7rem;
  border: 1px solid transparent;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  cursor: pointer;
  min-height: 76px;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
}

.slot-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.slot-occupied {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96));
  border-color: rgba(148, 163, 184, 0.28);
}

.slot-available {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(203, 213, 225, 0.88);
  border-style: dashed;
}

.slot-selected {
  border-color: var(--day-accent);
  box-shadow: 0 0 0 3px var(--day-soft);
}

.slot-range-selected {
  border-color: rgba(217, 119, 6, 0.65);
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(255, 237, 213, 0.92));
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18);
}

.slot-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.slot-time {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.slot-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.slot-occupied .slot-status {
  background: rgba(37, 99, 235, 0.12);
  color: var(--primary-dark);
}

.slot-available .slot-status {
  background: rgba(15, 23, 42, 0.07);
  color: var(--text);
}

.slot-course {
  display: flex;
  flex-direction: column;
  font-size: 0.8125rem;
  color: var(--text);
  font-weight: 600;
  line-height: 1.35;
}

.slot-course small {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.slot-empty-spacer {
  display: block;
  min-height: 34px;
}

.slot-info,
.course-info {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.slot-info p,
.course-info p,
.move-info {
  margin: 0;
}

.available-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.slot-option {
  padding: 0.8rem;
  border: 1px solid var(--day-border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  cursor: pointer;
}

.slot-option-selected {
  border-color: var(--day-accent);
  box-shadow: 0 0 0 3px var(--day-soft);
}

.slot-day {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--day-accent);
}

.empty-state {
  text-align: center;
}

@media (max-width: 768px) {

  .org-select-group,
  .org-select {
    min-width: 100%;
  }

  .schedule-grid,
  .available-slots-grid {
    grid-template-columns: 1fr;
  }
}
</style>
