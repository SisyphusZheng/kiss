import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  assertAllowedTypeEscapes,
  assertDuplicateCounts,
  assertMojibake,
  assertStructuredMetadata,
  failMatches,
  isCurrentDocOrExample,
  isProductionSource,
  type Issue,
  isTextPath,
  type TextFile,
} from './check-architecture-contract.ts';
import { normalizeSlashes } from './lib/path.ts';

const REPLACEMENT_CHAR = String.fromCharCode(0xFFFD);

Deno.test('arch: failMatches flags a positive regex match with location', () => {
  const files: TextFile[] = [{ path: 'README.md', text: 'Use rawHtml to inject.' }];
  const issues: Issue[] = [];
  failMatches('trust-boundary', files, /\brawHtml\b|data-on-/, 'must use trustedHtml', issues);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'trust-boundary');
  assertEquals(issues[0].file, 'README.md');
  assertEquals(issues[0].line, 1);
  assertEquals(issues[0].message, 'must use trustedHtml');
});

Deno.test('arch: failMatches ignores clean input', () => {
  const files: TextFile[] = [{ path: 'README.md', text: 'Use trustedHtml instead.' }];
  const issues: Issue[] = [];
  failMatches('trust-boundary', files, /\brawHtml\b|data-on-/, 'must use trustedHtml', issues);
  assertEquals(issues, []);
});

Deno.test('arch: failMatches ignores matches in inline and block comments', () => {
  const files: TextFile[] = [{
    path: 'README.md',
    text: 'const value = 1; // rawHtml is retired\n/* data-on-click is unsafe */',
  }];
  const issues: Issue[] = [];
  failMatches('trust-boundary', files, /\brawHtml\b|data-on-/, 'must use trustedHtml', issues);
  assertEquals(issues, []);
});

Deno.test('arch: allowed `as unknown as` escape is not flagged as unapproved', () => {
  const files: TextFile[] = [{
    path: 'packages/element/src/internal/core/island.ts',
    text: 'const x = el as unknown as Record<string, unknown>;',
  }];
  const issues: Issue[] = [];
  assertAllowedTypeEscapes(files, issues);
  const unapproved = issues.filter((i) => i.message.includes('not in the reviewed allowlist'));
  assertEquals(unapproved, []);
});

Deno.test('arch: unallowed `as unknown as` escape is flagged', () => {
  const files: TextFile[] = [{
    path: 'packages/element/src/internal/core/foo.ts',
    text: 'const y = a as unknown as Bar;',
  }];
  const issues: Issue[] = [];
  assertAllowedTypeEscapes(files, issues);
  assert(
    issues.some(
      (i) =>
        i.message.includes('not in the reviewed allowlist') &&
        i.file === 'packages/element/src/internal/core/foo.ts',
    ),
  );
});

Deno.test('arch: single canonical CompatibilityClassification passes', () => {
  const files: TextFile[] = [{
    path: 'packages/element/src/internal/protocol/framework.ts',
    text: 'export interface CompatibilityClassification { level: string; }',
  }];
  const issues: Issue[] = [];
  assertDuplicateCounts(files, issues);
  assertEquals(issues.filter((i) => i.check === 'duplicate-type'), []);
});

Deno.test('arch: duplicate CompatibilityClassification is flagged', () => {
  const files: TextFile[] = [
    {
      path: 'packages/element/src/internal/protocol/framework.ts',
      text: 'interface CompatibilityClassification {}',
    },
    { path: 'packages/element/src/other.ts', text: 'interface CompatibilityClassification {}' },
  ];
  const issues: Issue[] = [];
  assertDuplicateCounts(files, issues);
  assert(
    issues.some((i) => i.check === 'duplicate-type' && i.file === 'packages/element/src/other.ts'),
  );
});

Deno.test('arch: missing canonical CompatibilityClassification is flagged', () => {
  const files: TextFile[] = [{ path: 'packages/core/src/x.ts', text: 'interface Other {}' }];
  const issues: Issue[] = [];
  assertDuplicateCounts(files, issues);
  assert(
    issues.some((i) => i.check === 'duplicate-type' && i.message.includes('missing canonical')),
  );
});

Deno.test('arch: route/nav scanner regex usage is flagged', () => {
  const files: TextFile[] = [{
    path: 'packages/adapter-vite/src/route-scanner.ts',
    text: 'exportMatch(/x/);',
  }];
  const issues: Issue[] = [];
  assertStructuredMetadata(files, issues);
  assert(issues.some((i) => i.check === 'metadata-boundary'));
});

Deno.test('arch: route/nav scanner without regex passes', () => {
  const files: TextFile[] = [{
    path: 'packages/adapter-vite/src/route-scanner.ts',
    text: 'const x = 1;',
  }];
  const issues: Issue[] = [];
  assertStructuredMetadata(files, issues);
  assertEquals(issues, []);
});

Deno.test('arch: mojibake is detected', () => {
  const files: TextFile[] = [{
    path: 'packages/core/src/x.ts',
    text: `const s = "${REPLACEMENT_CHAR}";`,
  }];
  const issues: Issue[] = [];
  assertMojibake(files, issues);
  assert(issues.some((i) => i.check === 'encoding'));
});

Deno.test('arch: clean text has no mojibake', () => {
  const files: TextFile[] = [{ path: 'packages/core/src/x.ts', text: 'const s = "hello";' }];
  const issues: Issue[] = [];
  assertMojibake(files, issues);
  assertEquals(issues, []);
});

Deno.test('arch: isProductionSource classifies correctly', () => {
  assert(isProductionSource('packages/core/src/render.ts'));
  assert(isProductionSource('tools/check-foo.ts'));
  assert(isProductionSource('www/vite.config.ts'));
  assert(!isProductionSource('tools/check-architecture-contract.ts'));
  assert(!isProductionSource('README.md'));
  assert(!isProductionSource('packages/core/__tests__/x.test.ts'));
  assert(!isProductionSource('packages/foo/test/fixtures/x.ts'));
});

Deno.test('arch: isCurrentDocOrExample classifies correctly', () => {
  assert(isCurrentDocOrExample('README.md'));
  assert(isCurrentDocOrExample('README.zh.md'));
  assert(isCurrentDocOrExample('docs/guide/x.md'));
  assert(isCurrentDocOrExample('docs/arch/x.md'));
  assert(isCurrentDocOrExample('packages/core/README.md'));
  assert(!isCurrentDocOrExample('CHANGELOG.md'));
  assert(!isCurrentDocOrExample('packages/core/__tests__/x.test.ts'));
});

Deno.test('arch: normalizeSlashes converts backslashes to forward slashes', () => {
  assertEquals(normalizeSlashes('a\\b\\c.ts'), 'a/b/c.ts');
});

Deno.test('arch: isTextPath recognizes text extensions only', () => {
  assert(isTextPath('a.ts'));
  assert(isTextPath('a.md'));
  assert(isTextPath('a.json'));
  assert(!isTextPath('a.png'));
  assert(!isTextPath('a.png'));
});
