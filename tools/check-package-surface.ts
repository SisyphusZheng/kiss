import {
  PACKAGE_COUNT,
  REMOVED_PACKAGE_NAMES,
  RETAINED_PACKAGE_NAMES,
} from './project-constants.ts';
import { readPackages, releasePublishOrder } from './lib/package-graph.ts';
import { OPENELEMENT_EXPORT_FILES } from '../packages/adapter-vite/src/generated-export-files.ts';

const retainedPackages = [...RETAINED_PACKAGE_NAMES].sort();
const removedPackages = [...REMOVED_PACKAGE_NAMES].sort();

const failures: string[] = [];
const retiredImport =
  /(?:^|\n)\s*(?:(?:import|export)[^\n]*from\s+['"]|import\s*\(\s*['"]|\/\*\*?\s*@jsxImportSource\s+)@openelement\/(?:core|signal|router|protocol|content|ssg)(?:\/|['"])/;

async function rejectRetiredImports(dir: string): Promise<void> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (!['dist', 'node_modules', 'vendor', 'content'].includes(entry.name)) {
        await rejectRetiredImports(path);
      }
    } else if (
      !entry.name.startsWith('_generated') && /\.(?:ts|tsx|js|jsx|json|md)$/.test(entry.name)
    ) {
      const text = await Deno.readTextFile(path);
      if (retiredImport.test(text)) failures.push(`${path} imports a retired package surface.`);
    }
  }
}

for (const dir of ['packages', 'examples', 'www/app', 'tools/third-party-wc-smoke']) {
  await rejectRetiredImports(dir);
}

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
        JSON.stringify(expected)
      } actual=${JSON.stringify(actualExports)}`,
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

for (const required of ['5-package', '0.41.x stable', 'ADR-0113']) {
  if (!docs.includes(required)) {
    failures.push(`PACKAGE_SURFACE.md missing required anchor: ${required}`);
  }
}

// ─── Subpath inventory alignment (alpha.17 package B) ──────
// The machine-readable package-surface-map block in PACKAGE_SURFACE.md must
// exactly match each package's deno.json exports, and every supported
// subpath must be visible in the prose outside the comment block.

interface SurfaceMapEntry {
  supported: string[];
  internal: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function extractSurfaceMap(doc: string): Record<string, SurfaceMapEntry> | null {
  const BEGIN = '<!-- package-surface-map';
  const begin = doc.indexOf(BEGIN);
  if (begin === -1) return null;
  const end = doc.indexOf('-->', begin);
  if (end === -1) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(doc.slice(begin + BEGIN.length, end).trim());
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const map: Record<string, SurfaceMapEntry> = {};
  for (const [name, entry] of Object.entries(parsed as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') return null;
    const { supported, internal } = entry as Record<string, unknown>;
    if (!isStringArray(supported) || !isStringArray(internal)) return null;
    map[name] = { supported, internal };
  }
  return map;
}

const surfaceMap = extractSurfaceMap(docs);
if (!surfaceMap) {
  failures.push(
    'PACKAGE_SURFACE.md missing or invalid <!-- package-surface-map --> JSON block.',
  );
} else {
  const mappedPackages = Object.keys(surfaceMap).sort();
  if (JSON.stringify(mappedPackages) !== JSON.stringify(retainedPackages)) {
    failures.push(
      `package-surface-map packages mismatch. expected=${retainedPackages.join(', ')} actual=${
        mappedPackages.join(', ')
      }`,
    );
  }

  // Prose with the machine-readable block removed: supported subpaths must be
  // documented for humans, not only for the checker.
  const prose = docs.replace(/<!-- package-surface-map[\s\S]*?-->/, '');

  for (const pkg of packages) {
    const entry = surfaceMap[pkg.name];
    if (!entry) continue;
    const actual = Object.keys(normalizeExports(pkg.exports)).sort();
    const expected = [...entry.supported, ...entry.internal].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(
        `${pkg.name} exports drift from PACKAGE_SURFACE.md subpath inventory. expected=${
          JSON.stringify(expected)
        } actual=${JSON.stringify(actual)}`,
      );
    }
    for (const subpath of entry.supported) {
      if (subpath === '.') continue; // root is described as "root" in the table
      if (!prose.includes(`\`${subpath}\``)) {
        failures.push(
          `${pkg.name} supported subpath "${subpath}" is not documented in PACKAGE_SURFACE.md prose.`,
        );
      }
    }
  }
}

// ─── www apilist surface literals ─────────────────────────
// The supported-subpath chips on www/app/routes/apilist.tsx must match each
// package's exports map ('root' stands for the '.' export). Entries with
// placeholder chips ('CLI only', 'retained primitive subpaths') are skipped;
// element, app and adapter-vite must always be checked so the gate cannot
// silently no-op.

const APILIST_REQUIRED_PACKAGES = [
  '@openelement/element',
  '@openelement/app',
  '@openelement/adapter-vite',
];

const apilist = await Deno.readTextFile('www/app/routes/apilist.tsx');
const apilistChecked: string[] = [];
for (
  const match of apilist.matchAll(
    /importPath: '([^']+)'[\s\S]*?exports: \[([^\]]*)\]/g,
  )
) {
  const [, importPath, exportsLiteral] = match;
  const pkg = packages.find((candidate) => candidate.name === importPath);
  if (!pkg) continue; // e.g. npm:@openelement/create is not a workspace package
  const chips = [...exportsLiteral.matchAll(/'([^']+)'/g)].map((chip) => chip[1]);
  if (chips.some((chip) => !/^[a-z0-9./-]+$/.test(chip))) continue; // placeholder chips
  const documented = chips
    .map((chip) => (chip === 'root' ? '.' : chip))
    .sort((left, right) => left.localeCompare(right));
  const actual = Object.keys(normalizeExports(pkg.exports)).sort((left, right) =>
    left.localeCompare(right)
  );
  if (JSON.stringify(documented) !== JSON.stringify(actual)) {
    failures.push(
      `www/app/routes/apilist.tsx ${pkg.name} exports drift. expected=${
        JSON.stringify(actual)
      } actual=${JSON.stringify(documented)}`,
    );
  }
  apilistChecked.push(pkg.name);
}
for (const required of APILIST_REQUIRED_PACKAGES) {
  if (!apilistChecked.includes(required)) {
    failures.push(
      `www/app/routes/apilist.tsx does not document ${required} exports as concrete subpaths.`,
    );
  }
}

if (failures.length > 0) {
  console.error('Package surface check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(`Package surface check passed (${retainedPackages.length} packages retained).`);
