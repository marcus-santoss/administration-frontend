import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'

const defaultSettings = Object.freeze({
  system_name: 'Course Admin',
  system_tagline: 'Gestão acadêmica',
  primary_color: '#2563EB',
  secondary_color: '#3B82F6',
  success_color: '#10B981',
  warning_color: '#F59E0B',
  error_color: '#EF4444',
  info_color: '#06B6D4'
})

export const useSystemStore = defineStore('system', () => {
  const settings = ref({ ...defaultSettings })
  const initialized = ref(false)

  const systemName = computed(() => settings.value.system_name)
  const systemTagline = computed(() => settings.value.system_tagline)

  async function initialize() {
    if (initialized.value) {
      applySettings()
      return
    }

    try {
      const response = await api.get('/configuracoes/publicas')
      setSettings(response.data)
    } catch (err) {
      console.error('Failed to fetch public system settings', err)
      setSettings(defaultSettings)
    } finally {
      initialized.value = true
    }
  }

  async function fetchAdminSettings() {
    const response = await api.get('/configuracoes/sistema')
    setSettings(response.data)
    return settings.value
  }

  async function updateSettings(payload) {
    const response = await api.put('/configuracoes/sistema', payload)
    setSettings(response.data)
    return settings.value
  }

  function setSettings(nextSettings = {}) {
    settings.value = normalizeSettings(nextSettings)
    applySettings()
  }

  function resetToDefaults() {
    setSettings(defaultSettings)
  }

  function applySettings() {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const theme = settings.value

    const variables = {
      '--primary': theme.primary_color,
      '--primary-light': mixHex(theme.primary_color, '#FFFFFF', 0.14),
      '--primary-dark': mixHex(theme.primary_color, '#0F172A', 0.18),
      '--primary-50': alphaHex(theme.primary_color, 0.05),
      '--primary-100': alphaHex(theme.primary_color, 0.1),
      '--primary-200': alphaHex(theme.primary_color, 0.2),
      '--primary-rgb': toRgbTriplet(theme.primary_color),
      '--secondary': theme.secondary_color,
      '--secondary-rgb': toRgbTriplet(theme.secondary_color),
      '--success': theme.success_color,
      '--success-light': alphaHex(theme.success_color, 0.1),
      '--success-rgb': toRgbTriplet(theme.success_color),
      '--warning': theme.warning_color,
      '--warning-light': alphaHex(theme.warning_color, 0.1),
      '--warning-rgb': toRgbTriplet(theme.warning_color),
      '--error': theme.error_color,
      '--error-light': alphaHex(theme.error_color, 0.1),
      '--error-rgb': toRgbTriplet(theme.error_color),
      '--info': theme.info_color,
      '--info-light': alphaHex(theme.info_color, 0.1),
      '--info-rgb': toRgbTriplet(theme.info_color),
      '--ring': `0 0 0 3px ${alphaHex(theme.primary_color, 0.16)}`,
      '--primary-shadow-sm': alphaHex(theme.primary_color, 0.2),
      '--primary-shadow-md': alphaHex(theme.primary_color, 0.24),
      '--success-shadow': alphaHex(theme.success_color, 0.25),
      '--error-shadow': alphaHex(theme.error_color, 0.25)
    }

    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value)
    })

    document.title = `${theme.system_name} - Sistema de Administração de Cursos`
  }

  return {
    settings,
    initialized,
    systemName,
    systemTagline,
    initialize,
    fetchAdminSettings,
    updateSettings,
    setSettings,
    resetToDefaults,
    defaultSettings
  }
})

function normalizeSettings(nextSettings = {}) {
  return {
    system_name: String(nextSettings.system_name || defaultSettings.system_name).trim() || defaultSettings.system_name,
    system_tagline: String(nextSettings.system_tagline || defaultSettings.system_tagline).trim() || defaultSettings.system_tagline,
    primary_color: normalizeHex(nextSettings.primary_color, defaultSettings.primary_color),
    secondary_color: normalizeHex(nextSettings.secondary_color, defaultSettings.secondary_color),
    success_color: normalizeHex(nextSettings.success_color, defaultSettings.success_color),
    warning_color: normalizeHex(nextSettings.warning_color, defaultSettings.warning_color),
    error_color: normalizeHex(nextSettings.error_color, defaultSettings.error_color),
    info_color: normalizeHex(nextSettings.info_color, defaultSettings.info_color)
  }
}

function normalizeHex(value, fallback) {
  const normalized = String(value || '').trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback
}

function toRgbTriplet(hex) {
  const { r, g, b } = hexToRgb(hex)
  return `${r}, ${g}, ${b}`
}

function alphaHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixHex(hex, targetHex, amount) {
  const source = hexToRgb(hex)
  const target = hexToRgb(targetHex)

  return rgbToHex({
    r: Math.round(source.r + (target.r - source.r) * amount),
    g: Math.round(source.g + (target.g - source.g) * amount),
    b: Math.round(source.b + (target.b - source.b) * amount)
  })
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex, '#000000').slice(1)
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
