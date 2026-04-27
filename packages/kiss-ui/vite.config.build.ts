/**
 * @kiss/ui - Vite library mode build config
 * Pure ESM output, no CJS. Multi-entry for per-component imports.
 *
 * v0.3.0: Simplified build — no dts plugin (causes issues in Deno).
 * Externalizes lit and @kissjs/core so consumers resolve them from
 * their own dependency tree.
 */
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'kiss-theme-toggle': 'src/kiss-theme-toggle.ts',
        'kiss-layout': 'src/kiss-layout.ts',
        'kiss-button': 'src/kiss-button.ts',
        'kiss-card': 'src/kiss-card.ts',
        'kiss-input': 'src/kiss-input.ts',
        'kiss-code-block': 'src/kiss-code-block.ts',
        'design-tokens': 'src/design-tokens.ts',
        'kiss-ui-plugin': 'src/kiss-ui-plugin.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'lit',
        'lit/',
        '@lit/reactive-element',
        'lit-html',
        'lit-element',
        '@kissjs/core',
        'vite',
      ],
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
});
