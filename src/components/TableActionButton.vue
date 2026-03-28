<template>
  <component
    :is="componentTag"
    v-bind="componentProps"
    :class="buttonClasses"
    :aria-label="resolvedAriaLabel"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">
      <template v-if="icon === 'view'">
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </template>
      <template v-else-if="icon === 'edit'">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
      </template>
      <template v-else-if="icon === 'delete'">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </template>
      <template v-else-if="icon === 'schedule'">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
      </template>
      <template v-else-if="icon === 'pay'">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 12.5l1.75 1.75L15.5 10" />
      </template>
      <template v-else-if="icon === 'read'">
        <path d="M20 6L9 17l-5-5" />
      </template>
    </svg>
    <span>{{ resolvedLabel }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  icon: {
    type: String,
    default: 'view'
  },
  label: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    default: ''
  },
  to: {
    type: [String, Object],
    default: null
  },
  type: {
    type: String,
    default: 'button'
  }
})

const iconConfig = {
  view: { label: 'Visualizar', tone: 'secondary', strokeWidth: 1.8 },
  edit: { label: 'Editar', tone: 'secondary', strokeWidth: 1.8 },
  delete: { label: 'Excluir', tone: 'danger', strokeWidth: 1.8 },
  schedule: { label: 'Grade', tone: 'secondary', strokeWidth: 1.8 },
  pay: { label: 'Pagar', tone: 'success', strokeWidth: 1.9 },
  read: { label: 'Marcar como lida', tone: 'secondary', strokeWidth: 2 }
}

const currentIcon = computed(() => iconConfig[props.icon] || iconConfig.view)
const resolvedLabel = computed(() => props.label || currentIcon.value.label)
const resolvedAriaLabel = computed(() => props.ariaLabel || resolvedLabel.value)
const strokeWidth = computed(() => currentIcon.value.strokeWidth)
const toneClass = computed(() => props.tone || currentIcon.value.tone)
const buttonClasses = computed(() => ['btn', 'btn-sm', `btn-${toneClass.value}`, 'table-action-btn'])
const componentTag = computed(() => (props.to ? RouterLink : 'button'))
const componentProps = computed(() => (props.to ? { to: props.to } : { type: props.type }))
</script>

<style scoped>
.table-action-btn {
  gap: 0.4rem;
  white-space: nowrap;
}

.table-action-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
