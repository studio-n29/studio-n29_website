import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Seamlessly compiles Tailwind v4 classes
  ],
  base: '/', // Change to '/portfolio/' if deploying to a sub-project repository
})

