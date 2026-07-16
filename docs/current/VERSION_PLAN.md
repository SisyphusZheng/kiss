# v0.41.0-alpha.14 — current source truth

> Current source package line: `v0.41.0-alpha.14`\
> Current npm registry line: `v0.41.0-alpha.14`\
> Active release target: `v0.41.0-alpha.14` closure complete\
> Current maturity stage: alpha

## Current release

`v0.41.0-alpha.14` is the current source and published package line. All five
packages are published at the same version and the npm `alpha` dist-tag points
to that version. The published starter uses exact OpenElement package versions,
including the Element JSX runtime and development runtime subpaths.

Alpha.13 completed the implementation train but failed its post-publish starter
gate because caret prerelease ranges could resolve to the later beta package
line. Alpha.14 republished the corrected immutable artifacts and passed the
published Deno, Node ESM, starter, Nitro, third-party Web Component and jsDelivr
consumer matrix.

## Release evidence

- Release plan: [`v0.41.0-alpha.14-plan.md`](../release/v0.41.0-alpha.14-plan.md)
- Completed AutoFlow evidence:
  [`v0.41.0-alpha.14.json`](../release/autoflow3/v0.41.0-alpha.14.json)
- Release note: [`v0.41.0-alpha.14.md`](../release/v0.41.0-alpha.14.md)
- Alpha.13 implementation debt ledger:
  [`v0.41.0-alpha.13-debt-evidence.md`](../release/v0.41.0-alpha.13-debt-evidence.md)

The immutable alpha.14 tag contains the in-progress evidence snapshot created
during publication. Commit `cf81854278f6bb6b240f4fca5a735f9de1fcf23e`
contains the completed evidence for the same release ID. The repository gate
checks their ID, ancestry, version and final step status.

## Product truth

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
authoring = JSX + Basic Element
rendering = DSD/shadow default + explicit light DOM
interactivity = selective element upgrade
official build path = Vite + Nitro
```

The current consumer graph contains `element`, `app`, `adapter-vite`, `create`
and optional `ui`. No stable `0.41.0` compatibility commitment is implied.
The authoritative five-package contract is [`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md),
and alpha naming remains governed by [`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).

## Continuing constraints

- The external adopter pilot #390 remains required before a stability commitment.
- Release qualification retains the Chromium, Firefox and WebKit functional matrix.
- `nitro-mount` remains the supported deployment seam for the official Vite/Nitro path.

## Next work

The release train is closed. Future work starts from the external adopter pilot
and the roadmap; it must not reopen or rewrite alpha.14 evidence.
