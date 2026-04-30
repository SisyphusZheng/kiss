/**
 * API Consumer Island — JAM Pattern Interactive Demo
 *
 * A lightweight island component that calls the KISS serverless API.
 * Rendered initially as DSD, then hydrated on the client.
 * Styled with KISS UI CSS custom properties.
 */
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'api-consumer';

export default class ApiConsumer extends LitElement {
  static override styles = css`
    :host { display: block; }

    .card {
      border: 1px solid var(--kiss-border);
      border-radius: 8px;
      padding: 1.25rem;
      background: var(--kiss-bg-surface);
    }
    .card h3 {
      font-size: 0.875rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
      color: var(--kiss-text-primary);
      letter-spacing: -0.01em;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--kiss-text-tertiary);
      margin-bottom: 0.75rem;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-dot.loading { background: var(--kiss-accent-dim); }
    .status-dot.connected { background: #22c55e; }
    .status-dot.error { background: var(--kiss-error); }

    .data-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.25rem 0.75rem;
      font-size: 0.8125rem;
      margin-bottom: 0.75rem;
    }
    .data-grid .key {
      color: var(--kiss-text-tertiary);
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.75rem;
    }
    .data-grid .val {
      color: var(--kiss-text-primary);
      font-weight: 500;
    }

    .pre-box {
      background: var(--kiss-code-bg);
      border: 1px solid var(--kiss-code-border);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      color: var(--kiss-text-secondary);
      overflow-x: auto;
      margin: 0.75rem 0;
      line-height: 1.6;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      background: var(--kiss-bg-card);
      color: var(--kiss-text-secondary);
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover {
      border-color: var(--kiss-border-hover);
      color: var(--kiss-text-primary);
      background: var(--kiss-bg-hover);
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .btn.primary {
      background: var(--kiss-accent);
      color: var(--kiss-bg-base);
      border-color: var(--kiss-accent);
    }
    .btn.primary:hover { opacity: 0.85; }
    .btn.primary:disabled {
      opacity: 0.25;
      background: var(--kiss-text-muted);
      border-color: transparent;
    }

    .divider {
      border: none;
      border-top: 1px solid var(--kiss-border);
      margin: 1.25rem 0;
    }

    .form-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin: 0.75rem 0;
    }
    .form-row input {
      flex: 1;
      padding: 0.45rem 0.7rem;
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      background: var(--kiss-bg-card);
      color: var(--kiss-text-primary);
      font-size: 0.8125rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-row input:focus {
      border-color: var(--kiss-border-hover);
    }
    .form-row input::placeholder {
      color: var(--kiss-text-muted);
    }

    .greeting {
      margin-top: 0.5rem;
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.9375rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--kiss-accent) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--kiss-accent) 15%, transparent);
      color: var(--kiss-text-primary);
      animation: fadeSlide 0.25s ease;
    }
    .err-msg {
      margin-top: 0.5rem;
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      background: color-mix(in srgb, var(--kiss-error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--kiss-error) 20%, transparent);
      color: var(--kiss-error);
      animation: fadeSlide 0.25s ease;
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  static override properties = {
    apiUrl: { type: String },
    apiData: { type: Object },
    apiLoading: { type: Boolean },
    apiError: { type: String },
    name: { type: String },
    helloMsg: { type: String },
    helloLoading: { type: Boolean },
    helloError: { type: String },
  };

  apiUrl = '';
  apiData: Record<string, unknown> | null = null;
  apiLoading = false;
  apiError = '';
  name = '';
  helloMsg = '';
  helloLoading = false;
  helloError = '';

  private get _base(): string {
    return this.apiUrl || 'https://kiss-demo-api.sisyphuszheng.deno.net';
  }

  override connectedCallback() {
    super.connectedCallback();
    this._fetchStatus();
  }

  private async _fetchStatus() {
    this.apiLoading = true;
    this.apiError = '';
    try {
      const res = await fetch(`${this._base}/api`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.apiData = await res.json() as Record<string, unknown>;
    } catch (e) {
      this.apiError = String(e);
      this.apiData = null;
    } finally {
      this.apiLoading = false;
    }
  }

  private async _sayHello() {
    const t = this.name.trim();
    if (!t) return;
    this.helloLoading = true;
    this.helloError = '';
    this.helloMsg = '';
    try {
      const res = await fetch(`${this._base}/api/hello/${encodeURIComponent(t)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json() as { message: string };
      this.helloMsg = j.message;
    } catch (e) {
      this.helloError = String(e);
    } finally {
      this.helloLoading = false;
    }
  }

  private _onInput(e: Event) {
    this.name = (e.target as HTMLInputElement).value;
  }
  private _onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') this._sayHello();
  }

  override render() {
    return html`
      <div class="card">
        <h3>Server Status</h3>
        <div class="status-row">
          <span class="status-dot ${this.apiLoading ? 'loading' : this.apiError ? 'error' : 'connected'}"></span>
          ${this.apiLoading ? 'Contacting server...' : this.apiError ? 'Connection failed' : 'API online'}
        </div>
        ${this.apiData ? html`
          <div class="data-grid">
            <span class="key">framework</span><span class="val">${this.apiData.framework}</span>
            <span class="key">version</span><span class="val">${this.apiData.version}</span>
            <span class="key">jamstack</span><span class="val">${String(this.apiData.jamstack)}</span>
            <span class="key">serverless</span><span class="val">${String(this.apiData.serverless)}</span>
          </div>
        ` : ''}
        ${this.apiLoading ? html`<div class="pre-box">Loading...</div>` : ''}
        ${this.apiData ? html`<div class="pre-box">${JSON.stringify(this.apiData, null, 2)}</div>` : ''}
        ${this.apiError ? html`<div class="pre-box" style="color:var(--kiss-error)">${this.apiError}</div>` : ''}
        <button class="btn" @click=${this._fetchStatus} ?disabled=${this.apiLoading}>⟳ Refresh</button>

        <hr class="divider" />

        <h3>Say Hello</h3>
        <p style="font-size:0.8125rem;color:var(--kiss-text-tertiary);margin:0 0 0.75rem;line-height:1.6">
          Type your name and the serverless API will greet you back.
          Calls <code style="font-size:0.75rem">GET /api/hello/:name</code> on Deno Deploy.
        </p>
        <div class="form-row">
          <input type="text" placeholder="Enter your name..." .value=${this.name}
            @input=${this._onInput} @keydown=${this._onKey} />
          <button class="btn primary" @click=${this._sayHello}
            ?disabled=${this.helloLoading || !this.name.trim()}>
            ${this.helloLoading ? 'Sending...' : 'Say Hello →'}
          </button>
        </div>
        ${this.helloMsg ? html`<div class="greeting">${this.helloMsg}</div>` : ''}
        ${this.helloError ? html`<div class="err-msg">${this.helloError}</div>` : ''}
      </div>
    `;
  }
}

customElements.define(tagName, ApiConsumer);
