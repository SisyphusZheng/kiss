/**
 * Claim-parity guard for the attribute-escape contract (issue #1220, L1).
 *
 * The compiled server serializer (server/index.ts) and the runtime seed
 * serializer (runtime.ts) emit DSD/seed HTML through ONE shared escapeAttr
 * implementation (internal/core/html-escape.ts). Before the convergence the
 * runtime escaped only `&` and `"` while the server also escaped `<`, `>`,
 * and `'`, so the same program produced different bytes on the two paths and
 * claim parity could drift. This test replays an attribute corpus through
 * both call sites and requires byte-identical output.
 */

import { assertEquals } from '@std/assert';
import { serializeToHtml as serializeRuntime } from '../src/internal/compiled/runtime.ts';
import { serializeToHtml as serializeServer } from '../src/internal/compiled/server/index.ts';
import { escapeAttr } from '../src/internal/core/html-escape.ts';
import { testProgram } from './compiled-runtime/test-program.ts';

const CORPUS: readonly string[] = [
  `a&b"c<d>e'f`,
  `'`,
  `<`,
  `>`,
  `"`,
  `&`,
  `&quot;entity-looking&quot;`,
  `plain`,
  `line\nbreak\ttab`,
  `unicode é ‹› „ “`,
  `</script><script>alert(1)</script>`,
];

function hostWith(value: unknown) {
  return { signals: { v: { value, subscribe: () => () => {} } }, handlers: {} };
}

type RuntimeHost = Parameters<typeof serializeRuntime>[1];

Deno.test('escape parity: attr Part corpus is byte-identical across both serializers', () => {
  for (const value of CORPUS) {
    const program = testProgram({
      tag: 'x-parity',
      template: [{ k: 'el', tag: 'div', attrs: [], children: [] }],
      parts: [{ k: 'attr', index: 0, signal: 'v', name: 'title', path: [0] }],
    });
    const runtime = serializeRuntime(program, hostWith(value) as unknown as RuntimeHost);
    const server = serializeServer(program, hostWith(value));
    assertEquals(runtime, server, `serializers diverged for ${JSON.stringify(value)}`);
    assertEquals(
      runtime,
      `<div title="${escapeAttr(value)}"></div>`,
      `shared escapeAttr contract broken for ${JSON.stringify(value)}`,
    );
  }
});

Deno.test('escape parity: fixed attribute corpus is byte-identical across both serializers', () => {
  for (const value of CORPUS) {
    const program = testProgram({
      tag: 'x-parity',
      template: [{ k: 'el', tag: 'div', attrs: [['title', value]], children: [] }],
      parts: [],
    });
    const runtime = serializeRuntime(program, hostWith(undefined) as unknown as RuntimeHost);
    const server = serializeServer(program, hostWith(undefined));
    assertEquals(runtime, server, `serializers diverged for ${JSON.stringify(value)}`);
    assertEquals(runtime, `<div title="${escapeAttr(value)}"></div>`);
  }
});

Deno.test('escape parity: canonical contract escapes & < > " and \'', () => {
  assertEquals(escapeAttr(`a&b"c<d>e'f`), 'a&amp;b&quot;c&lt;d&gt;e&#39;f');
});
