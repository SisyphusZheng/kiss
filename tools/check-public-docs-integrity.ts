import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
} from './project-constants.ts';
import { staleCurrencyClaimPatterns } from './check-strategic-docs.ts';
import { MOJIBAKE_CHARS } from './lib/text.ts';
import { STALE_HISTORY_CLAIM_PATTERNS } from './lib/stale-claims.ts';

// Prerelease tag of the superseded line (e.g. "alpha.9"). The
// "active release target" stale guard below is bound to this tag instead of a
// hardcoded number, so the required current anchor (PACKAGE_VERSION) can never
// collide with the guard on the next version bump (#727).
const previousPrereleaseTag = PREVIOUS_PACKAGE_VERSION.match(/-([a-zA-Z]+\.\d+)$/u)?.[1];

export type Failure = {
  file: string;
  message: string;
};

const currentPublicDocs = [
  'README.md',
  'README.zh.md',
  'docs/governance/PROJECT_WORKFLOW.md',
  'docs/current/VERSION_PLAN.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
];

const currentContractDocs = [
  'docs/current/PACKAGE_SURFACE.md',
  'docs/current/HYDRATION_CONTRACT.md',
  'docs/current/STACK_CONTRACT.md',
];

const packageSurfaceDoc = 'docs/current/PACKAGE_SURFACE.md';
const integrationsDocsDir = 'docs/integrations';

const readmeDocs = ['README.md', 'README.zh.md'];
const productDoctrinePatterns = [
  'OpenElement = Web Components-native fullstack application framework',
  'current proven scope = static-first applications with fullstack output paths',
];

// Derived from the canonical mojibake table (#827); the `???` rule is a
// docs-specific supplement on top of it.
const mojibakePatterns: RegExp[] = [
  new RegExp(`[${MOJIBAKE_CHARS.join('')}]`),
  /\?\?\?/,
];

const staleCurrentClaims: RegExp[] = [
  ...STALE_HISTORY_CLAIM_PATTERNS,
  /v0\.37\.6 is the current workspace package line/i,
  /All 20 workspace packages are currently aligned together at\s+\*\*v0\.37\.6\*\*/i,
  /活动执行目标是\s+v0\.38\.0/i,
  /JSR publish .*telemetry/i,
  /not (?:a )?(?:version-)?exit gate/i,
  /do not block version\s+exit/i,
  /distribution telemetry/i,
  // 0.41-era leftover guard; must not collide with a real 0.42.0-alpha.6.
  /npm registry (?:line|baseline).*0\.41\.0-alpha\.6/i,
  // Bound to the superseded line's prerelease tag (see top of file) so a
  // future current anchor never trips this guard (#727).
  ...(previousPrereleaseTag
    ? [new RegExp(`active release target.*${previousPrereleaseTag.replace(/\./g, '\\.')}`, 'i')]
    : []),
  /alpha\.13 was\s+the prior recovery train/i,
  // Currency claims ("published as X", "completed implementation anchor X")
  // are parameterized from the superseded package line instead of naming a
  // hardcoded alpha — the same generated set check-strategic-docs.ts enforces,
  // so the two gates no longer drift apart (#742).
  ...staleCurrencyClaimPatterns(),
];

const requiredCommunityFiles = [
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'MAINTAINERS.md',
];

/**
 * Importable @openelement specifiers declared by the current package surface
 * (#737). Parsed from the machine-readable package-surface-map block of
 * docs/current/PACKAGE_SURFACE.md — the same map package-surface:check keeps
 * in sync with each package's exports field. Both supported and internal
 * subpaths are importable (internal subpaths stay reachable for optional
 * integrations); anything else — retired packages such as @openelement/core,
 * @openelement/signal, @openelement/router, @openelement/protocol,
 * @openelement/content or @openelement/ssg, and unknown subpaths — is not in
 * the current package surface and must not be referenced by integration docs.
 */
export function packageSurfaceSpecifiers(surfaceText: string): Set<string> {
  const match = surfaceText.match(/<!-- package-surface-map\s*([\s\S]*?)\s*-->/u);
  if (!match) {
    throw new Error(`${packageSurfaceDoc}: package-surface-map block missing`);
  }
  const map = JSON.parse(match[1]) as Record<string, { supported?: string[]; internal?: string[] }>;
  const specifiers = new Set<string>();
  for (const [name, entry] of Object.entries(map)) {
    for (const subpath of [...(entry.supported ?? []), ...(entry.internal ?? [])]) {
      specifiers.add(subpath === '.' ? name : `${name}/${subpath}`);
    }
  }
  return specifiers;
}

/**
 * Check docs/integrations/*.md against the current package surface (#737):
 * every @openelement/* package or subpath an integration doc tells a reader
 * to use must be importable per PACKAGE_SURFACE.md. Retired package names and
 * drifted subpaths are reported instead of silently guiding users to imports
 * that no longer exist.
 */
export function findIntegrationSpecifierFailures(
  read: (path: string) => string,
  integrationDocs: string[],
): Failure[] {
  const failures: Failure[] = [];
  let specifiers: Set<string>;
  try {
    specifiers = packageSurfaceSpecifiers(read(packageSurfaceDoc));
  } catch (error) {
    return [{
      file: packageSurfaceDoc,
      message: `cannot read package surface: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }];
  }
  for (const file of integrationDocs) {
    let text: string;
    try {
      text = read(file);
    } catch (error) {
      failures.push({
        file,
        message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }
    const mentioned = new Set<string>();
    for (
      const m of text.matchAll(/@openelement\/[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9./-]*)?/gu)
    ) {
      mentioned.add(m[0]);
    }
    for (const specifier of [...mentioned].sort()) {
      if (!specifiers.has(specifier)) {
        failures.push({
          file,
          message: `package specifier not in the current package surface: ${specifier}`,
        });
      }
    }
  }
  return failures;
}

async function read(file: string, failures: Failure[]): Promise<string> {
  try {
    return await Deno.readTextFile(file);
  } catch (error) {
    failures.push({
      file,
      message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
    });
    return '';
  }
}

async function main(): Promise<void> {
  const failures: Failure[] = [];

  for (const file of currentPublicDocs) {
    const text = await read(file, failures);
    if (!text) continue;

    if (!text.includes(PACKAGE_VERSION_TAG)) {
      failures.push({ file, message: `missing package version tag ${PACKAGE_VERSION_TAG}` });
    }

    if (!text.includes(PACKAGE_VERSION)) {
      failures.push({ file, message: `missing package version ${PACKAGE_VERSION}` });
    }

    for (const pattern of staleCurrentClaims) {
      const match = text.match(pattern);
      if (match) {
        failures.push({ file, message: `stale current-line claim: ${match[0]}` });
      }
    }
  }

  for (const file of currentContractDocs) {
    const text = await read(file, failures);
    if (!text) continue;
    const staleMaturity = text.match(/v0\.41 beta/i);
    if (staleMaturity) {
      failures.push({ file, message: `stale current maturity claim: ${staleMaturity[0]}` });
    }
  }

  for (const file of readmeDocs) {
    const text = await read(file, failures);
    if (!text) continue;

    for (const doctrine of productDoctrinePatterns) {
      if (!text.includes(doctrine)) {
        failures.push({ file, message: `missing product doctrine formula: ${doctrine}` });
      }
    }

    for (const pattern of mojibakePatterns) {
      const match = text.match(pattern);
      if (match) {
        failures.push({ file, message: `mojibake/replacement text matched: ${match[0]}` });
      }
    }
  }

  for (const file of requiredCommunityFiles) {
    const text = await read(file, failures);
    if (!text) continue;
    if (text.trim().length < 80) {
      failures.push({ file, message: 'public entry point is unexpectedly empty' });
    }
  }

  const contributing = await read('CONTRIBUTING.md', failures);
  for (const file of requiredCommunityFiles) {
    if (!contributing.includes(file)) {
      failures.push({ file: 'CONTRIBUTING.md', message: `missing link to ${file}` });
    }
  }

  const integrationDocs: string[] = [];
  for await (const entry of Deno.readDir(integrationsDocsDir)) {
    if (entry.isFile && entry.name.endsWith('.md')) {
      integrationDocs.push(`${integrationsDocsDir}/${entry.name}`);
    }
  }
  failures.push(
    ...findIntegrationSpecifierFailures((path) => Deno.readTextFileSync(path), integrationDocs),
  );

  if (failures.length > 0) {
    console.error('Public docs integrity check failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    Deno.exit(1);
  }

  console.log(
    `Public docs integrity check passed (${currentPublicDocs.length} docs, ` +
      `${integrationDocs.length} integration docs, package ${PACKAGE_VERSION_TAG}, ` +
      'alpha maturity).',
  );
}

if (import.meta.main) await main();
