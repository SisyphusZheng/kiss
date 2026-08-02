/**
 * openElement Benchmark & Performance
 *
 * Zero-noise performance characteristics: SSG build time, DSD rendering,
 * cold start, bundle size. No cherry-picked micro-benchmarks.
 */
export const meta = { section: 'Reference', label: 'Performance', order: 100 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';

const styles = new StyleSheet();
styles.replaceSync(
  pageStyles + `
  h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

  .metric { display:grid; grid-template-columns: 120px 1fr; gap:var(--size-2) var(--size-4); margin:var(--size-4) 0; }
  .metric .label { color:var(--text-muted); font-size:var(--font-size-0); }
  .metric .value { color:var(--text); font-weight:var(--font-weight-6); }
`,
);

export default class Benchmark extends OpenElement {
  static override styles = [styles];

  override render() {
    return this._getLocale('en') === 'zh' ? this._renderZh() : this._renderEn();
  }

  _renderEn() {
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items='[{"id":"build-performance","label":"Build Performance"},{"id":"rendering","label":"Rendering"},{"id":"bundle-size","label":"Bundle Size"}]'
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            Performance &amp;<span class='title-accent'>Benchmarks</span>
          </h1>
          <p class='subtitle'>Zero-noise. What we actually measure.</p>

          <open-artifact-panel>
            <span slot='label'>build evidence</span>
            <span slot='meta'>deterministic site build</span>
            <h2 id='build-performance'>Build Performance</h2>
            <div class='metric'>
              <span class='label'>SSG build (www)</span>
              <span class='value'>30 route modules, 205 sitemap URLs</span>
            </div>
            <div class='metric'>
              <span class='label'>Dev cold start</span>
              <span class='value'>Measured by CI performance evidence</span>
            </div>
            <div class='metric'>
              <span class='label'>Vite dev start</span>
              <span class='value'>Measured by CI performance evidence</span>
            </div>
            <div class='metric'>
              <span class='label'>Client bundle</span>
              <span class='value'>Budgeted island chunks; no mandatory page runtime</span>
            </div>

            <h2 id='rendering'>Rendering</h2>
            <div class='metric'>
              <span class='label'>DSD SSR</span>
              <span class='value'>Zero JS parse cost (browser native)</span>
            </div>
            <div class='metric'>
              <span class='label'>Island hydrate</span>
              <span class='value'>Per-component, strategy-gated</span>
            </div>
            <div class='metric'>
              <span class='label'>Navigation</span>
              <span class='value'>Browser-native navigation with optional View Transitions</span>
            </div>
          </open-artifact-panel>

          <h2 id='bundle-size'>Bundle Size</h2>
          <p>
            DSD components need no framework virtual DOM runtime. Client JS is emitted only when
            islands or enhanced forms exist; pure-static pages stay script-free. Islands load
            on-demand by strategy.
          </p>
        </div>
      </open-reading-shell>
    );
  }

  _renderZh() {
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items='[{"id":"build-performance","label":"构建性能"},{"id":"rendering","label":"渲染"},{"id":"bundle-size","label":"Bundle 体积"}]'
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            性能与<span class='title-accent'>基准测试</span>
          </h1>
          <p class='subtitle'>零噪音。只列我们实际测量的数据。</p>

          <open-artifact-panel>
            <span slot='label'>构建证据</span>
            <span slot='meta'>确定性站点构建</span>
            <h2 id='build-performance'>构建性能</h2>
            <div class='metric'>
              <span class='label'>SSG 构建（www）</span>
              <span class='value'>30 个路由模块，205 条 sitemap URL</span>
            </div>
            <div class='metric'>
              <span class='label'>开发冷启动</span>
              <span class='value'>由 CI 性能证据测量</span>
            </div>
            <div class='metric'>
              <span class='label'>Vite 开发启动</span>
              <span class='value'>由 CI 性能证据测量</span>
            </div>
            <div class='metric'>
              <span class='label'>客户端 bundle</span>
              <span class='value'>island chunk 有预算约束；无强制页面运行时</span>
            </div>

            <h2 id='rendering'>渲染</h2>
            <div class='metric'>
              <span class='label'>DSD SSR</span>
              <span class='value'>零 JS 解析成本（浏览器原生）</span>
            </div>
            <div class='metric'>
              <span class='label'>Island hydration</span>
              <span class='value'>按组件粒度，由策略门控</span>
            </div>
            <div class='metric'>
              <span class='label'>导航</span>
              <span class='value'>浏览器原生导航，可选 View Transitions</span>
            </div>
          </open-artifact-panel>

          <h2 id='bundle-size'>Bundle 体积</h2>
          <p>
            DSD 组件不需要框架的虚拟 DOM 运行时。仅当存在 island 或增强表单时才输出客户端
            JS；纯静态页面保持无脚本。island 按策略按需加载。
          </p>
        </div>
      </open-reading-shell>
    );
  }
}
export const tagName = 'benchmark-page';
defineCustomElement(tagName, Benchmark);
