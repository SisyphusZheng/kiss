/**
 * /combobox — request-time page for the #1149 Zag composition spike.
 *
 * Hosts:
 * - two shadow/DSD `zag-combobox` islands (machine-id shadow-a / shadow-b)
 *   for the ShadowRoot-scoping and lifecycle evidence;
 * - one light-mode `zag-combobox-light` island inside a native form, proving
 *   form submission semantics (the light input shares the page's tree, so the
 *   POST body carries the selected fruit);
 * - a #move-target container used by the e2e spec for same-turn DOM moves.
 *
 * The action always PRG-redirects with the submitted value so the e2e spec
 * can assert `selected=<fruit>` after a native (unenhanced) POST.
 */
import { definePage, redirect } from '@openelement/app';
import '../islands/zag-combobox.tsx';
import '../islands/zag-combobox-light.tsx';

export const tagName = 'page-combobox';

export function action(ctx: { formData: FormData }): never {
  const fruit = String(ctx.formData.get('fruit') ?? '').trim();
  throw redirect(`/combobox?selected=${encodeURIComponent(fruit)}`);
}

const ComboboxPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — zag combobox' },
  render({ request }) {
    const selected = request ? new URL(request.url).searchParams.get('selected') : undefined;
    return (
      <main>
        <h1>zag combobox spike</h1>
        <section id='shadow-pair'>
          <zag-combobox machine-id='shadow-a'></zag-combobox>
          <zag-combobox machine-id='shadow-b'></zag-combobox>
        </section>
        <form id='fruit-form' method='post'>
          <zag-combobox-light machine-id='light-fruit'></zag-combobox-light>
          <button id='submit-fruit' type='submit'>Submit fruit</button>
        </form>
        <p id='selected-echo'>selected={selected ?? ''}</p>
        <div id='move-target'></div>
      </main>
    );
  },
});

customElements.define(tagName, ComboboxPage);
export default ComboboxPage;
