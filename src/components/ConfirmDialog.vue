<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="confirmState.visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog" :class="{ danger: isDanger }">
          <div class="confirm-accent"></div>
          <div class="confirm-header">
            <div class="confirm-icon" aria-hidden="true">
              <svg v-if="isDanger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 1.66-.41 3.22-1.14 4.58A9 9 0 1112 3a8.96 8.96 0 016.36 2.64" />
              </svg>
            </div>
            <div class="confirm-copy">
              <span class="confirm-kicker">{{ isDanger ? 'Atenção' : 'Confirmação' }}</span>
              <h3>{{ confirmState.title }}</h3>
            </div>
          </div>
          <div class="confirm-body">
            <p>{{ confirmState.message }}</p>
          </div>
          <div class="confirm-footer">
            <button @click="handleCancel" class="btn btn-secondary">
              {{ confirmState.cancelText }}
            </button>
            <button @click="handleConfirm" :class="['btn', confirmState.confirmClass]">
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useConfirm } from '../stores/confirm'

const { state: confirmState, handleConfirm, handleCancel } = useConfirm()
const isDanger = computed(() => confirmState.confirmClass === 'btn-danger')
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 1rem;
}

.confirm-dialog {
  position: relative;
  background: var(--surface);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(var(--primary-rgb), 0.12);
  box-shadow: var(--shadow-xl);
  max-width: 460px;
  width: 100%;
  overflow: hidden;
}

.confirm-accent {
  height: 4px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
}

.confirm-dialog.danger {
  border-color: rgba(var(--error-rgb), 0.18);
}

.confirm-dialog.danger .confirm-accent {
  background: linear-gradient(135deg, var(--error) 0%, #f97316 100%);
}

.confirm-header {
  padding: 1.4rem 1.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.14), rgba(var(--secondary-rgb), 0.08));
  color: var(--primary);
  flex-shrink: 0;
}

.confirm-dialog.danger .confirm-icon {
  background: linear-gradient(135deg, rgba(var(--error-rgb), 0.16), rgba(var(--error-rgb), 0.08));
  color: var(--error);
}

.confirm-icon svg {
  width: 22px;
  height: 22px;
}

.confirm-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.confirm-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.confirm-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
}

.confirm-body {
  padding: 0 1.5rem 1.4rem;
}

.confirm-body p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.confirm-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid rgba(226, 232, 240, 0.7);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
  transform: translateY(8px) scale(0.96);
}
</style>
