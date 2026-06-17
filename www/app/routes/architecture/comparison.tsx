/**
 * @openelement/docs - Comparison: openElement vs Alternatives
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
export const tagName = 'comparison-page';

export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .table-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin: var(--space-lg) 0 var(--space-xxl);
        border: 0.5px solid var(--color-border);
        border-radius: var(--radius-sm);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-body-sm);
        min-width: 640px;
      }

      thead {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      th {
        background: var(--surface-1);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        text-align: left;
        padding: var(--space-sm) var(--space-md);
        border-bottom: 0.5px solid var(--color-border);
        white-space: nowrap;
      }

      td {
        padding: 0.625rem var(--space-md);
        border-bottom: 0.5px solid var(--color-border);
        color: var(--color-text-secondary);
        line-height: var(--line-height-normal);
      }

      tbody tr {
        transition: background 0.12s;
      }

      @media (prefers-reduced-motion: reduce) {
        tbody tr {
          transition: none;
        }
      }

      tbody tr:hover {
        background: var(--surface-1);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      td:first-child {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        white-space: nowrap;
      }

      td:not(:first-child) {
        font-variant-numeric: tabular-nums;
      }

      .tag-yes {
        color: var(--color-brand);
        font-weight: var(--font-weight-medium);
      }

      .tag-yes::before {
        content: '? ';
      }

      .tag-no {
        color: var(--color-text-muted);
      }

      .tag-partial {
        color: var(--color-text-muted);
        font-style: italic;
      }

      /* openElement column highlight */
      th.openElement-col {
        color: var(--color-brand);
        font-weight: var(--font-weight-semibold);
      }

      td.openElement-col {
        background: var(--color-brand-pale);
        font-weight: var(--font-weight-medium);
      }

      /* Prose lists */
      ul {
        padding-left: var(--space-md);
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
        font-size: var(--font-size-body);
      }
      li {
        margin: var(--space-xs) 0;
      }
      li strong {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }
    `);

export default class ComparisonPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return (
      <div class='container'>
        <h1>{isZh ? 'openElement 与竞品对比' : 'openElement vs Alternatives'}</h1>
        <p class='subtitle'>
          openElement 是领先的 DSD-first Web Components 应用框架。不同框架的对比基于 DSD/WC 特性、
          以及 island 和 Registry evidence pipeline。
        </p>

        <div class='table-wrap'>
          <table>
            <thead>
              <tr>
                <th scope='col'>维度</th>
                <th scope='col' class='openElement-col'>openElement</th>
                <th scope='col'>Astro</th>
                <th scope='col'>Fresh (Deno)</th>
                <th scope='col'>Next.js</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>定位</td>
                <td class='openElement-col'>DSD-first WC 应用框架</td>
                <td>全栈框架</td>
                <td>全栈 (Preact)</td>
                <td>全栈 (React)</td>
              </tr>
              <tr>
                <td>Runtime</td>
                <td class='openElement-col'>Deno</td>
                <td>Node.js</td>
                <td>Deno</td>
                <td>Node.js</td>
              </tr>
              <tr>
                <td>客户端 JS</td>
                <td class='openElement-col'>
                  <span class='tag-yes'>0 KB</span>
                </td>
                <td>
                  <span class='tag-yes'>0 KB</span>
                </td>
                <td>
                  <span class='tag-no'>~23 KB</span>
                </td>
                <td>
                  <span class='tag-no'>~90 KB</span>
                </td>
              </tr>
              <tr>
                <td>WC 原生</td>
                <td class='openElement-col'>
                  <span class='tag-yes'>DSD 一等公民</span>
                </td>
                <td>
                  <span class='tag-no'>不适用（通过通用组件）</span>
                </td>
                <td>
                  <span class='tag-no'>Preact-only</span>
                </td>
                <td>
                  <span class='tag-no'>?</span>
                </td>
              </tr>
              <tr>
                <td>适配器</td>
                <td class='openElement-col'>Lit / React / Vanilla 适配器</td>
                <td>适配器架构</td>
                <td>Preact</td>
                <td>React</td>
              </tr>
              <tr>
                <td>Rendering</td>
                <td class='openElement-col'>SSG + DSD + OpenElement + Islands (ISR next)</td>
                <td>SSG + SSR + Islands</td>
                <td>SSR + Islands</td>
                <td>SSR + RSC + SSG</td>
              </tr>
              <tr>
                <td>Registry / Hub</td>
                <td class='openElement-col'>
                  <span class='tag-no'>Deferred outside current product graph</span>
                </td>
                <td>
                  <span class='tag-no'>?</span>
                </td>
                <td>
                  <span class='tag-no'>?</span>
                </td>
                <td>
                  <span class='tag-no'>?</span>
                </td>
              </tr>
              <tr>
                <td>Server</td>
                <td class='openElement-col'>Hono + Serverless</td>
                <td>Built-in + adapters</td>
                <td>Oak (optional)</td>
                <td>Next.js server</td>
              </tr>
              <tr>
                <td>组件模型</td>
                <td class='openElement-col'>3-layer (DSD/Island) + 信号驱动</td>
                <td>Islands only</td>
                <td>Islands only</td>
                <td>Full hydration</td>
              </tr>
              <tr>
                <td>渲染时间</td>
                <td class='openElement-col'>SSG ? / ISR ?? / SSR ??</td>
                <td>SSG ? / SSR ?</td>
                <td>SSR ?</td>
                <td>SSR ? / SSG ?</td>
              </tr>
              <tr>
                <td>Ecosystem</td>
                <td class='openElement-col'>
                  <span class='tag-partial'>Emerging</span>
                </td>
                <td>Mature</td>
                <td>
                  <span class='tag-partial'>Small</span>
                </td>
                <td>Massive</td>
              </tr>
              <tr>
                <td>Package Registry</td>
                <td class='openElement-col'>JSR</td>
                <td>npm</td>
                <td>JSR + npm</td>
                <td>npm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>openElement 的差异化优势</h2>
        <ul>
          <li>
            <strong>支持 2 种价值模式</strong>{' '}
            — DSD 和 runtime 都提供价值。Astro 只有 WC 原生支持，Fresh 只有 DSD，Next 只有 React
            runtime。原生方案无法通过优化追平。
          </li>
          <li>
            <strong>支持 2+3 层架构</strong> — 渲染层 + Registry 一体化。封装、渲染、验证、部署。
          </li>
          <li>
            <strong>支持单框架</strong>{' '}
            — WC 原生全栈方案。"全栈框架 + WC 集成" 模式。"WC 是一等公民"。
          </li>
        </ul>

        <h2>openElement 的局限性</h2>
        <ul>
          <li>
            <strong>全平台支持有限</strong> — openElement 支持所有现代浏览器，但无法覆盖所有平台。
          </li>
          <li>
            <strong>npm 生态访问受限</strong> — JSR-only 的发布方式。npm 用户需要额外工具。
          </li>
          <li>
            <strong>浏览器兼容性要求</strong>{' '}
            — 需要 DSD 支持的浏览器：Chrome 90+、Safari 16.4+、Firefox 123+。
          </li>
        </ul>
      </div>
    );
  }
}

customElements.define(tagName, ComparisonPage);
