/**
 * @openelement/ui - Static subpath validation.
 *
 * Verifies that open-button can be rendered using only @openelement/core/static,
 * proving the static/hydrate/csr subpath split is usable for a real UI component.
 */

import { assert } from 'jsr:@std/assert@^1.0.0';
import { renderDsd } from '@openelement/core/static';
import { OpenButton } from '../src/open-button.tsx';

Deno.test('open-button renders via @openelement/core/static only', async () => {
  const output = await renderDsd('open-button', { componentClass: OpenButton });
  const html = output.html;
  assert(html.includes('<open-button'));
  assert(html.includes('template shadowrootmode'));
  assert(html.includes('btn--default'));
});
