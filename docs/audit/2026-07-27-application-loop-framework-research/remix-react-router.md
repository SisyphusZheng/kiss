---

# Remix / React Router 数据-交互闭环设计调研报告

**背景定位**:Remix 的 loader/action 数据 API 已并入 React Router(官方博客《Remixing React Router》宣布合并，React Router v6.4 数据路由 → v7 framework mode 即"Remix 就是 React Router 的编译器与服务器")。本文以 React Router v7 官方文档为主线，Remix 经典文档作为设计哲学出处。

## 1. Loader / 数据加载

**API 契约**:数据加载是路由模块（Route Module）的命名导出，不是组件内 fetch。

```ts
// route module: team.tsx
export async function loader({ params }: Route.LoaderArgs) {
  return fakeDb.getProduct(params.pid);
}
export default function Product({ loaderData }: Route.ComponentProps) { ... }
```

- 签名为 `loader({ request, params, context })`，context 由 middleware 链注入（`export const middleware = [fn]`,middleware 里 `context.set(key, value)` 后 loader 可读）。
- 返回值是普通对象，框架自动序列化/反序列化；官方明示支持 **promises、Map、Set、Date 等非原始类型**（对齐 RSC 可序列化类型集）。具体序列化协议名未在文档中给出（未证实是否仍为 turbo-stream)。
- loader **只在服务端执行，构建时从客户端 bundle 中物理移除**，可直接用服务端私有 API。
- 预渲染（prerender）时，同一 loader 在**构建时**被调用——同一函数三种执行时机（SSR 请求时 / 客户端导航的自动 fetch / 构建时）。
- 所有匹配嵌套路由的 loader **并行发起**("initiating fetches at nested route boundaries flattens the request waterfall")，这是相对组件内 fetch 的核心论点：消除 render+fetch 链。

**类型流**：框架为每个路由生成 `./+types/route-name` 类型文件，组件 props(`loaderData`/`actionData`/`params`/`matches`）自动类型化，替代 `useLoaderData<typeof loader>()` 手写泛型。

出处：[Route Module](https://reactrouter.com/start/framework/route-module)、[Data Loading](https://reactrouter.com/start/framework/data-loading)、[Remixing React Router](https://remix.run/blog/remixing-react-router)

## 2. Action / 表单

**处理模型**:action 是路由模块的命名导出，只跑在服务端：

```ts
export async function action({ request }: Route.ActionArgs) {
  const data = await request.formData();
  await fakeDb.addItem({ title: data.get('title') });
  return { ok: true };
}
```

**Wire format 是标准 HTML form POST，零框架私有协议**:`<Form method="post">` 默认 `encType="application/x-www-form-urlencoded"`（支持 multipart),action 拿到的就是标准 Web Fetch `Request`,`.formData()` 解出 `FormData`。Form 的 `method` 虽支持 `delete/patch/put`，但官方明确警告："Native `<form>` only supports get and post, avoid the other verbs if you'd like to support progressive enhancement"。

**渐进增强/无 JS 降级**是设计原点而非补丁：

> "Because it uses the HTML form API, server rendered pages are interactive at a basic level before JavaScript loads. Instead of React Router managing the submission, the browser manages the submission as well as the pending states (like the spinning favicon). After JavaScript loads, React Router takes over."

即：无 JS 时浏览器原生 POST → 服务端跑 action → loaders 重跑 → SSR 返回完整 HTML（经典 MPA 循环）;JS 加载后同一表单被拦截为 fetch 提交 + 就地 revalidation。两条路径共用**同一份 action 代码**。

调用方式三档：`<Form>`（导航式，写 history)、`useSubmit`（命令式导航）、`fetcher.Form`/`fetcher.submit`（非导航，不进 history)。action 返回数据经 `actionData` 流回组件——**表单校验错误的推荐路径是 return 而不是 throw**。

出处：[Actions](https://reactrouter.com/start/framework/actions)、[Form API](https://reactrouter.com/api/components/Form)、[Using Fetchers](https://reactrouter.com/how-to/fetchers)

## 3. Error / Redirect 语义

**双层错误语义，边界清晰**:

- **异常路径（throw)**：任何 route module API(loader/action/component/headers/meta）抛出的值，渲染**最近的嵌套 ErrorBoundary**（官方给出嵌套路由→边界的路由表映射）。`throw data("Record Not Found", { status: 404 })` 进入 `isRouteErrorResponse` 分支；`Error` 实例进入 stack 分支。官方明确："Error boundaries are not intended for rendering form validation errors"。
- **预期路径（return)**：校验失败等业务错误作为普通返回值经 `actionData`/`fetcher.data` 回流：`return { ok: false, error: "Title cannot be empty" }`。
- `data()` 工具：`data<D>(payload, init?: number | ResponseInit)`，给返回值附加 status/headers 而不强制包成 Response。
- **redirect 就是一个 Web Fetch Response**:`throw redirect("/login")`（或 return)，默认 302 + Location 头，支持外部 URL（官方提示需校验用户输入）。middleware 里同样 `throw redirect("/login")`。
- **生产错误消毒**：服务端错误发给浏览器前自动去除 stack/敏感信息；`throw data(...)` 的 payload 不消毒（视为有意渲染）。

出处：[Error Boundaries](https://reactrouter.com/how-to/error-boundary)、[data()](https://reactrouter.com/api/utils/data)、[redirect()](https://reactrouter.com/api/utils/redirect)

## 4. Revalidation

**默认策略一句话**:action 完成后，**页面上所有 loader 自动 revalidate**，开发者零代码保持 UI 与服务端同步("When the action completes, all loader data on the page is revalidated to keep your UI in sync without writing any code")。

粒度与优化：

- **默认即安全**：导航时只重跑 params 变化的路由 loader；表单提交或 search param 变化时**保守地全部重跑**("Remix doesn't know which routes need to be reloaded, so it reloads them all to be safe... ensures your UI always stays in sync with the state on your server")。
- **路由级 opt-out**:`export function shouldRevalidate(args)`，参数包括 `actionResult, currentParams, nextParams, currentUrl, nextUrl, formMethod, formAction, formData, formEncType, defaultShouldRevalidate`。典型用法：`actionResult?.ok ? false : defaultShouldRevalidate`，或参数 id 未变时 `return false`。官方反复警告错误使用会导致 UI 与服务器失同步。
- fetcher 的 revalidation 更窄：`fetcher.load` 只在 action 提交后或显式 `useRevalidator()` 时重跑。
- **并发正确性由框架兜底**：用户连点的中断处理、多个 mutation+revalidation 在飞时的竞态，由路由层统一处理（single-flight 语义，出自 Remixing 博客）。
- 所以是"**数据层面整页（路由级）、渲染层面 React diff 细粒度**"的混合：刷新单位是 loader，不是组件，也不是整页 HTML。

出处：[Route Module §shouldRevalidate](https://reactrouter.com/start/framework/route-module)、[Remix shouldRevalidate](https://remix.run/docs/en/main/route/should-revalidate)、[Actions](https://reactrouter.com/start/framework/actions)

## 5. 渲染连续性

- action 之后（有 JS)**不发生页面重载**：客户端原地重渲染，组件保持挂载，React state 自然存活。Remix 状态管理文档的核心论点正是"服务器是唯一事实源，客户端 state 大多只是缓存，而 revalidation 让这层缓存由框架托管，客户端缓存库大多可删"。
- **pending 状态机**:`useNavigation` 暴露 `state`("idle"/"submitting"/"loading")、`formData`、`formAction`;fetcher 有独立的 `fetcher.state`/`fetcher.formData`/`fetcher.data`。无 JS 时等价反馈由浏览器原生提供（转圈的 favicon)。
- **乐观 UI**:`fetcher.formData?.get("title") || data.title` ——提交中的 FormData 即可先渲染下一状态。
- **局部更新机制**:fetcher 系（`fetcher.Form`/`useSubmit`/`Form navigate={false}`）做非导航 mutation；`<ScrollRestoration>` + Form 的 `preventScrollReset` 保滚动位置。
- 注意本质：**连续性来自"客户端重渲染 + vDOM diff + state 存活"这个 React 假设**，不是服务端下发的 partial HTML。

出处：[Remix State Management](https://remix.run/docs/en/main/discussion/state-management)、[Using Fetchers](https://reactrouter.com/how-to/fetchers)、[Form API](https://reactrouter.com/api/components/Form)

## 6. 静态与请求时混合

共存是**框架一等能力**，声明在配置文件而非路由文件：

```ts
// react-router.config.ts
export default {
  ssr: true, // 全局开关；false 即 SPA 模式
  async prerender() { // 返回构建期预渲染的 URL 列表
    return ['/', '/about', '/contact'];
  },
} satisfies Config;
```

- 官方明确："any URLs that aren't pre-rendered will be server rendered as usual, allowing you to pre-render some data at a single route while still server rendering the rest"——**同一条路由可以预渲染部分 URL、SSR 其余**。
- 预渲染产出静态 HTML **加上客户端导航用的数据 payload**，保证后续客户端导航不断链。
- 另有 route 级逃逸口：`clientLoader` 可让单个路由的数据部分绕开 SSR。
- 是否存在路由文件内 `export const prerender` 这类逐路由指令：**未证实**（文档只展示了 config 级 URL 列表机制）。

出处：[Rendering Strategies](https://reactrouter.com/start/framework/rendering)、[Data Loading §Static](https://reactrouter.com/start/framework/data-loading)

## 7. 对 WC/DSD 架构的可迁移性

**可直接迁移（与渲染技术无关，纯 HTTP/契约层）**:

- **路由模块即闭环契约**:loader/action/ErrorBoundary/shouldRevalidate/middleware 全部 co-locate 在一个 route 文件——这套"模块形状"与 React 无关，openElement 的 route 文件可以原样借用，把 default export 换成"返回 DSD 的渲染函数"。
- **Web Fetch API 作为通用语言**:`Request`/`formData()`/`Response`/`redirect()`/`data()`——WC 框架完全可以同构使用，且与 Nitro/h3 的模型天然契合。
- **标准 form POST wire format**:Remix 闭环里最适合无 JS 的部分恰恰最不 React——action 吃的就是原生表单编码。openElement 的"无 JS 可用路径"应当把这个作为不可妥协的底线：服务端契约 = method + URL + FormData。
- **错误二分语义**:throw→最近 error boundary（异常）、return→actionData（校验等预期失败）。这套心智模型与 vDOM 无关。
- **"提交后全量 revalidate 是默认值，shouldRevalidate 是路由级 opt-out"**：对 DSD 甚至是更自然的——服务端反正要重渲整棵路由，"全部 loader 重跑"没有 React 场景下的成本异议，安全默认值直接成立。
- **config 级 prerender URL 列表 + 其余 URL 请求时渲染**：与 static-first 定位完全一致，可直接照抄。

**搬不了 / 需要重新发明（依赖客户端运行时假设）**:

- **渲染连续性的实现机制**:Remix 的"action 后状态不丢"建立在客户端重渲染 + vDOM diff + state 存活之上。DSD + islands 世界里，revalidation 意味着重新取 HTML 并 morph/替换 DOM,Custom Element 的内部 state(open/closed、输入中途值）在 morph 中存活是**另一个问题**，需要 morph 策略（保留已水合元素、按 key/id 匹配）而非 React 式调和。语义可抄，机制必须自建。
- **乐观 UI / pending 状态机**:`useNavigation`/`fetcher.formData` 依赖客户端路由拦截一切提交。openElement 若坚持"JS 可选"，需要一个极小客户端层把 formData→pending UI 的语义提供给 island，而不能假设存在全局 React 树。
- **`+types` 代码生成类型流**：机制可抄（对 route 文件做 typegen)，但它耦合 React Router 的打包器插件；openElement 要在 Vite 插件里自己实现等价物。
- **clientLoader/clientAction 双层**：与"组件在浏览器里续跑"的客户端框架假设绑定，static-first WC 框架大概率只需要 server loader + island 级 fetch 两条路。

## 判断：只抄一样，抄什么

**抄"mutation 之后自动 revalidation"这条闭环默认值本身**——即：action 成功后，页面上所有 loader 数据自动失效并重取，开发者不写一行同步代码；服务器是唯一事实源，UI 与数据的一致性是框架的责任。配套抄它的两个安全细节：(1) 默认保守全量重跑，`shouldRevalidate` 只是路由级优化逃生口；(2) 竞态/中断由框架层兜底。

理由：其余各件（loader 签名、redirect/data 形状、error boundary 二分、prerender 配置）都是这条闭环的推论或配件；而"自动 revalidation"是唯一把 load→render→form→action 从"四个相邻功能"变成"一个环"的设计，并且它是整套 Remix 设计中**对渲染技术依赖最弱的一件**——React 靠 vDOM 实现它，DSD 靠服务端重渲同样能实现它，无 JS 路径更是天然免费获得它（浏览器原生 POST → 重渲整页）。openElement 的 0.42 "WC Application Loop" 要立的正是这条不变量：闭环由框架保证，降级只是换传输，不换契约。

**信息可靠性说明**：以上 API 形状均出自 reactrouter.com / remix.run 官方文档原文（URL 逐项标注）；两处明确"未证实":RR v7 的序列化协议名、是否存在路由文件级 prerender 导出。
