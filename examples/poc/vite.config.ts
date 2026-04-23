import { defineConfig } from 'vite'
import { kiss } from '@kiss/vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      dev: {
        port: 3000,
      },
    }),
  ],
})
