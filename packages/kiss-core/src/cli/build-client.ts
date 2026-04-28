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
import { resolve, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { generateClientEntry, type ClientIslandEntry } from '../entry-generators.js';

interface BuildMetadata {
  islandTagNames: string[];
  packageIslands: Array<{ tagName: string; modulePath: string }>;
  root: string;
  outDir: string;
  base: string;
  resolveAlias: Record<string, string> | Array<{ find: string; replacement: string }> | null;
  ssrNoExternal: (string | { source: string; flags: string })[];
  islandsDir: string;
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
  const packageIslands = metadata.packageIslands || [];

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
    ...localIslands.map((tagName: string) => ({
      tagName,
      modulePath: resolve(root, `${islandsDir}/${tagName}.ts`).replace(/\\/g, '/'),
    })),
    ...packageIslands.map((island: { tagName: string; modulePath: string }) => ({
      tagName: island.tagName,
      modulePath: island.modulePath,
    })),
  ];

  const clientEntryCode = generateClientEntry(islandEntries);
  writeFileSync(clientEntryPath, clientEntryCode, 'utf-8');

  // Restore RegExp from JSON serialization
  // JSON.stringify turns RegExp into {} — we need to reconstruct them
  const noExternalPatterns = (metadata.ssrNoExternal || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'source' in item && 'flags' in item) {
      return new RegExp(item.source, item.flags);
    }
    return item;
  });

  const clientOutDir = resolve(root, outDir, 'client');
  const clientConfig: InlineConfig = {
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      outDir: clientOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: { client: clientEntryPath },
        output: {
          format: 'esm',
          entryFileNames: 'islands/[name].js',
          chunkFileNames: 'islands/[name]-[hash].js',
          // @ts-ignore — @types/rollup may not include manifest yet
          manifest: true,
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
    resolve: metadata.resolveAlias ? { alias: metadata.resolveAlias as Record<string, string> } : undefined,
    // SSR noExternal: ensures packages like @kissjs/ui (with decorators)
    // are bundled by Vite instead of left as bare imports
    ssr: {
      noExternal: noExternalPatterns.length > 0 ? noExternalPatterns : undefined,
    },
  };

  try {
    await viteBuild(clientConfig);
    console.log('[KISS] Client bundle built →', clientOutDir);
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
