/**
 * Server-side Supabase client factory (composition boundary, #981): the
 * official supabase-js client is created from server env only — the anon
 * key never ships to the client bundle (secret-boundary gate #984), and no
 * service-role key ever enters this process path.
 *
 * Skeleton phase: env wiring plus the anonymous session shape. Real session
 * read-back needs the Set-Cookie channel (ADR-0129); login routes and the
 * first RLS-backed query land after it is accepted.
 */
export interface ReferenceSupabase {
  url: string;
  anonKeyPresent: boolean;
  readSession(): Promise<{ session: { user: unknown } | null }>;
}

export function createServerSupabase(env: Record<string, string>): ReferenceSupabase {
  const url = env.SUPABASE_URL ?? '';
  const anonKey = env.SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    throw new Error(
      '[reference starter] SUPABASE_URL and SUPABASE_ANON_KEY must be set in the worker env',
    );
  }
  return {
    url,
    anonKeyPresent: true,
    // ponytail: anonymous until ADR-0129 provides the Set-Cookie channel.
    // Upgrade path: createClient(url, anonKey, { auth: { persistSession: false } })
    // + @supabase/ssr cookie read-back (getSession), then loader queries
    // ride RLS.
    async readSession() {
      return { session: null };
    },
  };
}
