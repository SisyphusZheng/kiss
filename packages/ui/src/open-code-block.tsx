/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-code-block
 *
 * Code block with copy button AND syntax highlighting via Prism.
 *
 * Highlighting contract: the component does NOT bundle a tokenizer. It
 * tokenizes the slotted <pre><code> only when the host page has loaded a
 * global `Prism` (core + the matching language grammar, e.g. from a CDN
 * <script>). Without Prism the block degrades to plain text with the copy
 * button — that is expected, not a bug. See README.md for the script recipe.
 *
 * v0.20.0: Migrated to openElement (Ocean component).
 *   - Self-contained Prism highlighting injected into shadow root
 *   - Copy button uses ElementInternals :state(copied) for CSS feedback
 *   - DSD renders <slot> for SSR (no JS content fallback)
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart copy - The copy button
 *
 * Usage:
 * ```html
 * <open-code-block>
 *   <pre><code>const x = 1;</code></pre>
 * </open-code-block>
 * ```
 */

import { OpenElement } from '@openelement/element';
import type { StyleSheetLike } from '@openelement/element';
import { createLogger } from '@openelement/element';
import { recipe, type RenderResult } from './component-recipes.ts';
export const tagName = 'open-code-block';

const log = createLogger('ui');

const sheet: StyleSheetLike = recipe(`
  :host {
    display: block;
    position: relative;
  }

  pre {
    margin: 0;
    padding: var(--size-5);
    background: var(--bg-code);
    border: var(--border-size-1) solid var(--code-border);
    border-radius: var(--radius-2);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-4);
    color: var(--text-secondary);
    scrollbar-width: thin;
    scrollbar-color: var(--brand-subtle) transparent;
    white-space: pre-wrap;
    word-break: break-word;
  }

  ::slotted(pre) {
    margin: 0;
    padding: var(--size-5);
    background: var(--bg-code);
    border: var(--border-size-1) solid var(--code-border);
    border-radius: var(--radius-2);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-4);
    color: var(--text-secondary);
    scrollbar-width: thin;
    scrollbar-color: var(--brand-subtle) transparent;
  }

  .lang-badge {
    position: absolute;
    top: var(--size-2);
    left: var(--size-3);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
    color: var(--text-muted);
    pointer-events: none;
  }

  .copy-btn {
    position: absolute;
    top: var(--size-2);
    right: var(--size-2);
    background: var(--brand-subtle);
    color: var(--text-muted);
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-00);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-6);
    border: 0.5px solid transparent;
    cursor: pointer;
    border-radius: var(--radius-1);
    transition: all var(--ease-2) var(--duration-2);
    z-index: 1;
    letter-spacing: var(--font-letterspacing-4);
  }

  .copy-btn:hover {
    color: var(--text-primary);
    background: var(--brand-glow);
    border-color: var(--brand);
  }

  :host(:state(copied)) .copy-btn {
    color: #22c55e;
    border-color: rgba(34,197,94,0.3);
    background: rgba(34,197,94,0.08);
  }

  :host(:state(failed)) .copy-btn {
    color: var(--error);
    border-color: var(--error);
  }

  /* Prism token colors (dark theme) */
  .token.cdata, .token.comment, .token.doctype, .token.prolog { color: #6a737d; }
  .token.punctuation { color: #8b949e; }
  .token.namespace { opacity: 0.7; }
  .token.boolean, .token.constant, .token.deleted, .token.number, .token.property, .token.symbol, .token.tag { color: #79c0ff; }
  .token.attr-name, .token.builtin, .token.char, .token.inserted, .token.selector, .token.string { color: #a5d6ff; }
  .token.entity, .token.operator, .token.url, .language-css .token.string, .style .token.string { color: #d2a8ff; }
  .token.atrule, .token.attr-value, .token.keyword { color: #ff7b72; }
  .token.class-name, .token.function { color: #d2a8ff; }
  .token.important, .token.regex, .token.variable { color: #ffa657; }
  .token.bold, .token.important { font-weight: 700; }
  .token.italic { font-style: italic; }
  .token.entity { cursor: help; }
`);

export class OpenCodeBlock extends OpenElement {
  static override styles = [sheet];

  private _copyState: 'idle' | 'copied' | 'failed' = 'idle';
  private _highlightedInShadow = false;
  private _highlightRetries = 0;
  private static MAX_HIGHLIGHT_RETRIES = 120;
  private static COPY_FEEDBACK_MS = 2000;

  override render(): RenderResult {
    return (
      <>
        <slot></slot>
        <button type='button' className='copy-btn' part='copy' onClick={() => this._copy()}>
          Copy
        </button>
      </>
    );
  }

  override onDsdHydrated(): void {
    super.onDsdHydrated();
    this._tryHighlight();
  }

  override onCsrRendered(): void {
    super.onCsrRendered();
    this._tryHighlight();
  }

  private _prismGlobal(): unknown {
    return (globalThis as typeof globalThis & { Prism?: unknown }).Prism;
  }

  private _tryHighlight(): void {
    const p = this._prismGlobal();
    if (typeof p === 'undefined') {
      // Prism not loaded yet: backoff 10, 20, 40, ..., 500ms cap.
      this._scheduleRetry(10, 500);
      return;
    }

    const pre = this.querySelector(':scope > pre') ||
      Array.from(this.children).find((c) => c.tagName === 'PRE');
    if (!pre) return;
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;

    let lang = 'typescript';
    const classes = codeEl.classList;
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].startsWith('language-')) {
        lang = classes[i].slice(9);
        break;
      }
    }

    const raw = codeEl.textContent || '';
    const grammar = (p as Record<string, Record<string, unknown>>).languages?.[lang] as
      | Record<string, unknown>
      | undefined;
    if (!grammar) {
      // Grammar not registered yet: backoff 20, 40, 80, ..., 1000ms cap.
      this._scheduleRetry(20, 1000);
      return;
    }
    this._highlightRetries = 0;
    const highlightedHtml =
      (p as { highlight: (code: string, grammar: unknown, lang: string) => string }).highlight(
        raw,
        grammar,
        lang,
      );
    this._injectHighlighted(highlightedHtml, lang);
  }

  /** Retry _tryHighlight with exponential backoff (base×2ⁿ, 6 steps max, capped). */
  private _scheduleRetry(base: number, cap: number): void {
    if (this._highlightRetries++ < OpenCodeBlock.MAX_HIGHLIGHT_RETRIES) {
      const delay = Math.min(base * Math.pow(2, Math.min(this._highlightRetries, 6)), cap);
      this._setTimeout(() => this._tryHighlight(), delay);
    }
  }

  private _injectHighlighted(html: string, lang: string): void {
    if (!this.shadowRoot || this._highlightedInShadow) return;
    this._highlightedInShadow = true;

    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    const highlightedPre = document.createElement('pre');
    const highlightedCode = document.createElement('code');
    highlightedCode.className = `language-${lang}`;
    highlightedCode.innerHTML = html;
    highlightedPre.appendChild(highlightedCode);
    slot.replaceWith(highlightedPre);

    const lightPre = this.querySelector('pre');
    if (lightPre) (lightPre as HTMLElement).style.display = 'none';
  }

  private _getCodeText(): string {
    if (this.shadowRoot) {
      const shadowCode = this.shadowRoot.querySelector('pre code');
      if (shadowCode) return shadowCode.textContent || '';
    }
    return this.textContent || '';
  }

  private async _copy(): Promise<void> {
    try {
      const text = this._getCodeText();
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      this._internals?.states.add('copied');
      this._internals?.states.delete('failed');
      this._updateCopyButtonDOM();
      this._setTimeout(() => {
        this._copyState = 'idle';
        this._internals?.states.delete('copied');
        this._updateCopyButtonDOM();
      }, OpenCodeBlock.COPY_FEEDBACK_MS);
    } catch (e) {
      log.warn('Clipboard write failed:', e);
      this._internals?.states.add('failed');
      this._internals?.states.delete('copied');
      this._updateCopyButtonDOM();
      this._setTimeout(() => {
        this._copyState = 'idle';
        this._internals?.states.delete('failed');
        this._updateCopyButtonDOM();
      }, OpenCodeBlock.COPY_FEEDBACK_MS);
    }
  }

  private _updateCopyButtonDOM(): void {
    if (!this.shadowRoot) return;
    const btn = this.shadowRoot.querySelector('button.copy-btn');
    if (!btn) return;
    if (this._copyState === 'copied') btn.textContent = 'Copied!';
    else if (this._copyState === 'failed') btn.textContent = 'Failed';
    else btn.textContent = 'Copy';
  }
}
