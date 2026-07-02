export * from './core.ts';
// Keep the root plugin export for existing @openelement/content consumers;
// new code can import the Vite-specific surface from @openelement/content/vite.
export { default, openContent } from './vite.ts';
export type { OpenContentOptions } from './vite.ts';
