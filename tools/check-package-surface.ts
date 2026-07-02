import { PACKAGE_COUNT } from './project-constants.ts';
import { readPackages, releasePublishOrder } from './lib/package-graph.ts';
import { OPENELEMENT_EXPORT_FILES } from '../packages/adapter-vite/src/ssg-package-resolver.ts';

const retainedPackages = [
  '@openelement/app',
  '@openelement/adapter-vite',
  '@openelement/content',
  '@openelement/core',
  '@openelement/create',
  '@openelement/element',
  '@openelement/protocol',
  '@openelement/router',
  '@openelement/signal',
  '@openelement/ssg',
  '@openelement/ui',
].sort();

const removedPackages = [
  '@openelement/adapter-lit',
  '@openelement/adapter-react',
  '@openelement/adapter-vanilla',
  '@openelement/cem',
  '@openelement/compat-check',
  '@openelement/elements',
  '@openelement/hub',
  '@openelement/protocols',
  '@openelement/rpc',
  '@openelement/runtime',
  '@openelement/signals',
  '@openelement/style-sheet',
].sort();

const failures: string[] = [];

function normalizeExports(exports: unknown): Record<string, string> {
  if (typeof exports === 'string') return { '.': exports.replace(/^\.\//, '') };
  if (!exports || typeof exports !== 'object') return {};
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(exports as Record<string, unknown>)) {
    if (typeof value !== 'string') continue;
    entries[key.replace(/^\.\//, '')] = value.replace(/^\.\//, '');
  }
  return Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );
}

const packages = releasePublishOrder(await readPackages());
const releasePackages = packages.map((pkg) => pkg.name).sort();
if (PACKAGE_COUNT !== retainedPackages.length) {
  failures.push(`PACKAGE_COUNT is ${PACKAGE_COUNT}, expected ${retainedPackages.length}.`);
}
if (JSON.stringify(releasePackages) !== JSON.stringify(retainedPackages)) {
  failures.push(
    `Release package order mismatch. expected=${retainedPackages.join(', ')} actual=${
      releasePackages.join(', ')
    }`,
  );
}

for (const pkg of packages) {
  try {
    const info = await Deno.stat(pkg.dir);
    if (!info.isDirectory) failures.push(`${pkg.dir} is not a directory.`);
  } catch {
    failures.push(`${pkg.dir} is missing.`);
  }
}

for (const pkg of packages) {
  const shortName = pkg.name.replace('@openelement/', '');
  const resolverExports = OPENELEMENT_EXPORT_FILES[shortName];
  if (!resolverExports) continue;
  const actualExports = normalizeExports(pkg.exports);
  const expected = Object.fromEntries(
    Object.entries(resolverExports)
      .map(([key, value]) => [key, value.replace(/^\.\//, '')])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  if (JSON.stringify(actualExports) !== JSON.stringify(expected)) {
    failures.push(
      `${pkg.name} exports drift from adapter-vite resolver map. expected=${
        JSON.stringify(actualExports)
      } actual=${JSON.stringify(expected)}`,
    );
  }
}

for (const pkg of removedPackages) {
  const dir = `packages/${pkg.replace('@openelement/', '')}`;
  try {
    await Deno.stat(dir);
    failures.push(`${dir} must be removed from the v0.40 package graph.`);
  } catch {
    // Expected.
  }
}

const docs = await Deno.readTextFile('docs/current/PACKAGE_SURFACE.md');
for (const pkg of retainedPackages) {
  if (!docs.includes(`\`${pkg}\``)) {
    failures.push(`${pkg} missing from docs/current/PACKAGE_SURFACE.md.`);
  }
}
for (const pkg of removedPackages) {
  const currentSection = docs.split('## Removed from current graph')[0] ?? docs;
  if (currentSection.includes(`\`${pkg}\``)) {
    failures.push(`${pkg} must not appear as a current package in PACKAGE_SURFACE.md.`);
  }
}

for (const required of ['11-package', 'v0.40.x', 'ADR-0105']) {
  if (!docs.includes(required)) {
    failures.push(`PACKAGE_SURFACE.md missing required anchor: ${required}`);
  }
}

if (failures.length > 0) {
  console.error('Package surface check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log('Package surface check passed (11 packages retained).');
