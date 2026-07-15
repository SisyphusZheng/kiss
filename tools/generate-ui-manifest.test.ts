import { assertEquals, assertStringIncludes } from '@std/assert';
import { parseEvents } from './generate-ui-manifest.ts';

Deno.test('UI event manifest parses nested detail objects with TypeScript AST', () => {
  const [event] = parseEvents(`
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: 1, nested: { enabled: true } },
      bubbles: true,
    }));
  `);
  assertEquals(event.name, 'change');
  assertStringIncludes(event.type ?? '', 'nested: { enabled: boolean }');
});
