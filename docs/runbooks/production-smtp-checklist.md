# Production SMTP checklist (Supabase Auth)

Supabase's built-in email service is development-only: it sends solely to
pre-authorized team addresses, is capped at 2 messages/hour, and carries no
delivery SLA. Any real deployment of the reference starter's email flows
(signup confirmation, magic link, recovery, email change) requires a custom
SMTP provider. This checklist is executed by a human operator against the
live project; keep every credential in the provider/Supabase dashboards —
never in the repo, an issue, or a PR description.

References: [Supabase custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp),
[two-layer rate limits](../integrations/supabase.md#rate-limits-two-independent-layers).

## 1. Choose the provider

- Pick any SMTP-capable transactional service — the Supabase guide lists
  Resend, AWS SES, Postmark, Twilio SendGrid, ZeptoMail, Brevo. Transactional
  deliverability tooling (suppression lists, bounce webhooks, per-domain
  reputation) matters more than price at auth volumes.
- **Separate auth from marketing**: distinct sending subdomain
  (`auth.example.com` vs `marketing.example.com`), distinct From address,
  ideally distinct service or stream, so one stream's reputation cannot sink
  the other.
- Decide the stand-by provider now; document the switch steps while things
  are calm, not during a block.
- If sign-up surges are planned (launch, campaign), brief the provider on the
  expected volume ahead of time; sudden spikes read as abuse.

## 2. Sending domain: SPF, DKIM, DMARC

Do these in the provider's domain setup flow first — it emits the exact
records. Typical shapes:

- **SPF** — one TXT record on the sending domain (never two), including the
  provider's mechanism: `v=spf1 include:<provider-domain> ~all`. Start with
  `~all`, tighten to `-all` once stable. Stay under the 10-lookup DNS limit.
- **DKIM** — the provider's selector record(s), usually a CNAME such as
  `<selector>._domainkey.auth.example.com` → provider key host. Enable
  signing only after the record resolves.
- **DMARC** — TXT at `_dmarc.example.com`. Start monitoring-only:
  `v=DMARC1; p=none; rua=mailto:dmarc@example.com`, then advance to
  `p=quarantine` and finally `p=reject` after reports stay clean.

Verify from the shell (propagation can take minutes to hours):

```sh
dig +short TXT auth.example.com                       # expect the v=spf1 record
dig +short TXT <selector>._domainkey.auth.example.com # expect the DKIM key/CNAME
dig +short TXT _dmarc.example.com                     # expect v=DMARC1
```

The end-to-end check is the received message header: send a test email to a
Gmail address, open **Show original**, and confirm `Authentication-Results`
shows `spf=pass`, `dkim=pass`, `dmarc=pass`.

## 3. Configure custom SMTP in Supabase

- Dashboard: **Authentication → Emails (SMTP settings)** — set host, port
  (587/starttls unless the provider says otherwise), user, password, sender
  email (`no-reply@auth.example.com`), and sender name.
- Or the Management API (audit-friendly, scriptable):

```sh
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "mailer_autoconfirm": false,
    "smtp_admin_email": "no-reply@auth.example.com",
    "smtp_host": "smtp.provider.example",
    "smtp_port": 587,
    "smtp_user": "your-smtp-user",
    "smtp_pass": "your-smtp-password",
    "smtp_sender_name": "Your App Name"
  }'
```

- Saving enables sending to **all** addresses — and Supabase protects the new
  sender with a 30 messages/hour cap. Raise it deliberately in
  **Authentication → Rate Limits** to match expected signup/recovery volume
  (see the rate-limit section linked above for the full two-layer picture).
- The `[auth.email.smtp]` keys in `supabase/config.toml` configure only the
  local emulator (Inbucket/Mailpit evidence); they are not a production
  channel. Production SMTP credentials live in the dashboard/Management API
  only and must never appear in the repo.

## 4. Templates and branding

- Customize every auth template in the dashboard (confirm signup, magic
  link, recovery, email change, invite) with the production app name, logo
  restraint, and the correct link variables (`.ConfirmationURL`, `.Token`,
  `.SiteURL`) — verify each rendered link points at the production app
  origin, not localhost.
- Keep authentication emails transactional: short subjects, no promotional
  content, few links/CTAs, minimal images, no A/B testing, and change them
  infrequently (spam filters and user muscle memory both reward stability).
- A custom domain for the project's Auth server keeps message links off the
  shared `*.supabase.co` reputation.

## 5. Bounce and complaint handling

- Wire the provider's bounce/complaint events to an operator-visible channel
  (SES → SNS, SendGrid/Postmark event webhooks → your endpoint or their
  alert integrations). Suppression-list handling must be automatic for hard
  bounces and complaints.
- Watch the numbers weekly: hard-bounce rate near 0, spam-complaint rate
  under 0.1% (0.3% is the bulk-sender hard ceiling at Gmail/Yahoo).
- A rising bounce curve on auth emails usually means bot signups, not list
  decay — respond at the source: keep the Cloudflare `AUTH_RATE_LIMITER`
  layer and the Supabase per-user resend windows intact, and enable
  Supabase's CAPTCHA protection before considering any relaxation of email
  confirmation. Never disable confirmations under abuse pressure.

## 6. Pre-launch verification (in order)

1. `dig` checks for SPF/DKIM/DMARC all return the expected records.
2. SMTP saved; a real signup to an external Gmail **and** an Outlook mailbox
   lands in the inbox (not spam) with `spf=pass dkim=pass dmarc=pass` in the
   headers.
3. Magic link and password recovery to the same mailboxes arrive inside the
   per-user resend window rules and their links open the production app.
4. A mail-tester (or equivalent) score is clean; no blacklist hits for the
   sending domain/IP.
5. The Supabase email rate limit is raised from the initial 30/hour to the
   launch-day forecast, with headroom.
6. Bounce/complaint alerts reach the on-call channel; suppression is
   automatic; DMARC advance plan (`none → quarantine → reject`) is scheduled.
7. Stand-by provider switch steps are written down; secrets exist only in
   the two dashboards; repo and evidence artifacts contain placeholders only.
