import { assertEquals, assertInstanceOf } from 'jsr:@std/assert@1';
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

Deno.test('@openelement/element exposes one functional authoring helper', () => {
  assertEquals(typeof elementSurface.defineElement, 'function');
  assertEquals('defineLayout' in elementSurface, false);
});
