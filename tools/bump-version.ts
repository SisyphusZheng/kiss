#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * bump-version — openElement release tooling
 *
 * Updates version across all workspace packages and root deno.json imports.
 *
 * WARNING (#687): this tool intentionally performs only HALF of a version
 * bump. It does NOT touch www/app/data/version.ts, roadmap.tsx,
 * tools/project-constants.ts, docs anchors, or the ui generated manifest —
 * those are completed by tools/autoflow/release.ts (updateProjectConstants +
 * updateCurrentVersionAnchors + generate:ui-manifest). Running it standalone
 * produces a misleading half-bumped tree; always run it through the autoflow
 * release flow (`deno task autoflow:release-prepare`), never by hand.
 *
 * Usage:
 *   deno run --allow-read --allow-write tools/bump-version.ts --to 0.41.0-alpha.7
 *   deno run --allow-read --allow-write tools/bump-version.ts --from 0.41.0-alpha.6 --to 0.41.0-beta.1
 *   deno run --allow-read --allow-write tools/bump-version.ts --to 0.41.0 --dry-run
 */

const PACKAGES_DIR = 'packages';

interface PackageJson {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

function getArg(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) {
    return Deno.args[idx + 1];
  }
  return null;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  prereleaseNumber: number;
}

export function parseVersion(version: string): ParsedVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  const [, major, minor, patch, pre] = match;
  if (!pre) {
    return {
      major: Number(major),
      minor: Number(minor),
      patch: Number(patch),
      prereleaseNumber: 0,
    };
  }
  const [label, numStr] = pre.split('.');
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: label,
    prereleaseNumber: numStr ? Number(numStr) : 0,
  };
}

const PRERELEASE_RANK: Record<string, number> = {
  alpha: 1,
  beta: 2,
  rc: 3,
};

export function validateVersionStep(fromVersion: string, toVersion: string): void {
  const from = parseVersion(fromVersion);
  const to = parseVersion(toVersion);

  const fromBase = from.major * 1_000_000 + from.minor * 1_000 + from.patch;
  const toBase = to.major * 1_000_000 + to.minor * 1_000 + to.patch;
  if (toBase < fromBase) {
    throw new Error(
      `Version step regresses the release base: ${fromVersion} → ${toVersion}`,
    );
  }

  // Same-base prerelease steps must not move backwards (e.g. beta → alpha).
  if (toBase === fromBase && from.prerelease && to.prerelease) {
    const fromRank = PRERELEASE_RANK[from.prerelease] ?? 99;
    const toRank = PRERELEASE_RANK[to.prerelease] ?? 99;
    if (
      toRank < fromRank ||
      (toRank === fromRank && to.prereleaseNumber < from.prereleaseNumber)
    ) {
      throw new Error(
        `Prerelease step regresses: ${fromVersion} → ${toVersion}`,
      );
    }
  }
}

function findPackageDenos(root: string): string[] {
  const paths: string[] = [];
  try {
    for (const entry of Deno.readDirSync(`${root}/${PACKAGES_DIR}`)) {
      if (entry.isDirectory) {
        const denoPath = `${root}/${PACKAGES_DIR}/${entry.name}/deno.json`;
        try {
          Deno.statSync(denoPath);
          paths.push(denoPath);
        } catch {
          // no deno.json in this package dir
        }
      }
    }
  } catch (err) {
    console.error(`Error reading packages directory: ${err}`);
    Deno.exit(1);
  }
  return paths;
}

function readJson(path: string): PackageJson {
  return JSON.parse(Deno.readTextFileSync(path)) as PackageJson;
}

function updateVersion(
  path: string,
  fromVersion: string,
  toVersion: string,
  dryRun: boolean,
): { updated: boolean; name: string; oldVersion: string } {
  const data = readJson(path);
  const name = data.name ?? path;
  const oldVersion = data.version ?? 'unknown';

  if (data.version && data.version === fromVersion) {
    if (!dryRun) {
      const text = Deno.readTextFileSync(path);
      const updated = text.replace(
        `"version": "${fromVersion}"`,
        `"version": "${toVersion}"`,
      );
      Deno.writeTextFileSync(path, updated);
    }
    return { updated: true, name, oldVersion };
  }

  return { updated: false, name, oldVersion };
}

function updateRootImports(
  root: string,
  fromVersion: string,
  toVersion: string,
  dryRun: boolean,
): number {
  const rootDeno = `${root}/deno.json`;
  const text = Deno.readTextFileSync(rootDeno);
  const fromPattern = `@^${fromVersion}`;
  const toPattern = `@^${toVersion}`;

  let count = 0;
  let updated = text;

  // Replace all @openelement/* imports
  while (updated.includes(fromPattern)) {
    updated = updated.replace(fromPattern, toPattern);
    count++;
  }

  if (count > 0 && !dryRun) {
    Deno.writeTextFileSync(rootDeno, updated);
  }

  return count;
}

function updatePackageImports(
  packageDenos: string[],
  fromVersion: string,
  toVersion: string,
  dryRun: boolean,
): number {
  const fromPattern = `@^${fromVersion}`;
  const toPattern = `@^${toVersion}`;
  let totalUpdated = 0;

  for (const path of packageDenos) {
    const text = Deno.readTextFileSync(path);
    if (!text.includes(fromPattern)) continue;

    let updated = text;
    let count = 0;
    while (updated.includes(fromPattern)) {
      updated = updated.replace(fromPattern, toPattern);
      count++;
    }

    if (count > 0 && !dryRun) {
      Deno.writeTextFileSync(path, updated);
    }
    totalUpdated += count;
  }

  return totalUpdated;
}

export function replaceEmbeddedCreateVersion(
  source: string,
  fromVersion: string,
  toVersion: string,
): string {
  const anchor = `'${fromVersion}'`;
  if (!source.includes(anchor)) {
    throw new Error(
      `Embedded @openelement/create version does not contain expected version ${fromVersion}.`,
    );
  }
  return source.replace(anchor, `'${toVersion}'`);
}

function updateEmbeddedCreateVersion(
  root: string,
  fromVersion: string,
  toVersion: string,
  dryRun: boolean,
): void {
  const path = `${root}/packages/create/src/version.ts`;
  const text = Deno.readTextFileSync(path);
  const updated = replaceEmbeddedCreateVersion(text, fromVersion, toVersion);
  if (!dryRun) {
    Deno.writeTextFileSync(path, updated);
  }
}

function main(): void {
  const root = Deno.cwd();
  const dryRun = Deno.args.includes('--dry-run');
  const toVersion = getArg('--to');
  const fromVersion = getArg('--from');

  if (!toVersion) {
    console.error('Usage: bump-version.ts --to <version> [--from <version>] [--dry-run]');
    Deno.exit(1);
  }

  // Find all package deno.json files
  const packageDenos = findPackageDenos(root);
  console.log(`Found ${packageDenos.length} package(s) in ${PACKAGES_DIR}/`);

  // Determine "from" version
  let resolvedFrom = fromVersion;
  if (!resolvedFrom) {
    // Read from first package
    const first = readJson(packageDenos[0]);
    resolvedFrom = first.version ?? 'unknown';
    console.log(`Detected current version: ${resolvedFrom}`);
  }

  if (resolvedFrom === toVersion) {
    console.log(`Already at version ${toVersion}. Nothing to do.`);
    return;
  }

  validateVersionStep(resolvedFrom, toVersion);

  console.log(`Bumping: ${resolvedFrom} → ${toVersion}${dryRun ? ' (dry-run)' : ''}`);
  console.log('');

  // Update package versions
  let updatedCount = 0;
  const mismatched: string[] = [];

  for (const path of packageDenos) {
    const result = updateVersion(path, resolvedFrom, toVersion, dryRun);
    if (result.updated) {
      updatedCount++;
      console.log(`  ✅ ${result.name}: ${result.oldVersion} → ${toVersion}`);
    } else if (result.oldVersion !== toVersion) {
      mismatched.push(`${result.name} (${result.oldVersion})`);
      console.log(`  ⚠️  ${result.name}: ${result.oldVersion} (skipped, not ${resolvedFrom})`);
    } else {
      console.log(`  ⏭️  ${result.name}: already ${toVersion}`);
    }
  }

  console.log('');
  console.log(`Updated ${updatedCount}/${packageDenos.length} packages.`);

  // Update root deno.json imports
  const importCount = updateRootImports(root, resolvedFrom, toVersion, dryRun);
  if (importCount > 0) {
    console.log(`Updated ${importCount} import(s) in root deno.json.`);
  }

  // Update cross-package imports in each package's deno.json
  const pkgImportCount = updatePackageImports(packageDenos, resolvedFrom, toVersion, dryRun);
  if (pkgImportCount > 0) {
    console.log(`Updated ${pkgImportCount} cross-package import(s).`);
  }

  updateEmbeddedCreateVersion(
    root,
    resolvedFrom,
    toVersion,
    dryRun,
  );

  // Report mismatches
  if (mismatched.length > 0) {
    console.log('');
    console.log(`⚠️  ${mismatched.length} package(s) not at expected version:`);
    for (const m of mismatched) {
      console.log(`     - ${m}`);
    }
  }

  // Validate alignment
  console.log('');
  console.log('Validating alignment...');

  let allAligned = true;
  for (const path of packageDenos) {
    const data = readJson(path);
    if (data.version !== toVersion) {
      allAligned = false;
      console.log(`  ❌ ${data.name}: ${data.version} ≠ ${toVersion}`);
    }
  }

  if (allAligned) {
    console.log(`  ✅ All ${packageDenos.length} packages aligned to ${toVersion}`);
  } else {
    console.log('  ❌ Version alignment check FAILED');
    if (!dryRun) Deno.exit(1);
  }

  console.log(dryRun ? '\n🔍 Dry-run complete. No changes made.' : '\n🚀 Version bump complete.');
}

if (import.meta.main) {
  main();
}
