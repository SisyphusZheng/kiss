import { kiss } from '@kiss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
    })
  ]
})
