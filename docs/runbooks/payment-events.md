# Stripe event Queue and recovery runbook

The Stripe endpoint has one narrow responsibility: verify the exact raw request,
enforce test/live isolation, persist a minimal deduplicated event envelope, and
hand its id to `PAYMENT_EVENT_QUEUE`. It returns 2xx only after that durable
handoff, except for events already completed or dead-lettered. The success URL
never changes order state.

## Required production bindings

- Secrets `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and
  `SUPABASE_SERVICE_ROLE_KEY`.
- Variable `STRIPE_LIVEMODE` set explicitly to `true` or `false`.
- Producer/consumer binding `PAYMENT_EVENT_QUEUE` for
  `openelement-payment-events`.
- Dead-letter queue `openelement-payment-events-dlq`. Its consumer persists the
  failed event state before acknowledgement.
- Unconsumed safety queue
  `openelement-payment-events-persistence-failures` for failures that exhaust
  DLQ persistence retries.
- The shared five-minute Cron Trigger, which re-enqueues durable `received`
  events older than one minute and admin-requested replays.

These resources are rendered into the generated async Wrangler overlay. Do not
add a second hand-maintained provider config or restore the retired
`ingest_stripe_event` RPC.

## Delivery and state contract

1. The endpoint verifies Stripe's HMAC over the unchanged bytes before parsing.
2. `receive_stripe_event` inserts one `received` row keyed by provider event id.
   Only state-machine inputs are retained; customer and full provider payloads
   are discarded.
3. Queue handoff carries only `{ type: "payment.process", eventId }`.
4. `process_stripe_event` locks both the event and order, increments the delivery
   count, reconciles amount/currency for successful Checkout events, applies
   only a higher state rank, and finally marks the event `completed`.
5. Duplicate delivery is safe. Completed events are no-ops and stale provider
   events cannot regress an order.
6. After three consumer retries, the DLQ consumer marks the event `dead_letter`
   before acknowledgement. An admin may request a replay once the cause is fixed.
7. Cron sends the original event id and changes `replay_requested` back to
   `received` only after Queue handoff succeeds.

## Failure and recovery

- A webhook 503 means persistence or Queue handoff failed. Stripe should retry;
  do not manually mark the order paid.
- For a dead letter, inspect the event type, delivery count, order audit, Queue
  metrics, and Supabase errors. Fix the cause, then use **Request payment replay**
  in `/admin`.
- If DLQ persistence exhausts retries, inspect the persistence-failure queue
  before its retention expires and replay only after Supabase is healthy.
- If `received` rows accumulate, verify the payment Queue binding and service-role
  secret, then check the scheduled handler. Cron is compensation, not the normal
  delivery path.
- Never replay an event by calling an order update directly. The Queue processor
  is the sole runtime implementation of payment state transitions.
