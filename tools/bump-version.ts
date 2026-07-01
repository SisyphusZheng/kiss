#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * bump-version — v0.35.6 (Cell 001)
 *
 * Updates version across all 19 packages and root deno.json imports.
 *
 * Usage:
 *   deno run --allow-read --allow-write tools/bump-version.ts --to 0.35.6
 *   deno run --allow-read --allow-write tools/bump-version.ts --from 0.35.4 --to 0.35.6
 *   deno run --allow-read --allow-write tools/bump-version.ts --to 0.35.6 --dry-run
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

main();
