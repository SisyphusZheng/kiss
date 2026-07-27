# Morph Continuity Contract

> Status: unfrozen 0.42-line semantics (ADR-0120 rule 6, amended by ADR-0121).
> The wire/attribute surface described here is the contract; the matching
> algorithm is implementation detail and may improve without notice.
> Introduced: 0.42.0-alpha.3 (broken, see below). Functional since:
> 0.42.0-alpha.5.

`data-open-enhance` forms submit via `fetch` and the returned document is
morphed into the live tree. Without JavaScript the same form is a native
POST, so behavior degrades to the browser by construction.

Alpha.3–alpha.4 shipped a document-level submit listener that never fired:
page content lives inside page-element DSD shadow roots and the `submit`
event is not reliably composed, so the enhancement was inert and every
"enhanced" page was silently using the native path. ADR-0121 rewrites the
client around two structural facts: submit listeners attach to every shadow
root, and the morph descends into shadow trees (the incoming document
carries a host's shadow content in its `<template shadowrootmode>` child).

## Enhancement flow

1. Submit intercepted at the form's root (document or shadow root); GET
   forms are never intercepted.
2. POST with header `x-openelement-action: enhance`; the body is the
   native body (`new FormData(form, submitter)` — the submitter's
   name/value included; ADR-0120 rule 2).
3. Only `200`/`422` responses with `text/html` are morphed. Anything else
   (500, empty, non-HTML) navigates to the response URL. Network failure
   reloads. Cross-origin targets always navigate (`location.assign`,
   never `pushState`).
4. A `422` dispatches a cancelable `open:action-failure` `CustomEvent` on
   the form (`detail: { status, form, response }`) before morphing;
   `preventDefault()` skips the default morph.
5. Success updates the URL with `history.pushState`; `popstate` reloads
   the restored URL (no client-side state cache in 0.42). The local
   fragment is preserved when the target is the same page.
6. A second submit while one is in flight is ignored; cross-form
   responses are ordered by sequence.

## Morph scope

| Scope                                 | Selected by                                                  |
| ------------------------------------- | ------------------------------------------------------------ |
| Named region                          | `data-open-region-target="name"` on submitter (wins) or form |
| Nearest ancestor `[data-open-region]` | default when the attribute is absent                         |
| Whole body                            | no region involved                                           |

A scope missing on either side (live document or incoming document) is a
full navigation, never a silent full-body morph. Non-targeted regions are
never touched.

## Identity and survival rules

- **Matching**: within a parent, children with an `id` match by `id`
  (tag must match); the rest match structurally (node type + tag) with a
  bounded lookahead, so insertions/removals between matched anchors are
  preserved. Rows in dynamic lists should carry stable `id`s.
- **Island survival**: a hydrated island (live shadow root) survives when
  its light-DOM surface serializes identically (`__islandIntact`):
  attributes equal, and child nodes equal after skipping the DSD template
  and whitespace-only text. Otherwise it is replaced and its state resets
  by design.
- **`data-open-preserve`**: exempts the whole subtree, checked before
  island and attribute logic.
- **Scripts**: live `<script>` nodes are kept as-is (never re-executed;
  a changed `src` is left stale by design).
- **State-mirroring attributes**: `open` on `<details>` and `src` on
  `<video>`/`<audio>` are not synced — user state wins.
- **`client:only` and light-DOM islands** have no shadow root and are
  never survival candidates; wrap them in `data-open-preserve` to keep
  their state.

## Survival matrix (documented and tested, TP-4)

Every cell is pinned by the request-time fixture e2e (three engines):
`packages/adapter-vite/__fixtures__/request-time/e2e/live.spec.ts`.

| Cell                                                        | Pinned by                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| Island outside the change survives a 422 morph              | `422 morph keeps a hydrated island alive …`                     |
| Island outside the change survives a PRG morph              | `PRG morph preserves island state and updates the URL`          |
| Island state proves the enhanced path (not a native reload) | `enhanced submit morphs the PRG target …`                       |
| Region-scoped morph touches only the region                 | `region-scoped morph updates only the region …`                 |
| `data-open-preserve` subtree inside the morphed region      | `data-open-preserve exempts a subtree …`                        |
| Missing region target                                       | `a missing region target falls back to a full navigation`       |
| `popstate` after PRG                                        | `back after an enhanced PRG reloads the restored URL`           |
| `open:action-failure` cancelable                            | `open:action-failure is cancelable and skips the default morph` |
| 500 response navigates, never morphs into the page          | `a 500 response navigates instead of morphing …`                |
| Fragment preserved on same-page morph                       | `the URL fragment survives a 422 morph`                         |
| id-keyed islands survive a list prepend                     | `id-keyed islands survive a list prepend`                       |
| Whitespace-only text around the DSD template                | covered by all survival cells (alpha.4 fix)                     |

Known-uncovered cells (accepted, documented here until a later line):
island surface change resets state (by design, no e2e); nested islands;
`client:visible` island replaced before intersecting (re-observation
code shipped, no e2e); double-submit ordering (code shipped, no e2e).
