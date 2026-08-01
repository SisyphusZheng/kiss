/**
 * Shared JSONC reader for deno.json-style config files (#708).
 *
 * Single implementation used by workspace-alias.ts and cli/build-client.ts.
 * deno.json files may contain comments and trailing commas; naive regex
 * stripping breaks URLs (https:// -> https:), so we walk character by
 * character, tracking whether we're inside a string literal.
 */

import { readFileSync } from 'node:fs';

/**
 * Parse JSONC text: strips // and block comments (including mid-line //)
 * and trailing commas, without touching string literals.
 * Returns null on invalid JSON.
 */
export function parseJsonc(content: string): Record<string, unknown> | null {
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (!inString && ch === '/' && content[i + 1] === '/') {
      // Skip until end of line
      while (i < content.length && content[i] !== '\n') i++;
      result += '\n';
      continue;
    }
    if (!inString && ch === '/' && content[i + 1] === '*') {
      // Skip until */
      i += 2;
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
      i++; // skip past */
      result += ' ';
      continue;
    }
    // Trailing commas (Deno JSONC allows them, JSON.parse does not).
    // Lookahead skips whitespace and comments so `", // note\n }` also counts.
    if (!inString && ch === ',') {
      let j = i + 1;
      for (;;) {
        while (j < content.length && /\s/.test(content[j])) j++;
        if (content[j] === '/' && content[j + 1] === '/') {
          while (j < content.length && content[j] !== '\n') j++;
          continue;
        }
        if (content[j] === '/' && content[j + 1] === '*') {
          j += 2;
          while (j < content.length && !(content[j] === '*' && content[j + 1] === '/')) j++;
          j += 2;
          continue;
        }
        break;
      }
      if (content[j] === '}' || content[j] === ']') continue;
    }
    result += ch;
  }
  try {
    return JSON.parse(result);
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
