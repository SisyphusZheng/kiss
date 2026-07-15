/**
 * adapter-vite internal SSG post-processing.
 *
 * Pure Node.js fs operations for SSG output post-processing.
 * No Vite dependency - these functions only read/write files.
 *
 * URLPattern is used for route matching per WHATWG section7.2.
 *
 * Post-processing pipeline (called after SSG rendering):
 * 1. injectClientScript() - add island client entry
 * 2. injectViewTransitionMeta() - enable cross-page View Transitions
 * 3. injectSpeculationRules() - prefetch/prerender for navigation performance
 * 4. injectCspMeta() - Content-Security-Policy meta tag
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createLogger } from '@openelement/element';
import { formatError } from '@openelement/element';
export { buildSpeculationRulesJson } from './speculation-rules.ts';

const log = createLogger('core');

// Shared directory walker

/**
 * Walk a directory tree and apply a visitor to each HTML file.
 * If the visitor returns a string, the file is overwritten with that content.
 * If it returns null, the file is left unchanged.
 */
function walkHtmlFiles(
  dir: string,
  visitor: (content: string, fullPath: string) => string | null,
): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, visitor);
    } else if (entry.name.endsWith('.html')) {
      const content = readFileSync(fullPath, 'utf-8');
      const result = visitor(content, fullPath);
      if (result !== null) {
        writeFileSync(fullPath, result, 'utf-8');
      }
    }
  }
}

// ─── HTML Insertion Helpers ────────────────────────────────────────────

/** Insert content immediately after <head> opening tag (handles attributes) */
export function insertAfterHead(html: string, content: string): string {
  // M-11 fix: Use [^>]* instead of [\s\S]*? to prevent backtracking
  const headMatch = html.match(/<head(\s[^>]*)?>/i);
  if (!headMatch) {
    return html.startsWith('<!') || html.startsWith('<html')
      ? html.replace(/(<(?:!DOCTYPE|html)[^>]*>)/i, `$1\n<head>\n  ${content}\n</head>`)
      : `<head>\n  ${content}\n</head>\n${html}`;
  }
  if (headMatch.index === undefined) {
    throw new Error('insertAfterHead: matched <head> but index is undefined');
  }
  const headEnd = headMatch.index + headMatch[0].length;
  return html.slice(0, headEnd) + `\n  ${content}` + html.slice(headEnd);
}

/** Insert content immediately before </body> closing tag */
function insertBeforeBodyClose(html: string, content: string): string {
  const bodyCloseMatch = html.match(/<\/body\s*>/i);
  if (!bodyCloseMatch) {
    return html + `\n${content}\n`;
  }
  if (bodyCloseMatch.index === undefined) {
    throw new Error('insertBeforeBodyClose: matched </body> but index is undefined');
  }
  const idx = bodyCloseMatch.index;
  return html.slice(0, idx) + `${content}\n` + html.slice(idx);
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Scan client build output to build tagName -> chunk path mapping.
 * Reads Rollup manifest JSON (v0.3.0+ deterministic approach).
 */
export async function buildIslandChunkMap(
  root: string,
  outDir: string,
  islands: string[],
  basePath: string = '/',
): Promise<Record<string, string>> {
  const distDir = resolve(root, outDir);
  const clientDir = resolve(distDir, 'client');
  const islandChunkMap: Record<string, string> = {};

  if (!existsSync(clientDir)) return islandChunkMap;

  const manifestPath = join(clientDir, '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) return islandChunkMap;

  try {
    const manifestRaw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestRaw);

    for (const [_srcPath, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
      if (!entry.file) continue;
      const chunkMatch = entry.file.match(/^islands\/island-(.+?)-[A-Za-z0-9]+\.js$/);
      if (chunkMatch && islands.includes(chunkMatch[1])) {
        islandChunkMap[chunkMatch[1]] = `${basePath}client/${entry.file}`;
      }
      if (entry.file === 'islands/client.js') {
        for (const tagName of islands) {
          if (!islandChunkMap[tagName]) {
            islandChunkMap[tagName] = `${basePath}client/islands/client.js`;
          }
        }
      }
    }
  } catch (e) {
    // Malformed manifest - warn and return empty map
    log.warn(
      `Could not parse client manifest: ${formatError(e)}`,
    );
  }

  return islandChunkMap;
}

/**
 * Inject client script tag into all HTML files.
 */
export function injectClientScript(dir: string, scriptSrc: string): void {
  const scriptTag = `  <script type="module" src="${scriptSrc}"></script>`;
  walkHtmlFiles(dir, (content) => {
    if (content.includes(scriptSrc)) return null;
    return insertBeforeBodyClose(content, scriptTag);
  });
}

/**
 * Inject CSP <meta> tag into all HTML files (SSG-only).
 *
 * For static sites, CSP is enforced via <meta http-equiv="Content-Security-Policy">
 * rather than HTTP headers. Nonce-based CSP is NOT supported for SSG
 * (nonces must be per-request and unpredictable - impossible in static files).
 */
export function injectCspMeta(
  dir: string,
  cspPolicy: string,
  reportOnly = false,
  nonce = false,
): void {
  if (nonce) {
    log.warn(
      'CSP nonce is not supported for SSG static output. ' +
        'Falling back to policy-only Content-Security-Policy meta tag. ' +
        'For per-request nonces, use a server-side middleware instead.',
    );
  }

  const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  const escapedPolicy = cspPolicy.replace(/"/g, '&quot;');
  const metaTag = `  <meta http-equiv="${headerName}" content="${escapedPolicy}">`;

  walkHtmlFiles(dir, (content) => {
    if (content.includes(`http-equiv="${headerName}"`)) return null;
    return insertAfterHead(content, metaTag);
  });
}

// ─── View Transitions API ─────────────────────────────────────────────

/**
 * Inject View Transitions meta tag into all HTML files.
 *
 * The View Transitions API (Chrome 111+, Safari 18+, Firefox 129+) enables
 * smooth cross-page animations for MPA (Multi-Page App) navigation.
 * For SSG sites, this is a single meta tag - zero JavaScript required.
 *
 * When a user clicks a link, the browser automatically creates a cross-fade
 * transition between the old and new page. No SPA routing needed.
 *
 * Supported browsers: Chrome 111+, Edge 111+, Safari 18+, Firefox 129+.
 * Unsupported browsers silently ignore the meta tag (graceful degradation).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 * @see https://chromestatus.com/feature/5190686707568640
 */
export function injectViewTransitionMeta(dir: string): void {
  const metaTag = '  <meta name="view-transition" content="same-origin">';

  walkHtmlFiles(dir, (content) => {
    if (content.includes('<meta name="view-transition"')) return null;
    return insertAfterHead(content, metaTag);
  });
}

// ─── Speculation Rules API ────────────────────────────────────────────

/**
 * Build Speculation Rules JSON from configuration and known routes.
 *
 * If user-provided rules exist, they are used directly.
 * Otherwise, heuristics are applied based on the route list:
 * - Home page (/) -> prerender (moderate)
 * - Top-level static pages (1 level deep) -> prerender (conservative)
 * - Nested static pages -> prefetch
 * - Dynamic routes (containing :) -> excluded (content depends on params)
 * - API routes -> excluded
 *
 * This two-tier strategy balances instant navigation for high-probability
 * targets (prerender) with bandwidth-conscious loading for deeper pages (prefetch).
 *
 * @param options - User-provided speculation rules configuration
 * @param routes - Known route entries from route scanner (for heuristic rules)
 * @returns Speculation Rules JSON string, or empty string if no rules apply
 */
/**
 * Inject Speculation Rules into all HTML files.
 *
 * The Speculation Rules API (Chrome 121+) enables the browser to
 * prefetch or prerender pages before the user navigates to them.
 * This makes navigation feel instant for SSG sites.
 *
 * Speculation Rules are declarative JSON in a <script type="speculationrules"> tag.
 * They have zero JavaScript runtime cost - the browser handles everything natively.
 *
 * Only Chromium-based browsers (Chrome, Edge) support this as of 2026.
 * Safari and Firefox silently ignore the script tag (graceful degradation).
 *
 * @param dir - Output directory containing HTML files
 * @param rulesJson - Pre-built speculation rules JSON string
 */
export function injectSpeculationRules(dir: string, rulesJson: string): void {
  if (!rulesJson.trim()) return;

  const scriptTag = `  <script type="speculationrules">\n  ${rulesJson}\n  </script>`;

  walkHtmlFiles(dir, (content) => {
    if (content.includes('<script type="speculationrules"')) return null;
    return insertAfterHead(content, scriptTag);
  });
}
