/**
 * v0.30.1 architecture contract gate.
 *
 * This gate checks current source and current documentation only. Historical ADRs,
 * old release notes, generated data, fixtures, and tests are intentionally not
 * used as regressions for the active public contract.
 */

import { extname } from 'node:path';

interface Issue {
  check: string;
  file: string;
  line?: number;
  message: string;
}

interface TextFile {
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
    file: 'packages/content/src/index.ts',
    fragment: 'sitemapOpts as unknown as Record<string, unknown>',
    reason: 'Plugin option bag crosses a protocol boundary.',
  },
  {
    file: 'packages/core/src/style-sheet.ts',
    fragment: 'globalThis.CSSStyleSheet as unknown as new () => StyleSheetLike',
    reason:
      'Native CSSStyleSheet has CSSRuleList while the SSR facade exposes an array-like rule contract.',
  },
  {
    file: 'packages/core/src/island.ts',
    fragment: 'el as unknown as Record<string, unknown>',
    reason: 'Custom element prop assignment by dynamic prop name.',
  },
  {
    file: 'packages/core/src/island.ts',
    fragment: '} as unknown as typeof componentClass.prototype.connectedCallback',
    reason: 'Preserve original connectedCallback signature after wrapping.',
  },
  {
    file: 'packages/core/src/prop.ts',
    fragment: 'instance as unknown as {',
    reason: 'Static prop runtime writes element attributes and properties.',
  },
  {
    file: 'packages/element/src/open-element.ts',
    fragment: '} as unknown as typeof HTMLElement)',
    reason: 'SSR HTMLElement stub for environments without DOM.',
  },
  {
    file: 'packages/element/src/open-element.ts',
    fragment: '(target as unknown as {',
    reason: 'adoptedStyleSheets may not be in the configured DOM lib.',
  },
  {
    file: 'packages/element/src/define-element.ts',
    fragment: 'this as unknown as Record<string, unknown>',
    reason: 'Custom element prop collection by dynamic prop name.',
  },
];

const issues: Issue[] = [];

function addIssue(check: string, file: string, message: string, line?: number): void {
  issues.push({ check, file, line, message });
}

function normalizePath(path: string): string {
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

function isTextPath(path: string): boolean {
  return TEXT_EXTENSIONS.has(extname(path));
}

function isCurrentDocOrExample(path: string): boolean {
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

function isProductionSource(path: string): boolean {
  if (path.includes('/__tests__/') || path.includes('/test/fixtures/')) return false;
  if (path === 'tools/check-architecture-contract.ts') return false;
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

function failMatches(
  check: string,
  files: TextFile[],
  re: RegExp,
  message: string,
): void {
  for (const file of files) {
    eachLine(file, (line, lineNo) => {
      if (re.test(line)) addIssue(check, file.path, message, lineNo);
    });
  }
}

function assertAllowedTypeEscapes(files: TextFile[]): void {
  const found = new Set<string>();
  for (const file of files) {
    eachLine(file, (line, lineNo) => {
      if (!line.includes('as unknown as')) return;
      const allow = TYPE_ESCAPE_ALLOWLIST.find((entry) =>
        entry.file === file.path && line.includes(entry.fragment)
      );
      if (!allow) {
        addIssue(
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
        'type-escape',
        entry.file,
        `allowlist entry is stale: ${entry.reason}`,
      );
    }
  }
}

function assertDuplicateCounts(files: TextFile[]): void {
  const compatibilityHits: Array<{ file: string; line: number }> = [];
  for (const file of files.filter((f) => f.path.startsWith('packages/'))) {
    eachLine(file, (line, lineNo) => {
      if (line.includes('interface CompatibilityClassification')) {
        compatibilityHits.push({ file: file.path, line: lineNo });
      }
    });
  }
  // v0.41.0: canonical home moved to protocol/src/framework.ts
  const canonicalFile = 'packages/protocol/src/framework.ts';
  if (compatibilityHits.length !== 1 || compatibilityHits[0].file !== canonicalFile) {
    for (const hit of compatibilityHits) {
      addIssue(
        'duplicate-type',
        hit.file,
        `CompatibilityClassification must have exactly one canonical interface in ${canonicalFile}`,
        hit.line,
      );
    }
    if (compatibilityHits.length === 0) {
      addIssue(
        'duplicate-type',
        canonicalFile,
        'missing canonical CompatibilityClassification interface',
      );
    }
  }
}

function assertStructuredMetadata(files: TextFile[]): void {
  const scannerFiles = files.filter((f) =>
    f.path === 'packages/adapter-vite/src/route-scanner.ts' ||
    f.path === 'packages/content/src/nav/scanner.ts'
  );
  failMatches(
    'metadata-boundary',
    scannerFiles,
    /exportMatch|splitOnCommas|parseValue\(raw/,
    'route/nav metadata must use AST or structured data, not source regex parsing',
  );
}

function assertMojibake(files: TextFile[]): void {
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
        'byte-read',
        path,
        `could not read tracked file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const currentDocs = textFiles.filter((f) => isCurrentDocOrExample(f.path));
  const production = textFiles.filter((f) => isProductionSource(f.path));
  const coreSource = production.filter((f) => f.path.startsWith('packages/core/src/'));

  failMatches(
    'render-contract',
    currentDocs,
    /render\(\):\s*(?:Promise<)?string\b|string\s*\|\s*VNode/,
    'current source/docs must teach render(): VNode | null only',
  );
  failMatches(
    'trust-boundary',
    currentDocs,
    /\brawHtml\b|data-on-/,
    'current source/docs must use trustedHtml and VNode event handlers',
  );
  failMatches(
    'rename-contract',
    production.concat(currentDocs),
    /\blessjs\b|\blessPipeline\b|\bless-plugin\b|\bless-add\b|\bless-install-guide\b|\bless:|virtual:less|less-devtool|less:ready|\bLess(?:PackageManifest|BuildContext|Error|ContentOptions|I18nOptions|BlogOptions|Renderer|Middleware|Logger)\b|classifyLessManifest/,
    'active source/docs must use openElement naming for public and observable contracts',
  );
  failMatches(
    'metadata-contract',
    production.concat(currentDocs),
    /export const less\b|\.less\b|\bless\s*\?:|\bless\s*:\s*\{|\bless\.(?:ssr|dsd|hydrate|module|layer)/,
    'active metadata must use export const openElement and manifest.openElement',
  );
  failMatches(
    'core-render',
    coreSource,
    /wrongTypeErrorHtml|typeof\s+result\s*===\s*['"]string['"]|Components must return a string/,
    'core must not carry the legacy string-render branch',
  );
  failMatches(
    'type-escape',
    production,
    /\bas\s+any\b/,
    'production as any is forbidden',
  );
  assertAllowedTypeEscapes(production);
  failMatches(
    'ts-suppression',
    production,
    /@ts-ignore|@ts-expect-error/,
    'production TypeScript suppressions are forbidden',
  );
  const taskMarkerPattern = new RegExp(
    `\\b${'TO' + 'DO'}\\b|\\b${'FIX' + 'ME'}\\b`,
  );
  failMatches(
    'task-markers',
    production.filter((f) => !f.path.startsWith('www/app/data/')),
    taskMarkerPattern,
    'production task markers must be removed or moved to classified SOP debt',
  );
  assertDuplicateCounts(textFiles);
  assertStructuredMetadata(textFiles);
  assertMojibake(production.concat(currentDocs));

  if (readFailures > 0) {
    addIssue('byte-read', '<inventory>', `${readFailures} tracked files could not be read`);
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

await main();
