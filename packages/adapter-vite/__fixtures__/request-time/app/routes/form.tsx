/**
 * /form — request-time page with an action export.
 *
 * Exercises the ADR-0120 hard rule from its valid side: a route with an
 * action must declare renderIntent mode 'dynamic', and then builds fine.
 */
import { definePage, useActionData } from '@openelement/app';

export const tagName = 'page-form';

interface FormActionData {
  echoed: string;
}

export function action(ctx: { formData: Record<string, unknown> }): FormActionData {
  return { echoed: String(ctx.formData?.message ?? '') };
}

const FormPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — form' },
  render() {
    const actionData = useActionData() as FormActionData | undefined;
    return (
      <main>
        <h1>request-time form</h1>
        <form method='post'>
          <input id='message' name='message' type='text' />
          <button id='submit' type='submit'>Send</button>
        </form>
        <p id='echo'>echo={actionData?.echoed ?? ''}</p>
      </main>
    );
  },
});

customElements.define(tagName, FormPage);
export default FormPage;
