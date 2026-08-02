/**
 * Narrow barrel for the content module (#834): only the two consumers that
 * import through it remain — src/index.ts (generateSitemap) and app-vite.ts
 * (OpenElementContentOptions). Everything else imports the concrete modules
 * directly.
 */
export { generateSitemap } from './sitemap/generator.ts';
export type { OpenElementContentOptions } from './types.ts';
