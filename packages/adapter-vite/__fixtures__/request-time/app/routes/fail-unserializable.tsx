/**
 * /fail-unserializable — the fetch action channel must answer the author
 * status even when fail() data cannot serialize (circular structure): the
 * native channel re-renders it fine, and a c.json throw would turn a
 * validation failure into a 500. The payload degrades to data:null.
 */
import { definePage, fail, type OpenElementActionFailure } from '@openelement/app';

export function action(
  ctx: { formData: FormData },
): OpenElementActionFailure<unknown> {
  const kind = String(ctx.formData.get('kind') ?? 'circular');
  if (kind === 'undefined') return fail(422, undefined);
  if (kind === 'function') return fail(422, () => 'not serializable');
  if (kind === 'symbol') return fail(422, Symbol('not serializable'));
  const circular: Record<string, unknown> = { error: 'always fails' };
  circular.self = circular;
  return fail(422, circular);
}

export default definePage({
  renderIntent: { mode: 'dynamic' },
  render() {
    return (
      <main>
        <h1>fail-unserializable</h1>
        <form method='post'>
          <button type='submit'>go</button>
        </form>
      </main>
    );
  },
});
