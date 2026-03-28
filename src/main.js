import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useSystemStore } from './stores/system'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const systemStore = useSystemStore(pinia)

systemStore.initialize().finally(() => {
  app.use(router)
  app.mount('#app')
})
