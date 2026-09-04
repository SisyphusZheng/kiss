/**
 * API + Custom Element reference generator (#1158, B2.4).
 *
 * Builds www/app/data/_generated-api-reference.ts from the real public
 * exports of every supported subpath (TypeScript compiler API enumeration),
 * their JSDoc, the PACKAGE_SURFACE.md stability classes and the
 * @openelement/ui compiler manifest (tags/attributes/events/slots/CSS
 * parts/SSR/claim/activation). `--check` regenerates and requires
 * byte-identical output — the CI drift gate.
 *
 * Fails closed on: unclassified exports, stale classifications (removed
 * exports), undocumented stable-candidate exports, internal exports leaking
 * into the documented surface, and duplicate anchors.
 */
import { formatJson } from '@openelement/element/build-utils';
import { readPackages } from './lib/package-graph.ts';
import {
  type ApiExportRecord,
  enumerateSubpathExports,
  parseExportClassMap,
  parseSurfaceMap,
  workspacePaths,
} from './lib/api-reference.ts';

export const API_REFERENCE_ARTIFACT = 'www/app/data/_generated-api-reference.ts';
const PACKAGE_SURFACE = 'docs/current/PACKAGE_SURFACE.md';
const UI_MANIFEST = 'packages/ui/src/generated-manifest.json';

/** Classes that appear on the documented surface; internal-importable never does. */
const DOCUMENTED_CLASSES = new Set(['stable-candidate', 'experimental', 'compatibility-only']);

interface SubpathRecord {
  subpath: string;
  label: string;
  exports: ApiExportRecord[];
}

interface PackageRecord {
  id: string;
  name: string;
  importPath: string;
  supportedSubpaths: string[];
  internalSubpaths: string[];
  subpaths: SubpathRecord[];
}

interface ElementRecord {
  tag: string;
  className: string;
  description: string;
  layer: string;
  hydrate: string;
  module: string;
  attributes: unknown[];
  events: unknown[];
  slots: unknown[];
  cssParts: unknown[];
  anchor: string;
}

function subpathLabel(subpath: string): string {
  return subpath === '.' ? 'root' : subpath;
}

function anchorFor(pkg: string, subpath: string, name: string): string {
  const clean = (value: string) => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `api-${clean(pkg)}-${clean(subpathLabel(subpath))}-${clean(name)}`;
}

export interface ApiReferenceBuild {
  packages: PackageRecord[];
  elements: ElementRecord[];
  failures: string[];
}

export async function buildApiReference(): Promise<ApiReferenceBuild> {
  const repoRoot = Deno.cwd();
  const failures: string[] = [];
  const doc = await Deno.readTextFile(PACKAGE_SURFACE);
  const surfaceMap = parseSurfaceMap(doc);
  const classMap = parseExportClassMap(doc);
  if (!surfaceMap || !classMap) {
    throw new Error(`${PACKAGE_SURFACE} machine-readable blocks are missing or malformed`);
  }
  // Custom Element reference from the compiler manifest; loaded first because
  // the manifest's file-header descriptions are the documentation truth for
  // the @openelement/ui component classes (#1158 merge rule).
  const manifest = JSON.parse(await Deno.readTextFile(UI_MANIFEST)) as {
    declarations?: Array<Record<string, unknown>>;
  };
  const manifestDescriptionByClass = new Map<string, string>();
  for (const declaration of manifest.declarations ?? []) {
    manifestDescriptionByClass.set(
      String(declaration.className ?? ''),
      String(declaration.description ?? ''),
    );
  }

  const packages = await readPackages();
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const paths = workspacePaths(packages);
  const anchors = new Set<string>();
  const records: PackageRecord[] = [];

  for (const name of Object.keys(surfaceMap).sort()) {
    const surface = surfaceMap[name];
    const info = byName.get(name);
    if (!info) {
      failures.push(`${name}: listed in the surface map but not present under packages/`);
      continue;
    }
    const exportsMap = typeof info.exports === 'string'
      ? { '.': info.exports }
      : (info.exports ?? {}) as Record<string, string>;
    const shortName = name.slice(name.lastIndexOf('/') + 1);
    const subpaths: SubpathRecord[] = [];

    for (const subpath of [...surface.supported].sort()) {
      const target = exportsMap[subpath] ?? exportsMap[`.${subpath === '.' ? '' : `/${subpath}`}`];
      if (typeof target !== 'string') {
        // A supported subpath with no exports entry is missing API truth.
        failures.push(`${name}: supported subpath '${subpath}' has no exports entry`);
        continue;
      }
      const classes = classMap[name]?.[subpath] ?? {};
      let enumerated: Omit<ApiExportRecord, 'stability' | 'anchor'>[] = [];
      try {
        enumerated = enumerateSubpathExports(
          `${info.dir}/${target.replace(/^\.\//, '')}`,
          repoRoot,
          paths,
        );
      } catch (error) {
        failures.push(`${name}/${subpathLabel(subpath)}: enumeration failed: ${error}`);
        continue;
      }
      const exported = new Set(enumerated.map((record) => record.name));
      for (const classified of Object.keys(classes)) {
        if (!exported.has(classified)) {
          failures.push(
            `${name}/${
              subpathLabel(subpath)
            }: '${classified}' is classified but no longer exported (removed export)`,
          );
        }
      }
      const documented: ApiExportRecord[] = [];
      for (let record of enumerated) {
        const stability = classes[record.name];
        if (stability === undefined) {
          failures.push(
            `${name}/${subpathLabel(subpath)}: '${record.name}' is exported but unclassified`,
          );
          continue;
        }
        if (stability === 'stable-candidate' && record.summary === '') {
          // UI component classes document themselves through the file-header
          // JSDoc captured in the compiler manifest, not a class-level block.
          const manifestDescription = manifestDescriptionByClass.get(record.name);
          if (name === '@openelement/ui' && manifestDescription) {
            record = { ...record, summary: manifestDescription };
          } else {
            failures.push(
              `${name}/${
                subpathLabel(subpath)
              }: '${record.name}' is a stable-candidate with no JSDoc summary (undocumented export)`,
            );
          }
        }
        // Internal exports never appear on the documented surface.
        if (!DOCUMENTED_CLASSES.has(stability)) continue;
        const anchor = anchorFor(shortName, subpath, record.name);
        if (anchors.has(anchor)) failures.push(`duplicate anchor '${anchor}'`);
        anchors.add(anchor);
        documented.push({ ...record, stability, anchor });
      }
      subpaths.push({ subpath, label: subpathLabel(subpath), exports: documented });
    }

    records.push({
      id: shortName,
      name,
      importPath: name,
      supportedSubpaths: [...surface.supported].sort(),
      internalSubpaths: [...surface.internal].sort(),
      subpaths,
    });
  }

  // Custom Element reference records from the manifest loaded above.
  const elements: ElementRecord[] = [];
  for (const declaration of manifest.declarations ?? []) {
    const tag = String(declaration.tagName);
    const openElement = (declaration.openElement ?? {}) as Record<string, unknown>;
    const anchor = `ce-${tag}`;
    if (anchors.has(anchor)) failures.push(`duplicate anchor '${anchor}'`);
    anchors.add(anchor);
    elements.push({
      tag,
      className: String(declaration.className ?? ''),
      description: String(declaration.description ?? ''),
      layer: String(openElement.layer ?? ''),
      hydrate: String(openElement.hydrate ?? ''),
      module: String(openElement.module ?? ''),
      attributes: (declaration.attributes ?? []) as unknown[],
      events: (declaration.events ?? []) as unknown[],
      slots: (declaration.slots ?? []) as unknown[],
      cssParts: (declaration.cssParts ?? []) as unknown[],
      anchor,
    });
  }
  elements.sort((a, b) => a.tag.localeCompare(b.tag));

  return { packages: records, elements, failures };
}

function searchRecords(build: ApiReferenceBuild): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  for (const pkg of build.packages) {
    for (const subpath of pkg.subpaths) {
      for (const exported of subpath.exports) {
        records.push({
          route: '/apilist',
          anchor: exported.anchor,
          title: `${exported.name} (${pkg.name}/${subpath.label})`,
          kind: 'api',
        });
      }
    }
  }
  for (const element of build.elements) {
    records.push({
      route: '/apilist',
      anchor: element.anchor,
      title: `<${element.tag}> (${element.className})`,
      kind: 'custom-element',
    });
  }
  return records.sort((a, b) => a.anchor.localeCompare(b.anchor));
}

export function renderApiReferenceModule(build: ApiReferenceBuild): string {
  const payload = {
    packages: build.packages,
    elements: build.elements,
    searchRecords: searchRecords(build),
  };
  return '// Auto-generated by tools/generate-api-reference.ts (#1158) — do not edit\n' +
    '// Source of truth: package exports + JSDoc, PACKAGE_SURFACE.md stability\n' +
    '// classes and packages/ui/src/generated-manifest.json. Drift fails the\n' +
    '// `api-reference:check` CI gate; regenerate with `deno task generate:api-reference`.\n' +
    `export const apiReference = ${formatJson(payload).trimEnd()} as const;\n`;
}

if (import.meta.main) {
  const check = Deno.args.includes('--check');
  const build = await buildApiReference();
  if (build.failures.length > 0) {
    console.error('API reference validation failed:');
    for (const failure of build.failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }
  const module = renderApiReferenceModule(build);
  if (check) {
    let existing: string;
    try {
      existing = await Deno.readTextFile(API_REFERENCE_ARTIFACT);
    } catch {
      console.error(`${API_REFERENCE_ARTIFACT} is missing; run deno task generate:api-reference`);
      Deno.exit(1);
    }
    if (existing !== module) {
      console.error(
        `${API_REFERENCE_ARTIFACT} is stale; run deno task generate:api-reference and commit the result`,
      );
      Deno.exit(1);
    }
    console.log(`API reference check passed (${API_REFERENCE_ARTIFACT} is byte-identical).`);
  } else {
    await Deno.writeTextFile(API_REFERENCE_ARTIFACT, module);
    const exportCount = build.packages.reduce(
      (sum, pkg) => sum + pkg.subpaths.reduce((inner, sub) => inner + sub.exports.length, 0),
      0,
    );
    console.log(
      `Wrote ${build.packages.length} packages (${exportCount} documented exports) and ` +
        `${build.elements.length} custom elements to ${API_REFERENCE_ARTIFACT}`,
    );
  }
}
