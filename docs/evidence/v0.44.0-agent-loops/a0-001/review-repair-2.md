# Reviewer decision — a0-001 repair-2

```yaml
loopId: a0-001-repair-2
issue: 1160
baseSha: 4e1c322df76849846c8254946515e2575c758255
failedCiRun: 33071761401
decision: GO
scope: ci-repair-only
```

## Decision

GO. The repair removes exactly the lint and architecture-contract failures from the failed
candidate run without changing the public surface or narrowing property-sink semantics.
The initially proposed non-input restriction was rejected before acceptance and removed.

## Reviewed diff

- The fixture button receives the required non-submitting `type` attribute and the frozen
  program/SSR evidence changes deterministically with it.
- Program validation returns a newly constructed validated value instead of laundering the
  original input through a double assertion.
- DOM property writes use one local structural view while remaining generic for every
  element target admitted by the compiled program.
- A focused negative step preserves fail-closed part-index and version validation.
- No public export, package configuration, allowlist, suppression, compatibility path,
  workspace alias, private cross-package import, fallback renderer, or weakened assertion
  was introduced.

## Independent verification

| Command                                   | Exit | Result                       |
| ----------------------------------------- | ---: | ---------------------------- |
| focused adapter compiled-spike test       |    0 | 4 passed, 13 steps           |
| focused element compiled-spike test       |    0 | 2 passed, 11 steps           |
| `deno lint`                               |    0 | 723 files                    |
| `deno task arch:check`                    |    0 | architecture contract passed |
| `deno task typecheck`                     |    0 | package graph passed         |
| `deno task fmt:check`                     |    0 | 1322 files                   |
| full adapter tests                        |    0 | 638 passed, 71 steps         |
| full element tests                        |    0 | 294 passed, 11 steps         |
| implementer `deno task autoflow:ci` retry |    0 | 48 selected gates passed     |

The first full-matrix attempt failed only while downloading `js-yaml` from the npm registry
for the Wrangler dry run (`error reading a body from connection`). The unchanged retry
passed all 48 gates. This is retained as network-flake evidence, not treated as a product
failure or a reason to weaken the gate.

## Release-boundary note

This accepts the #1160 repair only. `alpha.0` is an internal integration baseline rather
than an independently published version, so this decision is not a release promotion.
