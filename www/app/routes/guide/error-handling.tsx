export const meta = { section: 'Guide', label: 'Error Handling', order: 80 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import '@openelement/ui/open-code-block';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Error Handling',
    lede: 'Error handling preserves platform semantics and keeps route failures visible.',
    outline: [
      { id: 'return-channel', label: 'fail(): the return channel', level: 3 },
      { id: 'throw-channel', label: 'redirect() and notFound()', level: 3 },
      { id: 'error-definition', label: 'The error definition', level: 3 },
    ],
    previous: { href: '/guide/migration', label: 'Migration' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    cards: [
      {
        id: 'return-channel',
        title: 'fail(): the return channel',
        body:
          'Expected action failures return, never throw: fail(status, data) requires a 4xx status and produces an OpenElementActionFailure. The server answers 422 with the page re-rendered and the submitted values echoed; the page reads the failure via useActionData(). isActionFailure() is the duck-typed guard (ADR-0120).',
      },
      {
        id: 'throw-channel',
        title: 'redirect() and notFound()',
        body:
          'Control flow throws: redirect(location, status) throws OpenElementRedirect — the status is restricted to 301/302/303/307/308, and every 3xx is coerced to 303 in the POST action context (PRG); notFound(message) throws OpenElementNotFound (404). isOpenElementRedirect() and isOpenElementNotFound() match by shape, so the guards survive serialization boundaries.',
      },
      {
        id: 'error-definition',
        title: 'The error definition',
        body:
          'definePage({ error }) is the page-level PageErrorFunction: it receives the render context plus error and renders the failure UI. notFound() and unexpected loader/action throws land here; on the SPA chain a throw is normalized into the same channel instead of silently replacing loader data.',
      },
    ],
    recipeTitle: 'app/routes/posts/[id].tsx',
    recipeNote:
      'redirect() also takes an explicit status (301/302/303/307/308); any other status is rejected at call time. The same guards work on the SPA chain, but SPA loaders/actions receive only { params } (plus formData for actions).',
  },
  zh: {
    breadcrumb: '指南',
    title: '错误处理',
    lede: '错误处理保留平台语义，并让 route 失败保持可见。',
    outline: [
      { id: 'return-channel', label: 'fail()：返回通道', level: 3 },
      { id: 'throw-channel', label: 'redirect() 与 notFound()', level: 3 },
      { id: 'error-definition', label: 'error 定义', level: 3 },
    ],
    previous: { href: '/guide/migration', label: '迁移' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    cards: [
      {
        id: 'return-channel',
        title: 'fail()：返回通道',
        body:
          '预期内的 action 失败走返回而不是抛出：fail(status, data) 要求 4xx 状态码，产出 OpenElementActionFailure。服务器以 422 应答并重渲染页面、回显已提交的值；页面通过 useActionData() 读取失败。isActionFailure() 是鸭子类型守卫（ADR-0120）。',
      },
      {
        id: 'throw-channel',
        title: 'redirect() 与 notFound()',
        body:
          '控制流走抛出：redirect(location, status) 抛出 OpenElementRedirect——状态码限定 301/302/303/307/308，且在 POST action 上下文中一律收敛为 303（PRG）；notFound(message) 抛出 OpenElementNotFound（404）。isOpenElementRedirect() 与 isOpenElementNotFound() 按形状匹配，守卫可以跨越序列化边界存活。',
      },
      {
        id: 'error-definition',
        title: 'error 定义',
        body:
          'definePage({ error }) 是页面级 PageErrorFunction：它接收渲染上下文外加 error，渲染失败 UI。notFound() 与意外的 loader/action 抛出都会落到这里；SPA 链上 throw 会被规整进同一通道，而不是悄悄替换 loader 数据。',
      },
    ],
    recipeTitle: 'app/routes/posts/[id].tsx',
    recipeNote:
      'redirect() 也可显式指定状态码（301/302/303/307/308）；其他状态码在调用时即被拒绝。同样的守卫在 SPA 链上可用，但 SPA 的 loader/action 只拿到 { params }（action 另有 formData）。',
  },
};

export class GuideErrorHandlingPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderAfterCards(t: GuideContent): unknown {
    return (
      <>
        <h3>{t.recipeTitle}</h3>
        <open-code-block>
          <pre><code>{`import {
  definePage,
  fail,
  isOpenElementNotFound,
  notFound,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';

export const tagName = 'page-post';

interface PostActionData {
  error?: string;
  title?: string;
}

export async function loader({ params }: { params: Record<string, string> }) {
  const post = await findPost(params.id); // app data layer
  if (!post) notFound('no such post'); // throws OpenElementNotFound (404)
  return { post };
}

export function action(ctx: { formData: FormData }): OpenElementActionFailure<PostActionData> {
  const title = String(ctx.formData.get('title') ?? '').trim();
  if (title.length < 3) {
    // Expected failure: RETURN fail(4xx, data) — 422 re-render with the echo.
    return fail(422, { error: 'title is too short', title });
  }
  // Success: throw redirect() — coerced to 303 (PRG) in the POST context.
  throw redirect('/posts?saved=1');
}

const PostPage = definePage({
  renderIntent: { mode: 'dynamic' },
  render() {
    const actionData = useActionData() as PostActionData | undefined;
    return (
      <form method='post' data-open-enhance>
        <input name='title' value={actionData?.title ?? ''} />
        <button type='submit'>Save</button>
        {actionData?.error ? <p role='alert'>{actionData.error}</p> : null}
      </form>
    );
  },
  error({ error }) {
    // notFound() and unexpected throws land on the error definition.
    const status = isOpenElementNotFound(error) ? 404 : 500;
    return <main><h1>{status}</h1></main>;
  },
});

customElements.define(tagName, PostPage);
export default PostPage;`}</code></pre>
        </open-code-block>
        <p>{t.recipeNote}</p>
      </>
    );
  }
}

defineCustomElement('guide-error-handling-page', GuideErrorHandlingPage);
export default GuideErrorHandlingPage;
export const tagName = 'guide-error-handling-page';
