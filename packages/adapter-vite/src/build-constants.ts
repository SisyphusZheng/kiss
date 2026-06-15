/**
 * @openelement/adapter-vite - Build constants.
 *
 * Centralized constants for the Vite/SSG build pipeline. Keeping these in one
 * place makes the build entry points easier to read and avoids magic strings
 * scattered through the adapter.
 */

/** Fallback package version when adapter-vite cannot read its own deno.json. */
export const DEFAULT_ADAPTER_VERSION_FALLBACK = '0.35.1';

/** Chunk size warning limit (kB) for the SSR bundle build. */
export const SSR_CHUNK_SIZE_WARNING_LIMIT_KB = 1500;

/** Deno-resolvable npm specifier for the sanitize-html optional dependency. */
export const SANITIZE_HTML_SPECIFIER = 'npm:sanitize-html@^2.17.4';

/** Rollup/Vite output paths mapping for known externals. */
export const SSR_EXTERNAL_PATHS: Record<string, string> = {
  'sanitize-html': SANITIZE_HTML_SPECIFIER,
};
