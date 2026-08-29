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
- Next public prerelease: the first coherent compiled-framework alpha

The coherent five-package distribution contract follows
[PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md) and ADR-0114. The supported server
integration remains `nitro-mount`. Required browser qualification covers
Chromium, Firefox and WebKit.

## Minimal Alpha.0 exit

Alpha.0 exists only to make parallel architecture work safe enough to begin. It
closes when:

- #1160 and #1182 remain accepted foundations;
- PR #1186 exact-SHA PR-CI/provenance machinery remains available;
- #1193 confirms that `dev` and `main` reject force-push/deletion and that lane
  work integrates only through an authorized branch/pull-request path;
- one exact common base SHA is recorded for the Alpha integration branch and
  initial lanes; and
- the accelerated topology and current execution state are merged to `dev`.

Alpha.0 does not require generic governance migration, publication authorization,
Trusted Publishing, ADR/evidence convergence, media cleanup, a publication release
closure, or a fresh release verifier. Those concerns are deliberately postponed to
Beta.3.

Alpha.0 must never be tagged, published to npm, represented by a GitHub Release,
assigned a dist-tag, promoted to `main`, or exposed as an external release.

## Parallel Alpha architecture train

Internal Alpha numbers are not serialized release boundaries. Implementation is
owned by subsystem lanes that begin from one exact base SHA and integrate serially.

| Lane                          | Scope                                                                          | Issues                                                   | First broad checkpoint |
| ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------- |
| A — Compiler / Part Program   | TSX lowering, compiler IR, Part Program generation, diagnostics                | #1161, #1162, compiler portion of #1163                  | Integration I          |
| B — Element Runtime / Signals | program execution, Parts, Regions, signals, lifecycle and cleanup              | #1164, #1165, #1166, #723, #1167                         | Integration I          |
| C — SSR / DOM Claim           | serialization, markers, existing-DOM claim, continuity and mismatch policy     | #1168, #1169, #1170                                      | Integration I          |
| D — App / Islands / Delivery  | Island delivery, Vite/application integration, Nitro/server and real consumers | #1088, #1171, #1172, #1173, application portion of #1163 | Integration II         |

Lane D may inspect paths and prepare contract-level fixtures before Integration I,
but broad implementation waits for the first compiler/runtime/SSR vertical path.

### Integration I

One shared Part Program proves source-to-compiler-to-server HTML, fresh browser DOM,
and existing-DOM claim. A Signal update changes only its subscribed Part or Region.

### Integration II

The coherent path reaches authoring, compiler, Element execution, SSR, claim,
signals, islands, Vite, Nitro/server and a real application consumer.

### Final Alpha

#1174 removes superseded primary paths only after replacement proof. #1175 qualifies
interoperability. #1176 and #1181 qualify performance, packed consumers, supported
browsers/runtimes and the coherent compiled framework. Public alpha numbering is
assigned only to meaningful integration candidates; eight npm alpha releases are
not required.

## Product qualification and hardening

| Phase  | Responsibility                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Beta.1 | #1150 qualifies the UI system on the compiled framework                                               |
| Beta.2 | #1157, #1158, #1159 and #1177 qualify content, API metadata and the real website                      |
| Beta.3 | #1192 with #1156, #1187, #1188 and #1189 hardens governance, repository truth, assets and publication |
| RC     | #1178 admits the exact candidate for independent real-product qualification                           |
| Stable | Explicit approval after the complete framework/UI/website/hardening/product ladder                    |

Beta.3 owns the mature-tool migration, compact durable evidence, ADR/current-doc
convergence, source-tree/media cleanup, final branch/release rules, publication
authorization, npm Trusted Publishing/OIDC and release provenance. It must not become
another architecture-development phase.

At real publication boundaries, implementer/release-verifier/thinker GO remains
mandatory. The only prerelease human promotion stop is #1178 RC admission. Internal
lane work and Integration I/II do not perform publication release closure.

`final alpha → beta.1 UI → beta.2 website → beta.3 hardening → RC product → Stable`

Breaking architecture or framework public-surface changes after Final Alpha return
the train to Alpha. `latest` remains on stable 0.43.x until an explicitly approved
0.44 Stable release.
