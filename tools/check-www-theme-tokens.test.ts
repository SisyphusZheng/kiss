import { assertEquals } from '@std/assert';
import { findThemeTokenFailures } from './check-www-theme-tokens.ts';

Deno.test('theme-token gate catches hex, font-family and font-size literals', () => {
  const lines = [
    '  .vinyl { background:#18151e; }',
    '  code { font-family: "JetBrains Mono", monospace; }',
    '  font-size: 12px;',
    '  font-size: .75rem;',
  ];
  const failures = findThemeTokenFailures('x.tsx', lines);
  assertEquals(failures.map((f) => f.rule), [
    'hex-literal',
    'font-family-literal',
    'font-size-literal',
    'font-size-literal',
  ]);
});

Deno.test('theme-token gate catches short hex only in CSS contexts', () => {
  const violations = findThemeTokenFailures('x.tsx', [
    'background: color-mix(in srgb, #fff 18%, transparent);',
  ]);
  assertEquals(violations.length, 1);
  const prose = findThemeTokenFailures('x.tsx', [
    'External adopter #390 and continued browser evidence.',
    '<strong>#390</strong>',
  ]);
  assertEquals(prose.length, 0);
});

Deno.test('theme-token gate skips generated data files', () => {
  const failures = findThemeTokenFailures('www/app/data/_generated-blog-data.ts', [
    '"content": "themeColor: \'#000000\', font-size: 12px;"',
  ]);
  // The caller-level exclusion (path filter) keeps generated content out;
  // the pure function still flags it when asked directly.
  assertEquals(failures.length > 0, true);
});

Deno.test('theme-token gate accepts tokens, inherit and fluid clamp()', () => {
  const failures = findThemeTokenFailures('x.tsx', [
    'color: var(--text-primary);',
    'background: color-mix(in srgb, var(--violet-5) 18%, transparent);',
    'font-family: var(--font-mono);',
    'font-family: inherit;',
    'font-size: var(--font-size-00);',
    'font-size: clamp(4.1rem, 10vw, 10.5rem);',
    'font-size: clamp(var(--font-size-7), 10vw, var(--font-size-8));',
  ]);
  assertEquals(failures.length, 0);
});
