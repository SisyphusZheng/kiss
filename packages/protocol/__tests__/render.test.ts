import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import type { RenderError, RenderErrorCode } from '../src/render.ts';

const CODES: RenderErrorCode[] = [
  'OPEN_ELEMENT_RENDER_INSTANTIATE_FAILED',
  'OPEN_ELEMENT_RENDER_INVALID_OUTPUT',
  'OPEN_ELEMENT_RENDER_RENDER_FAILED',
  'OPEN_ELEMENT_RENDER_NESTED_FAILED',
  'OPEN_ELEMENT_RENDER_STYLE_FAILED',
  'OPEN_ELEMENT_RENDER_SERIALIZE_FAILED',
];

Deno.test('RenderErrorCode: all codes use the OPEN_ELEMENT_RENDER_ prefix', () => {
  for (const code of CODES) {
    assertEquals(code.startsWith('OPEN_ELEMENT_RENDER_'), true);
  }
});

Deno.test('RenderError: structural contract is satisfiable', () => {
  const err: RenderError = {
    code: 'OPEN_ELEMENT_RENDER_RENDER_FAILED',
    severity: 'error',
    phase: 'render',
    tagName: 'my-element',
    message: 'render threw',
    recoverable: true,
  };
  assertExists(err.code);
  assertEquals(err.severity, 'error');
  assertEquals(err.tagName, 'my-element');
  assertEquals(err.recoverable, true);
});
