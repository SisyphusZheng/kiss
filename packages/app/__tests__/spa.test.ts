import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { defineApp, type RouteConfig } from '../src/index.ts';

Deno.test('SPA interface accepts custom-element routes', () => {
  const routes: RouteConfig[] = [{ path: '/', tagName: 'app-home' }];
  const app = defineApp({ mode: 'spa', routes });
  assertEquals(app.router, null);
  app.dispose();
});

Deno.test('SPA route contract rejects legacy component callbacks at type level', () => {
  const route: RouteConfig = { path: '/settings', tagName: 'app-settings' };
  assertEquals(Object.hasOwn(route, 'component'), false);
});
