/** @jsxImportSource @openelement/element */
/**
 * ref-layout — minimal application shell rendered around every route
 * (appShell: { tagName, import } in vite.config.ts).
 */
import { defineCustomElement, OpenElement } from '@openelement/element';

export const tagName = 'ref-layout';

export class RefLayout extends OpenElement {
  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <div>
        <header>
          <a href='/'>OpenElement × Supabase × Cloudflare</a>
        </header>
        <slot></slot>
        <footer>Reference starter — composition only, no framework-owned auth</footer>
      </div>
    );
  }
}

defineCustomElement(tagName, RefLayout);
