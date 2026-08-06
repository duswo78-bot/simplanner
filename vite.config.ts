import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/simplanner/' : '/', // 빌드 시에만 /simplanner/ 적용, 로컬은 /
  plugins: [react()]
}))
