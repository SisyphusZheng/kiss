/**
 * @openelement/core/render-dsd-stream — streaming Dsd callbacks/metrics.
 *
 * streaming-dsd.test.ts covers shell/footer/order/fallback/escaping. This file
 * covers the render-dsd-stream.ts specific surface: onChunk/onError callbacks
 * and the metrics collector being mutated in place.
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import {
  createRenderDsdStreamMetrics,
  renderDsdStream,
  type RenderDsdStreamComponent,
} from '../src/render-dsd-stream.ts';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';

function makeComponent(body: () => VNode | null): CustomElementConstructor {
  return class {
    render(): VNode | null {
      return body();
    }
  } as unknown as CustomElementConstructor;
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(new TextDecoder().decode(value));
  }
  return chunks.join('');
}

Deno.test('createRenderDsdStreamMetrics returns a fresh collector', () => {
  const a = createRenderDsdStreamMetrics();
  const b = createRenderDsdStreamMetrics();
  assertEquals(a.chunkCount, 0);
  assertEquals(a.errorCount, 0);
  assertEquals(a.endedAt, undefined);
  assertExists(a.startedAt);
  assertEquals(a === b, false, 'each call returns a distinct object');
});

Deno.test('renderDsdStream invokes onChunk for every component', async () => {
  const seen: string[] = [];
  const compA: RenderDsdStreamComponent = {
    tagName: 'cb-a',
    componentClass: makeComponent(() => jsx('span', { children: 'A' })),
  };
  const compB: RenderDsdStreamComponent = {
    tagName: 'cb-b',
    componentClass: makeComponent(() => jsx('span', { children: 'B' })),
  };

  const stream = renderDsdStream([compA, compB], {
    onChunk: (chunk) => seen.push(chunk.html),
  });
  await readStream(stream);

  assertEquals(seen.length, 2);
  assertEquals(seen[0].includes('<cb-a>'), true);
  assertEquals(seen[1].includes('<cb-b>'), true);
});

Deno.test('renderDsdStream invokes onError for a failing component', async () => {
  const errors: string[] = [];
  class FailComponent {
    render(): VNode {
      throw new Error('boom');
    }
  }
  const fail: RenderDsdStreamComponent = {
    tagName: 'cb-fail',
    componentClass: FailComponent as unknown as CustomElementConstructor,
  };
  const ok: RenderDsdStreamComponent = {
    tagName: 'cb-ok',
    componentClass: makeComponent(() => jsx('div', { children: 'ok' })),
  };

  const stream = renderDsdStream([fail, ok], {
    onError: (error) => errors.push(error.message),
  });
  const body = await readStream(stream);

  assertEquals(errors.includes('boom'), true);
  assertEquals(body.includes('<cb-ok>'), true, 'stream continues past failure');
});

Deno.test('renderDsdStream mutates the provided metrics collector', async () => {
  const metrics = createRenderDsdStreamMetrics();
  class FailComponent {
    render(): VNode {
      throw new Error('boom');
    }
  }
  const comp: RenderDsdStreamComponent = {
    tagName: 'm-el',
    componentClass: makeComponent(() => jsx('div', { children: 'x' })),
  };
  const fail: RenderDsdStreamComponent = {
    tagName: 'm-fail',
    componentClass: FailComponent as unknown as CustomElementConstructor,
  };

  const stream = renderDsdStream([comp, fail], { metrics });
  await readStream(stream);

  assertEquals(metrics.chunkCount, 2, 'one chunk per component');
  assertEquals(metrics.errorCount, 1, 'one recorded error');
  assertExists(metrics.endedAt, 'endedAt is stamped on completion');
});
