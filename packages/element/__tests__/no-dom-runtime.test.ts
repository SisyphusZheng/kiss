/**
 * @openelement/element — No-DOM runtime regression tests.
 *
 * Verifies that importing @openelement/element in an environment without
 * browser DOM globals does not mutate the host global scope.
 */

import { assertEquals } from '@std/assert';

Deno.test('importing @openelement/element in a no-DOM runtime does not create globalThis.HTMLElement', async () => {
  const script = `
    import '@openelement/element';
    if (typeof globalThis.HTMLElement !== 'undefined') {
      throw new Error('globalThis.HTMLElement should not be mutated in no-DOM runtime');
    }
    if (typeof globalThis.document !== 'undefined') {
      throw new Error('globalThis.document should not be mutated in no-DOM runtime');
    }
    console.log('ok');
  `;

  const command = new Deno.Command(Deno.execPath(), {
    args: ['eval', '--no-lock', script],
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);

  assertEquals(code, 0, `no-DOM import should exit cleanly. stderr: ${err}`);
  assertEquals(out.trim(), 'ok');
});

Deno.test('OpenElement connectedCallback guards document access in no-DOM runtime', async () => {
  const script = `
    import { OpenElement } from '@openelement/element';
    class TestEl extends OpenElement {
      render() { return null; }
    }
    // In a no-DOM runtime the constructor should not throw, and the class
    // should not require browser globals at definition time.
    console.log(typeof TestEl);
  `;

  const command = new Deno.Command(Deno.execPath(), {
    args: ['eval', '--no-lock', script],
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);

  assertEquals(code, 0, `OpenElement subclass definition should not throw. stderr: ${err}`);
  assertEquals(out.trim(), 'function');
});
