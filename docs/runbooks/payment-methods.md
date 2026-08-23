# Stripe Checkout and payment methods runbook

The reference uses hosted Checkout with Stripe's Dashboard-managed dynamic
payment methods. Session creation deliberately omits `payment_method_types` and
the Managed Payments override. Stripe chooses eligible methods using the
account configuration, currency, customer and current API rules.

## Credentials and API contract

Create a dedicated restricted key for this service in each mode:

- grant **Checkout Sessions: Write**;
- leave every unrelated resource at **None**;
- add an IP access restriction when the deployment has stable egress;
- store the key in the Cloudflare secret store as `STRIPE_SECRET_KEY`;
- never put it in `wrangler.jsonc`, `.env.example`, logs, client code or build
  artifacts.

`rk_test_` and `rk_live_` keys are the recommended path. Mode-matching `sk_test_`
and `sk_live_` keys remain a migration fallback only. Review Stripe Workbench
request logs, move to the restricted key, then rotate the broad key.

Every Checkout creation pins `Stripe-Version: 2026-07-29.dahlia` and sends an
`integration_identifier` beginning `openelement_reference_` with an eight-letter
suffix derived from the persisted random checkout-attempt UUID. The label stays
identical across idempotent retries. Version changes require tests and a
deliberate review.

## Payment-method policy

Enable or disable methods in Stripe Dashboard payment-method settings. If a
business requirement needs a distinct set, use a payment method configuration;
for a transaction-specific exception use Stripe's supported exclusion field.
Do not add `payment_method_types` to non-Terminal requests.

Dynamic methods mean a Session can complete asynchronously. The durable webhook
state machine therefore handles all three relevant events:

- `checkout.session.completed` grants paid state only when `payment_status` is
  not `unpaid`;
- `checkout.session.async_payment_succeeded` transitions the order to paid;
- `checkout.session.async_payment_failed` transitions it to payment failed.

The success return page never grants state. Raw-body signature verification,
provider-event idempotency, Queue/DLQ durability and admin replay remain required.

## Verification and incident response

Before enabling a live method, exercise its test-mode Checkout redirect and
webhook success/failure path. Confirm the resulting order state from the owner
view, not from the return-page query parameter.

If a key might be exposed, rotate or delete it immediately, inspect Stripe
Workbench logs, and contact Stripe Support for unrecognized activity. During a
Stripe incident, Checkout creation fails closed with a retryable application
message; existing durable webhook events remain available to Queue/DLQ replay.

References: [restricted API keys](https://docs.stripe.com/keys),
[dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods),
and [Checkout fulfillment](https://docs.stripe.com/payments/checkout/fulfillment).
