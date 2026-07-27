# Data recipe (Drizzle)

> Status: **doc-level, not CI-verified** — integration shape, not a tested
> artifact. It will move to verified status when a consumer reproduces it
> (0.42.x recipe follow-up).

openElement does not ship an ORM or a data layer. Drizzle (or any query
builder) runs inside loaders and actions, which are ordinary server
functions on a `rendering: 'dynamic'` route:

1. **Reads**: run queries in `loader`; return plain serializable data. The
   page renders it in DSD at request time; pure-static routes keep using
   build-time data instead.
2. **Writes**: run mutations in `action` after validation (see the
   validation recipe). On conflict or constraint failure,
   `return fail(422, { error })` to re-render with the echo; on success,
   `redirect()` to the changed resource (303 PRG, revalidation re-runs the
   loader for you).
3. **Connection**: create the client once at module scope of a small
   `db.ts` and import it from routes. Connection secrets belong to the
   deployment environment (`ctx.env`), never to the client bundle —
   loaders/actions never ship to the browser.

```ts
// app/db.ts
export const db = drizzle(process.env.DATABASE_URL!);

// app/routes/posts.tsx
export async function loader() {
  return { posts: await db.select().from(postsTable).limit(20) };
}
```

Transactions, pooling and migrations stay with Drizzle; the framework
owns only the route-to-interaction loop around them.
