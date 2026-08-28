# v0.44 version plan

OpenElement = Web Components-native fullstack application framework.

The published stable line remains `v0.43.3`. The active target is an unpublished
`v0.44.0-alpha.0` internal integration baseline on `dev`.

- Repository package line: `v0.43.3`
- npm registry line: `v0.43.3`
- Current source package line: `v0.43.3`
- Current npm registry line: `v0.43.3`
- Latest landed train: `v0.43.3`
- Active release target: `v0.44.0-alpha.0`
- Next planned train: `v0.44.0-alpha.1`

The coherent five-package distribution contract follows
[PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md) and ADR-0114. The supported server
integration remains `nitro-mount`. Browser qualification covers Chromium, Firefox,
and WebKit.

Required browser matrix: Chromium, Firefox and WebKit.

## Alpha.0 exit

Alpha.0 closes only when one exact candidate SHA has:

- accepted #1160 and #1182 foundations;
- direct mature-tool governance offload and deletion of replaced machinery
  (#1156);
- machine-enforced unanimous closure evidence, npm Trusted Publishing/OIDC
  readiness, and active `dev`/`main` protection (#1187);
- canonical current architecture, ADR/evidence migration manifests, and GitHub
  operational truth (#1188);
- immutable media and minimal offline fixture/visual-baseline state, or an exact
  external-authority blocker recorded for the unavailable portion (#1189);
- successful authoritative pull-request CI for the exact SHA;
- explicit implementer GO, fresh release-verifier GO, and thinker GO bound to
  that SHA; and
- integration to `dev` through the authorized pull-request path.

Alpha.0 must never be tagged, published to npm, represented by a GitHub Release,
assigned a dist-tag, promoted to `main`, or used to begin Alpha.1 implementation.
Its release closure is internal and requires implementer/release-verifier/thinker GO.

## Later release train

Alpha.1-Alpha.6 build compiler/runtime/rendering/app foundations. Alpha.7 closes
migration and ecosystem work, including #1157 and #1158. Alpha.8 qualifies the
final-alpha framework. Beta.1 qualifies UI. Beta.2 qualifies the website and
#1159. RC requires coherent exact public artifacts and independent product
qualification. Stable requires explicit approval after the complete ladder.

`final alpha → beta.1 UI → beta.2 website → RC product → Stable`

The only prerelease human promotion stop is #1178 RC admission;
that later rule does not authorize work beyond Alpha.0 in this goal.

Breaking architecture or framework public-surface changes after final alpha
return the train to alpha. `latest` remains on stable 0.43.x until an explicitly
approved 0.44 stable release.
