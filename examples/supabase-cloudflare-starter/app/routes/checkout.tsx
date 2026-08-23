import {
  type ActionContext,
  definePage,
  fail,
  type LoaderContext,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { serviceRoleRpc } from '../../lib/service-role.ts';
import {
  checkoutConfiguration,
  checkoutIntegrationSuffix,
  checkoutSessionBody,
  STRIPE_API_VERSION,
  verifiedCheckoutUrl,
} from '../../lib/stripe-checkout.ts';

export const tagName = 'page-checkout';
const PRODUCT_CODE = 'starter-support';

interface CheckoutData {
  denied: boolean;
  attemptId?: string;
  result?: 'success' | 'cancelled';
  orders?: { id: string; status: string; amount_total: number; currency: string }[];
  error?: string;
}

interface CheckoutActionData {
  error?: string;
  attemptId?: string;
}

export interface CheckoutSupabaseClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> };
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  from(table: 'orders'): {
    select(columns: string): {
      order(column: string, options: { ascending: boolean }): PromiseLike<{
        data: CheckoutData['orders'] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

type ClientFactory = (
  env: Record<string, unknown>,
  request: Request,
  responseHeaders: Headers,
) => CheckoutSupabaseClient;

type Fetch = typeof fetch;

function safeResult(request: Request): CheckoutData['result'] {
  const result = new URL(request.url).searchParams.get('result');
  return result === 'success' || result === 'cancelled' ? result : undefined;
}

export function createCheckoutLoader(createClient: ClientFactory = createServerSupabase) {
  return async function loader(ctx: LoaderContext<Record<string, unknown>>): Promise<CheckoutData> {
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { denied: true };
    const { data, error } = await client.from('orders')
      .select('id,status,amount_total,currency')
      .order('created_at', { ascending: false });
    return {
      denied: false,
      attemptId: crypto.randomUUID(),
      result: safeResult(ctx.request),
      orders: data ?? [],
      error: error?.message,
    };
  };
}

export function createCheckoutAction(
  createClient: ClientFactory = createServerSupabase,
  fetchImpl: Fetch = fetch,
) {
  return async function checkout(
    ctx: ActionContext<Record<string, unknown>>,
  ): Promise<OpenElementActionFailure<CheckoutActionData>> {
    const attemptId = String(ctx.formData.get('attempt_id') ?? '');
    // Deliberately stricter than the shared UUID_PATTERN (v1–v5): attempt ids
    // are always client-generated v4 UUIDs from the loader's crypto.randomUUID().
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
      return fail(422, { error: 'invalid checkout attempt' });
    }
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await client.auth.getUser();
    if (!user) return fail(401, { error: 'sign-in required to checkout', attemptId });

    const reserved = await client.rpc('create_checkout_order', {
      product_code: PRODUCT_CODE,
      checkout_attempt: attemptId,
    });
    if (reserved.error || typeof reserved.data !== 'string') {
      return fail(409, { error: 'checkout is temporarily unavailable; retry safely', attemptId });
    }

    let config;
    try {
      config = checkoutConfiguration(ctx.env);
    } catch {
      return fail(409, { error: 'checkout is temporarily unavailable; retry safely', attemptId });
    }
    const orderId = reserved.data;
    let checkoutUrl: string;
    try {
      const response = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.secretKey}`,
          'content-type': 'application/x-www-form-urlencoded',
          'idempotency-key': `checkout-${attemptId}`,
          'stripe-version': STRIPE_API_VERSION,
        },
        body: checkoutSessionBody(config, orderId, checkoutIntegrationSuffix(attemptId)),
      });
      if (!response.ok) throw new Error('Stripe Checkout creation failed');
      const session = await response.json() as { id?: unknown; url?: unknown; livemode?: unknown };
      if (
        typeof session.id !== 'string' || session.livemode !== config.livemode ||
        typeof session.url !== 'string'
      ) throw new Error('Stripe Checkout response mismatch');
      // Throws on non-2xx/missing config, landing in the catch below just
      // like the former boolean serviceRpc's `!attached` branch did.
      await serviceRoleRpc(ctx.env, 'attach_checkout_session', {
        order_id: orderId,
        checkout_session_id: session.id,
      }, fetchImpl);
      checkoutUrl = verifiedCheckoutUrl(session.url, config.checkoutHost);
    } catch {
      // Best-effort compensation; a failed mark must not mask the 409.
      await serviceRoleRpc(
        ctx.env,
        'mark_checkout_creation_failed',
        { order_id: orderId },
        fetchImpl,
      )
        .catch(() => {});
      return fail(409, { error: 'checkout is temporarily unavailable; retry safely', attemptId });
    }
    throw redirect(checkoutUrl);
  };
}

export const loader = createCheckoutLoader();
export const actions = { checkout: createCheckoutAction() };

const CheckoutPage = definePage<CheckoutData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Checkout — reference starter' },
  render() {
    const data = useLoaderData() as CheckoutData;
    const actionData = useActionData() as CheckoutActionData | undefined;
    if (data.denied) {
      return (
        <main>
          <h1>Checkout</h1>
          <p id='denied'>Sign-in is required.</p>
        </main>
      );
    }
    const attemptId = actionData?.attemptId ?? data.attemptId ?? '';
    return (
      <main>
        <h1>One-time Checkout</h1>
        {data.result === 'success'
          ? (
            <p id='checkout-result'>
              Checkout returned. Payment status is confirmed by webhook only.
            </p>
          )
          : null}
        {data.result === 'cancelled' ? <p id='checkout-result'>Checkout was cancelled.</p> : null}
        {actionData?.error ? <p id='action-error'>{actionData.error}</p> : null}
        <p>Starter support — USD 5.00, one-time payment.</p>
        <form method='post' action='/checkout?/checkout'>
          <input type='hidden' name='attempt_id' value={attemptId} />
          <button type='submit'>Pay with Stripe</button>
        </form>
        <h2>Your orders</h2>
        <ul id='orders'>
          {(data.orders ?? []).map((order) => (
            <li key={order.id}>
              {order.currency.toUpperCase()} {(order.amount_total / 100).toFixed(2)} —{' '}
              {order.status}
            </li>
          ))}
        </ul>
      </main>
    );
  },
});

customElements.define(tagName, CheckoutPage);
export default CheckoutPage;
