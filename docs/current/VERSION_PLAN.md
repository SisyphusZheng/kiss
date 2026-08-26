# v0.43.2 — runtime failure containment and stabilization closure

> Current source package line: `v0.43.3`\
> Current npm registry line: `v0.43.3` (published 2026-08-24, dist-tag `latest`)\
> Latest landed train: `v0.43.3`\
> Active release target: `v0.43.3`\
> Next planned train: `not scheduled (maintenance mode)`\
> Planning release target: `v0.43.2` (compatible runtime and release hardening)\
> Current maturity stage: stable (`0.43.x`, frozen by ADR-0119, ADR-0122,
> ADR-0135 and maintained under ADR-0140)

## Objective and scope

`v0.43.2` is a compatibility-preserving correction patch over the cumulative
`v0.43.1` maintenance baseline. It closes observable failure paths in the
framework runtime and Supabase × Cloudflare reference application, then makes
their behavioral and release evidence reproducible from a clean checkout.

The patch adds no public package or export, changes no applied migration, and
does not introduce a framework session, transaction, outbox, retry or recovery
abstraction. The frozen application-loop and Universal WC contracts remain in
force. ADR-0141 records why Node disconnect propagation strengthens cleanup
without changing ADR-0122 first-mile start semantics.

```text
OpenElement = Web Components-native fullstack application framework
product graph = five-package element/app/adapter-vite/create/ui boundary
official build path = Vite + Nitro through @openelement/adapter-vite/nitro-mount
```

Package responsibilities and exports remain governed by
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md); ADR-0114 continues to require one
aligned five-package release line.

## Work packages

### Framework runtime

- [x] #1135: Preact alone owns its island DOM across hydration, update, detach,
      same-tick move, reconnect and teardown.
- [x] #1136: the Node HTTP bridge propagates request abort, respects response
      backpressure, cancels disconnected streams and removes listeners.
- [x] #1143: router disposal invalidates pending programmatic and browser guard
      work, redirect chains and rejected guards.
- [x] #1144: unsupported action data (`undefined`, function, `Symbol`,
      `BigInt`, circular values) retains the same `{ data: null }` failure
      envelope in Hono development and Nitro production output.

### SaaS reference application

- [x] #1138: an upload finalize failure retains durable Storage cleanup intent
      and the reconciler converges retries.
- [x] #1139: Notes Realtime renews expiring Supabase tokens only through the
      same-origin session boundary, handles 401, and rejects cross-origin use.
- [x] #1145: Stripe webhook bodies are bounded for chunked, forged
      `Content-Length`, overflow and stalled-stream cases before verification.

### Tooling, docs and tests

- [x] #1137: the public-interface gate fingerprints declaration dependency
      graphs, including re-exported type-shape changes.
- [x] #1140: current docs state the published maintenance line and frozen
      contract honestly.
- [x] #1141: docs no longer claim the SPA options interface is a named public
      export.
- [x] #1142: the root test task succeeds in a clean clone and includes the
      Starter's separate test configuration.
- [x] #1147: the Hono/Nitro parity harness owns an exact loopback server and
      disables Vite's independent WebSocket listener.

## Non-goals

- No new user-facing feature, public API, package or runtime default.
- No modification to the 23 applied Supabase migrations and no remote schema
  deployment as part of this patch.
- No real Stripe, Storage, Queue, scanner or other provider write during local
  qualification.
- No claim that generic production recovery, observability, cache/ISR,
  streaming SSR or CRM business primitives now belong to the framework.
- No `0.44.0` feature train. A future minor still requires ADR-0140 re-entry
  evidence from a concrete cross-application requirement.

## Acceptance

1. All 12 milestone issues (#1135–#1145 and #1147) have a locked failing or
   boundary assertion and a minimal root-cause correction.
2. Public exports and package ownership remain compatible with `0.43.1`; all
   five packages and the Starter resolve one aligned `0.43.2` line.
3. Root tests, coverage, build, Chromium, Firefox and WebKit E2E,
   request-time parity, Starter, Node/Workers Nitro proofs and packed consumers
   pass on the exact release candidate.
4. Repeated runtime qualification reports no unbounded listener, file
   descriptor, timer, heap or unhandled-rejection growth.
5. Documentation, package artifacts, npm registry, tag, GitHub Release and
   immutable release evidence agree before milestone closure.
6. Publication occurs only under the maintainer's explicit 2026-08-24
   authorization.

## Verification matrix

| Boundary    | Required evidence                                                                             |
| ----------- | --------------------------------------------------------------------------------------------- |
| Node bridge | abort, close, `drain`, stream cancel, listener cleanup, keep-alive and repeated resource runs |
| Preact      | first hydration, update, real detach, same-tick move, reconnect and idempotent teardown       |
| Router      | dispose during programmatic/browser guards, redirects and rejection                           |
| Action wire | identical Hono/Nitro 422 envelopes for every unsupported value                                |
| Starter     | Stripe body limits; Notes renewal/401/origin; upload Storage/RPC/finalize failure matrix      |
| Repository  | fmt, lint, typecheck, graph, interface, docs, migrations, coverage and clean-root tests       |
| Outputs     | static freeze, Nitro Node/Workers, local and packed consumers, third-party WC and npm dry-run |
| Release     | exact-SHA main CI, five npm artifacts, dist-tag, tag, GitHub notes and closure evidence       |

## Post-v0.43.2 policy

`0.43.x` remains the active maintenance line. Compatible correctness,
security, dependency, runtime-compatibility, documentation, test and release
tooling fixes may ship as later patches. No next minor is scheduled. The
separate global-first CRM remains the primary proving ground; provider-neutral
requirements may propose framework work, while CRM domain and China-market
integration logic stays outside framework packages.
