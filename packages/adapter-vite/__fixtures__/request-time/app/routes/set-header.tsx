/**
 * /set-header — ADR-0129 response-header channel: the loader and the action
 * append to context.responseHeaders and the generated entry merges the
 * channel into every response of the request (render, redirect, re-render),
 * with protocol headers winning on conflict.
 */
import { definePage, fail, type OpenElementActionFailure, redirect } from '@openelement/app';

interface ChannelActionData {
  error?: string;
}

export function action(ctx: {
  formData: FormData;
  responseHeaders: Headers;
}): OpenElementActionFailure<ChannelActionData> {
  const mode = String(ctx.formData.get('mode') ?? '');
  if (mode === 'fail') {
    ctx.responseHeaders.append('x-oe-channel', 'action-422');
    return fail(422, { error: 'channel fail' } satisfies ChannelActionData);
  }
  // The login shape: cookie written by the action, then PRG redirect.
  ctx.responseHeaders.append('set-cookie', 'oe_session=stub-ok; HttpOnly; Path=/; SameSite=Lax');
  ctx.responseHeaders.append('x-oe-channel', 'action-redirect');
  throw redirect('/set-header?done=1');
}

export function loader(ctx: { responseHeaders: Headers }): void {
  ctx.responseHeaders.append('x-oe-channel', 'loader-render');
  // Protocol headers always win: this must NOT override no-store.
  ctx.responseHeaders.append('cache-control', 'public, max-age=3600');
}

export default definePage({
  renderIntent: { mode: 'dynamic' },
  render({ request }: { request?: Request }) {
    const done = request ? new URL(request.url).searchParams.get('done') : undefined;
    return (
      <main>
        <h1>set-header</h1>
        {done ? <p id='done'>done={done}</p> : null}
        <form method='post'>
          <button type='submit'>go</button>
        </form>
      </main>
    );
  },
});
