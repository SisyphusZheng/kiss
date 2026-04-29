/**
 * Type augmentation for Vite's IndexHtmlTransformContext.
 *
 * This file extends the 'vite' module with a KISS-specific route metadata key.
 * It must be a separate .d.ts file because JSR does not allow
 * global type augmentation (declare module) in regular source files.
 *
 * NOTE: The __kissRouteMeta property is declared here but currently unused.
 * htmlTemplatePlugin returns empty tags (no injection happens).
 * When dev-server route awareness is implemented, this type will be activated.
 * Until then, this file serves as the forward-compatible type contract.
 */
import type { RouteMeta } from './types.js';

/** Route metadata key for Vite HTML transform context (future use) */
declare module 'vite' {
  interface IndexHtmlTransformContext {
    readonly __kissRouteMeta?: RouteMeta;
  }
}
