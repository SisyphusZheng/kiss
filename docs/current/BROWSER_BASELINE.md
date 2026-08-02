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
(`test:e2e:firefox-smoke`, `test:e2e:webkit-smoke`) on Firefox and WebKit. The
default build emits no inline DSD fallback, so a strict CSP does not need
`unsafe-inline` for DSD.

There is no framework DSD polyfill: browsers without native `shadowrootmode`
support are outside the supported baseline, and OpenElement host components
fall back to their light-DOM/hydration paths only where the component itself
provides one.
