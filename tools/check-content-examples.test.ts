/** Content example type-check gate tests (#1159). */
import { assert, assertEquals } from '@std/assert';
import {
  extractExamples,
  suppressElidedDiagnostic,
  typeCheckExamples,
} from './check-content-examples.ts';
import ts from 'typescript';

Deno.test('extractExamples: ts/tsx plus the typescript/js aliases, importing @openelement', () => {
  const markdown = [
    '```ts',
    "import { signal } from '@openelement/element';",
    'const count = signal(0);',
    '```',
    '```bash',
    'deno task dev',
    '```',
    '```ts',
    "import { defineConfig } from 'vite';",
    '```',
    '```tsx',
    "import { OpenElement } from '@openelement/element';",
    'export class X extends OpenElement {}',
    '```',
    '```typescript',
    "import { signal } from '@openelement/element';",
    'const other = signal(1);',
    '```',
    '```js',
    "import { signal } from '@openelement/element';",
    'const plain = signal(2);',
    '```',
  ].join('\n');
  const examples = extractExamples('guide/x.md', markdown);
  assertEquals(examples.length, 4);
  assertEquals(examples.map((example) => example.lang), ['ts', 'tsx', 'ts', 'ts']);
});

Deno.test('typeCheckExamples: framework-surface errors fail closed (RED proof)', async () => {
  const failures = await typeCheckExamples([
    {
      file: 'fixture.md',
      index: 0,
      lang: 'ts',
      code: "import { noSuchExport } from '@openelement/element';\nconsole.log(noSuchExport);",
    },
  ]);
  assertEquals(failures.length, 1);
  assert(failures[0].message.includes('TS2305'), failures[0].message);
});

Deno.test('typeCheckExamples: unknown @openelement module fails closed', async () => {
  const failures = await typeCheckExamples([
    {
      file: 'fixture.md',
      index: 0,
      lang: 'ts',
      code: "import { x } from '@openelement/no-such-package';\nconsole.log(x);",
    },
  ]);
  assertEquals(failures.length, 1);
  assert(failures[0].message.includes('TS2307'), failures[0].message);
});

Deno.test('typeCheckExamples: elided consumer context is tolerated, real API checks apply', async () => {
  const failures = await typeCheckExamples([
    {
      file: 'fixture.md',
      index: 0,
      lang: 'ts',
      code: [
        "import { signal } from '@openelement/element';",
        "import GuestbookPage from '../components/page-guestbook.tsx'; // consumer file, elided",
        'const count = signal(0);',
        'count.value += 1;',
        'console.log(GuestbookPage, missingAppHelper());',
        '',
      ].join('\n'),
    },
  ]);
  assertEquals(failures, []);
});

Deno.test('suppressElidedDiagnostic: suppression boundary is exact', () => {
  const make = (code: number, messageText: string): ts.Diagnostic => ({
    file: undefined,
    start: 0,
    length: 0,
    code,
    messageText,
    category: ts.DiagnosticCategory.Error,
    source: undefined,
  });
  assertEquals(suppressElidedDiagnostic(make(2307, "Cannot find module 'vite'.")), true);
  assertEquals(
    suppressElidedDiagnostic(make(2307, "Cannot find module '@openelement/generated/blog-data'.")),
    true,
  );
  assertEquals(
    suppressElidedDiagnostic(make(2307, "Cannot find module '@openelement/element'.")),
    false,
  );
  assertEquals(suppressElidedDiagnostic(make(2304, "Cannot find name 'listEntries'.")), true);
  // #1307: an undefined name that IS a documented framework export must not be
  // suppressed — the snippet has to import it so its calls are type-checked.
  assertEquals(suppressElidedDiagnostic(make(2304, "Cannot find name 'definePage'.")), false);
  assertEquals(suppressElidedDiagnostic(make(2304, "Cannot find name 'signal'.")), false);
  assertEquals(
    suppressElidedDiagnostic(
      make(2304, "Cannot find name 'listEntries'."),
      new Set(['definePage']),
    ),
    true,
  );
  assertEquals(
    suppressElidedDiagnostic(make(2339, "Property 'entries' does not exist on type '{}'.")),
    true,
  );
  assertEquals(
    suppressElidedDiagnostic(make(2339, "Property 'x' does not exist on type 'OpenElement'.")),
    false,
  );
  assertEquals(suppressElidedDiagnostic(make(2345, 'Argument of type ...')), false);
});
