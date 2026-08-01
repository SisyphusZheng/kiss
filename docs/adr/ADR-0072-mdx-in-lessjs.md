# ADR-0072: MDX in LessJS

Status: Implemented
Date: 2026-06-02
Target: v0.28.3

> Numbering collision: shares ADR-0072 with
> [ADR-0072-unified-render-api-surface.md](./ADR-0072-unified-render-api-surface.md) —
> they are different decisions, both retained; cite by filename.

## Context

LessJS already has one server rendering path: component output becomes a VNode
tree or string, then `renderDsd()` produces Declarative Shadow DOM HTML. MDX
should not create a second HTML-only content pipeline.

## Decision

MDX support is build-time only. `@openelement/content/mdx` wraps `@mdx-js/mdx` and
compiles `.mdx` source to JSX using `@openelement/core` as `jsxImportSource`.
`@openelement/adapter-vite` exposes `mdxPlugin()` and includes it in the default
LessJS Vite plugin stack, so `.mdx` files can be imported by routes or content
modules.

The resulting JSX is rendered through the existing LessJS JSX runtime and DSD
renderer. MDX-authored custom elements and `client:*` attributes therefore use
the same island and hydration behavior as `.tsx` routes.

## Consequences

- MDX does not run a parser in the browser.
- MDX output remains compatible with `renderDsd()` and the VNode traversal.
- React-style provider semantics are intentionally not included.
- Custom remark and rehype plugin configuration is deferred until after v1.0.

## Implementation

- `packages/content/src/mdx/compile.ts`
- `packages/adapter-vite/src/plugin-mdx.ts`
- `www/app/routes/guide/mdx.tsx`
- `www/content/mdx/example.mdx`
