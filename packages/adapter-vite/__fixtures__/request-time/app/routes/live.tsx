/**
 * /live — request-time rendered page (renderIntent mode 'dynamic').
 *
 * The loader derives data from the incoming request (query param `x`) and a
 * per-process counter, so two requests must never return identical HTML.
 * A counter island verifies hydration behaves the same as on static pages.
 */
import { definePage } from '@openelement/app';
import '../islands/live-counter.tsx';

export const tagName = 'page-live';

interface LiveData {
  x: string;
  nonce: number;
}

let requestCounter = 0;

export function loader(ctx: { request: Request }): LiveData {
  const url = new URL(ctx.request.url);
  requestCounter += 1;
  return {
    x: url.searchParams.get('x') ?? '',
    nonce: requestCounter,
  };
}

const LivePage = definePage<LiveData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — live' },
  render({ data }) {
    return (
      <main>
        <h1>request-time live</h1>
        <p id='x-value'>x={data?.x ?? ''}</p>
        <p id='nonce'>nonce={data?.nonce ?? 0}</p>
        <live-counter></live-counter>
      </main>
    );
  },
});

customElements.define(tagName, LivePage);
export default LivePage;
