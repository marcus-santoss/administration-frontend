import { reactive } from 'vue'

const state = reactive({
  toasts: []
})

let id = 0

export function useToast() {
  function add(message, type = 'info', duration = 4000) {
    const toast = {
      id: ++id,
      message,
      type,
      visible: true
    }
    state.toasts.push(toast)

    setTimeout(() => {
      remove(toast.id)
    }, duration)

    return toast.id
  }

  function success(message, duration) {
    return add(message, 'success', duration)
  }

  function error(message, duration) {
    return add(message, 'error', duration)
  }

  function warning(message, duration) {
    return add(message, 'warning', duration)
  }

  function info(message, duration) {
    return add(message, 'info', duration)
  }

  function remove(id) {
    const index = state.toasts.findIndex(t => t.id === id)
    if (index > -1) {
      state.toasts.splice(index, 1)
    }
  }

  return {
    toasts: state.toasts,
    add,
    success,
    error,
    warning,
    info,
    remove
  }
}
