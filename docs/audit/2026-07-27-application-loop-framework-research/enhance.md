---

# Enhance (enhance.dev) Application Loop 竞品调研报告

调研方式：通读 Enhance 官方文档源码（`enhance-dev/enhance.dev` 仓库 `app/docs/md/`）、官方博客、以及 `enhance-auth`、`enhance-store`、`enhance-router`、`architect/functions` 等一手源码。所有结论均附出处；未能证实的点已明确标注。

## 0. 框架心智模型（理解其余一切的前提）

Enhance 是 **MPA + SSR-first** 框架：没有虚拟 DOM、没有客户端 hydration 整页接管，整页在请求时由服务端渲染，交互靠"按需增强"的 Custom Element 小岛。其闭环哲学在官方博客里讲得很直白：

> "This means using real `<form>`s, anchors, and storing state where the platform does (i.e. in the URL)." — [Client side State Management with Enhance (2023-11-30)](https://enhance.dev/blog/posts/2023-11-30-clientside-state-management)

三层代码组织对应三种能力（[conventions/structure 见文档目录](https://enhance.dev/docs/conventions/structure)）：

- `app/pages/` — 文件路由的页面（`.html` 或 `.mjs`）
- `app/api/` — 与页面同路径的数据/动作函数（这是 loader 和 action 的统一体）
- `app/elements/` — SSR-only 纯函数组件；`app/components/` — 同构（SSR + 客户端 hydrate）组件类

---

## 1. Loader / 数据加载

**机制：与页面同路径的 API route，HTTP 动词即导出名。** `app/api/todos.mjs` 自动给 `app/pages/todos.html` 供数；handler 在页面渲染**之前**执行，返回的 `json` 注入全局 store，页面内所有元素通过 `state.store` 读取。

API 契约形状（[API Routes 文档](https://enhance.dev/docs/routing/api-routes)）：

```javascript
// app/api/index.mjs
export async function get(req) {
  return {
    json: { favorites: ['coffee crisp', 'smarties'] },
  };
}
```

- **函数签名**：`async function get(req)`，命名导出，动词支持 `get/post/put/patch/destroy`。
- **req 对象**:`{ body, headers, method, params, path, query, session }`(`params` 来自 `$id.mjs` 动态段；`session` 是 HttpOnly cookie 会话的读视图）。
- **返回对象**:`{ json, location, statusCode, cacheControl, headers, session }`。
- **中间件**：动词可以导出为数组 `export const get = [one, two]`，顺序执行，任一函数 return 响应即短路（[Middleware 文档](https://enhance.dev/docs/routing/api-routes/middleware)）。

**类型如何流到组件**：不自动流。数据进 `store` 后，元素函数签名 `({ html, state }) => …` 中 `state` 有四个键：`attrs / store / instanceID / context`([State 文档](https://enhance.dev/docs/elements/state))。类型靠 `@enhance/types` 的 JSDoc 注解（`EnhanceApiFn`、`EnhanceElemFn`、`EnhanceHeadFn`）手工标注，没有从 loader 到组件 props 的类型推导/codegen([Type Definitions 文档](https://enhance.dev/docs/configuration/types))。

**全局默认数据**:`app/preflight.mjs` 导出 `async function Preflight({ req })`，其返回值先填充 store,API route 的 `json` 再覆盖合并——典型用途是多页共享的登录态（[Preflight 文档](https://enhance.dev/docs/conventions/preflight)）。

请求生命周期完整描述见 [Enhance Lifecycle](https://enhance.dev/docs/routing/lifecycle)：先匹配 API 函数 → 再渲染 Page → 收集元素 `<style>` 滚动到 head、`<script>` 插到 body 末尾。

## 2. Action / 表单

**处理模型：标准 HTML form POST 回同一路由的 `post` handler——action 与 loader 是同一个文件的不同动词导出。** 官方明确建议："API routes should always export both `get` and `post` handlers"([API Routes](https://enhance.dev/docs/routing/api-routes))。

**wire format 是双模的，靠内容协商区分**:

- 无 JS：浏览器原生 `application/x-www-form-urlencoded` POST,`req.body` 已是解析好的对象；响应是整页 HTML(302 redirect 或同页重渲染）。
- 有 JS:`fetch` + `Accept: application/json` 头，**打到同一个 URL、同一个 handler**，拿到纯 JSON。官方原话："set your request's `accept` header to `application/json`. This is all you need to do to receive JSON data from your API route on the client!"([API Routes](https://enhance.dev/docs/routing/api-routes)）复杂表单数据建议用 `@begin/validator` 按 JSON schema 把扁平 form 字段还原成嵌套对象。

**渐进增强模型**：先让表单在无 JS 下完整工作（POST → 302 → GET 整页刷新），再用元素内 `<script type="module">` 里的原生 `class extends HTMLElement` 拦截——`event.preventDefault()` → fetch → 用返回的 JSON 做"surgical DOM updates"。范式例子见 [Progressively Enhancing Components: The Enhance Way (2023-06-29)](https://enhance.dev/blog/posts/2023-06-29-progressive-enhancement-the-enhance-way)（纯 HTML 的 `<form>` 依赖 method/action 默认值即可工作，JS 只做增强）;TodoMVC 全 CRUD 零客户端 JS 案例见 [Enhancing TodoMVC (2022-09-06)](https://enhance.dev/blog/posts/2022-09-06-enhancing-todomvc)。无 JS 降级不是"降级"，而是**基线**——JS 路径是后加的薄层。

## 3. Error / Redirect 语义

**Redirect**：响应对象里的 `location` 字符串。底层由 Architect 实现为 **HTTP 302**(默认，可用 `statusCode` 覆盖），并自动附加防 CDN 缓存头（源码：[architect/functions `src/http/_res-fmt.js`](https://github.com/architect/functions/blob/main/src/http/_res-fmt.js),`params.location → res.statusCode = providedStatus || 302`)。

**表单校验错误的官方惯用形状是 "session flash + PRG"**，以官方示例库 [enhance-auth 的 `app/api/register/username.mjs`](https://github.com/enhance-dev/enhance-auth/blob/main/app/api/register/username.mjs) 为一手证据：

```javascript
export async function post(req) {
  let { problems, register } = await validate.create(req);
  if (problems) {
    return {
      session: { ...newSession, problems, register: sanitizedRegister }, // 错误+旧值写入 session
      location: '/register/username', // 302 回原表单
    };
  }
  // 成功:写 session(登录态)并 redirect 到下一页
  return { session: { unverified: newAccount }, location: '/verify' };
}

export async function get(req) {
  let { problems, register, ...newSession } = req.session;
  if (problems) {
    return { session: newSession, json: { problems, register } }; // 读后即清,注入 store
  }
}
```

要点：`problems`（按字段的错误 map)+ 用户已填值（剔除密码等敏感字段）经 **session** 跨 redirect 传递；GET 侧读出后从 session 中抹掉、放进 `json` → `store.problems`，页面据此渲染错误（[Password/Username Auth Flow (2023-05-26)](https://enhance.dev/blog/posts/2023-05-26-password-username-auth-flow)，页面模板里 `const { problems, register } = state.store`)。

**框架级错误页**：未匹配路由 → `app/pages/404.mjs`，内部异常 → `500.mjs`；错误信息经 `state.attrs.error` 传入（[404 and 500 Error Pages](https://enhance.dev/docs/conventions/404-errors)）。注意：handler 抛异常没有"路由级 error boundary"概念，只有全局 500 页。

## 4. Revalidation

**没有框架级 revalidation 机制——这是与 Next/Remix 最大的差异，必须明确。**

- 无 JS 路径：revalidation = **PRG 后的整页 GET**。POST 成功 → 302 → 浏览器重新 GET → API route 重跑 → store 重建 → 整页 SSR。粒度永远是整页，新鲜度永远是最新（HTML/JSON 响应默认 `no-cache, no-store`，见上述 `_res-fmt.js` 的 antiCache 逻辑）。
- 有 JS 路径：**开发者自己拥有**。官方推荐的三件套模式（[Client side State Management (2023-11-30)](https://enhance.dev/blog/posts/2023-11-30-clientside-state-management)）:① [`@enhance/store`](https://github.com/enhance-dev/enhance-store)(~100 LOC 的 Proxy 响应式单例，`store.subscribe(fn, ['key'])` 按 key 订阅，rAF 合帧）;② Web Worker 里发 fetch（不阻塞主线程）;③ API helper 封装消息路由（switch/case 小状态机）。组件订阅 store 的 key 后自行做 DOM 更新。
- **乐观更新**也是文档化模式：先改 store 把条目放进 `deletedItems`，失败则回滚（同上文 Optimistic UI 一节）。
- 没有 stale-while-revalidate、没有自动的 loader 重跑、没有 focus/reconnect 重新拉取。这一切被有意地排除在框架外（"it is an anti-pattern to let it drive the app's architecture")。

## 5. 渲染连续性

- **无 JS：整页替换，客户端状态全丢**（除了浏览器自己管的）。官方对此的对策不是框架机制，而是"把状态存在平台该在的地方":URL path/query/fragment、表单控件自身、session cookie、DOM([Client side State Management](https://enhance.dev/blog/posts/2023-11-30-clientside-state-management) 的状态清单）。滚动位置这种纯 UI 态用 ~15 行 Custom Element 增强存 `sessionStorage` 自行恢复（[Maintain scroll position across page loads (2023-01-12)](https://enhance.dev/blog/posts/2023-01-12-restoring-scroll-position-for-server-rendered-sites))。
- **有 JS:action 走 fetch，不刷新页面，已交互组件状态天然不丢**——因为根本没发生导航，只有被订阅的 DOM 区域被外科手术式更新。
- **局部更新机制**：框架不内置服务端 HTML partial/morph。可选件：`@enhance/element` 基类（声明 `attrs/init/render`，内置 DOM diffing，见 [Progressive Enhancement 文档](https://enhance.dev/docs/patterns/progressive-enhancement) 的 "Just a spoonful" 节）、[`enhance-morphdom-mixin` / `enhance-micromorph-mixin`](https://github.com/enhance-dev/enhance-morphdom-mixin)(mixin 形式给组件加 DOM diffing)、[`@enhance/router`](https://github.com/enhance-dev/enhance-router)（纯 history pushState + 路由匹配的订阅器，**不**做 fetch/morph——我读了源码确认）。
- **islands 的官方形态**:`app/components/` 下的类组件继承 `@enhance/custom-element`，同一个 `render({html, state})` 方法服务端跑一次（SSR)、客户端 define 后再跑（按需 hydrate)——这就是它的"选择性水合"（[Components 文档](https://enhance.dev/docs/conventions/components)、[Island Architecture with Web Components (2024-07-09)](https://enhance.dev/blog/posts/2024-07-09-island-architecture-with-web-components))。`app/elements/` 纯函数组件则永不 hydrate。

## 6. 静态与请求时混合

**声明方式 = 文件存在与否，全部是请求时渲染，没有构建期 SSG**:

- 路由即文件：`app/pages/products.html` ↔ `app/api/products.mjs` 可同路径共存（后者供数）；纯静态页 = 只有 page 没有 api。动态段用 `$id.mjs`,catch-all 用 `$$.mjs`，静态路由优先于动态路由（[Routing](https://enhance.dev/docs/routing)、[Dynamic Routes](https://enhance.dev/docs/routing/dynamic-routes))。
- 每个请求都在 Lambda 上实时渲染（部署模型是 [Architect](https://enhance.dev/docs/deployment/architect) 的 "Function Web Apps")；"静态"只是"这次渲染不依赖 API 数据"，缓存粒度靠响应里的 `cacheControl` 键逐路由控制。
- 真正的构建期静态化不在核心框架内：SSR 引擎 [`@enhance/ssr`](https://github.com/enhance-dev/enhance-ssr) 是可移植的（有 Deno/PHP/Ruby/Go/WASM 等移植版），且有官方 [eleventy-plugin](https://github.com/enhance-dev/eleventy-plugin) 把 Enhance 元素接进 11ty 做 SSG——属集成方案而非框架能力。
- 静态资源走 `app/public/` → `/_public/`，有独立生命周期（[Lifecycle](https://enhance.dev/docs/routing/lifecycle) 末节）。

## 7. 对 openElement(WC + DSD + islands）的可迁移性

**可以直接搬的（与渲染模型无关的纯契约设计）**:

1. **同路由双模 handler**：一个文件、一个 URL，按 `Accept` 头同时服务 `text/html`(json→store→SSR）和 `application/json`（客户端 fetch)。这让 loader 和 action 合并、让"无 JS 路径"与"增强路径"共享同一份服务端逻辑——openElement 的 load/action 闭环路可以直接采用这个形状。
2. **响应对象词汇表** `{ json, location, session, statusCode, cacheControl, headers }`：极小、纯数据、可静态类型化。redirect 就是返回一个字段，不需要 throw。
3. **session flash + PRG 的错误闭环**:`problems` + sanitized 旧值进 session → 302 回表单页 → GET 读出即清、注入 store → 同模板渲染错误。完全无 JS 依赖，对 openElement 的 error/redirect 阶段是现成答案。
4. **`state = { attrs, store, instanceID, context }` 的四键组件契约**:attrs 是字符串属性、store 装复杂数据、attrs 当 store 的查询键（`store.books[attrs.bookId]`)、context 防 prop drilling——这套正好填 DSD 渲染时"属性只能是字符串"的坑。
5. **preflight（全局默认 store)+ 路由级覆盖合并**：比"每个页面各写 loader"更适合共享登录态等横切数据。
6. **动词数组中间件** `export const post = [auth, validate, handler]`，早退即短路——零框架税。
7. **elements(SSO-only)/ components（同构）二分**：用文件位置声明"这个组件要不要 hydrate"，与 openElement 的选择性水合天然对应。

**搬不了 / 需谨慎的**:

- **Revalidation 的空缺**。Enhance 把"action 后刷什么"完全推给开发者，因为 MPA 整页刷新天然新鲜。openElement 若要做 islands 级 revalidation（只重渲受影响的 island 而非整页）,Enhance 没有可抄的机制，只有 `@enhance/store` 订阅模式这个"手动挡"可参考。
- **Light DOM 偏向**。Enhance 明确反 DSD 默认（[Shadow DOM: Not by Default (2023-08-18)](https://enhance.dev/blog/posts/2023-08-18-shadow-dom-not-by-default)，理由含当时 Firefox 未支持 DSD、表单参与 FACE 问题、a11y)；它用服务端 style transform 做 CSS 作用域隔离。其 [`enhance-dsd`](https://github.com/enhance-dev/enhance-dsd) 只有一行 README("Enhance declarative Shadow DOM emitter")，成熟度未证实。openElement 默认 DSD，所以 Enhance 的样式隔离方案不可搬，且需自己解决 DSD 下的表单参与问题。
- **组件状态连续性是"不导航"换来的，不是框架保存/恢复的**。若 openElement 的 action 后要局部重渲 island,DSD 重插意味着 Custom Element 重建（内部 DOM 状态丢失）,Enhance 的"surgical DOM update"哲学（只改 attribute，让 `attributeChangedCallback` 驱动）比"整棵替换"更适合，但 Enhance 本身没有给出 action→partial DSD 的 server round-trip 方案。
- **类型流基本是手工作坊**(JSDoc 注解），没有 loader→组件的类型推导可抄。
- **绑定 AWS/Architect 的部分**(session 实现、302 细节）是部署层细节，与 Vite+Nitro 栈无关，只能借其语义不能借其实现。

---

## 如果 openElement 只从 Enhance 抄一样东西

**抄"同路由双模 handler + `{json, location, session, statusCode}` 响应对象"这一个契约。**

理由是它是整个闭环的承重墙：load 和 action 因此成为同一个文件的两个动词；无 JS 的 form POST 和有 JS 的 `fetch(Accept: application/json)` 因此共享同一份服务端代码，"progressive form"退化成纯传输层的内容协商而不是两套端点；redirect/error 因此变成可类型化的纯数据返回值；DSD 渲染因此只需消费 `json → store` 这一条数据通道。Enhance 生态里其余的亮点（session flash problems、preflight、attrs-as-store-keys）都是这个契约的自然推论，可以后续逐个引入。而它的短板（无 revalidation 机制、light-DOM 偏向、类型靠手写）恰好是 openElement 用 DSD + islands 架构必须自己趟、且趟出来就是差异化的地方。

**一处时效性备注**:Enhance 核心团队 2024 年 10 月并入 Sanity，官方承诺维护但"major new feature developments 会放缓"([Enhance is Here to Stay (2024-10-23)](https://enhance.dev/blog/posts/2024-10-23-future-of-enhance))——其设计已稳定，但作为"活竞品"的演进速度有限，抄设计优于追版本。
