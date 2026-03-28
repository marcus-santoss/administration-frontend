<template>
  <div class="user-list page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Usuários</h1>
        <p>Gerencie acessos e perfis em uma estrutura visual consistente com a página de Agendamentos.</p>
      </div>
      <div class="hero-actions">
        <button @click="filtersVisible = !filtersVisible" class="btn btn-secondary hero-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        <button @click="showModal = true" class="btn btn-primary hero-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Cadastrar
        </button>
      </div>
    </section>

    <div class="card reveal-up stagger-2">
      <DataTable
        :columns="tableColumns"
        :rows="users"
        :filters-visible="filtersVisible"
        empty-message="Nenhum usuário cadastrado"
        empty-filtered-message="Nenhum usuário encontrado para a busca."
        search-placeholder="Buscar usuários..."
        default-sort-key="name"
      >
        <template #cell-role="{ row }">
          <span :class="['badge', getRoleClass(row.role)]">
            {{ getRoleName(row.role) }}
          </span>
        </template>

        <template #cell-primeiro_acesso="{ row }">
          <span :class="['badge', row.primeiro_acesso ? 'badge-warning' : 'badge-success']">
            {{ row.primeiro_acesso ? 'Pendente' : 'Ativo' }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="table-actions">
            <TableActionButton icon="edit" @click="editUser(row)" />
            <TableActionButton icon="delete" @click="deleteUser(row.id)" />
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
          <button @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveUser" class="modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="userForm.name" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="userForm.email" type="email" required :disabled="editing" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="userForm.role" required>
              <option value="student">Aluno</option>
              <option value="professor">Professor</option>
              <option value="coordinator">Coordenador</option>
              <option value="responsible">Responsável</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Telefone</label>
            <input v-model="userForm.phone" type="tel" />
          </div>
          <div class="form-group">
            <label>CPF</label>
            <input v-model="userForm.cpf" />
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Salvar' : 'Criar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'
import { useToast } from '../../stores/toast'
import { useConfirm } from '../../stores/confirm'

const { success, error } = useToast()
const { show: confirm } = useConfirm()
const loading = ref(true)

const users = ref([])
const showModal = ref(false)
const editing = ref(false)
const filtersVisible = ref(false)
const userForm = ref({
  id: null,
  name: '',
  email: '',
  role: 'student',
  phone: '',
  cpf: ''
})

const tableColumns = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    value: user => getRoleName(user.role),
    sortValue: user => getRoleName(user.role)
  },
  { key: 'phone', label: 'Telefone', sortable: true, value: user => user.phone || '-' },
  {
    key: 'primeiro_acesso',
    label: 'Primeiro Acesso',
    sortable: true,
    value: user => (user.primeiro_acesso ? 'Pendente' : 'Ativo'),
    sortValue: user => (user.primeiro_acesso ? 1 : 0)
  },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

function getRoleName(role) {
  const names = {
    admin: 'Admin',
    coordinator: 'Coordenador',
    professor: 'Professor',
    student: 'Aluno',
    responsible: 'Responsável'
  }
  return names[role] || role
}

function getRoleClass(role) {
  const classes = {
    admin: 'badge-error',
    coordinator: 'badge-error',
    professor: 'badge-info',
    student: 'badge-success',
    responsible: 'badge-warning'
  }
  return classes[role] || ''
}

async function fetchUsers() {
  try {
    const response = await api.get('/auth/users')
    users.value = response.data
  } catch (error) {
    console.error('Failed to fetch users')
  } finally {
    loading.value = false
  }
}

async function saveUser() {
  try {
    if (editing.value) {
      await api.put(`/auth/users/${userForm.value.id}`, {
        name: userForm.value.name,
        role: userForm.value.role,
        phone: userForm.value.phone,
        cpf: userForm.value.cpf
      })
      success('Usuário atualizado com sucesso')
    } else {
      const { id, ...data } = userForm.value
      await api.post('/auth/register', data)
      success('Usuário criado com sucesso')
    }
    closeModal()
    fetchUsers()
  } catch (err) {
    console.error('Failed to save user', err)
    error(err.response?.data?.error || 'Erro ao salvar usuário')
  }
}

async function deleteUser(id) {
  const confirmed = await confirm({
    title: 'Excluir Usuário',
    message: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    danger: true
  })
  
  if (!confirmed) return
  
  try {
    await api.delete(`/auth/users/${id}`)
    success('Usuário excluído com sucesso')
    fetchUsers()
  } catch (err) {
    console.error('Failed to delete user', err)
    error(err.response?.data?.error || 'Erro ao excluir usuário')
  }
}

function editUser(user) {
  userForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    cpf: user.cpf || ''
  }
  editing.value = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = false
  userForm.value = { id: null, name: '', email: '', role: 'student', phone: '', cpf: '' }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-list {
  min-height: calc(100vh - var(--navbar-height));
}

.hero-action {
  flex-shrink: 0;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.modal-overlay .modal-close {
  background: none;
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .hero-action {
    width: 100%;
  }
}
</style>
