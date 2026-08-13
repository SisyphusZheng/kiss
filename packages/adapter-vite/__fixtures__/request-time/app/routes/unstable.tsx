/**
 * /unstable — render-time failure channel (#943 amendment regression).
 *
 * Every failure mode is thrown from render() (i.e. from inside
 * __renderAppShell), NOT from the loader, because the #943 Cache-Control
 * override used to be emitted before the shell render: a notFound()/
 * redirect()/throw out of render leaked `private, no-cache` onto the
 * 404/3xx/500 response. ADR-0121 section 6 amendment: every error/redirect
 * response keeps the no-store baseline; only a successful 200 GET relaxes.
 *
 * `?kind=` selects the failure channel: `404` (default) throws notFound(),
 * `redirect` throws redirect('/live'). A plain render() throw is NOT a route
 * error — the element SSR layer recovers it inline (#922 control-flow
 * contract) — so the 500 channel is covered by /boom's loader throw.
 */
import { definePage, notFound, redirect } from '@openelement/app';

export const tagName = 'page-unstable';

const UnstablePage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — unstable' },
  render({ request }) {
    const kind = request ? new URL(request.url).searchParams.get('kind') ?? '404' : '404';
    if (kind === 'redirect') redirect('/live');
    notFound('unstable gone');
  },
});

customElements.define(tagName, UnstablePage);
export default UnstablePage;
