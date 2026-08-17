# Payment methods runbook

Card is the only enabled payment method. Checkout Session creation pins
`payment_method_types[0] = card` (`lib/stripe-checkout.ts`), so no other method
can be offered regardless of account eligibility. This runbook records the
Alipay / WeChat Pay eligibility verification and when to re-evaluate.

## Verification procedure

Run against the secret key of the target mode (never print or persist the key):

```sh
curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/account/capabilities
```

Read `data[].id` / `data[].status`. Stripe capability statuses are `active`,
`pending`, `inactive`, and `unrequested`; a payment-method capability that was
never requested does not appear in the listing at all.

## 2026-08-17 verification (test-mode key, HK account)

- `GET /v1/account` returned HTTP 200 with an empty `capabilities` object,
  `charges_enabled = false`, `payouts_enabled = false`.
- `GET /v1/account/capabilities` returned HTTP 200 with 16 capabilities, all
  `unrequested`.
- `card_payments`: `unrequested` (`disabled_reason: requirements.fields_needed`)
  — account onboarding is incomplete, so live card charges are not possible yet.
  Test mode is unaffected and remains the only exercised path.
- `alipay_payments`: **not listed** — cannot be verified via the API; the
  account has never requested it. Confirm eligibility in the Dashboard under
  Settings → Payment methods.
- `wechat_pay_payments`: **not listed** — same as above.

Per Stripe's Alipay documentation, eligibility for a given account is shown in
Dashboard payment-method settings, and platform-level `alipay_payments`
capability requests are a private-preview feature requiring Stripe Support.
There is no API-only path to confirm eligibility for an account that has not
requested the capability.

## When and how to re-evaluate

Re-run the verification above when any of the following occurs:

1. Account onboarding completes and `card_payments` reaches `active`.
2. A business requirement for Alipay / WeChat Pay (e.g. CNY-denominated
   customers) appears.
3. The Dashboard payment-methods settings show Alipay or WeChat Pay as
   available for the account.

If a capability becomes available:

1. Request / enable it in the Dashboard (or via Support where required).
2. Re-run the API verification and record the new status and date here.
3. Extend checkout creation beyond `card`, add the method's test-mode end-to-end
   evidence (Checkout redirect → webhook → `paid` transition), and update the
   release audit before enabling it in live mode.

Until then, do not add `payment_method_types` entries or enable automatic
payment methods: an unverified method must never reach Checkout.
