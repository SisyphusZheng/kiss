---

# Astro 数据-交互闭环设计调研（Actions / Endpoints / 混合渲染）

调研对象：Astro 4.15+（Actions 稳定）/ 5.x–6.x。所有 API 形状均来自官方文档，出处附在各节。

## 0. 总体模型：Astro 没有"路由级 loader"契约

先说结论性事实：Astro 的数据加载**不是** Remix/Next 那种"每路由一个 loader 函数、框架帮你 await 后注入"的契约。它拆成了三块互不绑定的东西：

- 页面组件的 frontmatter（`.astro` 文件顶部 `---` 脚本）里直接 `await fetch(...)`，顶层 await，SSR 时请求时执行、SSG 时构建时执行（[data fetching](https://docs.astro.build/en/guides/data-fetching/)）；
- Content Layer 的 **loader**（构建时 + live loader），是"内容管线"而非"请求管线"（[content loader reference](https://docs.astro.build/en/reference/content-loader-reference/)）；
- 底层逃生舱：**endpoints**（API routes），导出 `GET`/`POST`/… 函数返回标准 `Response`（[endpoints](https://docs.astro.build/en/guides/endpoints/)）。

闭环里真正的"数据→交互"骨架是 **Actions**（[actions guide](https://docs.astro.build/en/guides/actions/)），它同时承载 RPC 调用和无 JS 表单提交两条路径。

## 1. Loader / 数据加载

### 1a. 页面数据：frontmatter 顶层 await + `Astro` 全局

没有函数签名契约。页面就是一个 `.astro` 组件，frontmatter 里写任意 async 代码；请求上下文通过 `Astro` 全局对象拿到：`Astro.params`、`Astro.request`（标准 `Request`）、`Astro.cookies`、`Astro.url`、`Astro.redirect()`、`Astro.response`（可设 status/headers）。数据靠普通变量流到模板和子组件 props（[on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)、[data fetching](https://docs.astro.build/en/guides/data-fetching/)）：

```astro
---
const product = await getProduct(Astro.params.id);
if (!product) {
  Astro.response.status = 404;
}
---
```

类型流：没有 codegen 契约，纯 TypeScript 类型推断（`const data = await fetch(...).then(r => r.json())`）。

### 1b. 结构化"loader"契约：Content Layer loader（构建时）

真正的 loader 形状在内容层。`Loader` 对象（astro@5.0.0）：

```ts
{ name: string,
  load: (context: LoaderContext) => Promise<void>,
  schema?: ZodSchema } satisfies Loader
```

`LoaderContext` 提供 `store`（KV data store：`set/get/clear/entries`）、`parseData()`（按 Zod schema 校验+解析）、`meta`（跨构建持久化的元数据 KV）、`watcher`（dev 文件监听）、`generateDigest()`（变更检测）。类型流向组件的方式：schema 驱动 codegen，`getEntry()/getCollection()` 返回带类型的 entry（[content loader reference](https://docs.astro.build/en/reference/content-loader-reference/)）。

### 1c. Live loader（请求时，astro@6.0.0）

形状换成 `{ loadCollection, loadEntry }`，返回 **data 或 `{ error }` 联合**（不是 throw）：

```ts
loadEntry: (({ filter }) => Promise<LiveDataEntry<TData> | undefined | { error: TError }>);
```

调用侧 `getLiveEntry('products', id)` 返回 `{ entry, error, cacheHint }`；error 类型可通过泛型自定义（`LiveLoader<TData, TEntryFilter, TCollectionFilter, TError>`）。另有 `cacheHint: { tags, lastModified }` 供缓存失效（[content loader reference](https://docs.astro.build/en/reference/content-loader-reference/)）。

## 2. Action / 表单

### 2a. 定义契约

集中定义于 `src/actions/index.ts` 的 `server` 对象（[actions guide](https://docs.astro.build/en/guides/actions/)）：

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  newsletter: defineAction({
    accept: 'form', // 默认 'json'
    input: z.object({ email: z.email(), terms: z.boolean() }),
    handler: async (input, context) => {/* ... */},
  }),
};
```

- `input`：Zod schema 校验；省略时 handler 收到原始 `FormData`。
- `handler` 第二参是 APIContext 子集（`cookies`、`locals`、`request` 等）。
- `accept: 'form'` 下框架自动处理 number→`z.number()`、checkbox→`z.coerce.boolean()`、file→`z.instanceof(File)`、同名多值→`z.array()`；空值转 `null`；支持 `z.discriminatedUnion` 做 create/update 分支。

### 2b. Wire format —— 同一 action 两种协议

1. **RPC 模式**：客户端 `import { actions } from 'astro:actions'; await actions.newsletter(formData)`。POST 到 `/_actions/<name>`（公开端点，如 `/_actions/blog.like`）。返回值用 **devalue** 序列化（支持 Date/Map/Set/URL），不是普通 JSON——官方明说"你不能像普通 JSON 那样在网络面板里直接读"。
2. **零 JS 标准表单模式**（渐进增强的关键）：`<form method="POST" action={actions.newsletter}>`。action 引用被序列化成带 query string 的 URL，服务端自动识别。这是**标准 form POST**，浏览器原生提交，无需任何客户端 JS。

### 2c. 无 JS 降级的结果回灌

提交后服务端重新渲染当前页面，组件里用 **`Astro.getActionResult(actions.x)`** 取结果（有则 `{ data, error }`，未调用则 `undefined`），据此渲染错误横幅/成功消息，或 `return Astro.redirect(...)`。这就是 Astro 版的"action → 页面重渲染"闭环（[actions guide](https://docs.astro.build/en/guides/actions/)）。

## 3. Error / Redirect 语义

- **ActionError**：`throw new ActionError({ code: 'UNAUTHORIZED', message })`，code 是 HTTP 状态名（404/401/…）。调用侧结果恒为 `{ data } | { error }` 联合——**error 不走异常通道，走返回通道**；`.orThrow()` 是可选的抛错变体。校验失败产生 input error，`isInputError(error)` 收窄后可取 `error.fields.<fieldName>: string[]` 做逐字段报错（[actions guide](https://docs.astro.build/en/guides/actions/)）。
- **Redirect**：无 JS 表单路径下，redirect 不在 handler 里表达，而在**页面 frontmatter** 里：`const result = Astro.getActionResult(actions.createProduct); if (result && !result.error) return Astro.redirect(\`/products/\${result.data.id}\`)`。`Astro.redirect(path, 301)`本质是直接返回`Response`。Endpoints 里对应`context.redirect()`（[endpoints](https://docs.astro.build/en/guides/endpoints/)）。
- 页面级错误：`Astro.response.status = 404` + 照常渲染 HTML，或直接 `return new Response(null, { status: 404 })`（[on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)）。
- **POST/Redirect/GET 需要手搓**：默认 action 结果按 POST 响应直接渲染，刷新会触发"确认重新提交表单"。官方给的解法是写中间件：用 `getActionContext()` 拿 `{ action, setActionResult, serializeActionResult }`，把结果存 session、redirect 回 `context.originPathname`，下次 GET 时再 `setActionResult` 回灌。这是文档级 recipe 而非框架内置行为（[actions guide](https://docs.astro.build/en/guides/actions/)）。

## 4. Revalidation

这是 Astro 最薄弱的环节，如实说明：

- **没有框架级的"action 成功后自动使页面数据失效/重取"机制**。无 JS 路径下，"revalidation"= POST 响应时整页重新渲染（页面 frontmatter 里的 fetch 自然重跑）；RPC 路径下，拿到 `data` 后 UI 怎么刷新完全是用户自己的活（官方示例是手动 DOM 操作或组件 state）。
- **没有内置 ISR/stale-while-revalidate**。缓存靠标准 HTTP 语义：`Astro.response.headers.set('Cache-Control', ...)`，或 live loader 的 `cacheHint.tags/lastModified` 配合 `Astro.cache.set()`（需配置 cache provider，astro@6）（[content loader reference](https://docs.astro.build/en/reference/content-loader-reference/)）。平台级 ISR 依赖 adapter/host 能力——此点文档未给出框架内置方案，**标注：Astro 无内置 ISR，属未证实其存在**。
- 粒度上：要么整页重渲，要么靠 server islands 做"组件级延迟取数"（见下），没有数据层面的细粒度失效总线。

## 5. 渲染连续性

两层机制：

- **Server islands**（`<Avatar server:defer />`）：构建时把组件拆成独立路由 `/_server-islands/Avatar`，页面先渲 fallback，浏览器再用 GET（props 加密进 query string；超 2048 字节降级为 POST body）取回 HTML 局部替换。每个 island 独立加载、可缓存（Cache-Control）。这是"局部更新"的官方答案——但它是**渲染延迟**机制，不是"action 后局部刷新"机制（[server islands](https://docs.astro.build/en/guides/server-islands/)）。
- **`<ClientRouter />`（原 ViewTransitions）**：客户端路由拦截导航和 **GET/POST 表单提交**（astro@4.0 起支持 form），fetch 新页面后走 swap 流程：head 去重合并、body 整体替换、**`transition:persist` 元素（含已水合 island）跨导航保留状态**。官方明确给出用例：无 JS 表单提交后输入会被清空，用 `transition:persist` 保住输入值；`<Counter client:load transition:persist>` 跨页保留内部 state。`transition:persist-props` 控制 props 是否随新页更新。swap 可通过 `astro:before-swap` 事件 + `swapFunctions`（deselectScripts/swapRootAttributes/swapHeadElements/saveFocus/swapBodyElement）自定义（[view transitions](https://docs.astro.build/en/guides/view-transitions/)）。

所以"已交互组件状态会不会丢"的答案：默认 body 整体替换会丢；`transition:persist` 是对应的逃生阀。客户端脚本重跑语义也要自己管（`astro:page-load` 事件、`data-astro-rerun`）。

## 6. 静态与请求时混合

- 默认全站 SSG；装了 adapter 后，**逐路由** `export const prerender = false` 即请求时渲染，其余保持静态（astro@2.0 引入的 hybrid rendering，见 [Astro 2.0 blog](https://astro.build/blog/astro-2/)）。
- 反向也成立：`output: 'server'` 全站 SSR，逐页 `export const prerender = true` 钉回静态。
- 声明是**页面/endpoint 级的一个布尔导出**，颗粒度到单条路由；server islands 进一步把混合粒度压到**组件级**（静态页面里嵌一个请求时渲染的 island，且 island 可独立缓存）（[on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)）。

## 7. 对 openElement（WC + DSD）架构的可迁移性

**能搬的：**

- **`getActionResult` 回灌模式**。这是 Astro 闭环里与渲染技术栈完全解耦的宝石：同一个 action 定义，RPC(fetch) 和标准 form POST 共用；无 JS 时 POST 后重渲页面，组件从请求上下文里取回本次 action 的 `{ data, error }` 并渲染。openElement 的 DSD render 同样天然支持"POST → 重新 SSR → 模板里读到 actionResult"——零客户端假设，WC/DSD 友好度 100%。
- **错误走返回通道而非异常通道**（`{ data, error }` 联合、`ActionError.code`、逐字段 `error.fields`）：纯协议设计，与 VDOM 无关，直接可抄。
- **`export const prerender` 逐路由布尔声明**：一行导出切换静态/请求时，openElement 基于 Nitro 完全可以等价实现。
- **devalue 序列化 + `accept: 'form'` 的 FormData→Zod 自动适配**：纯服务端管线，可搬。
- **PRG（POST/Redirect/GET）中间件 recipe**：`calledFrom: 'form' | 'rpc'` 的判定 + session 暂存结果 + redirect 回灌，是解决"刷新重复提交"的标准答案，openElement 应当**内置**而非留作 recipe。
- **server islands 的思想**（组件级请求时渲染 + fallback 槽 + 独立缓存）与 DSD 的声明式 `<template shadowrootmode>` 天然契合——一个 island 就是一段 DSD 片段，客户端用 HTML 替换即可，不需要水合框架。

**搬不了 / 需要重新设计的：**

- **`<ClientRouter />` 的 body 整体 swap + `transition:persist`**：这套"渲染连续性"方案建立在"Astro 掌控整个文档组装"之上。对 openElement，Custom Element 的内部状态（shadow root、已水合 island 的私有状态）在 body 替换下会丢，且 DSD 片段没有 VDOM diff 可依托；`transition:persist` 按 DOM 节点搬移倒是 DOM 层面可行，但跨节点的 CE 状态保留策略需要自己定义（比如按 `id`/tag 匹配保活）。
- **frontmatter 顶层 await 的"无契约"数据加载**：Astro 组件=模板文件，数据就地 fetch。openElement 组件=Custom Element 类，数据加载要进入"元素属性/props"通道，必须另立契约（路由级 load 函数把数据映射到元素 attributes/DSD props）。
- **Content Layer 的 build-time data store + codegen**：绑定 Astro 的内容集合与 `.astro` 消费方式，与运行时 WC 无关；但其 live loader 的 `{ entry, error, cacheHint }` 返回形状值得借鉴。

## 如果只抄一样东西

**抄 `Astro.getActionResult()` 这套"action 结果回灌页面渲染"的协议**：一个 action 定义同时编译出 RPC 端点（fetch + devalue）和标准 form POST 端点；无 JS 提交后服务端重渲页面，页面/组件通过请求上下文拿到 `{ data, error }`（含逐字段 input error），成功时可 `redirect()`——再配上内置的 PRG 中间件消除重复提交弹窗。

理由：它恰好是 openElement 0.42 "WC Application Loop" 里 action → error/redirect → revalidation 那一段的最小完备实现；它完全不依赖虚拟 DOM（Astro 自己就是 HTML-first，这条路径零客户端 JS）；DSD 的输出模型与"POST 后整页/局部重 SSR"严丝合缝；而且 Astro 自己把 PRG 留作手写 recipe 是它的短板，openElement 抄过来时顺手内置化，就是明确的差异化优势。相比之下，loader 侧 Astro 反而没有强契约（frontmatter 就地 fetch），不值得抄；ClientRouter 那套连续性机制搬不动，另行自研成本更低。

---

**出处汇总**：[Actions guide](https://docs.astro.build/en/guides/actions/) · [Endpoints](https://docs.astro.build/en/guides/endpoints/) · [On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) · [Data fetching](https://docs.astro.build/en/guides/data-fetching/) · [Server islands](https://docs.astro.build/en/guides/server-islands/) · [View transitions / ClientRouter](https://docs.astro.build/en/guides/view-transitions/) · [Content Loader reference](https://docs.astro.build/en/reference/content-loader-reference/) · [Astro 4.15 blog（Actions 稳定）](https://astro.build/blog/astro-4150/) · [Astro 2.0 blog（Hybrid rendering）](https://astro.build/blog/astro-2/)
