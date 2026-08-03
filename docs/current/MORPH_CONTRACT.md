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
   `preventDefault()` skips the default morph. A network/fetch failure
   dispatches a cancelable `open:action-error` (`detail: { error, form }`)
   before the reload fallback; `preventDefault()` skips the reload.
5. Success updates the URL with `history.pushState`; `popstate` (and
   bfcache `pageshow` restores) reload the restored URL when the session
   has enhanced-navigated (a `sessionStorage` marker — no client-side
   state cache in 0.42). The local fragment is preserved when the target
   is the same page.
6. A second submit while one is in flight is ignored; cross-form
   responses are ordered by sequence.

## Fetch-channel error protocol (RFC 9457)

Programmatic action callers (`x-openelement-action: true`) receive the
`ActionResult` union for success/failure/redirect outcomes. **Error**
outcomes — the CSRF floor 403, an unknown named action 404, an unparseable
form body 400, and unexpected 500s — answer RFC 9457 Problem Details
(#863, ADR-0123 addendum item 13): content type `application/problem+json`
with the members `type` (`about:blank`), `title` (the HTTP reason phrase),
`status`, and `detail` (the specific explanation). This replaces the bespoke
`{ type: 'error', status, error: { message } }` envelope shipped in
alpha.2–alpha.12. Example, a named action that does not exist:

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{ "type": "about:blank", "title": "Not Found", "status": 404,
  "detail": "No action named \"nope\" on this route." }
```

The enhanced (`enhance`) and native channels are untouched: they keep the
equivalent semantics as full-HTML responses (403 text, 404/400 status pages,
500 error boundary), so both channels stay symmetric. The wire shape is
alpha-unfrozen; it lands on the alpha.13 train so that ADR-0122 acceptance
freezes it in this problem+json form rather than amending the freeze later.

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

- **Matching**: an ordered walk. Old children are indexed by `id` (id'd
  nodes are consumed only by an id match); each new child in order matches
  by id else structurally ahead of the reference point; the match is
  morphed and MOVED into position (moves preserve shadow roots and state);
  unmatched new nodes are inserted in place; only never-matched old nodes
  are removed. Reorders therefore keep both order and state, and rows in
  dynamic lists should carry stable `id`s.
- **DSD instantiation**: nodes inserted by a morph (new subtrees,
  replacements) have their `<template shadowrootmode>` instantiated
  manually before insertion — the HTML parser is the only other place DSD
  activates — so morphed-in islands show the server render, not a
  client-initial one. Instantiation is **recursive** (#604): a template
  nested inside another template's content is invisible to
  `querySelectorAll` (template content is a separate tree). Nested levels
  are finished **after** insertion: WebKit permanently skips upgrading an
  element that was moved into a shadow root while the subtree still
  belonged to the parser-inert document (not even
  `customElements.upgrade()` reaches it), so post-insertion the morph
  recurses into the queued shadow roots and re-inserts any still-
  unupgraded defined element, which upgrades naturally in every engine.
  Island-in-island markup is fully upgraded to the server intent.
- **Island survival**: a hydrated island (live shadow root) survives when
  its light-DOM surface serializes identically (`__islandIntact`):
  attributes equal, and child nodes equal after recursively skipping DSD
  templates and whitespace-only text on both sides. Otherwise it is
  replaced and its state resets by design.
- **`data-open-preserve`**: exempts the whole subtree, checked before
  island and attribute logic.
- **Scripts**: live `<script>` nodes are kept as-is (never re-executed;
  a changed `src` is left stale by design).
- **State-mirroring attributes**: `open` on `<details>` and `src` on
  `<video>`/`<audio>` are not synced — user state wins.
- **Form-control properties** (#603): `checked`/`value` on `<input>`,
  `value` on `<textarea>`, and `selected` on `<option>` are synced **only
  while the control still mirrors its last server-rendered state**. Once
  the user (or page script) touches the control — the live property no
  longer matches the attribute — the attribute is left alone and the live
  state wins; an untouched control follows the server render. A control
  can still be replaced outright by a structural morph, in which case the
  server-rendered state applies (same rule as every other node).
- **Focus** (#603): a morph is not a navigation. The deep active element
  is captured before the morph; if the focused control survives (matched
  or moved), focus is untouched; if it was replaced, the same-`id`
  successor in the live tree is refocused and a text selection is
  restored. Controls without an `id` that get replaced lose focus — give
  inputs stable `id`s, the same rule as dynamic-list rows.
- **Scroll** (#603): the window scroll position is captured before the
  morph and restored after it; an enhanced submit never jumps the
  viewport.
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
| Focused input keeps focus across a 422 morph                | `a focused input keeps focus across a 422 morph`                |
| Focus restored by id when the control is replaced           | `focus is restored by id when the focused control is replaced`  |
| Touched controls keep live state; untouched follow server   | `user-touched form controls keep their live state …`            |
| Window scroll survives a morph                              | `window scroll position survives an enhanced morph`             |
| Nested DSD (island-in-island) instantiated recursively      | `a morph instantiates nested DSD templates recursively`         |
| `open:ready` fires for the `load` bucket                    | `open:ready fires for the load strategy bucket`                 |
| `client:visible` island inside page DSD loads on scroll     | `client:visible island inside page DSD loads on intersection`   |

Known-uncovered cells (accepted, documented here until a later line):
island surface change resets state (by design, no e2e); nested islands;
`client:visible` island replaced before intersecting (re-observation
code shipped, no e2e); double-submit ordering (code shipped, unit-tested
in `__tests__/enhance-client.test.ts`).
