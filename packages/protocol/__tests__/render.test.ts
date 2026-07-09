import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import type { RenderError, RenderErrorCode } from '../src/render.ts';

const CODES: RenderErrorCode[] = [
  'LESS_RENDER_INSTANTIATE_FAILED',
  'LESS_RENDER_INVALID_OUTPUT',
  'LESS_RENDER_RENDER_FAILED',
  'LESS_RENDER_NESTED_FAILED',
  'LESS_RENDER_STYLE_FAILED',
  'LESS_RENDER_SERIALIZE_FAILED',
];

Deno.test('RenderErrorCode: all codes use the LESS_RENDER_ prefix', () => {
  for (const code of CODES) {
    assertEquals(code.startsWith('LESS_RENDER_'), true);
  }
});

Deno.test('RenderError: structural contract is satisfiable', () => {
  const err: RenderError = {
    code: 'LESS_RENDER_RENDER_FAILED',
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
