/**
 * @openelement/core - errors.ts tests (Deno)
 * ADR-0053: Updated for unified error architecture.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { ErrorCode, OpenElementError, SsrRenderError } from '../src/errors.ts';

Deno.test('errors', async (t) => {
  await t.step('OpenElementError has code, severity, phase, recoverable', () => {
    const err = new OpenElementError('test', {
      code: ErrorCode.RENDER_ERROR,
      severity: 'error',
      phase: 'render',
      recoverable: true,
    });
    assertEquals(err.code, ErrorCode.RENDER_ERROR);
    assertEquals(err.severity, 'error');
    assertEquals(err.phase, 'render');
    assertEquals(err.recoverable, true);
    assertEquals(err.name, 'OpenElementError');
  });

  await t.step('SsrRenderError extends RenderError', () => {
    const cause = new Error('render failed');
    const err = new SsrRenderError('app/routes/index.ts', cause);
    assertEquals(err.code, ErrorCode.SSR_RENDER_ERROR);
    assertEquals(err.severity, 'error');
    assertEquals(err.recoverable, false);
    assertEquals(err.sourceError, cause);
    assertEquals(err.componentPath, 'app/routes/index.ts');
  });

  await t.step('toJSON returns structured error', () => {
    const err = new OpenElementError('test error', {
      code: ErrorCode.UNKNOWN,
      severity: 'warning',
      phase: 'build',
      recoverable: false,
    });
    const json = err.toJSON() as Record<string, unknown>;
    assertEquals(json.code, ErrorCode.UNKNOWN);
    assertEquals(json.message, 'test error');
    assertEquals(json.severity, 'warning');
    assertEquals(json.phase, 'build');
  });
});
