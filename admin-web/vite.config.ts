import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const envDir = '..'
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [
      vue(),
      AutoImport({ resolvers: [ElementPlusResolver()] }),
      Components({ resolvers: [ElementPlusResolver()] }),
    ],
    server: {
      host: env.ADMIN_HOST || '127.0.0.1',
      port: Number(env.ADMIN_PORT || 5175),
      strictPort: true,
    },
    preview: {
      host: env.ADMIN_HOST || '127.0.0.1',
      port: Number(env.ADMIN_PORT || 5175),
      strictPort: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue'],
          },
        },
      },
    },
  }
})
