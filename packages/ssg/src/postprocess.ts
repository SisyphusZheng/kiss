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
 * 5. injectDsdPolyfill() - DSD polyfill for Firefox
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createLogger } from '@openelement/core/logger';
import { formatError } from '@openelement/core/errors';
import type { SpeculationRulesOptions } from '@openelement/protocol/ssg';

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
export function buildIslandChunkMap(
  root: string,
  outDir: string,
  islands: string[],
  basePath: string = '/',
): Record<string, string> {
  const distDir = resolve(root, outDir);
  const clientDir = resolve(distDir, 'client');
  const islandChunkMap: Record<string, string> = {};

  if (!existsSync(clientDir)) return islandChunkMap;

  const manifestPath = join(clientDir, '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) return islandChunkMap;

  try {
    const manifestRaw = readFileSync(manifestPath, 'utf-8');
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

/**
 * DSD polyfill for browsers that don't support Declarative Shadow DOM.
 * Firefox does NOT support shadowrootmode as of 2025.
 * This polyfill attaches Shadow Roots manually via attachShadow().
 */
const DSD_POLYFILL = `
<style>html{visibility:visible!important}body{background:var(--bg-base);color:var(--text-primary);font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}docs-home{display:block}
:root[data-theme="dark"]{--gray-0:#030507;--gray-1:#0d0f12;--gray-2:#16191d;--gray-3:#212529;--gray-4:#343a40;--gray-5:#495057;--gray-6:#868e96;--gray-7:#adb5bd;--gray-8:#ced4da;--gray-9:#dee2e6;--gray-10:#e9ecef;--gray-11:#f1f3f5;--gray-12:#f8f9fa;--text-primary:var(--gray-10);--text-secondary:var(--gray-7);--text-muted:var(--gray-6);--bg-base:var(--gray-0);--bg-surface:var(--gray-1);--bg-card:var(--gray-2);--bg-code:#0d0d12;--bg-hover:var(--gray-3);--border:var(--gray-3);--border-hover:var(--gray-4);--brand:#4f6ef7;--brand-hover:#3d5ce5;--brand-light:#6b8cff;--brand-deep:#1a1a4e;--brand-subtle:rgba(79,110,247,.15);--brand-glow:rgba(79,110,247,.2);--code-border:rgba(255,255,255,.08)}
:root[data-theme="light"]{--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-2:#e9ecef;--gray-3:#dee2e6;--gray-4:#ced4da;--gray-5:#adb5bd;--gray-6:#868e96;--gray-7:#495057;--gray-8:#343a40;--gray-9:#212529;--gray-10:#16191d;--gray-11:#0d0f12;--gray-12:#030507;--text-primary:var(--gray-10);--text-secondary:var(--gray-7);--text-muted:var(--gray-6);--bg-base:var(--gray-0);--bg-surface:var(--gray-2);--bg-card:var(--gray-0);--bg-code:#f1f3f5;--bg-hover:var(--gray-2);--border:var(--gray-3);--border-hover:var(--gray-4);--brand:#4f6ef7;--brand-hover:#3d5ce5;--brand-light:#6b8cff;--brand-deep:#e7e9fb;--brand-subtle:rgba(79,110,247,.1);--brand-glow:rgba(79,110,247,.15);--code-border:color-mix(in srgb, var(--gray-0) 8%, transparent)}
</style>
<script>
// DSD Polyfill (Firefox, older browsers)
(function() {
  try {
    const t = document.createElement('template');
    t.setAttribute('shadowrootmode', 'open');
    if ('shadowRootMode' in t) return; // Native support
  } catch { /* native detection failed - fallback to polyfill */ }
  
  const attachDSD = (root) => {
    root.querySelectorAll('template[shadowrootmode]').forEach(tpl => {
      const parent = tpl.parentNode;
      if (!parent || parent.shadowRoot) return;
      try {
        const mode = tpl.getAttribute('shadowrootmode');
        const opts = { mode: mode === 'open' ? 'open' : 'closed' };
        if (tpl.hasAttribute('shadowrootdelegatesfocus')) opts.delegatesFocus = true;
        const sr = parent.attachShadow(opts);
        sr.innerHTML = tpl.innerHTML;
        tpl.remove();
        attachDSD(sr); // Handle nested DSD
      } catch { /* non-fatal: skip malformed DSD templates */ }
    });
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => attachDSD(document));
  } else {
    attachDSD(document);
  }

  // Fallback: if after polyfill some templates remain unattached, inline them
  // into light DOM so content is still visible even if attachShadow failed.
  const fallbackRender = () => {
    document.querySelectorAll('template[shadowrootmode]').forEach((tpl) => {
      const parent = tpl.parentNode;
      if (!parent || parent.shadowRoot) return;
      const frag = tpl.content.cloneNode(true);
      parent.appendChild(frag);
      tpl.remove();
    });
  };
  if (document.readyState === 'complete') {
    fallbackRender();
  } else {
    window.addEventListener('load', fallbackRender, { once: true });
  }
})();
</script>
`;

/**
 * Inject DSD polyfill into all HTML files.
 * Handles browsers that don't natively support Declarative Shadow DOM.
 */
export function injectDsdPolyfill(dir: string): void {
  walkHtmlFiles(dir, (content) => {
    if (content.includes('DSD Polyfill')) return null;
    return insertAfterHead(content, DSD_POLYFILL);
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
export function buildSpeculationRulesJson(
  options: SpeculationRulesOptions,
  routes?: Array<{ path: string; type: string }>,
): string {
  // If user provided explicit rules, use them
  if (options.prerender?.length || options.prefetch?.length) {
    const rules: Record<string, unknown[]> = {};

    if (options.prerender && options.prerender.length > 0) {
      rules.prerender = options.prerender.map((pattern) => ({
        where: { href_matches: pattern },
        ...(options.eagerness && options.eagerness !== 'moderate'
          ? { eagerness: options.eagerness }
          : {}),
      }));
    }

    if (options.prefetch && options.prefetch.length > 0) {
      rules.prefetch = options.prefetch.map((pattern) => ({
        where: { href_matches: pattern },
      }));
    }

    // Add exclusion if provided
    if (options.exclude && options.exclude.length > 0) {
      const excludeWhere = options.exclude.map((pattern) => ({
        href_matches: pattern,
      }));
      // Apply exclusions to both prerender and prefetch
      for (const key of ['prerender', 'prefetch'] as const) {
        if (rules[key]) {
          for (const rule of rules[key] as Record<string, unknown>[]) {
            (rule.where as Record<string, unknown>).not = { or_matches: excludeWhere };
          }
        }
      }
    }

    return JSON.stringify(rules, null, 2);
  }

  // Heuristic mode: generate rules from route list
  if (!routes || routes.length === 0) return '';

  const staticPagePaths = routes
    .filter((r) => r.type === 'page' && !r.path.includes(':'))
    .map((r) => r.path);

  if (staticPagePaths.length === 0) return '';

  // Two-tier strategy:
  //   - Home page is the highest-probability target -> prerender (moderate)
  //   - Top-level pages (e.g. /about, /blog) -> prerender (conservative)
  //   - Nested pages (e.g. /blog/post-slug, /docs/guide) -> prefetch only
  const prerenderPaths: string[] = [];
  const prefetchPaths: string[] = [];

  for (const path of staticPagePaths) {
    if (path === '/') {
      // Highest probability: prerender with moderate eagerness
      prerenderPaths.push(path);
    } else if (path.split('/').filter(Boolean).length <= 1) {
      // v0.14.3: Top-level pages get exact-match patterns, NOT wildcards.
      // Adding /about/* would waste bandwidth prefetching all /about/* sub-paths
      // that may not exist. Use exact match for single pages.
      prerenderPaths.push(path);
    } else {
      // Deeper pages: prefetch only (lighter than prerender)
      // Use wildcard for nested sections (e.g., /blog/* matches /blog/post-1, /blog/post-2)
      prefetchPaths.push(`${path}/*`);
    }
  }

  const rules: Record<string, unknown[]> = {};

  if (prerenderPaths.length > 0) {
    rules.prerender = prerenderPaths.map((pattern) => {
      // Home page (/): use list rule (source + urls) - no document matcher
      if (pattern === '/') {
        return {
          source: 'list',
          urls: ['/'],
          eagerness: 'moderate',
        };
      }
      // Top-level pages (/about, /blog): use document rule (where: href_matches)
      return {
        where: { href_matches: pattern },
        eagerness: 'conservative',
      };
    });
  }

  if (prefetchPaths.length > 0) {
    rules.prefetch = prefetchPaths.map((pattern) => ({
      where: { href_matches: pattern },
    }));
  }

  // Exclude API routes if any exist
  const apiPaths = routes
    .filter((r) => r.type === 'api')
    .map((r) => `${r.path}/*`);

  if (apiPaths.length > 0) {
    const excludeWhere = apiPaths.map((p) => ({ href_matches: p }));
    for (const key of ['prerender', 'prefetch'] as const) {
      if (rules[key]) {
        for (const rule of rules[key] as Record<string, unknown>[]) {
          // Only add exclusion to document rules (where) - list rules (source+urls) don't have where
          if (rule.where && typeof rule.where === 'object') {
            (rule.where as Record<string, unknown>).not = { or_matches: excludeWhere };
          }
        }
      }
    }
  }

  return JSON.stringify(rules, null, 2);
}

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
