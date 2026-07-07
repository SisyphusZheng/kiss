/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { MastodonAccount, MastodonStatus } from '../app/types.ts';

export interface ProfileData {
  account?: MastodonAccount;
  statuses: MastodonStatus[];
  error?: string;
}

export async function loader(ctx: { params?: Record<string, string> }): Promise<ProfileData> {
  const acct = ctx.params?.acct;
  if (!acct) return { statuses: [], error: 'Missing account handle' };

  try {
    const [accountRes, statusesRes] = await Promise.all([
      fetch(`/api/profile/${encodeURIComponent(acct)}`),
      fetch(`/api/profile/${encodeURIComponent(acct)}/statuses`),
    ]);

    if (!accountRes.ok) {
      return { statuses: [], error: `${accountRes.status} ${await accountRes.text()}` };
    }

    return {
      account: await accountRes.json() as MastodonAccount,
      statuses: statusesRes.ok ? await statusesRes.json() as MastodonStatus[] : [],
    };
  } catch (err) {
    return { statuses: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export const tagName = 'mastodon-profile';

export default class ProfilePage extends OpenElement {
  override render() {
    const data = (this as unknown) as ProfilePage & ProfileData;
    const account = data.account;

    return (
      <main class='mastodon-main'>
        <div class='mastodon-page-header'>
          <h1>Profile</h1>
          {account && <p>@{account.acct}</p>}
        </div>

        {data.error && (
          <div class='mastodon-card' style='border-color: var(--error-fg, #c8392a);'>
            <p class='mastodon-card-title'>Error</p>
            <p class='mastodon-card-body'>{data.error}</p>
          </div>
        )}

        {!account && !data.error && (
          <div class='mastodon-empty'>
            <p class='mastodon-empty-title'>Account not found</p>
            <p class='mastodon-empty-hint'>Check the handle and try again.</p>
          </div>
        )}

        {account && (
          <div class='mastodon-card'>
            <p class='mastodon-card-title'>{account.displayName}</p>
            <p class='mastodon-card-body'>{account.note}</p>
            <p class='mastodon-card-body'>
              {account.followersCount} followers · {account.followingCount} following ·{' '}
              {account.statusesCount} posts
            </p>
          </div>
        )}

        {data.statuses.map((status) => (
          <article key={status.id} class='mastodon-card'>
            <p class='mastodon-card-body'>{status.content}</p>
          </article>
        ))}
      </main>
    );
  }
}

customElements.define(tagName, ProfilePage);
