/**
 * @kissjs/core - CLI: Client Island Build
 *
 * Standalone client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * This is Phase 2 of the KISS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .kiss/ metadata
 *   Phase 2 (this script): Client island chunks
 *   Phase 3 (build-ssg.ts): SSG rendering + post-processing
 *
 * Extracting this from closeBundle fixes:
 *   - Watch mode: no nested viteBuild() inside Vite hooks
 *   - Error stacks: single Vite instance, clear traceability
 *   - Observability: each phase runs independently with clear logging
 *
 * Usage:
 *   deno run -A jsr:@kissjs/core/cli/build-client
 *   deno task build:client
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { resolve, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { generateClientEntry, type ClientIslandEntry } from '../entry-generators.js';

interface BuildClientOptions {
  root?: string;
  outDir?: string;
  islandsDir?: string;
  resolveAlias?: Record<string, string> | import('vite').Alias[];
}

async function buildClient(options: BuildClientOptions = {}): Promise<void> {
  const root = options.root || process.cwd();
  const outDir = options.outDir || 'dist';
  const islandsDir = options.islandsDir || 'app/islands';

  // Read island metadata from Phase 1 output
  const metadataPath = join(root, '.kiss', 'build-metadata.json');
  let metadata: { islandTagNames: string[]; packageIslands: Array<{ tagName: string; modulePath: string }> };

  try {
    const raw = readFileSync(metadataPath, 'utf-8');
    metadata = JSON.parse(raw);
  } catch {
    console.log('[KISS] No .kiss/build-metadata.json found — skipping client build');
    console.log('[KISS] Run `vite build` first (Phase 1) to generate island metadata');
    return;
  }

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
    resolve: options.resolveAlias ? { alias: options.resolveAlias } : undefined,
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
