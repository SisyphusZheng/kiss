/** @jsxImportSource @openelement/element */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';

export const tagName = 'contact-page';

interface ContactActionData {
  error?: string;
  email?: string;
}

/**
 * A request-time route exercising the 0.42 WC Application Loop: plain HTML
 * form works without JavaScript (422 echo / 303 PRG), data-open-enhance
 * morphs the page when JS is present.
 */
export function action(ctx: { formData: FormData }): OpenElementActionFailure<ContactActionData> {
  const email = String(ctx.formData.get('email') ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail(422, { error: 'a valid email is required', email });
  }
  redirect(`/contact?subscribed=${encodeURIComponent(email)}`);
}

const ContactPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Contact — openElement' },
  render({ request }) {
    const actionData = useActionData() as ContactActionData | undefined;
    const subscribed = request ? new URL(request.url).searchParams.get('subscribed') : undefined;
    return (
      <main>
        <h1>Stay in the loop</h1>
        <form method='post' data-open-enhance>
          <input
            id='email'
            name='email'
            type='text'
            value={actionData?.email ?? ''}
            placeholder='you@example.com'
          />
          <button type='submit'>Subscribe</button>
        </form>
        {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
        {subscribed ? <p id='thanks'>subscribed={subscribed}</p> : null}
      </main>
    );
  },
});

// The generated server registers route default exports itself
// (entry-renderer.ts) — route modules never call customElements.define,
// which also keeps the packed-consumer typecheck clean.
export default ContactPage;
