<template>
  <div class="student-list page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Alunos</h1>
        <p>Centralize o vínculo entre aluno, usuário e responsável com uma leitura mais clara.</p>
      </div>
      <div class="hero-actions">
        <button @click="filtersVisible = !filtersVisible" class="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        <button v-if="authStore.isAdmin || authStore.isCoordinator" @click="showModal = true" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Cadastrar
        </button>
      </div>
    </section>

    <div class="filters-bar reveal-up stagger-2" :class="{ hidden: !filtersVisible }">
      <select v-model="filters.responsible">
        <option value="">Todos os responsáveis</option>
        <option v-for="r in responsibles" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <select v-model="filters.ageRange">
        <option value="">Todas as idades</option>
        <option value="0-10">0-10 anos</option>
        <option value="11-14">11-14 anos</option>
        <option value="15-17">15-17 anos</option>
        <option value="18+">18+ anos</option>
      </select>
    </div>

    <div class="card reveal-up stagger-3">
      <DataTable
        :columns="tableColumns"
        :rows="filteredStudents"
        :filters-visible="filtersVisible"
        row-class="student-row"
        empty-message="Nenhum aluno cadastrado"
        empty-filtered-message="Nenhum aluno encontrado para a busca."
        search-placeholder="Buscar alunos..."
        default-sort-key="nome"
      >
        <template #cell-nome="{ row }">
          <div class="student-cell">
            <div class="student-avatar">{{ getInitials(row.nome || row.user?.name) }}</div>
            <div class="student-meta">
              <strong>{{ row.nome || row.user?.name || '-' }}</strong>
              <span>{{ row.user?.email ? 'Usuário vinculado' : 'Sem usuário vinculado' }}</span>
            </div>
          </div>
        </template>

        <template #cell-data_nascimento="{ row }">
          <span class="monospace">{{ formatDate(row.data_nascimento) }}</span>
        </template>

        <template #cell-acoes="{ row }">
          <TableActionButton :to="`/alunos/${row.id}`" icon="view" />
        </template>

        <template #empty="{ totalCount }">
          <div class="empty-state">
            <template v-if="totalCount === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <p>Nenhum aluno cadastrado</p>
            </template>
            <p v-else>Nenhum resultado para os filtros selecionados</p>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Novo Aluno</h3>
          <button class="modal-close" @click="showModal = false" aria-label="Fechar modal">×</button>
        </div>
        <form @submit.prevent="createStudent" class="modal-body">
          <div class="form-group">
            <label>Nome do Aluno</label>
            <input v-model="newStudent.nome" placeholder="Nome completo" required />
          </div>
          <div class="form-group">
            <label>Data Nascimento</label>
            <input v-model="newStudent.data_nascimento" type="date" required @change="checkAge" />
          </div>
          <div v-if="showResponsible && newStudent.data_nascimento" class="form-group reveal-up">
            <label>Responsável</label>
            <select v-model="newStudent.responsible_id" required>
              <option value="">Selecione...</option>
              <option v-for="r in responsibles" :key="r.id" :value="r.id">{{ r.name }} ({{ r.email }})</option>
            </select>
          </div>
          <div v-else-if="!showResponsible && newStudent.data_nascimento" class="form-group reveal-up">
            <label>Usuário</label>
            <select v-model="newStudent.user_id">
              <option value="">Selecione (opcional)</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Criar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'

const authStore = useAuthStore()
const loading = ref(true)
const students = ref([])
const users = ref([])
const responsibles = ref([])
const showModal = ref(false)
const filtersVisible = ref(false)
const newStudent = ref({ nome: '', user_id: '', data_nascimento: '', responsible_id: null })
const showResponsible = ref(false)
const filters = ref({
  responsible: '',
  ageRange: ''
})

const tableColumns = [
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
    value: student => student.nome || student.user?.name || '-',
    sortValue: student => student.nome || student.user?.name || '-',
    searchValue: student => `${student.nome || student.user?.name || ''} ${student.user?.email || ''}`
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    value: student => student.user?.email || '-'
  },
  {
    key: 'data_nascimento',
    label: 'Data Nascimento',
    sortable: true,
    value: student => formatDate(student.data_nascimento),
    sortValue: student => new Date(student.data_nascimento).getTime()
  },
  {
    key: 'responsible',
    label: 'Responsável',
    sortable: true,
    value: student => student.responsible?.name || '-',
    sortValue: student => student.responsible?.name || '-'
  },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

const filteredStudents = computed(() => {
  let result = students.value.filter(student => {
    if (filters.value.responsible) {
      if (student.responsible_id !== parseInt(filters.value.responsible)) return false
    }

    if (filters.value.ageRange) {
      const birthDate = new Date(student.data_nascimento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (filters.value.ageRange === '0-10' && (age < 0 || age > 10)) return false
      if (filters.value.ageRange === '11-14' && (age < 11 || age > 14)) return false
      if (filters.value.ageRange === '15-17' && (age < 15 || age > 17)) return false
      if (filters.value.ageRange === '18+' && age < 18) return false
    }

    return true
  })

  return result
})

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

function checkAge() {
  newStudent.value.user_id = ''
  newStudent.value.responsible_id = null

  if (!newStudent.value.data_nascimento) {
    showResponsible.value = false
    return
  }
  const birthDate = new Date(newStudent.value.data_nascimento)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  showResponsible.value = age < 18
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

async function fetchData() {
  try {
    const [studentsRes, usersRes] = await Promise.all([
      api.get('/alunos'),
      api.get('/auth/users')
    ])
    students.value = studentsRes.data
    users.value = usersRes.data.filter(u => u.role !== 'admin')
    responsibles.value = usersRes.data.filter(u => u.role === 'responsible')
  } catch (error) {
    console.error('Failed to fetch data')
  } finally {
    loading.value = false
  }
}

async function createStudent() {
  if (!newStudent.value.nome) {
    alert('Nome é obrigatório')
    return
  }

  if (!newStudent.value.data_nascimento) {
    alert('Data de nascimento é obrigatória')
    return
  }

  if (showResponsible.value && !newStudent.value.responsible_id) {
    alert('Para menores de 18 anos, é obrigatório selecionar um responsável')
    return
  }

  try {
    const data = {
      nome: newStudent.value.nome,
      user_id: newStudent.value.user_id || null,
      data_nascimento: newStudent.value.data_nascimento,
      responsible_id: newStudent.value.responsible_id || null
    }
    await api.post('/alunos', data)
    showModal.value = false
    newStudent.value = { nome: '', user_id: '', data_nascimento: '', responsible_id: null }
    showResponsible.value = false
    fetchData()
  } catch (error) {
    console.error('Failed to create student')
    alert(error.response?.data?.error || 'Erro ao criar aluno')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filters-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
  transition: opacity 0.2s ease, max-height 0.2s ease;
  overflow: hidden;
}

.filters-bar.hidden {
  max-height: 0;
  opacity: 0;
  margin: 0;
}

.filters-bar select {
  padding: 0.625rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  min-width: 180px;
}

.student-row {
  transition: transform var(--transition-fast);
}

.student-row:hover {
  transform: translateX(2px);
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-100), rgba(249, 115, 22, 0.14));
  color: var(--primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.student-meta {
  display: flex;
  flex-direction: column;
}

.student-meta strong {
  font-size: 0.9375rem;
}

.student-meta span {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.monospace {
  font-family: var(--font-mono);
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-overlay .modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .filters-bar {
    grid-template-columns: 1fr;
  }
}
</style>
