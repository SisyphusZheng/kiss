# Browser baseline

Reviewed: 2026-07-11.

OpenElement's default SSG output targets browsers with native Declarative
Shadow DOM (DSD): current stable Chromium, Firefox, and WebKit/Safari. DSD is
[Baseline 2024](https://web.dev/articles/declarative-shadow-dom); the platform
contract is the HTML `shadowrootmode` template attribute, not a framework
polyfill.

The supported behavior is verified in the Chromium, Firefox, and WebKit
Playwright projects by `www/e2e/dsd-layers.spec.ts`. The default build emits no
inline DSD fallback, so a strict CSP does not need `unsafe-inline` for DSD.

Projects that intentionally support browsers outside this baseline may opt in
to `legacyDsdPolyfill`. That fallback injects an inline script and therefore
requires an explicit compatible CSP policy; it is not supported by the default
security contract.
