# openElement 全量项目审计报告

- **审计日期**：2026-07-26
- **审计范围**：`packages/`（element / app / adapter-vite / ui / create）、`tools/`、`vendor/`、`www/`、`docs/`、根配置与 CI
- **代码规模**：约 58K 行 TS（packages+tools+vendor）+ 大型 `www/` 站点与 `docs/`
- **审计方法**：5 个并行只读审查智能体，分别覆盖 架构 / 代码质量 / 安全 / 性能 / 依赖·整洁度·市场；结论均基于真实文件与 `git`/`deno.lock` 实证
- **技术栈**：Deno workspace、TypeScript(strict)、Web Components、JSX、@preact/signals、Vite + Nitro

> 说明：本报告为静态分析结论。性能维度未运行基准脚本，相关结论基于源码路径与已知门禁阈值（`stress-gate: maxLatencyMs=5000, maxRssGrowthMb=64`）。

---

## 一、总体结论（Executive Summary）

| 维度 | 整体评价 | 关键风险等级 |
|------|----------|--------------|
| 架构设计 | 依赖图干净、契约被机械化校验（强项）；运行时内核有"桶化"趋势 | 中 |
| 代码质量 | 风格/类型纪律强，问题为局部收尾项 | 低-中 |
| 安全性 | 默认转义模型健壮；残余风险多为"约定而非强制" | 中（1×High） |
| 性能 | 内存卫生好；列表/条件区无 keyed 协调是头号热点 | 中（1×High） |
| 可维护性 | 多层门禁 + 高质量"为何"注释，高于平均水平 | 低 |
| 依赖管理 | 锁定/vendor/Action SHA 钉死强；服务端栈踩 beta + 个别弃维护依赖 | 中 |
| 市场定位 | 范围诚实度高；文档内部 alpha/stable 自相矛盾 | 中 |
| 仓库整洁 | 产物正确忽略、无密钥泄露；含设计 PNG/示例 PDF、陈旧分支 | 低 |

**一句话**：openElement 的工程纪律（门禁、契约校验、类型安全、文档对齐）是其最大资产；最该先修的是 **1 个 P0 安全信任边界**（`trustedHtml` 仅靠约定）和 **2 个 P1 结构性问题**（列表无 keyed 协调、`element` 包吸收了本属契约层的构建/路由契约）。

---

## 二、发现汇总表（按优先级）

| 优先级 | 编号 | 维度 | 问题 | 严重度 |
|--------|------|------|------|--------|
| **P0** | SEC-F1 | 安全 | `trustedHtml`/`innerHTML` 原始 sink 仅约定、未编译期强制 | High |
| **P1** | ARCH-1 | 架构 | 构建契约 `build-utils` 落在运行时 `element` 包，违背 ADR-0050 | Medium |
| **P1** | PERF-1.1 | 性能 | `list`/`signal-render`/`conditional` 无 keyed 协调，整列销毁重建 | High |
| **P1** | PERF-1.2 | 性能 | SSR `renderToNode` 逐节点 `await`（N 节点 = N 个 Promise） | Medium |
| **P1** | PERF-3.1 | 性能 | `visible` 策略每 island 类型 `querySelectorAll`+`MutationObserver` | Medium |
| **P1** | SEC-F2 | 安全 | `redirect()` 开放重定向，无同源/相对路径校验 | Medium |
| **P1** | MKT-C2 | 市场 | 文档内部 alpha↔stable 与 #390 pilot 表述自相矛盾 | Medium |
| **P2** | ARCH-2 | 架构 | 应用层协议类型（route/data/model）驻留运行时 `element` 包 | Medium |
| **P2** | ARCH-3 | 架构 | 内核 `as unknown as` 类型逃逸集中在 DSD/island/prop（~10 文件，已 allowlist） | Medium |
| **P2** | ARCH-4 | 架构 | 5 包合并放弃契约层却无 ADR 记录该决策（治理缺口） | Low-Med |
| **P2** | ARCH-5 | 架构 | 大模块/变更风险集中（OpenElement 基类 626 行、binding-activation 534 行） | Low |
| **P2** | ARCH-6 | 架构 | 流程开销偏高（112 篇 ADR + 大量门脚本，反复"闭包/冻结"） | Low |
| **P2** | Q-F1 | 代码质量 | `'dist'`/`'.openElement'` 魔法字符串在 adapter-vite 重复 ~12 处 | Medium |
| **P2** | Q-F2 | 代码质量 | 类型安全门未拦 `as unknown as`/`@ts-ignore` | Low-Med |
| **P2** | Q-F3 | 代码质量 | `tools/lib` 缺共享 `readJson`/`readText` | Low |
| **P2** | Q-F4 | 代码质量 | `element` 中下划线前缀的"公开"方法命名歧义 | Low |
| **P2** | Q-F5 | 代码质量 | `no-sloppy-imports` 全仓禁用但未在 CONTRIBUTING 记录原因 | Low |
| **P2** | Q-F6 | 代码质量 | 大模块需函数长度监控（binding-activation 等 ~500 行） | Low |
| **P2** | SEC-F3 | 安全 | MDX 内容未走 `sanitize-html`（与 markdown 管线不一致） | Medium |
| **P2** | SEC-F4 | 安全 | `open-code-block` 客户端 `innerHTML` 消费第三方高亮器输出 | Low |
| **P2** | SEC-F5 | 安全 | CSP 支持但默认 opt-in | Low |
| **P2** | PERF-1.3 | 性能 | 组件级 `update()` 整体重渲染，无 VDOM diff | Medium |
| **P2** | PERF-2.1 | 性能 | 单体非流式 SSR 序列化（整页驻留内存） | Medium |
| **P2** | PERF-2.2 | 性能 | 每次 `renderDsd` 新建组件实例（无池化） | Low |
| **P2** | PERF-5.3 | 性能 | `build.ts` 三阶段全量重建，无跨构建增量缓存 | Low |
| **P2** | DEP-A2 | 依赖 | pin 策略不统一；vite 钉在已落后补丁 8.0.10 | Low |
| **P2** | DEP-A3 | 依赖 | `create-fresh@latest` 在 lock 中为非确定性孤立条目 | Low |
| **P2** | DEP-A4 | 依赖 | `flexsearch@0.7` 实际已无人维护 | Low |
| **P2** | DEP-A5 | 依赖 | `@preact/signals` import-map 在已发布 workspace 可能冗余 | Low |
| **P2** | DEP-B2 | 整洁 | 提交了设计稿 PNG 与示例 PDF（二进制） | Low |
| **P2** | DEP-B3 | 整洁 | hygiene 脚本未覆盖密钥/大二进制扫描 | Low |
| **P2** | DEP-B4 | 整洁 | 大量长期/陈旧分支未清理 | Low |
| **P2** | MKT-C3 | 市场 | "stable 0.41.x" 措辞易被误读为生产就绪 | Medium |
| **P2** | MKT-C4 | 市场 | GTM 缺口：无外部采用者、示例偏薄 | Medium |
| **P2** | MKT-C5 | 市场 | 市场主张与服务端依赖成熟度挂钩需透明 | Low-Med |
| **P3** | Q-F5b | 代码质量 | （同 Q-F5 治理）文档化即可 | Low |

---

## 三、分维度详细发现

### 3.1 架构设计（audit-arch）

**强项**：跨包依赖严格单向、无环、无方向违规、无内部 API 泄漏，且被 `tools/check-package-graph.ts` 机械化校验；protocol-seam 类型为纯 `export type`；公共接口快照冻结与 ADR-0119 绑定。

- **ARCH-1（Medium/P1）** — 构建契约 `build-utils` 落在运行时 `element` 包。
  - 证据：`packages/element/deno.json:8` 暴露 `"./build-utils"`；`element/src/build-utils.ts:12-18` 导出 `createRuntimeAdapter`/`transformIslandSource`/`createIsrCacheKey`/`OpenElementRequestHandler` 等 SSR/构建桥接逻辑；`adapter-vite` 多处消费（`build.ts:18-19`、`build-plan.ts:7`、`build-ssg.ts:31`、`nitro-mount.ts:1` 等）。
  - 冲突：ADR-0050（2026-05-26）明确"build contracts shared by adapter-vite … should move to a contracts layer"。后果：已发布的 `element` npm 包随浏览器运行时分发 SSR 代码，并使内核与构建内部耦合。
  - 建议：抽为独立 `@openelement/contracts`（或下移到 adapter-vite）；至少文档化为刻意保留的"冻结桥"并禁止继续膨胀。
- **ARCH-2（Medium/P2）** — 应用层协议类型（route/data/model）驻留运行时 `element`。
  - 证据：`element/src/index.ts:86` 导出 `Action/ActionContext/Loader/LoaderContext`；`:107` 导出 `OpenElementRouteNode`；`app/src/model.ts:2-3` 反向从 `element` 引入。与 ADR-0050（勿推 route 概念入运行时）、ADR-0111（route 所有权归 app）冲突。0.41 可冻结，记为 0.42+ 债务。
- **ARCH-3（Medium/P2）** — 类型逃逸集中在内核。
  - 证据：生产代码 `as unknown as` 分布在 10 个 element 核心文件（`open-element-implementation.ts`、`open-element-render.ts:92-99`、`binding-activation.ts:62-65`、`render-dsd.ts:102-105` 等），由 `check-architecture-contract.ts:43-106` 的 `TYPE_ESCAPE_ALLOWLIST` 手工收录。说明内核抽象（OpenElementLike 不继承 HTMLElement、动态 prop 赋值、SSR 桩）与类型系统对抗。
  - 建议：引入带类型的 `ElementLike`/`DomShim` 模块，逐步收敛 allowlist。
- **ARCH-4（Low-Med/P2，治理缺口）** — ADR-0050 规划的 `@openelement/contracts`/`style-sheet`/`cem`/`content`/`i18n`/`hub` 分层被 5 包合并取代，但无 ADR 显式"取代"并解释为何放弃契约层、build/route 契约为何驻留 `element`。建议补一条 ADR 记录该决策与未来抽离条件。
- **ARCH-5（Low/P2）** — 大模块：`open-element-implementation.ts` 626 行（混合生命周期/渲染/水合/信号）、`binding-activation.ts` 534、`client-router.ts` 519、`entry-render-helpers.ts` 474。建议拆分以缩小回归爆炸半径（API 已冻结，非紧急）。
- **ARCH-6（Low/P2）** — 流程开销：约 112 篇 ADR，反复出现"冻结/闭包/审计"主题；大量专用门脚本。建议收敛为单一 `tools/check-arch` 入口，精简已取代 ADR 为决策日志。

**最大单一风险**：`@openelement/element` 吸收了本属契约层的 build 契约与应用模型协议，使内核成为事实上的"桶"，并把浏览器运行时与构建时代码耦合。一旦 0.42+ 的 request-time data/forms/sessions/cache 需独立演进，改动将被迫穿透已冻结的运行时包。

### 3.2 代码质量（audit-quality）

**强项**：`fmt:check`+`lint`+`coverage`+`type-safety`+`docs-integrity`+`arch-contract` 均为多层门禁（dev/push/ci/release）；生产代码零 `deno-lint-ignore`、无 `debugger`；注释为高信号"为何"（带版本/缺陷/ADR 引用）；文档↔代码对齐被机器校验；生产代码零 `any`；采用 option-object 而非 boolean flag。

- **Q-F1（Medium/P2）** — `'dist'`/`'.openElement'` 魔法字符串在 `adapter-vite` 约 12 处硬编码（`build.ts:112,202`、`build-plan.ts:75`、`build-ssg.ts:158`、`build-context.ts:78,204` 等）。建议抽到共享常量 `DEFAULT_OUT_DIR`/`OPEN_ELEMENT_DIR`。
- **Q-F2（Low-Med/P2）** — 类型安全门（`check-type-safety.ts`）仅禁 `as any`/`: any`，未拦 `as unknown as`（`open-element-implementation.ts:102` 等）与 `@ts-ignore`。建议扩展扫描或加定向 lint，并将不可避免 DOM 转型集中到 `internal/cast.ts`。
- **Q-F3（Low/P2）** — `tools/lib/fs.ts` 仅 `walk`/`exists`；~37 个 tools 文件重复 `JSON.parse(await Deno.readTextFile(...))`。建议补 `readJson`/`readText`。
- **Q-F4（Low/P2）** — `element` 中下划线前缀的"公开"方法（`_resetGlobalStyles()`/`:158`、`_lifecycleSignal()`/`:245`、`_setTimeout()`/`:253`）命名歧义。建议用 `@internal` + 非下划线名，或真正私有化。
- **Q-F5（Low/P3）** — `deno.json:132` 禁用 `no-sloppy-imports`（Deno 要求 `.ts` 后缀，属有意但非显然）。建议在 CONTRIBUTING 记录。
- **Q-F6（Low/P2）** — 大模块需函数长度监控；采样未见 >100 行函数，但 ~500 行文件值得定期复核。
- **Q-F7（Low/已缓解）** — 生产代码无 `TODO`/`FIXME`/`HACK`；未用导出风险被 `interface:snapshot`+`package-surface:check` 门禁抑制。

**结论**：可维护性高于平均；发现均为 P2 收尾项，无 Critical/High。

### 3.3 安全性（audit-security）

**强项**：核心 SSR/DSD 序列化的文本节点走 `escapeHtml()`、属性走 `escapeAttr()`；`innerHTML` JSX prop 默认转 `textContent`，仅 `trustedHtml` 才原始注入；客户端 SSR-prop 恢复经 `injectPropsSafe`+`DANGEROUS_KEYS` 防原型污染；head 注入做了 URL scheme 白名单、`@import`/`expression` 拒绝；博客 markdown 走 `sanitize-html` 严格白名单；源码无密钥、无 `eval`/`new Function`（测试外）；依赖锁固定、CI Action SHA 钉死。

- **SEC-F1（High/P0）** — `trustedHtml`/`innerHTML` 原始 sink 仅约定、未编译期强制。
  - 证据：`jsx-render-dom.ts:186-187`（`if (trustedHtml) el.innerHTML = ... else textContent`）、`render-ir.ts:264-266`、`binding-activation.ts:291`；`security.ts:44-52` 的 `trustRenderHtml()` 是透传；ADR-0064 自承"pipeline constraint 仅是约定，非编译器保证"。
  - 风险：安全默认要求开发者（或未来 AI 生成组件）"别设 `trustedHtml`"，但无任何东西阻止 `<div innerHTML={requestParam} trustedHtml />` 或把 loader/query/route-param 导入原始 sink。
  - **修复（最高杠杆）**：把 `innerHTML` prop 仅接受 branded `SafeHtml`/`UnsafeHtml` 类型（`rawHtml(value)` 返回 brand、`sanitizeHtml()` 返回 `SafeHtml`）；`trustedHtml` 隐含非 brand 的 `string` 在 tsc 拒绝；加 ESLint 规则禁止 `trustedHtml` 配合非 brand 值；文档明确请求数据须先过 `sanitize-html`。
- **SEC-F2（Medium/P1）** — 开放重定向。
  - 证据：`app/src/authoring.ts:71-73` `redirect(location, status=302)` 接受任意 URL；`entry-render-helpers.ts:220` `c.redirect(err.location, err.status)` 直接反射到 `Location` 头；Hono 不限制外部目标。
  - 修复：适配器在发重定向前校验——仅允许同源相对路径（剥 scheme/host，拒绝 `//`、`javascript:`），或配置 host 白名单；违规失败闭合到 `/`。
- **SEC-F3（Medium/P2）** — MDX 内容未 sanitize（对比 markdown 管线 `marked`+`sanitize-html`）。`plugin-mdx.ts:9-14` 把 `.mdx` 编译为 JSX，原始 `<script>` 会被序列化为真实 `<script>` 在浏览器执行。若 MDX 渲染任何非构建期/CMS 内容即 XSS 向量。建议：限定 MDX 仅用于可信构建期内容并文档化，或在进入 `trustedHtml` 前过 `sanitize-html`（同白名单），至少用 MDX/remark 配置禁用 `<script>`/`<iframe>`/`<object>`。
- **SEC-F4（Low/P2）** — `ui/src/open-code-block.tsx:225` `highlightedCode.innerHTML = html`，`html` 来自第三方高亮器（输入为 `codeEl.textContent`、grammar 固定）。实际风险低，但建议 grammar 钉死/白名单，若 grammer 变成动态则从 `sanitize-html`/`DOMPurify` 过一遍。
- **SEC-F5（Low/P2）** — CSP 支持但默认 opt-in（`entry-render-helpers.ts:429,435` 有 nonce 管线、`head-injection.ts` 支持 SRI）。建议生成应用默认启用严格 CSP（带 nonce），可即使误用原始 sink 也中和 F-1/F-3。

**已验证非问题**：原型污染有防护；静态服务委派给宿主（无框架层路径遍历）；无密钥泄露；生产无 `eval`/`new Function`；YAML 仅用于可信 CI 文件；依赖锁固定 + Action SHA 钉死。

### 3.4 性能（audit-perf）

**强项**：内存卫生好（WeakMap 主导、`MemoryIsrCache` 有界 LRU maxEntries=1000、observer/timer 均清理，未发现持久泄漏）；细粒度 `signal-*` binding 仅该节点更新开销极低；构建期 SSG 已并行、MDX 已缓存；`packages/ui` 仅依赖 `element`、支持深路径导入、tree-shaking 友好。

- **PERF-1.1（High/P1，头号热点）** — `list`/`signal-render`/`conditional` 无 keyed 协调，每次信号变更整列销毁重建。
  - 证据：`binding-activation.ts` `applyList`(L419-496) 先 `clearRender()` 移除所有子节点并 `dispose()` 全部嵌套 effect，再为每项重新 `render()`；`applySignalRender`(L302-359)、`applyConditional`(L361-417) 同样整块重建；`currentNestedDisposers` Set 被所有 item 共用，任一 item 变更都拆解重建全部。
  - 影响：O(n) DOM + O(n) effect 创建/销毁，单条变更触发整列重建，嵌套响应式放大。大列表最显著热点。
  - 建议：引入基于稳定 key 的位置协调（保留未变节点，仅增删/移动差异），至少做 positional 复用；大列表更新从 O(n) 降到 O(k)。
- **PERF-1.2（Medium/P1）** — SSR `renderToNode` 对每个节点 `await`（`render-ir.ts:193-313`，L212/L271），连叶子静态节点也经 Promise 微任务链，N 节点 = N 个 Promise。建议仅在嵌套 DSD 异步边界 `await`，其余同步拼装。
- **PERF-3.1（Medium/P1）** — `visible` 策略每 island 类型 `document.querySelectorAll(tag)` + `document.body` 上 `subtree:true` 的 `MutationObserver`（`island.ts:152-174`），随 island 种类 K 线性膨胀。建议全局单一 `IntersectionObserver`/`MutationObserver` 按 `[data-open-island]` 一次扫描分发，observer 数降为 O(1)。
- **PERF-1.3（Medium/P2）** — 组件级 `update()`→整树 `renderToDom`（`open-element-implementation.ts:560-578`），框架无调度器；仅用细粒度 `signal-*` 才避免重渲染。建议文档/示例强调细粒度 binding，或给 `<For>/<Show>` 加最小 keyed reconciler。
- **PERF-2.1（Medium/P2）** — 单体非流式 SSR 序列化（`render-ir.ts:153-189`、`render-dsd.ts:321`），整页单字符串驻留内存。大页改流式 `ReadableStream` 或先数组缓冲再 join，降低峰值 RSS、更早 TTFB。
- **PERF-2.2（Low/P2）** — 每次 `renderDsd` 新建组件实例（`render-dsd.ts:97`），无状态实例池化。影响小。
- **PERF-5.3（Low/P2）** — `build.ts` 三阶段（SSR bundle / SSG / client）全量重建，无跨构建内容/产物增量缓存。建议对未变更路由做内容级缓存或增量 SSG。

**诚实声明**：未运行基准/压力脚本，上述为源码路径推断；PERF-1.1 实际放大倍数、PERF-1.2 在万级节点下的 Promise 成本需 `tools/run-dogfood-stress.ts` 实测。

### 3.5 可维护性（见 3.2，独立小结）

- 强项：多层强制门禁、带版本/缺陷/ADR 引用的高质量"为何"注释、机器校验的文档↔代码对齐、生产零 `any`、option-object API。
- 弱项：魔法字符串重复（Q-F1）、类型安全门漏 `as unknown as`（Q-F2）、tools 缺共享 helper（Q-F3）、下划线公开方法命名歧义（Q-F4）。
- 测试覆盖：`test:coverage:check` 强制 73/82/77（行/分支/函数），门禁在 `ci`；`test:critical-paths` 亦为 `ci` 门。覆盖门禁存在且执行（由 `check-coverage.ts` 自身 spawn `deno test --coverage`）。

### 3.6 依赖管理（audit-deps-market Part A）

- **DEP-A1（Med-High/Medium，供应链成熟度）** — `nitro@3.0.0` 实为 beta 线，`deno.lock` 传递依赖含 `h3@2.0.1-rc.22`（release candidate）。npm 上稳定服务端引擎是 `nitropack` 2.x。建议：在文档/ADR 明确记录"服务端依赖 Nitro v3 beta + h3 RC"风险，跟踪稳定线迁移；对外宣称"fullstack WC 领导力"时不要暗示服务端栈已生产就绪。
- **DEP-A2（Low/Medium）** — pin 策略不统一：vite/nitro/terser 用精确版本，`@hono/vite-dev-server` 用 `~`，其余 `^`；`vite@8.0.10`（2026-04-23）截至审计日已有 8.0.16、8.1.x 等带修复版本。建议统一策略，vite 考虑 `^` 自动收补丁/安全更新，或建立定期升级节奏（已有 Dependabot）。
- **DEP-A3（Low/Low）** — `deno.lock:21` 含 `npm:create-fresh@latest`（非确定性），但全仓 import-map 无引用，仅来自 `examples/open-element-in-fresh`。建议在该示例自身 import-map 钉精确版本，或从 lock 清理。
- **DEP-A4（Low/Low）** — `flexsearch@0.7.43`（0.7 为最后真实线，0.8 重写从未发布）。评估替代（minisearch/flexsearch-next）或 vendor 钉版本。
- **DEP-A5（Low）** — `@preact/signals` import-map 条目在已发布 workspace 可能未被使用（`packages/element` 实际用 `@preact/signals-core`）。若仅 Fresh 示例用，收敛到该示例自身 import-map。
- **DEP-A6（Positive）** — `deno.lock` 带 integrity；CI `deno install --frozen` + `git diff --exit-code deno.lock`；`vendor/` 有意使用；`nodeModulesDir:"manual"` 为设计；所有 GitHub Action 均 SHA 钉死（`check-action-pins.ts` 强制）+ `dependency-review-action`。
- **DEP-A7（Low）** — action pin 校验未强制"具体 SHA 值"（仅要求 40 位 SHA + 4 个已知 action 须版本注释），Dependabot 更新 SHA 但不更新注释，需手工同步。建议 Dependabot PR 自动同步注释或降为独立文档。

### 3.7 仓库整洁度（audit-deps-market Part B）

- **DEP-B1（Positive）** — `git check-ignore` 确认 `dist/`、`custom-dist/`、`dist-test-*/`、`playwright-report/`、`test-results/`、`.openElement/`、`node_modules/`、`www/dist` 均被忽略；追踪的 `.DS_Store`/根 `node_modules` = 0。无产物误提交。
- **DEP-B2（Low）** — 提交了设计稿 PNG（`www/design/mockups/v4/*.png`）与示例 PDF（`examples/deno-desktop-reader/fixtures/books/*.pdf`）。建议 PNG 移出仓库（git-lfs/外部存储）或加 `.gitignore`；PDF 属合理 fixtures。
- **DEP-B3（Low）** — `tools/check-repo-hygiene.ts` 覆盖产物/残留/分支残留等，但不扫描密钥/`.env`/大二进制/设计资产（故 B2 未被捕获）。建议扩展扫描密钥模式（`.env`、`.pem`、`secret`）与追踪大二进制。
- **DEP-B4（Low）** — 大量长期/陈旧分支（`codex/deep-refactor`、`feature/alpha16-19-*`、`docs/alpha17-18-closure`、多条 dependabot）。建议合并/废弃后清理，改短生命周期 PR 分支。
- **DEP-B5（Positive）** — 提交历史纪律性强（审计驱动的发布/证据门禁流程，无调试日志/密钥被追踪）。

### 3.8 市场定位（audit-deps-market Part C）

- **MKT-C1（Positive）** — 定位诚实度总体高：`README.md:48-50` 明确"strategic target is WC fullstack leadership … not an already-achieved claim"；`:63-64` 诚实限定为"static-first … not broad fullstack parity"；`ROADMAP.md` 点名竞品并说明差异化。
- **MKT-C2（Medium/**High**，对外发布前必修）** — 文档内部自相矛盾：`STATUS.md:9` 写"stable (0.41.x)"、`:19,45` 称"#390 pilot 因 zero recruitment 被废弃"；但 `README.md:11` 仍称"alpha"、`:56-57` 称"#390 remains primary condition"，`README.zh.md`/`ROADMAP.md:12` 同样写 alpha + #390 待决。**切勿 STATUS 称 stable 而 README 称 alpha**——建议统一口径（三处均保持"alpha + 范围化接口冻结"，或 STATUS 精确定义"stable"仅指接口冻结并同步修订）。
- **MKT-C3（Medium/Medium）** — "stable 0.41.x" 易被误读为生产就绪；而 request-time data/forms/sessions/cache 尚不稳定。建议全文档用精确措辞（"interface-stable alpha"/"0.41.x interface freeze"），"stable" 保留给 1.0.0。
- **MKT-C4（Medium/Medium）** — GTM 缺口：#390 pilot 因零招募被废弃（无外部生产采用者）；workspace 仅 2 个桌面示例 + 1 个非 workspace Fresh 示例。建议在取得外部采用者前软化生产就绪措辞，扩充示例矩阵，新增公开采用/案例页，加强"为何选 openElement vs Astro/Lit"对比与 onboarding。
- **MKT-C5（Low-Med/Medium）** — "WC fullstack leadership" 部分建立在 Nitro 适配器与 WC SSR 证据上，但 Nitro 为 v3 beta、h3 为 RC，request-time 能力属未来工作——主张虽被诚实框定为"目标"，目前仅由 alpha 阶段证据支撑。建议对外材料对服务端 beta 依赖保持透明。

---

## 四、优先级行动建议（Action Plan）

### P0 — 立即修（安全信任边界）
1. **SEC-F1**：把 `innerHTML`/`trustedHtml` 改为 branded `SafeHtml`/`UnsafeHtml` 类型，`rawHtml()`/`sanitizeHtml()` API，使未授信 `string` 无法到达原始 sink；加 ESLint 规则。这是全项目最高杠杆修复。

### P1 — 本迭代修（结构性）
2. **PERF-1.1**：为 `list`/`signal-render`/`conditional` 引入 keyed/positional 协调，消除整列重建（头号性能热点）。
3. **ARCH-1**：将 `build-utils` 构建契约移出运行时 `element` 包（抽 `@openelement/contracts` 或下移 adapter-vite），收敛内核。
4. **PERF-1.2 + PERF-3.1**：SSR 仅在 DSD 异步边界 `await`；`visible` 策略改全局单一 observer。
5. **SEC-F2**：`redirect()` 加同源/相对路径校验，失败闭合到 `/`。
6. **MKT-C2**：统一 README/STATUS/ROADMAP 的 alpha↔stable 与 #390 表述（影响对外可信度）。

### P2 — 计划内收尾
7. 架构：ARCH-2（route/data 协议归位 app）、ARCH-3（收敛 `as unknown as` allowlist）、ARCH-4（补 ADR 记录 5 包决策）、ARCH-5/6（拆分大模块、收敛门脚本）。
8. 代码质量：Q-F1（魔法字符串常量）、Q-F2（类型安全门扩到 `as unknown as`/`@ts-ignore`）、Q-F3（tools 共享 helper）、Q-F4（公开方法命名）、Q-F6（函数长度监控）。
9. 安全：SEC-F3（MDX sanitize 或限定构建期）、SEC-F4（高亮器输出 sanitize）、SEC-F5（默认启用 CSP+nonce）。
10. 性能：PERF-1.3（文档化组件级重渲染）、PERF-2.1（流式 SSR）、PERF-2.2/PERF-5.3（实例池化、构建增量缓存）。
11. 依赖：DEP-A2（统一 pin + vite 升级）、DEP-A3（清理 create-fresh@latest）、DEP-A4（flexsearch 维护风险）、DEP-A5（signals import-map 收敛）。
12. 整洁/市场：DEP-B2（设计 PNG 移出）、DEP-B3（hygiene 扫描扩到密钥/大二进制）、DEP-B4（清理陈旧分支）、MKT-C3/C4/C5（措辞精确、扩充示例与采用页、服务端 beta 透明）。

---

## 五、强项清单（值得保留）

- 跨包依赖图干净、无环、无内部 API 泄漏，且被 `check-package-graph.ts` 机械化校验。
- 多层强制门禁（fmt/lint/type-safety/coverage/docs-integrity/arch-contract）使工程纪律非可选。
- 文档↔代码对齐被机器校验；注释为高信号"为何"并带版本/缺陷/ADR 引用。
- 安全默认转义模型健壮，原型污染/路径遍历/密钥泄露均有防护。
- 内存卫生好（WeakMap + 有界 LRU），未发现持久泄漏。
- 依赖锁定 + vendor + GitHub Action SHA 钉死，供应链基础扎实。
- 定位在"范围"与"领导力作为目标而非既成事实"上异常诚实（除 C2 内部矛盾外）。

---

## 六、附录：各审计智能体产出索引

- 架构：`audit-arch` — 6 项发现 + verdict（依赖图实证、ADR 对照）
- 代码质量：`audit-quality` — 7 项发现（F1-F7）+ verdict（无 Critical/High）
- 安全：`audit-security` — F-1~F-5 + 已验证非问题
- 性能：`audit-perf` — 1.1~7 节 + verdict（Top1 = PERF-1.1）
- 依赖/整洁/市场：`audit-deps-market` — Part A(1-7)/B(1-5)/C(1-5)
