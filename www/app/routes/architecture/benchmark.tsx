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
    return this._renderEn();
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
}
defineCustomElement('benchmark-page', Benchmark);
export const tagName = 'benchmark-page';
