/** @jsxImportSource @openelement/core */
/**
 * Example route demonstrating the Fresh-style data layer in the v0.41.0-alpha.6 site.
 *
 * - Loader: fetches data before rendering the page
 * - Action: handles form submissions
 * - useLoaderData / useActionData: hooks to access data in render
 */

import { definePage } from '@openelement/app';
import { useActionData, useLoaderData } from '@openelement/router';
import type { Action, ActionContext, Loader, LoaderContext } from '@openelement/app';

// ─── Types ────────────────────────────────────────────────────────

interface LoaderResult {
  message: string;
  timestamp: string;
}

interface ActionResult {
  ok: boolean;
  name: string | null;
}

// ─── Exports ──────────────────────────────────────────────────────

export const loader: Loader<LoaderResult> = async (ctx: LoaderContext) => {
  return {
    message: 'Hello from the data layer loader!',
    timestamp: new Date().toISOString(),
  };
};

export const action: Action<ActionResult> = async (ctx: ActionContext) => {
  const name = ctx.formData.get('name');
  return {
    ok: true,
    name: typeof name === 'string' ? name : null,
  };
};

// ─── Page ─────────────────────────────────────────────────────────

export default definePage({
  route: { path: '/examples/data' },
  head: {
    title: 'Data Layer Example',
    description: 'Demonstrates loader, action, and data hooks',
  },
  render() {
    const data = useLoaderData<LoaderResult>();
    const actionData = useActionData<ActionResult>();

    return (
      <main
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Data Layer Example</h1>

        <section style={{ marginBottom: '2rem' }}>
          <h2>Loader Data</h2>
          {data
            ? (
              <pre
                style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: '4px',
                }}
              >
              {JSON.stringify(data, null, 2)}
              </pre>
            )
            : <p>No loader data.</p>}
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>Action Form</h2>
          <form method='post' style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              name='name'
              placeholder='Enter your name'
              style={{
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            />
            <button
              type='submit'
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--brand)',
                color: 'var(--brand-contrast)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
          </form>

          {actionData && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: '4px',
              }}
            >
              <strong>Action Result:</strong>
              <pre>{JSON.stringify(actionData, null, 2)}</pre>
            </div>
          )}
        </section>
      </main>
    );
  },
});
