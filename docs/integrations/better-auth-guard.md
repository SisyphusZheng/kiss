# Auth-guard middleware template (better-auth)

> Status: **guard mechanics verified against 0.42.0 source; better-auth
> call stubbed** — executed end-to-end on a scratch app built from this
> repository (evidence below). The `auth.api.getSession(...)` line is
> documented but was exercised with a stub session lookup, so no
> database-backed better-auth instance was required.

The [better-auth recipe](./better-auth.md) covers session reads in
loaders and authorization in actions. This template adds the third
pattern: a **guard middleware** on the fetch middleware chain
(ADR-0123 item 2, #858) that redirects anonymous users away from a
protected route group before routing, and passes the session identity
through to loaders when one exists.

```ts
// vite.config.ts
import { openElement } from '@openelement/adapter-vite';
import { authGuard } from './app/middleware/auth-guard.ts';

export default defineConfig({
  plugins: [openElement({ middleware: { use: [authGuard] } })],
});
```

```ts
// app/middleware/auth-guard.ts
import type { Middleware } from '@openelement/element';

export const authGuard: Middleware = async (request, next) => {
  const PROTECTED_PREFIX = '/account';
  const LOGIN_PATH = '/login';

  // Real integration — one line, better-auth owns the session:
  //   const session = await auth.api.getSession({ headers: request.headers });
  //   const user = session?.user ?? null;
  // Inline stub used for verification:
  const getSessionUser = async (req: Request): Promise<{ id: string; name: string } | null> => {
    const cookie = req.headers.get('cookie') ?? '';
    const match = /(?:^|;\s*)oe_session=([^;]+)/.exec(cookie);
    if (!match || match[1] !== 'stub-ok') return null;
    return { id: 'u_1', name: 'Stub User' };
  };

  const url = new URL(request.url);
  if (!url.pathname.startsWith(PROTECTED_PREFIX)) return await next();

  const user = await getSessionUser(request);
  if (!user) {
    const nextParam = encodeURIComponent(url.pathname + url.search);
    return new Response(null, {
      status: 303,
      headers: { location: `${LOGIN_PATH}?next=${nextParam}` },
    });
  }

  request.headers.delete('x-oe-user');
  request.headers.set('x-oe-user', JSON.stringify({ id: user.id, name: user.name }));
  return await next();
};
```

The protected route's loader reads the identity the guard injected:

```tsx
// app/routes/account.tsx
export async function loader({ request }: { request: Request }) {
  const raw = request.headers.get('x-oe-user');
  return { user: raw ? JSON.parse(raw) : null };
}
```

Three mechanics worth understanding before adapting it:

1. **Self-containment.** Middleware sources are inlined into the
   generated server entry via `fn.toString()`, so constants and helpers
   must live _inside_ the function body — module-scope references throw
   `ReferenceError` at runtime. The real `auth` client cannot be closed
   over either: construct it inside the function (its setup is cheap and
   stateless) or attach it to `globalThis` at server start.
2. **Identity pass-through uses request-header mutation.**
   `composeFetchMiddleware` threads the _same_ `Request` object through
   the chain, so a header the guard sets is visible to downstream loaders
   via `ctx.request.headers`. `delete`-then-`set` makes the header
   middleware-owned — a client-supplied `x-oe-user` cannot survive the
   guard. Per-request identity must never go through `globalThis`.
3. **303, not 401.** The protected surface is HTML pages; the Web-native
   answer for an anonymous page request is a redirect to the login page
   with a `next` parameter, matching the action protocol's PRG semantics.
   API routes under the prefix would want 401 problem+json instead — add
   a branch on `url.pathname` if you protect those too.

Verification evidence (`deno task build && deno task start` on the
scratch app):

```
GET /account                        -> 303, location: /login?next=%2Faccount
GET /account (cookie oe_session=stub-ok) -> 200, loader saw identity u_1
GET /account (forged x-oe-user, no cookie) -> 303  (client header stripped)
```

Composing with the [rate-limit recipe](./rate-limit.md): order matters —
`use: [actionRateLimit, authGuard]` rate-limits before auth (cheaper
rejects), `use: [authGuard, actionRateLimit]` authenticates first.
