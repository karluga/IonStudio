import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (Or vue, svelte, etc. depending on your framework)
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})