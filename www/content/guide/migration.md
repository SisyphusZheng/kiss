---
title: 'Migrating to 0.41.0'
lede: 'Every breaking change since 0.40.x, grouped by the version that shipped it.'
order: 75
---

## 0.41.x → 0.42 (alpha)

The 0.42 alpha line adds request-time surfaces — loaders, actions, progressive-enhancement forms, redirects and Nitro server output. Static-first sites upgrade at zero cost: the frozen 0.41 surface has no breaking change. Full TP-6 migration notes ship with 0.42.0 stable (ADR-0122 proposed).

## From 0.40.x

The consumer graph is five packages; `core`/`signal`/`router`/`protocol`/`content`/`ssg` are retired. Author with `defineElement`/`definePage`/`defineApp` and build with `buildApp()`. `defineLayout` is removed; distribution is npm-first.

## Alpha.17–19

Build helpers moved to `element/build-utils`; router types left the app root; `renderIntent.streaming` was removed; dynamic 500s fail builds by default; star-seam types (`SafeHtml`/`UnsafeHtml`/`StyleSheetRule`) left the element root; ui controls are squared (`radius-1`).

## The 0.41.0 freeze

Adapter-vite internal subpaths (`app-vite`, `build-context`, `head-injection`, `i18n-plugin`, `plugin`, `generated-data-resolver`, `plugin-mdx`, `route-manifest`, `cli/build-client`, `cli/build-ssg`) were pruned. Use the root, `nitro-mount`, `cli/build` and `sitemap`.

## Verify after upgrading

Reinstall frozen, rebuild, and grep for removed imports: `renderIntent.streaming`, `open-element-render`, `open-element-hydration`, `app-vite`, `SafeHtml`, `*TagName`. Re-record visual baselines after the ui geometry change.

The complete entry-by-entry guide with before/after imports lives in [docs/release/v0.41.0-migration.md](https://github.com/open-element/openelement/blob/main/docs/release/v0.41.0-migration.md).
