import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createRequestContext } from '@openelement/app/model';
import { createOpenElementNitroHandler } from '../src/nitro-mount.ts';

Deno.test('nitro mount: converts Nitro-like event to Web Request and returns Web Response data', async () => {
  const handler = createOpenElementNitroHandler({
    baseUrl: 'https://example.test',
    handler: async (request, context) => {
      const body = await request.text();

      return new Response(
        JSON.stringify({
          url: request.url,
          method: request.method,
          body,
          envName: context?.env?.name,
          platform: context?.platform,
        }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        },
      );
    },
    env: { name: 'test-env' },
    platform: 'node',
  });

  const result = await handler({
    method: 'POST',
    path: '/api/hello?x=1',
    headers: { 'content-type': 'text/plain' },
    body: 'payload',
  });

  assertEquals(result.status, 201);
  assertEquals(result.headers.get('content-type'), 'application/json');
  assertEquals(await result.response.json(), {
    url: 'https://example.test/api/hello?x=1',
    method: 'POST',
    body: 'payload',
    envName: 'test-env',
    platform: 'node',
  });
});

Deno.test('nitro mount: preserves an existing Web Request from the event', async () => {
  const handler = createOpenElementNitroHandler({
    handler: (request) => new Response(request.url),
  });

  const result = await handler({
    request: new Request('https://worker.test/from-request'),
  });

  assertEquals(await result.response.text(), 'https://worker.test/from-request');
});

Deno.test('nitro mount: exposes params through runtime and request contexts', async () => {
  const contexts: Array<{
    path: string;
    method: string;
    params: Record<string, string>;
    envName?: unknown;
    platform?: unknown;
  }> = [];
  const handler = createOpenElementNitroHandler({
    baseUrl: 'https://deploy.test',
    handler: (_request, context) => new Response(context?.params?.slug ?? 'missing'),
    onBeforeRequestContext: (context) => {
      contexts.push({
        path: context.path,
        method: context.method,
        params: context.params,
        envName: context.env?.name,
        platform: context.platform,
      });
    },
    env: { name: 'nitro-env' },
    platform: 'workers',
  });

  const result = await handler({
    method: 'PUT',
    path: '/reader/notes?draft=1',
    params: { slug: 'notes' },
  });

  assertEquals(await result.response.text(), 'notes');

  assertEquals(contexts, [{
    path: '/reader/notes',
    method: 'PUT',
    params: { slug: 'notes' },
    envName: 'nitro-env',
    platform: 'workers',
  }]);
});

Deno.test('nitro mount: request context shape matches app/model createRequestContext contract', async () => {
  let nitroContext: ReturnType<typeof createRequestContext> | undefined;

  const handler = createOpenElementNitroHandler({
    baseUrl: 'https://shape.test',
    onBeforeRequestContext: (context) => {
      nitroContext = context;
    },
    handler: () => new Response('ok'),
  });

  await handler({
    method: 'GET',
    path: '/a/b?x=1&y=2',
    params: { b: 'b-value' },
    env: { name: 'env' },
    platform: 'node',
  });

  const appContext = createRequestContext({
    request: new Request('https://shape.test/a/b?x=1&y=2'),
    params: { b: 'b-value' },
    env: { name: 'env' },
    platform: 'node',
  });

  const pick = (ctx: ReturnType<typeof createRequestContext>) => ({
    request: ctx.request.url,
    url: ctx.url.href,
    path: ctx.path,
    method: ctx.method,
    params: ctx.params,
    searchParams: [...ctx.searchParams.entries()],
    env: ctx.env,
    platform: ctx.platform,
  });

  assertEquals(pick(nitroContext!), pick(appContext));
});
