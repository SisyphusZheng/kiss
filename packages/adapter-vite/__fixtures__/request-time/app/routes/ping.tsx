/**
 * /ping — named-only actions route exercising ADR-0121 protocol edges:
 * - 'ping' returns nothing, so the default PRG target (action marker
 *   stripped, other query params kept) is observable; the Ping button is
 *   NAMED, so the enhanced path must include the submitter's name/value in
 *   the body or the action 422s (#544);
 * - 'mv307' redirects with an explicit 307, coerced to 303 on POST;
 * - 'raw' returns a Response — a contract violation, never a response.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';

export const tagName = 'page-ping';

interface PingActionData {
  error?: string;
  intent?: string;
}

export const actions = {
  ping(ctx: { formData: FormData }): OpenElementActionFailure<PingActionData> | void {
    const intent = String(ctx.formData.get('intent') ?? '');
    if (intent !== 'ping') {
      return fail(422, { error: 'intent missing', intent } satisfies PingActionData);
    }
    // Success returns nothing: the default PRG target applies (ADR-0121 §4).
  },
  mv307(): never {
    redirect('/ping?moved=1', 307);
  },
  raw(): Response {
    return new Response('<h1>raw</h1>', {
      headers: { 'content-type': 'text/html' },
    });
  },
};

const PingPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — ping' },
  render({ request }) {
    const actionData = useActionData() as PingActionData | undefined;
    const moved = request ? new URL(request.url).searchParams.get('moved') : undefined;
    return (
      <main>
        <h1>ping page</h1>
        <p id='moved'>moved={moved ?? ''}</p>
        {actionData?.error ? <p id='intent-error'>{actionData.error}</p> : null}
        <form method='post' data-open-enhance>
          <button id='ping' type='submit' name='intent' value='ping' formaction='?/ping'>
            Ping
          </button>
          <button id='mv307' type='submit' formaction='?/mv307'>Move</button>
        </form>
      </main>
    );
  },
});

customElements.define(tagName, PingPage);
export default PingPage;
