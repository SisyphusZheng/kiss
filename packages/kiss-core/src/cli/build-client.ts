/**
 * @kissjs/core - CLI: Client Island Build
 *
 * Standalone client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * This is Phase 2 of the KISS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .kiss/build-metadata.json
 *   Phase 2 (this script): Client island chunks
 *   Phase 3 (build-ssg.ts): SSG rendering + post-processing
 *
 * Usage:
 *   deno run -A jsr:@kissjs/core/cli/build-client
 *   deno task build:client
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  type ClientIslandEntry,
  generateClientEntry,
  type HydrationStrategy,
} from '../entry-generators.js';

interface BuildMetadata {
  islandTagNames: string[];
  islandFiles: string[];
  packageIslands: Array<{ tagName: string; modulePath: string }>;
  root: string;
  outDir: string;
  base: string;
  resolveAlias: Record<string, string> | Array<{ find: string; replacement: string }> | null;
  ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[];
  islandsDir: string;
  /** @deprecated Since v0.3.0 — client entry always uses Lit hydrate() from @lit-labs/ssr-client */
  hydrationStrategy?: HydrationStrategy;
}

async function buildClient(): Promise<void> {
  const root = process.cwd();

  // Read island metadata from Phase 1 output
  const metadataPath = join(root, '.kiss', 'build-metadata.json');
  let metadata: BuildMetadata;

  try {
    const raw = readFileSync(metadataPath, 'utf-8');
    metadata = JSON.parse(raw);
  } catch {
    console.log('[KISS] No .kiss/build-metadata.json found — skipping client build');
    console.log('[KISS] Run `vite build` first (Phase 1) to generate island metadata');
    return;
  }

  const outDir = metadata.outDir || 'dist';
  const islandsDir = metadata.islandsDir || 'app/islands';
  const localIslands = metadata.islandTagNames || [];
  const localIslandFiles = metadata.islandFiles || [];
  const packageIslands = metadata.packageIslands || [];

  // Debug: log resolve aliases for CI troubleshooting
  if (metadata.resolveAlias) {
    console.log('[KISS] resolveAlias:', JSON.stringify(metadata.resolveAlias, null, 2));
  } else {
    console.log('[KISS] WARNING: no resolveAlias in build metadata — island imports may fail');
  }

  if (localIslands.length === 0 && packageIslands.length === 0) {
    console.log('[KISS] No islands found — zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslands.length;
  console.log(`[KISS] Building client bundle for ${totalIslands} island(s)...`);

  // Auto-generate client entry from island list
  const kissTmpDir = join(root, '.kiss');
  mkdirSync(kissTmpDir, { recursive: true });
  const clientEntryPath = join(kissTmpDir, '.kiss-client-entry.ts');

  const islandEntries: ClientIslandEntry[] = [
    ...localIslands.map((tagName: string, i: number) => ({
      tagName,
      // Use file path if available (supports subdirectory islands),
      // fall back to tagName.ts for backward compat
      modulePath: resolve(
        root,
        localIslandFiles[i]
          ? `${islandsDir}/${localIslandFiles[i]}`
          : `${islandsDir}/${tagName}.ts`,
      ).replace(/\\/g, '/'),
      isPackage: false,
    })),
    ...packageIslands.map((island: { tagName: string; modulePath: string }) => ({
      tagName: island.tagName,
      modulePath: island.modulePath,
      isPackage: true,
    })),
  ];

  const clientEntryCode = generateClientEntry(islandEntries, metadata.hydrationStrategy || 'lazy');
  writeFileSync(clientEntryPath, clientEntryCode, 'utf-8');

  // Restore RegExp from JSON serialization
  // JSON.stringify turns RegExp into {} — we reconstruct via __type marker
  const noExternalPatterns = (metadata.ssrNoExternal || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && (item as Record<string, unknown>).__type === 'RegExp') {
      return new RegExp(
        (item as { source: string; flags: string }).source,
        (item as { source: string; flags: string }).flags,
      );
    }
    return item;
  });

  const clientOutDir = resolve(root, outDir, 'client');
  // base must match the deployed URL prefix for client assets.
  // The SSG output places client JS at /client/islands/*.js,
  // so the client build's base must be '/client/' so that
  // Vite generates correct dynamic-import URLs (__vite__mapDeps).
  // Without this, preload links point to /islands/*.js (404)
  // instead of /client/islands/*.js.
  const clientBase = metadata.base || '/';
  const clientConfig: InlineConfig = {
    configFile: false,
    root,
    base: `${clientBase}client/`,
    logLevel: 'warn',
    build: {
      outDir: clientOutDir,
      emptyOutDir: true,
      // @ts-ignore — Vite's own manifest option (not Rollup's)
      manifest: true,
      rollupOptions: {
        input: { client: clientEntryPath },
        output: {
          format: 'esm',
          entryFileNames: 'islands/[name].js',
          chunkFileNames: 'islands/[name]-[hash].js',
          manualChunks(id: string) {
            if (id.includes(`/${islandsDir}/`)) {
              const match = id.match(/\/([^/]+)\.(ts|js)$/);
              if (match) return `island-${match[1]}`;
            }
            for (const island of packageIslands) {
              if (id.includes(island.modulePath)) return `island-${island.tagName}`;
            }
          },
        },
      },
    },
    // Pass user's resolve alias from Phase 1 so island imports resolve correctly
    resolve: metadata.resolveAlias
      ? { alias: metadata.resolveAlias as Record<string, string> }
      : undefined,
    // SSR noExternal: ensures packages like @kissjs/ui (with decorators)
    // are bundled by Vite instead of left as bare imports
    ssr: {
      noExternal: (noExternalPatterns.length > 0 ? noExternalPatterns : undefined) as
        | (string | RegExp)[]
        | undefined,
    },
  };

  try {
    await viteBuild(clientConfig);
    console.log('[KISS] Client bundle built →', clientOutDir);

    // Build observability: print manifest with island sizes
    const { printBuildManifest } = await import('../build-manifest.js');
    printBuildManifest({ root, outDir, phase: 2 });
  } catch (error) {
    console.error('[KISS] Client build failed:', error);
    throw error;
  }
}

// CLI entry point
if (import.meta.main) {
  buildClient().catch((err) => {
    console.error('[KISS] Client build failed:', err);
    process.exit(1);
  });
}

export { buildClient };
