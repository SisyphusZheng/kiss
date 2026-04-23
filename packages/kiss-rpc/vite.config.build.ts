/**
 * @kiss/rpc - Vite library mode build config
 * Replaces tsup with native Vite lib mode.
 * Pure ESM output, no CJS.
 */
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      include: ['src/**/*.ts'],
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
      client: 'src/client.ts',
    },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        if (id === 'hono' || id.startsWith('hono/')) return true
        if (id === 'zod') return true
        return false
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
})
