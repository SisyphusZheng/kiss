import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { OpenElement } from '@openelement/element';

// We test the new definePreactIsland by verifying:
// 1. The bridge module has no top-level await (stays synchronously renderable)
// 2. On the client path render() returns null and activation goes through clientActivate
//
// The SSR/registration contract is covered by preact-smoke.test.ts; both files
// share the DOM stubs from dom-stubs.ts.

import { definePreactIsland } from '../src/preact.ts';
import { installDomStubs } from './dom-stubs.ts';

Deno.test('preact bridge has no top-level await and remains synchronously renderable', async () => {
  const source = await Deno.readTextFile(new URL('../src/preact.ts', import.meta.url));
  assertEquals(/^\s*await\s+import\(/m.test(source), false);
  assertEquals(source.includes('= await import('), false);
});

Deno.test('definePreactIsland client path skips render() and activates via clientActivate', () => {
  const restore = installDomStubs();
  try {
    const Component = (props: { label: string }) => `<span>${props.label}</span>`;
    const ctor = definePreactIsland('test-client-island', Component as never, {
      props: { label: 'Client' },
    });

    const instance = new ctor() as OpenElement & { clientActivate: () => void };
    // On client, render() should return null
    assertEquals(instance.render(), null);
    // clientActivate() should exist and be callable
    assertEquals(typeof instance.clientActivate, 'function');
  } finally {
    restore();
  }
});
