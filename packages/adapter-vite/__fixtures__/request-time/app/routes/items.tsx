/**
 * /items — identity-matched islands in a dynamic list (ADR-0121 §9): each
 * row carries a stable id, so prepending a row morphs the list without
 * resetting the existing islands' state.
 */
import { definePage, redirect } from '@openelement/app';
import '../islands/live-counter.tsx';

export const tagName = 'page-items';

export function loader(ctx: { request: Request }): { items: string[] } {
  const url = new URL(ctx.request.url);
  return { items: (url.searchParams.get('items') ?? 'a,b').split(',') };
}

export function action(ctx: { formData: FormData }): never {
  const items = String(ctx.formData.get('items') ?? 'a,b');
  throw redirect(`/items?items=${encodeURIComponent('new,' + items)}`);
}

export const actions = {
  reverse(ctx: { formData: FormData }): never {
    const items = String(ctx.formData.get('items') ?? 'a,b').split(',');
    throw redirect(`/items?items=${encodeURIComponent(items.reverse().join(','))}`);
  },
};

const ItemsPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — items' },
  render({ data }) {
    return (
      <main>
        <form method='post' data-open-enhance>
          <input type='hidden' name='items' value={data.items.join(',')} />
          <button id='prepend' type='submit'>Prepend</button>
          <button id='reverse' type='submit' formaction='?/reverse'>Reverse</button>
        </form>
        <ul>
          {data.items.map((id) => (
            <li id={`row-${id}`}>
              <live-counter></live-counter>
            </li>
          ))}
        </ul>
      </main>
    );
  },
});

customElements.define(tagName, ItemsPage);
export default ItemsPage;
