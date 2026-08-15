/**
 * /set-cookie — spike probe (epic #981): can an action write a Set-Cookie
 * header through the request-time entry on the Nitro cloudflare_module
 * output? ADR-0121 forbids returning a Response from an action; this route
 * exists so tools/fullstack-spike-workers.ts records the framework's actual
 * behavior on the generated entry.
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
