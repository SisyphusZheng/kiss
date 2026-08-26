# v0.43.3 — renderer-owned light DOM hydration and robustness audit closure

> Current source package line: `v0.43.3`\
> Current npm registry line: `v0.43.3` (published 2026-08-26, dist-tag `latest`)\
> Latest landed train: `v0.43.3`\
> Active release target: `v0.43.3`\
> Next planned train: `not scheduled (maintenance mode)`\
> Planning release target: `v0.43.3` (compatible hydration correction and audit closure)\
> Current maturity stage: stable (`0.43.x`, frozen by ADR-0119, ADR-0122,
> ADR-0135 and maintained under ADR-0140)

## Objective and scope

`v0.43.3` is a compatibility-preserving correction patch over `v0.43.2`. It
amends the ADR-0092 light-mode contract via ADR-0142 so that server-rendered
light DOM is activated in place on client upgrade, and it closes the final
robustness adversarial audit of the frozen line with committed, reproducible
evidence.

The patch adds no public option, lifecycle hook, package or export, changes no
applied migration, and does not introduce a generic DOM reconciler, consumer
projection contract, session/transaction abstraction, or a new render mode.
The frozen application-loop, Universal WC, and first-mile start contracts
remain in force. The Shadow/DSD default and its behavior are unchanged.

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

- [x] #1148: `renderMode = 'light'` SSR output is the authoritative initial
      DOM; client upgrade activates matching SSR DOM in place (event, signal,
      attribute, `Show`, keyed/unkeyed `For` bindings), preserving node
      identity, focus, selection, live form values, nested custom-element
      instances, and pre-upgrade interaction targets; marker/branch mismatch
      emits the existing structured diagnostic and degrades to a clean client
      render. Light-layer hosts carry the internal `data-oe-light` provenance
      marker; nested light subtrees are pruned from a parent's marker walks;
      light roots validate the exact `data-eid` multiset (`marker-id` reason);
      the DSD-only layout fix is not scheduled for light hosts.
- [x] #1148: pre-hydration click capture/replay covers light-mode hosts with
      containment-checked, exactly-once replay (supersedes the #1067 skip).
- [x] #1152: the Node bridge observes client disconnects that predate response
      writing; the body is cancelled and listeners are cleaned up instead of
      pumping into a dead socket.
- [x] #1154: a never-settling request-body `cancel()` no longer blocks
      listener cleanup on the disconnect path.

### Robustness audit (#1146)

- [x] Six coverage areas (Node bridge, Preact, router, action wire, Starter,
      repetition/resource growth) executed to committed per-case evidence:
      `docs/audit/2026-08-26-v0.43.3-robustness-adversarial-audit.md`.
- [x] Every confirmed finding has a follow-up issue filed before its fix
      (#1152, #1154, #1153) and its evidence case flipped to PASS.
- [x] Explicit GO for the audit axis, with the safety boundary (loopback,
      in-process fixtures, local workerd only) recorded.

### External application evidence

- [x] The authoring-fitness evidence source formerly codenamed `nextCrm` is
      superseded by the Electrical Export Sales SaaS slice: two-phase
      three-browser scorecard (OE-AF-01…04) — expected-failure reproduction on
      packed `0.43.2` artifacts, then PASS on the coherent packed `0.43.3`
      candidate set (SHA-256-locked tarballs).

### Experiment (non-blocking)

- [x] #1149: Zag Vanilla + Open Props + OpenElement composition spike recorded
      (`docs/evidence/2026-08-26-zag-composition-spike.md`); per its outcome
      rules it does not unlock #1150 or any v0.44 contract.

## Non-goals

- No new user-facing feature, public API, public hook, package or runtime
  default.
- No generic DOM diff/reconciliation engine and no arbitrary light-child
  projection contract.
- No change to the default Shadow/DSD mode or its behavior.
- No modification to the 23 applied Supabase migrations and no remote schema
  deployment as part of this patch.
- No real Stripe, Supabase, Storage, Queue, scanner or other provider write
  during local qualification or audit.
- No `0.44.0` feature train. A future minor still requires ADR-0140 re-entry
  evidence from a concrete cross-application requirement.

## Acceptance

1. Milestone issues #1146, #1148 and #1149 are resolved with the evidence
   above; #1149's spike outcome is recorded without entering the GO/NO-GO
   calculation.
2. Public exports and package ownership remain compatible with `0.43.2`; all
   five packages and the Starter resolve one aligned `0.43.3` line.
3. Root tests, coverage, build, Chromium, Firefox and WebKit E2E (including
   the real SSR → delayed-upgrade light-mode path), request-time parity,
   Starter, Node/Workers Nitro proofs and packed consumers pass on the exact
   release candidate.
4. The authoring-fitness slice proves identity preservation, exactly-once
   replay and no-JS form correctness on the packed candidate in all three
   browser engines.
5. Documentation, package artifacts, npm registry, tag, GitHub Release and
   immutable release evidence agree before milestone closure.
6. Publication occurs only under the maintainer's explicit 2026-08-26
   authorization.

## Verification matrix

| Boundary    | Required evidence                                                                             |
| ----------- | --------------------------------------------------------------------------------------------- |
| Light DOM   | in-place activation identity (input/button/nested CE), focus/selection/value survival,        |
|             | exactly-once click replay, marker-id integrity, mismatch degrade, three-browser e2e,          |
|             | packed-artifact consumer scorecard (OE-AF-01…04, two-phase)                                   |
| Node bridge | abort, close, `drain`, stream cancel, listener cleanup, keep-alive and repeated resource runs |
| Preact      | first hydration over real SSR children, update, detach, same-tick move, reconnect, teardown   |
| Router      | dispose during programmatic/browser guards (history + hash), redirect chains, sync throws     |
| Action wire | identical Hono/Nitro 422 envelopes for every unsupported value on both channels               |
| Starter     | Stripe body limits; Notes renewal/401/origin/retry; upload Storage/RPC/finalize matrix        |
| Repository  | fmt, lint, typecheck, graph, interface, docs, migrations, coverage and clean-root tests       |
| Outputs     | static freeze, Nitro Node/Workers, local and packed consumers, third-party WC and npm dry-run |
| Release     | exact-SHA main CI, five npm artifacts, dist-tag, tag, GitHub notes and closure evidence       |

## Post-v0.43.3 policy

`0.43.x` remains the active maintenance line. Compatible correctness,
security, dependency, runtime-compatibility, documentation, test and release
tooling fixes may ship as later patches. No next minor is scheduled. The
Electrical Export Sales SaaS (formerly codenamed `nextCrm`) remains the
primary proving ground; provider-neutral requirements may propose framework
work, while product domain logic stays outside framework packages.
