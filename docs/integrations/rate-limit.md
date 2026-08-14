# Rate-limit recipe (fetch middleware)

> Status: **verified against 0.42.0 source** — executed end-to-end on a
> scratch app built from this repository: 3 POSTs passed through to the
> action (422 validation echoes), the 4th answered 429
> `application/problem+json` with `Retry-After`. Not CI-gated; reproduce
> with the steps below.

openElement does not ship a rate limiter. The attachment point is the fetch
middleware chain (ADR-0123 item 2, #858): `middleware.use` in
`openElement()` composes `(request, next) => Promise<Response>` functions
around the generated server handler in onion order, with identical
semantics in dev, the `start` CLI, and the Nitro entry.

```ts
// vite.config.ts
import { openElement } from '@openelement/adapter-vite';
import { actionRateLimit } from './app/middleware/rate-limit.ts';

export default defineConfig({
  plugins: [
    openElement({
      middleware: { use: [actionRateLimit] },
      // ...
    }),
  ],
});
```

Reference middleware — fixed window, per client IP, scoped to action
POSTs (the framework's mutation surface):

```ts
// app/middleware/rate-limit.ts
import type { Middleware } from '@openelement/element';

export const actionRateLimit: Middleware = async (request, next) => {
  if (request.method !== 'POST') return await next();

  const LIMIT = 3;
  const WINDOW_MS = 60_000;

  type Bucket = { count: number; resetAt: number };
  const g = globalThis as { __oeActionRateLimit?: Map<string, Bucket> };
  const buckets = (g.__oeActionRateLimit ??= new Map<string, Bucket>());

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;

  if (bucket.count > LIMIT) {
    return Response.json(
      {
        type: 'about:blank',
        title: 'Too Many Requests',
        status: 429,
        detail: `Rate limit exceeded: ${LIMIT} action POSTs per ${WINDOW_MS / 1000}s per IP.`,
      },
      {
        status: 429,
        headers: {
          'content-type': 'application/problem+json',
          'retry-after': String(Math.ceil((bucket.resetAt - now) / 1000)),
        },
      },
    );
  }

  const response = await next();
  response.headers.set('x-ratelimit-limit', String(LIMIT));
  response.headers.set('x-ratelimit-remaining', String(LIMIT - bucket.count));
  return response;
};
```

Three constraints the shape above is deliberate about:

1. **Self-containment.** Middleware sources are inlined into the generated
   server entry via `fn.toString()`, so the function cannot close over
   module scope — a module-level `Map` or constant compiles fine and then
   throws `ReferenceError` at runtime. State must live on `globalThis` (as
   above) and constants inside the function body. This also means the
   buckets are per server process; multi-replica deployments need a shared
   store, which is a platform adapter concern, not a recipe concern.
2. **Error shape.** Action protocol errors on the fetch channel answer
   RFC 9457 problem+json (#863), so the limiter speaks
   `application/problem+json` too, with `Retry-After`. The no-JS form path
   and the fetch enhancement both surface the status code correctly.
3. **Client identity.** The WinterCG `Request` carries no connection IP;
   the recipe keys on `x-forwarded-for`, which is only trustworthy behind a
   proxy that sets it (Nitro platforms do). Without one, all direct
   traffic shares the `local` bucket — set the header at your edge.

Verify on a scratch app (`deno task build && deno task start`, LIMIT=3):

```
POST /contact  -> 422  x-ratelimit-remaining: 2   (action validation echo)
POST /contact  -> 422  x-ratelimit-remaining: 1
POST /contact  -> 422  x-ratelimit-remaining: 0
POST /contact  -> 429  application/problem+json, retry-after: 60
```
