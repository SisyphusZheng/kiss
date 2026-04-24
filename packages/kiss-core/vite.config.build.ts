/**
 * @kiss/vite - Vite library mode build config
 * Replaces tsup + patch-node-prefix with native Vite lib mode.
 *
 * Key advantages:
 * - Vite/Rollup preserves node: prefix (no patch needed)
 * - Pure ESM output (no CJS)
 * - vite-plugin-dts for .d.ts generation
 * - Same toolchain as user projects (Vite is already a peerDep)
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
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        // Peer dep
        if (id === 'vite') return true
        // Runtime deps — hono and its sub-paths
        if (id === 'hono' || id.startsWith('hono/')) return true
        // Lit ecosystem
        if (id === 'lit' || id.startsWith('lit/') || id.startsWith('@lit/')) return true
        if (id === '@lit-labs/ssr' || id.startsWith('@lit-labs/')) return true
        // Hono Vite plugins — they import Node builtins, must stay external
        if (id === '@hono/vite-dev-server' || id.startsWith('@hono/vite-dev-server/')) return true
        if (id === '@hono/vite-ssg' || id.startsWith('@hono/vite-ssg/')) return true
        // Node builtins
        if (id.startsWith('node:')) return true
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
