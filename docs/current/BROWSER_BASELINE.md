# Browser baseline

Reviewed: 2026-07-11.

OpenElement's default SSG output targets browsers with native Declarative
Shadow DOM (DSD): current stable Chromium, Firefox, and WebKit/Safari. DSD is
[Baseline 2024](https://web.dev/articles/declarative-shadow-dom); the platform
contract is the HTML `shadowrootmode` template attribute, not a framework
polyfill.

The supported behavior is verified in the Chromium, Firefox, and WebKit
Playwright projects by `www/e2e/dsd-layers.spec.ts`. CI runs the full E2E suite
on Chromium and the DSD/island-hydration/theme smoke subset
(`test:e2e:browser-smoke firefox`, `test:e2e:browser-smoke webkit`) on Firefox
and WebKit. The
default build emits no inline DSD fallback, so a strict CSP does not need
`unsafe-inline` for DSD.

There is no framework DSD polyfill: browsers without native `shadowrootmode`
support are outside the supported baseline, and OpenElement host components
fall back to their light-DOM/hydration paths only where the component itself
provides one.

## Popover and CSS Anchor Positioning (#865)

Checked 2026-08-03 against the gated engines (Chromium 147, Firefox 148,
WebKit 26.4, via Playwright smoke): the Popover API (`popover` attribute,
`togglePopover()`, `:popover-open`, top layer, light dismiss) and CSS Anchor
Positioning (`anchor-name`/`position-anchor`/`anchor()`) are supported in all
three. `open-dropdown` therefore carries no fallback path: the content element
is a native `popover='auto'` and placement relies on anchor positioning, with
only a static `inset` declaration retained as the out-of-baseline degradation
(and as the explicit inset Firefox's anchor resolution requires). Browsers
older than the gated stable line are outside the supported baseline.
