import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import { ErrorCode, ERROR_PREFIX, type OpenElementError } from '../src/errors.ts';

Deno.test('ErrorCode: every key maps to its own string value', () => {
  for (const [key, value] of Object.entries(ErrorCode)) {
    assertEquals(value, key);
  }
});

Deno.test('ErrorCode: well-known codes are present', () => {
  assertEquals(ErrorCode.SSR_RENDER_ERROR, 'SSR_RENDER_ERROR');
  assertEquals(ErrorCode.ISLAND_RENDER_ERROR, 'ISLAND_RENDER_ERROR');
  assertEquals(ErrorCode.PROP_VALIDATION_ERROR, 'PROP_VALIDATION_ERROR');
  assertEquals(ErrorCode.TAG_VALIDATION_ERROR, 'TAG_VALIDATION_ERROR');
  assertEquals(ErrorCode.NAVIGATION_ERROR, 'NAVIGATION_ERROR');
  assertEquals(ErrorCode.BUILD_ERROR, 'BUILD_ERROR');
  assertEquals(ErrorCode.RENDER_ERROR, 'RENDER_ERROR');
  assertEquals(ErrorCode.BOUNDARY_CAUGHT, 'BOUNDARY_CAUGHT');
  assertEquals(ErrorCode.UNKNOWN, 'UNKNOWN');
});

Deno.test('ERROR_PREFIX: branded message prefix', () => {
  assertEquals(ERROR_PREFIX, '[openElement]');
});

Deno.test('OpenElementError: structural contract is satisfiable', () => {
  const sample: OpenElementError = {
    name: 'OpenElementError',
    message: 'boom',
    code: ErrorCode.RENDER_ERROR,
    severity: 'error',
    phase: 'render',
    recoverable: false,
    stack: '',
  };
  assertExists(sample.code);
  assertEquals(sample.severity, 'error');
  assertEquals(sample.phase, 'render');
  assertEquals(sample.recoverable, false);
});
