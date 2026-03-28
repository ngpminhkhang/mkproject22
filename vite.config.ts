import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cầu nối tàng hình chuyển API từ React sang Django
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Chĩa thẳng vào server Django
        changeOrigin: true,
      }
    }
  }
})