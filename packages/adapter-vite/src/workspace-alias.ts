/**
 * @openelement/adapter-vite - Workspace alias auto-generation
 *
 * Reads Deno workspace deno.json exports and generates
 * Vite resolve.alias entries. Uses sync Deno APIs so it
 * can run in synchronous plugin hooks (config, configResolved).
 */

import { resolve } from 'node:path';

export interface AliasEntry {
  find: string;
  replacement: string;
}

function tryReadJson(path: string): Record<string, unknown> | null {
  try {
    // H-12 fix: Use platform-appropriate file reading API
    // Deno.readTextFileSync in Deno environments, node:fs in Node.js (Vite)
    const content = typeof Deno !== 'undefined'
      ? Deno.readTextFileSync(path)
      : require('node:fs').readFileSync(path, 'utf-8');
    // deno.json files may contain comments - strip them before JSON.parse.
    // Naive regex breaks URLs (https:// -> https:), so we walk character by character,
    // tracking whether we're inside a string literal.
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
      result += ch;
    }
    return JSON.parse(result);
  } catch {
    return null;
  }
}

/**
 * Walk up from startDir to find a deno.json with a "workspace" field.
 */
export function findWorkspaceRoot(startDir: string): string | null {
  let dir = resolve(startDir);
  const fsRoot = resolve('/');
  while (dir !== fsRoot && dir !== resolve(dir, '..')) {
    const cfg = tryReadJson(resolve(dir, 'deno.json'));
    if (cfg?.workspace && Array.isArray(cfg.workspace)) return dir;
    dir = resolve(dir, '..');
  }
  return null;
}

/**
 * Generate Vite resolve.alias from workspace packages' deno.json exports.
 * Subpath aliases come before parent (Vite prefix matching rule).
 */
export function generateWorkspaceAliases(workspaceRoot: string): AliasEntry[] {
  const rootCfg = tryReadJson(resolve(workspaceRoot, 'deno.json'));
  if (!rootCfg) return [];

  const members: string[] = (rootCfg.workspace as string[]) || [];
  const aliases: AliasEntry[] = [];

  for (const member of members) {
    const memberDir = resolve(workspaceRoot, member);
    const memberCfg = tryReadJson(resolve(memberDir, 'deno.json'));
    if (!memberCfg) continue;

    const name = memberCfg.name as string | undefined;
    const exports = memberCfg.exports as
      | Record<string, string>
      | string
      | undefined;
    if (!name || !exports) continue;

    if (typeof exports === 'string') {
      aliases.push({ find: name, replacement: resolve(memberDir, exports) });
      continue;
    }

    // Subpath aliases first (Vite prefix matching)
    for (const [exportPath, sourcePath] of Object.entries(exports)) {
      if (exportPath === '.') continue;
      const subpath = exportPath.replace(/^\.\//, '/');
      aliases.push({
        find: `${name}${subpath}`,
        replacement: resolve(memberDir, sourcePath as string),
      });
    }
    // Parent alias last. Subpath aliases above already handle every exported
    // subpath, so a direct import of the package name resolves to the "./"
    // export entry without falling through to directory-index heuristics.
    if (exports['.']) {
      aliases.push({
        find: name,
        replacement: resolve(memberDir, exports['.'] as string),
      });
    }
  }
  return aliases;
}
