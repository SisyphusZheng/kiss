import { defineConfig } from 'vite'
import { kiss } from '@kiss/core'

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
