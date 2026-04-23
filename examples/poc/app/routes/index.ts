import { LitElement, html, css } from 'lit'

export default class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #1a1a2e;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #555;
      line-height: 1.6;
    }
    .tag {
      display: inline-block;
      background: #e94560;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
  `

  render() {
    return html`
      <span class="tag">v0.1.0 PoC</span>
      <h1>HVL Framework</h1>
      <p>
        <strong>Hono + Vite + Lit</strong> — Web Standards 下的最小增幅渐进式全栈框架。
      </p>
      <p>
        这个页面完全由 Lit SSR 渲染，使用 Declarative Shadow DOM。
        如果你看到了这个内容，说明 <em>Vite SSR + Lit 渲染</em> 验证通过！
      </p>
      <p>试试下方的计数器 Island 组件：</p>
      <my-counter></my-counter>
    `
  }
}

// Custom element registration happens automatically via island-transform
// for islands, and is not needed for pure SSR page components.
