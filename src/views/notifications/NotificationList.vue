<template>
  <div class="notification-list page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Notificações</h1>
        <p>Consulte avisos e envie comunicados seguindo o mesmo padrão visual das telas principais do sistema.</p>
      </div>
      <button @click="filtersVisible = !filtersVisible" class="btn btn-secondary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
      </button>
    </section>

    <div class="card reveal-up stagger-2">
      <DataTable
        :columns="tableColumns"
        :rows="notifications"
        :filters-visible="filtersVisible"
        :row-class="getNotificationRowClass"
        empty-message="Nenhuma notificação"
        empty-filtered-message="Nenhuma notificação encontrada para a busca."
        search-placeholder="Buscar notificações..."
        default-sort-key="data"
        default-sort-order="desc"
      >
        <template #cell-tipo="{ row }">
          <span :class="['badge', getTypeClass(row.tipo)]">
            {{ row.tipo }}
          </span>
        </template>

        <template #cell-mensagem="{ row }">
          <span class="message-cell">{{ row.mensagem }}</span>
        </template>

        <template #cell-data="{ row }">
          <span>{{ formatDate(row.created_at) }}</span>
        </template>

        <template #cell-status="{ row }">
          <TableActionButton v-if="!row.lida" icon="read" @click="markAsRead(row.id)" />
          <span v-else class="text-muted">Lida</span>
        </template>
      </DataTable>
    </div>

    <div v-if="authStore.isProfessor" class="card reveal-up stagger-2 notification-compose">
      <h3>Enviar Notificação</h3>
      <form @submit.prevent="sendNotification" class="notification-form">
        <div class="form-group">
          <label>Curso</label>
          <select v-model="notificationData.course_id">
            <option value="">Todos os cursos</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Título</label>
          <input v-model="notificationData.titulo" required />
        </div>
        <div class="form-group">
          <label>Mensagem</label>
          <textarea v-model="notificationData.mensagem" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select v-model="notificationData.tipo" required>
            <option value="pagamento">Pagamento</option>
            <option value="evento">Evento</option>
            <option value="material">Material</option>
            <option value="aula_extra">Aula Extra</option>
            <option value="comemorativa">Data Comemorativa</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Enviar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'

const authStore = useAuthStore()
const loading = ref(true)
const notifications = ref([])
const filtersVisible = ref(false)
const courses = ref([])
const notificationData = ref({ course_id: '', titulo: '', mensagem: '', tipo: 'evento' })

const tableColumns = [
  { key: 'tipo', label: 'Tipo', sortable: true },
  { key: 'titulo', label: 'Título', sortable: true },
  { key: 'mensagem', label: 'Mensagem', sortable: true },
  {
    key: 'data',
    label: 'Data',
    sortable: true,
    value: notification => formatDate(notification.created_at),
    sortValue: notification => new Date(notification.created_at).getTime()
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    value: notification => (notification.lida ? 'Lida' : 'Não lida'),
    sortValue: notification => (notification.lida ? 1 : 0)
  }
]

function getNotificationRowClass(notification) {
  return { unread: !notification.lida }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function getTypeClass(tipo) {
  const classes = {
    pagamento: 'badge-warning',
    evento: 'badge-info',
    material: 'badge-success',
    aula_extra: 'badge-error',
    comemorativa: 'badge-success'
  }
  return classes[tipo] || ''
}

async function fetchNotifications() {
  try {
    const response = await api.get('/notificacoes')
    notifications.value = response.data
  } catch (error) {
    console.error('Failed to fetch notifications')
  } finally {
    loading.value = false
  }
}

async function fetchCourses() {
  const response = await api.get('/cursos')
  courses.value = response.data
}

async function markAsRead(id) {
  await api.put(`/notificacoes/${id}/lida`)
  fetchNotifications()
}

async function sendNotification() {
  try {
    if (notificationData.value.course_id) {
      await api.post(`/notificacoes/enviar/curso/${notificationData.value.course_id}`, {
        titulo: notificationData.value.titulo,
        mensagem: notificationData.value.mensagem,
        tipo: notificationData.value.tipo
      })
    } else {
      await api.post('/notificacoes/enviar', {
        user_id: authStore.user.id,
        ...notificationData.value
      })
    }
    notificationData.value = { course_id: '', titulo: '', mensagem: '', tipo: 'evento' }
    fetchNotifications()
  } catch (error) {
    console.error('Failed to send notification')
  }
}

onMounted(() => {
  fetchNotifications()
  if (authStore.isProfessor) {
    fetchCourses()
  }
})
</script>

<style scoped>
.notification-list {
  min-height: calc(100vh - var(--navbar-height));
}

.message-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

tr.unread {
  background: rgba(37, 99, 235, 0.05);
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.empty-state {
  margin: 0;
}

.notification-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
}

.notification-compose {
  margin-top: 1.5rem;
}
</style>
