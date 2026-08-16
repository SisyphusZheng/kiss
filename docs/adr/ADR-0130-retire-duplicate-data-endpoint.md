# ADR-0130: Retire the Duplicate `/_data` Loader Endpoint

- Status: Accepted
- Date: 2026-08-17
- Amends: ADR-0122 §2/§4
- Related: #987, #1002

## Context

The generated request-time entry contained two ways to execute a page loader:
the canonical page GET handler and a generated `/_data/<route>` handler. The
browser router does not consume the latter; it imports the route module and
invokes the same loader through its in-process request cache. No maintained
consumer, public recipe, or compatibility test uses `/_data`.

Keeping an unused second endpoint duplicated route matching and loader dispatch
inside the ADR-0122 frozen entry generator. It also created an attractive but
false protocol surface whose params, Cookie propagation, redirects, problem
responses and cache headers would have needed permanent parity coverage.

## Decision

Remove generation and orchestration of the private `/_data` route map and
endpoint. There is no replacement network endpoint. Browser navigation keeps
using the existing in-process loader path; request-time/native navigation keeps
using the canonical page GET handler.

This amendment changes only the set of generated internal endpoints. It does
not change ADR-0122's frozen contracts:

- loader/action signatures and `fail()`/`redirect()` algebra are unchanged;
- action negotiation, PRG revalidation and native/enhanced symmetry are unchanged;
- CSRF defaults and POST dispatch are unchanged;
- Cookie/response-header propagation and cache behavior remain on canonical handlers;
- pure-static projects and the documented `build` then `start` path are unchanged.

## Consequences

- One loader has one maintained request-time network representation.
- Generated output must not contain `/_data` or `__dataRouteMap`; a regression
  test pins this absence.
- A future serialized loader-data endpoint is a new public protocol proposal,
  not permission to restore the retired private implementation.
- Removing any other generated route under the frozen entry pipeline requires
  its own compatibility analysis; this amendment is intentionally narrow.
