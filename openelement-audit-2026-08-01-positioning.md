# openElement 全栈定位代码审计报告

- 日期：2026-08-01
- 基线：`tools/project-constants.ts:1` = `0.42.0-alpha.10`
- 审计立场：openElement 是「Web Component 全栈框架」（五包收敛：element / ui / app / adapter-vite / create），不是通用工具库或文档站
- 用途：本报告供第二位评审员逐条核实。每条结论含 文件:行号 + 证据 + 修法；末章附核实命令。

---

## 一、分级结论清单

### 🔴 硬伤（6 条）

**🔴-1 element「零依赖运行时」声明不属实**
- 位置：`packages/element/src/internal/signal/preact-engine.ts:10-13`；`packages/element/src/internal/core/index.ts:7`
- 证据：`preact-engine.ts` 从 `@preact/signals-core` 导入 signal/computed/effect；`framework.ts:16` 模块加载时即实例化引擎 → `import '@openelement/element'` 必拉入 preact。而 `internal/core/index.ts:7` 注释宣称 "Zero npm: specifiers - works in Deno, Node, Bun, Edge"；`docs/audit/2026-07-30-packages-code-review.md:13` 亦写 "zero-dep runtime core"。`tools/check-deno-api-free.ts:9-11` 证明依赖本身是有意的 charter 决策，纯为口径失真。
- 修法：二选一——改口径为「唯一引擎依赖 @preact/signals-core」并更正 3 处注释/文档；或按 `framework.ts` 既有 `SignalEngine` 接口内联 mini signals 实现。

**🔴-2 adapter-vite 默认 appShell 指向不存在的模块，首启必炸**
- 位置：`packages/adapter-vite/src/internal/ssg/entry-descriptor.ts:42-46`
- 证据：未配置时默认 `importPath: '@openelement/ui/open-layout'`；`packages/ui/deno.json` exports 与 `src/` 全树无 open-layout（grep 零命中）。`entry-renderer.ts:101-103` 无条件 import 该路径。www 能构建仅因 `www/vite.config.ts:124` 自定义了 shell。
- 修法：默认改 `appShell: false`（或 ui 补 open-layout），并加「未配置 shell 的构建」测试。

**🔴-3 MDX 声称支持但 SSG Phase 3 断线**
- 位置：`packages/adapter-vite/src/plugin.ts:396`；`packages/adapter-vite/src/cli/build-ssg.ts:331-377`
- 证据：外层插件列表注册 `mdxPlugin()`（dev/Phase 1 生效），Phase 3 的 `viteBuild()` 插件表无 mdx（grep 零命中）；`internal/ssg/entry-renderer.ts:108-110` 对 `.mdx` 路由生成裸 import，Phase 3 为 `configFile:false` 新构建 → 必被 esbuild 当 JS 解析失败。
- 修法：build-ssg 插件数组加 `mdxPlugin()` + 补 `.mdx` 路由 Phase 3 集成测试（现有 `plugin-mdx.test.ts` 只测 transform 层）。

**🔴-4 app 的 request 层整套未接线，adapter-vite 绕开它本地重写**
- 位置：`packages/app/src/model.ts:29`；`packages/app/src/hono.ts:36`；`packages/adapter-vite/src/nitro-mount.ts:56-58`
- 证据：`createRequestContext` 唯一调用方是 `hono.ts:53`；`createHonoRequestContext` 仓内零消费方（仅测试）。nitro-mount 注释明说绕开 app/model（避免生成产物里未解析裸包引用）自己实现；SSR 主链路 `entry-render-helpers.ts:414` 内联注入。`app/src/index.ts:58-63` 却包装为 "Official default request driver bridge"。
- 修法：nitro-mount 改为消费 `createRequestContext`，或撤下该定位声明。

**🔴-5 文档版本行集体说谎：四处称 registry line = alpha.10，registry 实为 alpha.9**
- 位置：`docs/status/STATUS.md:5`、`docs/roadmap/ROADMAP.md:7`、`docs/current/VERSION_PLAN.md:4`、`README.md:10`
- 证据：`npm view @openelement/element dist-tags` → `{latest: '0.41.2', alpha: '0.42.0-alpha.9'}`；alpha.10 仅存在于机械 bump commit，无 release 记录。正是 STATUS.md:93-98 自己警告的 version-hole 模式重演。
- 修法：四处 header 改 "source line"，发布 alpha.10 后再改回 registry 说法。

**🔴-6 ROADMAP 内部自相矛盾：alpha.8 同时是「已发布线」又「npm 未发布」**
- 位置：`docs/roadmap/ROADMAP.md:122`（vs :7、vs STATUS.md:93-98、vs registry 实况 alpha.9）
- 证据：CHANGELOG.md:22-30 明写 alpha.8 "npm publish failed / absent from the registry"，ROADMAP:122 却称 "0.42.0-alpha.8 is the published package line"。`check-strategic-docs.ts:75` 的 stale 正则要求 "current (?:published|verified)" 前缀，`is the published package line` 句式两个 gate 都放过。
- 修法：重写 ROADMAP.md:120-125 段；`check-strategic-docs.ts` stale 模式补该句式。

### 🟡 可改进（代码类）

| # | 位置 | 证据与修法 |
|---|---|---|
| Y-1 | `element/jsx-render-dom.ts:121-123` | `signalNameFor` 每帧对 signalRegistry 线性扫描 O(绑定×signal) → 注册时维护反向 Map |
| Y-2 | `element/hydration-scope.ts:267-271` | 每个 hydrate 组件各排 rAF 强制回流（Chromium DSD workaround）→ 单次 rAF 批处理 |
| Y-3 | `element/jsx-render-dom.ts:379-395` | CSR 渲染抛错吞成空文本节点（仅 console.error），SSR 同路径 `render-ir.ts:256-262` rethrow → 同语义应同策略 |
| Y-4 | `element/island.ts:277-306` | 手写 tag 校验（拒绝点/下划线、漏 xml 前缀）vs `tag-utils.ts:41-49` `assertValidTagName` 两套规则 → 直接调用后者 |
| Y-5 | `element/open-element-implementation.ts:627-634` | `OpenElementComponentConstructor` 从公共入口 `open-element.ts:4` 导出，零消费方 → 删或标 @internal |
| Y-6 | `element/render-dsd.ts:168-175` | `filterPublicDsdProps` 与 `props-utils.ts:17-24` `collectPublicProps` 同意图两份 → 合并 |
| Y-7 | `ui/src/open-tabs.tsx:29-39` | README 称 "Accessible" 但无键盘导航/aria-controls；:37,42 用 textContent 拷贝渲染，面板内元素被拍平 → 实现 ARIA 或降级措辞 |
| Y-8 | `ui/src/open-dialog.tsx:121-153` | render 不读 `open` 属性，SSR 带 open 的宿主渲染出关闭 dialog；DSD 升级期可能对未连接 dialog 调 showModal() → render 内同步 |
| Y-9 | `ui/src/open-theme-toggle.tsx:168-170` | 注释称 onCsrRendered 初始化，实际空 override（真实初始化在 connectedCallback:86-89）→ 删空 override 修注释 |
| Y-10 | `ui/README.md:23-33` | 组件表漏 OpenBadge；:10 版本锚停 v0.40.8；:48 声称 OpenLayout 属 ui 契约但组件在 `www/app/site-ui/open-layout.tsx` → 三处同步 |
| Y-11 | `adapter-vite/index.ts:41-50` | `openPipeline()` 声明 `i18n?` 选项从不读取（grep config.i18n 零命中），静默空操作 → 删字段或转交 openI18n |
| Y-12 | `adapter-vite/i18n-plugin.ts:88-92`（同类 `internal/content/blog/plugin.ts:51-55`、`nav/plugin.ts:57-61`） | 生成数据写盘失败仅 warn，`generated-data-resolver.ts:71` 回退空桩 → build 模式应 throw，dev 才 warn |
| Y-13 | `adapter-vite/ssg-dynamic.ts:176-181` | `getStaticPaths()` 抛错无条件 warn+continue，绕过 `dynamicRouteFailure: 'fail'` 政策 → 走 `handleRenderFailure` 同通道 |
| Y-14 | `adapter-vite/content/blog/blog-data.ts:81-83` | `getBlogOptions()` 硬编码 `{contentDir:"content/blog"}` 无视实参 → 序列化真实 options |
| Y-15 | `adapter-vite/ssg-render.ts:121-128` | `mkdir(...).catch(() => {})` 吞真实 I/O 错误 → 删 catch |
| Y-16 | `adapter-vite/README.md:22,37,84` | 文档化 `plugin`/`app-vite` 子路径不在 deno.json exports（`deno.json:4-11`）；`injectDsdPolyfill` 代码零命中 → 按 `docs/current/PACKAGE_SURFACE.md:57-60` 重写 |
| Y-17 | `app/spa.ts:78-83` | loader 失败静默降级空数据（action 路径 :195-197 有错误形状）→ 对齐 |
| Y-18 | `app/README.md:15` | 声称 `definePage({..., load, ...})`，`load` 字段不存在（`authoring.ts:200-209`）→ README 对齐 |
| Y-19 | `create/consumer-packaged-starter.ts:107-109` | 打包产物只跑 `deno task check` 不跑 build；真打包 build 仅手动 dispatch `published-consumers.yml` → 加 build 一步或 release 流自动调度 |
| Y-20 | `create/templates/deno.json.tmpl:17` | check 清单漏 `app/components/app-shell.tsx`（不被 import 永不 typecheck）→ 补入 |
| Y-21 | `create/templates/deno.json.tmpl:3` | `@deno/vite-plugin` 浮空取最新 → 锁版本 |
| Y-22 | `create/templates/deno.json.tmpl:11` | 锁 vite@8.0.10 vs adapter-vite 用 8.0.16，单进程两份 vite → 统一 |
| Y-23 | `create/README.md:25` | 声称生成 `www/` 目录，实际输出 `dist/` → 改文案 |
| Y-24 | `tools/consumer-local.ts:156-161` | 注入 lit/parse5/entities 三 import（全仓零依赖）+ 三个 delete 空操作 → 删除 |

### 🟡 可改进（工作流 / 文档类）

| # | 位置 | 证据与修法 |
|---|---|---|
| Y-25 | `.github/workflows/autoflow-release.yml:44-57` | 发布 workflow 零 gate，直接 dispatch 可绕过全部 release-tier gate → publish 前校验 prepare 记录或补跑 autoflow:ci |
| Y-26 | `tools/autoflow/policy.ts` GATES | firefox/webkit smoke（`autoflow-ci.yml:37-46`）CI 在跑但未建模进 GATES → 补两 gate |
| Y-27 | `tools/check-www-current-truth.ts` | 源码版扫描不是 gate（仅非 gate 的 docs:truth 手动跑）→ 加进 GATES |
| Y-28 | `tools/bump-version.ts:229-332` | 单独跑只 bump 一半（不碰 www/data/version.ts、project-constants、docs 锚点）→ 报头注明须经 autoflow release 流 |
| Y-29 | `CHANGELOG.md:15` | 头部停 alpha.9，bump 不写、gate 不查 → 显式标记历史归档 |
| Y-30 | `docs/status/STATUS.md:62-63` | 声称 "start CLI is Deno-only"，代码 `adapter-vite/src/cli/start.ts:4-7` 已跨运行时 → 更新 risk #7 |
| Y-31 | `docs/status/STATUS.md:86-87`（及 :55-58） | 发布表 alpha.8 列两次、漏 alpha.9/alpha.10；#619-623 hygiene 记错到 alpha.8（实际 alpha.9）→ 补行改述 |
| Y-32 | `docs/roadmap/ROADMAP.md:85-101` | Forward 表混入已发布行且漏 alpha.19/0.41.1/0.41.2 → 已发布行标 shipped |
| Y-33 | `www/app/routes/guide/getting-started.tsx:35,66` | "0.41.0 freeze plan is active" 过期文案（冻结已落地）→ 改 shipped |

### 🟢 可接受记债

- element：14 处 `as unknown as X` 双断言均在 DOM/宿主边界，正当；`binding-activation.ts:386-407` Show/For 全量 clear+rebuild 无 keyed diff——文档化取舍；ISR @experimental 标记诚实（revalidate 进 isr-manifest 但无运行时消费，已如实标注）。
- ui：`open-button.tsx:137-139` `typeof closest === 'function'` 守卫；`deno.json:17` `.js` 子路径别名；generated-manifest 的 `.js` 路径指向不存在文件（CEM 规范占位）。
- adapter-vite：`cli/start.ts:135` duplex `@ts-expect-error` 有注释有理由；`build.ts:154-157` SPA fallback 调试 console.info 会进生产输出。
- 版本：`examples/*/deno.json:3` 钉 0.41.0-alpha.6 属有意 dogfood pin 但无声明；`packages/*/openelement-*-0.42.0-alpha.9.tgz` 残留已 gitignore。

---

## 二、定位一致性专项结论

1. **element：架构是框架核心，叙事混入「零依赖工具库」旧口号。** 证据：三条渲染链路（SSR `render-dsd.ts→render-ir.ts` 被 adapter-vite SSG 消费；DSD hydration `hydration-scope.ts`；CSR 细粒度绑定）+ 安全边界（`security.ts` 防原型污染、`render-ir.ts:111` SAFE_ATTR_NAME、`html-escape.ts` 统一转义）+ 显式 130 行公共门面。但 `internal/core/index.ts:7` "Zero npm: specifiers" 与事实矛盾（🔴-1）。结论：真实是「框架核心 + 一个 charter 引擎依赖」，宣称是「零依赖工具库」。
2. **adapter-vite：SSR/SSG 正交性真实，但「Nitro 输出」是名义承诺，默认配置断首启。** 证据：三阶段编排（`build.ts` closeBundle 唯一驱动器）、`internal/ssg/` 引擎零 Vite 依赖、`nitro-mount.ts` 干净接缝；`ssg-smoke.test.ts:69` 真跑 www 构建、`request-time-parity.test.ts:84` 双通道协议断言。但 Nitro 证明依赖死 fixture（见删除清单），默认 appShell 断首启（🔴-2），MDX Phase 3 断线（🔴-3）。
3. **app：四拼盘——页面创作层（真实定位，definePage/defineIsland 被 www、create 模板、adapter-vite 夹具全量消费）+ 独立 SPA 运行时（defineApp+client-router，仅两个桌面示例使用，复核过的已知孤岛）+ 未接线 request 层（🔴-4）+ i18n 工具（两文件三跳转发，`i18n-runtime.ts:84-85` 不在 exports）。**
4. **ui：五包中最干净，定位完全自洽。** 证据：纯 WC（只 import element 包，零 any/ts-ignore）；manifest 重生成 diff 零差异；令牌 css→ts 单一事实源；真实被 www 消费（`www/vite.config.ts:254`）。失分全在文档同步（Y-10）。
5. **create→开发→构建→生产主路径：无彻底断点，断点全在「自动化验证」。** 证据：`consumer-local.ts` 真跑生成→build→nitro 构建启动→HTTP 表单 POST；但打包态 build（Y-19）、dev、preview 三段零门禁；「首启」承诺本身被 adapter-vite 默认 appShell 坑掉（🔴-2）——链条两端靠「恰好都显式配置」才闭合。

---

## 三、删除清单（每行：位置、删什么、为什么安全）

1. `packages/element/src/internal/core/registry.ts:27-244` — 整模块（registerManifest/getAllManifests/validateManifest/generateIndex/clearRegistry + 6 协议类型）— 全仓零调用（仅 barrel `index.ts:186-191` 转发），旧「WC Package Protocol」愿景残留
2. `packages/adapter-vite/src/internal/content/mdx/` — 整目录 + `core.ts:8` compileMdx 导出 — 唯一引用是自身导出；MDX 路由走 `plugin-mdx.ts` 的 @mdx-js/rollup
3. `packages/adapter-vite/__fixtures__/nitro-proof/` — 308K 构建产物（.output-node/.output-workers/.nitro）— 无测试引用，历史手动运行痕迹
4. `packages/adapter-vite/src/cli/ssg-render.ts:28-34` — `ssgRender`/`resolveDynamicRoutePath` 包装导出 — 生产消费方只有 build-ssg 的 evidence 路径，包装只服务测试
5. `packages/adapter-vite/src/internal/protocol/{framework,manifest,render,style-sheet,vnode}.ts` — 5 个一行 `export type * from '@openelement/element'` 空壳 — 纯转发噪音
6. `packages/app/src/authoring.ts:352` — `IslandConfigType` — 零消费方
7. `packages/app/src/spa.ts:25-32` — 本地 assertValidTagName — 用 element 的 `assertValidTagName`（`index.ts:39`），且本地规则更弱（允许 `apphome` 无连字符）
8. `packages/element/src/jsx-render-dom.ts:241-250` — `applyProps` — 零导入
9. `packages/element/src/island.ts:52-54` — `getIslandMeta` — 仅 barrel 转发，零消费
10. `packages/element/src/errors.ts:125-141` — `PropValidationError` — 零消费方（连测试都没有）
11. `packages/element/src/html-escape.ts:193-221` — `renderSsrError` — 无代码调用方
12. `packages/element/src/render-dsd.ts:80-88` — `instantiationErrorHtml` 四个死参数 — 只用 tagName
13. `packages/ui/src/open-badge.tsx:82-88` — `_getStr` 属性分支 — OpenBadge 未声明 static props，恒 undefined
14. `packages/ui/src/open-theme-toggle.tsx:168-170`、`open-code-block.tsx:150-152` — 两个纯 super 的空 override — 无行为
15. `tools/consumer-local.ts:156-161` — lit/parse5/entities 注入 + 三个 delete — 全仓零依赖，delete 空操作
16. `README.md:61-62` — 重复分句（"stay explicitly unfrozen…" ×2）— 复制粘贴残留
17. 各 `packages/*/openelement-*-0.42.0-alpha.9.tgz` — 过期 tgz — gitignore 已忽略，clean 任务已含 `*.tgz`

---

## 四、重复实现清单

| 重复 | 位置 | 说明 |
|---|---|---|
| tag 校验 ×3 且规则不一致 | `element/island.ts:277-306` vs `tag-utils.ts:41-49` vs `app/spa.ts:25-32` | defineIsland 拒绝点/下划线，tag-utils 允许；SPA 放行 SSR 拒绝 |
| 公共 props 过滤 ×2 | `element/render-dsd.ts:168-175` vs `props-utils.ts:17-24` | 同意图两份实现 |
| JSONC 剥离 ×2 | `adapter-vite/workspace-alias.ts:17-67` vs `cli/build-client.ts:96-125` | 逐字符 vs 正则，行为不一致（行中 `//`） |
| alias 特异性排序 ×2 | `adapter-vite/alias-utils.ts:22-26` vs `cli/build-client.ts:169-173` | 相同 comparator |
| 递归目录/HTML walker ×5 | `build-plan.ts:64-72`、`build-manifest.ts:66-95`、`postprocess.ts:51-68`、`internal/html-files.ts:10-27`、`island-manifest.ts:125-162` | 同 readdir 递归，细节分歧 |
| 路由路径转换 ×3 | `route-scanner.ts:116-147` vs `route-type-generator.ts:22-33` vs `route-manifest.ts:115-151` | 各自处理 index/分隔符 |
| request context ×2 | `app/model.ts:29`+`hono.ts:36` vs `adapter-vite/nitro-mount.ts:56-58` | 两个平行形状 + 一个无消费方 API |
| i18n 转发 ×3 | `app/i18n.ts:18-19` → `i18n-runtime.ts:84-85` → `internal/router/i18n.ts` | 三跳 re-export，i18n-runtime.ts 不在 exports |
| 版本源 ×2 无交叉校验 | `create/version.ts:2` vs `tools/project-constants.ts:1` | 机械同步兜底但无 CI 断言 |
| 事件符号转发层 | `element/event-hydration.ts:34-42` | re-export event-marker.ts 6 符号 |

---

## 五、最值得做的 3 个改进

1. **修默认 appShell（`entry-descriptor.ts:42-46`，一行）** — 影响「create → 首启」承诺的第一条命令；唯一让外部用户第一步就失败的 🔴，成本最低。
2. **MDX 接入 Phase 3（`build-ssg.ts` 插件表加一行 + 一个集成测试）** — 「声称支持的内容格式实际断线」的活证据；补测试后整类回归（"只通一半的承诺"）可被机制抓住。
3. **版本叙事诚实化（🔴-5 + 🔴-6 + 🔴-1 注释，文案级改动）** — 三处「文档 vs 事实」说谎点恰是仓库自己治理机制（check-version-anchors / check-deno-api-free）声称要防却漏掉的；同时给 `check-strategic-docs.ts:75` 补句式，堵住正文盲区。

---

## 六、核实方法（供第二位评审员）

所有结论用以下命令可独立复验（grep 用 ripgrep，排除 node_modules/.git/dist/tgz/vendor）：

```sh
# 🔴-1 零依赖声明
rg -n "preact" packages/element/src/ | head
sed -n '1,12p' packages/element/src/internal/core/index.ts
# 🔴-2 appShell 默认值
sed -n '35,50p' packages/adapter-vite/src/internal/ssg/entry-descriptor.ts
rg -n "open-layout" packages/ui/deno.json packages/ui/src/
# 🔴-3 MDX Phase 3
rg -n "mdx" packages/adapter-vite/src/cli/build-ssg.ts; sed -n '108,110p' packages/adapter-vite/src/internal/ssg/entry-renderer.ts
# 🔴-4 request 层消费方
rg -rn "createHonoRequestContext|createRequestContext" packages/ www/ tools/ --include="*.ts" -l
# 🔴-5/6 版本叙事
npm view @openelement/element dist-tags --json
sed -n '118,126p' docs/roadmap/ROADMAP.md
# 死代码验证（以 registry.ts 为例，应只有 barrel 转发命中）
rg -n "registerManifest|getAllManifests|validateManifest|generateIndex|clearRegistry" packages/ www/ tools/ examples/ | grep -v registry.ts
# gate 一致性
sed -n '26,60p' tools/autoflow/policy.ts; sed -n '30,50p' .github/workflows/autoflow-ci.yml
```

已做过的交叉验证（无需重做）：npm registry 实况（latest 0.41.2 / alpha 0.42.0-alpha.9）；manifest 重生成 diff 零差异；ui 65 测试全过；create/version.ts 与五包 deno.json 当前全部 = 0.42.0-alpha.10。
