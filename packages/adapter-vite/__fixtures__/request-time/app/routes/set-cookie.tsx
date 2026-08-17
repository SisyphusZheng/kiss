/**
 * /set-cookie — edge-case probe: an action that returns a raw `Response`
 * (bypassing the ADR-0121 channel contract) with a Set-Cookie header on the
 * request-time entry. Documents the framework's actual behavior on the
 * generated entry.
 */
import { definePage } from '@openelement/app';

export const tagName = 'page-set-cookie';

export function action(): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location: '/ping',
      'set-cookie': 'spike=1; Path=/; HttpOnly; SameSite=Lax',
    },
  });
}

const SetCookiePage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — set-cookie' },
  render() {
    return (
      <main>
        <h1>set-cookie probe</h1>
      </main>
    );
  },
});

customElements.define(tagName, SetCookiePage);
export default SetCookiePage;
