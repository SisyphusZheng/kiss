/**
 * /subscribe — valibot validation recipe (0.42.0-alpha.4): same contract as
 * the zod recipe, different library, to prove the loop is library-agnostic.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import * as v from 'valibot';

export const tagName = 'page-subscribe';

const subscribeSchema = v.object({
  email: v.pipe(v.string(), v.email('a valid email is required')),
});

interface SubscribeActionData {
  error?: string;
  email?: string;
}

export function action(ctx: { formData: FormData }): OpenElementActionFailure<SubscribeActionData> {
  const email = String(ctx.formData.get('email') ?? '');
  const parsed = v.safeParse(subscribeSchema, { email });
  if (!parsed.success) {
    return fail(422, {
      error: parsed.issues[0]?.message ?? 'invalid input',
      email,
    });
  }
  throw redirect(`/subscribe?welcome=${encodeURIComponent(parsed.output.email)}`);
}

const SubscribePage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — subscribe (valibot)' },
  render({ request }) {
    const actionData = useActionData() as SubscribeActionData | undefined;
    const welcome = request ? new URL(request.url).searchParams.get('welcome') : undefined;
    return (
      <main>
        <h1>subscribe with valibot</h1>
        <form method='post' data-open-enhance>
          <input id='email' name='email' type='text' value={actionData?.email ?? ''} />
          <button id='subscribe' type='submit'>Subscribe</button>
        </form>
        {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
        <p id='welcome'>welcome={welcome ?? ''}</p>
      </main>
    );
  },
});

customElements.define(tagName, SubscribePage);
export default SubscribePage;
