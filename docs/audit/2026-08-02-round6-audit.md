# Round 6 全仓审计（v0.42.0-alpha.11，HEAD 9e4d0b07）

日期：2026-08-02。前五轮（2026-07-28 起至 2026-08-01-round5）发现已全部修复（issue #539–#809 全部关闭）。
方法：9 个分区并行扫描（packages/element、app、adapter-vite、ui+create、tools、docs、www、根目录+examples+.github、WC light fullstack 专项），覆盖维度 1–5；维度 6 横跨 packages/app、adapter-vite、element、www、docs。两条 high 发现已由主审计员亲自复核代码确认。

## 范围概述

全仓五包 + www + tools + docs + examples + CI 配置全量扫描，维度 1–5 逐分区覆盖，维度 6（WC light fullstack 定位）单独专项对照 VERSION_PLAN（ADR-0120）与 ADR-0119。死代码结论均以全仓 Grep（排除 node_modules/vendor/dist/.git，含 deno.json tasks、workflows、e2e、fixtures、tools）验证；重复结论给出两处以上路径或 diff/哈希证据。去重基准：round5 报告「上轮已报未修」清单 + #539–#809 已关闭 issue。

## 发现清单（按维度分组）

### 维度 1：一致性

- [medium] 路由 pattern 语法三处分叉，框架自己生成的 catch-all 在自家 client-router 不可匹配 — `packages/app/src/internal/router/client-router.ts:76-122`（`:param`/`:param?`/`*`/`:param*`）、`packages/adapter-vite/src/internal/ssg/route-scanner.ts:126-133`（生成 Hono 风格 `:path{.+}`）、`packages/element/src/internal/core/context.ts:29-49`（URLPattern）
  证据：`matchPattern('/products/:slug{.+}', '/products/a/b')` 走查返回 `null`（多段永不匹配；单段匹配但参数名为字面 `slug{.+}`）；route-manifest.ts:8-23 的用法示例正是把 scanRoutes 产出喂给 createRouter。route-manifest.test.ts:134-155 用例名「`[...slug].tsx → /*`」与其实际断言不符。仓内暂无接线消费者，但口径分叉是事实。
  建议：统一通配语法，并修正该测试名实不符。

- [medium] 三份"当前事实"文档在 alpha.11 发布后只更新一半，同段自相矛盾 — `docs/roadmap/ROADMAP.md:14-15,132-136`、`docs/governance/PROJECT_WORKFLOW.md:14-16`、`docs/current/VERSION_PLAN.md:5`
  证据：STATUS.md:5 与 alpha.11 closure JSON 证明已发布；ROADMAP :8 写 "alpha.11 (published)" 而 :14-15/:135-136 写 "alpha.10 is published… alpha.11 in-flight"；VERSION_PLAN :3 与 :5 直接冲突。check-version-anchors 结构性无法捕获"当前版本号+过期状态词"的半更新。
  建议：发布收尾把 "in-flight/active train" 散文纳入机械更新清单，或给锚点门禁加"published 版本号不得与 in-flight 同段共现"规则。

- [medium] CONTRIBUTING.md 项目结构列出 6 个已删除的包；导入风格指导与全仓实际相反；引用不存在的 SUPPORT.md — `CONTRIBUTING.md:35-50,81-85,6`
  证据：packages/ 仅五包，文中仍列 core/signal/content/protocol/router/ssg，与 README.md:39-40 矛盾；实测 663 处相对导入全部带 `.ts` 扩展，extensionless 为 0，文中却要求 "Keep new imports extension-less"；`SUPPORT.md` 不存在。
  建议：重写结构段与导入段，删 SUPPORT.md 引用。

- [medium] www 安全指南停留在 #611 之前的威胁模型，与已发货 CSRF 默认地板及 ADR-0121 §12 修订文直接矛盾 — `www/app/routes/guide/security.tsx:24,59,91-94`
  证据：文中称 "the framework ships no built-in CSRF token check" 并引用 ADR-0121 §12，而 §12 修订文（ADR-0121-0-42-action-protocol-hardening-amendment.md:110-118）现在写的是"生成 action POST 默认 fail-closed 同源地板"；`OPEN_ELEMENT_DISABLE_CSRF` opt-out 用户文档零提及。详见维度 6 专项。
  建议：重写 standing-assumption 卡与 recipe 定位，补 opt-out 说明。

- [medium] www locale 列表硬编码双胞胎：注入属性与写死正则并存 — `www/app/site-ui/open-layout.tsx:45,682-689`、`www/public/logo-home.js:6`
  证据：`_currentLocale` 走注入的 `locales` 属性（dist 产物确证 `["en","zh"]`），`_homeHref()` 与 logo-home.js 用写死 `(en|zh)`。反例：vite.config 增加 `'fr'` 后 `/fr/` 下首页链接静默回落 `/`。两侧注释互相指向对方，自认复制粘贴。
  建议：`_homeHref` 改由 `this._locales` 动态构造；logo-home.js 从注入属性读取。

- [medium] packages/ui 同包 10 个组件两套并存风格 — `packages/ui/src/open-dropdown.tsx:58-80`、`open-tabs.tsx:35-128`（`class=`、`#private`、`VNode`、压缩 CSS）vs 其余 8 组件（`className=`、`_private`、`ReturnType<typeof OpenElement.prototype.render>` 冗长返回类型 ×8）
  证据：两种 JSX 属性约定、两种私有成员约定、两种 render 返回类型写法并存；文件头格式也不统一（open-callout.tsx:3）。
  建议：统一约定，返回类型抽共享别名。

- [medium] 两个示例 README 末尾逐字节相同的中文段落，与全英文文档混杂，且三个示例口径不一 — `examples/deno-desktop-mastodon/README.md:90-94`、`examples/deno-desktop-reader/README.md:100-104`
  证据：diff 为空；项目中文惯例是单独 README.zh.md；fresh 示例同样钉 0.41.0-alpha.6 却无此段。
  建议：译为英文并抽到一处，或三示例统一。

- [medium] open-element-in-fresh 版本锚点漂移 + 自述矛盾（#800 后的新漂移） — `examples/open-element-in-fresh/README.md:5`、`routes/index.tsx:9,23,28`
  证据：三处写 `0.42.0-alpha.10`，根 README 与五包 deno.json 均为 alpha.11；check-version-anchors 锚点清单不覆盖 examples。页面文案称 ui 集成 "will be enabled once…" 与 README.md:76-84 "is resolved" 直接矛盾。
  建议：版本对齐 alpha.11、统一阻塞状态口径、examples README 纳入锚点门禁。

- [medium] adapter-vite README 管线顺序与实际执行顺序矛盾 — `packages/adapter-vite/README.md:62-68` vs `src/build.ts:126-129,197-225`
  证据：README 按 1→2→3 描述；实际 ADR-0023 执行顺序 1→3→2（SSG 先于 client bundle）。
  建议：README 注明执行顺序 1→3→2。

- [medium] ADR reviewer agent 的"阻断规则"引用已删除的包 — `.github/agents/adr-reviewer.agent.md:23-24`
  证据：首条 "`@openelement/core` stays runtime-only…"，core 包已不存在；review agent 会拿不存在的边界卡 PR。
  建议：改为 element 对应边界或删除该条。

- [medium] docs/release/ 自称权威来源，但多份历史证据状态过期、字段自相矛盾、链条有洞 — `docs/release/v0.41.0-alpha.5.md:5,8`、`v0.41.0-alpha.8.md:5,8` + autoflow3 JSON（status `"running"`）、`v0.41.0-alpha.11.md:3`、`CHANGELOG.md:445`；alpha.7/alpha.12 缺 notes
  证据：alpha.5/8 的 Previous 与 Released 写成同一版本（逻辑不可能）、Status 永停 `running`；alpha.11 自称 release candidate 但 tag 存在且后续版本已把它当 previous；alpha.7/12 有 tag 无 notes 无 CHANGELOG 条目无任何解释。证据一致性门禁只校验当前版本。
  建议：补写缺口说明、回填终态、previous==released 字段校验入门禁。

- [low] 大面积陈旧「./index.ts」文件头（复制残留）+ 指向已删除包的头注 — element 34 处（`isr.ts:1-2`、`logger.ts:1-2`、`render-dsd.ts:1-2`、全部 protocol 文件等）、adapter-vite 21 处（`build-postprocess.ts:2`、`route-scanner.ts:2` 等；`entry-renderer.ts:1` 自称 `@openelement/element`，`route-scanner.ts:39` 指引不存在的 `packages/core/`）、www 3 处陈旧 `@openelement/docs`（`open-search.tsx:2`、`apilist.tsx:1`、`comparison.tsx:2`）；`html-escape.ts:184` 尾部悬空节标题
  建议：批量改为真实模块名或删除文件名前缀；删悬空节标题。

- [low] 同类面向用户错误三种前缀 — `packages/app/src/spa.ts:246`（`[spa]`）、`client-router.ts:394`（`[router]`）vs `authoring.ts` 统一 `ERROR_PREFIX`（`[openElement]`）
  证据：与 #623 logger tag 记债不同——这是 Error message 前缀。
  建议：统一走 ERROR_PREFIX 或明确记债。

- [low] route-manifest.ts 用法示例双重过时 — `packages/adapter-vite/src/route-manifest.ts:8-23`
  证据：示例从 `@openelement/app` import `createRouter`（根导出无此符号）；routes 用 `component` 字段而 RouteConfig 要求 `tagName`（spa.test.ts:14-17 专门断言 component 已不存在）。照抄即坏。
  建议：改写示例或删除。

- [low] `isFragment` 有跨 bundle 兜底而 `isShowTag`/`isForTag` 没有 — `packages/element/src/internal/core/jsx-runtime.ts:34-37` vs `53-63`
  证据：三个标记同为 `Symbol.for`，仅 Fragment 有 symbol-description 分支；跨 realm 场景 Show/For 静默退化为不可渲染 tag。
  建议：三处统一加（或统一去掉并说明理由）。

- [low] island.ts 注释与实现矛盾 ×3 — `packages/element/src/internal/core/island.ts:258-286,76-96,249-251`
  证据：① 258-262 注释称 "Instead of modifying the prototype directly"，实现正是原型猴子补丁；② `bindSsrProps` JSDoc 被另一注释块隔断；③ 注释说 `options.dsd/ssr` 无运行时效果，但 `protocol/island.ts:23-32` 契约注释仍写成有效选项。
  建议：三处注释与实现/契约同步。

- [low] 测试 assert specifier 四个分区各自分叉 — element `__tests__/` 10 文件 `@std/assert@1` vs 4 文件 `@^1.0.0`；app `action-error.test.ts:1` 等 3 文件 `@1` vs 6 文件 `@^1.0.0`；www 四种写法并存（`site-ui.test.ts:1`、`v0.27.0-regression.test.ts:17`、`island-metadata.test.ts:7`、`build-output.test.ts:8-9` 含一处 lint-ignore）
  建议：全仓统一为 bare `@std/assert`（根 deno.json:15 已有映射）。

- [low] www 路由/组件注册方式多处分叉 — 路由守卫式 4 文件（`apilist.tsx:239` 等）vs 裸 define 约 20 文件；site-ui 裸 define 5 个（`open-page-rail.tsx:125` 等）vs `defineCustomElement` 4 个（`open-layout.tsx:1335` 等）；`guide/migration.tsx` 是 14 个 guide 路由中唯一缺 `tagName`/`customElements.define` 的（构建兜底生成 `<guide-migration`，兄弟均为 `guide-<name>-page`）
  证据：裸 define 在重复求值时抛 DuplicateDefinition，guide-pages.test.ts:5-10 不得不 stub 注册表绕过。
  建议：统一为 `defineCustomElement`（幂等）；migration.tsx 补齐 tagName。

- [low] www 命名误导三处 — `www/app/routes/index/index.tsx:227`（首页类名 `DocsHome`）、`architecture/design-system.tsx:5,224`（tag/类名 `ui-showcase`/`UIShowcase`）、`architecture/islands.tsx:28`（类名 `IslandsGuidePage`）
  建议：按当前路由语义重命名。

- [low] packages/ui 日志模式分裂 — `open-code-block.tsx:29,251` 用 `createLogger('ui')` vs `open-theme-toggle.tsx:125,151,167,236` 四处裸 `console.debug('[open-theme-toggle] …')`
  建议：theme-toggle 改用 createLogger。

- [low] open-callout 注释与实现不符 + `_syncDOM` 反语义命名 — `packages/ui/src/open-callout.tsx:7,42-44,87-89`
  证据：头注 "All colors use semantic tokens" vs 三处硬编码 rgba；`_syncDOM()` 实为 `this.update()` 全量重渲染，与同包兄弟的"原地同步"语义相反。
  建议：删 `_syncDOM`；硬编码色值换 token 或修正注释。

- [low] `chunkSizeWarningLimit: 1500` 三处两口径 — `packages/adapter-vite/src/plugin.ts:225`、`cli/build-client.ts:254`（硬编码）vs `cli/build-ssg.ts:51`（命名常量）
  建议：提取共享常量。

- [low] SPA 与 SSG 两条 closeBundle 的 Phase 2 触发条件分叉 — `packages/adapter-vite/src/build.ts:189` vs `:220-224`
  证据：SSG 路径有 `hasEnhancedForms` 判断（#569），SPA 路径只看 `totalIslands > 0`。实际影响有限但同函数两分支守卫不一致。
  建议：统一守卫或注释说明有意省略。

- [low]（历史存量 #623，新证据点位）Phase 2 客户端构建与构建清单沿用 `ssg` logger tag；build-manifest 头注调用方已漂移 — `packages/adapter-vite/src/cli/build-client.ts:35`、`build-manifest.ts:24,13-16`
  建议：分别改 `build-client`/`build-manifest` tag 并修正头注。

- [low] 目录默认值魔法字符串多点重复、三处独立默认填充 — `'app/routes'/'app/islands'/'app/components'`：`src/index.ts:43-45`、`app-vite.ts:36-38`、`plugin.ts:122-124`、`build-context.ts:120-126,205-207`、`entry-descriptor.ts:86-87`、`build-ssg.ts:190-191`、`build-client.ts:147`；i18n/blog/nav 插件各自硬编码 `'app/data'`（`i18n-plugin.ts:22,81-84` 等），generated-data-resolver.ts:29 的 `dataDir` 配置生产无调用方
  建议：收敛为常量 + 单一 resolveDefaults。

- [low] i18n 插件无 FileSystemAdapter 注入（blog/nav 均有） — `packages/adapter-vite/src/i18n-plugin.ts:22,81-84` vs `internal/content/blog/plugin.ts:19-23`、`nav/plugin.ts:20-24`
  建议：补齐 fs 注入。

- [low] 五包职责表四份拷贝已漂移 — `docs/current/STACK_CONTRACT.md:6-12`、`docs/current/PACKAGE_SURFACE.md:15-21`、`docs/roadmap/ROADADMAP.md`、`docs/status/STATUS.md`（create 行四种写法、adapter-vite 行三种写法；`<!-- 5-package -->` 标记只卡数量不卡文案）
  建议：保留一份为准，其余引用。

- [low] 治理文档角色表与 CHANGELOG 自我声明矛盾 — `docs/governance/PROJECT_WORKFLOW.md:45` vs `CHANGELOG.md:3-6`
  建议：角色表改为 docs/release/ 权威、CHANGELOG 为聚合历史。

- [low] docs/archive/README.md 的 "Active truth" 白名单漏列 governance/integrations/evidence/dogfood — `docs/archive/README.md:5-12`
  建议：补齐或改写为"至少包括"。

- [low] ADR 目录 0066 空号无说明；已删除文件的条目未标注 — `docs/adr/README.md:110,58-65`
  建议：补空号说明、历史-only 条目加标记。

- [low] v0.41.0-plan.md 内部引用失效 ×2 — `docs/release/v0.41.0-plan.md:20`（指向不存在的 `docs/release/PACKAGE_SURFACE.md`）、`:62`（`v0.41.0-interface-snapshot.json` 实为 `public-interface-snapshot.json`）
  建议：修两处路径。

- [low] reader 行高/pdfMaxWidth 默认值三方不一致（可复现行为分叉） — `examples/deno-desktop-reader/app/storage.ts:8`（1.6）vs `styles.css:22`、`reader.tsx:117`（CSS fallback 1.7，且不在选项 [1.4,1.6,1.8] 内）vs `routes/settings.tsx:267`；`pdf-measure.ts:7`（910）vs CSS fallback 960px
  证据：全新用户首渲 1.7，打开设置页变 1.6，保存后正文 reflow。
  建议：以 storage.ts DEFAULTS 为唯一源。

- [low] mastodon api-client 路径参数编码不一致 — `examples/deno-desktop-mastodon/app/api-client.ts:142,163`（encodeAcct 包装）vs `:60-62,105`（直接插值），服务端 main.ts:82,91 却 decodeURIComponent
  建议：统一 encode。

- [low] ISSUE_TEMPLATE 与多个 tools 脚本头部版本口径过时 — `.github/ISSUE_TEMPLATE/feature.yml:11`、`release-task.yml:11`（"Example: v0.40.0"）；`tools/check-type-safety.ts:2`（v0.40.x）、`check-architecture-contract.ts:2`（v0.30.1）、`consumer-smoke.ts:3,12-13`（v0.41.0）、`bump-version.ts:16-18`（0.41.0-alpha.x）
  建议：头部去版本化或改占位符。

- [low] check-text-integrity 报错文案本身过时/倒置 — `tools/check-text-integrity.ts:33-39`
  证据："must use the 11-package v0.40 graph" 说法本身已被 www-truth 门禁禁止；38-39 行 message 与正则实际含义倒置。
  建议：更正两条 message。

- [low] mastodon 静态服务 `/app/` 前缀回退到项目根，loopback 上可读源码 — `examples/deno-desktop-mastodon/main.ts:97-107`、`examples/deno-desktop-reader/main.ts:239-251`
  证据：`GET /app/host-store.ts` → dist 无此文件 → 回退源码根 → octet-stream 返回源码。仅 loopback（两 main.ts 均钉 127.0.0.1），故 low。
  建议：root 回退白名单限定 `.css/.json`。

### 维度 2：Bad smell（clean/lean）

- [medium] start CLI 对畸形百分号编码 URL 未设防，请求悬死/进程崩溃 — `packages/adapter-vite/src/internal/static-serve.ts:46`、`packages/adapter-vite/src/cli/start.ts:129,141`
  证据：`staticFileCandidates()` 里 `decodeURIComponent(pathname…)` 对 `/%zz` 这类输入抛 `URIError`；`handleRequest()` 在 try/catch 之外调用 `tryStatic()`（:141），生成的 `matchRequestTimeRoute` 也在 try 之外且内部同样 decode（ssg-helpers.ts:204 生成码）。反例：`deno task start` 后 `curl http://localhost:4173/%zz` → Node 下未处理 rejection 崩进程，Deno 下该连接永无响应。`__fixtures__/request-time/e2e/server.ts:51` 同样未设防（fixture，影响小）。
  建议：tryStatic/handleRequest 层捕获 URIError 返回 400。

- [medium] verify-package-configs 的 name/version 校验是恒真自比较（假门禁） — `tools/verify-package-configs.ts:47-52`
  证据：`pkg.name/version` 本就解析自同一 deno.json，再读同一文件自比较；name 分支不可达，version 分支唯一触发情形报错文案误导。看似校验图一致性，实际什么都没校验。
  建议：删除两分支或改为真正校验 `config.version === PACKAGE_VERSION`。

- [medium] check-package-graph 的 "Publish Order Validation" 整段不可达（死检查） — `tools/check-package-graph.ts:260-305`
  证据：`releasePublishOrder` 内部已 throw（lib/package-graph.ts:284-289），违规分支必为空；两个集合差校验恒为空集。约 45 行假门禁，真实违规变成未捕获异常+堆栈。
  建议：删除该段或捕获后格式化输出。

- [medium] stripComments 不感知字符串字面量，artifact 门禁整行漏扫（潜伏假阴性，已构造反例） — `tools/lib/text.ts:40-44`，使用方 `check-package-artifacts.ts:104`、`check-www-current-truth.ts:122`
  证据：实测 `stripComments('const a = "https://openelement.org"; const b = process.env.X; …')` 截断为 `"const a = \"https:"`，`//` 后整行被吞；URL 字符串在前、host token 在后的同行会漏报。当前产物未见同行并存，一旦压缩成单行 bundle 扫描基本失效。
  建议：stripComments 增加字符串感知，或 artifact 扫描改用 typescript-ast。

- [medium] mojibake 禁用字符表第三、四份漂移私拷贝（#805 只合并两处） — `tools/lib/text.ts:56-80`（23 字符 canonical）vs `check-public-docs-integrity.ts:43-51`（6 字符+`/\?\?\?/`）vs `check-www-current-truth.ts:44`（4 字符）
  证据：public-docs 的 `\u7BA0` 等不在 MOJIBAKE_CHARS 中；同一字符一个门禁红、另一个绿。
  建议：统一从 MOJIBAKE_CHARS 派生。

- [medium] 五包名单 4 处各自硬编码，新增包时部分门禁静默漏检 — `tools/project-constants.ts:4-10`（canonical）vs `lib/package-graph.ts:262-268` vs `verify-npm-release.ts:35` vs `consumer-packaged-starter.ts:8`
  证据：反例——新增第 6 包并同步 canonical 后，releasePriority 未含它（排最后仍发布）、verify-npm-release 不跑 npm view、packaged-starter 不覆盖，三处静默通过。
  建议：三处派生自 RETAINED_PACKAGE_NAMES。

- [medium] starter 的 `headerNav` 是死配置：脚手架第一印象"配置不生效" — `packages/create/templates/vite.config.ts:31-37` vs `templates/app/components/app-shell.tsx:18,23-26`
  证据：运行时确实把 headerNav 传入 app-shell（entry-render-runtime.ts:108-118），但 starter shell 完全不消费，硬编码 `<nav>`；改 vite.config 的 headerNav 页面毫无变化。
  建议：app-shell 消费 `props.headerNav`（缺省回退），或从模板删配置。

- [medium] www design/handoff/migration-guide.md 与代码现实矛盾（v3 陈旧文档） — `www/design/handoff/migration-guide.md:11-13,23`
  证据：称 `packages/ui/src/open-layout.tsx` owns shared shell（该文件不存在）；要求 Remove `linearTokenSheet`（符号已不存在）；v3 已于 2026-07-26 退役（design/mockups/v4/README.md）。
  建议：归档或按 v4 重写。

- [low] 测试假断言/名实不符 5 处 —
  ① `packages/app/__tests__/authoring.test.tsx:236-248`：恒真运行时断言（`in host === true`）+ 断言从未存在的内部名（真实内部名是 `__enterDataContext` 等，真泄漏也抓不到）；
  ② `packages/adapter-vite/__tests__/index-plugin.test.ts:194-204`：`assertEquals(true, true)` 收尾，hook 非函数静默通过；
  ③ `packages/adapter-vite/__tests__/route-manifest.test.ts:134-155`：用例名与断言行为不符（并入维度 1 路由分叉条目）；
  ④ `packages/ui/__tests__/components.test.ts:1731-1742`：`continue`+`find`+`assertExists` 组合使"组件缺席 manifest"静默通过；
  ⑤ `packages/adapter-vite/__tests__/ssg-smoke.test.ts:73-74`：连续断言两次同一条件。
  建议：逐处改行为断言或删除。

- [low] queueLayoutFixHost 在无 rAF 环境永久卡死调度标志 — `packages/element/src/internal/core/hydration-scope.ts:351-357`
  证据：可选调用 `requestAnimationFrame?...)`；无 rAF 时 `layoutFixScheduled` 永不复位，模块级 Set 持 host 强引用阻碍 GC，后续 reflow 修复永久丢失。
  建议：无 rAF 时同步 flush 或 setTimeout 回退。

- [low] CSR 对 boolean `true` 子节点输出文本 "true"，SSR 丢弃 — `packages/element/src/internal/core/jsx-render-dom.ts:294-301` vs `render-ir.ts:203`
  证据：手工构造 `children:[true]` 绕过 normaliseChildren 可复现；正常 JSX 路径不可达，故 low。
  建议：renderNode 入口加 boolean 判断与 SSR 对齐。

- [low] renderRouteHandler 约 320 行超长函数 — `packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts:132-454`（GET/POST 双路径+CSRF+PRG+错误边界一体）
  建议：按 action/get/error-boundary 拆分（纯代码移动）。

- [low] "ponytail" 个人标记散布 4 文件 8 处 — `examples/deno-desktop-reader/app/search.ts:73,77`、`vite.config.ts:51`、`__tests__/routes.test.ts:11`、`examples/open-element-in-fresh/islands/OpenElements.tsx:4,9,21,23`（其中两条实为"临时实现"债务声明）
  建议：改为标准 TODO+issue 号或清理。

- [low] 魔法数/字符串重复若干 — open-code-block `2000`ms 反馈窗口两处（245-249、255-259）与 backoff 双份（167-171 vs 195-199）；其余见维度 1/4 条目
  建议：抽 `_scheduleRetry(base, cap)` 等。

- [low] check-coverage 的快照-恢复机制对空列表空转 — `tools/check-coverage.ts:28-31,62`（#738 清空条目后 snapshots 恒空，注释仍宣称防护）
  建议：删死机制或注释说明占位。

- [low] check-www-current-truth 的 walk skip 含永不生效的 glob 字符串 — `tools/check-www-current-truth.ts:135`（`'_generated-*'` 全等比较永不匹配，实测验证；且两个 sourceRoots 下本无该目录，属误导性死配置）
  建议：删除或改正则。

- [low] open-dialog `mode` 属性是未文档化的公共开关 — `packages/ui/src/open-dialog.tsx:221`（文件头 usage 未提；`label` 在 render 读两次 :128/:134）
  建议：文件头补 mode 说明；复用局部变量。

- [low] open-code-block 死 class 写入 — `packages/ui/src/open-code-block.tsx:267-268`（`.copied`/`.failed` 无任何 CSS 规则，视觉反馈全由 `:state()`+textContent 承担；`_copyState` 字段主要消费者就是这两行）
  建议：删 toggle 两行或补 CSS。

- [low] ShadowRoot 全局桩泄漏 — `packages/element/__tests__/signal-context.test.ts:22`（模块顶层赋值不还原，同进程跑全部测试时泄漏；当前侥幸无人依赖）
  建议：defineProperty + 用后还原。

### 维度 3：冗余代码/冗余文件

- [medium] www/public/assets/icons/ 整目录 23 个 SVG 全死文件（92K） — `www/public/assets/icons/`
  证据：23 个文件名逐一全仓 Grep 零引用（含 dist HTML）；组件全部内联 SVG；最后变更停在 v0.41.0-alpha.1。被取代未删的旧路径。
  建议：整目录删除。

- [medium] ui 死 token 调色板随包发布，与文件头承诺直接矛盾 — `packages/ui/src/open-props-tokens.css:277-315,436-474`（blue/teal/cyan 两主题 78 行）+ 镜像 `open-props-tokens.ts:294-332,453-491`；`--indigo-*` 26 行中仅 `--indigo-6` 被引用
  证据：全仓 Grep `var\(--(blue|teal|cyan)-` 零引用；文件头写 "Cleaned dead tokens; only used tokens survive"，docs/TOKEN_AUDIT.md 宣称 "audited subset"——100+ 行死负载被打进 JS bundle 注入 www 每个页面。
  建议：删除死刻度或修正头注并加 unused-token 门禁。

- [medium] SsgRenderEvidence 五字段只写不读；BuildPlan.evidence 从未赋值 — `packages/adapter-vite/src/internal/protocol/ssg.ts:305-309,416`、`cli/ssg-render.ts:20-24`
  证据：全仓 grep `evidence\.` 确认无生产消费者（仅一个测试读 admissionDecisions）；`createProductionBuildPlan` 从不赋值。为不存在调用方保留的契约面。
  建议：删除或让管线真正消费。

- [medium] internal/content/core.ts barrel 约 20 个 re-export 仅 2 个经此消费 — `packages/adapter-vite/src/internal/content/core.ts:1-29`
  证据：仅 `src/index.ts:101`（generateSitemap）与 `app-vite.ts:11`（类型）经此；其余调用方都直接 import 具体模块。
  建议：收敛或删除 barrel。

- [medium] dependabot npm 条目为死配置，与 SECURITY.md 承诺不符 — `.github/dependabot.yml:7-11`、`SECURITY.md:18-19`
  证据：全仓无 package.json（纯 Deno workspace），npm 生态无 manifest 可扫；SECURITY.md 却称 "Dependabot opens weekly update proposals"——npm: 依赖实际无任何自动更新渠道。
  建议：删 npm 条目或改写 SECURITY.md 口径。

- [low] ssg 内部 barrel 两个死 re-export — `packages/adapter-vite/src/internal/ssg/index.ts:58`（insertAfterHead）、`:91`（stableHash）
  建议：从 barrel 删除。

- [low] `pageStylesSheet` 死导出 — `www/app/components/page-styles.ts:366-367`（9 处消费方全用字符串版 pageStyles 自行拼）
  建议：删除。

- [low] orphan 文件两个 — `www/content/mdx/example.mdx`（无入口可达，仅 ADR-0072/旧 release notes 文字提及，最后变更 v0.30.1）；`packages/ui/docs/TOKEN_AUDIT.md`（全仓零引用、README 未链接、不在 publish include，且内容已与死调色板现状脱节）
  建议：删除或接入活路径。

- [low] open-input 残留 textarea/select 死通用性 — `packages/ui/src/open-input.tsx:205,17`（render 只产出 `<input>`，查询选择器与 @csspart 注释为不存在的元素种类保留通用性）
  建议：收窄为 input 并同步头注。

- [low] 已静态 import 的模块再走动态 `await import` + 内联手写签名拷贝 — `packages/adapter-vite/src/plugin.ts:263`、`cli/build-ssg.ts:215-218`（顶部均已有静态 import，无循环依赖理由）；`cli/ssg-render.ts:30-32` 内联 `as { generateSitemap: (dir, opts: unknown) => string[] }` 是真实签名的弱化拷贝
  建议：统一静态 import，删内联签名。

- [low] 命名/间接层残留 — `plugin.ts:49` `LessAliasOptions`（"less" 时代遗留）；`codegen-literals.ts:11-13` + `entry-render-helpers.ts:43-45` 三层同义别名；`workspace-alias.ts:18` `const tryReadJson = readJsonc` 无意义别名；`island-manifest.ts:173` 过期尾注；`build-ssg.ts:271-286` 两同过滤循环可合并
  建议：重命名/压平/删除/合并。

- [low] speculation-rules API 路由排除分支从唯一生产调用方不可达 — `packages/adapter-vite/src/speculation-rules.ts:55-58`（ssg-render.ts:314-317 只传 page 路由，防御性死分支）
  建议：标注或删除。

- [low] generate-ui-token-module `--bootstrap` 一次性迁移路径成死代码 — `tools/generate-ui-token-module.ts:7,9-27`（全仓无调用方；CSS 源文件已在仓内）
  建议：删除 `--bootstrap` 与 `extractLegacyCss`。

- [low] bump-version.updateRootImports 在现行门禁下恒为 no-op — `tools/bump-version.ts:152-177`（check-package-graph 禁止根 deno.json 出现 @openelement/* alias，替换计数恒 0；泛化替换还可能误伤同版本无关依赖）
  建议：删除或收窄为显式前缀。

- [low] 工作区残留发布产物（磁盘卫生） — `packages/element/openelement-element-0.42.0-alpha.11.tgz`、`packages/app/openelement-app-0.42.0-alpha.11.tgz`、`packages/adapter-vite/{*.tgz, packages/, __test_fixtures__/}`（均 gitignored 未入库）
  建议：本地清理。

### 维度 4：重复实现/重复文件

- [medium] 跨包协议字符串 `data-ssr-props` 四处硬编码 — `packages/element/src/internal/core/render-dsd.ts:160`（写方）、`island.ts:66,279`、`packages/app/src/preact.ts:43`、`www/app/site-ui/open-page-rail.tsx:83`（三个读方）
  证据：同类 hydration 标记全部集中在 `protocol/hydration-markers.ts:12-28`，唯独此属性散落四文件；任一处改名即静默断链，无类型约束兜底。
  建议：hydration-markers.ts 增加 `DATA_SSR_PROPS` 常量并替换四处。

- [medium] 两个示例 router.ts 逐字双胞胎 + topnav/boot 段约 70 行双胞胎 — `examples/deno-desktop-mastodon/router.ts:1-32` vs `deno-desktop-reader/router.ts:1-34`（diff 仅差一行注释和 log tag）；`mastodon.tsx:50-122` vs `reader.tsx:1146-1227`（结构逐行同构）
  证据：#786 已消除服务端双胞胎（lib/server-utils.ts），这是同类问题的客户端残留。
  建议：router 提升到 examples/lib 客户端版，topnav 参数化共享。

- [medium] stale-claim 手写历史正则在两门禁间复制且已漂移 — `tools/check-strategic-docs.ts:142-150,156` vs `tools/check-public-docs-integrity.ts:54-67,81,206`
  证据：7 条正则逐字节相同；JSR best-effort 一条已漂移成两种写法（#742 只收敛了生成的 currency 正则）。
  建议：手写历史 pattern 收敛为单一导出常量。

- [medium] SPA 测试 DOM stub 样板同文件 5 处重复，且仓内已有三套同类 helper — `packages/app/__tests__/spa.test.ts:50-129,131-185,187-270,272-353,366-426`（各 40-80 行逐字重复）；helper 已存在于 `spa.test.ts:435-491`（stubNavigableEnvironment）、`client-router.test.ts:172-247`（installFakeBrowser）、`dom-stubs.ts:165-213`（installDomStubs）
  证据：同文件前半逐字重复，后半自己却抽了 helper；三种 stub 风格并存，恢复逻辑漏一项即跨测试污染。
  建议：收敛为一份 helper。

- [low] prop.ts 属性→信号解析同文件双份拷贝 — `packages/element/src/internal/core/prop.ts:153-181` vs `197-217`（四分支逐条重复，已有语义差异：null 恢复默认 vs hasAttribute）
  建议：抽 `parseAttributeValue(type, raw, defaultValue)`。

- [low] FakeScope 测试双胞胎 — `packages/element/__tests__/open-element-render.test.ts:20-39` vs `open-element-hydration.test.ts:32-50`（近乎逐行重复，render 版多一个 createLifecycle）
  建议：去重。

- [low] e2e「沿原型链走到 OpenElement 基类」探针 4 份逐字节拷贝 + ISLAND_CANDIDATES 重复 — `www/e2e/hydration-behavior.spec.ts:72-78,160-166`、`static-props-observed.spec.ts:36-43,19`、`static-props-reflect.spec.ts:45-52,19`
  建议：提取共享模块，evaluate 时注入。

- [low] 版本一致性校验逻辑两处重复实现 — `tools/check-package-graph.ts:111-127` vs `tools/publish-npm.ts:271-281`（同为 Map 聚合+size 判断+相同报错格式）
  建议：抽到 lib/package-graph.ts。

- [low] consumer-packaged-starter 手写 tarball 命名（#793 共享助手未覆盖的第三处） — `tools/consumer-packaged-starter.ts:51-53` vs `tools/lib/npm-tarball.ts:11-17`
  建议：改用 npmTarballName/tarballPath。

- [low] 退役包名正则两份逐字节相同拷贝 — `tools/check-www-current-truth.ts:47` vs `tools/check-package-surface.ts:13-14`（均为 6 名子集，canonical `REMOVED_PACKAGE_NAMES` 有 19 名）
  建议：从 canonical 派生或注释固化子集理由。

- [low] firefox/webkit smoke 任务复制同一条长 `--grep` 清单 — `deno.json:88-89`（除 --project 外逐字节相同）
  建议：改单一脚本带 project 参数。

- [low] mastodon api.ts 五个 live-fetch 块复制粘贴（约 15 行×5） — `examples/deno-desktop-mastodon/app/api.ts:71-90,103-122,137-156,169-188,203-225`；同项目 `api-client.ts:35-58` 已有等价 fetchJson 模式，api-client 自身 5 个方法也同构
  建议：抽 fetchJson helper。

- [low] SSR-safe 实例 id 计数器注释近乎逐字双份 — `packages/ui/src/open-input.tsx:37-42` vs `open-tabs.tsx:22-26`
  建议：抽 `nextInstanceId()` helper。

- [low] codegen-literals 三层同义别名 — `packages/adapter-vite/src/codegen-literals.ts:11-13` + `entry-render-helpers.ts:43-45`（quoteGeneratedJavaScriptValue → quoteGeneratedJavaScriptStringLiteral → jsStringLiteral）
  建议：压平。

- [low] open-code-block 指数退避块近似重复 — `packages/ui/src/open-code-block.tsx:167-171` vs `195-199`（仅基数/上限不同）
  建议：抽 `_scheduleRetry(base, cap)`。

- [low] reader.tsx 内嵌 ~980 行 CSS，主题 token 约 100 行与 styles.css 逐值镜像 — `examples/deno-desktop-reader/reader.tsx:79-1057` vs `app/styles.css:21-135`（抽查三主题逐值相同，注释自认 "mirrored from"）
  建议：token 段抽共享常量或生成，加 drift 检查。

- [low] ssg-smoke 测试自带 findHtmlFiles 与共享 walker 重复 + hasSsrBundle 逐字别名 — `packages/adapter-vite/__tests__/ssg-smoke.test.ts:21-31,39-53`（共享 walker 在 internal/html-files.ts）
  建议：删别名，复用共享 walker。

### 维度 5：死代码/死文件

- [medium] ISR 运行时簇不可达，且文档指引的接线方式无法导入 — `packages/element/src/internal/core/isr-runtime.ts:45-164`、`isr.ts:34-123`
  证据：`renderIsrResponse`/`findIsrManifestEntry`/`IsrRuntimeCache`/`MemoryIsrCache`/`isIsrRouteConfig` 只经内部 barrel 再导出，包 exports 4 个入口均未转发；全仓 Grep 零消费者零测试。但 `docs/current/ISR_KV_ADAPTER.md:115` 指导用户把 KV adapter 传给 `renderIsrResponse`——按公开导出面根本 import 不到。`src/index.ts:132` 公开了相关类型（"self-build KV adapters"）却不公开消费它们的 runtime，API 形状不对称。附带：`isr.ts:4-12` 文件头仍写 "v0.22 scope"，与 0.44 口径矛盾，架构列表编号缺 3。（注：@experimental/0.44 占位本身允许，报的是文档-可导入性矛盾。）
  建议：导出使文档成真，或 ISR_KV_ADAPTER.md 标注 "0.44 前不可导入"；修文件头口径。

- [medium] page-contract.ts 三个死导出 — `www/app/site-ui/page-contract.ts:9,30,44`（`ReadingContract` 类型、`defineReadingContract()`、`serializeOutline()` 全仓零引用；且 guide-page.tsx:114 与 blog/[slug].tsx:141 手写 `JSON.stringify(...outline)`，本可复用 serializeOutline）
  建议：删除三导出，或改用手写处复用后删其余。

- [low] signal 模块 default 聚合导出无消费者 — `packages/element/src/internal/signal/index.ts:27-30`（facade 只用具名导出）
  建议：删除 default 导出。

- [low] `matchRoute` 实为仅测试引用的导出 — `packages/app/src/internal/router/client-router.ts:196-203`（注释 "standalone matching" 消费者不存在；同文件 matchRouteLinearForTests 有 oracle 定位保留合理）
  建议：删注释半句或移入测试。

- [low] `generateRouteManifestContent` 只被自己的测试引用 — `packages/adapter-vite/src/route-manifest.ts:65-70`（生产唯一调用方走 writeRouteManifest；非 deno.json 导出面）
  建议：取消 export，测试改测 writeRouteManifest。

- [low] 模板死导出 `tagName = 'contact-page'` — `packages/create/templates/app/routes/contact.tsx:10`（全仓零消费；文件尾注释自认路由模块不做 define；兄弟文件 tagName 都传给 defineElement）
  建议：删除。

- [low] 示例 router.ts 三个死导出（两文件各一份） — `examples/deno-desktop-mastodon/router.ts:14,26,30`、`deno-desktop-reader/router.ts:15,28,32`（getRouter/currentParams/currentPath 外部零引用）
  建议：删除。

- [low] host-store.ts 的 loadState/saveState 死导出 — `examples/deno-desktop-reader/app/host-store.ts:132,149`（仅文件内部使用，且签名暴露未导出的 ReaderState）
  建议：去 export。

- [low] SearchResult.fileName 自认占位的死字段 — `examples/deno-desktop-reader/app/search.ts:5,77`（写入处注释自认 "real mapping in full index"；唯一消费者不读它）
  建议：删除字段。

- [low] mastodon `ApiResult.headers` 从未写入或读取 — `examples/deno-desktop-mastodon/app/types.ts:133`
  建议：删除字段。

- [low]（历史存量残留，#785 修复遗留）`www/e2e/helpers.ts:60` 的 `export { expect }` 仍无引用
  建议：删除该 re-export。

### 维度 6：WC light fullstack 专项

见下方专项结论节。专项新发现汇总：

- [high] CSRF 同源地板只有字符串存在性测试，全仓无 deny/allow 行为测试，且唯一行为线束整体关闭 CSRF — `packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts:227-245`、`__tests__/entry-renderer.test.ts:840-845`、`__fixtures__/request-time/e2e/playwright.config.ts:38`
- [medium] www security.tsx 威胁模型过期（见维度 1 条目）
- [medium] ISR 声明失实两处 + starter 展示惰性特性 — `www/app/routes/index/index.tsx:166`、`docs/current/PACKAGE_SURFACE.md:128-129`、`packages/create/templates/app/routes/freshness.tsx:19,31-34`
- [medium] 「byte-identical 基线证明逐 alpha 重复」未兑现，计划文本与门禁现实分叉 — `tools/autoflow/policy.ts:272-285`、`docs/current/VERSION_PLAN.md:478-479`、`docs/release/v0.42.0-alpha.2.md`–`alpha.11.md`（均无基线记录）
- [low] index-plugin.test.ts 恒真断言（见维度 2 假断言条目②）
- [low] README 现状段把已发布的 request-time data/forms 与未发货 session/cache 并列称 "future product work" — `README.md:63-65`

另有一条 high 属于 packages/app 但直接打击定位承诺：

- [high] action 后重跑 loader 抛 `redirect()` 且被 guard 否决时，当前页数据被清空（#802 只修了一半） — `packages/app/src/spa.ts:227-234`（对照 `:70-87`、`:135-138`）
  证据：`runLoader()` 在 loader 抛 redirect 时返回 `{ data: undefined, redirected: true }`（spa.ts:80）；导航路径 `renderRoute()` 有 `if (redirected) return;` 保护（:138，#802 的修复），但 `handleFormSubmit()` 在 :227 丢弃了 `redirected` 标志。反例链：表单 action 成功 → 重跑 loader 抛 `redirect('/login')` → guard 返回 false → 导航未提交、renderId 不变 → `currentRender !== renderId` 检查通过 → `currentLoaderData = undefined` → 当前页以空数据重渲，页面内容丢失。主审计员已亲自读码确认两条路径差异（spa.ts:133-138 vs :227-234）。action 路径无此组合的测试覆盖。
  建议：handleFormSubmit 同样解构 `redirected` 并早退（与 renderRoute 对齐），补组合测试。

## WC light fullstack 专项结论（验收逐条）

### a) 承诺与实现：无 JS 链路每一环真实存在

- load：已兑现。`entry-render-helpers.ts:188-192`（生成 GET handler 调 loader），契约 `packages/element/src/internal/protocol/data.ts:30-46`。
- DSD render：已兑现。`entry-render-runtime.ts:97-125`（renderDsdTree + shell）。
- progressive form：已兑现。`entry-generators.ts:278-695`（shadow-root 提交拦截、morph、popstate 重载）；`data-open-enhance` 检测 `route-scanner.ts:57-90`。
- action：已兑现。`entry-render-helpers.ts:194-325`（own-key 分派、FormData、fail/redirect 代数），与 ADR-0121 逐条对应且有行为测试。
- error/redirect：已兑现。`authoring.ts:61-162`（3xx 白名单）+ `entry-render-helpers.ts:364-451`（POST/GET 同 error-boundary 通道）。
- revalidation：已兑现。action 先于 loader + 303 PRG + 422 重跑 loader（`entry-render-helpers.ts:196-200,317-322`）。
- 无 JS 闭环门禁：已兑现。`live.spec.ts:116-129`（`javaScriptEnabled:false`），三引擎门禁链 `deno.json:94` → `tools/autoflow/policy.ts:267-271` → `.github/workflows/autoflow-ci.yml:41-45`；协议行为断言 `live.spec.ts:216-342`（覆盖 #542/#549/#548/#547/#541/#550/#572/#551/#558/#573）；dev(hono) vs build(Nitro) 契约测试 `request-time-parity.test.ts:84-120`；actions 禁预渲染硬拒 `ssg-render.ts:84-95`；SSG 非 200 fail-closed `ssg-render.ts:218-233`。
- **缺口（high）**：CSRF 默认地板无任何 deny/allow 行为测试（字符串测试在逻辑反转时照样绿），VERSION_PLAN TP-5.7 准出（VERSION_PLAN.md:371）明确要求的 "CSRF default covered by unit or e2e deny/allow" 未兑现；唯一 e2e 线束以 `OPEN_ELEMENT_DISABLE_CSRF=1` 启动。基础设施已可行（`e2e/server.ts:49` 透传 Deno.env），只是没人写。
- **缺口（high，SPA 侧）**：action→loader→redirect(vetoed) 链路清数据（spa.ts:227-234），#802 修复未覆盖 action 路径。

### b) 范围侵蚀：干净

- packages 全树无 session/flash/cookie/服务端 cache/streaming 活跃实现；`sessionStorage` 仅用于 popstate 标记（`entry-generators.ts:564-579`）。
- ISR 运行时为 @experimental 且未接线（`isr-runtime.ts:62-68` 注释与 `renderRequestTimeServerModule` 无 ISR 引用一致）；构建只产 `isr-manifest.json` 前向兼容数据。nitro-proof fixture 的 `/isr` 仅是 header 透传证明缝，非活跃 ISR。
- 但 ISR 簇的文档-可导入性矛盾（维度 5 条目）与 ISR 声明失实（下条）需处理。

### c) 冻结面纯洁性：基本干净，一处证据链断裂

- 纯静态项目不产 server 产物（`ssg-render.ts:177-179`）；`definePage`/`defineElement` 入口签名自 v0.41.2 无变更（git diff 验证）；公开接口快照工具存在；被删别名已在 CHANGELOG:48-55 记为 unfrozen alpha surface 的有记录 breaking。
- **缺口（medium）**：VERSION_PLAN.md:478-479 要求 byte-identical 基线证明 "repeated at every subsequent alpha"，实际仅 alpha.1 有一次记录，alpha.2–alpha.11 全部断证；`policy.ts:272-285` 注释已默认"基线对比 stays a release-evidence tool"，计划文本与门禁现实分叉，两个口径必须动一个。

### d) 声明失实：3 处

- [medium] `www/app/routes/index/index.tsx:166` 首页高亮 "Nitro server output with ISR manifests baked in"，与 VERSION_PLAN.md:43-51 "no ISR caching is wired into the 0.42 request-time server entry … Do not rely on ISR in production on 0.42" 误导落差。
- [medium] `docs/current/PACKAGE_SURFACE.md:128-129` 平铺 `renderIntent.revalidate` 语义而无 "0.42 未接线" 限定；`packages/create/templates/app/routes/freshness.tsx:19,31-34` starter 默认生成 `revalidate: 300` 的 "Freshness proof" 页——陌生人 create 出来的第一个应用自带看似能 revalidate 的页面。
- [low] `README.md:63-65` 把已随 0.42 alpha 发布的 request-time data/forms 与未发货的 session/cache 并列称 "future product work"（与 STATUS.md:66-77 准确口径分叉）。
- 未发现 "production runtime" 类话术残留。

## 统计

- 发现总数：**112**（high 2 / medium 35 / low 75）。
- 按分区：element 10、app 8、adapter-vite 16、ui+create 13、tools 17、docs 7、www 14、根目录+examples+.github 20、定位专项 6（其中 adapter-vite 的 start CLI 畸形 URL 条目计入 adapter-vite 分区，总数含跨区归集）。
- 抽查无问题的区域（下轮可缩小范围）：
  - element：binding-activation 14 类 descriptor 对称完整；render-dsd 错误分类/hook 防护完整；event-marker 与 event-hydration 遍历顺序一致；security.ts 已单一复用；client-runtime 防双 hydration 与 dispose 幂等；`deno task lint` 通过，无恒真/空断言。
  - app：#731/#763/#743 修复确认到位；client-router trie↔线性 oracle 与 5000 路由回归；data-context-store 深度上限/隔离有行为测试；deno.json 五个子路径均有真实消费者。
  - adapter-vite：#708/#709/#710/#732 合并落实无漂移；head-injection sanitize 未见新绕过；parity 测试为真实双端行为断言；**fixtures** 无死 fixture；无逐字节重复文件（全量 shasum 无碰撞）。
  - ui+create：create CLI 校验与版本锚点双门禁到位；open-props-tokens 双向同步有 --check 门禁；#797/#792 处置确认；零 TODO/FIXME。
  - tools：autoflow GATES 与 deno.json tasks 交叉验证全部接线；check-critical-path-tests/check-version-anchors/check-action-pins/check-static-output-freeze/nitro-proof/published-consumer-qualification 均为真实门禁无假断言。
  - docs：PACKAGE_SURFACE subpath 清单与五包 exports 一致且有门禁；integrations 配方引用 API 均存在；ADR 撞号已显式记录；v0.42.0-alpha.8 npm 发布失败如实记录（正面范例）。
  - www：14 个 guide 路由共享骨架且内容契约有测试；240 个视觉基线与 qa-checklist 口径一致；32 个路由 meta 口径统一；site-ui 12 组件全部注册（#758/#784 确认）。
  - 根/examples/CI：根 deno.json 无死任务；六个 workflow action 全部钉 SHA；根 README 双语版本口径与五包完全对齐；#777/#775/#786/#760 修复确认；工作树干净。
  - 专项：action 协议 codegen、morph/enhance 客户端与 MORPH_CONTRACT 一致；范围侵蚀干净；历史存量 🔴-4（app request 层）已修复（nitro-mount type-only 锚定 + 形状契约测试）。

## 与上轮的关系

- **本轮新发现**：全部 111 条中，除下列 2 条外均为本轮首次报告。最优先：spa.ts action 路径 redirected 丢失（high，页面数据丢失）、CSRF 无行为测试（high，TP-5.7 准出未兑现）、ISR 声明失实×3（定位承诺）、verify-package-configs 恒真假门禁、check-package-graph 死检查段、www icons 23 个死 SVG、ui 死 token 调色板、三份 current-truth 文档半更新、docs/release 历史证据链断裂、fresh 示例版本锚点漂移（#800 后再漂移）、adapter-vite start CLI 畸形 URL 未设防。
- **历史存量未修（本轮确认仍在，附新证据）**：
  - #623 logger tag 记债：新点位 build-client.ts:35 / build-manifest.ts:24（Phase 2 与清单沿用 ssg tag，头注调用方已漂移）。
  - #785 修复残留：www/e2e/helpers.ts:60 的 expect re-export 仍无引用（4be858c8 删了其余但留下这一个）。
  - props 过滤×2、i18n 三跳 re-export、element 内部 barrel、request context 双份契约、#723 SignalEngine、as any 双门禁、third-party-wc-smoke TS18046、current 四文档无门禁：按约定未重报，本轮未见恶化。
- **上轮已修（本轮复核确认）**：#731/#743/#760/#761/#763/#769/#770/#771/#775/#777/#781/#784/#785（除上述残留）/#786/#789/#790/#791/#792/#797/#800/#802（导航路径；action 路径为本轮新发现的修复遗漏）/#804/#805（部分，mojibake 仍有私拷贝）/#809；round5 报告中的 #753/#754/#755 三个 tools/CI issue 现已关闭，复核确认修复到位（autoflow-ci.yml:46-48 注释与 policy.ts 一致）。

---

## 引用时效复核（自动生成）

> 本附录由 `tools/check-audit-citations.ts` 生成。基线：当前工作树。
> 引用总数：253；漂移：51。

### 漂移 / 无法核验的引用

- `packages/element/src/internal/core/context.ts:29-49` — file not found (moved, deleted, or abbreviated path unresolved)
- `routes/index.tsx:9` — ambiguous path (6 candidates: packages/adapter-vite/**fixtures**/request-time/app/routes/index.tsx, packages/adapter-vite/**fixtures**/static-only/app/routes/index.tsx, packages/create/templates/app/routes/index.tsx, examples/open-element-in-fresh/routes/index.tsx, examples/deno-desktop-reader/routes/index.tsx, examples/deno-desktop-mastodon/routes/index.tsx)
- `isr.ts:1-2` — ambiguous path (2 candidates: packages/element/src/internal/core/isr.ts, packages/element/src/internal/protocol/isr.ts)
- `entry-renderer.ts:1` — file not found (moved, deleted, or abbreviated path unresolved)
- `comparison.tsx:2` — ambiguous path (2 candidates: www/app/routes/guide/comparison.tsx, www/app/routes/architecture/comparison.tsx)
- `html-escape.ts:184` — line out of range (file now has 183 lines)
- `client-router.ts:394` — ambiguous path (2 candidates: packages/app/src/internal/router/client-router.ts, examples/lib/client-router.ts)
- `open-page-rail.tsx:125` — ambiguous path (2 candidates: www/app/islands/open-page-rail.tsx, www/app/site-ui/open-page-rail.tsx)
- `src/index.ts:43-45` — ambiguous path (4 candidates: packages/ui/src/index.ts, packages/app/src/index.ts, packages/adapter-vite/src/index.ts, packages/element/src/index.ts)
- `plugin.ts:122-124` — ambiguous path (6 candidates: packages/adapter-vite/src/npm-specifier-plugin.ts, packages/adapter-vite/src/plugin.ts, packages/adapter-vite/src/internal/content/sitemap/plugin.ts, packages/adapter-vite/src/internal/content/blog/plugin.ts, packages/adapter-vite/src/internal/content/nav/plugin.ts, packages/adapter-vite/src/i18n-plugin.ts)
- `routes/settings.tsx:267` — ambiguous path (2 candidates: examples/deno-desktop-reader/routes/settings.tsx, examples/deno-desktop-mastodon/routes/settings.tsx)
- `main.ts:82` — ambiguous path (3 candidates: examples/open-element-in-fresh/main.ts, examples/deno-desktop-reader/main.ts, examples/deno-desktop-mastodon/main.ts)
- `tools/check-text-integrity.ts:33-39` — file not found (moved, deleted, or abbreviated path unresolved)
- `tools/check-package-graph.ts:260-305` — line out of range (file now has 279 lines)
- `check-www-current-truth.ts:122` — file not found (moved, deleted, or abbreviated path unresolved)
- `check-www-current-truth.ts:44` — file not found (moved, deleted, or abbreviated path unresolved)
- `verify-npm-release.ts:35` — file not found (moved, deleted, or abbreviated path unresolved)
- `www/design/handoff/migration-guide.md:11-13` — file not found (moved, deleted, or abbreviated path unresolved)
- `packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts:132-454` — file not found (moved, deleted, or abbreviated path unresolved)
- `vite.config.ts:51` — ambiguous path (7 candidates: packages/adapter-vite/**fixtures**/request-time/vite.config.ts, packages/adapter-vite/**fixtures**/static-only/vite.config.ts, packages/create/templates/vite.config.ts, www/vite.config.ts, examples/open-element-in-fresh/vite.config.ts, examples/deno-desktop-reader/vite.config.ts, examples/deno-desktop-mastodon/vite.config.ts)
- `tools/check-www-current-truth.ts:135` — file not found (moved, deleted, or abbreviated path unresolved)
- `packages/adapter-vite/src/internal/content/core.ts:1-29` — file not found (moved, deleted, or abbreviated path unresolved)
- `src/index.ts:101` — ambiguous path (4 candidates: packages/ui/src/index.ts, packages/app/src/index.ts, packages/adapter-vite/src/index.ts, packages/element/src/index.ts)
- `www/app/components/page-styles.ts:366-367` — line out of range (file now has 364 lines)
- `plugin.ts:49` — ambiguous path (6 candidates: packages/adapter-vite/src/npm-specifier-plugin.ts, packages/adapter-vite/src/plugin.ts, packages/adapter-vite/src/internal/content/sitemap/plugin.ts, packages/adapter-vite/src/internal/content/blog/plugin.ts, packages/adapter-vite/src/internal/content/nav/plugin.ts, packages/adapter-vite/src/i18n-plugin.ts)
- `entry-render-helpers.ts:43-45` — file not found (moved, deleted, or abbreviated path unresolved)
- `island-manifest.ts:173` — line out of range (file now has 172 lines)
- `ssg-render.ts:314-317` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
- `island.ts:66` — ambiguous path (2 candidates: packages/element/src/internal/core/island.ts, packages/element/src/internal/protocol/island.ts)
- `examples/deno-desktop-mastodon/router.ts:1-32` — line out of range (file now has 9 lines)
- `deno-desktop-reader/router.ts:1-34` — line out of range (file now has 9 lines)
- `mastodon.tsx:50-122` — line out of range (file now has 74 lines)
- `reader.tsx:1146-1227` — line out of range (file now has 1214 lines)
- `tools/check-www-current-truth.ts:47` — file not found (moved, deleted, or abbreviated path unresolved)
- `packages/element/src/internal/core/isr-runtime.ts:45-164` — file not found (moved, deleted, or abbreviated path unresolved)
- `isr.ts:34-123` — ambiguous path (2 candidates: packages/element/src/internal/core/isr.ts, packages/element/src/internal/protocol/isr.ts)
- `src/index.ts:132` — ambiguous path (4 candidates: packages/ui/src/index.ts, packages/app/src/index.ts, packages/adapter-vite/src/index.ts, packages/element/src/index.ts)
- `isr.ts:4-12` — ambiguous path (2 candidates: packages/element/src/internal/core/isr.ts, packages/element/src/internal/protocol/isr.ts)
- `packages/element/src/internal/signal/index.ts:27-30` — line out of range (file now has 26 lines)
- `examples/deno-desktop-mastodon/router.ts:14` — line out of range (file now has 9 lines)
- `deno-desktop-reader/router.ts:15` — line out of range (file now has 9 lines)
- `www/e2e/helpers.ts:60` — line out of range (file now has 56 lines)
- `packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts:227-245` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:188-192` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:194-325` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:364-451` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:196-200` — file not found (moved, deleted, or abbreviated path unresolved)
- `ssg-render.ts:84-95` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
- `ssg-render.ts:218-233` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
- `isr-runtime.ts:62-68` — file not found (moved, deleted, or abbreviated path unresolved)
- `ssg-render.ts:177-179` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
