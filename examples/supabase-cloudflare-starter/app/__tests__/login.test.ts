import { assert, assertEquals, assertRejects } from '@std/assert';
import { isActionFailure, isOpenElementRedirect } from '@openelement/app';

if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}
const { createLoginAction } = await import('../routes/login.tsx');
type LoginAuthClient = import('../routes/login.tsx').LoginAuthClient;

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
