/**
 * Architecture contract gate.
 *
 * This gate checks current source and current documentation only. Historical ADRs,
 * old release notes, generated data, fixtures, and tests are intentionally not
 * used as regressions for the active public contract.
 *
 * Permissions: --allow-read and --allow-run=git (tracked-file inventory).
 */

import { dirname, extname, join, normalize } from '@std/path';
import { formatError } from '@openelement/element';
import { MOJIBAKE_CHARS, stripCommentsLine } from './lib/text.ts';
import { gitTrackedFiles } from './lib/git.ts';
import { PACKAGE_VERSION } from './project-constants.ts';

export interface Issue {
  check: string;
  file: string;
  line?: number;
  message: string;
}

export interface TextFile {
  path: string;
  text: string;
}

interface TypeEscapeAllow {
  file: string;
  fragment: string;
  reason: string;
  /** Version at which the entry must be revisited (removed or bumped, #871-4.2). */
  revisitBy: string;
}

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.txt',
]);

export const CURRENT_DOC_ROOTS = ['docs/current/', 'docs/status/', 'docs/roadmap/'] as const;

const TYPE_ESCAPE_ALLOWLIST: TypeEscapeAllow[] = [
  {
    file: 'packages/adapter-vite/src/internal/content/sitemap/plugin.ts',
    fragment:
      "ctx.registerPlugin('sitemapOptions', options as unknown as Record<string, unknown>);",
    reason: 'Plugin option bag crosses a protocol boundary via registerPlugin.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/cli/ssg-render.ts',
    fragment:
      'generateSitemap(outputDir, ctx.plugins.sitemapOptions as unknown as SitemapOptions);',
    reason:
      'Read-back of the sitemap plugin option bag registered via registerPlugin (the write-side cast above).',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/morph-align.ts',
    fragment: '(oldKids[k] as unknown as { remove(): void }).remove();',
    reason:
      'ChildNode.remove() does not exist on the Node type; the morph walk holds mixed Node lists and only reaches this branch for element children.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/morph-align.ts',
    fragment: '(oldEl as unknown as Text).data',
    reason:
      'nodeType === 3 narrowing that TypeScript cannot follow through the custom morph walk; both sides are text nodes by construction.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/morph-align.ts',
    fragment:
      'return Boolean((el as unknown as Record<string, unknown>)[name]) !== el.hasAttribute(name);',
    reason:
      'Property-vs-attribute comparison for mirrored form controls; the property side is untyped by DOM design (any-valued expandos like checked/value).',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/morph-align.ts',
    fragment: 'return n as unknown as HTMLTemplateElement;',
    reason:
      'DSD template lookup: the walk filters by tagName === "TEMPLATE" before returning, a narrowing TypeScript cannot express through Node.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/island-lifecycle.ts',
    fragment: '(n as unknown as Text).data.trim()',
    reason:
      'Same nodeType === 3 narrowing; whitespace-only text-node filter in the nested-DSD comparison (#582).',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/island-lifecycle.ts',
    fragment: '(o as unknown as Text).data === (nn as unknown as Text).data',
    reason:
      'Same nodeType === 3 narrowing; nested-DSD comparison only reaches this branch for text nodes (#582).',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/adapter-vite/src/internal/ssg/form-enhance.ts',
    fragment: 'const formState = form as unknown as {',
    reason:
      'Expando per-form state bag (__openElementBusy/__openElementSeq) attached by the enhance client itself; HTMLFormElement has no such fields by design (#564/#599).',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/internal/core/style-sheet.ts',
    fragment: 'globalThis.CSSStyleSheet as unknown as new () => StyleSheetLike',
    reason:
      'Native CSSStyleSheet has CSSRuleList while the SSR facade exposes an array-like rule contract.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/internal/core/island.ts',
    fragment: 'el as unknown as Record<string, unknown>',
    reason: 'Custom element prop assignment by dynamic prop name.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/internal/core/binding-activation.ts',
    fragment: 'desc.el as unknown as Record<string, unknown>',
    reason: 'Direct DOM property assignment by dynamic prop name.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/internal/core/prop.ts',
    fragment: 'instance as unknown as {',
    reason: 'Static prop runtime writes element attributes and properties.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/open-element-implementation.ts',
    fragment: '} as unknown as typeof HTMLElement)',
    reason: 'SSR HTMLElement stub for environments without DOM.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/open-element-theme.ts',
    fragment: 'styles as unknown as CSSStyleSheet[]',
    reason: 'adoptedStyleSheets may not be in the configured DOM lib.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/define-element.ts',
    fragment: 'this as unknown as Record<string, unknown>',
    reason: 'Custom element prop collection by dynamic prop name.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/open-element-render.ts',
    fragment: 'instance as unknown as HTMLElement',
    reason: 'Cycle-break: OpenElementLike does not extend HTMLElement.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/open-element-render.ts',
    fragment: 'instance.constructor as unknown as OpenElementLikeConstructor',
    reason: 'Cycle-break: OpenElementLike constructor typed as ObjectConstructor.',

    revisitBy: '0.44.0',
  },
  {
    file: 'packages/element/src/internal/core/render-dsd.ts',
    fragment: 'instance as unknown as Record<string, unknown>',
    reason: 'injectPropsSafe writes element props by dynamic name across the DSD boundary.',
    revisitBy: '0.44.0',
  },
];

function addIssue(
  issues: Issue[],
  check: string,
  file: string,
  message: string,
  line?: number,
): void {
  issues.push({ check, file, line, message });
}

export function isTextPath(path: string): boolean {
  return TEXT_EXTENSIONS.has(extname(path));
}

export function isCurrentDocOrExample(path: string): boolean {
  if (CURRENT_DOC_ROOTS.some((root) => path.startsWith(root))) return true;
  if (path === 'README.md' || path === 'README.zh.md') return true;
  if (path === 'CONTRIBUTING.md') return true;
  if (path.startsWith('packages/') && path.endsWith('/README.md')) return true;
  if (path.startsWith('packages/') && path.includes('/src/')) return true;
  if (path.startsWith('www/app/routes/guide/')) return true;
  return false;
}

export function assertCurrentDocRoots(paths: string[], issues: Issue[]): void {
  for (const root of CURRENT_DOC_ROOTS) {
    if (!paths.some((path) => path.startsWith(root))) {
      addIssue(
        issues,
        'doc-scan-root',
        root,
        'current documentation scan root is missing or contains no tracked files',
      );
    }
  }
}

export function isProductionSource(path: string): boolean {
  if (path.includes('/__tests__/') || path.includes('/test/fixtures/')) return false;
  if (path === 'tools/check-architecture-contract.ts') return false;
  // Test files that exercise the architecture contract necessarily contain
  // escape tokens, so they are excluded from production scanning.
  if (path === 'tools/check-architecture-contract.test.ts') return false;
  if (path === 'tools/check-type-safety.test.ts') return false;
  if (path.startsWith('packages/') && path.includes('/src/') && /\.(ts|tsx)$/.test(path)) {
    return true;
  }
  if (path.startsWith('tools/') && path.endsWith('.ts')) return true;
  if (path === 'www/vite.config.ts') return true;
  if (path.startsWith('www/app/') && /\.(ts|tsx)$/.test(path)) {
    return !path.startsWith('www/app/data/');
  }
  return false;
}

function lineNumber(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function eachLine(file: TextFile, fn: (line: string, lineNumber: number) => void): void {
  file.text.split(/\r?\n/).forEach((line, index) => fn(line, index + 1));
}

export function failMatches(
  check: string,
  files: TextFile[],
  re: RegExp,
  message: string,
  issues: Issue[],
): void {
  for (const file of files) {
    let inBlock = false;
    file.text.split(/\r?\n/).forEach((rawLine, index) => {
      const { line, inBlock: next } = stripCommentsLine(rawLine, inBlock);
      inBlock = next;
      if (re.test(line)) addIssue(issues, check, file.path, message, index + 1);
    });
  }
}

export function assertAllowedTypeEscapes(files: TextFile[], issues: Issue[]): void {
  const found = new Set<string>();
  for (const file of files) {
    eachLine(file, (line, lineNo) => {
      if (!line.includes('as unknown as')) return;
      const allow = TYPE_ESCAPE_ALLOWLIST.find((entry) =>
        entry.file === file.path && line.includes(entry.fragment)
      );
      if (!allow) {
        addIssue(
          issues,
          'type-escape',
          file.path,
          'production as unknown as is not in the reviewed allowlist',
          lineNo,
        );
        return;
      }
      found.add(`${allow.file}\0${allow.fragment}`);
    });
  }

  for (const entry of TYPE_ESCAPE_ALLOWLIST) {
    const key = `${entry.file}\0${entry.fragment}`;
    if (!found.has(key)) {
      addIssue(
        issues,
        'type-escape',
        entry.file,
        `allowlist entry is stale: ${entry.reason}`,
      );
    }
  }

  // #871-4.2: an allowlist entry is a debt record, not a permanent exemption.
  // Once the package line reaches the entry's revisitBy version the gate
  // fails until the entry is removed or its revisitBy is bumped after review.
  for (const entry of TYPE_ESCAPE_ALLOWLIST) {
    const key = `${entry.file}\0${entry.fragment}`;
    if (found.has(key) && isAtOrAfter(PACKAGE_VERSION, entry.revisitBy)) {
      addIssue(
        issues,
        'type-escape',
        entry.file,
        `allowlist entry is due for revisit (v${entry.revisitBy} reached): ` +
          `${entry.reason} — remove the workaround or bump revisitBy after review`,
      );
    }
  }
}

/**
 * Compare x.y.z(-pre.n) version strings; returns true when current is at or
 * past the target version. Prereleases sort before their release (0.43.0-alpha
 * < 0.43.0).
 */
export function isAtOrAfter(current: string, target: string): boolean {
  const parse = (v: string): { core: number[]; pre: string[] } => {
    const [core, pre] = v.split('-', 2);
    return {
      core: core.split('.').map((n) => Number(n)),
      pre: pre ? pre.split('.') : [],
    };
  };
  const c = parse(current);
  const t = parse(target);
  for (let i = 0; i < 3; i++) {
    const a = c.core[i] ?? 0;
    const b = t.core[i] ?? 0;
    if (a !== b) return a > b;
  }
  // Release (no prerelease) is newer than any prerelease.
  if (c.pre.length === 0 && t.pre.length === 0) return true;
  if (t.pre.length === 0) return false;
  if (c.pre.length === 0) return true;
  const preRank = { alpha: 0, beta: 1, rc: 2 } as Record<string, number>;
  for (let i = 0; i < Math.max(c.pre.length, t.pre.length); i++) {
    const a = c.pre[i];
    const b = t.pre[i];
    if (a === undefined) return false;
    if (b === undefined) return true;
    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isNaN(aNum) && Number.isNaN(bNum)) {
      const ra = preRank[a] ?? 3;
      const rb = preRank[b] ?? 3;
      if (ra !== rb) return ra > rb;
      continue;
    }
    if (Number.isNaN(aNum) !== Number.isNaN(bNum)) {
      // Identifier vs number: numeric identifiers sort below non-numeric.
      return !Number.isNaN(bNum);
    }
    if (aNum !== bNum) return aNum > bNum;
  }
  return true;
}

export function assertDuplicateCounts(files: TextFile[], issues: Issue[]): void {
  const compatibilityHits: Array<{ file: string; line: number }> = [];
  for (const file of files.filter((f) => f.path.startsWith('packages/'))) {
    eachLine(file, (line, lineNo) => {
      if (line.includes('interface CompatibilityClassification')) {
        compatibilityHits.push({ file: file.path, line: lineNo });
      }
    });
  }
  // v0.41.0: canonical home moved to packages/element/src/internal/protocol/framework.ts
  const canonicalFile = 'packages/element/src/internal/protocol/framework.ts';
  if (compatibilityHits.length !== 1 || compatibilityHits[0].file !== canonicalFile) {
    for (const hit of compatibilityHits) {
      addIssue(
        issues,
        'duplicate-type',
        hit.file,
        `CompatibilityClassification must have exactly one canonical interface in ${canonicalFile}`,
        hit.line,
      );
    }
    if (compatibilityHits.length === 0) {
      addIssue(
        issues,
        'duplicate-type',
        canonicalFile,
        'missing canonical CompatibilityClassification interface',
      );
    }
  }
}

export function assertStructuredMetadata(files: TextFile[], issues: Issue[]): void {
  const scannerPaths = new Set(discoverScannerFiles(files.map((file) => file.path)));
  const scannerFiles = files.filter((file) => scannerPaths.has(file.path));
  failMatches(
    'metadata-boundary',
    scannerFiles,
    /exportMatch|splitOnCommas|parseValue\(raw/,
    'scanner metadata extraction must stay regex/lightweight (deliberate: route-scanner.ts header — AST parsing was evaluated and rejected); these exact tokens are banned because they re-introduce brittle hand-rolled value parsing',
    issues,
  );
}

/** Reject static import/export cycles inside the element source graph (#1095). */
export function assertNoElementImportCycles(files: TextFile[], issues: Issue[]): void {
  const source = files.filter((file) =>
    file.path.startsWith('packages/element/src/') && /\.tsx?$/.test(file.path)
  );
  const known = new Set(source.map((file) => file.path));
  const graph = new Map<string, string[]>();
  const importRe = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
  for (const file of source) {
    const targets: string[] = [];
    for (const match of file.text.matchAll(importRe)) {
      const resolved = normalize(join(dirname(file.path), match[1])).replaceAll('\\', '/');
      const target = known.has(resolved)
        ? resolved
        : known.has(`${resolved}.ts`)
        ? `${resolved}.ts`
        : known.has(`${resolved}.tsx`)
        ? `${resolved}.tsx`
        : null;
      if (target) targets.push(target);
    }
    graph.set(file.path, targets);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const reported = new Set<string>();
  const visit = (file: string): void => {
    if (visited.has(file)) return;
    active.add(file);
    stack.push(file);
    for (const target of graph.get(file) ?? []) {
      if (active.has(target)) {
        const start = stack.indexOf(target);
        const cycle = [...stack.slice(start), target];
        const key = [...new Set(cycle)].sort().join('\0');
        if (!reported.has(key)) {
          reported.add(key);
          addIssue(
            issues,
            'element-import-cycle',
            file,
            `static import cycle: ${cycle.join(' -> ')}`,
          );
        }
      } else {
        visit(target);
      }
    }
    stack.pop();
    active.delete(file);
    visited.add(file);
  };
  for (const file of graph.keys()) visit(file);
}

export function discoverScannerFiles(paths: string[]): string[] {
  return paths.filter((path) =>
    path.startsWith('packages/adapter-vite/src/') &&
    /(?:^|\/)[^/]*scanner[^/]*\.(?:ts|tsx)$/u.test(path) &&
    !/\.(?:test|spec)\.(?:ts|tsx)$/u.test(path) &&
    !path.includes('/__tests__/')
  );
}

export function assertTypeEscapeAllowlistFiles(paths: Set<string>, issues: Issue[]): void {
  for (const entry of TYPE_ESCAPE_ALLOWLIST) {
    if (!paths.has(entry.file)) {
      addIssue(issues, 'type-escape', entry.file, 'allowlist references a missing source file');
    }
  }
}

export function assertMojibake(files: TextFile[], issues: Issue[]): void {
  for (const file of files) {
    for (const bad of MOJIBAKE_CHARS) {
      const idx = file.text.indexOf(bad);
      if (idx !== -1) {
        addIssue(
          issues,
          'encoding',
          file.path,
          'current source/doc contains replacement/mojibake text',
          lineNumber(file.text, idx),
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const files = await gitTrackedFiles();
  let totalBytes = 0;
  let readFailures = 0;
  const textFiles: TextFile[] = [];
  const issues: Issue[] = [];

  for (const path of files) {
    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) continue;
      const bytes = await Deno.readFile(path);
      totalBytes += bytes.byteLength;
      if (isTextPath(path)) {
        textFiles.push({ path, text: new TextDecoder('utf-8').decode(bytes) });
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      readFailures++;
      addIssue(
        issues,
        'byte-read',
        path,
        `could not read tracked file: ${formatError(error)}`,
      );
    }
  }

  const currentDocs = textFiles.filter((f) => isCurrentDocOrExample(f.path));
  const production = textFiles.filter((f) => isProductionSource(f.path));
  const coreSource = production.filter((f) =>
    f.path.startsWith('packages/element/src/internal/core/')
  );
  const adapterProtocol = production.filter((f) =>
    f.path.startsWith('packages/adapter-vite/src/internal/protocol/') &&
    !f.path.endsWith('/ssg.ts')
  );

  failMatches(
    'render-contract',
    currentDocs,
    /render\(\):\s*(?:Promise<)?string\b|string\s*\|\s*VNode/,
    'current source/docs must teach render(): VNode | null only',
    issues,
  );
  failMatches(
    'trust-boundary',
    currentDocs,
    /\brawHtml\b|data-on-/,
    'current source/docs must use trustedHtml and VNode event handlers',
    issues,
  );
  failMatches(
    'core-render',
    coreSource,
    /wrongTypeErrorHtml|typeof\s+result\s*===\s*['"]string['"]|Components must return a string/,
    'core must not carry the legacy string-render branch',
    issues,
  );
  failMatches(
    'protocol-seam',
    adapterProtocol,
    /export\s+(?:interface\s+|type\s+\w+\s*=)/,
    'shared adapter protocol files must remain type-only re-export seams',
    issues,
  );
  for (const file of adapterProtocol) {
    if (!file.text.includes("export type * from '@openelement/element';")) {
      addIssue(
        issues,
        'protocol-seam',
        file.path,
        'shared protocol seam must resolve through the @openelement/element root',
      );
    }
  }
  assertAllowedTypeEscapes(production, issues);
  failMatches(
    'ts-suppression',
    production,
    /@ts-ignore|@ts-expect-error/,
    'production TypeScript suppressions are forbidden',
    issues,
  );
  const taskMarkerPattern = /\b(?:TODO|FIXME)\b/u;
  failMatches(
    'task-markers',
    production.filter((f) => !f.path.startsWith('www/app/data/')),
    taskMarkerPattern,
    'production task markers must be removed or moved to classified SOP debt',
    issues,
  );
  assertDuplicateCounts(textFiles, issues);
  assertCurrentDocRoots(files, issues);
  assertNoElementImportCycles(textFiles, issues);
  assertStructuredMetadata(textFiles, issues);
  assertTypeEscapeAllowlistFiles(new Set(files), issues);
  assertMojibake(production.concat(currentDocs), issues);

  if (readFailures > 0) {
    addIssue(issues, 'byte-read', '<inventory>', `${readFailures} tracked files could not be read`);
  }

  if (issues.length > 0) {
    console.error(`Architecture contract check FAILED with ${issues.length} issue(s):`);
    for (const issue of issues) {
      const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      console.error(`  [${issue.check}] ${loc} - ${issue.message}`);
    }
    Deno.exit(1);
  }

  console.log(
    `Architecture contract check passed (${files.length} tracked files, ${totalBytes} bytes).`,
  );
}

if (import.meta.main) {
  await main();
}
