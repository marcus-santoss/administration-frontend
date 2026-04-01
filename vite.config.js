import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const frontendHost = env.VITE_HOST
  const frontendPort = Number(env.VITE_PORT)
  const apiHost = env.VITE_API_HOST
  const apiPort = Number(env.VITE_API_PORT)

  return {
    plugins: [vue()],
    server: {
      host: frontendHost,
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://${apiHost}:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
