/**
 * openElement Benchmark & Performance
 *
 * Zero-noise performance characteristics: SSG build time, DSD rendering,
 * cold start, bundle size. No cherry-picked micro-benchmarks.
 */
export const meta = { section: 'Reference', label: 'Performance', order: 100 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';

const styles = new StyleSheet();
styles.replaceSync(
  pageStyles + `
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

}
customElements.define('benchmark-page', Benchmark);
export const tagName = 'benchmark-page';


