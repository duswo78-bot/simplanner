import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/simplanner/', // GitHub 레포지토리 이름 (소문자)
  plugins: [react()]
})
