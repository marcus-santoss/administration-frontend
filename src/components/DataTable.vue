<template>
  <div class="data-table-shell">
    <div class="data-table-toolbar" :class="{ hidden: !filtersVisible }">
      <label class="data-table-page-size">
        <span>Registros por página</span>
        <select v-model.number="pageSize">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>

      <label class="data-table-search">
        <span>Buscar</span>
        <input v-model.trim="searchQuery" type="search" :placeholder="searchPlaceholder" />
      </label>
    </div>

    <div v-if="paginatedRows.length > 0" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th v-for="column in normalizedColumns" :key="column.key" :class="column.headerClass">
              <button v-if="column.sortable" type="button" class="sort-button" @click="toggleSort(column.key)">
                <span>{{ column.label }}</span>
                <span class="sort-indicator" :class="{ active: sortKey === column.key }">
                  {{ getSortIcon(column.key) }}
                </span>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedRows" :key="getRowKey(row)" :class="getRowClass(row)">
            <td v-for="column in normalizedColumns" :key="column.key" :class="column.cellClass">
              <slot :name="`cell-${column.key}`" :row="row" :value="getCellValue(row, column)">
                {{ formatCellValue(getCellValue(row, column)) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state data-table-empty">
      <slot name="empty" :filtered-count="filteredRows.length" :total-count="safeRows.length"
        :search-query="searchQuery">
        <p>{{ filteredRows.length === 0 && safeRows.length > 0 ? emptyFilteredMessage : emptyMessage }}</p>
      </slot>
    </div>

    <div v-if="filteredRows.length > 0" class="data-table-footer">
      <p class="data-table-summary">
        Exibindo {{ startRow }}-{{ endRow }} de {{ filteredRows.length }} registros
      </p>

      <div class="data-table-pagination">
        <button type="button" class="btn btn-secondary btn-sm" :disabled="currentPage === 1" @click="currentPage--">
          Anterior
        </button>
        <button v-for="page in visiblePages" :key="page" type="button" class="page-button"
          :class="{ active: currentPage === page }" @click="currentPage = page">
          {{ page }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="currentPage === totalPages"
          @click="currentPage++">
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  rowClass: {
    type: [String, Function, Object],
    default: ''
  },
  searchPlaceholder: {
    type: String,
    default: 'Buscar registros...'
  },
  emptyMessage: {
    type: String,
    default: 'Nenhum registro encontrado.'
  },
  emptyFilteredMessage: {
    type: String,
    default: 'Nenhum resultado encontrado para a busca.'
  },
  defaultSortKey: {
    type: String,
    default: ''
  },
  defaultSortOrder: {
    type: String,
    default: 'asc'
  },
  filtersVisible: {
    type: Boolean,
    default: true
  }
})

const pageSizeOptions = [5, 10, 15]
const pageSize = ref(5)
const currentPage = ref(1)
const searchQuery = ref('')

const normalizedColumns = computed(() =>
  props.columns.map(column => ({
    sortable: false,
    searchable: true,
    ...column
  }))
)

const initialSortColumn = computed(() => {
  if (props.defaultSortKey) return props.defaultSortKey
  return normalizedColumns.value.find(column => column.sortable)?.key || ''
})

const sortKey = ref(initialSortColumn.value)
const sortOrder = ref(props.defaultSortOrder === 'desc' ? 'desc' : 'asc')

const safeRows = computed(() => props.rows || [])

const filteredRows = computed(() => {
  const query = normalizeValue(searchQuery.value)
  if (!query) return safeRows.value

  return safeRows.value.filter(row =>
    normalizedColumns.value.some(column => {
      if (column.searchable === false) return false
      return normalizeValue(getSearchValue(row, column)).includes(query)
    })
  )
})

const sortedRows = computed(() => {
  const rows = [...filteredRows.value]
  if (!sortKey.value) return rows

  const column = normalizedColumns.value.find(item => item.key === sortKey.value)
  if (!column) return rows

  return rows.sort((a, b) => {
    const aValue = normalizeSortableValue(getSortValue(a, column))
    const bValue = normalizeSortableValue(getSortValue(b, column))

    if (aValue === bValue) return 0
    const comparison = aValue > bValue ? 1 : -1
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedRows.value.slice(start, start + pageSize.value)
})

const startRow = computed(() => {
  if (filteredRows.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const endRow = computed(() => Math.min(currentPage.value * pageSize.value, filteredRows.value.length))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

watch([searchQuery, pageSize, safeRows], () => {
  currentPage.value = 1
})

watch(totalPages, value => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

watch(initialSortColumn, value => {
  if (!sortKey.value) {
    sortKey.value = value
  }
})

function toggleSort(columnKey) {
  if (sortKey.value === columnKey) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = columnKey
  sortOrder.value = 'asc'
}

function getSortIcon(columnKey) {
  if (sortKey.value !== columnKey) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

function getRowKey(row) {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return getValueByPath(row, props.rowKey) ?? JSON.stringify(row)
}

function getRowClass(row) {
  if (typeof props.rowClass === 'function') return props.rowClass(row)
  return props.rowClass
}

function getCellValue(row, column) {
  if (typeof column.value === 'function') return column.value(row)
  return getValueByPath(row, column.key)
}

function getSearchValue(row, column) {
  if (typeof column.searchValue === 'function') return column.searchValue(row)
  return getCellValue(row, column)
}

function getSortValue(row, column) {
  if (typeof column.sortValue === 'function') return column.sortValue(row)
  return getCellValue(row, column)
}

function getValueByPath(source, path) {
  if (!path || !source) return ''
  if (!path.includes('.')) return source[path]

  return path.split('.').reduce((accumulator, segment) => accumulator?.[segment], source)
}

function normalizeValue(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeSortableValue(value) {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const numericValue = Number(value)
  if (!Number.isNaN(numericValue) && value !== null && value !== '') return numericValue
  return normalizeValue(value)
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  return value
}
</script>

<style scoped>
.data-table-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-table-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  transition: opacity 0.2s ease, max-height 0.2s ease;
  overflow: hidden;
}

.data-table-toolbar.hidden {
  max-height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}

.data-table-page-size,
.data-table-search {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.data-table-page-size span,
.data-table-search span {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.data-table-page-size select {
  width: 92px;
}

.data-table-search {
  min-width: min(320px, 100%);
  flex: 1;
}

.data-table-search input {
  width: 100%;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.sort-indicator {
  color: var(--text-muted);
  min-width: 1ch;
}

.sort-indicator.active {
  color: var(--primary);
}

.data-table-empty {
  margin: 0;
}

.data-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.data-table-summary {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.data-table-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.page-button {
  min-width: 36px;
  min-height: 36px;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.82);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 600;
}

.page-button.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

@media (max-width: 768px) {

  .data-table-toolbar,
  .data-table-footer {
    align-items: stretch;
  }

  .data-table-page-size,
  .data-table-search {
    width: 100%;
  }

  .data-table-page-size select {
    width: 100%;
  }
}
</style>
