/**
 * @kiss/ui - Vite library mode build config
 * Pure ESM output, no CJS. Multi-entry for per-component imports.
 *
 * v0.3.0: Key change — compiled dist/ replaces @kissjs/core imports
 * with direct lit imports. This matches industry standard (Shoelace,
 * Material Web, Lit official components) — consumers only need lit
 * as a peer dependency, not @kissjs/core.
 *
 * How: Vite resolve.alias maps '@kissjs/core' → 'lit' at build time.
 * Since @kissjs/core re-exports everything from lit, this is a safe
 * substitution that removes the unnecessary indirection.
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
        // NOTE: @kissjs/core is NOT externalized here.
        // Instead, the resolve.alias below maps it to 'lit' at build time,
        // so compiled output only imports from 'lit'.
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
  resolve: {
    alias: {
      // @kissjs/core re-exports lit — replace with direct lit import
      // in compiled output so consumers don't need @kissjs/core
      '@kissjs/core': 'lit',
    },
  },
});
