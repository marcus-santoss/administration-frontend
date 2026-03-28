<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <div class="toast-accent"></div>
          <div class="toast-icon">
            <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="remove(toast.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../stores/toast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.95rem 1rem 0.95rem 0.95rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
}

.toast-success {
  background: linear-gradient(135deg, rgba(var(--success-rgb), 0.12), rgba(255, 255, 255, 0.98));
  border-color: rgba(var(--success-rgb), 0.16);
  --toast-accent-color: var(--success);
}

.toast-success .toast-icon {
  color: var(--success);
}

.toast-error {
  background: linear-gradient(135deg, rgba(var(--error-rgb), 0.12), rgba(255, 255, 255, 0.98));
  border-color: rgba(var(--error-rgb), 0.16);
  --toast-accent-color: var(--error);
}

.toast-error .toast-icon {
  color: var(--error);
}

.toast-warning {
  background: linear-gradient(135deg, rgba(var(--warning-rgb), 0.14), rgba(255, 255, 255, 0.98));
  border-color: rgba(var(--warning-rgb), 0.18);
  --toast-accent-color: var(--warning);
}

.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info {
  background: linear-gradient(135deg, rgba(var(--info-rgb), 0.12), rgba(255, 255, 255, 0.98));
  border-color: rgba(var(--info-rgb), 0.16);
  --toast-accent-color: var(--info);
}

.toast-info .toast-icon {
  color: var(--info);
}

.toast-accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--toast-accent-color);
}

.toast-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-message {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text);
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--text);
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
