export const meta = { section: 'Principles', label: 'Island Deep Dive', order: 50 };
export const tagName = 'page-islands-deep-guide';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/site-ui/open-artifact-panel.tsx';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  .layer-card { padding: 20px var(--size-6); margin: var(--size-4) 0; border-left: 2px solid var(--color-border); background: var(--surface-1); border-radius: 0 3px 3px 0; }
  .layer-card .layer-tag { font-size: var(--font-size-overline); font-weight: var(--font-weight-5); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; }
  .layer-card h3 { margin: 0 0 var(--size-2); }
  .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-4); margin: var(--size-4) 0 var(--size-6); }
  .strategy-item { padding: var(--size-4) 20px; border: 0.5px solid var(--color-border); border-radius: var(--radius-xs); background: var(--surface-1); }
  .strategy-item .strat-name { font-weight: var(--font-weight-5); font-size: var(--font-size-2); color: var(--text); margin-bottom: 0.25rem; }
  .strategy-item .strat-name code { font-size: var(--font-size-0); background: var(--surface-2); padding: 0.125rem 0.375rem; border-radius: 3px; }
  @media (max-width: 720px) { .strategy-grid { grid-template-columns: 1fr; } }
`,
);

export class IslandsDeepGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items='[{"id":"upgrade-model","label":"Upgrade Model"},{"id":"three-layers","label":"Three Layers"},{"id":"strategies","label":"Strategies"},{"id":"ssr-props","label":"SSR Props Are Not Events"},{"id":"dynamic-content","label":"Dynamic Content"}]'
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>Island Deep Dive</h1>
          <p class='subtitle'>
            Islands are the only client JavaScript units in openElement. The public model is VNode
            output plus JSX event handlers; SSR props are restored separately.
          </p>

          <h2 id='upgrade-model'>Upgrade Model</h2>
          <p>
            openElement uses the browser Custom Element upgrade mechanism. SSG writes HTML first,
            then the client entry imports only the island modules used by the current page.
          </p>

          <h2 id='three-layers'>Three Layers</h2>
          <open-artifact-panel>
            <span slot='label'>island activation model</span>
            <span slot='meta'>DSD static → selective upgrade</span>
            <div class='layer-card'>
              <div class='layer-tag'>Layer 1 - dsd-static</div>
              <h3>No client JavaScript</h3>
              <p>
                Static Web Components render as DSD during SSG. They remain visible and styled even
                when no client module runs.
              </p>
            </div>
            <div class='layer-card'>
              <div class='layer-tag'>Layer 2 - dsd-interactive</div>
              <h3>DSD plus VNode event hydration</h3>
              <p>
                The server emits DSD and VNode event markers. On upgrade, OpenElement hydrates those
                markers to JSX handlers. There is no string method lookup and no data-on-* event
                binding.
              </p>
            </div>
            <div class='layer-card'>
              <div class='layer-tag'>Layer 3 - pure-island</div>
              <h3>Client-owned shadow root</h3>
              <p>
                Browser-only components can opt out of SSR with the only strategy. The server emits
                the host tag and data-ssr-props; the client owns rendering.
              </p>
            </div>
          </open-artifact-panel>

          <h2 id='strategies'>Strategies</h2>
          <div class='strategy-grid'>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>load</code>
              </div>
              <p>Import immediately for first-paint controls such as navigation and theme.</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>idle</code>
              </div>
              <p>Import during idle time for non-critical interactive components.</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>visible</code>
              </div>
              <p>Import when the island approaches the viewport.</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>only</code>
              </div>
              <p>Skip SSR for browser-only components that cannot produce reliable DSD.</p>
            </div>
          </div>

          <h2 id='ssr-props'>SSR Props Are Not Events</h2>
          <p>
            <span class='inline-code'>bindSsrProps()</span>{' '}
            restores data-ssr-props into the upgraded element. It does not bind DOM events. Events
            are owned by VNode markers generated from JSX handlers.
          </p>

          <h2 id='dynamic-content'>Dynamic Content</h2>
          <p>
            Dynamic island content should return VNode or VNode arrays. HTML injection stays behind
            the explicit <span class='inline-code'>trustedHtml</span>{' '}
            boundary for pre-sanitized, non-interactive content only.
          </p>

          <div class='nav-row'>
            <a
              href='/architecture/dsd'
              style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            >
              DSD Architecture
            </a>
            <a
              href='/guide/islands-and-ssr'
              style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            >
              Islands and SSR
            </a>
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define(tagName, IslandsDeepGuidePage);
export default IslandsDeepGuidePage;
