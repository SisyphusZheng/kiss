import { assert, assertEquals, assertRejects } from '@std/assert';
import { isActionFailure, isOpenElementRedirect } from '@openelement/app';

if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}
const {
  configuredOAuthProviders,
  createLoginAction,
  createLoginLoader,
  createOAuthAction,
  default: LoginPage,
  renderOAuthProviders,
} = await import('../routes/login.tsx');
type LoginAuthClient = import('../routes/login.tsx').LoginAuthClient;
type LoginOAuthClient = import('../routes/login.tsx').LoginOAuthClient;

function client(error: { message: string } | null = null): () => LoginAuthClient {
  return () => ({ auth: { signInWithPassword: () => Promise.resolve({ error }) } });
}
function context(formData = new FormData(), env: Record<string, unknown> = {}) {
  return {
    formData,
    env,
    request: new Request('https://app.test/login', {
      headers: { 'cf-connecting-ip': '192.0.2.1' },
    }),
    responseHeaders: new Headers(),
  };
}
function credentials(email = 'user@example.com', password = 'password') {
  const data = new FormData();
  data.set('email', email);
  data.set('password', password);
  return data;
}

Deno.test('login rejects a Cloudflare rate-limit denial before auth', async () => {
  let called = false;
  const action = createLoginAction(() => {
    called = true;
    return client()();
  });
  const result = await action(
    context(credentials(), {
      AUTH_RATE_LIMITER: { limit: () => Promise.resolve({ success: false }) },
    }),
  );
  assert(isActionFailure(result));
  assertEquals(result.status, 429);
  assertEquals(called, false);
});
Deno.test('login rejects missing credentials', async () => {
  const result = await createLoginAction(client())(context());
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
});
Deno.test('login sanitizes provider failures', async () => {
  const result = await createLoginAction(
    client({ message: 'private provider diagnostic eyJsecret' }),
  )(context(credentials()));
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(JSON.stringify(result.data).includes('eyJsecret'), false);
});
Deno.test('login success redirects with PRG', async () => {
  const error = await assertRejects(() => createLoginAction(client())(context(credentials())));
  assert(isOpenElementRedirect(error));
});

Deno.test('login SSR includes the action error mount point contract', () => {
  const html = new LoginPage().render();
  assert(html);
});

function oauthClient(
  result: { url?: string | null; error?: { message: string } | null } = {},
  calls: { provider: string; redirectTo: string }[] = [],
): () => LoginOAuthClient {
  return () => ({
    auth: {
      signInWithOAuth: (credentials: { provider: string; options: { redirectTo: string } }) => {
        calls.push({ provider: credentials.provider, redirectTo: credentials.options.redirectTo });
        return Promise.resolve({
          data: result.url === undefined ? null : { url: result.url },
          error: result.error ?? null,
        });
      },
    },
  });
}

function vnodeText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(vnodeText).join('');
  const children = (node as { children?: unknown }).children;
  return Array.isArray(children) ? children.map(vnodeText).join('') : '';
}

Deno.test('oauth providers are configured only by an explicit true flag', () => {
  assertEquals(configuredOAuthProviders({}), []);
  assertEquals(configuredOAuthProviders({ SUPABASE_OAUTH_GOOGLE_ENABLED: 'false' }), []);
  assertEquals(configuredOAuthProviders({ SUPABASE_OAUTH_GOOGLE_ENABLED: '1' }), []);
  assertEquals(configuredOAuthProviders({ SUPABASE_OAUTH_GOOGLE_ENABLED: 'true' }), [
    { id: 'google', label: 'Google' },
  ]);
  assertEquals(
    configuredOAuthProviders({
      SUPABASE_OAUTH_GOOGLE_ENABLED: 'true',
      SUPABASE_OAUTH_GITHUB_ENABLED: 'true',
    }),
    [{ id: 'google', label: 'Google' }, { id: 'github', label: 'GitHub' }],
  );
});

Deno.test('login loader exposes only the configured oauth providers', async () => {
  assertEquals(
    await createLoginLoader()({ env: { SUPABASE_OAUTH_GITHUB_ENABLED: 'true' } }),
    { oauthProviders: [{ id: 'github', label: 'GitHub' }] },
  );
});

Deno.test('login renders the not-configured placeholder without any provider flag', () => {
  const text = vnodeText(renderOAuthProviders([]));
  assert(text.includes('OAuth providers: not configured'));
  assert(!text.includes('Continue with'));
});

Deno.test('login renders a button per configured provider instead of the placeholder', () => {
  const text = vnodeText(renderOAuthProviders([
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
  ]));
  assert(text.includes('Continue with Google'));
  assert(text.includes('Continue with GitHub'));
  assert(!text.includes('not configured'));
});

Deno.test('oauth action fails closed without 500 when the provider is not configured', async () => {
  let called = false;
  const action = createOAuthAction(() => {
    called = true;
    return oauthClient()();
  });
  const data = new FormData();
  data.set('provider', 'google');
  const result = await action(context(data));
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(called, false);
});

Deno.test('oauth action redirects to the provider url when configured', async () => {
  const calls: { provider: string; redirectTo: string }[] = [];
  const data = new FormData();
  data.set('provider', 'google');
  const thrown = await assertRejects(() =>
    createOAuthAction(
      oauthClient({ url: 'https://accounts.google.com/o/oauth2/v2/auth?x=1' }, calls),
    )(
      context(data, { SUPABASE_OAUTH_GOOGLE_ENABLED: 'true' }),
    )
  );
  assert(isOpenElementRedirect(thrown));
  assertEquals(
    (thrown as { location?: string }).location,
    'https://accounts.google.com/o/oauth2/v2/auth?x=1',
  );
  assertEquals(calls, [{
    provider: 'google',
    redirectTo: 'https://app.test/auth/callback',
  }]);
});

Deno.test('oauth action sanitizes provider failures and missing urls', async () => {
  const data = new FormData();
  data.set('provider', 'github');
  const env = { SUPABASE_OAUTH_GITHUB_ENABLED: 'true' };
  const errored = await createOAuthAction(
    oauthClient({ url: null, error: { message: 'provider diagnostic eyJsecret' } }),
  )(context(data, env));
  assert(isActionFailure(errored));
  assertEquals(errored.status, 422);
  assertEquals(JSON.stringify(errored.data).includes('eyJsecret'), false);
  const noUrl = await createOAuthAction(oauthClient({ url: null }))(context(data, env));
  assert(isActionFailure(noUrl));
  assertEquals(noUrl.status, 422);
});

Deno.test('oauth action rejects a Cloudflare rate-limit denial before auth', async () => {
  let called = false;
  const action = createOAuthAction(() => {
    called = true;
    return oauthClient()();
  });
  const data = new FormData();
  data.set('provider', 'google');
  const result = await action(
    context(data, {
      SUPABASE_OAUTH_GOOGLE_ENABLED: 'true',
      AUTH_RATE_LIMITER: { limit: () => Promise.resolve({ success: false }) },
    }),
  );
  assert(isActionFailure(result));
  assertEquals(result.status, 429);
  assertEquals(called, false);
});
