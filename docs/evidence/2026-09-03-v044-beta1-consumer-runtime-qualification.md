# Beta.1 qualification — clean clone, packed consumer and supported runtimes (issue #1224)

Bounded qualification packet B1.3 (stage #1150, umbrella #1155). Every cell was
executed against the exact base SHA
`18778c9553eb9faeb727887b122db1a820f38b80` (`dev`), on macOS arm64 (Apple M2),
Deno 2.9.0, Node v24.18.0, Node v20.20.2 (negative-floor leg only), Bun 1.4.0,
Playwright 1.59.1 (Chromium/Firefox/WebKit). The public surface is the frozen
one from B1.2 (#1223, `docs/current/PACKAGE_SURFACE.md`).

## Headline result

The matrix does not fully pass. One real product defect was proven from the
exact packed/build artifacts and is recorded below as a blocking finding
(B1.3-F1). Per the packet boundary it is reported, not fixed. All other cells
pass. No unsupported runtime/version doc claims were found: every runtime claim
in current docs was matched by positive evidence at this SHA, so no doc-truth
edits were required.

## Matrix

| Cell                                   | Command (at `18778c95`)                                                                                                      | Exit         | Result                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean clone install                    | `git clone file://<repo> /tmp/b13-clean-clone && git checkout 18778c95… && deno install`                                     | 0            | clean tree at exact SHA; dependencies installed                                                                                               |
| Clean clone test                       | `deno task test` (in clone)                                                                                                  | 0            | 1731 passed (105 steps), 0 failed, 1 ignored + supabase starter 150/150                                                                       |
| Clean clone build                      | `deno task build` (in clone)                                                                                                 | 0            | www build, pagefind 150 pages, artifact truth passed                                                                                          |
| Pack                                   | `deno task pack:dry-run`                                                                                                     | 0            | 5 tarballs @ 0.43.3 (element, app, adapter-vite, ui, create)                                                                                  |
| Artifact check                         | `deno task package-artifacts:check`                                                                                          | 0            | artifact checks passed for 5 packages                                                                                                         |
| Packed consumer                        | `deno task consumer:packaged`                                                                                                | 0            | packed starter typecheck + SSG build + import-map smoke passed                                                                                |
| Node 24 serve                          | `deno task fixture:request-time:build`, nitro-mount shim (CI recipe), `node dist/server/serve.mjs`, curl `/` and `/live`     | 0            | both routes 200 with expected content (Node v24.18.0)                                                                                         |
| Node 20 floor                          | same artifact under Node v20.20.2                                                                                            | 1 (expected) | clean early exit with `requires a runtime with WHATWG URLPattern: Node.js >= 24, Deno, or Bun` — negative floor only, not a supported version |
| Deno serve                             | `deno run -A dist/server/serve.mjs` (Deno 2.9.0)                                                                             | 0            | `/` and `/live` 200 with expected content                                                                                                     |
| Bun serve                              | `bun dist/server/serve.mjs` (Bun 1.4.0)                                                                                      | 0            | `/` and `/live` 200 with expected content — first positive Bun evidence at this SHA; there is no CI Bun leg                                   |
| www build                              | `deno task build`                                                                                                            | 0            | pagefind 150 pages, www artifact truth passed                                                                                                 |
| Chromium full e2e                      | `deno task test:e2e`                                                                                                         | 1            | 167 passed, 4 failed — exactly the known local-only visual-baseline drift (see exceptions)                                                    |
| Firefox smoke                          | `deno task test:e2e:browser-smoke -- --project=firefox`                                                                      | 0            | 24 passed                                                                                                                                     |
| WebKit smoke                           | `deno task test:e2e:browser-smoke -- --project=webkit`                                                                       | 0            | 24 passed                                                                                                                                     |
| Request-time fixture, 3 engines        | `deno task fixture:request-time:e2e:browsers`                                                                                | 0            | 213 passed                                                                                                                                    |
| Hono dev server                        | `deno task www:dev-smoke`                                                                                                    | 0            | `/`, `/docs`, `/changelog` served by the dev server                                                                                           |
| Starter dev (HMR)                      | `deno task test:starter-smoke:dev`                                                                                           | 0            | 3 passed (island client entry, island hydration, route-edit invalidation)                                                                     |
| Starter production smoke               | `deno task test:starter-smoke`                                                                                               | 0            | 10 passed, 2 skipped (cli/start.ts serving built dist)                                                                                        |
| Nitro node output                      | `deno task nitro:proof:node`                                                                                                 | 0            | real Nitro node-server output passed                                                                                                          |
| Nitro workers output                   | `deno task nitro:proof:workers`                                                                                              | 0            | real Nitro cloudflare-module output passed                                                                                                    |
| Cloudflare config                      | `deno task fullstack:cloudflare-config-check`                                                                                | 0            | wrangler dry-run passed                                                                                                                       |
| Supabase starter serving qualification | `deno task fullstack:workspace-qualification`                                                                                | 1            | **FAIL — blocking finding B1.3-F1 below**                                                                                                     |
| Desktop examples (known exception)     | `deno run -A --config ../../deno.json npm:vite build` in `examples/deno-desktop-reader` and `examples/deno-desktop-mastodon` | 1 (expected) | fails closed OEC9008 on route modules — the recorded exception deferred to B2.5/B3.8; not consumer evidence                                   |

## Blocking finding B1.3-F1: route-tag mismatch 500s on the Supabase starter's request-time routes

`deno task fullstack:workspace-qualification` fails deterministically at the
base SHA: the generated `dist/server` (real build output of
`examples/supabase-cloudflare-starter`) returns HTTP 500 for
`/workspace-records`, `/magic-link` and `/reset-password` on both the Node
standalone server (`serve.mjs` under Node v24.18.0) and the Nitro Workers
output (Wrangler 4.123.0 local workerd).

Server-side error (captured from the real server output):

```text
OpenElementError: [openElement] renderDsd tag "workspace-records" does not
match the compiled program tag "workspace-records-page".
code: 'OE_PROGRAM_MISSING', phase: 'ssr'
```

Root cause shape (diagnosis only, no fix attempted): the v0.44 entry codegen
registers and renders `definePage` routes under the path-derived tag
(`fileToTagName`, e.g. route file `workspace-records.tsx` → `workspace-records`;
see `packages/adapter-vite/src/internal/ssg/route-scanner.ts:247-320` and
`entry-route-helpers.ts:10`), while the page element's compiled Part Program
carries the decorator tag (`@element('workspace-records-page')`). The 0.44
serializer fails closed when the requested tag differs from the compiled
program tag. Routes whose file-derived tag equals the element tag (`/`,
`/login`, all www routes) serve correctly — which is why www build/e2e and the
request-time fixture stay green.

Reproduction at the base SHA:

```sh
deno task fullstack:workspace-qualification   # exit 1: node-standalone first page returned 500
```

- Reproduced identically in a pristine clone at `18778c95` (exit 1).
- Also reproduces at `569b2c82` (pre-B1.1-remediation), so the defect predates
  the F1–F3 remediation merged at the base SHA.
- The task is not currently a leg of the `autoflow:ci` gate
  (`tools/autoflow/policy.ts`), so the failure was not caught by CI.
- Manual probe of the built server (Node): `/` → 200, `/login` → 200,
  `/magic-link` → 500, `/reset-password` → 500, `/workspace-records` → 500.

Disposition per packet boundary: this is a real product defect proven from the
exact artifacts; it is reported here for a thinker-authored repair packet. No
product code was changed in B1.3.

## Runtime support adjudication (doc claims vs evidence at this SHA)

- **Node 24+** for generated `dist/server`: positive evidence locally (fixture
  `serve.mjs` serves `/` and `/live`) and in CI (`node-serve-smoke`, Node 24
  leg). Claim stands.
- **Node 20** is only ever documented as the negative floor: verified clean
  early exit with guidance (exit 1, URLPattern message). Node 20 is **not** a
  supported version and no doc claims otherwise. No other Node version has any
  positive evidence; none is claimed in current docs.
- **Deno** (2.9.0, pinned by `.dvmrc`): `serve.mjs` boots under `deno run -A`
  and serves both probe routes; in-repo `serve-entry`/`node-bridge` suites
  exercise the same path. Claim stands.
- **Bun**: claimed by `www/content/guide/deployment.md` (+ zh),
  `docs/current/PACKAGE_SURFACE.md` and the README. Newly evidenced here: Bun
  1.4.0 boots the exact built `serve.mjs` and serves `/` and `/live` (200,
  expected content). Claim stands; note there is no CI Bun leg, so this
  evidence is local-only at this SHA.
- **Browsers**: Chromium full suite green except the known local-only visual
  drift; Firefox and WebKit smoke subsets green; request-time fixture green on
  all three engines. Matches `docs/current/BROWSER_BASELINE.md`.
- **Hono/Nitro/edge**: dev server (Hono), production server (`cli/start.ts` /
  generated `serve.mjs`), Nitro node-server and cloudflare-module outputs all
  proven by the tasks above. Caveat: the Nitro/workerd proof fixtures pass, but
  the Supabase starter's request-time routes currently 500 on both deployment
  runtimes due to B1.3-F1 — the edge/Node deployment _mechanism_ is proven, the
  starter's _pages_ are blocked by the defect.
- **Desktop examples**: fail closed OEC9008 on full vite build at this SHA
  (reader: 5 OEC9008 diagnostics, mastodon: 4) — the recorded exception,
  deferred to B2.5/B3.8; not consumer evidence.

## Known local-only exception (recorded, not chased)

`deno task test:e2e` (chromium): 167 passed, 4 failed — the failures are
exactly the committed known risk: visual-baseline local drift on
architecture-islands-deep mobile (`visual-baselines.spec.ts:72`, en/zh ×
dark/light), deterministic ~19.3–19.5k px diff at ratio 0.06, identical across
retries. Same suite is green in CI. Unchanged from the Alpha.10 closure record.

## Transient observation (not a defect)

The first clean-clone `deno task test` run exited 139 (SIGSEGV-class abort)
mid-suite while `package-artifacts:check` and `consumer:packaged` were running
concurrently on the same machine. Re-run alone in the same clone: exit 0,
1731 + 150 passed, 0 failed. Recorded as a resource-contention transient; no
product signal.

## Commands and exit codes (this qualification, at `18778c95`)

- `git clone file://$PWD /tmp/b13-clean-clone && git checkout 18778c95…` → clean tree, exit 0
- clone: `deno install` → 0; `deno task test` → 139 under concurrent load, then 0 alone (1731 passed, 0 failed, 1 ignored; supabase starter 150/150); `deno task build` → 0
- `deno task pack:dry-run` → 0 (5 tarballs @ 0.43.3)
- `deno task package-artifacts:check` → 0
- `deno task consumer:packaged` → 0
- `deno task fixture:request-time:build` → 0
- Node v24.18.0 `node dist/server/serve.mjs` + curl `/`, `/live` → 200/200 (exit 0)
- Node v20.20.2 `node dist/server/serve.mjs` → exit 1 with URLPattern floor guidance (expected)
- Deno 2.9.0 `deno run -A dist/server/serve.mjs` + curl `/`, `/live` → 200/200 (exit 0)
- Bun 1.4.0 `bun dist/server/serve.mjs` + curl `/`, `/live` → 200/200 (exit 0)
- `deno task build` (www) → 0
- `deno task test:e2e` → 1 (167 passed, 4 known local-only visual drift failures)
- browser-smoke `--project=firefox` → 0 (24 passed); `--project=webkit` → 0 (24 passed)
- `deno task fixture:request-time:e2e:browsers` → 0 (213 passed)
- `deno task www:dev-smoke` → 0; `deno task test:starter-smoke:dev` → 0 (3 passed); `deno task test:starter-smoke` → 0 (10 passed, 2 skipped)
- `deno task nitro:proof:node` → 0; `deno task nitro:proof:workers` → 0; `deno task fullstack:cloudflare-config-check` → 0
- `deno task fullstack:workspace-qualification` → 1 (B1.3-F1; reproduced in pristine clone at `18778c95` and at `569b2c82`)
- desktop `npm:vite build` (reader, mastodon) → 1, OEC9008 (known exception)

This packet does not close #1224.
