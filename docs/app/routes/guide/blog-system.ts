/**
 * Blog System — @kissjs/blog package design
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class BlogSystemPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
      ul { font-size: 0.8125rem; line-height: 1.8; color: var(--kiss-text-secondary); margin: 0.5rem 0 1rem; padding-left: 1.25rem; }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/blog-system">
        <div class="container">
          <p class="adr-meta">ADR 0004 · 2026-04-30 · Draft</p>
          <h1>@kissjs/blog — Standalone Blog Package</h1>

          <h2>Motivation</h2>
          <p>
            The docs site currently has two hardcoded blog pages — not a reusable system.
            Users need a one-line solution: drop in <code>.md</code> files, get automatic
            listing, pagination, RSS, and tags. Like VitePress, but as a KISS plugin.
          </p>

          <h2>User experience</h2>
          <div class="code-block">// vite.config.ts
import { kiss } from '@kissjs/core'
import { kissBlog } from '@kissjs/blog'

export default defineConfig({
  plugins: [
    kiss(),
    kissBlog({
      dir: 'content/blog',     // .md files go here
      title: 'My Blog',
      postsPerPage: 10,
    }),
  ],
})</div>

          <div class="code-block"><!-- content/blog/hello-world.md -->
---
title: Hello World
date: 2026-05-01
tags: [kiss, meta]
---

This is my first post.</div>

          <h2>Generated routes</h2>
          <ul>
            <li><code>/blog/</code> — Post listing (paginated, newest first)</li>
            <li><code>/blog/hello-world</code> — Individual post</li>
            <li><code>/blog/page/2</code> — Page 2</li>
            <li><code>/blog/tags/kiss</code> — Filter by tag</li>
            <li><code>/blog/feed.xml</code> — RSS / Atom feed</li>
          </ul>

          <h2>Constraint</h2>
          <p>
            The blog package is designed for the <code>.kiss</code> compiler from day one.
            Post templates compile to vanilla Custom Elements — zero runtime, no Lit,
            synchronous SSR via <code>template.innerHTML</code>.
          </p>
          <p>
            Before the compiler ships (v1.0), a fallback renders the same templates as
            server-side string concatenation using <code>html-template.ts</code>.
          </p>

          <h2>Implementation order</h2>
          <ol style="font-size:0.8125rem;line-height:1.8;color:var(--kiss-text-secondary)">
            <li><code>.kiss</code> compiler is available (Phase 11)</li>
            <li><code>@kissjs/blog</code> built on top (Phase 10 sub-task)</li>
            <li>KISS docs site dogfoods — replaces current hardcoded blog routes</li>
          </ol>

          <p>详见 <code>docs/decisions/0004-blog-system.md</code></p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">&larr; PWA Support</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-blog-system', BlogSystemPage);
export default BlogSystemPage;
export const tagName = 'page-blog-system';
