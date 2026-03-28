import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: 'Confirmação',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmClass: 'btn-primary',
  resolve: null
})

export function useConfirm() {
  function show(options = {}) {
    state.title = options.title || 'Confirmação'
    state.message = options.message || 'Tem certeza?'
    state.confirmText = options.confirmText || 'Confirmar'
    state.cancelText = options.cancelText || 'Cancelar'
    state.confirmClass = options.danger ? 'btn-danger' : 'btn-primary'
    state.visible = true

    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  function handleConfirm() {
    state.visible = false
    if (state.resolve) state.resolve(true)
  }

  function handleCancel() {
    state.visible = false
    if (state.resolve) state.resolve(false)
  }

  return {
    state,
    show,
    handleConfirm,
    handleCancel
  }
}
