/**
 * @kissjs/core - Build Manifest / Observability
 *
 * Scans build output directories after each phase and prints a structured
 * summary table. This gives developers visibility into:
 *   - Per-island chunk sizes (Phase 2)
 *   - Total JS/CSS bundle budgets (Phase 3)
 *   - HTML page counts and compression potential
 *   - headExtras injection size
 *
 * Output format: Fixed-width table via console.log (no external dependency).
 *
 * Called by:
 *   - cli/build-client.ts (after Phase 2: client chunks ready)
 *   - cli/build-ssg.ts    (after Phase 3: HTML + post-process complete)
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';

/** File size info for a single artifact */
export interface ArtifactInfo {
  name: string;
  path: string;
  sizeBytes: number;
  sizeKB: string;
}

/** Full build manifest summary */
export interface BuildManifest {
  phase: 1 | 2 | 3;
  timestamp: string;
  islands: ArtifactInfo[];
  clientEntry: ArtifactInfo | null;
  htmlPages: ArtifactInfo[];
  totalJsBytes: number;
  totalHtmlBytes: number;
  headExtrasSize: number;
  /** Budget warnings (files > threshold) */
  warnings: string[];
}

/**
 * Format bytes to human-readable string.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 10) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Recursively collect all matching files with their sizes.
 */
function collectFiles(
  dir: string,
  extension: string,
  basePath = '',
): ArtifactInfo[] {
  const results: ArtifactInfo[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extension, relPath));
    } else if (entry.name.endsWith(extension)) {
      try {
        const stat = statSync(fullPath);
        results.push({
          name: entry.name,
          path: relPath,
          sizeBytes: stat.size,
          sizeKB: formatSize(stat.size),
        });
      } catch (e) {
        console.warn(`[KISS] Cannot stat ${relPath}: ${(e as Error).message}`);
      }
    }
  }
  return results;
}

/**
 * Scan client build output (dist/client/) for island chunks.
 */
export function scanClientBuild(
  root: string,
  outDir: string = 'dist',
): { islands: ArtifactInfo[]; clientEntry: ArtifactInfo | null; totalJsBytes: number } {
  const clientDir = resolve(root, outDir, 'client');
  const islands: ArtifactInfo[] = [];
  let clientEntry: ArtifactInfo | null = null;
  let totalJsBytes = 0;

  // Scan islands/ subdirectory (single pass — avoid redundant directory scans)
  const islandsDir = join(clientDir, 'islands');
  if (existsSync(islandsDir)) {
    const files = readdirSync(islandsDir);
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const fullPath = join(islandsDir, file);
      try {
        const fileStat = statSync(fullPath);
        if (file === 'client.js') {
          // Client entry (shared hydration runtime)
          clientEntry = {
            name: 'client.js',
            path: 'islands/client.js',
            sizeBytes: fileStat.size,
            sizeKB: formatSize(fileStat.size),
          };
        } else {
          // Island chunk or shared chunk
          const _isIslandChunk = /^island-(.+?)-[A-Za-z0-9]+\.js$/.test(file);
          islands.push({
            name: file,
            path: `islands/${file}`,
            sizeBytes: fileStat.size,
            sizeKB: formatSize(fileStat.size),
          });
        }
        totalJsBytes += fileStat.size;
      } catch (e) {
        console.warn(`[KISS] Cannot stat ${file}: ${(e as Error).message}`);
      }
    }
  }

  return { islands, clientEntry, totalJsBytes };
}

/**
 * Scan SSG output (dist/*.html) for page information.
 */
export function scanSSGOutput(
  root: string,
  outDir: string = 'dist',
): ArtifactInfo[] {
  const distDir = resolve(root, outDir);
  return collectFiles(distDir, '.html');
}

/**
 * Print a formatted build manifest table to console.
 *
 * This is called at the end of each build phase to provide observability
 * into what was produced and how large everything is.
 */
export function printBuildManifest(options: {
  root: string;
  outDir?: string;
  phase: 2 | 3;
  headExtras?: string;
}): BuildManifest {
  const { root, outDir = 'dist', phase, headExtras = '' } = options;
  const timestamp = new Date().toISOString();

  // Gather data
  const clientData = scanClientBuild(root, outDir);
  const htmlPages = phase === 3 ? scanSSGOutput(root, outDir) : [];
  const headExtrasSize = new TextEncoder().encode(headExtras).length;

  // Budget thresholds
  const ISLAND_BUDGET_KB = 50; // Warn if single island > 50KB
  const TOTAL_JS_BUDGET_KB = 200; // Warn if total JS > 200KB
  const PAGE_BUDGET_KB = 100; // Warn if single HTML page > 100KB (uncompressed)

  const warnings: string[] = [];

  // Check island budgets
  for (const island of clientData.islands) {
    if (island.sizeBytes > ISLAND_BUDGET_KB * 1024) {
      warnings.push(`⚠️  ${island.name} (${island.sizeKB}) exceeds ${ISLAND_BUDGET_KB} KB budget`);
    }
  }

  // Check total JS budget
  if (clientData.totalJsBytes > TOTAL_JS_BUDGET_KB * 1024) {
    warnings.push(
      `⚠️  Total JS (${
        formatSize(clientData.totalJsBytes)
      }) exceeds ${TOTAL_JS_BUDGET_KB} KB budget`,
    );
  }

  // Check page sizes
  for (const page of htmlPages) {
    if (page.sizeBytes > PAGE_BUDGET_KB * 1024) {
      warnings.push(
        `⚠️  ${page.path} (${page.sizeKB}) exceeds ${PAGE_BUDGET_KB} KB — consider compression`,
      );
    }
  }

  const manifest: BuildManifest = {
    phase,
    timestamp,
    islands: clientData.islands,
    clientEntry: clientData.clientEntry,
    htmlPages,
    totalJsBytes: clientData.totalJsBytes,
    totalHtmlBytes: htmlPages.reduce((sum, p) => sum + p.sizeBytes, 0),
    headExtrasSize,
    warnings,
  };

  // ─── Print table ───
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log(
    `║  KISS Build Manifest — Phase ${phase} @ ${timestamp.slice(11, 19)}              ║`,
  );
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Island chunks (Phase 2+)
  if (manifest.islands.length > 0 || manifest.clientEntry) {
    console.log('\n  📦 Client Islands:');
    console.log('  ┌────────────────────────────┬──────────┐');
    console.log('  │ File                       │ Size     │');
    console.log('  ├────────────────────────────┼──────────┤');

    for (const island of manifest.islands) {
      // Truncate long hash names for display
      const displayName = island.name.length > 30 ? island.name.slice(0, 27) + '...' : island.name;
      console.log(`  │ ${displayName.padEnd(26)} │ ${island.sizeKB.padEnd(8)} │`);
    }

    if (manifest.clientEntry) {
      console.log(
        `  │ ${'client.js (entry)'.padEnd(26)} │ ${manifest.clientEntry.sizeKB.padEnd(8)} │`,
      );
    }

    console.log('  ├────────────────────────────┼──────────┤');
    console.log(`  │ ${'TOTAL JS'.padEnd(26)} │ ${formatSize(manifest.totalJsBytes).padEnd(8)} │`);
    console.log('  └────────────────────────────┴──────────┘');
  } else {
    console.log('\n  📦 Client Islands: (none — zero client JS)');
  }

  // HTML pages (Phase 3 only)
  if (phase === 3 && manifest.htmlPages.length > 0) {
    console.log(
      `\n  📄 HTML Pages (${manifest.htmlPages.length} files, ${
        formatSize(manifest.totalHtmlBytes)
      } total):`,
    );

    // Group pages by directory depth for cleaner display
    const maxShow = 15;
    const shown = manifest.htmlPages.slice(0, maxShow);
    for (const page of shown) {
      const displayName = page.path.length > 40 ? page.path.slice(0, 37) + '...' : page.path;
      console.log(`    • ${displayName}  (${page.sizeKB})`);
    }
    if (manifest.htmlPages.length > maxShow) {
      console.log(`    ... +${manifest.htmlPages.length - maxShow} more pages`);
    }
  }

  // headExtras
  if (manifest.headExtrasSize > 0) {
    console.log(
      `\n  🔧 headExtras: ${
        formatSize(manifest.headExtrasSize)
      } (${manifest.headExtrasSize} bytes injected)`,
    );
  }

  // Warnings
  if (warnings.length > 0) {
    console.log('\n  ⚠️  Budget Warnings:');
    for (const w of warnings) {
      console.log(`     ${w}`);
    }
  } else {
    console.log('\n  ✅ All artifacts within budget limits');
  }

  console.log('');

  return manifest;
}
