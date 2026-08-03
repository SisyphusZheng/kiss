/**
 * Shared JSONC reader for deno.json-style config files (#708).
 *
 * Single implementation used by workspace-alias.ts and cli/build-client.ts.
 * Delegates to @std/jsonc (#870-3.2): deno.json files may contain comments
 * and trailing commas; the std parser handles string literals correctly.
 */

import { parse } from '@std/jsonc';
import { readFileSync } from 'node:fs';

/**
 * Parse JSONC text. Returns null on invalid JSON.
 */
export function parseJsonc(content: string): Record<string, unknown> | null {
  try {
    return parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Read and parse a JSONC file. Returns null when the file is unreadable or
 * its contents are not valid JSONC.
 *
 * H-12 fix: Use platform-appropriate file reading API —
 * Deno.readTextFileSync in Deno environments, node:fs in Node.js (Vite).
 */
export function readJsonc(path: string): Record<string, unknown> | null {
  let content: string;
  try {
    content = typeof Deno !== 'undefined'
      ? Deno.readTextFileSync(path)
      : readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
  return parseJsonc(content);
}
