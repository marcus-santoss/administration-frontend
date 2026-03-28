<template>
  <div class="course-list page-shell">
    <section class="page-hero reveal-up">
      <div>
        <h1>Cursos</h1>
        <p>Gerencie os cursos da sua instituição</p>
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

    <div v-if="courseStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="card reveal-up stagger-2">
      <DataTable
        :columns="tableColumns"
        :rows="courseStore.courses"
        :filters-visible="filtersVisible"
        row-class="table-row"
        empty-message="Nenhum curso cadastrado"
        empty-filtered-message="Nenhum curso encontrado para a busca."
        search-placeholder="Buscar cursos..."
        default-sort-key="nome"
      >
        <template #cell-nome="{ row }">
          <router-link :to="`/cursos/${row.id}`" class="course-link">
            <div class="course-info">
              <span class="course-name">{{ row.nome }}</span>
              <span class="course-desc">{{ truncate(row.descricao, 50) }}</span>
            </div>
          </router-link>
        </template>

        <template #cell-valor_mensal="{ row }">
          <span class="price">R$ {{ row.valor_mensal.toFixed(2) }}</span>
        </template>

        <template #cell-lotacao="{ row }">
          <div class="capacity-cell">
            <span>{{ row.schedules?.length || 0 }}/{{ row.lotacao }}</span>
            <div class="capacity-bar">
              <div class="capacity-fill" :style="{ width: `${getCapacityPercent(row)}%` }"></div>
            </div>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="table-actions">
            <TableActionButton :to="`/cursos/${row.id}`" icon="view" />
          </div>
        </template>

        <template #empty="{ totalCount }">
          <div class="empty-state">
            <template v-if="totalCount === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
              <p>Nenhum curso cadastrado</p>
              <button @click="showModal = true" class="btn btn-primary btn-sm">Criar primeiro curso</button>
            </template>
            <p v-else>Nenhum curso encontrado para a busca.</p>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h3>Novo Curso</h3>
          <button class="modal-close" @click="showModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="createCourse" class="modal-body">
          <div class="form-group">
            <label>Nome do Curso</label>
            <input v-model="newCourse.nome" placeholder="Ex: Introdução à Programação" required />
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea v-model="newCourse.descricao" rows="3" placeholder="Descreva o conteúdo do curso..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Valor Mensal (R$)</label>
              <input v-model.number="newCourse.valor_mensal" type="number" step="0.01" placeholder="299.90" required />
            </div>
            <div class="form-group">
              <label>Lotação Máxima</label>
              <input v-model.number="newCourse.lotacao" type="number" min="1" placeholder="20" required />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Criar Curso</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCourseStore } from '../../stores/courses'
import { useAuthStore } from '../../stores/auth'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'

const courseStore = useCourseStore()
const authStore = useAuthStore()
const showModal = ref(false)
const filtersVisible = ref(false)
const newCourse = ref({
  nome: '',
  descricao: '',
  valor_mensal: 0,
  lotacao: 20
})

const tableColumns = [
  {
    key: 'nome',
    label: 'Curso',
    sortable: true,
    value: course => course.nome,
    searchValue: course => `${course.nome} ${course.descricao || ''}`
  },
  {
    key: 'valor_mensal',
    label: 'Valor Mensal',
    sortable: true,
    value: course => course.valor_mensal,
    sortValue: course => course.valor_mensal
  },
  {
    key: 'lotacao',
    label: 'Lotação',
    sortable: true,
    value: course => `${course.schedules?.length || 0}/${course.lotacao}`,
    sortValue: course => (course.schedules?.length || 0) / (course.lotacao || 1)
  },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? `${text.substring(0, length)}...` : text
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getCapacityPercent(course) {
  const schedulesCount = course.schedules?.length || 0
  return Math.min((schedulesCount / course.lotacao) * 100, 100)
}

async function createCourse() {
  try {
    await courseStore.createCourse(newCourse.value)
    showModal.value = false
    newCourse.value = { nome: '', descricao: '', valor_mensal: 0, lotacao: 20 }
  } catch (error) {
    console.error('Failed to create course')
  }
}

onMounted(() => {
  courseStore.fetchCourses()
})
</script>

<style scoped>
.course-link {
  text-decoration: none;
  color: inherit;
}

.table-row {
  transition: transform var(--transition-fast);
}

.table-row:hover {
  transform: translateX(2px);
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.course-name {
  font-weight: 500;
  color: var(--text);
}

.course-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.professor-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.professor-avatar {
  width: 28px;
  height: 28px;
  background: var(--primary-100);
  color: var(--primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;
}

.price {
  font-weight: 600;
  color: var(--text);
  font-family: var(--font-mono);
}

.capacity-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.capacity-cell span {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.capacity-bar {
  width: 60px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width var(--transition-base);
}

.modal-wide {
  max-width: 640px;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
