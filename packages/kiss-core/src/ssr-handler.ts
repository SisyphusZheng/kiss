/**
 * @kissjs/core - SSR Handler
 * KISS Architecture (K·I·S·S): rendering is build-time only.
 *
 * This module provides:
 * - Build-time rendering functions (used by SSG plugin and dev server)
 * - Error page rendering
 * - HTML document wrapping
 *
 * What was removed (KISS Architecture):
 * - renderPageToString() — runtime SSR function that took ViteDevServer
 * - collectIslands() — regex-based island detection (moved to build-time map)
 *
 * What remains:
 * - renderSsrError() — error page HTML generation
 * - wrapInDocument() — HTML document wrapping
 */

import type { RouteEntry } from './types.js';

/**
 * Escape a string for safe insertion into an HTML text content.
 * Covers the 5 characters that matter: &, <, >, ", '
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Escape a string for safe insertion into an HTML attribute value.
 * Covers the 4 critical characters: &, ", <, >
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render an error page to HTML string.
 * In dev mode, shows detailed error information for debugging.
 * In production, shows a generic safe error page.
 */
export function renderSsrError(
  error: Error,
  statusOrRoute: number | RouteEntry,
  isDev: boolean = false,
): string {
  const status = typeof statusOrRoute === 'number' ? statusOrRoute : 500;
  const title = isDev ? 'SSR Render Error' : `Error ${status}`;
  const message = error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (isDev) {
    const stack = error.stack ? error.stack.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}pre{background:#f5f5f5;padding:1rem;overflow:auto;border-radius:4px}</style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>${message}</strong></p>
  ${stack ? `<pre>${stack}</pre>` : ''}
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`;
}

/**
 * Wrap rendered HTML in a full HTML document.
 * Adds DOCTYPE, head (title, meta, preload), and body.
 */
export function wrapInDocument(
  html: string,
  options: {
    title?: string;
    lang?: string;
    hydrateScript?: string;
    meta?: { description?: string };
    devMode?: boolean;
    routeModulePath?: string;
    headExtras?: string;
    /** CSP nonce — if provided, added to all <script> tags for CSP compliance */
    cspNonce?: string;
  } = {},
): string {
  const {
    title = 'KISS App',
    lang = 'en',
    hydrateScript = '',
    meta,
    devMode = false,
    routeModulePath,
    headExtras = '',
    cspNonce,
  } = options;
  const nonceAttr = cspNonce ? ` nonce="${cspNonce}"` : '';
  // Escape dynamic values to prevent XSS injection
  const safeTitle = escapeHtml(title);
  const safeLang = escapeHtmlAttr(lang);
  const safeHeadExtras = headExtras; // headExtras is developer-provided HTML — do NOT escape
  const metaTags: string[] = [];
  if (meta?.description) {
    // Escape HTML attribute special characters to prevent injection
    const safeDesc = meta.description
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    metaTags.push(`  <meta name="description" content="${safeDesc}">`);
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') + '\n' : '';

  // Dev mode: inject Vite client + component registration
  const devScripts = devMode
    ? `
  <script type="module" src="/@vite/client"${nonceAttr}></script>
  ${
      routeModulePath
        ? `<script type="module"${nonceAttr}>
  // Register route component for client-side custom element definition
  import '${routeModulePath}';
</script>`
        : ''
    }`
    : '';

  return `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>${metaBlock}
  ${safeHeadExtras}
</head>
<body>
  ${html}
  ${hydrateScript}${devScripts}
</body>
</html>`;
}
