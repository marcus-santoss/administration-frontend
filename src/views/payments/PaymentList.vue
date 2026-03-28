<template>
  <div class="payment-list page-shell">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    <section class="page-hero reveal-up">
      <div>
        <h1>Pagamentos</h1>
        <p>Acompanhe mensalidades e cobranças com o mesmo padrão visual adotado na agenda de aulas.</p>
      </div>
      <div class="hero-actions">
        <button @click="filtersVisible = !filtersVisible" class="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {{ filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros' }}
        </button>
        <button @click="exportPayments('csv')" class="btn btn-secondary hero-action" :disabled="filteredPayments.length === 0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Exportar CSV
        </button>
        <button @click="exportPayments('excel')" class="btn btn-secondary hero-action" :disabled="filteredPayments.length === 0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 10l6 8" />
            <path d="M15 10l-6 8" />
          </svg>
          Exportar Excel
        </button>
        <button v-if="authStore.isAdmin || authStore.isCoordinator" @click="generatePayments" class="btn btn-primary hero-action">
          Gerar Mensalidades
        </button>
      </div>
    </section>

    <div class="card filters-card reveal-up stagger-2" :class="{ hidden: !filtersVisible }">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Buscar por aluno..." 
        class="search-input"
      />
      <select v-model="filterStatus">
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="pago">Pago</option>
        <option value="atrasado">Atrasado</option>
      </select>
      <select v-model="filterCourse">
        <option value="">Todos os cursos</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.nome }}</option>
      </select>
      <input 
        v-model="filterDate" 
        type="date" 
        placeholder="Data de vencimento"
      />
    </div>

    <div class="card reveal-up stagger-2">
      <DataTable
        :columns="tableColumns"
        :rows="filteredPayments"
        :filters-visible="filtersVisible"
        empty-message="Nenhum pagamento encontrado"
        empty-filtered-message="Nenhum pagamento encontrado para a busca."
        search-placeholder="Buscar pagamentos..."
        default-sort-key="vencimento"
        default-sort-order="desc"
      >
        <template #cell-valor="{ row }">
          <span>R$ {{ row.valor.toFixed(2) }}</span>
        </template>

        <template #cell-vencimento="{ row }">
          <span>{{ formatDate(row.data_vencimento) }}</span>
        </template>

        <template #cell-status="{ row }">
          <span :class="['badge', getStatusClass(row.status)]">
            {{ getStatusLabel(row.status) }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <TableActionButton v-if="row.status === 'pendente'" icon="pay" @click="openPaymentConfirmModal(row)" />
        </template>
      </DataTable>
    </div>

    <div v-if="paymentToConfirm" class="modal-overlay" @click.self="closePaymentConfirmModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirmar pagamento</h3>
          <button class="modal-close" @click="closePaymentConfirmModal" aria-label="Fechar modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-body payment-confirm-body">
          <p class="payment-confirm-intro">
            Confirme o pagamento da mensalidade de <strong>{{ getStudentName(paymentToConfirm) }}</strong>.
          </p>

          <div class="payment-confirm-details">
            <div class="payment-detail-item">
              <span class="payment-detail-label">Curso</span>
              <strong>{{ getCourseName(paymentToConfirm) }}</strong>
            </div>
            <div class="payment-detail-item">
              <span class="payment-detail-label">Valor</span>
              <strong>{{ formatCurrency(paymentToConfirm.valor) }}</strong>
            </div>
            <div class="payment-detail-item">
              <span class="payment-detail-label">Vencimento</span>
              <strong>{{ formatDate(paymentToConfirm.data_vencimento) }}</strong>
            </div>
            <div class="payment-detail-item">
              <span class="payment-detail-label">Referência</span>
              <strong>{{ paymentToConfirm.mes_referencia }}</strong>
            </div>
          </div>

          <p class="payment-confirm-note">
            Ao confirmar, a mensalidade será marcada como paga e o sistema registrará automaticamente a data e o usuário responsável pela confirmação.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" :disabled="confirmingPayment" @click="closePaymentConfirmModal">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" :disabled="confirmingPayment" @click="confirmPayment">
            {{ confirmingPayment ? 'Confirmando...' : 'Confirmar pagamento' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../stores/toast'
import api from '../../services/api'
import DataTable from '../../components/DataTable.vue'
import TableActionButton from '../../components/TableActionButton.vue'

const authStore = useAuthStore()
const { success, error } = useToast()
const loading = ref(true)
const payments = ref([])
const courses = ref([])
const filterStatus = ref('')
const filterCourse = ref('')
const filterDate = ref('')
const searchQuery = ref('')
const filtersVisible = ref(false)
const paymentToConfirm = ref(null)
const confirmingPayment = ref(false)

const tableColumns = [
  {
    key: 'aluno',
    label: 'Aluno',
    sortable: true,
    value: payment => getStudentName(payment)
  },
  {
    key: 'curso',
    label: 'Curso',
    sortable: true,
    value: payment => getCourseName(payment)
  },
  {
    key: 'valor',
    label: 'Valor',
    sortable: true,
    value: payment => payment.valor,
    sortValue: payment => payment.valor
  },
  {
    key: 'vencimento',
    label: 'Vencimento',
    sortable: true,
    value: payment => formatDate(payment.data_vencimento),
    sortValue: payment => new Date(payment.data_vencimento).getTime()
  },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'acoes', label: 'Ações', sortable: false, searchable: false }
]

const filteredPayments = computed(() => {
  let result = payments.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      getStudentName(p).toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  if (filterCourse.value) {
    result = result.filter(p => p.enrollment?.schedule?.course_id === parseInt(filterCourse.value))
  }

  if (filterDate.value) {
    result = result.filter(p => p.data_vencimento.startsWith(filterDate.value))
  }

  return result
})

function getStudentName(payment) {
  return payment.enrollment?.student?.nome || '-'
}

function getCourseName(payment) {
  return payment.enrollment?.schedule?.course?.nome || '-'
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function getStatusClass(status) {
  const classes = {
    pendente: 'badge-warning',
    pago: 'badge-success',
    atrasado: 'badge-error'
  }
  return classes[status] || ''
}

function getStatusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado'
  }
  return labels[status] || status
}

function openPaymentConfirmModal(payment) {
  paymentToConfirm.value = payment
}

function closePaymentConfirmModal() {
  if (confirmingPayment.value) return
  paymentToConfirm.value = null
}

async function fetchPayments() {
  try {
    const [paymentsRes, coursesRes] = await Promise.all([
      api.get('/pagamentos'),
      api.get('/cursos')
    ])
    payments.value = paymentsRes.data
    courses.value = coursesRes.data
  } catch (err) {
    console.error('Failed to fetch payments', err)
    error('Erro ao carregar pagamentos')
  } finally {
    loading.value = false
  }
}

async function generatePayments() {
  const now = new Date()
  try {
    await api.post('/pagamentos/gerar-mensalidades', {
      ano: now.getFullYear(),
      mes: now.getMonth() + 1
    })
    success('Mensalidades geradas com sucesso')
    fetchPayments()
  } catch (err) {
    console.error('Failed to generate payments', err)
    error(err.response?.data?.error || 'Erro ao gerar mensalidades')
  }
}

async function confirmPayment() {
  if (!paymentToConfirm.value) return

  confirmingPayment.value = true
  try {
    await api.put(`/pagamentos/${paymentToConfirm.value.id}`, {
      status: 'pago'
    })
    success(`Pagamento confirmado para ${getStudentName(paymentToConfirm.value)}`)
    paymentToConfirm.value = null
    await fetchPayments()
  } catch (err) {
    console.error('Failed to confirm payment', err)
    error(err.response?.data?.error || 'Erro ao confirmar pagamento')
  } finally {
    confirmingPayment.value = false
  }
}

function getExportRows() {
  return filteredPayments.value.map(payment => ({
    aluno: getStudentName(payment),
    curso: getCourseName(payment),
    valor: formatCurrency(payment.valor),
    vencimento: formatDate(payment.data_vencimento),
    status: getStatusLabel(payment.status),
    pagamento: payment.data_pagamento ? formatDate(payment.data_pagamento) : '-',
    confirmadoPor: payment.confirmed_by?.name || '-'
  }))
}

function exportPayments(format) {
  const rows = getExportRows()
  if (rows.length === 0) {
    error('Não há pagamentos para exportar com os filtros atuais')
    return
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')

  if (format === 'csv') {
    const headers = ['Aluno', 'Curso', 'Valor', 'Vencimento', 'Status', 'Data de Pagamento', 'Confirmado Por']
    const csvRows = [
      headers.join(';'),
      ...rows.map(row => [
        escapeCsvValue(row.aluno),
        escapeCsvValue(row.curso),
        escapeCsvValue(row.valor),
        escapeCsvValue(row.vencimento),
        escapeCsvValue(row.status),
        escapeCsvValue(row.pagamento),
        escapeCsvValue(row.confirmadoPor)
      ].join(';'))
    ]

    downloadFile(
      `\uFEFF${csvRows.join('\n')}`,
      `pagamentos-${timestamp}.csv`,
      'text/csv;charset=utf-8;'
    )
    return
  }

  const spreadsheet = buildSpreadsheetContent(rows)
  downloadFile(
    spreadsheet,
    `pagamentos-${timestamp}.xls`,
    'application/vnd.ms-excel;charset=utf-8;'
  )
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')
  return `"${stringValue.replace(/"/g, '""')}"`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildSpreadsheetContent(rows) {
  const headerCells = ['Aluno', 'Curso', 'Valor', 'Vencimento', 'Status', 'Data de Pagamento', 'Confirmado Por']
    .map(label => `<th>${escapeHtml(label)}</th>`)
    .join('')

  const bodyRows = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.aluno)}</td>
      <td>${escapeHtml(row.curso)}</td>
      <td>${escapeHtml(row.valor)}</td>
      <td>${escapeHtml(row.vencimento)}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>${escapeHtml(row.pagamento)}</td>
      <td>${escapeHtml(row.confirmadoPor)}</td>
    </tr>
  `).join('')

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table>
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `.trim()
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchPayments()
})
</script>

<style scoped>
.payment-list {
  min-height: calc(100vh - var(--navbar-height));
}

.hero-action {
  flex-shrink: 0;
}

.filters-card {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  transition: opacity 0.2s ease, max-height 0.2s ease;
  overflow: hidden;
}

.filters-card.hidden {
  max-height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}

.filters-card input,
.filters-card select {
  flex: 1 1 200px;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  min-width: 150px;
}

.search-input {
  flex: 2 1 300px !important;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  margin: 0;
}

.payment-confirm-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-confirm-intro,
.payment-confirm-note {
  color: var(--text-secondary);
}

.payment-confirm-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.payment-detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-alt);
}

.payment-detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .filters-card,
  .hero-action {
    width: 100%;
    max-width: none;
  }
}
</style>
