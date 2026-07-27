/**
 * /item/:id — request-time param route (#556).
 *
 * Proves the generated host matcher dispatches concrete pathnames ('/item/42')
 * to the ':param' route pattern: the loader echoes params.id per request, and
 * the action exercises the full protocol on a parameterized URL — empty note
 * -> fail(422) re-render; valid note -> 303 PRG back to the same item.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';

export const tagName = 'page-item';

interface ItemData {
  id: string;
}

interface ItemActionData {
  error?: string;
  note?: string;
}

export function loader(ctx: { params: Record<string, string> }): ItemData {
  return { id: ctx.params.id ?? '' };
}

export function action(ctx: {
  params: Record<string, string>;
  formData: FormData;
}): OpenElementActionFailure<ItemActionData> {
  const note = String(ctx.formData.get('note') ?? '').trim();
  if (!note) {
    return fail(422, { error: 'note is required', note } satisfies ItemActionData);
  }
  redirect(`/item/${encodeURIComponent(ctx.params.id)}?noted=${encodeURIComponent(note)}`);
}

const ItemPage = definePage<ItemData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — item' },
  render({ data, request }) {
    const actionData = useActionData() as ItemActionData | undefined;
    const noted = request ? new URL(request.url).searchParams.get('noted') : undefined;
    return (
      <main>
        <h1>request-time item</h1>
        <p id='item-id'>id={data?.id ?? ''}</p>
        <form method='post' data-open-enhance>
          <input id='note' name='note' type='text' value={actionData?.note ?? ''} />
          <button id='submit' type='submit'>Save</button>
        </form>
        {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
        <p id='noted'>noted={noted ?? ''}</p>
      </main>
    );
  },
});

customElements.define(tagName, ItemPage);
export default ItemPage;
