/**
 * /register — zod validation recipe (0.42.0-alpha.4): the action validates
 * with zod inside the route action; framework stays validation-agnostic.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import { z } from 'zod';

export const tagName = 'page-register';

const registerSchema = z.object({
  email: z.string().email('a valid email is required'),
});

interface RegisterActionData {
  error?: string;
  email?: string;
}

export function action(ctx: { formData: FormData }): OpenElementActionFailure<RegisterActionData> {
  const parsed = registerSchema.safeParse({ email: String(ctx.formData.get('email') ?? '') });
  if (!parsed.success) {
    return fail(422, {
      error: parsed.error.issues[0]?.message ?? 'invalid input',
      email: String(ctx.formData.get('email') ?? ''),
    });
  }
  throw redirect(`/register?welcome=${encodeURIComponent(parsed.data.email)}`);
}

const RegisterPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — register (zod)' },
  render({ request }) {
    const actionData = useActionData() as RegisterActionData | undefined;
    const welcome = request ? new URL(request.url).searchParams.get('welcome') : undefined;
    return (
      <main>
        <h1>register with zod</h1>
        <form method='post' data-open-enhance>
          <input id='email' name='email' type='text' value={actionData?.email ?? ''} />
          <button id='register' type='submit'>Register</button>
        </form>
        {actionData?.error ? <p id='error'>{actionData.error}</p> : null}
        <p id='welcome'>welcome={welcome ?? ''}</p>
      </main>
    );
  },
});

customElements.define(tagName, RegisterPage);
export default RegisterPage;
