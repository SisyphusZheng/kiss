/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-lab-panel
 *
 * Standards-lab panel for specs, artifact frames, and reference desks.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { escapeHtml } from '@openelement/element';

export const tagName = 'open-lab-panel';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }

  .panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: var(--panel-min-height, auto);
    overflow: hidden;
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--violet-1) 18%, transparent), transparent 44%),
      var(--bg-card);
    color: var(--text-primary);
    box-shadow: 0 var(--size-2) var(--size-8) color-mix(in srgb, var(--brand) 8%, transparent);
  }

  .panel--muted {
    background: var(--bg-surface);
  }

  .panel--artifact,
  .panel--code {
    background: var(--bg-code, var(--gray-11));
    color: var(--code-text);
    border-color: var(--code-border, var(--gray-8));
  }

  .panel__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-4);
    min-height: var(--size-10);
    padding: var(--size-2) var(--size-4);
    border-bottom: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
  }

  .panel--artifact .panel__bar,
  .panel--code .panel__bar {
    border-bottom-color: var(--code-border, var(--gray-8));
    background: color-mix(in srgb, var(--gray-12) 8%, transparent);
  }

  .panel__label {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    min-width: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .panel--artifact .panel__label,
  .panel--code .panel__label {
    color: var(--gray-5);
  }

  .panel__dot {
    width: var(--size-2);
    height: var(--size-2);
    border-radius: var(--radius-round);
    background: var(--brand);
    box-shadow:
      calc(var(--size-3) * -1) 0 0 var(--warning),
      var(--size-3) 0 0 var(--success);
    margin-inline: var(--size-3) var(--size-2);
    flex: 0 0 auto;
  }

  .panel__meta {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    white-space: nowrap;
  }

  .panel--artifact .panel__meta,
  .panel--code .panel__meta {
    color: var(--gray-6);
  }

  .panel__body {
    min-width: 0;
    padding: var(--size-5);
  }

  :host([compact]) .panel__body {
    padding: var(--size-4);
  }

  ::slotted(*) {
    margin-block-start: 0;
  }
`);

export class OpenLabPanel extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['variant', 'label', 'meta', 'compact'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const variant = this._getStr('variant', 'surface');
    const label = this._getStr('label', '');
    const meta = this._getStr('meta', '');

    return (
      <section className={`panel panel--${variant}`} part='container'>
        {(label || meta) && (
          <header className='panel__bar' part='header'>
            <span className='panel__label'>
              <span className='panel__dot' aria-hidden='true'></span>
              {this._esc(label)}
            </span>
            {meta && <span className='panel__meta'>{this._esc(meta)}</span>}
          </header>
        )}
        <div className='panel__body' part='body'>
          <slot></slot>
        </div>
      </section>
    );
  }

  private _esc = escapeHtml;

  private _getStr(attr: string, def: string): string {
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel] ??
      (this as Record<string, unknown>)[attr];
    if (prop !== undefined && prop !== null) return String(prop);
    return this.getAttribute(attr) || def;
  }
}

export default OpenLabPanel;
