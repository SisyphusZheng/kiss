# SvelteKit(form actions + use:enhance)Application Loop 调研报告

调研对象：SvelteKit 2.x(Svelte 5 runes 时代）的页面数据闭环。出处以 [svelte.dev/docs/kit](https://svelte.dev/docs/kit) 官方文档为准。

---

## 1. Loader / 数据加载

**契约形状**：约定式文件路由下，在 `+page.js` / `+page.server.js`（或 `+layout.*`）中导出 `load` 函数。

- **双层 load**:`+page.js` 导出 _universal_ load（服务端 SSR 跑一次，之后客户端导航时在浏览器跑）;`+page.server.js` 导出 _server_ load（永远只在服务端，可碰数据库/私密环境变量）。两者可共存，server load 的返回值作为 universal load 入参的 `data` 属性传入。
- **函数签名**:`load(event) => MaybePromise<object>`。server load 拿到 `ServerLoadEvent`（继承 `RequestEvent`:`cookies`、`locals`、`request`、`params`、`url`、`route`、`fetch`、`setHeaders`、`platform`、`getClientAddress`);universal load 拿 `LoadEvent`(`params`、`url`、`route`、`fetch`、`parent`、`depends`、`untrack`、`data`)。
- **返回值**:server load 必须可用 [devalue](https://github.com/sveltejs/devalue) 序列化（JSON + BigInt/Date/Map/Set/RegExp/循环引用）；顶层 promise 支持 **streaming**（随渲染流式推到浏览器，配合 `{#await}` 做骨架屏）。universal load 可返回不可序列化对象（如组件构造器）。
- **类型流到组件**：不写类型定义文件，而是构建期生成 `./$types` 模块——`PageServerLoad`/`PageLoad` 标注 load，组件侧用 `PageProps` 拿到 `let { data, form } = $props()`，全链路类型安全。layout 与 page 的数据按 key 合并（同名后写覆盖先写）。

出处：[Loading data](https://svelte.dev/docs/kit/load)、[$app/forms / @sveltejs/kit 类型](https://svelte.dev/docs/kit/@sveltejs-kit)

## 2. Action / 表单

**处理模型**:`+page.server.js` 导出 `export const actions = { default, 或任意命名 action }`，每个 action 是 `(event: RequestEvent) => MaybePromise<object>`，用 `await request.formData()` 读数据。

- **wire format 就是标准 HTML form POST**，不是自定义 JSON 协议：
  - 无 JS 路径：`<form method="POST">` 原生提交，浏览器整页刷新，服务端跑 action 后重渲染整页 HTML 返回。
  - 命名 action 用 **URL query 约定**:`action="?/register"`（从其他页面提交则 `/login?/register`)，也可用按钮的 `formaction` 属性让同一表单打不同 action。
  - 有 JS 路径（`use:enhance`)：拦截 submit，用 `fetch` 把**同一个 `FormData`** POST 到同一 URL，带 `x-sveltekit-action: true` 头；响应是 devalue 序列化的 `ActionResult` JSON，客户端用 `deserialize(await response.text())` 解码。即：**请求体不变，变的只是响应格式**——这是它渐进增强设计的精髓。
- **ActionResult 判别联合**（客户端拿到的形状）:
  ```ts
  type ActionResult =
    | { type: 'success'; status: number; data?: Success }
    | { type: 'failure'; status: number; data?: Failure }
    | { type: 'redirect'; status: number; location: string }
    | { type: 'error'; status?: number; error: any };
  ```
- **action 返回值经 `form` prop 流回页面**(`page.form` 全局可读），文档明确称其为 _ephemeral_——刷新即消失，语义上是"本次 POST 的响应"。
- **GET 表单**走另一条路：`method="GET"` 的表单被当作链接导航，触发 load 重跑而非 action。

出处：[Form actions](https://svelte.dev/docs/kit/form-actions)、[$app/forms](https://svelte.dev/docs/kit/$app-forms)

## 3. Error / Redirect 语义

三个一等公民的 helper，全部来自 `@sveltejs/kit`，在 load 和 action 中语义完全一致：

- `error(status, body)`:**抛异常**（不是 return)，表达"预期错误"(404/401/403…)，渲染最近的 `+error.svelte` 边界，`page.error` 拿到 body。body 形状默认 `{ message: string }`，可用 `App.Error` interface 扩展。意外异常走 `handleError` hook，对外只暴露 `{ "message": "Internal Error" }`。
- `fail(status, data)`:**return**（不是 throw)，专用于 action 的校验失败，生成 `ActionFailure { status, data }`，客户端 `result.type === 'failure'`。约定俗成把用户已填的值回传（但敏感字段如密码不回传）,`page.status` 同步为该 status（典型 400/422)。
- `redirect(status, location)`:**抛异常**,status 限定 3xx。文档明确 POST 后重定向用 **303**(POST→redirect→GET 模式），并警告"不要放在 try 块里"。
- 配套类型守卫：`isHttpError` / `isRedirect` / `isActionFailure`。"error/redirect 用 throw、业务失败用 return"这条分界是整个闭环的语义骨架。

出处：[Errors](https://svelte.dev/docs/kit/errors)、[@sveltejs/kit — error/fail/redirect](https://svelte.dev/docs/kit/@sveltejs-kit)

## 4. Revalidation

两层机制：

- **action 之后的自动刷新**：文档明写 "After an action runs, the page will be re-rendered … your page's load functions will run after the action completes"。无 JS 时这是天然结果（整页重渲染）;`use:enhance` 无参时默认行为是 `invalidateAll()`——**重跑当前页面所有 load**，即粗粒度整页数据失效，不是细粒度 patch。
- **依赖追踪 + 手动失效**（细粒度的一面，但面向导航而非 action):load 函数被自动追踪依赖（`params`、`url` 含独立追踪的 `searchParams`、`await parent()`)，只重跑依赖变了的那些；另有显式 `depends('app:random')` 自定义标识 + `invalidate(url | 标识 | predicate)` / `invalidateAll()` 手动触发。server load 不会自动依赖 fetch 的 URL（防泄密），要显式 `depends`。
- 注意 `use:enhance` 的默认 `update()` 可传 `{ reset: false, invalidateAll: false }` 关掉自动失效。

出处：[Form actions — Loading data / use:enhance](https://svelte.dev/docs/kit/form-actions)、[Load — Rerunning load functions / Manual invalidation](https://svelte.dev/docs/kit/load)

## 5. 渲染连续性

这是 SvelteKit 闭环里对 islands 架构最有参考价值的一条。文档原话：**"rerunning a load function will update the data prop inside the corresponding +layout.svelte or +page.svelte; it does not cause the component to be recreated. As a result, internal state is preserved."**

- 数据失效 → 更新组件的 `data` prop → Svelte 的细粒度响应式只改 DOM 里真正变的部分；**组件实例不重建，内部 state 保留**。
- 若想让某块随数据重置，用 `{#key ...}` 块显式声明；`afterNavigate` 里手动重置也是官方建议。
- action 的瞬时结果走独立通道（`form` prop / `page.form`)，与 load 数据（`data` prop）分离，互不污染。
- `use:enhance` 默认还负责：重置表单元素、焦点复位、redirect 时 `goto`、error 时渲染最近错误边界。没有 HTML-over-the-wire 式的 DOM 局部替换（不像 HTMX/Turbo)；所谓"partial update"是靠响应式 prop 更新实现的，**依赖 Svelte 编译器/运行时**。
- 补充：2.12+ 的 shallow routing(`pushState`/`replaceState` 操纵 `page.state`）可在不重跑 load 的情况下保留/叠加 UI 状态，属于同一思路的延伸。

出处：[Load — When do load functions rerun](https://svelte.dev/docs/kit/load)、[Form actions — use:enhance](https://svelte.dev/docs/kit/form-actions)

## 6. 静态与请求时混合

以 **page option 导出常量**的方式按路由（或按 layout 分组）声明，子级覆盖父级，天然支持"营销页 prerender + 动态页 SSR + 后台纯 SPA"混合：

- `export const prerender = true | false | 'auto'`(`'auto'` = 预渲染但同时保留在动态 SSR manifest，用于"/blog/[slug] 预渲染热门、长尾走 SSR")。
- `export const ssr = false`(SSR 关掉出空壳）、`export const csr = false`(**不发任何 JS 到客户端**，纯 HTML+CSS 页面，表单不可 enhance，链接整页导航——对 openElement 的 static-first 语义最直接对应的一条）。
- 硬约束：**"Pages with actions cannot be prerendered"**——有 action 的页必须有服务端在场，因为 POST 要有人接。
- 动态路由的静态枚举：`export function entries()`(EntryGenerator）告诉预渲染器参数取值；爬虫顺着 `<a>` 自动发现可预渲染页。

出处：[Page options](https://svelte.dev/docs/kit/page-options)

## 7. 对 WC/DSD 架构的可迁移性

**可以直接搬的（与渲染技术无关的协议层）**:

- **wire format 的零发明**：标准 `<form method="POST">` + `?/named-action` URL 约定 + `formaction` 按钮分派。这套完全是 HTML 原生语义，无 JS 可用性免费获得，和 DSD 一样"不依赖客户端运行时"。openElement 几乎可以原样照抄，连 `formaction` 分派都不该重新发明。
- **三态结果代数**:`ActionResult` 判别联合（success/failure/redirect/error)+ "error/redirect 用 throw、校验失败用 return `fail(status, data)`" 的语义分界，以及 POST 后 303 重定向。这是纯服务端契约，WC 框架照搬无成本。
- **action 结果走独立瞬时通道**(`form` prop,ephemeral）与 load 数据分离；`fail` 回显已填值的约定。
- **page-option 式声明**:`prerender/ssr/csr` 导出常量、"有 action 的页面不可 prerender" 的硬规则，都是 static-first 框架可直接借鉴的声明模型。
- **依赖追踪式 invalidation**(`depends`/`invalidate`)：粒度可控的 revalidation 协议，与渲染层解耦。

**搬不了或要变形的（依赖 Svelte 运行时假设）**:

- **"prop 更新 → 组件实例不重建 → 状态保留"这条链路**。SvelteKit 的渲染连续性建立在编译期响应式 + 虚拟 DOM 式的就地更新上。WC 世界里没有框架层的 prop diffing:DSD 水合后元素是真实 DOM，服务端重渲染的 HTML 不能自动"打补丁"。openElement 需要自己回答：action 后是整页导航（无 JS 免费获得）、morphdom 类 DOM morphing、还是 island 级替换 + 显式状态保留策略。
- **`use:enhance` 的默认行为集合**（重置表单、焦点复位、`invalidateAll`、错误边界渲染）是 Svelte action 写在组件树上的；WC 等价物应该是一个可挂在 `<form>` 上的小脚本/自定义元素行为层，且必须容忍目标 island 尚未水合。
- **streaming promise load + `{#await}`**:DSD 可以把流式 HTML 片段直接写进 shadow root（声明式 shadow DOM streaming 是可行的），但"promise 作为数据传给组件"这个概念在 WC 契约里不存在，需要换成"流式插入 DSD 模板 + 交换 placeholder"。
- **`./$types` 生成式类型流**:WC 的 props 是 HTML 属性/元素 property，跨进程的类型推导要靠 CEM(Custom Elements Manifest）之类的元数据，机制完全不同——**未证实** openElement 是否已有对应规划（0.43 路线图的 CEM/admission 信息可能覆盖）。

**标注为"未证实"的边角**：文档中出现了新版 experimental "remote functions"(`form()`/`query()`/`command()`,`invalid()`、`query.set/refresh` 单航班变更），代表 SvelteKit 正在向 RPC 化演进，但这超出本次 form actions 调研范围，且 API 仍在变动，不建议 openElement 0.42 跟进。

---

## 如果只抄一样东西

**抄 "同一 wire format、两种响应" 的渐进增强协议：标准 form POST 作为唯一入口，无 JS 时回整页 HTML,enhance 后同一条 POST 改回 `ActionResult` 判别联合（success/failure/redirect/error)，由客户端小脚本统一分派。**

理由：这是 SvelteKit 整套闭环里唯一一个同时满足"无 JS 可用、无虚拟 DOM 依赖、协议面极小、语义完备（覆盖 error/redirect/revalidation 触发）"的设计。loader 形态、类型流、渲染连续性都各自绑定了 Svelte 的工具链或运行时，唯有这条 POST 协议是纯 HTML/HTTP 层的资产——它把"progressive form → action → error/redirect → revalidation"压缩成了一个自定义元素行为层（增强 `<form>`)+ 一个服务端结果形状，恰好嵌进 openElement 0.42 要画的那个环，而且和 DSD 的"服务器拥有 HTML"世界观零冲突。
