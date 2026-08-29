import { assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import { CompiledElementKernel } from '../../src/internal/compiled/runtime/kernel.ts';
import { CompiledContextService } from '../../src/internal/compiled/runtime/context.ts';
import { createContext } from '../../src/internal/core/signal-context.ts';
import { validateSpikeProgram } from '../../src/internal/compiled/program.ts';
import { signal } from '../../src/internal/signal/framework.ts';
import { TestDocument, type TestElement } from './test-dom.ts';

const CONTEXT_PROGRAM = validateSpikeProgram({
  version: 1,
  tag: 'oe-context-test',
  template: [{ k: 'el', tag: 'div', attrs: [], children: [{ k: 'part', index: 0 }] }],
  parts: [{ k: 'text', index: 0, signal: 'message' }],
});

function asElement(node: TestElement): HTMLElement {
  return node as unknown as HTMLElement;
}

Deno.test('context consumption walks nested elements and crosses shadow boundaries', () => {
  const document = new TestDocument();
  const theme = createContext<string>(Symbol('theme'), 'light');

  // Plain nested light DOM.
  const outer = document.createElement('x-outer');
  const middle = document.createElement('x-middle');
  const inner = document.createElement('x-inner');
  outer.appendChild(middle);
  middle.appendChild(inner);

  const provider = new CompiledContextService(asElement(outer));
  provider.provide(theme, 'dark');

  const nested = new CompiledContextService(asElement(inner));
  const seen: string[] = [];
  nested.connect();
  nested.consume(theme, (value) => seen.push(value));
  assertEquals(seen, ['dark']);

  // Open and closed shadow roots both forward the lookup to the host.
  let provided = 'dark';
  for (const mode of ['open', 'closed'] as const) {
    const shadowHost = document.createElement('x-shadow-host');
    const shadowInner = document.createElement('x-shadow-inner');
    middle.appendChild(shadowHost);
    const root = shadowHost.attachShadow({ mode });
    root.appendChild(shadowInner);

    const consumer = new CompiledContextService(asElement(shadowInner));
    const shadowSeen: string[] = [];
    consumer.connect();
    consumer.consume(theme, (value) => shadowSeen.push(value));
    assertEquals(shadowSeen, [provided], `${mode} shadow boundary is crossed`);

    provided = `dim-${mode}`;
    provider.provide(theme, provided);
    assertEquals(shadowSeen.length, 2, 'provider updates reach the subscriber exactly once');
    assertEquals(shadowSeen[1], provided);
    consumer.dispose();
  }
});

Deno.test('context consumption without a provider yields the default value', () => {
  const document = new TestDocument();
  const theme = createContext<string>(Symbol('unprovided'), 'light');
  const outer = document.createElement('x-outer');
  const lone = document.createElement('x-lone');
  outer.appendChild(lone);

  const consumer = new CompiledContextService(asElement(lone));
  const seen: string[] = [];
  consumer.connect();
  consumer.consume(theme, (value) => seen.push(value));
  assertEquals(seen, ['light']);
  consumer.dispose();
});

Deno.test('context subscriptions clean up exactly once and reconnect without duplicates', () => {
  const document = new TestDocument();
  const theme = createContext<string>(Symbol('lifecycle'), 'light');
  const host = document.createElement('x-host');
  const child = document.createElement('x-child');
  host.appendChild(child);

  const provider = new CompiledContextService(asElement(host));
  provider.provide(theme, 'dark');
  const consumer = new CompiledContextService(asElement(child));
  const seen: string[] = [];
  consumer.consume(theme, (value) => seen.push(value));
  consumer.connect();
  assertEquals(seen, ['dark']);

  provider.provide(theme, 'dim');
  assertEquals(seen, ['dark', 'dim']);

  consumer.disconnect();
  consumer.disconnect();
  provider.provide(theme, 'solar');
  assertEquals(seen, ['dark', 'dim'], 'disconnect unsubscribes exactly once');

  consumer.connect();
  assertEquals(seen, ['dark', 'dim', 'solar'], 'reconnect re-reads the current value');
  provider.provide(theme, 'amber');
  assertEquals(seen, ['dark', 'dim', 'solar', 'amber'], 'reconnect adds no duplicate subscription');

  consumer.dispose();
  consumer.dispose();
  provider.provide(theme, 'void');
  assertEquals(seen, ['dark', 'dim', 'solar', 'amber'], 'dispose stays unsubscribed');
  assertThrows(() => consumer.consume(theme, () => {}), Error, 'service is disposed');
});

Deno.test('the kernel owns context provision and consumption at the activation boundary', () => {
  const document = new TestDocument();
  const theme = createContext<string>(Symbol('kernel-theme'), 'light');

  const providerElement = document.createElement('oe-context-test');
  const consumerElement = document.createElement('oe-context-test');
  const provider = new CompiledElementKernel(asElement(providerElement), CONTEXT_PROGRAM, {
    signals: { message: signal('provider') },
    handlers: {},
    rootMode: 'open',
  });
  const consumer = new CompiledElementKernel(asElement(consumerElement), CONTEXT_PROGRAM, {
    signals: { message: signal('consumer') },
    handlers: {},
    rootMode: 'light',
  });

  provider.connect();
  const shadow = providerElement.shadowRoot;
  assertStrictEquals(shadow === null, false);
  shadow!.appendChild(consumerElement);
  assertStrictEquals(consumerElement.getRootNode(), shadow!);

  const seen: string[] = [];
  consumer.context.consume(theme, (value) => seen.push(value));
  provider.context.provide(theme, 'dark');
  consumer.connect();
  assertEquals(seen, ['dark'], 'consumption starts at connect across the shadow boundary');

  provider.context.provide(theme, 'dim');
  assertEquals(seen, ['dark', 'dim'], 'provided-value changes notify the subscribed descendant');

  consumer.disconnect();
  provider.context.provide(theme, 'solar');
  assertEquals(seen, ['dark', 'dim'], 'kernel disconnect unsubscribes the consumer');

  consumer.connect();
  assertEquals(
    seen,
    ['dark', 'dim', 'solar'],
    'kernel reconnect resubscribes at the current value',
  );
  provider.context.provide(theme, 'amber');
  assertEquals(seen, ['dark', 'dim', 'solar', 'amber'], 'kernel reconnect adds no duplicate');

  consumer.dispose();
  provider.context.provide(theme, 'void');
  assertEquals(seen, ['dark', 'dim', 'solar', 'amber'], 'kernel dispose stays unsubscribed');
  provider.dispose();
});
