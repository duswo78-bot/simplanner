import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/simplanner/' : '/', // 빌드 시에만 /simplanner/ 적용, 로컬은 /
  plugins: [react()],
  server: {
    proxy: {
      // 한국소비자원_생필품 가격 정보_GW
      '/grocery-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grocery-api/, '')
      },
      // 참가격 포털 (상품 이미지·코드 목록)
      '/price-portal': {
        target: 'https://www.price.go.kr',
        changeOrigin: true,
        secure: false, // 일부 환경에서 기관 인증서 체인 검증 실패 방지
        rewrite: (path) => path.replace(/^\/price-portal/, '')
      },
      // legacy openapi.price.go.kr
      '/openapi': {
        target: 'http://openapi.price.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openapi/, '')
      },
      '/kakao-api': {
        target: 'https://dapi.kakao.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kakao-api/, '')
      },
      '/health-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/health-api/, '')
      }
    }
  }
}))
