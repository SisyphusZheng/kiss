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
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import type { FrameworkOptions, PackageIslandMeta } from '../types.js';

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
  } catch {
    console.log('[KISS] No .kiss/build-metadata.json found — using provided island list');
  }

  // Generate SSG entry code
  const { scanRoutes } = await import('../route-scanner.js');
  const { scanIslands, fileToTagName } = await import('../route-scanner.js');
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
            experimentalDecorators: true,
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
        throw new Error(`[KISS SSG] Failed to load Hono app from .kiss-ssg-entry.ts`);
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
    } finally {
      await server.close();
    }
  } catch (err) {
    throw new Error(`[KISS SSG] Failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
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
