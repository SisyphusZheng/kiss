# `@kissjs/blog` — Standalone Blog Package

## Status

**DRAFT** — Proposed for Phase 10 (after .kiss compiler).

## Context

KISS currently has two hardcoded blog route pages (`/blog/` + `/blog/kiss-compiler`) on its own docs site. These are hand-written LitElement pages — not a reusable system.

Users need a proper blog: drop in `.md` files, get automatic listing + pagination + RSS + tags. Like VitePress's blog feature, but as a KISS plugin.

## Constraints

The blog system must not be built on Lit. It must be designed for the `.kiss` compiler from day one:

- Post templates must compile to vanilla Custom Elements (zero runtime)
- SSR must be synchronous string concatenation (`template.innerHTML`)
- No hydration, no lit-html, no @lit-labs/ssr
- The `.kiss` compiler is the rendering foundation — this package is a consumer of it

## Proposal

### `@kissjs/blog` package

A Vite plugin that:

1. **Scans** a user-defined directory for `.md` files with YAML frontmatter
2. **Generates** route entries at build time (like route-scanner does for `.ts` files)
3. **Renders** listing pages, post pages, tag pages, and RSS feed during SSG (Phase 3)

### User experience

```ts
// vite.config.ts
import { kiss } from '@kissjs/core'
import { kissBlog } from '@kissjs/blog'

export default defineConfig({
  plugins: [
    kiss(),
    kissBlog({
      dir: 'content/blog',     // where your .md files live
      title: 'My Blog',
      postsPerPage: 10,
    }),
  ],
})
```

```md
# content/blog/hello-world.md
---
title: Hello World
date: 2026-05-01
tags: [kiss, meta]
---

This is my first post.
```

### Generated routes

| Route | Content |
|-------|---------|
| `/blog/` | Post listing (paginated, newest first) |
| `/blog/hello-world` | Individual post (rendered from .md) |
| `/blog/page/2` | Page 2 of listing |
| `/blog/tags/kiss` | Filter by tag |
| `/blog/feed.xml` | RSS 2.0 / Atom feed |

### Plugin architecture

The `kissBlog()` plugin hooks into the KISS build pipeline:

```
vite.config.ts
  │
  kissBlog()  ── reads content/blog/*.md
  │               extracts frontmatter → metadata.json
  │               registers virtual routes
  │
  Phase 1: Vite build ── SSR bundle includes blog routes
  Phase 2: build:client  (no island chunks needed for blog)
  Phase 3: build:ssg  ── renders /blog/* pages
  │                      generates /feed.xml
  │
  dist/
  ├── blog/index.html
  ├── blog/hello-world/index.html
  └── feed.xml
```

### Post rendering

With the `.kiss` compiler:

```kiss
<!-- blog post template (built into @kissjs/blog) -->
<template>
  <article>
    <h1>{post.title}</h1>
    <time datetime="{post.isoDate}">{post.displayDate}</time>
    <div class="content">{post.html}</div>
    <nav class="tags">{post.tags}</nav>
  </article>
</template>

<script>
  // post data injected at compile time by the plugin
  post = { title: '', html: '', tags: [], isoDate: '', displayDate: '' }
</script>

<style>
  .content :host { max-width: 720px; margin: 0 auto; }
  time { font-size: 0.75rem; color: var(--kiss-text-muted); }
</style>
```

Without the `.kiss` compiler (fallback before v1.0):

The same template rendered as a server-side string concatenation using `html-template.ts`. No Lit, no runtime. Just `template.innerHTML` + `Document.createDocumentFragment().cloneNode(true)`.

### MDX support (future)

The `.md` parser should support:

- **Basic**: Gray-matter frontmatter + marked/ markdown-it
- **Extended (v2)**: MDX - embed Lit Components or `.kiss` components inline in markdown
- **Code blocks**: Syntax highlighting at build time (not client-side)

## Implementation order

1. `.kiss` compiler is available (Phase 11)
2. `@kissjs/blog` built on top of it (Phase 10 sub-task)
3. KISS docs site eats its own dogfood — replaces the current hardcoded blog routes

## Open Questions

1. Markdown parser: `marked` (lightweight) vs `markdown-it` (plugin ecosystem) vs custom?
2. Should the blog template be customizable via `kissBlog({ template: 'my-template.kiss' })`?
3. RSS vs Atom vs both?
4. Comments? (Disqus, utteranc.es, or leave it to the user)

## Consequences

- **Positive**: Users get a one-line blog setup, competitive with VitePress
- **Positive**: KISS docs site can dogfood its own blog package
- **Positive**: Zero JS runtime for blog pages (with .kiss compiler)
- **Negative**: Blocked on .kiss compiler for the ideal architecture
- **Negative**: Markdown parsing at build time adds ~100ms to Phase 1
