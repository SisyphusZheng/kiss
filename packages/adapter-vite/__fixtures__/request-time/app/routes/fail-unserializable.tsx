/**
 * /fail-unserializable — the fetch action channel must answer the author
 * status even when fail() data cannot serialize (circular structure): the
 * native channel re-renders it fine, and a c.json throw would turn a
 * validation failure into a 500. The payload degrades to data:null.
 */
import { definePage, fail, type OpenElementActionFailure } from '@openelement/app';

interface FailData {
  error?: string;
}

export function action(): OpenElementActionFailure<FailData> {
  const circular: Record<string, unknown> = { error: 'always fails' };
  circular.self = circular;
  return fail(422, circular as FailData);
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
