import { assertEquals, assertInstanceOf } from '@std/assert';
import { OpenElement } from '../src/index.ts';
import * as elementSurface from '../src/index.ts';

Deno.test('@openelement/element exports OpenElement facade', () => {
  const element = new OpenElement();

  assertInstanceOf(element, OpenElement);
});

Deno.test('@openelement/element preserves light DOM opt-in static contract', () => {
  class LightElement extends OpenElement {
    static override renderMode = 'light' as const;
  }

  assertEquals(LightElement.renderMode, 'light');
});

Deno.test('@openelement/element exports the compiled pipeline entries', () => {
  // 0.44: the functional authoring helper (defineElement) and the runtime JSX
  // factories (For/jsx/...) were removed with the legacy renderer. The public
  // pipeline entries are the compiled server render and the claim bootstrap.
  assertEquals('defineElement' in elementSurface, false);
  assertEquals('defineLayout' in elementSurface, false);
  assertEquals('For' in elementSurface, false);
  assertEquals('jsx' in elementSurface, false);
  assertEquals(typeof elementSurface.renderDsd, 'function');
  assertEquals(typeof elementSurface.ensurePreHydrationClickCapture, 'function');
});
