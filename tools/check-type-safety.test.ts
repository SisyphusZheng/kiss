import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { isCodeLine, type Issue, scanSourcesForAnyIssues } from './check-type-safety.ts';

const SAMPLE = 'packages/core/src/example.ts';

Deno.test('type-safety: detects `as any` cast escape', () => {
  const issues = scanSourcesForAnyIssues([{ path: SAMPLE, text: 'const x = foo() as any;' }]);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].line, 1);
  assertEquals(issues[0].file, SAMPLE);
  assert(issues[0].text.includes('cast'));
});

Deno.test('type-safety: detects `: any` annotation escape', () => {
  const issues = scanSourcesForAnyIssues([{ path: SAMPLE, text: 'function f(x: any): void {}' }]);
  assertEquals(issues.length, 1);
  assert(issues[0].text.includes('annotation'));
});

Deno.test('type-safety: detects `any[]` in a generic position', () => {
  // `as any` and `: any` do not match here, isolating the any[] branch.
  const issues = scanSourcesForAnyIssues([
    { path: SAMPLE, text: 'const m: Map<string, any[]> = new Map();' },
  ]);
  assertEquals(issues.length, 1);
  assert(issues[0].text.includes('array'));
});

Deno.test('type-safety: allows `unknown` escapes', () => {
  const issues = scanSourcesForAnyIssues([
    {
      path: SAMPLE,
      text: 'const v = x as unknown as Y;\nconst u: unknown = {};\nconst list: unknown[] = [];',
    },
  ]);
  assertEquals(issues, []);
});

Deno.test('type-safety: ignores any escapes inside comments', () => {
  const issues = scanSourcesForAnyIssues([
    { path: SAMPLE, text: '// we must not use as any here\n/* const x = y as any; */' },
  ]);
  assertEquals(issues, []);
});

Deno.test('type-safety: reports no issues for clean sources', () => {
  const issues = scanSourcesForAnyIssues([
    { path: 'packages/core/src/a.ts', text: 'export const x = 1;' },
    { path: 'packages/core/src/b.ts', text: 'export function y(): number {\n  return 2;\n}' },
  ]);
  assertEquals(issues, []);
});

Deno.test('type-safety: reports the first matching escape per line only', () => {
  // `as any` matches before `: any`, so only one issue is recorded.
  const issues = scanSourcesForAnyIssues([{ path: SAMPLE, text: 'const x = y as any; // : any' }]);
  assertEquals(issues.length, 1);
  assert(issues[0].text.includes('cast'));
});

Deno.test('type-safety: isCodeLine skips comments but keeps code', () => {
  assert(!isCodeLine('// foo as any'));
  assert(!isCodeLine('* foo as any'));
  assert(!isCodeLine('/* foo as any'));
  assert(isCodeLine('const x = y as any;'));
  assert(isCodeLine('  const x = y as any;'));
});

Deno.test('type-safety: returns typed Issue objects', () => {
  const issues: Issue[] = scanSourcesForAnyIssues([{ path: SAMPLE, text: 'const x = y as any;' }]);
  assertEquals(typeof issues[0].line, 'number');
  assertEquals(typeof issues[0].file, 'string');
});
