/** CEM manifest discovery and compatibility classification. */
import type { CompatibilityClassification } from '@openelement/protocol/framework';
import { createLogger } from '@openelement/core/logger';
import { join } from 'node:path';
import { classifyCemManifest, parseCem } from './cem-compat.ts';
import { safeReadDir, safeReadFile } from './route-scanner-fs.ts';

const log = createLogger('core');

// ─── CEM Auto-Detection (v0.18.0) ─────────────────────────────────────────

/** Result of scanning node_modules for CEM manifests */
export interface CemScanResult {
  /** Package name (e.g. '@openelement/ui') */
  packageName: string;
  /** Absolute path to custom-elements.json */
  cemPath: string;
  /** Raw JSON content */
  json: string;
}

/**
 * Scan node_modules for packages that ship a `custom-elements.json`.
 *
 * Strategy:
 *   1. Read node_modules directory entries (top-level packages + scoped orgs)
 *   2. For each package, check if `<pkg>/custom-elements.json` exists
 *   3. Return the raw JSON - caller is responsible for parsing + classifying
 *
 * This function reads files only. It never imports or executes package code.
 *
 * @param nodeModulesDir - Absolute path to the node_modules directory
 * @returns Array of found CEM manifests
 */
export async function scanCemManifests(
  nodeModulesDir: string,
): Promise<CemScanResult[]> {
  const results: CemScanResult[] = [];

  const entries = await safeReadDir(nodeModulesDir);
  if (!entries) return results;

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    if (entry.startsWith('@')) {
      // Scoped package directory - recurse one level
      const scopeDir = join(nodeModulesDir, entry);
      const scopedEntries = await safeReadDir(scopeDir);
      if (!scopedEntries) continue;
      for (const scopedEntry of scopedEntries) {
        if (scopedEntry.startsWith('.')) continue;
        const packageName = `${entry}/${scopedEntry}`;
        const cemPath = join(nodeModulesDir, entry, scopedEntry, 'custom-elements.json');
        const result = await tryReadCemFile(cemPath, packageName);
        if (result) results.push(result);
      }
    } else {
      // Regular (non-scoped) package
      const cemPath = join(nodeModulesDir, entry, 'custom-elements.json');
      const result = await tryReadCemFile(cemPath, entry);
      if (result) results.push(result);
    }
  }

  return results;
}

/**
 * Try to read a custom-elements.json file.
 * Returns null if the file doesn't exist or can't be read.
 */
async function tryReadCemFile(
  cemPath: string,
  packageName: string,
): Promise<CemScanResult | null> {
  const json = await safeReadFile(cemPath);
  return json === undefined ? null : { packageName, cemPath, json };
}

/**
 * Run CEM auto-detection: scan node_modules, parse each manifest,
 * and classify all discovered components.
 *
 * This is the high-level function called from the Vite plugin buildStart().
 * It combines scanCemManifests() + parseCem() + classifyCemManifest()
 * into a single pipeline.
 *
 * @param nodeModulesDir - Absolute path to node_modules
 * @returns Array of compatibility classifications (may be empty if no CEM found)
 */
export async function detectAndClassifyCemPackages(
  nodeModulesDir: string,
): Promise<CompatibilityClassification[]> {
  const cemResults = await scanCemManifests(nodeModulesDir);
  if (cemResults.length === 0) return [];

  const allClassifications: CompatibilityClassification[] = [];

  for (const { packageName, json } of cemResults) {
    const parseResult = parseCem(json);
    if (!parseResult.success || !parseResult.manifest) {
      log.debug(
        `Skipping invalid CEM manifest from "${packageName}": ` +
          parseResult.errors.map((e) => e.message).join('; '),
      );
      continue;
    }

    // Attach package name to the manifest for better diagnostics
    const manifest = { ...parseResult.manifest, packageName };
    const classResult = classifyCemManifest(manifest);

    // Log summary
    const { stats } = classResult;
    if (stats.totalComponents > 0) {
      log.info(
        `CEM: ${packageName} - ${stats.totalComponents} component(s): ` +
          `${stats.ssrCapableCount} ssr-capable, ${stats.clientOnlyCount} client-only` +
          (stats.rejectedCount > 0 ? `, ${stats.rejectedCount} rejected` : '') +
          (stats.experimentalDomCount > 0 ? `, ${stats.experimentalDomCount} experimental` : ''),
      );
    }

    allClassifications.push(...classResult.classifications);
  }

  return allClassifications;
}
