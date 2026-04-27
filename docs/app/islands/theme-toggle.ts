/**
 * Theme Toggle Island — Interactive Component
 *
 * I 约束演示：
 * - localStorage 持久化
 * - Shadow DOM 封装
 * - 跨组件通信（CSS 自定义属性）
 */
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'theme-toggle';

export default class ThemeToggle extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      background: none;
      border: 1px solid var(--kiss-border, #333);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-primary, inherit);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    button:hover {
      background: var(--kiss-accent-subtle, rgba(255, 255, 255, 0.05));
      border-color: var(--kiss-border-hover, #555);
    }
  `;

  static properties = {
    theme: { type: String },
  };

  constructor() {
    super();
    this.theme = 'dark';
  }

  connectedCallback() {
    super.connectedCallback();
    const saved = localStorage.getItem('kiss-theme');
    if (saved) {
      this.theme = saved;
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kiss-theme', this.theme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  render() {
    return html`
      <button @click="${this.toggleTheme}">
        ${this.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    `;
  }
}

customElements.define(tagName, ThemeToggle);
