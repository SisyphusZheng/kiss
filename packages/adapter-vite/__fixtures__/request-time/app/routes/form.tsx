/**
 * /form — request-time page exercising the ADR-0120 action protocol:
 * - empty submission -> fail(422, data) -> 422 re-render with the echo;
 * - valid submission -> redirect (PRG) with the value in the URL;
 * - named action 'shout' via formaction='?/shout'.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import '../islands/live-counter.tsx';

export const tagName = 'page-form';

interface FormActionData {
  error?: string;
  message?: string;
}

export function action(ctx: { formData: FormData }): OpenElementActionFailure<FormActionData> {
  const message = String(ctx.formData.get('message') ?? '').trim();
  if (!message) {
    return fail(422, { error: 'message is required', message } satisfies FormActionData);
  }
  redirect(`/form?echoed=${encodeURIComponent(message)}`);
}

export const actions = {
  shout(ctx: { formData: FormData }): never {
    const message = String(ctx.formData.get('message') ?? '').trim() || 'silence';
    redirect(`/live?x=${encodeURIComponent(message.toUpperCase())}`);
  },
};

const FormPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — form' },
  render({ request }) {
    const actionData = useActionData() as FormActionData | undefined;
    const echoed = request ? new URL(request.url).searchParams.get('echoed') : undefined;
    return (
      <main>
        <h1>request-time form</h1>
        <form method='post' data-open-enhance>
          <input
            id='message'
            name='message'
            type='text'
            value={actionData?.message ?? ''}
          />
          <button id='submit' type='submit'>Send</button>
          <button id='shout' type='submit' formaction='?/shout'>Shout</button>
        </form>
        {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
        <p id='echo'>echo={echoed ?? ''}</p>
        <live-counter></live-counter>
      </main>
    );
  },
});

customElements.define(tagName, FormPage);
export default FormPage;
