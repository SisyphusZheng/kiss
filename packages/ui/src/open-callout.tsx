/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - OpenCallout Component
 *
 * Callout/notice box for inline documentation alerts.
 * Supports 4 types: info, warning, danger, tip.
 * All colors use semantic tokens and respond to theme changes.
 *
 * Usage:
 * ```html
 * <open-callout type="info" label="Note">
 *   This is an informational callout.
 * </open-callout>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { escapeHtml } from '@openelement/element';

export const tagName = 'open-callout';

const TYPE_CONFIG: Record<string, { icon: string; cls: string }> = {
  info: { icon: '\u2139\uFE0F', cls: 'callout--info' },
  warning: { icon: '\u26A0', cls: 'callout--warn' },
  danger: { icon: '\u2715', cls: 'callout--danger' },
  tip: { icon: '\u2713', cls: 'callout--tip' },
};

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .callout {
    padding: var(--size-3) var(--size-4);
    margin: var(--size-3) 0;
    border-left: var(--border-size-2) solid var(--brand);
    background: var(--brand-subtle);
    border-radius: 0 var(--radius-2) var(--radius-2) 0;
  }
  .callout--warn { border-left-color: var(--warning); background: var(--warning-subtle); }
  .callout--danger { border-left-color: var(--error); background: var(--error-subtle); }
  .callout--tip { border-left-color: var(--success); background: var(--success-subtle); }
  :host([data-theme="light"]) .callout--warn { background: rgba(245,158,11,0.06); }
  :host([data-theme="light"]) .callout--danger { background: rgba(239,68,68,0.06); }
  :host([data-theme="light"]) .callout--tip { background: rgba(34,197,94,0.06); }
  .callout-header {
    display: flex; align-items: center; gap: var(--size-1); margin-bottom: var(--size-1);
  }
  .callout-icon { font-size: var(--font-size-0); line-height: 1; flex-shrink: 0; }
  .callout-title {
    font-size: var(--font-size-0); font-weight: var(--font-weight-6); color: var(--text-primary);
  }
  .callout-body {
    font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-secondary);
  }
  .callout-body ::slotted(p) { margin: 0; }
`);

export class OpenCallout extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['type', 'label'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const type = this.getAttribute('type') || 'info';
    const label = this.getAttribute('label') || '';
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

    return (
      <div className={`callout ${config.cls}`} part='container'>
        {label && (
          <div className='callout-header'>
            <span className='callout-icon' part='icon'>{config.icon}</span>
            <span className='callout-title'>{this._esc(label)}</span>
          </div>
        )}
        <div className='callout-body' part='content'>
          <slot></slot>
        </div>
      </div>
    );
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM(): void {
    this.update();
  }
  private _esc = escapeHtml;
}

