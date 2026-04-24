import { kiss } from '@kissjs/core'
import { kissUI } from '@kissjs/ui'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/kiss/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      headExtras: [
        '<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />',
        '<script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"></script>',
      ].join('\n  '),
    }),
    kissUI(),
  ],
})
