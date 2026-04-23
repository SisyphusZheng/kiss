import { defineConfig } from 'vite'
import { framework } from '@hvl/vite'

export default defineConfig({
  plugins: [
    framework({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      dev: {
        port: 3000,
      },
    }),
  ],
})
