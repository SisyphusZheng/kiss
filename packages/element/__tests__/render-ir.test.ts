import { assertRejects } from 'jsr:@std/assert@^1.0.0';
import { jsx } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/internal/core/render-ir.ts';

Deno.test('render IR propagates component failures to the application boundary', async () => {
  function BrokenComponent(): never {
    throw new Error('component failed');
  }

  await assertRejects(
    () => renderDsdTree(jsx(BrokenComponent, {})),
    Error,
    'component failed',
  );
});
