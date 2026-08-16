import { assertEquals, assertRejects } from '@std/assert';
import { parseStripeEvent, verifyStripeSignature } from '../../lib/stripe-webhook.ts';
import stripeWebhook, { createStripeWebhook } from '../routes/api/stripe-webhook.ts';

const secret = 'whsec_test_secret';
const timestamp = 1_700_000_000;
const body = JSON.stringify({
  id: 'evt_test',
  type: 'checkout.session.completed',
  created: timestamp,
  livemode: false,
  data: { object: { id: 'cs_test', payment_status: 'paid', metadata: { order_id: 'x' } } },
});

async function signature(payload = body, at = timestamp): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${at}.${payload}`),
    ),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.test('Stripe signature accepts an exact raw body and any valid v1 candidate', async () => {
  const valid = await signature();
  await verifyStripeSignature(body, `t=${timestamp},v1=${'0'.repeat(64)},v1=${valid}`, secret, {
    nowSeconds: timestamp + 300,
  });
  assertEquals(parseStripeEvent(body).id, 'evt_test');
});

Deno.test('Stripe signature rejects changed bodies, stale/future timestamps and malformed headers', async () => {
  const valid = await signature();
  await assertRejects(() =>
    verifyStripeSignature(`${body} `, `t=${timestamp},v1=${valid}`, secret, {
      nowSeconds: timestamp,
    })
  );
  await assertRejects(() =>
    verifyStripeSignature(body, `t=${timestamp},v1=${valid}`, secret, {
      nowSeconds: timestamp + 301,
    })
  );
  await assertRejects(() =>
    verifyStripeSignature(body, `t=${timestamp},v1=${valid}`, secret, {
      nowSeconds: timestamp - 301,
    })
  );
  await assertRejects(() =>
    verifyStripeSignature(body, `t=${timestamp},v0=${valid}`, secret, { nowSeconds: timestamp })
  );
});

Deno.test('Stripe event parsing rejects non-events after signature verification', () => {
  for (const invalid of ['null', '{}', '{"id":"evt_x"}']) {
    try {
      parseStripeEvent(invalid);
      throw new Error('expected invalid event');
    } catch (error) {
      assertEquals((error as Error).message === 'expected invalid event', false);
    }
  }
});

Deno.test('Stripe webhook is POST-only and fails closed when secrets are unavailable', async () => {
  const get = await stripeWebhook({
    request: new Request('https://app.test/api/stripe-webhook'),
    env: {},
  });
  assertEquals(get.status, 405);
  assertEquals(get.headers.get('allow'), 'POST');

  const post = await stripeWebhook({
    request: new Request('https://app.test/api/stripe-webhook', { method: 'POST', body }),
    env: {},
  });
  assertEquals(post.status, 503);
});

Deno.test('Stripe webhook acknowledges only after the verified event is durable', async () => {
  const now = Math.floor(Date.now() / 1000);
  const valid = await signature(body, now);
  let rpcBody: Record<string, unknown> | undefined;
  const handler = createStripeWebhook((_input, init) => {
    rpcBody = JSON.parse(String(init?.body));
    return Promise.resolve(new Response(JSON.stringify('applied')));
  });
  const response = await handler({
    request: new Request('https://app.test/api/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${now},v1=${valid}` },
      body,
    }),
    env: {
      STRIPE_WEBHOOK_SECRET: secret,
      STRIPE_LIVEMODE: 'false',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-only',
    },
  });
  assertEquals(response.status, 200);
  assertEquals(rpcBody?.provider_event_id, 'evt_test');
  assertEquals(rpcBody?.order_reference, 'x');

  const unavailable = createStripeWebhook(() => Promise.resolve(new Response('', { status: 503 })));
  const retry = await unavailable({
    request: new Request('https://app.test/api/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${now},v1=${valid}` },
      body,
    }),
    env: {
      STRIPE_WEBHOOK_SECRET: secret,
      STRIPE_LIVEMODE: 'false',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-only',
    },
  });
  assertEquals(retry.status, 503);

  const networkFailure = createStripeWebhook(() => Promise.reject(new Error('offline')));
  const retryNetwork = await networkFailure({
    request: new Request('https://app.test/api/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${now},v1=${valid}` },
      body,
    }),
    env: {
      STRIPE_WEBHOOK_SECRET: secret,
      STRIPE_LIVEMODE: 'false',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-only',
    },
  });
  assertEquals(retryNetwork.status, 503);
});
