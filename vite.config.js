import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // npm test: nhanh, không cần mạng. tests/that/ đăng nhập thật vào Neon → chạy riêng: npm run test:quyen
  test: { exclude: [...configDefaults.exclude, 'tests/that/**'] },
})
