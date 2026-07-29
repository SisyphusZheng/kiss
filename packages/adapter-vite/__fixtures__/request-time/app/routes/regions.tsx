/**
 * /regions — data-open-region / data-open-preserve morph semantics
 * (ADR-0121 §8): the form is scoped to its nearest ancestor region; the
 * preserved subtree survives untouched; a form targeting a missing region
 * falls back to a full navigation.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import '../islands/live-counter.tsx';

export const tagName = 'page-regions';

interface RegionActionData {
  error?: string;
  message?: string;
}

export function action(
  ctx: { formData: FormData },
): OpenElementActionFailure<RegionActionData> {
  const message = String(ctx.formData.get('message') ?? '').trim();
  if (!message) {
    return fail(422, { error: 'message is required', message } satisfies RegionActionData);
  }
  throw redirect(`/regions?echoed=${encodeURIComponent(message)}`);
}

const RegionsPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — regions' },
  render({ request }) {
    const actionData = useActionData() as RegionActionData | undefined;
    const echoed = request ? new URL(request.url).searchParams.get('echoed') : undefined;
    return (
      <main>
        <div data-open-region='banner'>
          <p id='banner'>echo={echoed ?? ''}</p>
        </div>
        <section data-open-region='form-area'>
          <form method='post' data-open-enhance>
            <input
              id='message'
              name='message'
              type='text'
              value={actionData?.message ?? ''}
            />
            <button id='submit' type='submit'>Send</button>
            <button id='missing' type='submit' data-open-region-target='no-such-region'>
              Send to missing region
            </button>
          </form>
          {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
          <div id='preserved' data-open-preserve>
            <details id='preserved-details'>
              <summary>keep me</summary>
              secret
            </details>
          </div>
        </section>
        <live-counter></live-counter>
      </main>
    );
  },
});

customElements.define(tagName, RegionsPage);
export default RegionsPage;
