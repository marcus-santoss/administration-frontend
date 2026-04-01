import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const frontendHost = env.VITE_HOST || 'localhost'
  const frontendPort = Number(env.VITE_PORT || 5173)
  const apiHost = env.VITE_API_HOST || 'localhost'
  const apiPort = Number(env.VITE_API_PORT || 3786)

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
