---

# Hotwire (Turbo/Stimulus) 与 htmx 的 Application Loop 设计调研

**调研范围**:Turbo 8 官方 Handbook/Reference、Stimulus 3 官方 Handbook/Reference、htmx 2.x 官方 Docs/Extensions。所有 API 描述均出自下列官方页面；无法从官方文档确认的均标注"未证实"。

**总体心智模型**:这两家都没有 Remix/Next 式的"服务端 loader 函数 + 类型化数据流"。它们的闭环是 **URL → HTML(over the wire)→ 声明式增强属性 → HTTP 状态码/响应头语义 → 服务端驱动刷新**。闭环的"形状"由 URL、HTTP 方法、状态码、响应头和 HTML 属性共同构成，而不是由 JS 函数签名构成。这一点决定了每个维度的答案形态。

---

## 1. Loader / 数据加载

### Turbo

- **没有独立的 loader 函数契约**。"加载数据"就是服务端对 GET 请求渲染完整 HTML 文档（或含 `<turbo-frame>` 片段的文档）。Turbo Drive 把导航建模为 **visit**:`Turbo.visit(location, { action: "advance" | "replace" })`,action 决定 history 行为。([Drive 手册](https://turbo.hotwired.dev/handbook/drive))
- **子资源级加载 = `<turbo-frame src>`**：带 `src` 的 frame 出现即自动请求该 URL 并替换自身内容；`loading="lazy"` 延迟到可见才加载。响应中只提取 ID 匹配的 `<turbo-frame>`，其余忽略——同一个 URL 既能当整页也能当片段源，"一页两用"。([Frames 手册](https://turbo.hotwired.dev/handbook/frames))
- **感知性能的"加载"机制**:hover 预取（Turbo v8 默认开启，`<meta name="turbo-prefetch" content="false">` 关闭，请求带 `X-Sec-Purpose: prefetch` 头）;`data-turbo-preload` 预加载进缓存；Drive 页面缓存做 restoration visit 和 application visit 的 preview(`<meta name="turbo-cache-control" content="no-cache|no-preview">` 控制）。([Drive](https://turbo.hotwired.dev/handbook/drive)、[Building 手册缓存节](https://turbo.hotwired.dev/handbook/building))
- **类型如何流到组件**：不存在编译期类型流。最近似的是 Stimulus 的 **values**:`static values = { url: String, interval: Number, params: Object }` 映射到 `data-[identifier]-[name]-value` 属性，按声明类型（Array/Boolean/Number/Object/String）编解码，自动生成 `this.urlValue` getter/setter、`hasUrlValue` 存在性检查和 `[name]ValueChanged(value, previousValue)` 变更回调。([Stimulus Values 参考](https://stimulus.hotwired.dev/reference/values))

### htmx

- **同样没有 loader 函数**。数据加载=任意元素发 AJAX 请求、服务端返回 **HTML 片段**:`hx-get/hx-post/hx-put/hx-patch/hx-delete` + `hx-trigger`（默认按元素类型的"自然事件",input/textarea/select 是 `change`,form 是 `submit`，其他是 `click`)+ `hx-target`（扩展 CSS 选择器：`this`、`closest`、`next`、`previous`、`find`)。([htmx docs](https://htmx.org/docs/))
- 特殊加载触发器：`load`（元素首次加载）、`revealed`/`intersect`（进入视口）、`every 2s` 轮询（服务端回 **286** 状态码停止轮询）、"load polling"(`hx-trigger="load delay:1s"` + `hx-swap="outerHTML"` 自替换循环）。([htmx docs](https://htmx.org/docs/))
- 请求上下文通过**请求头**暴露给服务端：`HX-Request`(always "true")、`HX-Boosted`、`HX-Current-URL`、`HX-Target`、`HX-Trigger`、`HX-Trigger-Name`、`HX-History-Restore-Request`。服务端用这些决定返回整页还是片段。([htmx docs 请求头节](https://htmx.org/docs/))
- **类型流：无**。参数就是 `name` 属性的表单值；可用 `hx-include`/`hx-params`/`hx-vals` 增删，无类型系统。([htmx docs 参数节](https://htmx.org/docs/))

---

## 2. Action / 表单

### Turbo

- **处理模型**:Turbo Drive 拦截表单提交，后台 fetch，全程派发 `turbo:submit-start` → `turbo:before-fetch-request` → `turbo:before-fetch-response` → `turbo:submit-end`；自动 disable submitter。([Drive 手册 Form Submissions](https://turbo.hotwired.dev/handbook/drive))
- **Wire format = 标准 HTML form**。就是浏览器原生表单编码（`application/x-www-form-urlencoded`/`multipart/form-data`),URL 与 method 就是 `<form action method>`。唯一框架约定：非 GET 提交时 **Accept 头注入 `text/vnd.turbo-stream.html`**，允许服务端 content-negotiation 返回 stream;GET 表单/链接默认不加，需 `data-turbo-stream` 显式开启。([Streams 手册](https://turbo.hotwired.dev/handbook/streams))
- **渐进增强**:Turbo 是 opt-out 模型——不拦截时表单就是原生提交，同一 endpoint 两用；`data-turbo="false"` 可在元素或祖先上局部/全局关闭，`Turbo.session.drive = false` 可翻转为 opt-in。CSRF：读 `<meta name="csrf-token">`，提交时自动加 `X-CSRF-TOKEN` 头。([Drive](https://turbo.hotwired.dev/handbook/drive)、[Frames CSRF 节](https://turbo.hotwired.dev/handbook/frames))
- 辅助：`data-turbo-method="delete"`（链接发非 GET)、`data-turbo-confirm`。

### htmx

- **处理模型**：任意事件→AJAX→HTML 片段 swap。表单场景与 Turbo 相同：**wire format 是标准 form 编码**，参数取表单内 input 的 `name`;`hx-encoding="multipart/form-data"` 支持文件上传（发 `htmx:xhr:progress` 事件）。([htmx docs](https://htmx.org/docs/))
- **渐进增强 = `hx-boost` + 双写 endpoint**:`hx-boost` 把作用域内所有 `<a>` 和 `<form>` 转为 AJAX（默认 target 为 body)，无 JS 时退化为原生链接/表单。官方明确建议非 boost 场景用"包一层原生 `<form action>` + 服务端按 `HX-Request` 头区分返回整页/片段"的手法，并坦承"这需要更多思考，是开发者的取舍"。([htmx docs Progressive Enhancement 节](https://htmx.org/docs/))
- **校验**：集成 HTML5 Validation API，校验不过不发请求；`htmx:validation:validate/failed/halted` 事件；`htmx.config.reportValidityOfForms = true` 恢复浏览器原生报错 UI。([htmx docs Validation 节](https://htmx.org/docs/))
- 请求协调：`hx-sync="closest form:abort"`（声明式取消竞态请求）、`htmx:abort` 事件、`hx-confirm`/`htmx:confirm`（可异步确认）。([htmx docs](https://htmx.org/docs/))

---

## 3. Error / Redirect 语义

### Turbo（语义最明确的一家）

- **成功 action 必须回 303**。官方原文：Turbo Drive expects the server to return an HTTP **303** redirect response, which it will then follow。**明确禁止 POST 后回 200 渲染**——原因是浏览器对 POST 页面刷新有"确认重复提交"对话框，Turbo 无法复刻；遇 200 渲染时 Turbo 停留在当前 URL 不导航。([Drive 手册 Redirecting After a Form Submission](https://turbo.hotwired.dev/handbook/drive))
- **校验失败 = 4xx/5xx 直接渲染**，约定俗成为 **422 Unprocessable Content** 渲染带错误的表单；500 渲染错误页。(同上）
- **第三种响应形状 = Turbo Streams**:`Content-Type: text/vnd.turbo-stream.html` + 若干 `<turbo-stream>` 元素，不导航、多点更新。([Streams 手册](https://turbo.hotwired.dev/handbook/streams))
- Frame 场景的"拒绝"语义：响应缺少期望的 `<turbo-frame>` 视为错误，写入提示并抛异常；可用 `turbo:frame-missing` 事件兜底，或让目标页带 `<meta name="turbo-visit-control" content="reload">` 强制整页跳转"破框"（典型场景：会话过期跳登录页）。([Frames 手册](https://turbo.hotwired.dev/handbook/frames))

### htmx

- **默认响应处理表**(`htmx.config.responseHandling`，可经 `<meta name="htmx-config">` 整体重配）:
  - `204` → 不 swap，非错误；
  - `[23]..` → swap;
  - `[45]..` → **不 swap，且标记 error**（触发 `htmx:responseError` 事件）。
    官方给出把 `422` 配成 `swap: true` 的标准配方（表单校验错误重渲染）。([htmx docs Response Handling 节](https://htmx.org/docs/))
- **声明式错误路由 = response-targets 扩展**:`hx-target-404="#not-found"`、`hx-target-5*="#serious-errors"`、`hx-target-error="#any-errors"`；按 `404 → 40* → 4* → *` 逐级通配查找；属性可继承；不可用于 200。([response-targets 文档](https://htmx.org/extensions/response-targets/))
- **Redirect 语义**：普通 3xx 被浏览器/XHR 透明跟随，__3xx 响应上的 HX-_ 头不会被处理_*——官方因此建议"用 htmx 提交表单后不再需要 Post/Redirect/Get，可直接回 200 + 片段"。跳转的框架约定走响应头：`HX-Redirect`（客户端跳转）、`HX-Location`（不整页 reload 的客户端跳转）、`HX-Refresh: true`（整页刷新）、`HX-Push-Url`/`HX-Replace-Url`（改地址栏）、`HX-Retarget`/`HX-Reswap`/`HX-Reselect`（服务端改本次 swap 的目标/方式/选区）、`HX-Trigger[-After-Swap|-After-Settle]`（触发客户端事件）。([htmx docs 响应头节](https://htmx.org/docs/))

---

## 4. Revalidation

### Turbo

三种粒度，由服务端响应形状决定：

1. **整页 revalidation = 303 后的 GET**:action 成功 → 303 → Drive visit → body 替换 + head 合并。这是默认闭环。
2. **细粒度 = Turbo Streams**：一次响应携带任意多个 stream action，共 9 个：`append`/`prepend`/`before`/`after`/`replace`/`update`/`remove`/`morph`/`refresh`(`targets` 属性可用 CSS 选择器打多个目标）。核心论点是**复用同一份服务端模板**完成首屏渲染和后续局部更新。([Streams 手册](https://turbo.hotwired.dev/handbook/streams))
3. **"刷新当前页"协议 = page refresh + morph**:`<turbo-stream action="refresh" [method="morph"] [scroll="preserve"]>` 触发重新请求当前 URL；配合 `<meta name="turbo-refresh-method" content="morph">` 和 `<meta name="turbo-refresh-scroll" content="preserve">`，只 morph 变化的 DOM 并保滚动。广播模型：服务端（经 WebSocket/SSE,`<turbo-stream-source src>`）只广播一个 refresh 信号，所有在线页面平滑自刷新（Rails 参考实现：`broadcasts_refreshes` + `turbo_stream_from`)。([Page Refreshes 手册](https://turbo.hotwired.dev/handbook/page_refreshes)、[Streams 手册](https://turbo.hotwired.dev/handbook/streams))

- **stale 策略**：应用层无 TTL/stale-while-revalidate 概念；只有 Drive 页面缓存（preview + restoration),`turbo-cache-control` meta 或 `Turbo.cache.exemptPageFromCache()/exemptPageFromPreview()` 控制；缓存用 `cloneNode(true)` 复制，**事件监听和数据会丢**,`turbo:before-cache` 事件用于清理。([Building 手册](https://turbo.hotwired.dev/handbook/building))

### htmx

- **无 stale/revalidate 抽象**。Action 成功=服务端直接返回新的 HTML 片段（官方明说"不再需要 Post/Redirect/Get")，一次请求只更新 `hx-target` 一处；要"多点刷新"靠响应里带 **`hx-swap-oob`** 的 out-of-band 元素按 ID 顺带更新别处，或 `HX-Trigger` 头触发其他元素自己的 `hx-get` 重新拉取（事件驱动重新加载）。([htmx docs OOB 节、响应头节](https://htmx.org/docs/))
- **服务端选片**：允许返回整页文档 + 请求方 `hx-select` 只取所需片段；`hx-select-oob` 从响应挑 OOB 内容。([htmx docs](https://htmx.org/docs/))
- **历史/缓存**:history 导航的"revalidation"= localStorage 里的 DOM 快照；miss 时带 `HX-History-Restore-Request: true` 重新请求整页，`htmx.config.refreshOnHistoryMiss` 可改为硬刷新；`hx-history="false"` 禁止快照（敏感数据）。([htmx docs History 节](https://htmx.org/docs/))
- 整页刷新信号：`HX-Refresh: true`；轮询/286 见第 1 节。

---

## 5. 渲染连续性（状态保持）

### Turbo

- **默认 body 替换会丢状态**；官方提供的保持机制：
  - **Morph**:`turbo-refresh-method: morph` 时整页刷新只改变化的节点（底层是 idiomorph)，保焦点、滚动（`turbo-refresh-scroll: preserve`)、屏幕状态；`data-turbo-permanent` 元素跳过 morph（如保持打开的 popover)。([Page Refreshes](https://turbo.hotwired.dev/handbook/page_refreshes))
  - **`data-turbo-permanent` 跨导航保留**：带 id + 该属性的元素在每次渲染前按 ID 从旧页**转移**到新页，保留数据和事件监听（购物车计数器是官方例子）。([Building 手册](https://turbo.hotwired.dev/handbook/building))
  - **Frame 天然隔离连续性**:frame 内导航只换 frame，页面其余部分（滚动、焦点、其他组件）不动；`refresh="morph"` 的 frame 在 page refresh 时以 morph 重载。([Frames](https://turbo.hotwired.dev/handbook/frames)、[Page Refreshes](https://turbo.hotwired.dev/handbook/page_refreshes))
  - **可插拔渲染器**:`turbo:before-render`/`turbo:before-frame-render`/`turbo:before-stream-render` 里覆盖 `event.detail.render`,官方示例直接给 idiomorph/morphdom 接法。([Drive](https://turbo.hotwired.dev/handbook/drive)、[Frames](https://turbo.hotwired.dev/handbook/frames))
  - Stream 的 `update` action 只换 innerHTML 保留元素本身（事件监听存活）,`replace` 则重建；`morph` action 走 idiomorph。([Streams](https://turbo.hotwired.dev/handbook/streams))

### htmx

- **默认 swap(innerHTML/outerHTML 等 8 种）会丢被换区域状态**;`hx-preserve` 标记元素跨 swap 保留（官方例子：视频播放器）。([htmx docs Swapping 节](https://htmx.org/docs/))
- **Morph 是扩展**（非核心）:idiomorph（官方自家）、morphdom-swap、alpine-morph;`hx-swap="morph:outerHTML"` 等；卖点是保焦点、视频状态。([htmx docs Morph Swaps 节](https://htmx.org/docs/))
- **swap/settle 模型**为 CSS transition 服务：swap 前按 id 匹配把旧元素属性复制到新内容，swap 后 settle 延迟（默认 20ms）再上新属性值；`htmx-swapping`/`htmx-settling`/`htmx-added` class 钩子。([htmx docs CSS Transitions 节](https://htmx.org/docs/))
- View Transitions:`htmx.config.globalViewTransitions` 或 `hx-swap` 的 `transition:true` 修饰符。([htmx docs](https://htmx.org/docs/))

---

## 6. 静态与请求时混合

- **两家都没有路由概念，也没有"静态路由声明"机制**。Turbo/htmx 都是后端无关的客户端协议：任何 URL 返回什么（预渲染 HTML、请求时渲染、缓存片段）完全是服务端自由。因此 static 与 dynamic"共存"是天然且无需声明的——声明只发生在**增强范围**上：Turbo 用 `<meta name="turbo-root" content="/app">` 限定 Drive 生效的路径前缀，`turbo-visit-control: reload` 标记某页必须整页加载，`data-turbo="false"` 局部退出。([Drive 手册](https://turbo.hotwired.dev/handbook/drive))
- 最接近"混合渲染设计指导"的官方文字是 Frames 手册的**缓存切分论**:per-user 片段做成独立 `src` frame，其余部分可全用户共享缓存——"frame 对不可见内容基本免费"。这实质上是 MPA 路线对 static/dynamic 分层的答案：**以 frame/片段为单位划分缓存边界，而不是以路由为单位**。([Frames 手册 Cache Benefits 节](https://turbo.hotwired.dev/handbook/frames))
- htmx 侧唯一相关硬约束：推入 history 的 URL 必须能独立返回整页（防止分享/新标签页/历史恢复 miss)。([htmx docs History 节](https://htmx.org/docs/))
- 两家官方文档中均无 SSG/ISR/prerender 声明式配置；与静态站点生成器的具体集成模式**未证实**（属宿主框架职责）。

---

## 7. 对 WC/DSD 架构的可迁移性

**可直接搬的**:

- **HTML-over-the-wire 与模板复用**：服务端模板同时用于首屏和增量更新，与 DSD 的输出物（HTML + `<template shadowrootmode>`）天然同构——DSD 片段完全可以作为 frame/stream/swap 的载体。([Streams 手册 Reusing Server-Side Templates](https://turbo.hotwired.dev/handbook/streams))
- **协议本身是 Custom Elements**:`<turbo-frame>`、`<turbo-stream>`、`<turbo-stream-source>` 就是用 CE 实现的——证明"导航容器/变更指令/实时源"三类角色都能以 CE 表达，openElement 可以直接以 CE 形态定义自己的等价物。([Frames](https://turbo.hotwired.dev/handbook/frames)、[Streams](https://turbo.hotwired.dev/handbook/streams))
- **状态码协议**(303/422）与**响应头协议**(HX-Location/HX-Retarget 一族）：纯 HTTP 语义，不依赖任何客户端渲染假设，无 JS 路径免费获得。
- **声明式属性 API**(hx-_/data-turbo-_)→ 与 WC 的 attribute-driven 模型同构；属性继承（htmx 的 attribute inheritance + `hx-disinherit`）是个可直接借鉴的 DX 设计。
- **Morph(idiomorph）作为保状态交换算法**：对真实 DOM 原地 mutate，不依赖虚拟 DOM,WC 同样适用；`data-turbo-permanent`/`hx-preserve` 的"豁免区"思想也可照搬。
- **refresh stream + 广播**的 revalidation 模型（服务端发信号、页面自刷新）与传输层解耦，可嫁接到 islands 的按需重取水合。

**搬不了/要小心的**:

- **整页 `<body>` 替换 + `<head>` 合并**(Turbo Drive 的渲染基础）假设 light DOM 文档模型；对 DSD/shadow 体系，shadow root 内的状态（已水合岛屿的内部状态）在 body 替换下整棵丢失，只能依赖 morph + permanent 缓解。
- **Stimulus 的挂载模型是全局 MutationObserver + light-DOM data 属性查询**(`data-controller`/`data-action` 描述符、`closest` 等选择器）；官方文档未声明 Shadow DOM 支持，跨 shadow 边界的事件 retargeting 与选择器穿透行为**未证实**，不宜假设可搬。
- **htmx 的 swap 与选择器同样面向 light DOM**(innerHTML/outerHTML swap、全局 CSS 选择器）;shadow root 内 DSD `<template>` 的克隆/激活需要自定义 swap 策略，官方文档未见 shadow DOM 支持声明，**未证实**。
- **Drive 缓存用 `cloneNode(true)` 复制页面、丢弃事件监听与附加数据**——对水合态 WC 岛屿意味着缓存快照会丢水合状态，恢复时需重新水合（这恰好和 DSD 的"HTML 即可重建"哲学兼容，但要意识到这个语义差异）。([Building 手册](https://turbo.hotwired.dev/handbook/building))
- 事件总线（turbo:_/htmx:_）依赖 DOM 事件冒泡；shadow 内触发需要 `composed: true` 约定，属自建部分。

---

## 最终判断：只抄一样，抄什么

**抄 Turbo 的"action 结果三态状态码协议"——成功=303 到 GET、校验失败=422 原地重渲染、细粒度更新=内容协商的 stream 响应。**

理由：

1. **它是闭环的地基而不是增强**。它把 action → error/redirect → revalidation 三步压缩成一个纯 HTTP 契约：303 天然触发 revalidation（重取 GET 资源）,422 天然携带错误态（重渲染的表单），且**无 JavaScript 时浏览器原生就是这套语义**（原生 form POST 跟随 303、直接渲染 422 响应体）——正好命中 openElement "必须有无 JS 可用路径"的硬约束。JS 层（Drive 拦截、streams）只是同一协议的加速器，不是协议本身。
2. **它不依赖虚拟 DOM/客户端渲染假设**，零迁移成本嫁接到 "组件=Custom Element、SSR=DSD" 的模型：303 后整页 DSD 重渲染、422 重渲染含错误的 DSD 片段，都成立。
3. 相比之下，htmx 的 HX-* 响应头协议（第二候选，值得作为 303 的补充引入）功能更强，但 3xx 响应上的头会被浏览器吞掉、需要 JS 才能消费；Turbo Streams 的 stream action 协议（第三候选，适合作为 JS 增强层的第二点引入）表达力最强，但同样纯 JS 依赖。三态状态码协议是唯一在无 JS 下仍然完整成立的那个。

**一句话**:openElement 的 action 协议应规定"action 端点不得对成功的非 GET 请求回 200 渲染，必须回 303；校验失败回 422 + 重渲染；JS 在场时通过 Accept 内容协商升级为片段/stream 响应"——这是 Hotwire 体系里对 static-first + 无 JS 降级框架含金量最高、且唯一能原样搬走的设计。
