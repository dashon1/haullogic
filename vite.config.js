import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Base44 vite plugin removed (migrated off Base44).
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
