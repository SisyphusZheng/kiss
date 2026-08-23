# ADR-0136: Content Collections — Generalize the Blog Content Pipeline

- Status: ACCEPTED (implemented for v0.43.1; tracked in #1087)
- Date: 2026-08-22
- References: ADR-0018 (virtual data modules → write-to-disk generated
  modules), ADR-0126 (sanitize-html allow-list), ADR-0135 (0.43.0 stable
  scope freeze; the follow-up was pulled into the v0.43.1 hardening train)

## Context

`createBlogPlugin` (`packages/adapter-vite/src/internal/content/blog/`) is a
content pipeline hardcoded to the blog use case: scan a Markdown directory →
gray-matter frontmatter → marked → sanitize-html allow-list → write
`app/data/_generated-blog-data.ts`, with dev watch + regenerate. The
frontmatter schema (`title/date/tags/excerpt/type/draft`) and the output
filename are fixed.

The www guide section needed a second instance of the same pattern: 15 guide
pages moved from a card-grid TSX shell (bilingual content records as string
literals) to linear Markdown-authored articles rendered like blog posts.
The guide pipeline first shipped as a www-local pilot,
`www/build-content-data.ts`, which deliberately duplicated the blog pipeline,
including the ADR-0126 sanitizer. The v0.43.1 hardening train retired that
pilot before the security-relevant allow-lists could drift.

Every static-first framework that survived grew this capability (Astro
Content Collections / Content Layer API is the closest analogue; Nuxt
Content is a much larger query-CMS scope; Contentlayer is unmaintained — a
scope caution). The blog plugin being 80% of a collection system already is
the internal evidence that the need is real.

## Decision

1. **Generic collections config in `@openelement/adapter-vite`.**
   `openElement({ content: { collections: Record<string, CollectionOptions> } })`
   with `CollectionOptions = { contentDir, basePath?, schema? }`. One
   `createCollectionPlugin(name, options)` factory replaces the blog-specific
   plugin; each collection writes `app/data/_generated-{name}-data.ts`
   (ADR-0018 write-to-disk pattern, fail-closed per SOP-001).
2. **Blog migrates onto the abstraction.** `content.blog` desugars to a
   `blog` collection with identical behavior; the acceptance test of the
   abstraction is that the existing blog pipeline is re-expressible through
   it with zero output change. An abstraction that cannot express its own
   origin is a false abstraction.
3. **The www guide collection is the second consumer.** The www pilot
   (`www/build-content-data.ts`) is deleted and `content/guide/` plus
   `content/architecture/` move to named collections. The pilot's filename
   convention (`slug.<locale>.md`) is retained as data for the follow-up
   i18n ADR, not enshrined by this one.
4. **Out of scope — separate ADRs, do not bundle:**
   - Nav merging for content-backed dynamic routes (today a `[slug]` route
     cannot contribute per-item nav entries; guide keeps thin route shells
     with `export const meta` until that ADR lands).
   - Content-level i18n pairing conventions (locale-suffixed files,
     fallback order, translation-completeness reporting).
5. **Non-goals:** query CMS features (Nuxt Content), content-driven routing
   (VitePress), pluggable content loaders (Astro Content Layer). A
   collection is a directory of Markdown with a frontmatter schema —
   nothing more.

## Consequences

- **Positive:** one sanitize allow-list (ADR-0126), one watcher, one module
  writer across all content sections; adding a section becomes `mkdir` +
  config, not a new pipeline; the www pilot duplication is deleted.
- **Positive:** the frontmatter-schema axis is designed against two real
  consumers (blog: `date/tags`; guide: `order/lede/locale`) rather than
  extrapolated from one.
- **Negative:** new public API on adapter-vite during a freeze culture —
  requires the surface inventory (`docs/current/PACKAGE_SURFACE.md`)
  update, api-surface gate evidence, and release-train coordination on the
  v0.43.1 line.
- **Resolved design:** `schema.fields` is declarative and drives both
  fail-closed validation and generated TypeScript fields. An optional
  `schema.transform` derives site-specific metadata or slugs without teaching
  the framework conventions such as locale-suffixed filenames.
- **Neutral:** `createBlogPlugin` survives as a thin alias over the generic
  factory for one release line, then is removed.
- **Migration impact (v0.43.1 train):** `packages/adapter-vite`
  (collection factory, blog desugar, writer naming), `www` (delete pilot,
  adopt `collections.guide`), `docs/current/PACKAGE_SURFACE.md`, and the
  www guide tests that pin the generated-module shape.
