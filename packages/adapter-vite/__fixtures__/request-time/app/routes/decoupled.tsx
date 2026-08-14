/**
 * /decoupled — regression fixture for #960 (registration decoupling).
 *
 * The exact failure shape from the issue: a route module exporting
 * `tagName = 'decoupled-view'`, self-registering a CONTENT element under
 * that same tag, and default-exporting a definePage whose render depends on
 * request context. Before the fix the entry registered the page class under
 * 'decoupled-view', the self-registered content element won, and the
 * definePage render was silently bypassed (the marker below never
 * rendered). After the fix the page class registers under the path-derived
 * fallback tag ('decoupled-page') and always renders, wrapping the content
 * element.
 */
import { defineElement, definePage } from '@openelement/app';

export const tagName = 'decoupled-view';

defineElement(tagName, {
  render(props: { marker?: string }) {
    return <p id='decoupled-content'>content element: {props.marker ?? 'no marker'}</p>;
  },
});

const DecoupledPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — decoupled' },
  render({ request }) {
    const marker = request ? new URL(request.url).searchParams.get('marker') : null;
    return (
      <main id='decoupled-page-render'>
        <decoupled-view marker={marker ?? undefined} />
      </main>
    );
  },
});

export default DecoupledPage;
