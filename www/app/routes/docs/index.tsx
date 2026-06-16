/**
 * Docs landing page - Linear.app-style entry paths.
 *
 * Four entry paths: Build an app, Learn the engine, Integrate packages, Maintain openElement.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1120px; margin: 0 auto; padding: 44px 32px 72px; }
  h1 { margin: 0; color: var(--color-text-primary); font-size: 56px; font-weight: 600; letter-spacing: -0.03em; }
  .lede { max-width: 680px; margin-top: 16px; font-size: var(--font-size-subhead); color: var(--color-text-secondary); line-height: var(--line-height-normal); }
  .paths { margin-top: 48px; display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  @media (max-width: 680px) { .paths { grid-template-columns: 1fr; } .shell { padding: 32px 16px 56px; } }

  .card-link { display: block; text-decoration: none; color: inherit; }
  .card-flex { display: flex; gap: var(--space-md); align-items: flex-start; }
  .card-icon { width: 24px; height: 24px; flex-shrink: 0; color: var(--color-brand); }
  .card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-xs); }
  .card-badge-row { display: flex; justify-content: flex-end; }
  .card-title { margin: 0; font-size: 22px; font-weight: 500; color: var(--color-text-primary); line-height: 1.2; }
  .card-desc { margin: 0; font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; }
`);

export class DocsPage extends OpenElement {
  static override styles = [linearTokenSheet, sheet];

  override render() {
    return (
      <div class='shell'>
        <h1>Docs</h1>
        <p class='lede'>
          openElement documentation is organized around what you want to do. Pick an entry path and
          follow the workflow.
        </p>
        <div class='paths'>
          <a class='card-link' href='/guide/getting-started'>
            <open-card-linear variant='standard'>
              <div class='card-flex'>
                <svg class='card-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
                  <path d='M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' />
                </svg>
                <div class='card-body'>
                  <div class='card-badge-row'><open-badge-linear>Entry</open-badge-linear></div>
                  <h2 class='card-title'>Build an app</h2>
                  <p class='card-desc'>Create a project, write DSD components, add routes, islands, content, i18n, and deploy.</p>
                </div>
              </div>
            </open-card-linear>
          </a>
          <a class='card-link' href='/architecture/dsd'>
            <open-card-linear variant='standard'>
              <div class='card-flex'>
                <svg class='card-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
                  <polygon points='12 2 2 7 12 12 22 7 12 2' />
                  <polyline points='2 17 12 22 22 17' />
                  <polyline points='2 12 12 17 22 12' />
                </svg>
                <div class='card-body'>
                  <div class='card-badge-row'><open-badge-linear>Concepts</open-badge-linear></div>
                  <h2 class='card-title'>Learn the engine</h2>
                  <p class='card-desc'>Understand DSD rendering, island architecture, Hono API routes, and the SSG build pipeline.</p>
                </div>
              </div>
            </open-card-linear>
          </a>
          <a class='card-link' href='/architecture/package-compatibility'>
            <open-card-linear variant='standard'>
              <div class='card-flex'>
                <svg class='card-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
                  <polyline points='16.5 9.4 7.5 4.21' />
                  <path d='M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' />
                  <polyline points='3.27 6.96 12 12.01 20.73 6.96' />
                  <line x1='12' y1='22.08' x2='12' y2='12' />
                </svg>
                <div class='card-body'>
                  <div class='card-badge-row'><open-badge-linear>Integrate</open-badge-linear></div>
                  <h2 class='card-title'>Integrate packages</h2>
                  <p class='card-desc'>Publish Web Components to the Hub. Prove compatibility, DSD conformance, and runtime behavior.</p>
                </div>
              </div>
            </open-card-linear>
          </a>
          <a class='card-link' href='/architecture'>
            <open-card-linear variant='standard'>
              <div class='card-flex'>
                <svg class='card-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
                  <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' />
                </svg>
                <div class='card-body'>
                  <div class='card-badge-row'><open-badge-linear>Contribute</open-badge-linear></div>
                  <h2 class='card-title'>Maintain openElement</h2>
                  <p class='card-desc'>Read the package graph, ADR decisions, SOP execution maps, and release gate mechanics.</p>
                </div>
              </div>
            </open-card-linear>
          </a>
        </div>
      </div>
    );
  }
}

customElements.define('page-docs', DocsPage);
export default DocsPage;
