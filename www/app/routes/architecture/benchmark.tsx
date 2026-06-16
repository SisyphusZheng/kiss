/**
 * openElement Benchmark & Performance
 *
 * Zero-noise performance characteristics: SSG build time, DSD rendering,
 * cold start, bundle size. No cherry-picked micro-benchmarks.
 */
export const meta = { section: 'Reference', label: 'Performance', order: 100 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';

const styles = new StyleSheet();
styles.replaceSync(
  pageStyles + `
  .metric { display:grid; grid-template-columns: 120px 1fr; gap:var(--space-xs) var(--space-md); margin:var(--space-md) 0; }
  .metric .label { color:var(--color-text-muted); font-size:var(--font-size-caption); }
  .metric .value { color:var(--color-text-primary); font-weight:var(--font-weight-semibold); }
`,
);

export default class Benchmark extends OpenElement {
  static override styles = [linearTokenSheet, styles];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  _renderEn() {
    return (
      <div class='container'>
        <h1>Performance &amp; Benchmarks</h1>
        <p class='subtitle'>Zero-noise. What we actually measure.</p>

        <h2>Build Performance</h2>
        <div class='metric'>
          <span class='label'>SSG build (www)</span>
          <span class='value'>~3s (37 pages, 478 URLs)</span>
        </div>
        <div class='metric'>
          <span class='label'>Dev cold start</span>
          <span class='value'>~100ms (deno task dev:fast)</span>
        </div>
        <div class='metric'>
          <span class='label'>Vite dev start</span>
          <span class='value'>~2s (deno task dev)</span>
        </div>
        <div class='metric'>
          <span class='label'>Client bundle</span>
          <span class='value'>~0 KB (islands only, 2 virtual modules)</span>
        </div>

        <h2>Rendering</h2>
        <div class='metric'>
          <span class='label'>DSD SSR</span>
          <span class='value'>Zero JS parse cost (browser native)</span>
        </div>
        <div class='metric'>
          <span class='label'>Island hydrate</span>
          <span class='value'>Per-component, strategy-gated</span>
        </div>
        <div class='metric'>
          <span class='label'>Route switch (SPA)</span>
          <span class='value'>~0ms (no full page reload)</span>
        </div>

        <h2>Bundle Size</h2>
        <p>
          openElement ships zero runtime JS for DSD components. Islands load on-demand by strategy.
          No framework runtime in the critical path.
        </p>
      </div>
    );
  }

  _renderZh() {
    return (
      <div class='container'>
        <h1>性能与基准测试</h1>
        <p class='subtitle'>零噪音。我们实际测量的数据。</p>

        <h2>构建性能</h2>
        <div class='metric'>
          <span class='label'>SSG 构建 (www)</span>
          <span class='value'>~3s（37 页，478 URL）</span>
        </div>
        <div class='metric'>
          <span class='label'>开发冷启动</span>
          <span class='value'>~100ms（deno task dev:fast）</span>
        </div>
        <div class='metric'>
          <span class='label'>Vite 开发启动</span>
          <span class='value'>~2s（deno task dev）</span>
        </div>
        <div class='metric'>
          <span class='label'>客户端捆绑包</span>
          <span class='value'>~0 KB（仅 islands，2 个虚拟模块）</span>
        </div>

        <h2>渲染</h2>
        <div class='metric'>
          <span class='label'>DSD SSR</span>
          <span class='value'>零 JS 解析成本（浏览器原生）</span>
        </div>
        <div class='metric'>
          <span class='label'>Island 水合</span>
          <span class='value'>按组件，策略控制</span>
        </div>
        <div class='metric'>
          <span class='label'>路由切换 (SPA)</span>
          <span class='value'>~0ms（无整页重新加载）</span>
        </div>

        <h2>包大小</h2>
        <p>openElement 的 DSD 组件零运行时 JS。Islands 按需加载。关键路径上无框架运行时。</p>
      </div>
    );
  }
}
customElements.define('benchmark-page', Benchmark);
export const tagName = 'benchmark-page';
