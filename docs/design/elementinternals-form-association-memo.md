# Evaluation memo: ElementInternals form association (ADR-0123 item 14, #864)

- Date: 2026-08-03
- Status: pilot landed (`open-input`); recommendation: adopt for form-facing components
- Pilot: `packages/ui/src/open-input.tsx`, tests in `packages/ui/__tests__/components.test.ts`

## API surface

Form-associated custom elements (FACE) rest on four platform pieces:

- `static formAssociated = true` + `attachInternals()` → `ElementInternals`.
- `internals.setFormValue(value)` — the value that enters `FormData` and
  `formdata` events under the element's `name`.
- `internals.setValidity(flags, message)` — wires the element into native
  constraint validation (`:invalid`, `form.checkValidity()`, submit blocking).
- Lifecycle callbacks: `formResetCallback`, `formDisabledCallback`
  (both implemented in the pilot), `formStateRestoreCallback` (deferred — only
  matters for bfcache/autocomplete restore).
- `internals.states` (CustomStateSet) for `:state(disabled)`/`:state(invalid)`
  styling, already in use via `syncDisabledState`.

## Migration cost

Low, and the pilot proves it. The base class (`packages/element/src/
open-element-implementation.ts`) already attaches `ElementInternals` in
`connectedCallback` when `formAssociated` is set, guarded by
`typeof this.attachInternals === 'function'`. Per component the work is:
declare `formAssociated`, push values on input/attribute change, sync an
initial value on connect, sync validity, implement the two callbacks. The
`open-input` pilot touched only its own file — no base-class changes needed.

One real gap the pilot found and fixed: pre-upgrade `value` attributes fire
`attributeChangedCallback` before `connectedCallback`, so the initial value
never reached `setFormValue` and the field would submit empty. Fixed by
syncing form value + validity in `connectedCallback` after super.

## Which components should be formAssociated

- `open-input` — done (pilot). Text-like control with `name`/`value`.
- `open-button` — already `formAssociated` (submit/reset semantics, #770-era).
- `open-dropdown` — **no**: it is a trigger+panel menu with no value semantics.
  A future `open-select`/`open-checkbox`/`open-radio`/`open-switch` would be
  the next candidates, in that order.
- `open-card`, `open-callout`, `open-badge`, `open-code-block`,
  `open-dialog`, `open-tabs`, `open-theme-toggle` — **no**: not form controls.

## SSR / DSD impact

None on the render path. `ElementInternals` is client-only: SSR instantiates
the element and calls `render()`, which never touches `_internals`; DSD
payloads are unchanged. On the client, `attachInternals` runs in
`connectedCallback` after hydration/CSR decisions, guarded so environments
without it (jsdom/happy-dom-style test stubs, old engines) degrade
gracefully — every component-side use is `this._internals?.`-optional, and
`setValidity` is feature-checked. `deno test packages/ui/` (mock HTMLElement,
no `attachInternals`) stays green.

## Three-engine status (verified 2026-08-03)

- FACE: Chromium 77+, Safari 16.4+ (2023-03, webkit.org/blog/13966),
  Firefox 93+ for `ElementInternals` but **Firefox 98+** for
  `setFormValue`/`setValidity`/`internals.form` (staged rollout).
- CustomStateSet API: Chromium 90+, Safari 17.4+ (webkit.org/blog/15063),
  Firefox 126+. Caveat: the interoperable `:state()` CSS selector syntax is
  Chromium 125+; 90–124 used the legacy dashed-ident (`:--x`) syntax.
- Quirks: `setValidity`'s anchor must be a shadow-including descendant and
  validation-bubble placement is UA-dependent; calling `setValidity` without
  `formAssociated` throws. Both avoided in the pilot (no anchor; guarded).

All three engines in the supported baseline (docs/current/BROWSER_BASELINE.md)
fully support FACE + `:state()` in current stable.

## Verdict

No architectural obstacle found. Adopt FACE as the standard seam for any
future value-bearing form control; keep non-form components off it.
Follow-ups: `formStateRestoreCallback` when a restore use case appears;
real-browser FormData e2e belongs to the www/e2e Playwright suite.
