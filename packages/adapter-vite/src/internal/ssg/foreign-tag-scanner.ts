/**
 * foreign-tag-scanner.ts — #979 (0.43.0-alpha.2): foreign custom-element tag
 * discovery.
 *
 * The SSR admission plan historically only saw island declarations, so a
 * third-party Web Component consumed in JSX (<sl-button>, <md-switch>, a
 * bare-native element) never entered the scan at all. This module statically
 * scans page route and island module sources for custom-element tag usages
 * and reports the tags that are neither local islands, package-manifest
 * islands, nor openElement-authored elements (defineElement/defineIsland/
 * customElements.define within the scanned sources).
 *
 * Visibility only: the discovered tags are recorded in the admission plan as
 * explicit client-only entries. SSR rendering and hydration behavior are
 * unchanged — foreign tags remain an opaque passthrough.
 *
 * Like the route/island scanners this is regex-based (no module execution).
 * Usage extraction runs on string-masked source (maskSourceStrings) so code
 * samples embedded in template literals never register as consumed tags;
 * definition extraction runs on the raw source because the tag name there is
 * itself a string literal.
 */
import { createLogger } from '@openelement/element';
import { join } from 'node:path';
import { maskSourceStrings } from './route-scanner.ts';
import { safeReadFile } from './route-scanner-fs.ts';

const log = createLogger('foreign-tag-scan');

/**
 * JSX usage of a custom element: an opening tag whose name contains a hyphen.
 * Closing tags are not matched (the name follows `</`), which is fine — an
 * opening usage always exists for a consumed element. String-masked source
 * keeps JSX as code while blanking embedded samples.
 */
const FOREIGN_TAG_USAGE_RE = /<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)(?=[\s/>])/g;

/**
 * openElement-authored element definitions whose tag name is a string literal:
 * defineElement('x-y', …), defineIsland('x-y', …), customElements.define('x-y', …).
 */
const DEFINED_TAG_RE =
  /\b(?:defineElement|defineIsland|customElements\.define)\s*\(\s*['"`]([a-z][a-z0-9]*(?:-[a-z0-9]+)+)['"`]/g;

/** Extract custom-element tags an openElement module defines itself (raw source). */
export function collectDefinedTags(source: string): Set<string> {
  const defined = new Set<string>();
  for (const match of source.matchAll(DEFINED_TAG_RE)) {
    defined.add(match[1]);
  }
  return defined;
}

/** Extract custom-element tags used in JSX (string-masked source). */
export function collectUsedTags(source: string): Set<string> {
  const used = new Set<string>();
  const masked = maskSourceStrings(source);
  for (const match of masked.matchAll(FOREIGN_TAG_USAGE_RE)) {
    used.add(match[1]);
  }
  return used;
}

/**
 * Discover foreign custom-element tags across the given module sources.
 *
 * A tag is foreign when it is used in JSX but is not in `knownTags` (local
 * islands, package-manifest declarations, route registration tags) and is not
 * defined by any of the scanned sources themselves.
 */
export function discoverForeignTags(
  sources: string[],
  knownTags: ReadonlySet<string>,
): string[] {
  const used = new Set<string>();
  const defined = new Set<string>();
  for (const source of sources) {
    for (const tag of collectUsedTags(source)) used.add(tag);
    for (const tag of collectDefinedTags(source)) defined.add(tag);
  }
  const foreign = [...used].filter((tag) => !knownTags.has(tag) && !defined.has(tag));
  return foreign.sort();
}

export interface ScanForeignTagsOptions {
  /** Absolute routes directory; routeFiles are relative to it. */
  routesDir: string;
  /** Absolute islands directory; islandFiles are relative to it. */
  islandsDir: string;
  /** Page route file paths (relative to routesDir). */
  routeFiles: string[];
  /** Island file paths (relative to islandsDir). */
  islandFiles: string[];
  /** Tags the scan must never report: islands, package declarations, route tags. */
  knownTags: ReadonlySet<string>;
}

/**
 * Read page route + island module sources from disk and discover the foreign
 * custom-element tags they consume. Unreadable modules are skipped (same
 * posture as scanIslandMeta); the scan never executes module code.
 */
export async function scanForeignTags(options: ScanForeignTagsOptions): Promise<string[]> {
  const sources: string[] = [];
  const readInto = async (dir: string, files: string[]): Promise<void> => {
    for (const file of files) {
      const fullPath = join(dir, file);
      const source = await safeReadFile(fullPath);
      if (source === undefined) {
        log.debug(`Unable to read module for foreign-tag scan: ${fullPath}`);
        continue;
      }
      sources.push(source);
    }
  };
  await readInto(options.routesDir, options.routeFiles);
  await readInto(options.islandsDir, options.islandFiles);
  return discoverForeignTags(sources, options.knownTags);
}
