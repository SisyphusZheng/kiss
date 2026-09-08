import { assertEquals } from '@std/assert';
import { RouteTable } from '../src/internal/router/route-table.ts';

Deno.test('URL winner precedes method dispatch, including overlapping explicit records', () => {
  const routes = [
    { path: '/products/new', methods: ['GET'] },
    { path: '/products/:id', methods: ['POST'] },
  ];
  const resolution = new RouteTable(routes).resolve('/products/new', '', 'POST');
  assertEquals(resolution.kind, 'method-not-allowed');
  if (resolution.kind === 'method-not-allowed') assertEquals(resolution.allow, ['GET', 'HEAD']);
  assertEquals(
    new RouteTable([...routes].reverse()).resolve('/products/new', '', 'POST').kind,
    'match',
  );
});

Deno.test('query never becomes a path capture', () => {
  const match = new RouteTable([{ path: '/items/:id' }]).match(
    '/items/a%252Fb',
    '?id=query&view=&view=full',
  );
  assertEquals(Object.entries(match?.params ?? {}), [['id', 'a%2Fb']]);
});

Deno.test('resolution snapshots and full URL component patterns preserve URLPattern semantics', () => {
  const routes = [{
    id: 'secure',
    path: '/items/:id',
    pattern: { hostname: 'shop.example', protocol: 'https' },
    methods: ['get'],
  }];
  const table = new RouteTable(routes);
  routes[0].path = '/changed';
  routes[0].methods.push('POST');
  const result = table.resolve(new URL('https://shop.example/items/a%2Fb?q=&q=2'));
  assertEquals(result.kind, 'match');
  if (result.kind === 'match') {
    assertEquals(result.id, 'secure');
    assertEquals(result.params.id, 'a/b');
    assertEquals(result.searchParams.getAll('q'), ['', '2']);
  }
  assertEquals(table.resolve(new URL('https://other.example/items/a')).kind, 'not-found');
  assertEquals(table.resolve('/items/a', '', 'POST').kind, 'not-found');
  assertEquals(
    new RouteTable([{ path: '//a' }]).match(new URL('https://shop.example//a'))?.route.path,
    '//a',
  );
});
