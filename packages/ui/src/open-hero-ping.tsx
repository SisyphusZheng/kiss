/** @jsxImportSource @openelement/core */
/**
 * Hero Ping - Ocean component (v0.20.0 Ocean-Island).
 *
 * Calls a real API endpoint and shows a status dot with response info.
 * Pure DsdElement - zero Lit dependency. State changes are reflected
 * by re-rendering the shadow DOM and re-hydrating events.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart dot-static  - The static status dot
 * @csspart dot-animated - The animated ping button
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
export const tagName = 'open-hero-ping';

const styles: StyleSheetLike = new StyleSheet();
styles.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
  }
  .ping {
    padding: var(--size-1) var(--size-5);
    border-radius: var(--radius-1);
    border: var(--border-size-1) solid var(--gray-5);
    background: transparent;
    color: var(--gray-5);
    font-size: var(--font-size-00);
    cursor: pointer;
    letter-spacing: var(--font-letterspacing-5);
    text-transform: uppercase;
    transition: all var(--ease-2) var(--duration-2);
    font-family: inherit;
    white-space: nowrap;
  }
  .ping:hover {
    background: var(--gray-2);
    color: var(--text-primary);
    border-color: var(--gray-6);
  }
  .ping:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: var(--radius-round);
    display: inline-block;
    flex-shrink: 0;
  }
  .dot.idle { background: var(--gray-6); }
  .dot.loading {
    background: var(--gray-5);
    animation: pulse 0.8s ease-in-out infinite alternate;
  }
  .dot.ok { background: var(--success); }
  .dot.err { background: var(--error); }
  .info {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    color: var(--text-muted);
    white-space: nowrap;
  }
  .info .ok { color: var(--success); }
  .info .err { color: var(--error); }
  @keyframes pulse {
    from { opacity: 0.4; }
    to { opacity: 1; }
  }
`);

export default class HeroPing extends OpenElement {
  static override styles = [styles];

  apiUrl = '';
  _state: 'idle' | 'loading' | 'ok' | 'err' = 'idle';
  _msg = '';
  private _fetchAbort?: AbortController;

  override connectedCallback(): void {
    super.connectedCallback();
    this._lifecycleSignal().addEventListener('abort', () => this._fetchAbort?.abort(), {
      once: true,
    });
    // DsdElement handles shadow root creation + initial render.
    // Fetch after DOM is ready.
    this._fetch();
  }

  _fetch = async (): Promise<void> => {
    this._fetchAbort?.abort();
    this._fetchAbort = new AbortController();
    this._state = 'loading';
    this._msg = '';
    this._renderToDom();
    try {
      const url = this.apiUrl || 'https://demo.openelement.org/api';
      const r = await fetch(url, { signal: this._fetchAbort.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      this._state = 'ok';
      this._msg = `${d.framework} v${d.version}  ${d.timestamp.slice(11, 19)}`;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const err = e as Error;
      this._state = 'err';
      this._msg = String(e).includes('HTTP') ? err.message : 'connection failed';
    } finally {
      this._renderToDom();
    }
  };

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const dotClass = `dot ${this._state}`;
    const loading = this._state === 'loading';
    return (
      <>
        <span className={dotClass} part='dot-static'></span>
        <button
          type='button'
          className='ping'
          part='dot-animated'
          disabled={loading}
          onClick={this._fetch}
        >
          {loading ? 'pinging...' : 'ping server'}
        </button>
        {this._msg && (
          <span className='info'>
            <span className={this._state}>{this._msg}</span>
          </span>
        )}
      </>
    );
  }

  /** Re-render shadow DOM and re-hydrate click events. */
  private _renderToDom(): void {
    if (!this.shadowRoot) return;
    this.update();
  }
}
