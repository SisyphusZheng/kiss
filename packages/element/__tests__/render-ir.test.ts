import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { jsx } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/internal/core/render-ir.ts';
import { collectEventBindings } from '../src/internal/core/event-hydration.ts';
import { MAX_SSR_NESTING_DEPTH, renderDsd } from '../src/internal/core/render-dsd.ts';

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

Deno.test('render IR safely ignores dangerous and read-only component props', async () => {
  class SafeComponent {
    get label(): string {
      return 'declared';
    }

    render() {
      return jsx('span', { children: this.label });
    }
  }

  const html = await renderDsdTree(jsx(SafeComponent, {
    label: 'overwritten',
    constructor: 'polluted',
    __proto__: { polluted: true },
  }));

  assertStringIncludes(html, 'declared');
  assertEquals((Object.prototype as { polluted?: boolean }).polluted, undefined);
});

Deno.test('event hydration safely ignores read-only component props', () => {
  class SafeComponent {
    get label(): string {
      return 'declared';
    }

    render() {
      return jsx('button', { onClick: () => this.label });
    }
  }

  const bindings = collectEventBindings(jsx(SafeComponent, {
    label: 'overwritten',
    prototype: 'polluted',
  }));

  assertEquals(bindings.size, 1);
});

Deno.test('SSR rejects rendering beyond the nesting-depth limit', async () => {
  class RecursiveElement {
    render() {
      return jsx('recursive-element', {});
    }
  }

  await assertRejects(
    () =>
      renderDsd('recursive-element', {
        componentClass: RecursiveElement as unknown as CustomElementConstructor,
        nestingDepth: MAX_SSR_NESTING_DEPTH + 1,
      }),
    Error,
    `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH}`,
  );
});
