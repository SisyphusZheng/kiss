/**
 * @openelement/ui - Static subpath validation.
 *
 * Verifies that open-button can be rendered through the Element public interface,
 * proving the static/hydrate/csr subpath split is usable for a real UI component.
 */

import { assert } from '@std/assert';
import { renderDsd } from '@openelement/element';
import { OpenButton } from '../src/open-button.tsx';

Deno.test('open-button renders via @openelement/element', async () => {
  const output = await renderDsd('open-button', { componentClass: OpenButton });
  const html = output.html;
  assert(html.includes('<open-button'));
  assert(html.includes('template shadowrootmode'));
  assert(html.includes('btn--default'));
});
