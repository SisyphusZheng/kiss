/**
 * Blog Index Page — KISS Framework Blog
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class BlogIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-list { list-style: none; padding: 0; margin: 1.5rem 0; }
      .blog-item {
        padding: 1rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        transition: border-color 0.15s;
        display: block;
        text-decoration: none;
        color: inherit;
      }
      .blog-item:hover { border-color: var(--kiss-text-primary); }
      .blog-item h2 { font-size: 0.9375rem; margin: 0 0 0.25rem; font-weight: 500; color: var(--kiss-text-primary); }
      .blog-item .meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin: 0; }
      .blog-item p { font-size: 0.8125rem; color: var(--kiss-text-secondary); margin: 0.5rem 0 0; }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog">
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">KISS 框架的设计思考、架构决策和发展路线。</p>

          <div class="blog-list">
            <a href="/blog/kiss-compiler" class="blog-item">
              <h2>.kiss Compiler — 消灭 Lit，零运行时 Web Components</h2>
              <p class="meta">2026-04-30 · 架构决策</p>
              <p>KISS 的终极目标：一个自定义编译器将声明式 .kiss 文件编译为原生 Custom Elements，彻底消除 58kb 的 Lit 运行时。</p>
            </a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-blog-index', BlogIndexPage);
export default BlogIndexPage;
export const tagName = 'page-blog-index';
