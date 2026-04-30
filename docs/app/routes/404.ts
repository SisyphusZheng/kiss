/**
 * 404 Not Found Page
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class NotFoundPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .error-code {
        font-size: 5rem;
        font-weight: 800;
        letter-spacing: -0.06em;
        color: var(--kiss-text-primary);
        margin: 2rem 0 0.5rem;
        line-height: 1;
      }
      .error-message {
        color: var(--kiss-text-tertiary);
        font-size: 0.9375rem;
        margin-bottom: 2rem;
      }
      .home-link {
        display: inline-block;
        padding: 0.5rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        color: var(--kiss-text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s;
      }
      .home-link:hover {
        border-color: var(--kiss-text-primary);
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout>
        <div class="container" style="text-align:center;padding-top:4rem">
          <div class="error-code">404</div>
          <p class="error-message">
            This page does not exist — or has moved to a different route.
          </p>
          <a href="/" class="home-link">&larr; Back to home</a>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-not-found', NotFoundPage);
export default NotFoundPage;
export const tagName = 'page-not-found';
