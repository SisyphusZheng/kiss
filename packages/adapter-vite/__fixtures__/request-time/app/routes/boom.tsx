/**
 * /boom — error-boundary parity (ADR-0121 §7): the loader always throws,
 * and the page declares an error component. GET and POST must both render
 * the boundary with status 500 (POST parity is the alpha.5 fix).
 */
import { definePage, fail, type OpenElementActionFailure } from '@openelement/app';

export const tagName = 'page-boom';

export function loader(): never {
  throw new Error('boom-loader');
}

export function action(): OpenElementActionFailure<{ note: string }> {
  // Validation failure: the fail path re-runs the loader, which throws —
  // the POST must render the error boundary, not a bare 500.
  return fail(422, { note: 'validated' });
}

export const actions = {
  explode(): never {
    // A thrown action: the exception channel (boundary / scrubbed JSON).
    throw new Error('boom-action');
  },
};

const BoomPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — boom' },
  render() {
    return (
      <main>
        <h1>boom page</h1>
        <form method='post' data-open-enhance>
          <button id='boom-submit' type='submit'>Boom</button>
        </form>
      </main>
    );
  },
  error({ error }) {
    return (
      <main>
        <h1 id='boundary'>boom boundary: {String((error as Error)?.message ?? error)}</h1>
        <form method='post' data-open-enhance>
          <button id='boom-submit' type='submit'>Boom</button>
        </form>
      </main>
    );
  },
});

customElements.define(tagName, BoomPage);
export default BoomPage;
