export interface CheckoutConfiguration {
  secretKey: string;
  priceId: string;
  appOrigin: string;
  checkoutHost: string;
  livemode: boolean;
}

function required(env: Record<string, unknown>, name: string): string {
  const value = env[name];
  if (typeof value !== 'string' || !value) throw new Error(`missing ${name}`);
  return value;
}

export function checkoutConfiguration(env: Record<string, unknown>): CheckoutConfiguration {
  const appOrigin = required(env, 'APP_ORIGIN');
  const origin = new URL(appOrigin);
  const allowedProtocol = origin.protocol === 'https:' ||
    (origin.protocol === 'http:' && origin.hostname === 'localhost');
  if (origin.origin !== appOrigin || !allowedProtocol) {
    throw new Error('APP_ORIGIN must be an exact secure origin');
  }
  const livemode = required(env, 'STRIPE_LIVEMODE');
  if (!['true', 'false'].includes(livemode)) throw new Error('invalid STRIPE_LIVEMODE');
  const secretKey = required(env, 'STRIPE_SECRET_KEY');
  if (
    !(livemode === 'true' ? secretKey.startsWith('sk_live_') : secretKey.startsWith('sk_test_'))
  ) {
    throw new Error('Stripe secret key mode mismatch');
  }
  const checkoutHost = typeof env.STRIPE_CHECKOUT_HOST === 'string' && env.STRIPE_CHECKOUT_HOST
    ? env.STRIPE_CHECKOUT_HOST
    : 'checkout.stripe.com';
  if (new URL(`https://${checkoutHost}`).hostname !== checkoutHost) {
    throw new Error('STRIPE_CHECKOUT_HOST must be an exact hostname');
  }
  return {
    secretKey,
    priceId: required(env, 'STRIPE_PRICE_ID'),
    appOrigin,
    checkoutHost,
    livemode: livemode === 'true',
  };
}

export function checkoutSessionBody(
  config: CheckoutConfiguration,
  orderId: string,
): URLSearchParams {
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  // Card-only is a code-owned invariant. Accounts with Managed Payments enabled
  // by default reject explicit payment_method_types unless Managed Payments is
  // disabled per request — otherwise the Dashboard, not this code, would decide
  // which methods Checkout offers.
  body.set('managed_payments[enabled]', 'false');
  body.set('payment_method_types[0]', 'card');
  body.set('line_items[0][price]', config.priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('client_reference_id', orderId);
  body.set('metadata[order_id]', orderId);
  body.set('payment_intent_data[metadata][order_id]', orderId);
  body.set('success_url', `${config.appOrigin}/checkout?result=success`);
  body.set('cancel_url', `${config.appOrigin}/checkout?result=cancelled`);
  return body;
}

export function verifiedCheckoutUrl(value: unknown, expectedHost: string): string {
  if (typeof value !== 'string') throw new Error('Stripe did not return a Checkout URL');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== expectedHost || url.username || url.password) {
    throw new Error('Stripe returned an unexpected Checkout URL');
  }
  return url.href;
}
