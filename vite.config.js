import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Thư viện ít đổi tách tệp riêng → mỗi lần đưa bản mới lên, trình duyệt các em vẫn dùng lại bản đã lưu (chỉ tải lại mã app)
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react'
          if (id.includes('@supabase')) return 'supabase'
        },
      },
    },
  },
  // npm test: nhanh, không cần mạng. tests/that/ đăng nhập thật vào Neon → chạy riêng: npm run test:quyen
  test: { exclude: [...configDefaults.exclude, 'tests/that/**'] },
})
