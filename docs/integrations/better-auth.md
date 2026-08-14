# Auth recipe (better-auth)

> Status: **doc-level, not CI-verified** — integration shape, not a tested
> artifact. It will move to verified status when a consumer reproduces it
> (0.42.x recipe follow-up).

openElement does not ship auth. The loop gives better-auth three honest
attachment points, all Web-standard:

1. **Session read in loaders**: a dynamic route's `loader({ request })`
   gets the standard `Request`; pass its headers to better-auth's
   `auth.api.getSession({ headers: request.headers })` and return the
   session as loader data. Render signed-in vs signed-out in DSD.
2. **Auth endpoints**: mount better-auth's handler as an API route (or a
   Nitro route) on the same deployment — it owns its URLs; the framework
   does not proxy them.
3. **Actions**: in an action, use the session to authorize before
   mutating; on failure `redirect('/login')` (303 by protocol) or
   `fail(403, { error })` when the form should re-render with an error.

```ts
export async function loader({ request }: LoaderContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) redirect('/login');
  return { user: session.user };
}
```

Sessions remain a 0.44 framework topic; until then the cookie/session
wiring is entirely better-auth's, which is the point of the recipe.

For guarding a whole route group (redirect anonymous users before
routing, pass session identity to loaders), see the
[auth-guard middleware template](./better-auth-guard.md).
