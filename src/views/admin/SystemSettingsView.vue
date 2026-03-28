<template>
  <div class="system-settings page-shell">
    <section class="page-hero reveal-up">
      <div>
        <h1>Administração do Sistema</h1>
        <p>Centralize identidade, descrição institucional e paleta principal sem mexer na estrutura visual existente.</p>
      </div>
      <div class="hero-actions">
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="restoreDefaults">
          Restaurar padrão
        </button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveSettings">
          {{ saving ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </div>
    </section>

    <div class="settings-grid">
      <section class="card reveal-up stagger-2">
        <div class="card-header">
          <div>
            <h3 class="card-title">Identidade</h3>
            <p class="card-subtitle">Nome e descrição usados nos pontos principais da interface.</p>
          </div>
        </div>

        <div class="form-stack">
          <label class="form-group">
            <span>Nome do sistema</span>
            <input v-model.trim="form.system_name" type="text" maxlength="80" placeholder="Ex: Course Admin" />
          </label>

          <label class="form-group">
            <span>Descrição do sistema</span>
            <textarea
              v-model.trim="form.system_tagline"
              rows="3"
              maxlength="140"
              placeholder="Ex: Gestão acadêmica"
            ></textarea>
          </label>
        </div>
      </section>

      <section class="card reveal-up stagger-3">
        <div class="card-header">
          <div>
            <h3 class="card-title">Visualização</h3>
            <p class="card-subtitle">Prévia do branding aplicado no shell do sistema.</p>
          </div>
        </div>

        <div class="preview-panel" :style="previewThemeStyle">
          <div class="preview-sidebar">
            <div class="preview-brand">
              <div class="preview-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <strong>{{ previewSettings.system_name }}</strong>
                <span>{{ previewSettings.system_tagline }}</span>
              </div>
            </div>

            <div class="preview-nav">
              <div class="preview-nav-item active">Dashboard</div>
              <div class="preview-nav-item">Cursos</div>
              <div class="preview-nav-item">Pagamentos</div>
            </div>
          </div>

          <div class="preview-surface">
            <div class="preview-badges">
              <span class="preview-badge primary">Primary</span>
              <span class="preview-badge success">Success</span>
              <span class="preview-badge warning">Alert</span>
              <span class="preview-badge danger">Danger</span>
              <span class="preview-badge info">Info</span>
            </div>
            <div class="preview-actions">
              <button type="button" class="btn btn-primary btn-sm">Ação principal</button>
              <button type="button" class="btn btn-secondary btn-sm">Ação secundária</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="card reveal-up stagger-4">
      <div class="card-header">
        <div>
          <h3 class="card-title">Paleta do sistema</h3>
          <p class="card-subtitle">As cores abaixo atualizam as variáveis globais sem alterar o layout já definido.</p>
        </div>
      </div>

      <div class="color-grid">
        <label v-for="field in colorFields" :key="field.key" class="color-field">
          <span class="color-label">{{ field.label }}</span>
          <div class="color-controls">
            <input v-model="form[field.key]" type="color" class="color-picker" />
            <input
              :value="form[field.key]"
              type="text"
              class="color-input monospace"
              maxlength="7"
              @input="updateColor(field.key, $event.target.value)"
            />
          </div>
        </label>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from '../../stores/toast'
import { useSystemStore } from '../../stores/system'

const systemStore = useSystemStore()
const { success, error } = useToast()
const saving = ref(false)

const colorFields = [
  { key: 'primary_color', label: 'Primary' },
  { key: 'secondary_color', label: 'Secondary' },
  { key: 'success_color', label: 'Success' },
  { key: 'warning_color', label: 'Alert' },
  { key: 'error_color', label: 'Danger' },
  { key: 'info_color', label: 'Info' }
]

const form = reactive({
  system_name: '',
  system_tagline: '',
  primary_color: '#2563EB',
  secondary_color: '#3B82F6',
  success_color: '#10B981',
  warning_color: '#F59E0B',
  error_color: '#EF4444',
  info_color: '#06B6D4'
})

const previewSettings = computed(() => ({
  ...form
}))

const previewThemeStyle = computed(() => buildPreviewTheme(previewSettings.value))

function fillForm(values) {
  form.system_name = values.system_name
  form.system_tagline = values.system_tagline
  form.primary_color = values.primary_color
  form.secondary_color = values.secondary_color
  form.success_color = values.success_color
  form.warning_color = values.warning_color
  form.error_color = values.error_color
  form.info_color = values.info_color
}

function updateColor(key, value) {
  const normalized = String(value || '').trim().toUpperCase()
  form[key] = /^#[0-9A-F]{0,6}$/.test(normalized) ? normalized : form[key]
}

function restoreDefaults() {
  fillForm(systemStore.defaultSettings)
  systemStore.setSettings(form)
}

async function saveSettings() {
  if (!form.system_name.trim()) {
    error('Informe o nome do sistema')
    return
  }

  if (!form.system_tagline.trim()) {
    error('Informe a descrição do sistema')
    return
  }

  const normalizedPayload = {
    ...form,
    primary_color: normalizeHexColor(form.primary_color),
    secondary_color: normalizeHexColor(form.secondary_color),
    success_color: normalizeHexColor(form.success_color),
    warning_color: normalizeHexColor(form.warning_color),
    error_color: normalizeHexColor(form.error_color),
    info_color: normalizeHexColor(form.info_color)
  }

  const invalidColor = colorFields.find(field => !/^#[0-9A-F]{6}$/.test(normalizedPayload[field.key]))
  if (invalidColor) {
    error(`A cor "${invalidColor.label}" deve estar no formato #RRGGBB`)
    return
  }

  saving.value = true
  try {
    await systemStore.updateSettings(normalizedPayload)
    fillForm(systemStore.settings)
    success('Configurações do sistema atualizadas com sucesso')
  } catch (err) {
    console.error('Failed to update system settings', err)
    error(err.response?.data?.error || 'Erro ao salvar configurações do sistema')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const settings = await systemStore.fetchAdminSettings()
    fillForm(settings)
  } catch (err) {
    console.error('Failed to fetch system settings', err)
    error(err.response?.data?.error || 'Erro ao carregar configurações do sistema')
    fillForm(systemStore.settings)
  }
})

function buildPreviewTheme(theme) {
  return {
    '--primary': theme.primary_color,
    '--primary-rgb': toRgbTriplet(theme.primary_color),
    '--primary-100': alphaHex(theme.primary_color, 0.1),
    '--secondary': theme.secondary_color,
    '--secondary-rgb': toRgbTriplet(theme.secondary_color),
    '--success': theme.success_color,
    '--success-light': alphaHex(theme.success_color, 0.1),
    '--warning': theme.warning_color,
    '--warning-light': alphaHex(theme.warning_color, 0.1),
    '--error': theme.error_color,
    '--error-light': alphaHex(theme.error_color, 0.1),
    '--info': theme.info_color,
    '--info-light': alphaHex(theme.info_color, 0.1)
  }
}

function alphaHex(hex, alpha) {
  const normalized = normalizeHexColor(hex)
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function toRgbTriplet(hex) {
  const normalized = normalizeHexColor(hex)
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function normalizeHexColor(value) {
  const normalized = String(value || '').trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '#2563EB'
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card-subtitle {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group span,
.color-label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.preview-panel {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1fr;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  min-height: 280px;
}

.preview-sidebar {
  padding: 1.25rem;
  background:
    radial-gradient(circle at top, rgba(var(--primary-rgb), 0.24), transparent 26%),
    linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.preview-brand {
  display: flex;
  gap: 0.875rem;
  align-items: center;
}

.preview-brand strong {
  display: block;
  font-size: 1rem;
}

.preview-brand span {
  display: block;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.8125rem;
  margin-top: 0.15rem;
}

.preview-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  box-shadow: 0 16px 30px rgba(var(--primary-rgb), 0.22);
}

.preview-mark svg {
  width: 22px;
  height: 22px;
}

.preview-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-nav-item {
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
}

.preview-nav-item.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
}

.preview-surface {
  padding: 1.5rem;
  background:
    radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.08), transparent 34%),
    radial-gradient(circle at bottom right, rgba(var(--secondary-rgb), 0.08), transparent 24%),
    rgba(255, 255, 255, 0.96);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
}

.preview-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.preview-badge.primary {
  background: var(--primary-100);
  color: var(--primary);
}

.preview-badge.success {
  background: var(--success-light);
  color: var(--success);
}

.preview-badge.warning {
  background: var(--warning-light);
  color: var(--warning);
}

.preview-badge.danger {
  background: var(--error-light);
  color: var(--error);
}

.preview-badge.info {
  background: var(--info-light);
  color: var(--info);
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.72);
}

.color-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 56px;
  min-width: 56px;
  height: 44px;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: white;
}

.color-input {
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .settings-grid,
  .preview-panel {
    grid-template-columns: 1fr;
  }

  .color-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .color-grid {
    grid-template-columns: 1fr;
  }
}
</style>
