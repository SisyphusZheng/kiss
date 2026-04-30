import { css, html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ─── Hero ─── */
    .hero {
      max-width: 800px;
      margin: 0 auto;
      padding: 12rem 2rem 6rem;
      text-align: left;
    }

    .hero .overline {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.24em;
      color: var(--kiss-text-muted);
      margin-bottom: 1.75rem;
      display: block;
    }

    .hero h1 {
      font-size: 5.5rem;
      font-weight: 900;
      letter-spacing: -0.06em;
      margin: 0;
      color: var(--kiss-text-primary);
      line-height: 0.9;
    }

    .hero .tagline {
      font-size: 1.0625rem;
      color: var(--kiss-text-secondary);
      margin-top: 2.25rem;
      line-height: 1.8;
      font-weight: 400;
      max-width: 480px;
    }

    .hero .equation {
      margin-top: 3rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .eq-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--kiss-bg-surface);
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--kiss-text-tertiary);
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .eq-item:hover {
      border-color: var(--kiss-border-hover);
      background: var(--kiss-bg-elevated);
    }

    .eq-label {
      color: var(--kiss-text-muted);
      font-weight: 400;
    }

    .eq-val {
      color: var(--kiss-text-primary);
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .cta {
      margin-top: 3rem;
      display: flex;
      gap: 0.75rem;
    }

    .cta a {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .cta-primary {
      background: var(--kiss-text-primary);
      color: var(--kiss-bg-base);
    }

    .cta-primary:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }

    .cta-secondary {
      background: transparent;
      color: var(--kiss-text-secondary);
      border: 1px solid var(--kiss-border);
    }

    .cta-secondary:hover {
      color: var(--kiss-text-primary);
      border-color: var(--kiss-border-hover);
      transform: translateY(-1px);
    }

    /* ─── Standards ─── */
    .standards {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .section-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--kiss-text-muted);
      margin-bottom: 1.5rem;
    }

    .pill-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--kiss-bg-surface);
      color: var(--kiss-text-secondary);
      border: 1px solid var(--kiss-border);
      transition: border-color 0.2s, color 0.2s, background 0.2s;
    }

    .pill:hover {
      border-color: var(--kiss-border-hover);
      color: var(--kiss-text-primary);
      background: var(--kiss-bg-elevated);
    }

    .pill .check {
      color: var(--kiss-accent);
      font-size: 0.625rem;
      font-weight: 700;
    }

    /* ─── Features ─── */
    .features {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .features-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .feature-item {
      padding: 2rem 1.75rem;
      border-bottom: 1px solid var(--kiss-border);
      transition: background 0.2s ease;
    }

    .feature-item:nth-child(odd) {
      border-right: 1px solid var(--kiss-border);
    }

    .feature-item:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .feature-item:hover {
      background: var(--kiss-bg-surface);
    }

    .feature-item h2 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--kiss-text-primary);
      letter-spacing: -0.01em;
    }

    .feature-item p {
      font-size: 0.8125rem;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.65;
    }

    /* ─── Comparison ─── */
    .comparison {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 0.875rem 1.125rem;
      text-align: left;
      border-bottom: 1px solid var(--kiss-border);
    }

    .comparison-table th {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--kiss-text-muted);
    }

    .comparison-table th:first-child {
      color: var(--kiss-text-primary);
    }

    .comparison-table td {
      color: var(--kiss-text-tertiary);
    }

    .comparison-table td:first-child {
      color: var(--kiss-text-primary);
      font-weight: 500;
    }

    .comparison-table tr:hover td {
      background: var(--kiss-bg-surface);
    }

    /* ─── JSR ─── */
    .jsr {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem 6rem;
      border-top: 1px solid var(--kiss-border);
    }

    .badge-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .jsr-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: var(--kiss-bg-surface);
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      transition: all 0.2s ease;
    }

    .jsr-badge:hover {
      background: var(--kiss-bg-elevated);
      color: var(--kiss-text-primary);
      border-color: var(--kiss-border-hover);
      transform: translateY(-1px);
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .hero {
        padding: 5rem 1.5rem 3rem;
      }

      .hero h1 {
        font-size: 3rem;
      }

      .features-list {
        grid-template-columns: 1fr;
      }

      .feature-item:nth-child(odd) {
        border-right: none;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .hero .equation {
        flex-direction: column;
      }
    }
  `;

  override render() {
    return html`
      <kiss-layout home>
        <div class="hero">
          <div class="overline">Web 标准框架</div>
          <h1>KISS</h1>
          <p class="tagline">
            保持愚蠢，保持简单。一个完全基于 Web 标准构建的极简全栈框架。
          </p>
          <div class="equation">
            <span class="eq-item"><span class="eq-label">HTTP =</span> <span class="eq-val"
              >Fetch API</span></span>
            <span class="eq-item"><span class="eq-label">UI =</span> <span class="eq-val"
              >Web Components</span></span>
            <span class="eq-item"><span class="eq-label">构建 =</span> <span class="eq-val"
              >ESM</span></span>
            </div>
            <div class="cta">
              <a class="cta-primary" href="/guide/getting-started">快速上手</a>
              <a class="cta-secondary" href="https://github.com/SisyphusZheng/kiss">GitHub</a>
            </div>
          </div>

          <div class="standards">
            <div class="section-label">Web 标准覆盖</div>
            <div class="pill-row">
              <span class="pill"><span class="check">&#10003;</span> Fetch API</span>
              <span class="pill"><span class="check">&#10003;</span> Web Components</span>
              <span class="pill"><span class="check">&#10003;</span> ESM</span>
              <span class="pill"><span class="check">&#10003;</span> 声明式 Shadow DOM</span>
              <span class="pill"><span class="check">&#10003;</span> Islands 架构</span>
            </div>
          </div>

          <div class="features">
            <div class="section-label">为什么选 KISS</div>
            <div class="features-list">
              <div class="feature-item">
                <h2>Web 标准优先</h2>
                <p>没有新的抽象。如果你懂 Web 平台，你就懂 KISS。</p>
              </div>
              <div class="feature-item">
                <h2>Islands 架构</h2>
                <p>只有交互式组件才加载 JS。默认首页：0 KB。</p>
              </div>
              <div class="feature-item">
                <h2>类型安全 RPC</h2>
                <p>基于 Hono RPC 的端到端类型安全。无需代码生成。</p>
              </div>
              <div class="feature-item">
                <h2>多运行时</h2>
                <p>同一套代码运行在 Deno、Node、Bun、Cloudflare Workers。</p>
              </div>
              <div class="feature-item">
                <h2>SSG 内置</h2>
                <p>构建时预渲染为静态 HTML。零配置。</p>
              </div>
              <div class="feature-item">
                <h2>零锁定</h2>
                <p>你的代码在没有 KISS 时也能运行。Hono、Lit、Vite 都是标准工具。</p>
              </div>
            </div>
          </div>

          <div class="comparison">
            <div class="section-label">全链路 Web 标准</div>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>KISS</th>
                  <th>Astro</th>
                  <th>Next.js</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fetch API</td>
                  <td>Fetch API</td>
                  <td>自定义 API</td>
                </tr>
                <tr>
                  <td>Web Components</td>
                  <td>Islands（自定义）</td>
                  <td>仅 React</td>
                </tr>
                <tr>
                  <td>ESM</td>
                  <td>ESM</td>
                  <td>ESM + 自定义</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="jsr">
            <div class="section-label">从 JSR 安装</div>
            <div class="badge-row">
              <a class="jsr-badge" href="https://jsr.io/@kissjs/core">@kissjs/core</a>
              <a class="jsr-badge" href="https://jsr.io/@kissjs/ui">@kissjs/ui</a>
              <a class="jsr-badge" href="https://jsr.io/@kissjs/rpc">@kissjs/rpc</a>
            </div>
          </div>
        </kiss-layout>
      `;
    }
  }

customElements.define('docs-home', DocsHome);
