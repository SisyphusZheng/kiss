import { kiss } from '@kiss/core'
import { kissSSG } from '@kiss/ssg'
import { kissUI } from '@kiss/ui'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
    }),
    kissUI({
      version: '3.5.0',
      cdn: true,
    }),
    kissSSG({
      routesDir: 'app/routes',
      siteTitle: 'KISS Framework',
    }),
  ]
})
