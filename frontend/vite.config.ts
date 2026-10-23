import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const DJANGO = process.env.DJANGO_ORIGIN ?? 'http://127.0.0.1:8000'

// أثناء التطوير Django هو اللي بيقدّم الصفحة (الـshell) وبيحمّل السكربتات من
// هنا بالـHMR؛ وقت الـbuild الملفات بتطلع في static/app/ وDjango بيقراها من
// manifest.json (شوف system/templatetags/vite.py).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/static/app/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    // روابط الملفات لازم تبقى مطلقة لأن الصفحة نفسها جاية من منفذ Django
    origin: 'http://localhost:5173',
    // لو فتحت 5173 مباشرة (من غير shell) الطلبات بتتحوّل لـDjango
    proxy: {
      '/api': DJANGO,
      '/media': DJANGO,
      '/i18n': DJANGO,
      '/static/images': DJANGO,
      '/static/img': DJANGO,
    },
  },
  build: {
    outDir: '../static/app',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: { input: 'src/main.tsx' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
}))
