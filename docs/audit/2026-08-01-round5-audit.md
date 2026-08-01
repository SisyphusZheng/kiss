# openElement 第五轮全仓审计报告（round 5 full-spectrum audit）

- 审计日期：2026-08-01，基线 HEAD `c036cb95`（v0.42.0-alpha.10 收盘后，工作树干净）
- 审计主题：代码质量 / 功能鲁棒 / 代码冗余 / 重复实现 / 文档失实 / 坏味道（六维度全覆盖）
- 方法论：8 个分区并行扫描（element / app / adapter-vite / ui+create / tools / docs / www / 根目录+examples+.github），所有「死代码/死导出」结论经全仓 Grep 引用验证（排除 node_modules/vendor/dist/.git，覆盖 deno.json exports/tasks、workflows、e2e、fixtures）；所有 high 级发现由协调者本人抽查复核（.githooks 文件模式、site-ui 注册、blog locale 回退、ROADMAP 漂移、首页示例、JSX ref 均亲自验证属实）。
- 去重基线：`2026-08-01-senior-review.md`、`2026-08-01-round4-hygiene.md`、全部 open issues（#725–#752 已关闭，上轮发现多数已落地修复）。

<!-- audit-citations-baseline-sha: c036cb953a93696ba303a4a54b5eb77b267d2bea -->

- 引用时效护栏：本报告所有 `file:line` 引用已按 `tools/check-audit-citations.ts` 复核（working tree @ HEAD `c036cb95`）。

---

## 发现清单（按维度分组）

### 1. 代码质量

- **[high] JSX `ref={callback}` 被静默丢弃，文档承诺的 API 完全不生效** — `packages/element/src/internal/core/jsx-runtime.ts:119-127`、`src/internal/protocol/vnode.ts:28-29`、`src/internal/core/jsx-render-dom.ts:172-175`、`render-ir.ts:100-107`
  证据：`createVNode` 把 `ref` 写入 `vnode.ref`，全仓无任何读取方；ADR-0057:227 把 `<div ref={callback}>` 列为受支持约定，VNode.ref 的 JSDoc 承诺 "called with the DOM element after mount"；无任何 ref 测试。
  建议：在 `renderNode`/`renderToNode` 消费 `vnode.ref`，或删除字段与文档。

- **[medium] `useLoaderData<T>()` 返回类型撒谎** — `packages/app/src/internal/router/data-context.ts:28-30`
  证据：三条合法路径返回 `undefined` 却 `as T` 标为 `T`；同文件 `useActionData(): T | undefined`（:42-43）诚实标注——姊妹函数返回形状不一致。反例：无 loader 路由里 `useLoaderData<{m:string}>().m` → 运行时 TypeError。
  建议：改 `T | undefined` 或文档化契约并断言。

- **[medium] Array/Object prop 声明的类型是谎言** — `packages/element/src/internal/protocol/prop.ts:12-33`、`src/internal/core/prop.ts:192-209,166-185`
  证据：`PropDecl` 允许 Array/Object，`PropsFrom` 推导 `unknown[]`，但 attribute→signal 同步从不 `JSON.parse`。反例：`{ items: { type: Array } }` SSR 出 `items="[1,2]"`，客户端拿到字符串而类型说是数组。
  建议：attribute 路径做 JSON.parse（失败回退 default），或从 PropDecl 删掉 Array/Object。

- **[medium] ISR 缓存类型自相矛盾，`CacheAdapter` 零实现** — `packages/element/src/internal/core/isr-runtime.ts:19,108-114`、`src/internal/protocol/isr.ts:18-24`
  证据：`IsrRuntimeOptions.cache` 硬类型为 `MemoryIsrCache`，而该类并不实现 `CacheAdapter`；全仓无 CacheAdapter 实现；`cached.state==='error'` 分支不可达；JSDoc 声称 0.44 KV adapter 但类型上传不进来。
  建议：cache 改为真协议接口，删不可达分支。

- **[medium] 三个「死选项/死配置」文档撒谎** — `packages/element/src/internal/protocol/island.ts:24-25`（`IslandOptions.tagName` 从不读取）；`packages/app/src/preact.ts:28-30`（`PreactIslandOptions` 继承的 `hydrate`/`dsd` 从不读取，用户传 `hydrate:'visible'` 实际立即激活）；`packages/adapter-vite/src/internal/content/blog/types.ts:41-46`（`layoutTag`/`containerClass` 零读取方，JSDoc 还写了不存在的默认值）
  建议：删除或实现；PreactIslandOptions 收窄为 `{ssr, props}` 做到 fail-closed。

- **[medium] ui 两个组件 observedAttributes 与动态更新脱节** — `packages/ui/src/open-badge.tsx:70-84`（观察 tone/size 但无 attributeChangedCallback，`setAttribute` 静默无效）；`packages/ui/src/open-input.tsx:118-127,179-214`（8 个观察属性中 6 个动态修改不生效：`setAttribute('error','必填')` 出红框无文案，移除后文案残留）
  建议：统一 `attributeChangedCallback → this.update()`。

- **[low] 注释/文件头失实一批** — element `packages/element/src/internal/core/jsx-runtime.ts:30-36`（isFragment 注释说反）、`packages/element/src/internal/signal/index.ts:27`（"tree-shakeable" 失实）、`packages/element/src/open-element-render.ts:5-8`/`packages/element/src/open-element-hydration.ts:6-7`（自称 package subpath 但不在 exports）；app `packages/app/src/internal/router/client-router.ts:2`、`packages/app/src/internal/router/data-context.ts:2`、`packages/app/src/internal/router/i18n.ts:2`（引用不存在的 `@openelement/router` 包）；adapter-vite `packages/adapter-vite/src/index.ts:21`、`packages/adapter-vite/src/internal/ssg/index.ts:1-16`、`packages/adapter-vite/src/internal/ssg/ssg-render.ts:6,336`、`packages/adapter-vite/src/cli/build-ssg.ts:53`、`packages/adapter-vite/src/internal/ssg/entry-renderer.ts:16-20`（自述行数/依赖/并行渲染均与实际不符）
  建议：逐项修正或删除。

- **[low] `ErrorCode` 常量 9 个里 7 个无引用；`OpenElementError` interface/class 同名双定义** — `packages/element/src/internal/protocol/errors.ts:8-18,36-41`、`src/internal/core/errors.ts:48,87`
  建议：删未用常量；class 加 `implements` 或删接口。

- **[low] `normalizeActionFailure`/`normalizeLoaderFailure` 逐字双胞胎** — `packages/app/src/internal/action-error.ts:9-17,24-32`
  建议：按 channel 参数化合并。

### 2. 功能鲁棒

- **[high] www 三个 site-ui 组件从未注册，生产页面渲染为空壳** — `www/app/site-ui/open-lab-panel.tsx`、`open-lab-stage.tsx`、`open-standards-visual.tsx`
  证据：三模块零 `defineCustomElement`（对照 open-layout.tsx:1360 有注册）；SSR 查表落空原样输出；实测最新 dist 中 `<open-lab-stage ...></open-lab-stage>` 完全为空、`<open-standards-visual>` 无 shadowroot——design-system（en+zh）和 roadmap 页的对应视觉块在现网就是空白；e2e 只断言已注册组件故未被发现。
  建议：三个模块补注册，并给相关页面加「阴影根非空」e2e 断言。

- **[high] 博客文章页 locale 回退写反** — `www/app/routes/blog/[slug].tsx:98-99`
  证据：`_getLocale('zh')` fallback 给了 `'zh'`，英文路由 SSR 不注入 locale → 英文页落入 zh 分支；实测 dist 英文文章页渲染「下一篇」并链接到 `/zh/blog/`。
  建议：fallback 改 `'en'`，补一条英文页链接不含 `/zh/` 的断言。

- **[high] `.githooks/` 两个钩子无执行位，fresh clone 后门禁被静默跳过** — `.githooks/pre-commit`、`.githooks/pre-push`、`deno.json:105-106`
  证据：`git ls-files -s` 均为 `100644`；git 对 hooksPath 钩子同样要求 X_OK，不可执行即静默不运行；`hooks:install` 只设 config 不 chmod。新贡献者 commit/push 完全绕过 autoflow 门禁且无任何提示——fail-open。
  建议：`git update-index --chmod=+x` + hooks:install 加 chmod 兜底。

- **[medium] `validateSafeUrl` 可用内嵌 tab/换行绕过协议黑名单** — `packages/adapter-vite/src/head-injection.ts:151-193`
  证据：`trim()` 只去首尾空白，不剔除串内 `\t\n\r`，而 WHATWG URL 解析器会移除它们——`'da\tta:…'` 通过校验；且校验返回值被丢弃（:236,:263 用原始值）；`inject.scripts` 默认 `type="module"`，`data:` src 可执行。这是 head 注入 XSS 防线的 fail-open。
  建议：校验前 `replace(/[\t\n\r]/g,'')` 并使用归一化结果输出。

- **[medium] `readIslandConfig` 对动态值静默放行，与 JSDoc「动态一律拒绝」矛盾** — `packages/adapter-vite/src/internal/ssg/island-scanner.ts:109-164`
  证据：`propRe` 只匹配字面量，`defineIslandConfig({ ssr: isProd })` 这类动态值被静默跳过 → 按默认 SSR-capable 处理——是「猜测」而非「拒绝」。可能在构建期执行浏览器 API 或产出错误 HTML。
  建议：已知键匹配不到字面量时 throw，兑现 fail-closed 承诺。

- **[medium] element disconnect→reconnect 丢失非 reflect 的 prop 状态** — `packages/element/src/internal/core/prop.ts:33-102`、`open-element-implementation.ts:364-369`
  证据：`connectedCallback` 每次重建 signal Map 并覆盖访问器。反例：`el.count=5` → `remove()` → `append()` → count 回 0。DOM 移动即触发，状态静默重置。
  建议：`initializeStaticProps` 对已初始化实例短路。

- **[medium] themeManager 广播覆盖 host 自带 `data-theme`** — `packages/element/src/open-element-theme.ts:38-45,57-67`
  证据：connect 有「尊重自声明」守卫，MutationObserver 广播（62-66）却无条件 setAttribute/removeAttribute——文档根主题切换会覆盖/删除组件自带 `data-theme="brand"`。
  建议：广播路径加同样守卫（connect 时记录自声明状态）。

- **[medium] client-runtime 对 Chromium 的注释失实，主扫描路径在原生 DSD 浏览器恒为空** — `packages/element/src/internal/core/client-runtime.ts:30-58`、`packages/element/src/index.ts:142-153`
  证据：HTML 规范中 parser 遇到 `shadowrootmode` template 会替换为 ShadowRoot，不留空壳——`collectDsdTemplates` 在正常页面扫到 0 个 template，`hydrateOpenElement` 在唯一原生支持 DSD 的浏览器里是 no-op；`@experimental` 文档未说明此前提。
  建议：补「已有 shadowRoot 的 host」扫描路径，或修正注释与 JSDoc。

- **[medium] mastodon 示例把 API 错误以 HTTP 200 返回，错误被当数据缓存** — `examples/deno-desktop-mastodon/main.ts:110,119,128,137,146` + `app/api-client.ts:37-48,88`
  证据：反例：删除 `fixtures/timeline.json` 后首访 → 错误对象以 200 返回 → 客户端当 `MastodonStatus[]` 缓存 2 分钟持续污染。reader 的对应链路是对的，两例不一致。
  建议：错误分支返回非 200。

- **[medium] reader dev 模式端口断裂** — `examples/deno-desktop-reader/main.ts:165`、`examples/deno-desktop-reader/vite.config.ts:60-63`、`examples/deno-desktop-reader/deno.json:5`
  证据：`Deno.serve` 不传 port（默认随机），vite 代理写死 8000 → `deno task dev` 后所有 `/api/*` ECONNREFUSED，客户端静默回落 `[]`，书架永远空态，与 `examples/deno-desktop-reader/VERIFICATION.md:49` 矛盾。reader 全文无监听地址打印。
  建议：对齐 `PORT ?? 8000` + 打印地址。

- **[medium] 两个桌面示例默认绑定 0.0.0.0，reader 暴露 LAN 可写的文件读写 API** — `examples/deno-desktop-mastodon/main.ts:90`、`deno-desktop-reader/main.ts:165,185-187,216-225`
  证据：实测 `Deno.serve` 不传 hostname 绑 `0.0.0.0`（README 声称 localhost）；reader `POST /api/sources` 接受任意 `root` 路径，`GET /api/books/:id/file` 按 path 原样 `Deno.readFile`——同网段任何人可令桌面端回读用户磁盘任意 PDF，`/api/app/close` 可远程杀进程。
  建议：显式 `hostname: '127.0.0.1'`。

- **[medium] `OPEN_ELEMENT_E2E_OFFLINE` 逃生舱完全失效** — `tools/autoflow/policy.ts:393-416`
  证据：`test:e2e` 只在 ci/release tier，而替换分支只在 dev/push tier 执行（恒空操作）；且替换命令以 `Deno.exit(77)` 结尾，即使命中也会 FAIL 而非跳过。git 史：6f0d318a 翻转 tier 后全灭；`docs/release/v0.40.7.md:19` 仍声称可用。
  建议：删除该分支与文档，或把 test:e2e 加入 dev tier 并以退出码 0 跳过。

- **[medium] open-page-rail 激活态永不生效** — `www/app/site-ui/open-page-rail.tsx:9` vs `:46-49`
  证据：CSS 选择器 `a[aria-current="location"]`，JS 用 `toggleAttribute` 产生空值 `aria-current=""`，永不匹配且非合法 ARIA token；滚动高亮整体失效。
  建议：`setAttribute('aria-current','location')`/`removeAttribute`。

- **[low] SPA loader 重定向被 guard 拦截时清空当前页数据** — `packages/app/src/spa.ts:74-79` + `internal/router/client-router.ts:402-411`
  证据：A 的 loader 抛 `redirect('/b')`，B guard 拒绝 → commitNavigation 直接 return，renderId 不增 → 过期检查通过，`currentLoaderData=undefined` 重渲 A。action 重定向路径（spa.ts:202-207）无此问题。
  建议：redirect 分支在导航未提交时保留旧数据。

- **[low] 鲁棒小项一批** — `render-dsd.ts:272,308,315`（onError hook 无 try/catch）；`render-ir.ts:111` vs `jsx-render-dom.ts:144-150`（SSR 校验属性名 CSR 不校验）；`cli/preview.ts:30-35`（deno-only 且 spawn 无 error 处理）；`cli/start.ts:157-159`（`argv[1].includes('start')` 探测主模块）；`open-theme-toggle.tsx:82-159`（首访即写 localStorage 锁定主题）；`www/public/prism-init.js:10-12`（失败无限 50ms 轮询）；`cinematic-atmosphere.tsx:32-35,95-102`（ResizeObserver disconnect 不清理）；`examples/deno-desktop-mastodon/components/Avatar.tsx:22-25`（onError 无守卫重试风暴）；两个示例 `dev` 任务 `&` 后台进程 Ctrl-C 后成孤儿。
  建议：逐条修正。

### 3. 代码冗余

- **[medium] 错误遥测链路端到端无调用方** — `packages/element/src/internal/core/errors.ts:101-123,132-161`、`internal/core/index.ts:48-56`
  证据：`reportError(` 全仓仅定义处+测试；`setErrorTelemetryHook` 不经公共 facade 导出；`new RenderError` 零命中（classifyError 返回普通对象）。#644 的并发防护守护的是无调用方的钩子。
  建议：接入 render/hydrate 错误路径并公开导出，或删除。

- **[medium] island.ts 两处只写不读的模块级状态** — `packages/element/src/internal/core/island.ts:48,50,129,159,169,176,268`
  证据：`_islandMeta` WeakMap 有 set 无 get（构建侧走静态扫描）；`_visibilityTimeouts` Set 只 add/delete 从不读取。
  建议：删 `_visibilityTimeouts`；`_islandMeta` 提供查询 API 或删除。

- **[medium] 死导出：60 行手写 import 词法器 `collectImportStatements`** — `tools/lib/package-graph.ts:32-93`
  证据：全仓仅定义行命中；已被 AST 版 `extractOpenImports`（:95）取代。
  建议：删除。

- **[medium] reader Markdown 导出两份实现，活代码用无测试的那份，测试全打在死代码上** — `examples/deno-desktop-reader/app/export.ts:3-41` vs `app/host-store.ts:423-449`（端点在 `examples/deno-desktop-reader/main.ts:266`）
  证据：`exportNotesToMarkdown` 仅被自己的测试引用；两份已漂移（frontmatter tag、未知书籍回退均不同）；`examples/deno-desktop-reader/VERIFICATION.md:23` 把这份测试当导出功能的证据——假安全感。
  建议：删 export.ts 及测试，或端点改用它。

- **[medium] www 死组件与死管道** — `www/app/site-ui/open-brand-mark.tsx` 整文件（未注册、无 markup 引用、tone/variant 属性失效，被冒烟测试「供着」）；`www/app/site-ui/open-layout.tsx:636-637,698-707,1354-1355`（`github-url`/`edit-url` 观察属性从不读取、`_computeEditUrl()` 无调用方、`_esc`/`_escAttr` 只服务死字段）；`www/public/logo-home.js:11`（监听全仓无人派发的 `open:navigation-end`）
  建议：删除。

- **[medium] `www/e2e/helpers.ts` 8/9 导出是死代码** — `www/e2e/helpers.ts:13-144`
  证据：仅 `getCustomElementTags` 有调用方；与此同时等价的影子遍历器被内联复制约 9 份（theme-system.spec 4 份、i18n-locale.spec 3 份、layout-structure.spec 1 份），`countShadowRoots` 闲置而计数循环内联复制 4 处。
  建议：删死导出，遍历器/计数收敛为唯一实现。

- **[low] 冗余小项一批** — adapter-vite：`HonoEntryOptions` 死导出（`entry-renderer.ts:269-287`）、`BuildPlan.content` 死字段（`protocol/ssg.ts:396-399`）、`BuildSSGOptions.ssr` 死选项（`build-ssg.ts:64`）、`internal/content/index.ts` 纯转发冗余文件；app：`packages/app/src/model.ts:41,45-54` 的 `route` 选项零生产消费、`packages/app/src/spa.ts:109` 不可达 fallback 与 `:90` 撒谎断言；element：`renderToDom` 第三参 `disposers` 全调用点传 undefined（`jsx-render-dom.ts:258-267`）；tools：`publish-npm.ts:177-180` 死参数 `_dryRun`、`:269-274` 不可达 `'next'` 分支、`check-www-current-truth.ts:66` 恒真条件；examples：reader `examples/deno-desktop-reader/app/storage.ts:16-105` 纯测试养活的死函数、`pdf-reader-island.tsx:148-151` 孤儿 localStorage 键、`:385-402` 三个无 handler 死按钮、mastodon `stress-report.json` 与 nightly 产物脱节。
  建议：逐条删除或接线。

### 4. 重复实现

- **[medium] mastodon/reader 两示例约 200 行复制粘贴双胞胎，漂移已兑现** — `examples/deno-desktop-mastodon/main.ts:19-84` vs `deno-desktop-reader/main.ts:39-138`（HTTP helper 块逐字相同）；`router.ts` 两份仅日志不同；vite.config 与 bootstrap 段同构。漂移证据：reader 缺 PORT 处理、错误码策略分叉。
  建议：抽 `examples/lib/server-utils.ts` 共享，或 README 注明有意复制。

- **[medium] `normalizeDep` 双胞胎且契约相反** — `tools/lib/package-graph.ts:23-30`（非内部 dep 返回 null）vs `tools/check-package-graph.ts:49-57`（原样返回）
  建议：lib 统一并显式命名，删本地拷贝。

- **[medium] 静态文件 smoke server 两份漂移拷贝** — `tools/visual-smoke.ts:14-69`（有路径穿越防护、4 候选）vs `tools/third-party-wc-smoke.ts:90-116`（无防护、2 候选）
  建议：抽 `tools/lib/static-server.ts`。

- **[medium] element `binding-activation.ts` 三胞胎清理闭包** — `:305-318,363-376,421-434`（clearRender 三份逐字拷贝）+ `:459-469` vs `:197-213`（fragment 解包重复）
  建议：抽共享 helper。

- **[medium] JSX namespace 声明三份拷贝，漂移已开始** — `packages/element/src/jsx-runtime.ts:5-29`、`jsx-dev-runtime.ts:5-29`、`internal/core/jsx-types.d.ts:11-46`（ref 参数名 `element` vs `el` 已不一致）
  建议：两份 runtime 用 `/// <reference>` 复用 d.ts。

- **[medium] `build-postprocess.ts` 绕过单一事实源** — `packages/adapter-vite/src/internal/ssg/build-postprocess.ts:58-78`
  证据：island-scanner.ts:23-30 注释明确 `resolveIslandHydrate()` 是唯一实现（曾因多点复制漂移），此处 strategyMap 仍手写 `hydrate || upgradeStrategy || 'idle'` 回退（两处）；layerMap local/package 两段逐行双胞胎。
  建议：改用 `resolveIslandHydrate()`，合并双胞胎。

- **[medium] ui 测试两套假 DOM harness + 重复用例** — `packages/ui/__tests__/components.test.ts:59-218` vs `open-button-click.test.ts:10-76`；重复用例 `components.test.ts:583-689` ↔ `open-button-click.test.ts:130-170`
  建议：保留 harness 独立性，删重复行为用例。

- **[medium] tarball 命名/路径助手逐字重复** — `tools/publish-npm.ts:42-48` vs `tools/check-package-artifacts.ts:51-57`
  建议：移入 `tools/lib/`。

- **[low] 重复小项一批** — tools 本地 run/exists/readJson 助手五处（`consumer-local.ts:90-107`、`nitro-proof.ts:18-54` 等）；`normalizeSlashes`/`gitFiles` 手写拷贝三处；`consumer-local.ts:29-47` 手写正则 import 扫描器；`tools/autoflow/release.ts:104-123,533-552,1567-1592` 三个同构 JSON 读取器；mojibake 词表与 `as any` 门禁双轨（`check-architecture-contract.ts:292-321` vs `check-text-integrity.ts:27-28`）；www `_getStr` 三份已漂移；locale 前缀正则三处硬编码；reader settings 表单逻辑两遍、`Math.max(720, measure*14)` 三处。
  建议：收敛到对应 lib/共享 helper。

### 5. 文档冗余/失实

- **[high] `legacyDsdPolyfill` 幽灵 API 仍写在 current 层契约文档** — `docs/current/BROWSER_BASELINE.md:18-21`
  证据：全仓 Grep `legacyDsdPolyfill|injectDsdPolyfill|dsdPolyfill` 在 packages/ 零实现；#719 修了 README 实例，此 current 层残留。制度根因：`check-public-docs-integrity.ts:28-32` 只盯三份 current 文档，BROWSER_BASELINE 等四份无门禁。
  建议：删段落，并把剩余四份 current 文档纳入门禁。

- **[high] www 首页旗舰代码示例是无法编译的虚构 API** — `www/app/routes/index/index.tsx:299-311`
  证据：示例 `defineElement(props => ({...}))` 缺第一个必需参数、编造 props schema 形参位置、render 里用不存在的 `this.count++`；真实签名是 `defineElement(tagName, input)`（`define-element.ts:18-21`）。这是落地页首屏给访客复制的代码。
  建议：改成真实可跑的示例。

- **[medium] ROADMAP registry 行在 alpha.10 收盘后未同步，与 STATUS 直接矛盾** — `docs/roadmap/ROADMAP.md:8,131-134` vs `docs/status/STATUS.md:5`
  证据：收盘提交 c036cb95 更新了五处唯独漏 ROADMAP；ROADMAP 仍写 "registry line: v0.42.0-alpha.9 / in-flight source line is alpha.10"。`check-version-anchors.ts:86-91` 接受 lagged 形式故 CI 全绿——门禁无法区分「允许滞后」与「收盘未更新」。
  建议：同步 ROADMAP；把 ROADMAP 加入收盘必改清单。

- **[medium] ADR 目录表漏收 ADR-0087/0088/0089/0090** — `docs/adr/README.md:131-132`（0086 直跳 0091，四份文件真实存在）
  建议：补目录行，或加「文件数==目录行数」轻量校验。

- **[medium] drizzle 配方使用不存在的页面选项 `rendering: 'dynamic'`** — `docs/integrations/drizzle.md:9`
  证据：真实 API 是 `renderIntent: { mode }`（`authoring.ts:206`）；读者照抄会被 definePage 校验拒绝。同型错误 2026-07-28 在 CHANGELOG 修过，integrations 残留。
  建议：改 `renderIntent: { mode: 'dynamic' }`。

- **[medium] ui 生成 manifest 的 `modules` 块是无人消费的死负载且路径失实** — `tools/generate-ui-manifest.ts:313-317`、`packages/ui/src/generated-manifest.json:496-618`、`README.md:57`
  证据：`modules[].path` 指向发布包中不存在的 `./open-card.js`；唯一消费方只读 `declarations`；喂给仓内自己的 `parseCem` 会 10 个 module 全报 `CEM_EXPORT_NO_DECLARATION`——与 README "CEM-compatible" 承诺冲突。
  建议：删 modules 生成或改成真实路径；README 措辞降级。

- **[low] 文档小项一批** — `docs/integrations/open-element-in-fresh.md:149-152` vs `:162-163,181` 自相矛盾；`drizzle.md:21` vs `:26` 正文说 ctx.env 示例用 `process.env`；`PROJECT_WORKFLOW.md:126-127` 残留已完成的一次性 dist-tag 指令；`STATUS.md:46` 七天 P0 watch 已到期未推进；`BRANCHING.md:7-15` 分支类型表漏 `autoflow/cell-*`；`docs/adr/README.md:173` 命名指示与 121 份主流惯例相反；`docs/dogfood/README.md:21` 产品口径落后 doctrine；`packages/create/README.md:20-25` "What It Creates" 列了不生成的 `dist/`；`www/e2e/i18n-locale.spec.ts:5` 头注释默认 locale 写反；`www/app/site-ui/open-lab-stage.tsx:583` 硬编码 v0.40.8；www 私有组件 JSDoc 头误标 `@openelement/ui`。
  建议：逐条修正。

### 6. 坏味道

- **[medium] speculation 路由派生 prefetch 规则永远匹配不到目标页** — `packages/adapter-vite/src/internal/ssg/speculation-rules.ts:39-41`
  证据：`/blog/post` 页生成 `href_matches: '/blog/post/*'`，不匹配 `/blog/post` 本身——JSDoc 承诺的 "Nested static pages → prefetch" 零收益。
  建议：同时输出 `path` 与 `${path}/*`，或修正文档。

- **[medium] navigation-routing.spec 有 5/12 条死路由被 SPA fallback 掩盖成假通过** — `www/e2e/navigation-routing.spec.ts:22-29,103` + `www/e2e/static-server.ts:92-93`
  证据：`/guide/islands` 等 5 条路由在 dist 中不存在，server 回退 index.html 返回 200，测试只断言标题即「通过」；同仓 `search.spec.ts:8` 恰恰把这些路由列为「必须是死链」——两个 spec 互相矛盾。另有 `if (guideLinks.length > 0)` 条件断言。
  建议：删死路由或改指向，断言 `response.status() < 400`。

- **[medium] fresh 示例无任何门禁且已可见漂移** — `examples/open-element-in-fresh/routes/index.tsx:9,23`、`deno.json`
  证据：不在 workspace、不在 examples:check、CI 无引用；页面可见文字仍是 "alpha.4 Interop Proof" 而 README:5 声称「维护对齐 0.42.0-alpha.10」；Quick Start 端口 8000 疑似 Fresh 1.x 遗留（实际走 vite 默认 5173）。
  建议：加最小 check 任务并入 examples:check，修正过期文字。

- **[low] 测试假断言/弱断言一批** — element `open-element-structure.test.ts:4-7`（"文件行数<400" 对 2 行 re-export 恒真）；app `preact-smoke.test.ts:283-299,357-390`（三个只断言「继承方法存在」的测试）；www `view-transitions-speculation.spec.ts:77`（恒真）、`accessibility-performance.spec.ts:54,64,94`（条件断言+容差）、`islands-reactivity.spec.ts:62-72`（无终态断言）、`page-structure.spec.ts:11-24`（14 个 guide 页只覆盖 12 个）
  建议：逐条收紧或删除。

- **[low] 坏味道小项一批** — 魔法字符串 `'dist'` 与 `DEFAULT_OUT_DIR` 并存（`adapter-vite/src/build.ts:136` 等 5 处）；`tools/consumer-local.ts:156` 把消费者 vite 钉 8.0.10（全仓 8.0.16）；`i18n-plugin.ts:44-45` 同一函数内两种转义纪律；`island-scanner.ts:242-245` 二次校验永远为真；www `404.tsx:149-151` "Requested path" 恒为 `/404`；`.github/workflows/codeql.yml:45` 注释乱码；两个示例 deno.json 空 `"exports": {}`。
  建议：顺手清理。

## 统计

- 发现总数：**约 78 条**（归并杂项后）：**high 7 / medium 40 / low 31**
- 抽查确认无问题的区域：
  - element：escapeHtml 单趟转义、warnOnce 作用域化、island 超时/observer 清理、HydrationScope dispose/reset 重入、formatError 环保护均正确；无 TODO/FIXME、无吞错回潮。
  - app：authoring 校验全部 fail-closed、defineApp dispose 幂等完整、client-router 并发/去重有完整行为测试；redirect 状态白名单等安全默认值无问题。
  - adapter-vite：CSRF 同源底线、action 协议、路径逃逸防护、generated-data fail-closed 均正确；`deno lint` 112 文件通过；有专门的假断言门禁测试。
  - ui+create：create CLI fail-closed、token 管线有 --check 门禁、ui 公开面无死导出；77 测试实跑通过。
  - tools：lib/ 导出基本都有消费方、release.ts 幂等路径注释属实、smoke 脚本无句柄泄漏。
  - docs：ADR 编号碰撞已治理（有显式声明）、PACKAGE_SURFACE 机器映射与五包 exports 完全一致、docs:truth 六道门禁实跑全绿。
  - www：open-search/cinematic-scroll 资源清理完整、CDN 脚本均带 SRI、isSafeLayoutUrl fail-closed、www/app 无 any/ts-ignore。
  - 根目录+examples：workflows 全部 action SHA 固定、36 个 task 引用全部有效、URL 无目录穿越、reader 并发 sync 无竞态、README 中英双版无漂移。

## 与上轮的关系

- **上轮已修（本轮核实，含证据）**：collectPublicProps 单实现（#621）、tag 校验统一、SPA 吞 redirect（#731）、sitemap 失败降级（🟡-A，现有 sitemapFailure 选项）、openPipeline i18n 死选项（已删字段）、registry.ts 死模块、PropValidationError、start.ts/fixture 漂移（#732）、JSONC×2（#708）、walk×4（#710）、路由转换×3、ui 双重转义（#726）、manifest slots/cssParts（#744）、跨实例 ID（#745）、ui 空 catch（#747）、guide 页同构（#749）、dev-mode 双信号（#743）、#728/#729/#737 文档门禁均已落地。**#622（cli start 跨运行时）代码层面已修复。**
- **上轮已报未修（本轮确认仍在）**：props 过滤×2（render-ir vs jsx-render-dom，且已漂移出 SSR/CSR 校验分叉新证据）；i18n 三跳 re-export；element 三套重叠 barrel；request context 双份契约（🟡-F 根处置未做）；#753/#754/#755 三个 tools/CI issue 仍在（#755 且 autoflow-ci.yml:46-48 注释与 policy.ts 事实相反）；#723/#623 记债项如旧。
- **本轮新发现**：7 条 high + 40 条 medium + 31 条 low，均为本轮首次报告。最优先：`.githooks` 执行位（一行修复堵住门禁漏洞）、www 三个未注册组件与 blog locale（现网可见的正确性损失）、`validateSafeUrl` 绕过（安全防线）、ROADMAP 同步（收盘流程漏项）。
