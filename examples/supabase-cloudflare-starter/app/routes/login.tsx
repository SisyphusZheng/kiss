/**
 * /login — email+password sign-in (reference starter, #983) plus optional
 * OAuth providers (#998): a provider button renders only when its env flag
 * is explicitly enabled (`SUPABASE_OAUTH_<PROVIDER>_ENABLED=true`); with no
 * provider enabled the page renders an explicit
 * "OAuth providers: not configured" placeholder so Tier-2 evidence can
 * assert the absence is deliberate. The oauth action fails closed (422,
 * never a 500) when the requested provider is not enabled, and the shared
 * PKCE /auth/callback already renders provider/exchange failures as data.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { publicAuthError } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type WorkerEnv } from '../../lib/rate-limit.ts';

export const tagName = 'page-login';

interface LoginActionData {
  error?: string;
  email?: string;
}

export interface OAuthProvider {
  id: 'google' | 'github';
  label: string;
}

const OAUTH_PROVIDERS: readonly (OAuthProvider & { envFlag: string })[] = [
  { id: 'google', label: 'Google', envFlag: 'SUPABASE_OAUTH_GOOGLE_ENABLED' },
  { id: 'github', label: 'GitHub', envFlag: 'SUPABASE_OAUTH_GITHUB_ENABLED' },
];

/**
 * A provider counts as configured only on an explicit `true` (the
 * STRIPE_LIVEMODE convention): absence, empty strings, and `false` all mean
 * "not configured", so a copied-out flag can never enable a provider whose
 * dashboard/client credentials were never set up.
 */
export function configuredOAuthProviders(env: Record<string, unknown>): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((provider) => env[provider.envFlag] === 'true')
    .map(({ id, label }) => ({ id, label }));
}

export interface LoginLoaderData {
  oauthProviders: OAuthProvider[];
}

export function createLoginLoader() {
  return function loader(ctx: { env: Record<string, unknown> }): LoginLoaderData {
    return { oauthProviders: configuredOAuthProviders(ctx.env) };
  };
}

export const loader = createLoginLoader();

export interface LoginAuthClient {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): PromiseLike<{
      error: { message: string } | null;
    }>;
  };
}

export type LoginClientFactory = (
  env: WorkerEnv,
  request: Request,
  responseHeaders: Headers,
) => LoginAuthClient;

export function createLoginAction(createClient: LoginClientFactory = createServerSupabase) {
  return async function action(ctx: {
    formData: FormData;
    env: WorkerEnv;
    request: Request;
    responseHeaders: Headers;
  }): Promise<OpenElementActionFailure<LoginActionData>> {
    if (!(await authRequestAllowed(ctx.env, ctx.request, 'login'))) {
      return fail(429, { error: 'too many attempts; retry later' });
    }
    const email = String(ctx.formData.get('email') ?? '').trim();
    const password = String(ctx.formData.get('password') ?? '');
    if (!email || !password) {
      return fail(422, { error: 'email and password are required', email });
    }
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail(422, { error: publicAuthError(error), email });
    throw redirect('/notes');
  };
}

export const action = createLoginAction();

export interface LoginOAuthClient {
  auth: {
    signInWithOAuth(credentials: {
      provider: OAuthProvider['id'];
      options: { redirectTo: string };
    }): PromiseLike<{
      data: { url?: string | null } | null;
      error: { message: string } | null;
    }>;
  };
}

export type LoginOAuthClientFactory = (
  env: WorkerEnv,
  request: Request,
  responseHeaders: Headers,
) => LoginOAuthClient;

export function createOAuthAction(createClient: LoginOAuthClientFactory = createServerSupabase) {
  return async function oauth(ctx: {
    formData: FormData;
    env: WorkerEnv;
    request: Request;
    responseHeaders: Headers;
  }): Promise<OpenElementActionFailure<LoginActionData>> {
    if (!(await authRequestAllowed(ctx.env, ctx.request, 'login'))) {
      return fail(429, { error: 'too many attempts; retry later' });
    }
    const provider = String(ctx.formData.get('provider') ?? '');
    const configured = configuredOAuthProviders(ctx.env).find((entry) => entry.id === provider);
    // Fail closed: an unconfigured provider is a client error, never a 500.
    if (!configured) return fail(422, { error: 'oauth provider is not configured' });
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: configured.id,
      options: { redirectTo: new URL('/auth/callback', ctx.request.url).toString() },
    });
    if (error || typeof data?.url !== 'string' || !data.url) {
      return fail(422, { error: publicAuthError(error) });
    }
    // External redirect to the provider consent screen; the PKCE verifier
    // cookie already went out through the ADR-0129 response-header channel.
    throw redirect(data.url);
  };
}

export const actions = { oauth: createOAuthAction() };

/**
 * Provider buttons post to the named `oauth` action (the clicked button
 * carries the provider id); the placeholder keeps "no provider configured"
 * an explicit page state that Tier-2 evidence can assert on.
 */
export function renderOAuthProviders(providers: readonly OAuthProvider[]) {
  if (providers.length === 0) {
    return <p id='oauth-not-configured'>OAuth providers: not configured</p>;
  }
  return (
    <form method='post' action='/login?/oauth'>
      {providers.map((provider) => (
        <button key={provider.id} type='submit' name='provider' value={provider.id}>
          Continue with {provider.label}
        </button>
      ))}
    </form>
  );
}

const LoginPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign in — reference starter' },
  render() {
    const result = useActionData() as LoginActionData | undefined;
    const data = useLoaderData() as LoginLoaderData | undefined;
    return (
      <main>
        <h1>Sign in</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        <form method='post'>
          <p>
            <label>
              Email <input type='email' name='email' value={result?.email ?? ''} required />
            </label>
          </p>
          <p>
            <label>
              Password <input type='password' name='password' required />
            </label>
          </p>
          <button type='submit'>Sign in</button>
        </form>
        <section id='oauth'>
          {renderOAuthProviders(data?.oauthProviders ?? [])}
        </section>
        <p>
          <a href='/signup'>Create account</a> · <a href='/magic-link'>Use a Magic Link</a> ·{' '}
          <a href='/recover'>Forgot password?</a>
        </p>
        <p>
          <a href='/notes'>Back to notes</a>
        </p>
      </main>
    );
  },
});

customElements.define(tagName, LoginPage);
export default LoginPage;
