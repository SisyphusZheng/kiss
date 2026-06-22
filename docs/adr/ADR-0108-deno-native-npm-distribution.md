# ADR-0108: Deno-native npm Distribution via `deno pack`

## Status

Accepted.

## Context

ADR-0107 established npm as the only required release registry for openElement
v0.41+. The original v0.41.0 plan also proposed pushing Vite+ to treat Deno as a
first-class package manager, but that upstream contribution was declined in
voidzero-dev/vite-plus#1888.

At the same time, Deno 2.8 shipped `deno pack`, a built-in command that builds a
Deno-first project into an npm-publishable tarball. This gives openElement a
path to npm-primary distribution without migrating development to Node/npm and
without depending on Vite+ upstream acceptance.

## Decision

openElement v0.41.0 distribution is **Deno-native npm distribution**:

- Development, build, test, and release tooling remain Deno-first.
- npm artifacts are produced with `deno pack`.
- npm publishing uses `npm publish --provenance` from GitHub Actions.
- JSR publish is no longer a required release exit gate; it remains available as
  historical observation only.
- Vite + Nitro remain the default engines behind the protocol boundary.

## Consequences

### Positive

- No dependency on Vite+ upstream for Deno package-manager support.
- No Node/npm workspace migration required.
- Deno 2.8 handles TypeScript transpilation, `.d.ts` generation, specifier
  rewriting, and `package.json` synthesis in one command.
- npm is the de-facto registry for the target audiences (browser tooling,
  Node/Edge runtimes, design-system consumers).

### Neutral

- `deno pack` is new; the project becomes an early adopter and must verify
  tarball output on every release.
- Build/server glue packages (`ssg`, `content`, `adapter-vite`, `create`) retain
  Deno/Node APIs; runtime-free packages must stay Web Standard.

### Negative

- `deno pack` does not synthesize `bin`, `repository`, `keywords`, `scripts`, or
  `peerDependencies`; these must be injected when needed.
- `@openelement/create` needs an explicit `bin` configuration for `npx` usage.
- Internal `@openelement/*` dependencies must be published in topological order
  because `deno pack` leaves bare workspace specifiers as bare npm names.
- Existing consumers using `jsr:@openelement/*` will need to switch to
  `npm:@openelement/*`; already published JSR versions remain available but are
  not the current line.

## Implementation Summary

1. **Toolchain**: require Deno 2.8+, convert internal imports to `npm:`, add
   `deno task pack` / `deno task publish:npm`.
2. **Boundaries**: keep `MemoryIsrCache` in `@openelement/core/isr` as the
   reference ISR cache; `FileIsrCache` and `router/page-loader` were removed
   during the architecture audit cleanup because no production code consumed
   them. Add `deno-api:check` gate for runtime-free packages.
3. **Adapter-vite**: default `ssg-package-resolver` to npm mode; JSR source
   fetch remains opt-in.
4. **Starter**: `@openelement/create` emits `npm:` imports and resolves versions
   from the npm registry.
5. **Release**: `tools/autoflow/release.ts` runs `pack:dry-run` and
   `publish:npm`; GitHub Actions uses `actions/setup-node` and
   `secrets.NPM_TOKEN` for provenance publishing.
6. **Smoke**: post-publish consumer smoke installs from npm and validates Node
   ESM, Deno `npm:`, jsDelivr browser-safe exports, and Nitro Node/Workers.

## Non-Goals

- No Node runtime migration for openElement development.
- No npm/pnpm/yarn workspace source of truth.
- No further Vite+ Deno PM upstream advocacy in v0.41.0.
- No removal of existing JSR published versions.

## Related

- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- ADR-0098: EntryDescriptor Route Manifest Contract.
- ADR-0107: npm-Only Distribution.
- docs/roadmap/ROADMAP.md
- docs/current/VERSION_PLAN.md
