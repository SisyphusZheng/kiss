# ADR-0121: 0.42 Action Protocol Hardening Amendment (Audit Round 1)

- Status: ACCEPTED
- Date: 2026-07-27 (accepted 2026-07-28, with the 0.42.0-alpha.5 release)
- Amends: ADR-0120 (action protocol rules 2, 3, 4, 6, 7)

## Context

The first implementation audit round of the 0.42 WC Application Loop
(GitHub issues #539–#573, milestone `v0.42.0-alpha.5`) found the ADR-0120
protocol skeleton faithfully implemented in its main lines, but with
specific holes, bypasses and undocumented behaviors that are
protocol-visible. ADR-0120 requires an amendment for protocol changes;
this amendment records all of the protocol-visible decisions in one batch
so the protocol document stays coherent. Implementation bugs with no
protocol visibility (dead branches, escaping, codegen details) are fixed
directly under the issues and are not recorded here.

The round's deepest finding concerns rule 6 itself: the alpha.3 morph
enhancement never functioned. Page content lives inside page-element DSD
shadow roots, the `submit` event is not composed, and the document-level
submit listener therefore never fired — the published survival-matrix
results were silently measuring the native no-JS path, and the two
survival specs fail deterministically at both the alpha.3 and alpha.4
tags. Items 8–11 are written against the rewritten client that fixes
this at the architecture level.

## Decision

1. **Request-header negotiation (amends rule 2).** One framework request
   header, `x-openelement-action`, with two values: `true` marks a
   programmatic caller and selects the serialized `ActionResult` union;
   `enhance` marks the built-in morph enhancement and selects the same
   full-HTML responses the no-JS path receives. The alpha.2–alpha.4
   `x-openelement-enhance` header (never consumed by any server code) is
   retired. The POST endpoint answers `Vary: x-openelement-action` so the
   two response classes never share a cache entry.
2. **Response-return policy (amends rule 3).** Actions must not return
   `Response` objects. The return channel is data or `fail(status, data)`;
   the redirect channel is `redirect()`; everything else is a thrown
   error. A returned `Response` is a contract violation and answers 500
   (clear message in dev, generic in production). This makes "a
   successful mutation never answers 200 with a rendered page" a
   mechanical property instead of a convention.
3. **Redirect algebra (amends rule 3).** `redirect()` validates at
   construction that the status is one of 301/302/303/307/308 and throws
   otherwise. In the POST action context every 3xx is coerced to 303
   (post/redirect/get must be method-safe and non-cacheable); in the
   GET/loader context the author's status is kept (permanent moves remain
   legitimate there). The `ActionResult` redirect variant is answered
   with HTTP 200 carrying `{ type: 'redirect', status: 303, location }` —
   it is a data message for the client, not an HTTP redirect (an HTTP 3xx
   would be transparently followed by `fetch` and the JSON body would be
   unreadable).
4. **Default PRG target (amends rule 3).** The default PRG location is
   the route pathname plus the query string with `/`-prefixed
   action-marker keys removed; all other query parameters are preserved.
   The action marker never reaches the address bar, history or referer.
5. **Fetch-channel symmetry (amends rule 2).** On the JSON channel every
   protocol outcome is an `ActionResult`: an unknown named action and a
   POST to a route without actions both answer
   `{ type: 'error', status: 404, error: { message } }` with HTTP 404,
   with distinct messages for "route does not accept submissions" and
   "no action named X". The HTML channel keeps the framework 404 page.
6. **Caching (implements the rule-7 no-cache promise).** Every
   request-time response kind (200/422/303/404/500) carries
   `Cache-Control: no-store`; the POST endpoint additionally carries
   `Vary: x-openelement-action` per item 1.
7. **Error-channel parity (amends rule 4).** Thrown values on POST take
   the same nearest-error-boundary channel as GET: the page's `error`
   component renders with status 500, with the bare 500 page as fallback.
   The audit's accepted window is recorded: an action whose mutation
   commits and whose revalidation then fails (loader throw on the
   follow-up GET, or a mutate-then-`fail()` contract violation) leaves
   the mutation committed while the user sees an error page. "Validate
   first, mutate after" remains the action contract; the guide documents
   the window.
8. **Region semantics (amends rule 6).** A form targets a named region
   via `data-open-region-target="name"` (on the submitter or the form,
   submitter wins); absent that attribute the morph targets the nearest
   ancestor `[data-open-region]` of the form; absent any region the body
   morphs. If the target region is missing on either side the client
   navigates to the response URL (never a silent full-body morph).
   Non-targeted regions are never touched.
9. **Morph architecture and identity (amends rule 6).** Page content
   lives inside the page element's DSD shadow root, so the morph descends
   into shadow trees: a non-island host with a live shadow root and an
   incoming `<template shadowrootmode>` child morphs its shadow root
   against the template content. Submits are intercepted at every shadow
   root (the submit event is not reliably composed across engines), with
   the document-level listener covering light-DOM forms. Within a parent,
   children carrying an `id` attribute match by `id` (tag must also
   match); the remaining children match structurally (node type + tag)
   with a bounded lookahead, so insertions and removals between matched
   anchors are preserved instead of cascading into wholesale replacement.
   Hydrated-island survival still requires the light-DOM surface
   comparison (`__islandIntact`). Rows rendered in dynamic lists should
   carry stable `id`s to survive reorders.
10. **Popstate (amends rule 6).** The enhanced client reloads the
    document on `popstate`. There is no client-side state cache in 0.42;
    back/forward therefore never shows content that disagrees with the
    URL.
11. **Action-failure event (restores the alpha.2 hook; amends rule 6).**
    On a 422 response the enhanced client dispatches a cancelable
    `open:action-failure` `CustomEvent` on the form with
    `detail: { status, form, response }` before morphing; calling
    `preventDefault()` skips the default morph (the page handles the
    failure itself). Network and non-HTML failures keep the reload
    fallback.
12. **CSRF threat model (amended 0.42.0-alpha.7 / #611).** Generated
    action POST handlers default to a fail-closed same-origin floor:
    reject when `Sec-Fetch-Site: cross-site`, or when `Origin` is present
    and does not match the request URL origin. Clients that omit both
    headers (typical non-browser tools) are allowed. Opt out by setting
    `OPEN_ELEMENT_DISABLE_CSRF=1` on the request `env` binding
    (`c.env` / Nitro runtime env). Session-aware CSRF tokens and cookie
    session primitives remain 0.44; this floor is the light-fullstack
    browser default, not a full auth stack.

## Consequences

Positive:

- Every protocol outcome is deterministic and mechanically testable on
  both channels; the two channels can no longer diverge silently.
- The header negotiation becomes honest: one header, documented values,
  cache-safe via `Vary`.
- The audit's high-severity protocol holes (#539–#542, #544, #547–#549)
  become contract violations with clear errors instead of silent
  misbehavior.

Negative:

- `0.42.0-alpha.2`–`alpha.4` clients sending `x-openelement-enhance`
  are tolerated (treated as the HTML path) but the header no longer
  appears in the shipped client; the wire was never consumed, so no
  migration is needed.
- Forbidding returned `Response` objects removes an escape hatch; users
  needing full response control use API routes (Hono) instead of page
  actions.

Neutral:

- Items 6, 7 and 12 record or implement promises ADR-0120 already made;
  the rest are protocol amendments proper. The fixture e2e and the
  codegen contract tests are the mechanical gate for every item.
