/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { MastodonStatus } from '../app/types.ts';

export interface StatusData {
  status?: MastodonStatus;
  ancestors: MastodonStatus[];
  descendants: MastodonStatus[];
  error?: string;
}

export async function loader(ctx: { params?: Record<string, string> }): Promise<StatusData> {
  const id = ctx.params?.id;
  if (!id) return { ancestors: [], descendants: [], error: 'Missing status id' };

  try {
    const [statusRes, contextRes] = await Promise.all([
      fetch(`/api/status/${encodeURIComponent(id)}`),
      fetch(`/api/status/${encodeURIComponent(id)}/context`),
    ]);

    if (!statusRes.ok) {
      return {
        ancestors: [],
        descendants: [],
        error: `${statusRes.status} ${await statusRes.text()}`,
      };
    }

    return {
      status: await statusRes.json() as MastodonStatus,
      ancestors: contextRes.ok
        ? (await contextRes.json() as { ancestors: MastodonStatus[] }).ancestors
        : [],
      descendants: contextRes.ok
        ? (await contextRes.json() as { descendants: MastodonStatus[] }).descendants
        : [],
    };
  } catch (err) {
    return {
      ancestors: [],
      descendants: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const tagName = 'mastodon-status-detail';

export default class StatusPage extends OpenElement {
  override render() {
    const data = (this as unknown) as StatusPage & StatusData;
    const status = data.status;

    return (
      <main class='mastodon-main'>
        <div class='mastodon-page-header'>
          <h1>Status</h1>
        </div>

        {data.error && (
          <div class='mastodon-card' style='border-color: var(--error-fg, #c8392a);'>
            <p class='mastodon-card-title'>Error</p>
            <p class='mastodon-card-body'>{data.error}</p>
          </div>
        )}

        {!status && !data.error && (
          <div class='mastodon-empty'>
            <p class='mastodon-empty-title'>Status not found</p>
          </div>
        )}

        {data.ancestors.map((s) => (
          <article key={s.id} class='mastodon-card'>
            <p class='mastodon-card-title'>{s.account.displayName}</p>
            <p class='mastodon-card-body'>{s.content}</p>
          </article>
        ))}

        {status && (
          <article class='mastodon-card' style='border-color: var(--brand);'>
            <p class='mastodon-card-title'>{status.account.displayName}</p>
            <p class='mastodon-card-body'>{status.content}</p>
          </article>
        )}

        {data.descendants.map((s) => (
          <article key={s.id} class='mastodon-card'>
            <p class='mastodon-card-title'>{s.account.displayName}</p>
            <p class='mastodon-card-body'>{s.content}</p>
          </article>
        ))}
      </main>
    );
  }
}

customElements.define(tagName, StatusPage);
