<template>
  <div class="organization-list page-shell">
    <section class="page-hero reveal-up">
      <div>
        <h1>Organizações</h1>
        <p>Gerencie associações, escolas e instituições com o mesmo padrão visual da agenda de aulas.</p>
      </div>
      <div class="hero-actions">
        <button @click="filtersVisible = !filtersVisible" class="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        <button v-if="authStore.isAdmin || authStore.isCoordinator" @click="showModal = true"
          class="btn btn-primary hero-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Cadastrar
        </button>
      </div>
    </section>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="card reveal-up stagger-2">
      <DataTable :columns="tableColumns" :rows="organizations" :filters-visible="filtersVisible"
        empty-message="Nenhuma organização cadastrada"
        empty-filtered-message="Nenhuma organização encontrada para a busca."
        search-placeholder="Buscar organizações..." default-sort-key="nome">
        <template #cell-nome="{ row }">
          <div class="org-info">
            <span class="org-name">{{ row.nome }}</span>
          </div>
        </template>

        <template #cell-tipo="{ row }">
          <span class="badge" :class="getTypeClass(row.tipo)">
            {{ getTypeLabel(row.tipo) }}
          </span>
        </template>

        <template #cell-horario="{ row }">
          <span>{{ row.hora_abertura }} - {{ row.hora_fechamento }}</span>
        </template>

        <template #cell-duracao="{ row }">
          <span>{{ row.duracao_aula_minutos || 60 }} min</span>
        </template>

        <template #cell-dias="{ row }">
          <span class="days-label">{{ formatDays(row.dias_semana) }}</span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="table-actions">
            <TableActionButton icon="schedule" @click="viewSlots(row)" />
            <TableActionButton v-if="authStore.isAdmin || authStore.isCoordinator" icon="edit"
              @click="editOrganization(row)" />
          </div>
        </template>

        <template #empty="{ totalCount }">
          <div class="empty-state">
            <template v-if="totalCount === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              <p>Nenhuma organização cadastrada</p>
              <button @click="showModal = true" class="btn btn-primary btn-sm">Criar primeira organização</button>
            </template>
            <p v-else>Nenhuma organização encontrada para a busca.</p>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingOrg ? 'Editar' : 'Nova' }} Organização</h3>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveOrganization" class="modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="newOrg.nome" placeholder="Ex: Associação de Moradores" required />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="newOrg.tipo" required>
              <option value="">Selecione...</option>
              <option value="associacao">Associação de Moradores</option>
              <option value="escola">Escola</option>
              <option value="instituicao">Instituição</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Hora de Abertura</label>
              <input v-model="newOrg.hora_abertura" type="time" required />
            </div>
            <div class="form-group">
              <label>Hora de Fechamento</label>
              <input v-model="newOrg.hora_fechamento" type="time" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Duração das Aulas (minutos)</label>
              <input v-model.number="newOrg.duracao_aula_minutos" type="number" min="15" step="15" placeholder="60" />
            </div>
            <div class="form-group">
              <label>Intervalo entre Aulas (minutos)</label>
              <input v-model.number="newOrg.intervalo_minutos" type="number" min="0" placeholder="10" />
            </div>
          </div>
          <div class="form-group">
            <label>Dias de Funcionamento</label>
            <div class="checkbox-group">
              <label v-for="(day, index) in weekDays" :key="index" class="checkbox-label">
                <input type="checkbox" :value="index" v-model="selectedDays" />
                {{ day }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editingOrg ? 'Salvar' : 'Criar' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showSlotsModal" class="modal-overlay" @click.self="showSlotsModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Grade de Cursos - {{ selectedOrg?.nome }}</h3>
          <button class="modal-close" @click="showSlotsModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="slots-grid">
            <div v-for="(daySlots, dayIndex) in groupedSlots" :key="dayIndex" class="day-column">
              <div class="day-header">{{ days[dayIndex] }}</div>
              <div class="day-slots">
                <div v-for="slot in daySlots" :key="slot.id" class="slot-card"
                  :class="{ 'slot-occupied': !!slot.schedule }">
                  <span class="slot-time">{{ slot.hora_inicio }} - {{ slot.hora_fim }}</span>
                  <span v-if="slot.schedule" class="slot-course">
                    {{ slot.schedule.course?.nome }}
                    <small>{{ slot.schedule.professor?.name || '-' }}</small>
                  </span>
                  <span v-else class="slot-available">Disponível</span>
                </div>
                <p v-if="daySlots.length === 0" class="empty-day">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const organizations = ref([])
const showModal = ref(false)
const filtersVisible = ref(false)
const showSlotsModal = ref(false)
const editingOrg = ref(null)
const selectedOrg = ref(null)
const slots = ref([])

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const selectedDays = ref([1, 2, 3, 4, 5])

const newOrg = ref({
  nome: '',
  tipo: '',
  hora_abertura: '08:00',
  hora_fechamento: '18:00',
  duracao_aula_minutos: 60,
  intervalo_minutos: 10,
  dias_semana: ''
})

const tableColumns = [
  { key: 'nome', label: 'Nome', sortable: true },
  {
    key: 'tipo',
    label: 'Tipo',
    sortable: true,
    value: row => getTypeLabel(row.tipo),
    sortValue: row => getTypeLabel(row.tipo)
  },
  {
    key: 'horario',
    label: 'Horário',
    sortable: true,
    value: row => `${row.hora_abertura} - ${row.hora_fechamento}`,
    sortValue: row => row.hora_abertura
  },
  {
    key: 'duracao',
    label: 'Duração',
    sortable: true,
    value: row => `${row.duracao_aula_minutos || 60} min`,
    sortValue: row => row.duracao_aula_minutos || 60
  },
  {
    key: 'dias',
    label: 'Dias',
    sortable: true,
    value: row => formatDays(row.dias_semana)
  },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

const groupedSlots = computed(() => {
  const grouped = [[], [], [], [], [], [], []]
  slots.value.forEach(slot => {
    if (slot.dia_semana >= 0 && slot.dia_semana < 7) {
      grouped[slot.dia_semana].push(slot)
    }
  })
  grouped.forEach(day => {
    day.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  })
  return grouped
})

function getTypeLabel(tipo) {
  const labels = {
    associacao: 'Associação',
    escola: 'Escola',
    instituicao: 'Instituição'
  }
  return labels[tipo] || tipo
}

function getTypeClass(tipo) {
  const classes = {
    associacao: 'badge-blue',
    escola: 'badge-green',
    instituicao: 'badge-purple'
  }
  return classes[tipo] || ''
}

function formatDays(diasStr) {
  if (!diasStr) return 'Seg-Sex'
  const dias = diasStr.split(',').map(Number)
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const labels = dias.map(d => dayLabels[d]).filter(Boolean)
  if (labels.length === 0) return 'Seg-Sex'
  return labels.join('-')
}

async function fetchOrganizations() {
  loading.value = true
  try {
    const response = await api.get('/organizacoes')
    organizations.value = response.data
  } catch (error) {
    console.error('Failed to fetch organizations')
  } finally {
    loading.value = false
  }
}

async function saveOrganization() {
  try {
    const orgData = {
      ...newOrg.value,
      dias_semana: selectedDays.value.join(',')
    }
    if (editingOrg.value) {
      await api.put(`/organizacoes/${editingOrg.value.id}`, orgData)
    } else {
      await api.post('/organizacoes', orgData)
    }
    closeModal()
    fetchOrganizations()
  } catch (error) {
    console.error('Failed to save organization')
  }
}

function editOrganization(org) {
  editingOrg.value = org
  const dias = org.dias_semana ? org.dias_semana.split(',').map(Number) : [1, 2, 3, 4, 5]
  selectedDays.value = dias
  newOrg.value = {
    nome: org.nome,
    tipo: org.tipo,
    hora_abertura: org.hora_abertura,
    hora_fechamento: org.hora_fechamento,
    duracao_aula_minutos: org.duracao_aula_minutos || 60,
    intervalo_minutos: org.intervalo_minutos || 10,
    dias_semana: org.dias_semana || ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingOrg.value = null
  selectedDays.value = [1, 2, 3, 4, 5]
  newOrg.value = {
    nome: '',
    tipo: '',
    hora_abertura: '08:00',
    hora_fechamento: '18:00',
    duracao_aula_minutos: 60,
    intervalo_minutos: 10,
    dias_semana: ''
  }
}

async function viewSlots(org) {
  selectedOrg.value = org
  try {
    const response = await api.get(`/organizacoes/${org.id}/slots`)
    slots.value = response.data
    showSlotsModal.value = true
  } catch (error) {
    console.error('Failed to fetch slots')
  }
}

onMounted(() => {
  fetchOrganizations()
})
</script>

<style scoped>
.organization-list {
  min-height: calc(100vh - var(--navbar-height));
}

.hero-action {
  flex-shrink: 0;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}

.org-info {
  display: flex;
  flex-direction: column;
}

.org-name {
  font-weight: 500;
  color: var(--text);
}

.days-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-blue {
  background: #DBEAFE;
  color: #1D4ED8;
}

.badge-green {
  background: #D1FAE5;
  color: #059669;
}

.badge-purple {
  background: #EDE9FE;
  color: #7C3AED;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.modal-lg {
  max-width: 900px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.day-column {
  background: var(--background);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.day-header {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  background: var(--primary);
  color: white;
  font-size: 0.875rem;
}

.day-slots {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 150px;
}

.slot-card {
  padding: 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slot-occupied {
  background: var(--primary-100);
}

.slot-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
}

.slot-course {
  font-size: 0.6875rem;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.slot-course small {
  color: var(--text-secondary);
}

.slot-available {
  font-size: 0.6875rem;
  color: var(--success);
}

.empty-day {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
}

@media (max-width: 768px) {
  .hero-action {
    width: 100%;
  }
}
</style>
