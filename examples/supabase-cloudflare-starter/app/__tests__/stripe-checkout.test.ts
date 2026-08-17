import { assertEquals, assertThrows } from '@std/assert';
import {
  checkoutConfiguration,
  checkoutSessionBody,
  verifiedCheckoutUrl,
} from '../../lib/stripe-checkout.ts';

const env = {
  APP_ORIGIN: 'https://app.test',
  STRIPE_SECRET_KEY: 'sk_test_server',
  STRIPE_PRICE_ID: 'price_fixed',
  STRIPE_LIVEMODE: 'false',
};

Deno.test('Checkout configuration requires an exact application origin', () => {
  assertEquals(checkoutConfiguration(env).appOrigin, 'https://app.test');
  for (
    const origin of [
      'https://app.test/path',
      'http://app.test',
      'https://app.test/',
      'ftp://localhost',
    ]
  ) {
    assertThrows(() => checkoutConfiguration({ ...env, APP_ORIGIN: origin }));
  }
  assertThrows(() => checkoutConfiguration({ ...env, STRIPE_SECRET_KEY: 'sk_live_wrong' }));
  assertThrows(() => checkoutConfiguration({ ...env, STRIPE_CHECKOUT_HOST: 'evil.example/path' }));
});

Deno.test('Checkout request is one-time card-only and webhook-correlated', () => {
  const body = checkoutSessionBody(checkoutConfiguration(env), 'order-1');
  assertEquals(body.get('mode'), 'payment');
  assertEquals(body.get('payment_method_types[0]'), 'card');
  assertEquals(body.get('managed_payments[enabled]'), 'false');
  assertEquals(body.get('line_items[0][price]'), 'price_fixed');
  assertEquals(body.get('metadata[order_id]'), 'order-1');
  assertEquals(body.get('payment_intent_data[metadata][order_id]'), 'order-1');
  assertEquals(body.get('success_url'), 'https://app.test/checkout?result=success');
});

Deno.test('Checkout redirect accepts only the configured HTTPS host', () => {
  assertEquals(
    verifiedCheckoutUrl('https://checkout.stripe.com/c/pay/test', 'checkout.stripe.com'),
    'https://checkout.stripe.com/c/pay/test',
  );
  for (const url of ['http://checkout.stripe.com/x', 'https://evil.example/x', 'not-a-url']) {
    assertThrows(() => verifiedCheckoutUrl(url, 'checkout.stripe.com'));
  }
});
