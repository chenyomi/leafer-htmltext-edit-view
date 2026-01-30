import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: [
      '@leafer-ui/core',
      '@leafer-in/editor', 
      '@leafer-in/html',
      'leafer-ui'
    ]
  },
  server: {
    port: 80,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true
  },
})
