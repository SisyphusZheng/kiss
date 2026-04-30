/**
 * @kissjs/core - CLI: SSG Build
 *
 * Standalone SSG rendering + post-processing.
 * Reads the SSR entry from .kiss/, creates a Vite SSR server,
 * renders all pages to static HTML, then post-processes island paths.
 *
 * This is Phase 3 of the KISS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .kiss/ metadata
 *   Phase 2 (build-client.ts): Client island chunks
 *   Phase 3 (this script): SSG rendering + post-processing
 *
 * Must run AFTER build-client so island chunk paths are available
 * for the post-processing step (source paths → built chunk paths).
 *
 * Usage:
 *   deno run -A jsr:@kissjs/core/cli/build-ssg
 *   deno task build:ssg
 */

import { join } from 'node:path';
import process from 'node:process';
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import type { FrameworkOptions, PackageIslandMeta } from '../types.js';
import { SsrRenderError } from '../errors.js';

interface BuildSSGOptions {
  root?: string;
  outDir?: string;
  routesDir?: string;
  islandsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssr?: FrameworkOptions['ssr'];
  islandTagNames?: string[];
  packageIslands?: PackageIslandMeta[];
  headExtras?: string;
  html?: { lang?: string; title?: string };
  hydrationStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
  resolveAlias?: Record<string, string> | import('vite').Alias[];
  base?: string;
  pwa?: { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string };
}

/** Recursively find all .html files in a directory (excluding client/, server/, hidden dirs). */
function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (
        entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'client' &&
        entry.name !== 'server'
      ) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch {
    /* ignore */
  }
  return results;
}

async function buildSSG(options: BuildSSGOptions = {}): Promise<void> {
  const root = options.root || process.cwd();
  const outDir = options.outDir || 'dist';
  const routesDir = options.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || 'app/islands';

  // Read island metadata from Phase 1
  const metadataPath = join(root, '.kiss', 'build-metadata.json');
  let islandTagNames = options.islandTagNames || [];
  let packageIslands = options.packageIslands || [];
  let metadataResolveAlias = options.resolveAlias;

  try {
    const raw = readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(raw);
    if (islandTagNames.length === 0) islandTagNames = metadata.islandTagNames || [];
    if (packageIslands.length === 0) packageIslands = metadata.packageIslands || [];
    if (!metadataResolveAlias && metadata.resolveAlias) {
      metadataResolveAlias = metadata.resolveAlias as Record<string, string>;
    }
    // Read headExtras/html/middleware/hydrationStrategy from metadata
    // (written by Phase 1 build.ts) when not provided via CLI options
    if (!options.headExtras && metadata.headExtras) {
      options.headExtras = metadata.headExtras;
    }
    if (!options.html && metadata.html) {
      options.html = metadata.html;
    }
    if (!options.middleware && metadata.middleware) {
      options.middleware = metadata.middleware;
    }
    if (!options.hydrationStrategy && metadata.hydrationStrategy) {
      options.hydrationStrategy = metadata.hydrationStrategy;
    }
    if (!options.pwa && metadata.pwa) {
      options.pwa = metadata.pwa;
    }
    if (!options.base && metadata.base) {
      options.base = metadata.base as string;
    }
    // v0.3.0 note: hydrationStrategy controls WHEN defer-hydration is removed
    // (eager/lazy/idle/visible), not HOW hydration works (always Lit hydrate()).
    // The strategy IS functional — it's not deprecated, just rarely changed from 'lazy'.
  } catch {
    console.log('[KISS] No .kiss/build-metadata.json found — using provided island list');
  }

  // Generate SSG entry code
  const { scanRoutes, scanIslands, fileToTagName } = await import('../route-scanner.js');
  const { generateHonoEntryCode } = await import('../hono-entry.js');

  const routes = await scanRoutes(routesDir);
  const islandsRoot = join(root, islandsDir);
  const ssgIslandTagNames = islandTagNames.length > 0
    ? islandTagNames
    : (await scanIslands(islandsRoot)).map((f) => fileToTagName(f));

  const ssgEntryCode = generateHonoEntryCode(routes, {
    routesDir,
    islandsDir,
    middleware: options.middleware,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    packageIslands,
    headExtras: options.headExtras,
    html: options.html,
    hydrationStrategy: options.hydrationStrategy || 'lazy',
  });

  // Write temp entry file
  const kissTmpDir = join(root, '.kiss');
  const tmpEntryPath = join(kissTmpDir, '.kiss-ssg-entry.ts');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(kissTmpDir, { recursive: true });
  writeFileSync(tmpEntryPath, ssgEntryCode, 'utf-8');

  try {
    const { createServer } = await import('vite');

    // SSR noExternal: bundle lit ecosystem + @kissjs/ui + node-fetch (Deno compat)
    const defaultNoExternal = [
      /^lit/,
      /^@lit/,
      /^@kissjs\/ui/,
      'node-fetch',
      'fetch-blob',
      'data-uri-to-buffer',
      'formdata-polyfill',
      'domexception',
      'node-domexception',
    ];
    const userNoExternal = options.ssr?.noExternal || [];
    const allNoExternal = [...defaultNoExternal, ...userNoExternal];

    // Handle alias — prefer CLI options, then fallback to metadata from Phase 1
    const alias = metadataResolveAlias;
    if (alias) {
      if (Array.isArray(alias)) {
        for (const a of alias) {
          if (a.find === '@kissjs/ui') allNoExternal.push(a.replacement);
        }
      } else if ('@kissjs/ui' in alias) {
        allNoExternal.push(alias['@kissjs/ui']);
      }
    }

    // Polyfill CJS globals for node-domexception in Deno ESM environment
    // node-domexception uses `module.exports` (CJS), which Deno's ESM
    // module-runner can't handle. Provide minimal polyfill before Vite loads.
    if (typeof (globalThis as Record<string, unknown>).module === 'undefined') {
      (globalThis as Record<string, unknown>).module = { exports: {} };
      (globalThis as Record<string, unknown>).exports = {};
    }

    const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
    const { join, _resolve, _dirname } = await import('node:path');

    const server = await createServer({
      configFile: false,
      root,
      server: { middlewareMode: true },
      appType: 'custom',
      build: { ssr: true },
      ssr: { noExternal: allNoExternal },
      esbuild: {
        tsconfigRaw: {
          compilerOptions: {
            useDefineForClassFields: false,
          },
        },
      },
      plugins: [],
      resolve: {
        preserveSymlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: alias || undefined,
      },
    });

    try {
      const module = await server.ssrLoadModule(tmpEntryPath);
      const app = module.default;

      if (!app) {
        throw new SsrRenderError('.kiss-ssg-entry.ts', new Error('Failed to load Hono app'));
      }

      const { toSSG } = await import('hono/ssg');
      const nodeFs = await import('node:fs');
      const nodePath = await import('node:path');

      const fsModule = {
        // deno-lint-ignore require-await
        writeFile: async (path: string, data: string | Uint8Array) => {
          const dir = nodePath.dirname(path);
          if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir, { recursive: true });
          nodeFs.writeFileSync(path, data);
        },
        // deno-lint-ignore require-await
        mkdir: async (path: string) => {
          if (!nodeFs.existsSync(path)) nodeFs.mkdirSync(path, { recursive: true });
        },
        isDirectory: (path: string) => {
          try {
            return nodeFs.statSync(path).isDirectory();
          } catch {
            return false;
          }
        },
      };

      const outputDir = join(root, outDir);
      const result = await toSSG(app, fsModule, { dir: outputDir });

      if (!result.success) throw result.error;

      // Rename 404/index.html → 404.html for GitHub Pages compatibility
      const _404Dir = join(outputDir, '404');
      const _404Html = join(outputDir, '404.html');
      const _404Index = join(_404Dir, 'index.html');
      if (existsSync(_404Index)) {
        const { renameSync } = await import('node:fs');
        renameSync(_404Index, _404Html);
        if (existsSync(_404Dir)) {
          const { rmdirSync } = await import('node:fs');
          try {
            rmdirSync(_404Dir);
          } catch { /* non-empty dir, ignore */ }
        }
        console.log('[KISS SSG] 404 page → dist/404.html (GitHub Pages)');
      }

      // Convert flat HTML files to clean URLs: about.html → about/index.html
      const allHtmlFiles = findHtmlFiles(outputDir);
      for (const filePath of allHtmlFiles) {
        const rel = nodePath.relative(outputDir, filePath);
        if (rel.endsWith('index.html') || rel === '404.html' || rel.includes(nodePath.sep)) {
          continue;
        }
        const baseName = rel.replace(/\.html$/, '');
        const dirPath = join(outputDir, baseName);
        const indexPath = join(dirPath, 'index.html');
        if (existsSync(dirPath)) continue;
        nodeFs.mkdirSync(dirPath, { recursive: true });
        nodeFs.renameSync(filePath, indexPath);
        console.log(`[KISS SSG] Clean URL: /${baseName} → ${baseName}/index.html`);
      }

      console.log(`[KISS SSG] Static site generated → ${outputDir}`);

      const basePath = options.base || '/';

      // Inject client script tag into all HTML files
      // The client entry (built in Phase 2) contains:
      // - Custom element registration
      // - Lit hydrate() from @lit-labs/ssr-client
      // - Hydration strategy dispatch
      const clientManifestPath = join(root, outDir, 'client', '.vite', 'manifest.json');
      if (existsSync(clientManifestPath)) {
        try {
          const manifestRaw = readFileSync(clientManifestPath, 'utf-8');
          const manifest = JSON.parse(manifestRaw);
          // Find the client entry in the manifest
          // The key is the source path of .kiss/.kiss-client-entry.ts
          for (const [src, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
            if (src.includes('.kiss-client-entry') && entry.file) {
              const scriptSrc = `${basePath}client/${entry.file}`;
              const { injectClientScript } = await import('../ssg-postprocess.js');
              injectClientScript(outputDir, scriptSrc);
              console.log(`[KISS SSG] Client script injected: ${scriptSrc}`);
              break;
            }
          }
        } catch (err) {
          console.warn('[KISS SSG] Could not read client manifest for script injection:', err);
        }
      } else {
        console.warn('[KISS SSG] No client manifest found — run build:client (Phase 2) first');
      }

      // Post-process: rewrite island paths (fallback for any inline references)
      const { buildIslandChunkMap, rewriteHtmlFiles } = await import('../ssg-postprocess.js');
      const islandChunkMap = buildIslandChunkMap(root, outDir, islandTagNames, basePath);
      if (Object.keys(islandChunkMap).length > 0) {
        rewriteHtmlFiles(outputDir, islandChunkMap);
      }

      // Build observability: full manifest with HTML pages + budget warnings
      const { printBuildManifest } = await import('../build-manifest.js');
      printBuildManifest({
        root,
        outDir,
        phase: 3,
        headExtras: options.headExtras,
      });

      // Generate PWA files (manifest.json + sw.js) if options include PWA config
      const pwa = (options as Record<string, unknown>).pwa as
        | { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string }
        | undefined;
      if (pwa) {
        const manifest = {
          name: pwa.name || 'KISS App',
          short_name: pwa.shortName || 'KISS',
          start_url: basePath,
          display: 'standalone' as const,
          theme_color: pwa.themeColor || '#000000',
          background_color: pwa.backgroundColor || '#ffffff',
          icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
        };
        writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log('[KISS SSG] PWA manifest.json generated');

        // Simple CacheFirst service worker
        const swCode = `const CACHE = 'kiss-v1';
const PRECACHE = ['/', '/index.html'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put(req, r)); return r; });
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    caches.open(CACHE).then((c) => c.put(req, res.clone()));
    return res;
  } catch { return caches.match(req); }
}`;
        writeFileSync(join(outputDir, 'sw.js'), swCode);
        console.log('[KISS SSG] PWA sw.js generated');

        // Inject manifest link + sw registration into HTML files
        const manifestLink = `<link rel="manifest" href="${basePath}manifest.json">`;
        const swScript =
          `<script>addEventListener("load",()=>{navigator.serviceWorker?.register("${basePath}sw.js")})</script>`;
        const htmlFiles = findHtmlFiles(outputDir);
        for (const htmlPath of htmlFiles) {
          let html = readFileSync(htmlPath, 'utf-8');
          if (!html.includes('rel="manifest"')) {
            html = html.replace('</head>', `${manifestLink}</head>`);
          }
          if (!html.includes('serviceWorker')) {
            html = html.replace('</body>', `${swScript}</body>`);
          }
          writeFileSync(htmlPath, html);
        }
        console.log(`[KISS SSG] PWA: injected manifest + sw into ${htmlFiles.length} HTML files`);
      }
    } finally {
      await server.close();
    }
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  } finally {
    // Clean up CJS polyfill — don't leave global pollution
    delete (globalThis as Record<string, unknown>).module;
    delete (globalThis as Record<string, unknown>).exports;

    try {
      unlinkSync(tmpEntryPath);
    } catch { /* ignore */ }
  }
}

// CLI entry point
if (import.meta.main) {
  buildSSG().catch((err) => {
    console.error('[KISS SSG] Failed:', err);
    process.exit(1);
  });
}

export { buildSSG };
