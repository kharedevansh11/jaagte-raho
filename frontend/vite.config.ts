import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev the backend runs on :3000; proxying keeps the app on one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/graphql': 'http://localhost:3000',
      '/demo': 'http://localhost:3000',
    },
  },
})
