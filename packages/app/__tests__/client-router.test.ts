import { assertEquals, assertRejects } from 'jsr:@std/assert@^1.0.0';
import {
  createRouter,
  matchRoute,
  type RouteConfig,
} from '../src/internal/router/client-router.ts';

const routes: RouteConfig[] = [{ path: '/items/:id', tagName: 'item-page' }];

Deno.test('client router decodes path parameters and gives path values precedence', () => {
  const match = matchRoute('/items/hello%20world', '?id=query&view=full', routes);
  assertEquals(match?.params.id, 'hello world');
  assertEquals(match?.params.view, 'full');
});

Deno.test('client router dispose removes event listeners and double dispose is safe', () => {
  const original = {
    location: Object.getOwnPropertyDescriptor(globalThis, 'location'),
    history: Object.getOwnPropertyDescriptor(globalThis, 'history'),
    add: globalThis.addEventListener,
    remove: globalThis.removeEventListener,
  };
  const added: EventListener[] = [];
  const removed: EventListener[] = [];
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { protocol: 'https:', pathname: '/', search: '', hash: '' },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  globalThis.addEventListener = ((_type: string, listener: EventListener) => {
    added.push(listener);
  }) as typeof globalThis.addEventListener;
  globalThis.removeEventListener = ((_type: string, listener: EventListener) => {
    removed.push(listener);
  }) as typeof globalThis.removeEventListener;

  try {
    const router = createRouter({ mode: 'history', routes });
    router.dispose();
    router.dispose();
    assertEquals(added.length, 1);
    assertEquals(removed, added);
  } finally {
    globalThis.addEventListener = original.add;
    globalThis.removeEventListener = original.remove;
    if (original.location) Object.defineProperty(globalThis, 'location', original.location);
    else delete (globalThis as Record<string, unknown>).location;
    if (original.history) Object.defineProperty(globalThis, 'history', original.history);
    else delete (globalThis as Record<string, unknown>).history;
  }
});

Deno.test('client router guard redirect limit rejects redirect loops', async () => {
  const loop: RouteConfig[] = [{
    path: '/loop',
    tagName: 'loop-page',
    guard: () => Promise.resolve('/loop'),
  }];
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalHistory = Object.getOwnPropertyDescriptor(globalThis, 'history');
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { protocol: 'https:', pathname: '/', search: '', hash: '' },
  });
  Object.defineProperty(globalThis, 'history', {
    configurable: true,
    value: { pushState() {}, replaceState() {} },
  });
  const router = createRouter({ mode: 'history', routes: loop });
  try {
    await assertRejects(() => router.navigate('/loop'), Error, 'redirect limit');
  } finally {
    router.dispose();
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else delete (globalThis as Record<string, unknown>).location;
    if (originalHistory) Object.defineProperty(globalThis, 'history', originalHistory);
    else delete (globalThis as Record<string, unknown>).history;
  }
});
