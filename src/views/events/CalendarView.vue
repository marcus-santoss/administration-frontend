<template>
  <div class="calendar-view page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Calendário de Eventos</h1>
        <p>Gerencie eventos, aulas extras e atividades da instituição.</p>
      </div>
      <div class="hero-actions">
        <button @click="showEventModal = true" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Evento
        </button>
      </div>
    </section>

    <div class="card reveal-up stagger-2">
      <div class="calendar-container">
        <FullCalendar :options="calendarOptions" ref="calendarRef" />
      </div>
    </div>

    <div v-if="showEventModal" class="modal-overlay" @click.self="closeEventModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingEvent ? 'Editar Evento' : 'Novo Evento' }}</h3>
          <button class="modal-close" @click="closeEventModal">×</button>
        </div>
        <form @submit.prevent="saveEvent" class="modal-body">
          <div class="form-group">
            <label>Título</label>
            <input v-model="eventForm.titulo" placeholder="Título do evento" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="eventForm.tipo" required>
                <option value="evento">Evento</option>
                <option value="aula_extra">Aula Extra</option>
                <option value="feriado">Feriado</option>
                <option value="aniversario">Aniversário</option>
                <option value="reuniao">Reunião</option>
              </select>
            </div>
            <div class="form-group">
              <label>Data de Início</label>
              <input v-model="eventForm.data_inicio" type="datetime-local" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data de Término (opcional)</label>
              <input v-model="eventForm.data_fim" type="datetime-local" />
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input v-model="eventForm.is_recorrente" type="checkbox" />
                <span>Evento Recorrente</span>
              </label>
            </div>
          </div>
          <div v-if="eventForm.is_recorrente" class="form-group">
            <label>Dias da Semana (separados por vírgula: 0,1,2,3,4,5,6)</label>
            <input v-model="eventForm.dias_recorrencia" placeholder="0=Domingo, 1=Segunda, ..." />
            <small style="color: var(--text-secondary)">0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado</small>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea v-model="eventForm.descricao" rows="3" placeholder="Descrição do evento"></textarea>
          </div>
          <div class="modal-footer">
            <button v-if="editingEvent" type="button" @click="deleteEvent" class="btn btn-danger">Excluir</button>
            <div class="footer-spacer"></div>
            <button type="button" @click="closeEventModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editingEvent ? 'Salvar' : 'Criar' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEventDetailsModal" class="modal-overlay" @click.self="showEventDetailsModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedEvent?.titulo }}</h3>
          <button class="modal-close" @click="showEventDetailsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="event-details">
            <div class="detail-item">
              <span class="detail-label">Tipo</span>
              <span class="badge" :class="`badge-${selectedEvent?.tipo}`">{{ getEventTypeName(selectedEvent?.tipo) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Data</span>
              <span>{{ formatEventDate(selectedEvent) }}</span>
            </div>
            <div class="detail-item" v-if="selectedEvent?.descricao">
              <span class="detail-label">Descrição</span>
              <span>{{ selectedEvent.descricao }}</span>
            </div>
            <div class="detail-item" v-if="selectedEvent?.creator">
              <span class="detail-label">Criado por</span>
              <span>{{ selectedEvent.creator.name }}</span>
            </div>
          </div>

          <div class="comments-section">
            <h4>Comentários</h4>
            <div v-if="selectedEvent?.comments?.length > 0" class="comments-list">
              <div v-for="comment in selectedEvent.comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <strong>{{ comment.user?.name || 'Usuário' }}</strong>
                  <span>{{ formatCommentDate(comment.created_at) }}</span>
                </div>
                <p>{{ comment.comentario }}</p>
              </div>
            </div>
            <p v-else class="empty-state">Nenhum comentário</p>

            <form @submit.prevent="addComment" class="comment-form">
              <input v-model="newComment" placeholder="Adicionar comentário..." required />
              <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../services/api'
import { useToast } from '../../stores/toast'

const { success, error } = useToast()
const loading = ref(true)

const calendarRef = ref(null)
const events = ref([])
const showEventModal = ref(false)
const showEventDetailsModal = ref(false)
const editingEvent = ref(null)
const selectedEvent = ref(null)
const newComment = ref('')

const eventForm = reactive({
  titulo: '',
  descricao: '',
  tipo: 'evento',
  data_inicio: '',
  data_fim: '',
  is_recorrente: false,
  dias_recorrencia: ''
})

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  events: [],
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop
})

function handleDateSelect(selectInfo) {
  eventForm.data_inicio = selectInfo.startStr
  if (selectInfo.endStr) {
    const end = new Date(selectInfo.endStr)
    end.setMinutes(end.getMinutes() - 1)
    eventForm.data_fim = end.toISOString().slice(0, 16)
  }
  editingEvent.value = null
  showEventModal.value = true
  calendarRef.value?.getApi().unselect()
}

function handleEventClick(clickInfo) {
  selectedEvent.value = clickInfo.event.extendedProps.originalData
  showEventDetailsModal.value = true
}

async function handleEventDrop(dropInfo) {
  try {
    await api.put(`/eventos/${dropInfo.event.id}`, {
      data_inicio: dropInfo.event.startStr
    })
    success('Evento atualizado')
    fetchEvents()
  } catch (err) {
    console.error('Failed to update event', err)
    dropInfo.revert()
    error('Erro ao atualizar evento')
  }
}

function getEventTypeName(tipo) {
  const names = {
    evento: 'Evento',
    aula_extra: 'Aula Extra',
    feriado: 'Feriado',
    aniversario: 'Aniversário',
    reuniao: 'Reunião'
  }
  return names[tipo] || tipo
}

function formatEventDate(event) {
  if (!event) return '-'
  const start = new Date(event.data_inicio).toLocaleString('pt-BR')
  if (event.data_fim) {
    const end = new Date(event.data_fim).toLocaleString('pt-BR')
    return `${start} - ${end}`
  }
  return start
}

function formatCommentDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR')
}

function getEventColor(tipo) {
  const colors = {
    evento: '#3b82f6',
    aula_extra: '#8b5cf6',
    feriado: '#ef4444',
    aniversario: '#f59e0b',
    reuniao: '#10b981'
  }
  return colors[tipo] || '#6b7280'
}

async function fetchEvents() {
  try {
    const response = await api.get('/eventos')
    events.value = response.data
    calendarOptions.events = response.data.map(e => ({
      id: e.id,
      title: e.titulo,
      start: e.data_inicio,
      end: e.data_fim,
      backgroundColor: getEventColor(e.tipo),
      borderColor: getEventColor(e.tipo),
      extendedProps: { originalData: e }
    }))
  } catch (err) {
    console.error('Failed to fetch events', err)
  } finally {
    loading.value = false
  }
}

function closeEventModal() {
  showEventModal.value = false
  editingEvent.value = null
  eventForm.titulo = ''
  eventForm.descricao = ''
  eventForm.tipo = 'evento'
  eventForm.data_inicio = ''
  eventForm.data_fim = ''
  eventForm.is_recorrente = false
  eventForm.dias_recorrencia = ''
}

async function saveEvent() {
  try {
    const data = {
      titulo: eventForm.titulo,
      descricao: eventForm.descricao,
      tipo: eventForm.tipo,
      data_inicio: eventForm.data_inicio,
      data_fim: eventForm.data_fim || null,
      is_recorrente: eventForm.is_recorrente,
      dias_recorrencia: eventForm.dias_recorrencia
    }

    if (editingEvent.value) {
      await api.put(`/eventos/${editingEvent.value}`, data)
      success('Evento atualizado')
    } else {
      await api.post('/eventos', data)
      success('Evento criado')
    }
    closeEventModal()
    fetchEvents()
  } catch (err) {
    console.error('Failed to save event', err)
    error(err.response?.data?.error || 'Erro ao salvar evento')
  }
}

async function deleteEvent() {
  if (!editingEvent.value) return
  
  if (!confirm('Tem certeza que deseja excluir este evento?')) return

  try {
    await api.delete(`/eventos/${editingEvent.value}`)
    success('Evento excluído')
    closeEventModal()
    fetchEvents()
  } catch (err) {
    console.error('Failed to delete event', err)
    error(err.response?.data?.error || 'Erro ao excluir evento')
  }
}

async function addComment() {
  if (!selectedEvent.value || !newComment.value.trim()) return

  try {
    await api.post(`/eventos/${selectedEvent.value.id}/comentarios`, {
      comentario: newComment.value
    })
    newComment.value = ''
    const response = await api.get(`/eventos/${selectedEvent.value.id}`)
    selectedEvent.value = response.data
    fetchEvents()
    success('Comentário adicionado')
  } catch (err) {
    console.error('Failed to add comment', err)
    error(err.response?.data?.error || 'Erro ao adicionar comentário')
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped>
.calendar-view {
  min-height: calc(100vh - var(--navbar-height));
}

.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}

.calendar-container {
  padding: 1rem;
}

:deep(.fc) {
  font-family: var(--font-sans);
}

:deep(.fc-toolbar-title) {
  font-size: 1.25rem;
}

:deep(.fc-button-primary) {
  background-color: var(--primary);
  border-color: var(--primary);
}

:deep(.fc-button-primary:hover) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

:deep(.fc-event) {
  cursor: pointer;
}

.modal-lg {
  max-width: 600px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: flex-end;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
}

.footer-spacer {
  flex: 1;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
}

.badge-evento { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.badge-aula_extra { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.badge-feriado { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge-aniversario { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge-reuniao { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.comments-section h4 {
  margin-bottom: 1rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.comment-item {
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-md);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.comment-header span {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.comment-item p {
  margin: 0;
  font-size: 0.875rem;
}

.comment-form {
  display: flex;
  gap: 0.5rem;
}

.comment-form input {
  flex: 1;
}

.modal-overlay .modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .page-hero {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
