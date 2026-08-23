/** Public content/build helpers intentionally supported by adapter-vite. */
export { generateSitemap } from './internal/content/sitemap/generator.ts';
export { createCollectionPlugin } from './internal/content/collection/plugin.ts';
export {
  loadCollectionData,
  writeCollectionDataModule,
} from './internal/content/collection/data.ts';
export type {
  CollectionEntry,
  CollectionFieldDefinition,
  CollectionFieldType,
  CollectionOptions,
  CollectionSchema,
  CollectionSchemaContext,
  CollectionSchemaResult,
} from './internal/content/collection/types.ts';
export type { SitemapOptions } from './internal/content/types.ts';
