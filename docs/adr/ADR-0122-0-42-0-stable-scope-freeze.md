# ADR-0122: 0.42.0 Stable Scope Freeze — WC Light Fullstack

- Status: PROPOSED (acceptance is the TP-6 stable decision; see
  `docs/current/VERSION_PLAN.md` §TP-6)
- Date: 2026-08-02
- Builds on: ADR-0120 (0.42.0 WC Application Loop scope),
  ADR-0121 (action protocol hardening amendment),
  ADR-0119 (0.41.x static freeze — the model this ADR mirrors)

## Context

The 0.42 alpha line (alpha.1–alpha.12) shipped the WC light-fullstack
request-time surface: page loaders, form actions, progressive enhancement
with a DSD-aware morph client, the fail/redirect error algebra, PRG
revalidation, and a fail-closed CSRF same-origin floor. Six full-spectrum
audits (issues #539–#852) hardened the line to the point where every
ADR-0120 protocol rule carries a mechanical gate or contract test — the
TP-5.7 acceptance requirement. TP-6 is the stable decision for 0.42.0, and
it requires an explicit, reviewed statement of what freezes and — equally
important — what is deliberately left out of the 0.42 claim.

Two structural properties of the architecture motivate the freeze shape.
First, the stack is an onion: `element` (component model: WC + JSX +
signals + DSD + real DOM) knows nothing of `app` (page/data protocol),
which knows nothing of `adapter-vite` (build/deploy shell). Second, the
seam between layers is the W3C standard itself — tag names, attributes,
and DSD — so the page layer composes any custom element, not just
element-authored ones (guarded by `third-party-wc:smoke`). Both properties
depend on page-level updates staying component-model-agnostic: the morph
client aligns DOM trees by `id` and never touches a component's private
reactivity. Freezing must protect these properties, not just the API list.

## Decision

1. **Frozen at 0.42.0 — the loop contract.** The request-time page loop as
   shipped: `definePage` loader/action signatures, the `fail()`/`redirect()`
   algebra and their HTTP encodings (422 with error data, 3xx whitelist),
   PRG revalidation semantics (action precedes loader re-run), and the
   no-JavaScript baseline (every protocol path degrades to native HTML).
   Breaking changes to any of these require an amendment ADR, mirroring
   the ADR-0119 → ADR-0120 relationship.
2. **Frozen at 0.42.0 — the action protocol.** The negotiated channels
   (`x-openelement-action` header contract), the morph client contract
   (`docs/current/MORPH_CONTRACT.md`: id-keyed alignment, DSD template
   descent, island survival), and the enhanced/native channel symmetry.
3. **Frozen at 0.42.0 — the CSRF default.** Generated action POST handlers
   reject cross-site browser requests fail-closed (Sec-Fetch-Site /
   Origin), with `OPEN_ELEMENT_DISABLE_CSRF=1` as the documented opt-out.
   Weakening this default is a protocol change, not a configuration change.
4. **Frozen at 0.42.0 — first-mile start semantics.** `build` then `start`
   is the documented one-command path for request-time projects; the
   generated server entry's request pipeline shape (static → routes →
   action dispatch → error boundary) is part of the contract.
5. **Explicitly unfrozen / out of the 0.42 claim.** Framework session and
   flash primitives; cache/ISR semantics (`renderIntent.revalidate` is
   recorded in manifests but inert — forward-compat data only); streaming
   SSR; performance SLOs; the third-party WC SSR corpus (0.43 scope);
   production runtime recovery (0.44 scope). None of these may be marketed
   as 0.42 capabilities; placeholder surfaces stay `@experimental`.
6. **Signed-in apps on 0.42 use recipes.** Login via the better-auth
   recipe (`docs/integrations/better-auth.md`) is the supported path;
   framework-level session is explicitly a 0.44 topic and is not a
   prerequisite for shipping signed-in applications on 0.42.
7. **The 0.41.x static freeze is untouched.** Pure-static projects upgrade
   to 0.42.0 with zero changes; the migration note and the byte-level
   upgrade proof are TP-6 deliverables that must land before acceptance.

## Consequences

- The 0.42 public surface gains an amendment-ADR gate equivalent to the
  0.41.x freeze: any PR touching frozen semantics must reference an
  amendment. A fresh stable gate for 0.42 is opened at TP-6 (not reused
  from the 0.41.x gate, per the VERSION_PLAN acceptance criteria).
- Deferred-scope issues stay open with explicit target lines instead of
  pressuring 0.42 scope: session floor (#612), streaming SSR (#626),
  loader-driven head meta (#613), sourcemaps/user Vite config (#614),
  SPA/server loader context honesty (#615).
- Documentation must keep the light-fullstack wording: `0.42 = WC light
  fullstack`, with the non-goals in §5 stated wherever the request-time
  surface is introduced (README, www, STATUS) and no "production runtime"
  claims.
- The onion property in §Context becomes a reviewable invariant: new
  page-level update mechanisms must remain component-model-agnostic (DOM /
  id keyed), or the change requires an amendment.
