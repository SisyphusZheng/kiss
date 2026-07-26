---

# Fresh (Deno) Application Loop 调研报告

## 0. 定位与总览

Fresh 2 是"Deno 原生 + Preact 渲染 + Islands 水合"的 static-ish-first(实为 request-time-first)全栈框架，构建走 Vite(`@fresh/plugin-vite`)。它的 application loop 不是 Remix/SvelteKit 那种"loader/action 契约"模式，而是**"通用 HTTP handler + `{data}` 约定 + partials 客户端导航"**的组合：数据加载和表单处理共用同一套 `handlers` 导出，靠返回值形状区分语义。

出处：[Introduction](https://fresh.deno.dev/docs)、[Routing](https://fresh.deno.dev/docs/concepts/routing)

## 1. Loader / 数据加载

Fresh **没有独立的 loader 概念**。数据加载就是路由的 `GET` handler，与页面组件同文件：

```ts
export const handlers = define.handlers({
  async GET(ctx) {
    const data = await db.load();
    return { data }; // ← 关键约定：返回 { data } 而非 Response
  },
});

export default define.page<typeof handlers>(function Page(props) {
  return <h1>{props.data.foo}</h1>; // props.data 即 handler 返回的 data
});
```

- **契约形状**:handler 收到 `Context`(`ctx.req`、`ctx.params`、`ctx.url`、`ctx.state`、`ctx.route` 等),返回 `{ data: T }` 时 Fresh 用该数据渲染同文件默认导出的 page 组件；返回 `Response` 则跳过渲染直接响应（如重定向、JSON API)。
- **类型流**:`define.page<typeof handlers>` 用 TS 泛型把 handler 返回类型注入组件的 `props.data`，纯编译期推断，无 codegen。
- 另一条数据通道是 middleware 写 `ctx.state`，经 `props.state` 传给 layout/page(适合用户会话等横切数据)。

出处：[Define Helpers](https://fresh.deno.dev/docs/advanced/define)、[Context](https://fresh.deno.dev/docs/concepts/context)、[Layouts](https://fresh.deno.dev/docs/concepts/layouts)

## 2. Action / 表单

Fresh **没有 action 抽象**,wire format 就是**浏览器原生 form 语义**:

- 标准 `<form method="post">` → `application/x-www-form-urlencoded`（或 `multipart/form-data` 文件上传）POST 到同 URL；
- 同文件的 `POST(ctx)` handler 里 `await ctx.req.formData()` 读数据，处理完返回 `Response(null, { status: 303, headers: { location: "/thanks" } })` 或返回 `{ data: { message } }` 原地重渲染并显示错误/成功消息。
- **无 JS 路径是默认路径**：文档原话是"For stronger resiliency and user experience, Fresh relies on native browser support for form submissions"——整个表单模型在无 JS 下完整可用，没有任何框架约定字段（没有 `_action`、没有隐藏 input 路由）。
- 有 JS 时，`f-client-nav` 作用域内的 `<form>`/`<button>` 提交会被 Fresh 的 client nav 拦截改为 fetch,partial 响应直接打补丁（见第 5 节）。

出处：[Forms](https://fresh.deno.dev/docs/advanced/forms)、[Partials(f-partial 支持 form/button)](https://fresh.deno.dev/docs/advanced/partials)

## 3. Error / Redirect 语义

- **Redirect**:`ctx.redirect(url, status?)`，默认 302，可传 307；表单场景官方示例用裸 `Response` + 303(See Other)。没有"throw redirect"式的控制流，redirect 是返回值不是异常。
- **Error**:
  - handler 抛任意异常 → `app.onError(pattern, cb)` 捕获，`ctx.error` 可拿到抛出的值，支持按路径前缀嵌套 error page;
  - `throw new HttpError(status, message?)`(from `fresh`)→ 走 error handler，可在 handler 里 `ctx.error instanceof HttpError` 取 status;
  - 404 有专属 `app.notFound(cb)`（不可嵌套）;
  - 文件路由层面对应 `_error.tsx` 等约定（错误页拿到 `ctx.error`)。
- 表单校验失败的形状：没有 `fail()`/`error()` 契约，惯例是 POST handler 直接 `return { data: { message: "..." } }` 让页面原地重渲染显示错误。

出处：[Error handling](https://fresh.deno.dev/docs/advanced/error-handling)、[Context(.redirect/.error)](https://fresh.deno.dev/docs/concepts/context)、[Forms](https://fresh.deno.dev/docs/advanced/forms)

## 4. Revalidation

**Fresh 没有 server-data revalidation 概念**（无 stale-while-revalidate、无按路由失效标记）。它的答案是：

- action 成功 → 惯例是 **303 redirect**(Post/Redirect/Get)，让浏览器自然重新 GET 整页或目标页——revalidation 由 HTTP 语义承担；
- 或返回 `{ data }` 原地重渲染，数据本来就是本次请求新算的；
- 有 JS 时，client nav 每次导航/提交都会重新向服务端 fetch 最新 HTML(partial 或整页），即"每次交互都是请求时渲染，没有客户端数据缓存层需要失效"。

细粒度刷新靠 partials（下节），不是靠数据层失效。是否计划引入更细的数据级 revalidate:**未见官方文档，未证实**。

## 5. 渲染连续性：Partials

这是 Fresh 最有特色的一块，机制完全在 HTML 层：

- `<body f-client-nav>` 开启客户端导航；页面上用 `<Partial name="docs-content">` 标记可替换区域（name 全局唯一）。
- 点击 `<a>`(或提交 `<form>`）时，Fresh 拦截 → fetch 新页完整 HTML → 按 name 匹配提取对应 Partial 内容 → 只替换当前页匹配区域。**未匹配区域的 DOM 原样保留，其中的 island 状态不丢**；被替换区域内的 island 会重新挂载（状态丢失——此为从 DOM 替换机制的推断，文档未明确说明，**未证实**)。
- 优化：`<a f-partial="/partials/docs/routes">` 让服务端只渲染该 partial（配合 `RouteConfig { skipAppWrapper, skipInheritedLayouts }`),href 仍是真实 URL，浏览器地址栏照常更新。
- 一次响应可携带多个 Partial（如同时更新购物车和总价）;`mode="replace|prepend|append"` 控制替换方式（prepend/append 要求 `key`)。
- 加载指示：给触发元素挂 `_freshIndicator = signal`,Fresh 在请求期间置 `value = true/false`（支持 submitter 优先、form 兜底）。
- `f-view-transition` 开启 View Transitions 动画；`f-client-nav={false}` 可局部禁用。
- 客户端导航中遇到服务端 redirect 的具体行为（自动整页跳转 vs 跟随）:**官方文档未明确，未证实**。

出处：[Partials](https://fresh.deno.dev/docs/advanced/partials)

## 6. 静态与请求时混合

- Fresh 是**请求时渲染为默认、静态仅限资源**的模型：`staticFiles()` middleware 以流式 + ETag 伺服 `static/` 目录资源；构建期经 Vite 处理的 import 资产带 content hash + 1 年缓存（`asset()`/`assetSrcSet()` 手动加指纹）。
- **没有 per-route 的 prerender/SSG 声明**(RouteConfig 只有 `routeOverride`、`skipAppWrapper`、`skipInheritedLayouts`、`css` 等）。静态页面与动态路由的"混合"实际是：静态资源走文件，所有路由都走 handler——这一点与 openElement 的 static-first 定位有本质差异。官方文档未见任何路由级静态生成能力，若存在实验性功能**未证实**。
- 路由匹配本身：静态路径（精确匹配）优先于动态 `:param` 模式，动态按注册顺序先到先得。

出处：[Static files](https://fresh.deno.dev/docs/concepts/static-files)、[Routing](https://fresh.deno.dev/docs/concepts/routing)、[File routing](https://fresh.deno.dev/docs/concepts/file-routing)

## 7. 对 openElement(WC + DSD）的可迁移性

**可以直接搬的（与渲染技术无关的 HTML/HTTP 层思想）**:

- **`{ data }` 约定 + `typeof handlers` 类型流**:GET handler 返回 `{ data }`、POST 返回 `Response`(303）或 `{ data }`，同一份契约驱动 SSR 渲染。这个约定完全可以用在 CE 组件的 `load()` → DSD render 管线上，类型推断也成立。
- **原生 form + 303 为默认路径**：不发明 wire format、不发明 action 协议，无 JS 天然可用——与 openElement 的 static-first/DSD 哲学高度同构。
- **Partials 的"声明式属性 + name 匹配"协议**:`f-client-nav` / `f-partial` / `mode="append"` 是**纯 HTML attribute 协议**，与 Preact 无关。openElement 完全可以定义自己的 `oe-client-nav`、`oe-partial`，在 DSD 输出上按 name 做 DOM 替换。这是最值得搬的东西。
- **HttpError + 分层 error page、ctx.redirect()**：返回值式 redirect + 异常式 error 的双轨语义干净且 HTTP 原生。
- **middleware 链 + ctx.state**：横切数据通道，无框架绑定。

**搬不了或需要重写的**:

- **Partial 更新的 DOM 替换实现**:Fresh 的实现依赖 Preact 客户端渲染器做 vnode diff、island 重挂载和 props 反序列化。换成 DSD,partial 内容里含 `<template shadowrootmode>` 时需要自行处理 shadow root 附着、CE 升级时序与已水合组件的状态保留（DSD 下"替换区域外的 CE 状态不丢"这一性质依然成立，因为 DOM 没动；但替换区域内的 CE 重新定义/升级策略要新设计）。
- **island props 序列化协议**（支持 Signal、循环引用等）绑定 Preact signals,openElement 的属性/attribute 模型不同。
- **`_freshIndicator` 的 signal 驱动 loading UI** 依赖 Preact signals 自动重渲染；WC 下需用 CE 属性或 CSS 状态类重做。

## 如果只抄一样

**抄 Partials 协议本身，而不是它的实现**——即"`f-client-nav` 声明式开启 + `<Partial name>` 按名匹配局部替换 + `f-partial` 可选优化端点 + 一次响应多 partial + `mode=append/prepend`"这套**纯 HTML attribute 契约**。理由：openElement 的 0.42 闭环里，loader/form/action/error/redirect 用标准 HTTP 语义就能闭合，真正缺的是"action/导航之后如何不重载整页、又不假设虚拟 DOM"的渲染连续性方案；Fresh 恰好证明了这件事可以在 HTML 层以声明式协议表达，与渲染器解耦——它是本次调研的七个维度中唯一一个既成熟、又对 WC/DSD 完全可移植的设计。抄协议（含 `mode`、多 partial、loading 指示、View Transitions 钩子）,DOM 替换与 CE 状态保留的实现自己写。

---

### 出处汇总

- [Introduction](https://fresh.deno.dev/docs) / [Routing](https://fresh.deno.dev/docs/concepts/routing) / [File routing](https://fresh.deno.dev/docs/concepts/file-routing)
- [Context](https://fresh.deno.dev/docs/concepts/context) / [Middlewares](https://fresh.deno.dev/docs/concepts/middleware) / [Layouts](https://fresh.deno.dev/docs/concepts/layouts)
- [Define Helpers(数据类型流)](https://fresh.deno.dev/docs/advanced/define)
- [Forms](https://fresh.deno.dev/docs/advanced/forms) / [Partials](https://fresh.deno.dev/docs/advanced/partials) / [Error handling](https://fresh.deno.dev/docs/advanced/error-handling)
- [Islands](https://fresh.deno.dev/docs/concepts/islands) / [Static files](https://fresh.deno.dev/docs/concepts/static-files)

标注"未证实"的三处：client nav 中遇 redirect 的行为、被替换 partial 内 island 状态是否保留、是否存在路由级 SSG/数据级 revalidation——均因官方文档无记载，建议需要时读 `jsr:@fresh/core` 运行时代码确认。本地 `examples/open-element-in-fresh/` 已证明 openElement CE 可在 Fresh 服务端路由中以原生标签渲染、与 Preact island 共存，反向印证了第 7 节的迁移判断。
