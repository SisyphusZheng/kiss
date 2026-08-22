---
title: 'Island Deep Dive'
lede: 'Islands are the only client JavaScript units in openElement. The public model is VNode output plus JSX event handlers; SSR props are restored separately.'
order: 50
---

## Upgrade Model

openElement uses the browser Custom Element upgrade mechanism. SSG writes HTML first, then the client entry imports only the island modules used by the current page.

## Three Layers

### Layer 1 — `dsd-static` — No client JavaScript

Static Web Components render as DSD during SSG. They remain visible and styled even when no client module runs.

### Layer 2 — `dsd-interactive` — DSD plus VNode event hydration

The server emits DSD and VNode event markers. On upgrade, OpenElement hydrates those markers to JSX handlers. There is no string method lookup and no `data-on-*` event binding.

### Layer 3 — `pure-island` — Client-owned shadow root

Browser-only components can opt out of SSR with the `only` strategy. The server emits the host tag and `data-ssr-props`; the client owns rendering.

## Strategies

- `load` — Import immediately for first-paint controls such as navigation and theme.
- `idle` — Import during idle time for non-critical interactive components.
- `visible` — Import when the island approaches the viewport.
- `only` — Skip SSR for browser-only components that cannot produce reliable DSD.

## SSR Props Are Not Events

`bindSsrProps()` restores `data-ssr-props` into the upgraded element. It does not bind DOM events. Events are owned by VNode markers generated from JSX handlers.

## Dynamic Content

Dynamic island content should return VNode or VNode arrays. HTML injection stays behind the explicit `trustedHtml` boundary for pre-sanitized, non-interactive content only.
