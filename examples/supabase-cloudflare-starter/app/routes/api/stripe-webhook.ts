import {
  parseStripeEvent,
  stripeOrderReference,
  verifyStripeSignature,
} from '../../../lib/stripe-webhook.ts';

interface ApiContext {
  request: Request;
  env: Record<string, unknown>;
}

const MAX_WEBHOOK_BYTES = 1024 * 1024;

function serverSecret(env: Record<string, unknown>, name: string): string {
  const value = env[name];
  return typeof value === 'string' ? value : '';
}

export function createStripeWebhook(fetchImpl: typeof fetch = fetch) {
  return async function stripeWebhook({ request, env }: ApiContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
    }
    const webhookSecret = serverSecret(env, 'STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = serverSecret(env, 'SUPABASE_URL');
    const serviceRoleKey = serverSecret(env, 'SUPABASE_SERVICE_ROLE_KEY');
    const livemode = serverSecret(env, 'STRIPE_LIVEMODE');
    if (
      !webhookSecret || !supabaseUrl || !serviceRoleKey || !['true', 'false'].includes(livemode)
    ) {
      return Response.json({ error: 'webhook unavailable' }, { status: 503 });
    }

    const declaredBytes = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_WEBHOOK_BYTES) {
      return Response.json({ error: 'payload too large' }, { status: 413 });
    }
    // Stripe signs the exact bytes. Read once, verify first, parse only afterwards.
    const rawBody = new Uint8Array(await request.arrayBuffer());
    if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
      return Response.json({ error: 'payload too large' }, { status: 413 });
    }
    try {
      await verifyStripeSignature(rawBody, request.headers.get('stripe-signature'), webhookSecret);
    } catch {
      return Response.json({ error: 'invalid signature' }, { status: 400 });
    }

    let event;
    try {
      event = parseStripeEvent(rawBody);
      if (event.livemode !== (livemode === 'true')) {
        return Response.json({ error: 'event mode mismatch' }, { status: 400 });
      }
    } catch {
      return Response.json({ error: 'invalid event' }, { status: 400 });
    }

    try {
      const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/ingest_stripe_event`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          provider_event_id: event.id,
          event_type: event.type,
          event_created_at: event.created,
          event_livemode: event.livemode,
          order_reference: stripeOrderReference(event),
          provider_object: event.data.object,
        }),
      });
      if (!response.ok) return Response.json({ error: 'event not durable' }, { status: 503 });
      return Response.json({ received: true });
    } catch {
      return Response.json({ error: 'event not durable' }, { status: 503 });
    }
  };
}

export default createStripeWebhook();
