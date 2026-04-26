/**
 * Changelog Page — KISS Framework Version History
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '../components/layout.js';

export class ChangelogPage extends LitElement {
  static styles = [
    pageStyles,
    css`
      .version-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .version-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .version-number {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--kiss-text-primary);
      }
      .version-date {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        padding: 0.25rem 0.5rem;
        background: var(--kiss-bg-elevated);
        border-radius: 3px;
      }
      .change-category {
        margin: 1rem 0;
      }
      .change-category h4 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        margin-bottom: 0.5rem;
      }
      .change-category.added h4 {
        color: var(--kiss-accent);
      }
      .change-category.changed h4 {
        color: var(--kiss-accent-dim);
      }
      .change-category.fixed h4 {
        color: var(--kiss-text-secondary);
      }
      .change-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .change-list li {
        padding: 0.375rem 0;
        padding-left: 1.25rem;
        position: relative;
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
      }
      .change-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--kiss-text-muted);
      }
      .version-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .version-table th,
      .version-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .version-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .version-table td:first-child {
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
    `,
  ];

  render() {
    return html`
      <kiss-layout currentPath="/changelog">
        <div class="container">
          <h1>Changelog</h1>
          <p class="subtitle">
            All notable changes to KISS are documented here.
          </p>

          <p>
            The format is based on
            <a href="https://keepachangelog.com/en/1.0.0/" target="_blank">Keep a Changelog</a>, and this
            project adheres to
            <a href="https://semver.org/spec/v2.0.0.html" target="_blank">Semantic Versioning</a>.
          </p>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">Unreleased</span>
            </div>

            <div class="change-category added">
              <h4>Added</h4>
              <ul class="change-list">
                <li>Logger module with <code>KISS_LOG_LEVEL</code> environment variable support</li>
                <li>
                  @kissjs/ui component library with kiss-button, kiss-card, kiss-input, kiss-code-block,
                  kiss-layout
                </li>
                <li>design-tokens CSS custom properties for Swiss International Style</li>
                <li>examples/hello minimal example demonstrating KISS basics</li>
                <li>Documentation site dogfooding: /ui page uses real KISS UI components</li>
                <li>SSR Compatibility documentation in /guide/ssg</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>Changed</h4>
              <ul class="change-list">
                <li>@kissjs/ui version bumped to 0.1.4</li>
                <li>Documentation site now imports @kissjs/ui components</li>
                <li>Migrated all examples to static properties + customElements.define() pattern</li>
                <li>Removed experimentalDecorators config from packages/kiss-ui/deno.json</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.6</span>
              <span class="version-date">2026-04-26</span>
            </div>

            <div class="change-category added">
              <h4>Added</h4>
              <ul class="change-list">
                <li>Pure black & white design system with theme toggle</li>
                <li>/ui design system showcase page</li>
                <li>Mobile-responsive sidebar with hamburger menu</li>
                <li>CSS :has() selector for sidebar toggle (zero JS)</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>Changed</h4>
              <ul class="change-list">
                <li>Consolidated page styles (pageStyles) — eliminated 840 lines of duplicate CSS</li>
                <li>Removed all !important hacks from page styles</li>
                <li>Sidebar now uses slide-in animation with backdrop blur</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>Fixed</h4>
              <ul class="change-list">
                <li>Backdrop click now closes sidebar (L2 script)</li>
                <li>Mobile responsive layout improvements</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.5</span>
              <span class="version-date">2026-04-20</span>
            </div>

            <div class="change-category added">
              <h4>Added</h4>
              <ul class="change-list">
                <li>KISS Architecture documentation (K·I·S·S four constraints)</li>
                <li>DSD (Declarative Shadow DOM) output support</li>
                <li>Jamstack alignment documentation</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>Changed</h4>
              <ul class="change-list">
                <li>Rebranded from DIA to KISS Architecture</li>
                <li>Updated README with dual meaning (Philosophy + Architecture)</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.4</span>
              <span class="version-date">2026-04-15</span>
            </div>

            <div class="change-category added">
              <h4>Added</h4>
              <ul class="change-list">
                <li>inject option for custom stylesheets/scripts injection</li>
                <li>API Routes deployment documentation</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>Changed</h4>
              <ul class="change-list">
                <li>Marked ui option as deprecated (use inject instead)</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>Fixed</h4>
              <ul class="change-list">
                <li>RPC call() now throws RpcError instead of returning null</li>
              </ul>
            </div>
          </div>

          <h2>Version History</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Highlights</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0.1.6</td>
                <td>2026-04-26</td>
                <td>Design system + mobile responsive</td>
              </tr>
              <tr>
                <td>0.1.5</td>
                <td>2026-04-20</td>
                <td>KISS Architecture branding</td>
              </tr>
              <tr>
                <td>0.1.4</td>
                <td>2026-04-15</td>
                <td>inject option + API Routes docs</td>
              </tr>
              <tr>
                <td>0.1.3</td>
                <td>2026-04-10</td>
                <td>@kissjs/rpc + @kissjs/ui</td>
              </tr>
              <tr>
                <td>0.1.2</td>
                <td>2026-04-05</td>
                <td>Island AST transform</td>
              </tr>
              <tr>
                <td>0.1.1</td>
                <td>2026-04-01</td>
                <td>Initial JSR release</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/roadmap" class="nav-link">&larr; Roadmap</a>
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-changelog', ChangelogPage);
export default ChangelogPage;
export const tagName = 'page-changelog';
