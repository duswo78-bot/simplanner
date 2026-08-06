import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/SimPlanner/', // GitHub 레포지토리 이름
  plugins: [react()],
  server: {
    proxy: {
      '/api/odsay': {
        target: 'https://api.odsay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/odsay/, ''),
        headers: {
          'Origin': 'http://localhost:5173',
          'Referer': 'http://localhost:5173/'
        }
      },
      '/api/vworld': {
        target: 'http://api.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld/, ''),
        headers: {
          'Origin': 'http://api.vworld.kr',
          'Referer': 'http://api.vworld.kr/'
        }
      }
    }
  }
})
