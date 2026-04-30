import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'api-consumer';

export default class ApiConsumer extends LitElement {
  static override styles = css`
    :host { display: block; margin: 1rem 0; }
    .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.25rem; background: #fafafa; }
    .card h3 { font-size: 0.875rem; margin: 0 0 0.5rem; color: #333; }
    .status { font-size: 0.8125rem; color: #666; margin-bottom: 0.75rem; }
    .status .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.35rem; }
    .dot.green { background: #22c55e; }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #eab308; }
    pre { background: #1a1a2e; color: #e0e0e0; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.75rem; overflow-x: auto; margin: 0; }
    .error { color: #ef4444; font-size: 0.8125rem; }
    .success { color: #16a34a; font-size: 0.9375rem; font-weight: 500; }
    .row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
    .label { font-size: 0.75rem; color: #888; min-width: 80px; }
    .value { font-size: 0.875rem; }
    button { padding: 0.4rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.8125rem; margin-top: 0.5rem; }
    button:hover { background: #f0f0f0; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .divider { border: none; border-top: 1px solid #e5e5e5; margin: 1rem 0; }
    .form-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .form-row input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.8125rem; outline: none; }
    .form-row input:focus { border-color: #666; }
    .form-row button { margin-top: 0; white-space: nowrap; }
    .hello-result { margin-top: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.875rem; }
    .hello-result.greeting { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .hello-result.error { background: #fef2f2; border: 1px solid #fecaca; }
  `;
  static override properties = {
    apiUrl: { type: String },
    data: { type: Object },
    loading: { type: Boolean },
    error: { type: String },
    name: { type: String },
    helloMessage: { type: String },
    helloLoading: { type: Boolean },
    helloError: { type: String },
  };

  apiUrl = '';
  data: Record<string, unknown> | null = null;
  loading = false;
  error = '';
  name = '';
  helloMessage = '';
  helloLoading = false;
  helloError = '';

  private get _base(): string {
    return this.apiUrl || 'https://kiss-demo-api.sisyphuszheng.deno.net';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.fetchApi();
  }

  async fetchApi() {
    this.loading = true;
    this.error = '';
    try {
      const res = await fetch(`${this._base}/api`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.data = await res.json() as Record<string, unknown>;
    } catch (e) {
      this.error = String(e);
      this.data = null;
    } finally {
      this.loading = false;
    }
  }

  async sayHello() {
    const trimmed = this.name.trim();
    if (!trimmed) return;
    this.helloLoading = true;
    this.helloError = '';
    this.helloMessage = '';
    try {
      const res = await fetch(`${this._base}/api/hello/${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { message: string };
      this.helloMessage = json.message;
    } catch (e) {
      this.helloError = String(e);
    } finally {
      this.helloLoading = false;
    }
  }

  private _onInput(e: Event) {
    this.name = (e.target as HTMLInputElement).value;
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.sayHello();
  }

  override render() {
    return html`
      <div class="card">
        <h3>🌐 API Consumer</h3>
        <div class="status">
          <span class="dot ${this.loading ? 'yellow' : this.error ? 'red' : 'green'}"></span>
          ${this.loading ? 'Fetching...' : this.error ? 'Error' : 'Connected'}
        </div>
        ${this.loading ? html`<pre>Loading...</pre>` : ''}
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        ${this.data ? html`
          <div class="row"><span class="label">framework</span><span class="value">${this.data.framework}</span></div>
          <div class="row"><span class="label">version</span><span class="value">${this.data.version}</span></div>
          <div class="row"><span class="label">jamstack</span><span class="value">${String(this.data.jamstack)}</span></div>
          <div class="row"><span class="label">serverless</span><span class="value">${String(this.data.serverless)}</span></div>
          <pre>${JSON.stringify(this.data, null, 2)}</pre>
        ` : ''}
        <button @click=${this.fetchApi}>🔄 Refresh</button>

        <hr class="divider">

        <h3>✉️ Say Hello</h3>
        <p style="font-size:0.8125rem;color:#666;margin:0 0 0.5rem">
          Type your name and the serverless API will greet you back.
        </p>
        <div class="form-row">
          <input
            type="text"
            placeholder="Enter your name..."
            .value=${this.name}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          />
          <button
            @click=${this.sayHello}
            ?disabled=${this.helloLoading || !this.name.trim()}
          >${this.helloLoading ? 'Sending...' : 'Say Hello'}</button>
        </div>
        ${this.helloMessage ? html`
          <div class="hello-result greeting">
            <span class="success">${this.helloMessage}</span>
          </div>
        ` : ''}
        ${this.helloError ? html`
          <div class="hello-result error">
            <span class="error">${this.helloError}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}
