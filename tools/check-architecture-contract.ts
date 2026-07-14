/**
 * v0.30.1 architecture contract gate.
 *
 * This gate checks current source and current documentation only. Historical ADRs,
 * old release notes, generated data, fixtures, and tests are intentionally not
 * used as regressions for the active public contract.
 */

import { extname } from 'node:path';
import { stripCommentsLine } from './lib/text.ts';

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

const TYPE_ESCAPE_ALLOWLIST: TypeEscapeAllow[] = [
  {
    file: 'packages/adapter-vite/src/internal/content/sitemap/plugin.ts',
    fragment:
      "ctx.registerPlugin('sitemapOptions', options as unknown as Record<string, unknown>);",
    reason: 'Plugin option bag crosses a protocol boundary via registerPlugin.',
  },
  {
    file: 'packages/element/src/internal/core/style-sheet.ts',
    fragment: 'globalThis.CSSStyleSheet as unknown as new () => StyleSheetLike',
    reason:
      'Native CSSStyleSheet has CSSRuleList while the SSR facade exposes an array-like rule contract.',
  },
  {
    file: 'packages/element/src/internal/core/island.ts',
    fragment: 'el as unknown as Record<string, unknown>',
    reason: 'Custom element prop assignment by dynamic prop name.',
  },
  {
    file: 'packages/element/src/internal/core/binding-activation.ts',
    fragment: 'desc.el as unknown as Record<string, unknown>',
    reason: 'Direct DOM property assignment by dynamic prop name.',
  },
  {
    file: 'packages/element/src/internal/core/island.ts',
    fragment: '} as unknown as typeof componentClass.prototype.connectedCallback',
    reason: 'Preserve original connectedCallback signature after wrapping.',
  },
  {
    file: 'packages/element/src/internal/core/prop.ts',
    fragment: 'instance as unknown as {',
    reason: 'Static prop runtime writes element attributes and properties.',
  },
  {
    file: 'packages/element/src/open-element-implementation.ts',
    fragment: '} as unknown as typeof HTMLElement)',
    reason: 'SSR HTMLElement stub for environments without DOM.',
  },
  {
    file: 'packages/element/src/open-element-theme.ts',
    fragment: 'styles as unknown as CSSStyleSheet[]',
    reason: 'adoptedStyleSheets may not be in the configured DOM lib.',
  },
  {
    file: 'packages/element/src/define-element.ts',
    fragment: 'this as unknown as Record<string, unknown>',
    reason: 'Custom element prop collection by dynamic prop name.',
  },
  {
    file: 'packages/element/src/open-element-render.ts',
    fragment: 'instance as unknown as HTMLElement',
    reason: 'Cycle-break: OpenElementLike does not extend HTMLElement.',
  },
  {
    file: 'packages/element/src/open-element-render.ts',
    fragment: 'instance.constructor as unknown as OpenElementLikeConstructor',
    reason: 'Cycle-break: OpenElementLike constructor typed as ObjectConstructor.',
  },
  {
    file: 'packages/element/src/internal/core/render-dsd.ts',
    fragment: 'instance as unknown as Record<string, unknown>',
    reason: 'injectPropsSafe writes element props by dynamic name across the DSD boundary.',
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

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

async function gitFiles(): Promise<string[]> {
  const command = new Deno.Command('git', {
    args: ['-c', 'core.quotepath=false', 'ls-files', '-z'],
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(new TextDecoder().decode(output.stderr).trim() || 'git ls-files failed');
  }
  return new TextDecoder()
    .decode(output.stdout)
    .split('\0')
    .filter(Boolean)
    .map(normalizePath);
}

export function isTextPath(path: string): boolean {
  return TEXT_EXTENSIONS.has(extname(path));
}

export function isCurrentDocOrExample(path: string): boolean {
  if (path.startsWith('docs/arch/')) return true;
  if (path.startsWith('docs/reference/')) return true;
  if (path.startsWith('docs/guide/')) return true;
  if (path === 'README.md' || path === 'README.zh.md') return true;
  if (path === 'CONTRIBUTING.md') return true;
  if (path.startsWith('packages/') && path.endsWith('/README.md')) return true;
  if (path.startsWith('packages/') && path.includes('/src/')) return true;
  if (path.startsWith('www/app/routes/guide/')) return true;
  if (path.startsWith('www/content/guide/')) return true;
  return false;
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
  // v0.41.0: canonical home moved to protocol/src/framework.ts
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
  const scannerFiles = files.filter((f) =>
    f.path === 'packages/adapter-vite/src/route-scanner.ts' ||
    f.path === 'packages/adapter-vite/src/internal/content/nav/scanner.ts'
  );
  failMatches(
    'metadata-boundary',
    scannerFiles,
    /exportMatch|splitOnCommas|parseValue\(raw/,
    'route/nav metadata must use AST or structured data, not source regex parsing',
    issues,
  );
}

export function assertMojibake(files: TextFile[], issues: Issue[]): void {
  const badChars = [
    '\uFFFD',
    '\u951f',
    '\u9239',
    '\u9225',
    '\u9242',
    '\u9241',
    '\u9283',
    '\u923f',
    '\u9983',
    '\u9514',
    '\u72c5',
    '\u7b0d',
  ];
  for (const file of files) {
    for (const bad of badChars) {
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
  const files = await gitFiles();
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
        `could not read tracked file: ${error instanceof Error ? error.message : String(error)}`,
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
    'type-escape',
    production,
    /\bas\s+any\b/,
    'production as any is forbidden',
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
  const taskMarkerPattern = new RegExp(
    `\\b${'TO' + 'DO'}\\b|\\b${'FIX' + 'ME'}\\b`,
  );
  failMatches(
    'task-markers',
    production.filter((f) => !f.path.startsWith('www/app/data/')),
    taskMarkerPattern,
    'production task markers must be removed or moved to classified SOP debt',
    issues,
  );
  assertDuplicateCounts(textFiles, issues);
  assertStructuredMetadata(textFiles, issues);
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
