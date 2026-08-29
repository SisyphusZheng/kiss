import { assertEquals } from '@std/assert';
import { validateSpikeProgram } from '../../src/internal/compiled/program.ts';

Deno.test('alpha.2 fixed Parts validate every exact DOM sink', () => {
  const program = validateSpikeProgram({
    version: 1,
    tag: 'oe-fixed-parts',
    template: [{
      k: 'el',
      tag: 'div',
      attrs: [],
      children: [],
    }],
    parts: [
      { k: 'attr', index: 0, signal: 'title', name: 'title', path: [0] },
      { k: 'prop', index: 1, signal: 'value', name: 'value', path: [0] },
      { k: 'boolean', index: 2, signal: 'disabled', name: 'disabled', path: [0] },
      { k: 'class', index: 3, signal: 'classes', path: [0] },
      { k: 'style', index: 4, signal: 'styles', path: [0] },
      {
        k: 'event',
        index: 5,
        event: 'click',
        handler: 'onClick',
        options: { capture: true, once: true, passive: false },
        path: [0],
      },
      { k: 'ref', index: 6, ref: 'captureRef', path: [0] },
    ],
  });

  assertEquals(program.parts.map((part) => part.k), [
    'attr',
    'prop',
    'boolean',
    'class',
    'style',
    'event',
    'ref',
  ]);
});
