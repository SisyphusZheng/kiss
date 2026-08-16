import { assertEquals, assertRejects } from '@std/assert';
import { isOpenElementRedirect } from '@openelement/app';
if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}
const { createCallbackLoader } = await import('../routes/auth/callback.tsx');
type CallbackAuthClient = import('../routes/auth/callback.tsx').CallbackAuthClient;
function client(error: { message: string } | null = null): () => CallbackAuthClient {
  return () => ({ auth: { exchangeCodeForSession: () => Promise.resolve({ error }) } });
}
function context(query: string) {
  return {
    env: {},
    request: new Request(`https://app.test/auth/callback${query}`),
    responseHeaders: new Headers(),
  };
}

Deno.test('callback rejects missing and expired codes without reflecting details', async () => {
  const missing = await createCallbackLoader(client())(context(''));
  assertEquals(missing.error?.includes('Authentication could not'), true);
  const expired = await createCallbackLoader(client({ message: 'expired code private-123' }))(
    context('?code=private-123'),
  );
  assertEquals(JSON.stringify(expired).includes('private-123'), false);
});
Deno.test('callback success rejects an encoded external next and redirects internally', async () => {
  const thrown = await assertRejects(() =>
    createCallbackLoader(client())(context('?code=ok&next=%252F%252Fevil.example'))
  );
  assertEquals(isOpenElementRedirect(thrown), true);
  assertEquals(
    (thrown as { location?: string }).location?.includes('evil.example') ?? false,
    false,
  );
});
