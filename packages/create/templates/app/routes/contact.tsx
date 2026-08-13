/** @jsxImportSource @openelement/element */
import {
  defineElement,
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import { StyleSheet } from '@openelement/element';

interface ContactActionData {
  error?: string;
  email?: string;
}

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  h1 { font-family: var(--font-serif); font-size: 2.4rem; letter-spacing: -0.015em; margin: 0.75rem 0 0.5rem; font-weight: 700; }
  .sub { color: var(--ink-2); line-height: 1.6; max-width: 52ch; margin: 0 0 1.75rem; }
  form { display: flex; gap: 0.6rem; flex-wrap: wrap; }
  input {
    font: inherit; min-width: 16rem; padding: 0.55rem 0.8rem; color: var(--ink);
    border: 1px solid var(--line); border-radius: 6px; background: #fff;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px #8262db2e; }
  button {
    font: inherit; font-weight: 600; padding: 0.55rem 1.1rem; cursor: pointer;
    border: 1px solid var(--brand); border-radius: 6px; background: var(--brand); color: #fff;
    transition: opacity 0.15s ease;
  }
  button:hover { opacity: 0.88; }
  #error { color: #c92a2a; margin: 1rem 0 0; }
  #thanks { color: var(--brand); font-weight: 600; margin: 1rem 0 0; }
`);

defineElement('contact-form-view', {
  styles,
  render(props: { email?: string; error?: string; subscribed?: string }) {
    return (
      <>
        <h1>Stay in the loop</h1>
        <p class='sub'>
          A request-time route: the plain form works without JavaScript, and morphs in place with
          it.
        </p>
        <form method='post' data-open-enhance>
          <input
            id='email'
            name='email'
            type='text'
            value={props.email ?? ''}
            placeholder='you@example.com'
          />
          <button type='submit'>Subscribe</button>
        </form>
        {props.error ? <p id='error'>{props.error}</p> : null}
        {props.subscribed ? <p id='thanks'>subscribed={props.subscribed}</p> : null}
      </>
    );
  },
});

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
  throw redirect(`/contact?subscribed=${encodeURIComponent(email)}`);
}

const ContactPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Contact — openElement' },
  render({ request }) {
    const actionData = useActionData() as ContactActionData | undefined;
    const subscribed = request ? new URL(request.url).searchParams.get('subscribed') : undefined;
    return (
      <contact-form-view
        email={actionData?.email}
        error={actionData?.error}
        subscribed={subscribed ?? undefined}
      />
    );
  },
});

// The generated server registers route default exports itself
// (entry-renderer.ts) — route modules never call customElements.define,
// which also keeps the packed-consumer typecheck clean.
export default ContactPage;
