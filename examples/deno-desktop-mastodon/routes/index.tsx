/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { MastodonStatus } from '../app/types.ts';

export interface TimelineData {
  statuses: MastodonStatus[];
  error?: string;
}

export async function loader(): Promise<TimelineData> {
  try {
    const res = await fetch('/api/timeline?limit=20');
    if (!res.ok) {
      return { statuses: [], error: `${res.status} ${await res.text()}` };
    }
    return { statuses: await res.json() as MastodonStatus[] };
  } catch (err) {
    return { statuses: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export const tagName = 'mastodon-timeline';

export default class TimelinePage extends OpenElement {
  override render() {
    const data = (this as unknown) as TimelinePage & TimelineData;
    const statuses = data.statuses ?? [];

    return (
      <main class='mastodon-main'>
        <div class='mastodon-page-header'>
          <h1>Timeline</h1>
          <p>{statuses.length} statuses</p>
        </div>

        {data.error && (
          <div class='mastodon-card' style='border-color: var(--error-fg, #c8392a);'>
            <p class='mastodon-card-title'>Error</p>
            <p class='mastodon-card-body'>{data.error}</p>
          </div>
        )}

        {statuses.length === 0 && !data.error && (
          <div class='mastodon-empty'>
            <p class='mastodon-empty-title'>Timeline is empty</p>
            <p class='mastodon-empty-hint'>
              Add fixtures to <code>fixtures/timeline.json</code> or switch to live mode with{' '}
              <code>MASTODON_LIVE=true</code>.
            </p>
          </div>
        )}

        {statuses.map((status) => (
          <article key={status.id} class='mastodon-card'>
            <p class='mastodon-card-title'>{status.account.displayName}</p>
            <p class='mastodon-card-body'>{status.content}</p>
          </article>
        ))}
      </main>
    );
  }
}

customElements.define(tagName, TimelinePage);
