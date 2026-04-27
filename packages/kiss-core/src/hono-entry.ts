/**
 * @kissjs/core - Hono entry generator
 *
 * Generates a virtual module string that exports a Hono app
 * with all routes registered (API + page/SSR) and middleware configured.
 *
 * Architecture:
 *   routes + options → buildEntryDescriptor() → EntryDescriptor
 *   EntryDescriptor  → renderEntry()           → string (virtual module)
 *
 * This module is the public façade that combines the two steps.
 * Each step is independently testable:
 *   - buildEntryDescriptor: test descriptor structure (JSON-serializable)
 *   - renderEntry: snapshot test the generated code
 */

import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';
import { buildEntryDescriptor } from './entry-descriptor.js';
import { renderEntry } from './entry-renderer.js';

export { buildEntryDescriptor } from './entry-descriptor.js';
export { renderEntry } from './entry-renderer.js';
export type { EntryDescriptor } from './entry-descriptor.js';

/** Options for the Hono entry code generator */
export interface HonoEntryOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssg?: boolean;
  islandTagNames?: string[];
  packageIslands?: PackageIslandMeta[];
  headExtras?: string;
  html?: { lang?: string; title?: string };
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * Internally:
 *  1. buildEntryDescriptor() — pure data transformation
 *  2. renderEntry()          — pure string rendering
 *
 * Both steps are exported individually for testing.
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: HonoEntryOptions = {},
): string {
  const descriptor = buildEntryDescriptor(routes, options);
  return renderEntry(descriptor);
}
