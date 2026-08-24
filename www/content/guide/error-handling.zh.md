---
title: '错误处理'
lede: '错误处理保留平台语义，并让 route 失败保持可见。'
order: 80
---

## fail()：返回通道

预期内的 action 失败走返回而不是抛出：`fail(status, data)` 要求 4xx 状态码，产出 `OpenElementActionFailure`。服务器以 `fail()` 的状态码（惯例为 422）应答并重渲染页面、回显已提交的值；页面通过 `useActionData()` 读取失败。`isActionFailure()` 是鸭子类型守卫（ADR-0120）。增强表单只 morph 200/422 响应(#973)：非 422 的 4xx 会退化为整页导航——该路径上失败回显丢失,因此校验失败请保持在 422。

## redirect() 与 notFound()

控制流走抛出：`redirect(location, status)` 抛出 `OpenElementRedirect`——状态码限定 301/302/303/307/308，且在 POST action 上下文中一律收敛为 303（PRG）；`notFound(message)` 抛出 `OpenElementNotFound`（404）。`isOpenElementRedirect()` 与 `isOpenElementNotFound()` 按形状匹配，守卫可以跨越序列化边界存活。

## error 定义

`definePage({ error })` 是页面级 `PageErrorFunction`：它接收渲染上下文外加 `error`，渲染失败 UI。`notFound()` 与意外的 loader/action 抛出都会落到这里；SPA 链上 throw 会被规整进同一通道，而不是悄悄替换 loader 数据。在程序化 action 通道（`x-openelement-action: true`）上，错误结果以 RFC 9457 Problem Details 应答（`application/problem+json`，字段 `type`/`title`/`status`/`detail`），取代此前的自定义 JSON 封装（#863，ADR-0123）；ADR-0122 已冻结该线格式。

### app/routes/posts/[id].tsx

```ts
import {
  definePage,
  fail,
  isOpenElementNotFound,
  notFound,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';

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

export default PostPage;
```

`redirect()` 也可显式指定状态码（301/302/303/307/308）；其他状态码在调用时即被拒绝。同样的守卫在 SPA 链上可用，但 SPA 的 loader/action 只拿到 `{ params }`（action 另有 `formData`）。
