/**
 * Validate the openElement package dependency graph.
 *
 * Checks:
 * - all package deno.json files under packages/ are readable
 * - all package versions are on one release line
 * - internal npm:@openelement/* specifiers point at that release line
 * - source-level @openelement/* imports are declared in each package deno.json
 * - no circular package dependencies exist
 * - release publish order lists every package after its dependencies
 */

import { PACKAGE_COUNT, PACKAGE_VERSION } from './project-constants.ts';
import {
  buildDependencyGraph,
  detectCycles,
  extractOpenImports,
  type PackageInfo,
  readPackages,
  releasePublishOrder,
  topologicalSort,
} from './lib/package-graph.ts';

function normalizeDep(dep: string, self: string): string | null {
  const prefix = '@openelement/';
  if (!dep.startsWith(prefix)) return dep;

  const rest = dep.slice(prefix.length);
  const slashIdx = rest.indexOf('/');
  const base = slashIdx === -1 ? dep : prefix + rest.slice(0, slashIdx);
  return base === self ? null : base;
}

async function collectTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    for await (const entry of Deno.readDir(current)) {
      const path = `${current}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        await walk(path);
      } else if (entry.isFile && path.endsWith('.ts')) {
        files.push(path);
      }
    }
  }

  try {
    await walk(dir);
  } catch {
    // Packages without src are allowed.
  }

  return files;
}

function isDeclaredImport(
  specifier: string,
  pkg: PackageInfo,
  workspaceSpecifiers: Set<string>,
): boolean {
  const base = normalizeDep(specifier, pkg.name);
  if (base === null) return true;
  if (workspaceSpecifiers.has(specifier) || workspaceSpecifiers.has(base)) return true;
  return pkg.importKeys.has(specifier) || pkg.importKeys.has(base);
}

function collectWorkspaceSpecifiers(packages: PackageInfo[]): Set<string> {
  const specifiers = new Set<string>();
  for (const pkg of packages) {
    specifiers.add(pkg.name);
    const exports = pkg.exports;
    if (typeof exports === 'object' && exports !== null) {
      for (const key of Object.keys(exports)) {
        specifiers.add(`${pkg.name}${key === '.' ? '' : key}`);
      }
    }
  }
  return specifiers;
}

function validateVersionConsistency(packages: PackageInfo[], failures: string[]): string | null {
  const versions = new Map<string, string[]>();
  for (const pkg of packages) {
    const list = versions.get(pkg.version) ?? [];
    list.push(pkg.name);
    versions.set(pkg.version, list);
  }

  if (versions.size !== 1) {
    for (const [version, names] of versions) {
      failures.push(`Package version ${version || '<missing>'}: ${names.join(', ')}`);
    }
    return null;
  }

  return packages[0]?.version ?? null;
}

function parseInternalSpecifier(value: string): { packageName: string; version: string } | null {
  const match = value.match(/^npm:(@openelement\/[^@/]+)@\^?(\d+\.\d+\.\d+)(?:\/.*)?$/);
  if (!match) return null;
  return { packageName: match[1], version: match[2] };
}

function validateInternalRanges(
  packages: PackageInfo[],
  releaseVersion: string | null,
  failures: string[],
): void {
  if (!releaseVersion) return;
  for (const pkg of packages) {
    for (const [key, value] of Object.entries(pkg.importValues)) {
      if (!value.startsWith('npm:@openelement/')) continue;
      const parsed = parseInternalSpecifier(value);
      if (!parsed) {
        failures.push(
          `${pkg.dir}/deno.json import "${key}" has invalid internal specifier: ${value}`,
        );
        continue;
      }
      if (parsed.version !== releaseVersion) {
        failures.push(
          `${pkg.dir}/deno.json import "${key}" points to ${parsed.packageName}@${parsed.version}; ` +
            `expected ${releaseVersion}.`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const failures: string[] = [];

  const packages = await readPackages();
  const publishSteps = releasePublishOrder(packages);
  const publishOrder = publishSteps.map((pkg) => pkg.name);

  console.log(`Publish order (${publishOrder.length} packages):`);
  for (const [index, step] of publishSteps.entries()) {
    console.log(`  ${index + 1}. ${step.name} (${step.dir})`);
  }

  console.log(`\nRead ${packages.length} packages:`);
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} -> deps: [${pkg.deps.join(', ') || 'none'}]`);
  }
  if (packages.length !== PACKAGE_COUNT) {
    failures.push(`Expected ${PACKAGE_COUNT} packages, found ${packages.length}.`);
  }

  console.log('\n--- Version Line Validation ---');
  const releaseVersion = validateVersionConsistency(packages, failures);
  if (releaseVersion && releaseVersion !== PACKAGE_VERSION) {
    failures.push(
      `Package graph version ${releaseVersion} does not match PACKAGE_VERSION ${PACKAGE_VERSION}.`,
    );
  }
  validateInternalRanges(packages, releaseVersion, failures);
  if (releaseVersion) {
    console.log(`  PASS: all packages and internal npm ranges use ${releaseVersion}.`);
  }

  const graph = buildDependencyGraph(packages);

  console.log('\n--- Cycle Detection ---');
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      const msg = `Circular dependency detected: ${cycle.join(' -> ')}`;
      console.error(`  FAIL: ${msg}`);
      failures.push(msg);
    }
  } else {
    console.log('  PASS: No circular dependencies found.');
  }

  console.log('\n--- Source Import Declarations ---');
  const importFailuresBefore = failures.length;
  const workspaceSpecifiers = collectWorkspaceSpecifiers(packages);
  for (const pkg of packages) {
    const sourceFiles = await collectTsFiles(`${pkg.dir}/src`);
    for (const file of sourceFiles) {
      const source = await Deno.readTextFile(file);
      for (const specifier of extractOpenImports(source)) {
        if (!isDeclaredImport(specifier, pkg, workspaceSpecifiers)) {
          const msg =
            `${file} imports "${specifier}" but ${pkg.dir}/deno.json does not declare it.`;
          console.error(`  FAIL: ${msg}`);
          failures.push(msg);
        }
      }
    }
  }
  if (failures.length === importFailuresBefore) {
    console.log('  PASS: All source-level @openelement/* imports are declared.');
  }

  console.log('\n--- Topological Sort ---');
  let topoOrder: string[] = [];
  try {
    topoOrder = topologicalSort(graph);
    console.log(`  Order: ${topoOrder.join(' -> ')}`);
  } catch (err) {
    const msg = `Topological sort failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`  FAIL: ${msg}`);
    failures.push(msg);
  }

  if (topoOrder.length > 0) {
    console.log('\n--- Publish Order Validation ---');
    const pkgDeps = new Map(packages.map((pkg) => [pkg.name, pkg.deps]));
    const publishPos = new Map<string, number>();
    publishOrder.forEach((pkg, index) => publishPos.set(pkg, index));

    for (let i = 0; i < publishOrder.length; i++) {
      const pkg = publishOrder[i];
      const normalizedDeps = (pkgDeps.get(pkg) ?? [])
        .map((dep) => normalizeDep(dep, pkg))
        .filter((dep): dep is string => dep !== null);

      for (const dep of normalizedDeps) {
        const depPos = publishPos.get(dep);
        if (depPos !== undefined && depPos > i) {
          const msg = `Publish order violation: "${pkg}" (pos ${i + 1}) depends on ` +
            `"${dep}" (pos ${depPos + 1}), but "${dep}" is published after "${pkg}".`;
          console.error(`  FAIL: ${msg}`);
          failures.push(msg);
        }
      }
    }

    const graphNames = new Set(packages.map((pkg) => pkg.name));
    for (const pkg of publishOrder) {
      if (!graphNames.has(pkg)) {
        const msg = `"${pkg}" is in the derived publish order but not found in packages/.`;
        console.error(`  FAIL: ${msg}`);
        failures.push(msg);
      }
    }

    const publishNames = new Set(publishOrder);
    for (const pkg of packages) {
      if (!publishNames.has(pkg.name)) {
        const msg =
          `"${pkg.name}" exists in packages/ but is missing from the derived publish order.`;
        console.error(`  FAIL: ${msg}`);
        failures.push(msg);
      }
    }

    if (failures.length === 0) {
      console.log('  PASS: Publish order is consistent with dependency graph.');
    }
  }

  console.log('\n--- Package Versions ---');
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} (${pkg.deps.length} internal deps)`);
  }

  if (failures.length > 0) {
    console.error(`\nPackage graph check FAILED with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    Deno.exit(1);
  }

  console.log(
    `\nPackage graph check passed (${packages.length} packages, ${publishOrder.length} publish steps).`,
  );
}

await main();
