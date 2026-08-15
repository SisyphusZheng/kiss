# openElement 生产级独立评估报告

- **审查日期**:2026-07-28
- **审查对象**:main 分支，发布线 v0.42.0-alpha.6(0.41.0 已宣称 stable)
- **审查性质**:只读独立审查（未修改任何 git 跟踪文件，结束 `git status --porcelain` 为空）
- **方法**:10 路并行审查代理（8 维度只读审查 + 新用户旅程实测 + 门禁复现）+ 主审对最承重声称的亲自复核。下文标注 **〔主审实测〕** 的条目是主审在本机运行/逐行确认的证据；其余为代理证据，均带文件：行号。
- **证据纪律声明**：两轮前审（alpha.5/alpha.6 的 53 个 issue）仅作线索，不作证据；仓库文档中每条"已验证/stable/生产级"声称均按待复核处理。门禁复现与精确单测计数见文末补报。
- **归档复核**:2026-07-28 归档时在 dev 分支对 8 条承重声称做二次抽查（README:61-64 残句、`legacyDsdPolyfill` 幽灵 API、deno.json:88-89 firefox/webkit grep 子集、`injectClientScript` 无条件注入（postprocess.ts:198-204 + build-postprocess.ts:49 调用侧无 island 存在性守卫）、`__scanSubmitRoots` :180 无条件引用、`PageRenderingMode` 'static' 占位枚举（authoring.ts:25）、JSX `IntrinsicElements` 全放行（jsx-runtime.ts:20-22）、`serializeAttrs` 属性名零校验（render-ir.ts:109-148，boolean 分支 :127 属性名裸拼））——**全部仍然成立**。正文"147×3"口径表述已按文末补报修正。

---

## ① 定位判断

**一句话定义**:openElement 是一个以标准 Custom Elements 为唯一组件契约、默认输出 DSD（声明式 Shadow DOM)、static-first 的 Deno 系全栈框架——但今天的真实形态是**三样东西的联合体**：一个已 stable 的 WC 静态站生成器（0.41 线）、一个尚在 alpha 的请求时应用闭环（0.42 线：loader/action/morph)、一个只被两个桌面示例使用的 SPA 运行时（`defineApp`)，三者共用 `defineElement` 组件层。

**它不是什么**：不是通用全栈框架（README.md:61-64 自认 "not broad fullstack parity")；不是组件库（`@openelement/ui` 到 0.46 才决定是否 stable,ROADMAP.md:97)；不是有外部生产验证的产品（ADR-0119 记录 #390 试点三个发布周期**零招募**后被撤销）。

**目标用户**：按 ROADMAP.md:49-53，是"想让 Web Components 定义整个应用架构的团队"。

**不可替代性（正方）**——这个组合位确实空着，六份竞品调研互相印证（主审抽查 astro/enhance 两份，事实准确）:

- WC + DSD 默认 + static-first + 应用层闭环：Enhance 是 WC 全栈但 light-DOM 主义、无构建期 SSG、绑 Architect/AWS;Fresh 是 request-time-first 且 Preact 绑定；Astro 的组件契约不是 CE;Lit SSR 不管应用层。
- 内置 422/303 PRG 状态代数 + 无 JS 表单闭环：Astro 把 PRG 留作手写 recipe（与 Astro 官方文档一致）,openElement 做成内置是正当差异化——虽然语义本身搬运自 SvelteKit/React Router，无新颖性。
- Vite+Nitro 可移植输出：相比 Enhance 的 AWS 绑定是真优势（`ssg-helpers.ts:164-178` nitro-mount seam)。

**反方观点（更有分量）**:

- 这个"空位"的用户群**数量未证实存在**。#390 试点零招募是最直接的反证；GitHub 实测 2 stars（代理 curl GitHub API),npm 五包月下载 2851-3681 且均匀得反常，与 CI consumer smoke 每次装包的形态吻合——organic 采用信号≈0。
- 目标用户今天**有更好选择**：要 WC+SSR+表单闭环的生产应用，Enhance 有多年生产历史（session flash 错误闭环成熟）;openElement 的对应能力在 alpha.6，且其 morph 增强在 alpha.3/alpha.4 两个已发布 tag 上"从未真正工作过"(ADR-0121 自述）。要 WC+静态站，Lit/Stencil+Astro/11ty 生态大几个数量级。要 Deno 全栈，Fresh 2 是官方选项。
- "standard CE 跨层复用"(README.md:42-46）是理念差异而非能力差异：Enhance/Lit 用户今天就拥有同等的标准 CE 复用，openElement 只是把 DSD 设为默认。

**定位内在矛盾（证据）**:

- **三个枚举值、两种行为**:`PageRenderingMode = 'auto'|'static'|'dynamic'`(packages/app/src/authoring.ts:25)，但全仓对 `'auto'/'static'` 的唯一消费是 authoring.ts:285-291 的合法性校验——`'static'` 是纯占位符，只有 `'dynamic'` 有行为（ssg-render.ts:84-98)。冗余 API 面，白送认知负担。
- **defineApp 是 SPA 孤岛**:`SpaAppOptions.mode:'spa'` 字面量（spa.ts:26)，仓内仅两个桌面例子使用；然而 ADR-0119:30-33 声称冻结 "the static and SPA semantics of defineApp"——**defineApp 不存在 static 语义**，冻结 ADR 的措辞与其冻结的 API 对不上（文档失信，轻度）。
- **"continuity" 承诺在数据层不成立**:SPA loader 只收 `{params}`(spa.ts:62)，请求时 loader 收 `{request,params,env,platform}`(protocol/data.ts:30-35)，代码注释自认 "intentionally parallel; not interchangeable (#570)"。同一页面无法在 SPA 与服务端模式间复用 loader——continuity 只覆盖渲染层。
- **"零 JS 默认"被产物证伪〔主审实测〕**:`www/dist` 全站 **144/144** 个 HTML（含 404.html 和纯静态指南页）都被无条件注入 `<script src="/client/islands/client.js">`(5,296 字节，postprocess.ts:198-204 无 island 存在性检查）。而 benchmark 页写着 "ships zero runtime JS"(benchmark.tsx:84-85)。仓内博客 2026-04-30 自己承认过"不是零 JS，是零框架 JS"，营销页至今没改。Fresh 的 "zero JS by default" 字面成立，openElement 做不到同级承诺。**文档失信**。

**定位结论**：叙事方向（static-first 应用框架 + WC 契约）自洽且有空位证据；但今天它更像"一个优秀的 WC 静态站生成器，背上了一条 alpha 级应用闭环和一套超体量治理工程"。它的不可替代性只对"已决定全应用 WC+DSD、要 static-first、且接受 alpha 请求时语义"的极窄交集用户成立。

---

## ② 生产级就绪度记分卡

| 维度     | 评分 | 一句话理由                                                                                                            |
| -------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| 组件模型 | ★★★  | DSD SSR 主链路真实扎实，但 signals 不完备、JSX 类型全放行、visible 策略零浏览器覆盖                                   |
| 应用闭环 | ★★☆  | 协议骨架是最硬的部件，但 session/flash/幂等/i18n/动态 meta 全缺，morph 层有实证活 bug                                 |
| 构建部署 | ★★☆  | 三阶段构建+parity 测试高于平均，但静态页失败构建仍绿、无 sourcemap、部署文档≈0、产物开箱不可运行                      |
| DX       | ★★   | 作者侧错误消息教科书级，但指南 13/14 页零代码、旅程 9 个卡点（4 个高严重度必踩）、类型三处断链                        |
| 工程质量 | ★★★☆ | 断言质量 10/10 行为断言、硬层门禁可信、35 门禁+973 单测复现已验证；但快照弱（#592 自认）、证据自证、"147×3"口径有歧义 |
| 安全     | ★★★  | 转义链/脱敏/供应链实测扎实；CSRF 零内置（已记录的设计决策）+ 属性名注入 XSS 原语（实测）                              |
| 生态采用 | ★☆   | 10 组件、零迁移指南、JSX 编辑器零支持、社区≈0、npm latest 指 alpha                                                    |

**组件模型 ★★★**

- 扎实面：DSD 嵌套 SSR（旅程实测首页 3 层 shadowrootmode)、event-marker SSR/水合对齐契约测试、delegatesFocus 有 e2e、SSR admission 白名单校验有真实覆盖（module-specifier.test.ts)。
- 扣分面：signals 只有 signal/computed/effect 三件套，底层 `@preact/signals-core` 的 **batch/untracked/peek 均未透出**(framework.ts:18-26 对比 signals-core.d.ts:24,32);`subscribe` 用 Preact effect 实现导致**订阅即同步触发一次**(preact-engine.ts:27-44)，语义反直觉且注释未提；声称的 "shared SignalEngine conformance suite" 全仓不存在（文档失信）。JSX `IntrinsicElements: [elemName: string]: Record<string, unknown>`(jsx-runtime.ts:20-22)——标签拼错、属性乱写全部通过类型检查。packages/element 单测跑在**手搓迷你假 DOM** 上（open-element.test.ts:16-19 自述），真实浏览器覆盖全靠下游两层 e2e。`client:visible` 策略在 www 与 fixture **零使用零浏览器测试**(MORPH_CONTRACT.md:106-109 自认），而它是机制最复杂的一条。`island.ts` 与 `entry-generators.ts` 存在双套策略调度且已漂移（island.ts:153 的 querySelectorAll 找不到 shadow 内元素，靠 30s 超时兜底）。

**应用闭环 ★★☆**

- 扎实面（协议层是全线最硬）：双通道（fetch/HTML）对称、命名 action `?/name` + own-key 防原型污染、返回 Response=500 契约违规、405 兜底、redirect 状态码白名单、POST 强制 303 PRG(entry-render-helpers.ts:206-460);Vary、body-parse 400 均到位。fixture 三引擎 594 行 Playwright 覆盖是全仓最扎实的测试。
- 缺件（每个均核实）:**session/auth 无基元**(packages/ 全 grep 零命中，0.44 排期）;flash/跨页状态没有（官方模板用 URL query 明文传态，contact.tsx:27);**幂等/防重没有**(no-JS 双击=两次真实 POST，无计划）;i18n 半成品且 0.43-0.46 无计划；**数据驱动 SEO meta 不可声明**(head 是静态对象，authoring.ts:153-158);loader 无响应通道（Cache-Control 强制 no-store 且无法设 ETag);error boundary 拿不到 loader data；请求时 404 是裸文本页不带应用布局；ISR manifest **仓库内无消费方**；死代码 `/_data` 端点 params 写死 `{}`。
- morph 连续性（0.42 的核心故事）有**实证活 bug 群**，见 ④。

**构建部署 ★★☆**

- 扎实面：三阶段产物形态清晰（静态 HTML + client islands + 请求时 server)；单 entry descriptor 喂 dev/build 双端，parity 测试同时 boot dev server 与构建产物做 10 步双端对比（request-time-parity.test.ts:113-246)，设计高于平均；nitro-proof node 侧真起进程断言 12 类路由语义；构建快（模板站 1.7s〔主审旅程实测〕)。
- 硬伤：**静态页渲染失败 → 构建退出码仍 0**(hono/ssg defaultPlugin 丢弃非 200,ssg-render.ts:146-149，只 log.warn;唯一的 static-output-freeze 门禁**未接入任何 CI workflow**);**sourcemap 全面缺失**（全包 grep 零命中，且 configFile:false 使用户配置无效）;workers 证明是 import+mock 的**形状级**而非真实 runtime（没上 workerd/miniflare);**Nitro 构建不是官方路径**——包内没有 nitro task，靠用户自己跑 `npm:nitro build`，集成停留 fixture 级；`matchRequestTimeRoute` 宿主契约**零 markdown 文档**；运行时零可观测（无日志/healthz/tracing)；无增量构建。
- 旅程实测补刀〔主审实测〕：生成的 server 产物**开箱不可运行**——无 start task、无 serve CLI、`dist/server/index.js` 无 listener、生成的 import map 缺 `nitro-mount` 子路径；`deno task preview` 下动态路由 GET 静默回退首页、POST 404 无任何提示。

**DX ★★**

- 扎实面：作者侧校验错误消息是教科书级（合法值枚举+实际值回显+ADR 引用，authoring.ts:258-290;island.ts:267-290);CHANGELOG 逐条标 breaking 且有机器门禁（package-surface:check);0.41.0 迁移指南质量好；CSRF 配方是"文档即代码"的正确示范。
- 硬伤：**14 个指南页中 13 页代码块为零**(grep -c '```' 全 0)，全是同一套卡片模板且卡片类型没有 href 字段（正文无法放链接）;Getting Started 页**没有安装命令**;Deployment/Testing 页写的是团队内部 SOP 而非用户指引；线性导航链断裂（Security 页成孤岛）。类型三处断链：loader→render 的 Data 零推导（官方模板靠 `as ContactActionData` 强转）、JSX 全放行、运行时注入的 `ctx.route` 不在 `LoaderContext` 类型里（指南还声称有，routing-and-data.tsx:66 vs data.ts:30-35——三方不一致）。SPA 链错误只进 console，页面静默停在旧状态。
- 旅程实测〔主审实测〕:9 个卡点，4 个高严重度必踩——npm create 解析版本与 README 发布线脱节（见下）、server 产物跑不起来、preview 误导、预置 blog 配置点导航即 404；新增路由 dev 不热发现须重启（文档未提）。

**工程质量 ★★★☆**

- 扎实面：抽查 10 个关键路径测试文件，**10/10 全是行为断言**（无存在性/快照断言），另有 assertion-style.test.ts 专防 `assertExists(布尔)` 永真反模式；client-router.test.ts 的编译匹配器与线性匹配器**等价性对拍**、ssg-render.test.ts 路径穿越拒绝、entry-render-ssg.test.ts 把生成代码放 `data:` module 真实执行——质量高于预期。硬层门禁可信：package-surface 双向锚定、npm registry 外部验证（verify-npm-release.ts 真跑 `npm view`)、CI 全量执行无逃逸阀、tag 不可变性校验、critical-path 真执行（CI 下 infra 缺失即失败）。Actions 全 SHA 钉死。
- 口径与缺口：**"147×3 引擎"口径有歧义〔已按补报修正〕**:147 是 fixture 套件三引擎**合计**（49×3，`fixture:request-time:gate` 实测 28 秒全过，三引擎真跑）——数字真实，但 "×3" 表述易被读成每引擎 147。www 主站套件每引擎 159 用例，CI 上 chromium 全量、firefox/webkit 只跑 26 用例 grep 子集（deno.json:88-89)——此事实 autoflow-ci.yml 注释与 BROWSER_BASELINE.md:12-14 均如实披露，无隐瞒，但"三引擎验证"对 www 站只能算有限成立。interface snapshot 只是 barrel 文件 sha256+行首 export regex，签名级改动照过（#592 自述 OPEN、deferred TP-6)——**0.41 "冻结"目前只有 subpath 面被机器守卫，API 形状面靠自觉**。证据 JSON 是 autoflow 自己写自己校；`successfulReleaseRun` 只查 release note 含 URL 字符串不调 API;critical-path 的证据是测试**标题**字符串，掏空断言保留同名照样过；覆盖率是聚合阈值无单文件地板；第三方 WC smoke **不在 CI**（手动 workflow_dispatch、单浏览器、钉版本）。**正向"已验证"声称无门禁**——防同型复发≈已根治，防新型失信仍靠自觉。
- 复现闭环（见文末补报）:35 门禁真实执行（34/35 PASS，唯一 FAIL 为本地缺 tag 的环境性原因）、973 单测全绿、fixture 三引擎 28 秒全过——这套门禁体系不是表演。

**安全 ★★★**

- 扎实面〔主审复核了转义链关键路径〕：文本/属性值/data-ssr-props 内嵌 JSON 转义正确（`</script>` 注入被中和，代理 deno eval 实测）;action 分发 own-key 门控；生产 500 三通道全脱敏（裸文案，stack 仅 dev);bodyLimit 10MB 语义正确（有 Content-Length 直接 413 不读 body，无内存放大）;CORS 默认仅反射 localhost 且拒绝 `*`+credentials;DANGEROUS_KEYS 12 键过滤；deno.lock v5 全量 386 条 integrity；发布物白名单+provenance。
- 攻击者视角 TOP-3:
  1. **Action 端点零内置 CSRF 防线**（框架设计问题，ADR-0121 §12 已记录的接受风险）：生成 POST 处理器无 Origin/Sec-Fetch-Site/token 检查（entry-render-helpers.ts:156-302)，纯 cookie 会话靠浏览器 SameSite=Lax 兜底；SameSite=None、Basic/mTLS、非浏览器客户端场景裸奔。只有文档配方（security.tsx:141-168,fail-closed 写法正确）。修复成本低-中（生成码默认挂 same-origin 检查，50-100 行，0.44 已排）。
  2. **SSR 属性名注入（实测 XSS 原语，实现缺陷）**:`serializeAttrs` 不校验属性名（render-ir.ts:119-144)，恶意 key `"x\" onclick=\"alert(1)\" data-x"` 经 spread props 输出完整事件处理器（代理 deno eval 复现）。React SSR 有 `isAttributeNameSafe`,openElement 没有。修复 <20 行（白名单正则+跳过告警）。
  3. **`renderSsrError` 生产模式仍输出 error.message**(html-escape.ts:190-207，框架内部未调用但属导出 API 的脚雷）+ `/_data` 路由表无 own-key 检查（entry-render-helpers.ts:484，与 ADR-0121 纪律不一致）。修复各 <10 行。

**生态采用 ★☆**

- 硬门槛（按阻塞度）:session/auth 无基元 > **npm `latest` 全部指向 alpha.6〔主审实测：五包 dist-tags 均为 `latest: 0.42.0-alpha.6`,stable 0.41.x 无 tag 保护——`npm install @openelement/element` 默认踩 alpha，与"0.41 已 stable"叙事直接冲突；旅程代理更早还观察到 create 解析到 0.41.2，说明 dist-tag 在漂移，发布纪律本身不稳定〕** > JSX 编辑器零支持 > 迁移指南整体缺席（grep from next/remix/astro/sveltekit 零命中）> 调试=裸 Vite（无错误覆盖页/devtools/sourcemap 承诺）。
- packages/ui 仅 10 个组件（2366 行），无 select/checkbox/radio/switch/toast/tooltip/table/表单布局，a11y 薄（无焦点陷阱/键盘导航体系）;ui 不依赖 shoelace/material（纯自研）,**第三方 WC 无桥接层**——shoelace 只在手工 smoke fixture 里客户端渲染（SSR 校验只查裸标签存在，升级前是无样式空壳）。examples 可跑（reader `deno task smoke` 44 passed，代理实测）但走 workspace 相对路径，不验证真实消费路径；mastodon 关键项 "verified by hand"。JSR 是僵尸（latest=0.40.6，落后 npm 两个月，无指向标记）。包目录残留旧 tarball(openelement-ui-0.42.0-alpha.5.tgz)。

---

## ③ 竞品逐项对比

（对比基于仓库六份调研——主审抽查 astro/enhance 两份联网复核准确——及公开事实；SvelteKit 为自选主流参照）

| 维度             | openElement (0.42a)                                               | Fresh 2 (Deno)              | Enhance                                     | Astro                         | SvelteKit                    |
| ---------------- | ----------------------------------------------------------------- | --------------------------- | ------------------------------------------- | ----------------------------- | ---------------------------- |
| 组件契约         | 标准 CE + DSD（唯一贯穿应用层）                                   | Preact                      | 标准 CE(light DOM 主义）                    | .astro + 任意框架岛           | Svelte                       |
| 默认渲染         | static-first，逐页 auto/static/dynamic                            | request-time-first + 静态岛 | SSR-first MPA                               | static-first（逐页 prerender) | 逐页 SSR/SSG/CSR             |
| "零 JS"声称      | **不成立**：每页强制 5.3KB〔主审实测 144/144〕                    | 成立（无岛即 0)             | 基本成立（无 JS 基线）                      | 成立（无岛即 0)               | 不作此声称                   |
| 表单/action 闭环 | 内置 422/303 PRG，双通道对称，alpha                               | actions 有，成熟度中        | session flash 闭环，多年生产                | actions 稳定，PRG 手写 recipe | form actions，业界标杆       |
| session/auth     | **无基元**(0.44)                                                  | 中间件生态                  | 内置 session                                | 有 sessions 能力              | hooks+成熟生态（auth.js 等） |
| 客户端连续性     | 自研 morph（实证 bug 群）                                         | 部分岛+整页                 | 无（MPA 哲学）                              | View Transitions              | 客户端路由，生产验证         |
| 部署             | 静态一次点亮；Node/Workers 配方级（Nitro 非官方路径，零部署文档） | Deno Deploy 一等            | Architect/AWS 绑定                          | 全宿主 adapter 生态           | adapter 生态最完整           |
| 组件生态         | 10 件自研，无第三方桥接                                           | Preact 生态可用             | 任意 WC 直接复用                            | 全框架组件生态                | Svelte 生态+任意 lib         |
| 生产验证         | 零外部采用（#390 零招募）                                         | 官方+真实用户               | 多年生产历史（团队已并入 Sanity，活力下降） | 大规模生产                    | 大规模生产                   |
| 文档/上手        | 指南 13/14 页零代码，旅程 9 卡点                                  | 官方文档完整                | 文档成熟                                    | 文档生态最佳之一              | 文档完整                     |

一句话：openElement 真正赢 Fresh 的点只有"DSD 默认+static-first";赢 Enhance 的点是"不绑 AWS+构建期 SSG+现代工具链";赢 Astro 的点是"标准 CE 契约+内置 PRG 闭环"。而这三个"赢点"今天分别被 alpha 成熟度、零生态、零部署文档抵消。

---

## ④ 阻塞性缺口清单

**高（选型否决级）**

1. **session/auth/CSRF 基元缺失**——packages/ 全 grep 零命中；`docs/integrations/better-auth.md` 自标 "doc-level, not CI-verified"。任何登录态应用须全自建（100-200 行+存储依赖）。〔路线图：0.44；成本：框架级 2-4 周〕类型：生态缺口/框架设计问题
2. **npm latest 指向 alpha 且 dist-tag 漂移**——〔主审实测〕五包 latest=alpha.6,stable 无线保护；旅程中 create 一度解析到 0.41.2。每个新用户第一脚踩错版本。〔路线图：无；成本：小时级 dist-tag 操作+发布纪律〕类型：实现缺陷（发布）
3. **morph 增强层实证 bug 群**(0.42 核心故事，VERSION_PLAN 自评 "least proven"):
   - `__scanSubmitRoots` ReferenceError〔主审 deno eval 复现〕：有岛屿无 enhance 表单的站点每次水合后 timer 抛未捕获异常，#584 rescan 静默失效（entry-generators.ts:180 vs 537 条件分支）;
   - `form.action` IDL 陷阱〔主审逐行确认 :588-589〕：表单含 `<input name="action">`（极常见）时 fetch 目标变成 `"[object HTMLInputElement]"`，同步抛 TypeError 逃出 .catch，表单**永久卡死**;
   - 跨表单 last-wins 静默丢响应〔主审确认 :610〕:A 表单 action 已在服务端成功，响应被整体丢弃，UI 永久过期零反馈；
   - 焦点/滚动/表单控件 property 连续性完全无处理（全文无 activeElement;`__syncAttrs` 不碰 checked/value property，用户摸过的 checkbox 从此拒收服务端状态）;a11y 上每次 morph 丢焦点无 aria-live;
   - 嵌套 DSD 非递归实例化（:371-388)，岛中岛 morph 后留下惰性 template;
   - `open:ready` 对 load/only 策略从不派发（:194-208)。
     〔路线图：无明确条目；成本：单点修复均 <100 行，系统性成熟（焦点/滚动/并发语义+三引擎多表单 fixture)2-4 周〕类型：实现缺陷+测试缺口
4. **server 产物开箱不可运行 + preview 误导**〔主审旅程实测〕：无 start task/serve CLI、import map 缺 nitro-mount 子路径、preview 下动态路由静默 fallback。动态路线用户必踩且零文档。〔路线图：无；成本：1-3 天〕类型：实现缺陷+文档失信
5. **静态页渲染失败 → 构建退出码仍 0**(ssg-render.ts:146-149 机制确认；唯一兜底门禁未入 CI)。线上静默缺页，是"生产级"的直接反例。〔路线图：无；成本：1-2 天，把 static-output-freeze 接 CI+构建失败语义统一〕类型：实现缺陷+测试缺口

**中（绕行成本高）**

6. 数据驱动 SEO meta 不可声明（head 静态对象，authoring.ts:153-158)——内容站的 og:title/canonical 无法从 loader 来。〔无计划；~1 周〕框架设计问题
7. loader 无响应通道：动态路由强制 no-store,ETag/max-age 只能 Hono 中间件绕行（data.ts:30-35;entry-render-helpers.ts:168)。〔0.44 cache 排期〕框架设计问题
8. 幂等/防重：no-JS 双击=两次真实 POST，无 idempotency key 机制。〔无计划；依赖 session〕框架设计问题
9. i18n 半成品（URL 前缀+locale 静态路径，词典/t() 全自建）,**0.43-0.46 均无条目**。定位风险
10. 类型断链 ×3:loader Data 零推导、JSX 全 unknown、ctx.route 运行时注入但类型无声明（指南还写错）。〔无计划；1-2 周〕实现缺陷
11. sourcemap 全面缺失+configFile:false 封堵用户配置。〔无计划；1-2 天〕实现缺陷
12. 部署文档/matchRequestTimeRoute 宿主契约零文档；Nitro 集成停留 fixture 级。〔无计划；数天〕文档失信/生态缺口
13. 文件上传：bodyLimit 10MB 硬编码不可配，超限 413 在 enhance 路径**静默重载丢表单**无错误提示（entry-generators.ts:620,646)。〔无计划；1-2 天〕实现缺陷
14. 表单回填/字段级错误约定全手写（ADR-0120 rule 3 的 "echoing values" 只兑现 fail data)。〔无计划；~1 周〕框架设计问题

**低（有损信任但不阻塞）**

15. `'auto'/'static'` 冗余枚举（三值两行为）。〔无计划；小时级，0.43 deprecate〕框架设计问题
16. 文档失信集合：README.md:61-64 重复残句〔主审实测〕;README 把 alpha.6 与 stable 写进同一句；`legacyDsdPolyfill`/`injectDsdPolyfill` 幽灵 API〔主审实测：仅文档引用，src 零命中——基线外浏览器实际无支持路径〕;comparison 页 Fresh "zero build step" 过时（与自家调研 fresh.md 矛盾）;CHANGELOG 三处用错 API 名（`rendering:` vs 实际 `renderIntent:`);create README 称生成 www/ 目录（实际无）;packages/ui 残留旧 tarball。〔成本：小时级〕文档失信
17. "147×3"口径歧义（fixture 三引擎合计 147 真跑；www 站 firefox/webkit 仅 26 用例子集，已有文档披露——详见补报修正）;interface snapshot 强度不足（#592/#593 OPEN)。〔TP-6〕测试缺口
18. 模板细节：blog 预置配置 404、check task 硬编码 4 文件、新增路由不热发现。〔成本：1-2 天〕实现缺陷+文档缺口

---

## ⑤ 三类用户采用建议

**内容站团队（博客/文档/营销）——今天可以用，但要钉版本、闭眼蹚坑。**
静态子集走 0.41 stable 线，是全线最成熟的部分：DSD 首屏即内容对 SEO/爬虫/打印天然友好（shadowrootmode 内容就在初始 HTML)；旅程实测 build 1.7s、产物 368KB、纯静态宿主零配置一次点亮。**前提**:`npm install` 显式钉 `@openelement/*@0.41.x`（绝不能装 latest);接受指南靠不住、要靠读模板源码；接受每页强制 5.3KB 客户端 JS("零 JS"是话术）；接受无增量构建（大站构建线性增长）、dev 加路由要重启。**诚实的反问**：除非"标准 WC 组件契约"是你的硬约束，Astro 今天在生态、内容集合、文档、增量构建上几乎全面更优——选 openElement 的理由是赌 WC 架构的长期复利，不是当下的生产力。

**轻表单应用团队（订阅/联系单/简单 CRUD)——谨慎可用，仅限能自建底座的团队。**
协议骨架实测正确且双通道诚实（旅程实测：422 回显、303 PRG、跟随重定向渲染，no-JS 全闭环）——这是相对 Astro 的真差异化。但：morph 增强层有实证活 bug（含可让表单永久卡死的 form.action 陷阱）;session/CSRF/幂等要自建；server 产物要自己接线才能跑。**建议**：今天用就 no-JS 优先、把 enhance 当渐进增强而非依赖，CSRF 从 security 指南抄配方挂 `_middleware`;否则等 0.42 stable + 0.44 再评估。

**业务后台团队——今天不能用。**
无 auth/session/权限、无表格/表单组件体系（ui 仅 10 件，无 select/checkbox/table)、JSX 无类型提示、调试裸 Vite、无 i18n 计划——每一项都是后台刚需，且大多不在 0.43-0.46 路线图。选 SvelteKit/Remix/Next;openElement 对这个人群的最早合理评估窗口是 0.44 之后。

---

## ⑥ TOP-5 结构性风险（设计赌注，非 bug)

1. **"WC 全应用架构"的用户群真实存在且足够大。** 全部定位押在"有团队愿意让标准 CE 定义整个应用架构"。反证已出现：#390 试点零招募、2 stars、npm 下载疑似 CI 贡献。**赌注成立的证据**：重启试点能招募到 ≥3 个外部团队做出真实项目并存活 3 个月；organic 下载与 CI 下载可区分且持续增长。
2. **DSD-first 的代价能被框架机制封住。** shadow 事件边界（submit 刚炸过）、样式工程（每 shadow root 注 adoptedStyleSheets)、a11y(morph 丢焦点）、第三方 WC 的 SSR(Shoelace 首屏是无样式空壳）——赌注是这些墙能被封到用户不用操心；0.43 通用 WC SSR 是关键一战。**证据**：第三方 WC 在 DSD SSR 下首屏即有完整样式内容、以 ElementInternals 参与 enhance 表单的三引擎 e2e；一份完整的"DSD 代价清单"文档（现在 BROWSER_BASELINE 只承认了一半，样式穿透代价无文档）。
3. **自研 morph 增强层能收敛到 Turbo/idiomorph 级成熟度。** 这是个有十年积累的成熟问题域，openElement 选择自研 WC 版。现状：alpha.3/4 从未生效（ADR-0121 自述）、两轮审查 53 issue 后我仍实证 ≥5 个活 bug/脆弱点。**证据**：多表单并发+嵌套岛屿+键盘导航场景的三引擎 e2e 套件进 critical-path 门禁；增强层公开 bug 连续两个版本为零；与 idiomorph 的 DOM 语义对齐矩阵公开。
4. **static-first 与 fullstack loop 同一心智模型不撕裂。** 今天已有裂缝：loader 上下文双形态不可互换（#570 自认）、defineApp 是 SPA 孤岛、'static' 占位符枚举、ADR-0119 冻结了 defineApp 不存在的 "static 语义"。赌注：连续谱成立而非两个产品缝在一起。**证据**：同一页面文件不改一行代码在 static/dynamic 间切换的 e2e;SPA 与 server 链共享数据层类型与缓存语义；删掉冗余枚举而不引发用户混淆投诉。
5. **治理工程能在零社区时充当可信度代理。** 239 个内部 md/102 个 ADR/35 门禁 vs 15 页用户指南——体量倒挂，且部分机制是自证（证据 JSON 自写自校、"147×3"口径、"零 JS"话术与产物矛盾）。赌注：这套证据链能让选型者信服。风险：一旦外部发现声称与产物不符（我已经发现了），治理反而成为负资产——"连自己的门禁都管不住自己的 README"。**证据**：每条对外声称都可点击溯源到一个 CI 断言；外部用户/贡献者引用证据链作为采用理由；#592/#593 关闭。

---

## ⑦ 只做三件事（ROI 排序，与路线图措辞正交）

**1. 修"第一公里"到零卡点（约 1-2 周，决定每个新用户第一小时的留存）。**
四件事打包：发布纪律（latest 指回 stable 线、alpha 只在 alpha tag;create 模板与发布线机械对齐）；模板修 blog 死链/check 硬编码/新增路由热发现；给 server 产物一个 `deno task start`（生成 runner+补全 import map)，让 preview 对动态路由要么支持要么显式报错；把 Deployment 和 Getting Started 两页写成有命令、可照做的文档。ROI 最高的原因是：这是唯一一件"每个新用户 100% 经过"的事，而今天它 4 个高严重度必踩卡点（旅程实测）——其余所有能力建设都排在"用户能跑起来"之后才有意义。

**2. 把 morph 增强层当产品级子系统补质量（2-4 周，0.42 故事的心脏）。**
修 5 个实证 bug(ReferenceError、form.action 陷阱、last-wins 丢弃、open:ready 不一致、嵌套 DSD 递归）+ 补焦点/滚动/表单控件 property 连续性 + 定义多表单并发语义，然后建一个真实多表单 fixture 进三引擎 critical-path 门禁。morph 是"WC Application Loop"相对 Enhance 的唯一体验差异，也是当前最薄弱件——它不稳，0.42 整条发布线的故事就立不住；它稳了，轻表单用户那一档（⑤)立即从"谨慎"变"可以"。

**3. 把每条对外声称绑到机器证据，或改成精确措辞（约 1 周，防信任崩盘）。**
"先验证据引用"替代"事后禁词表":README/营销页的每条能力声称（零 JS、147×3、workers verified、frozen）要么挂一个 CI 断言，要么改写成与产物一致的精确表述（如 "no framework runtime on the critical path; a 5.3KB island client ships on every page");同时把 interface snapshot 升级成 type-level（关掉 #592)。对零社区项目，可信度是唯一资产——而当前证据（README 残句、幽灵 polyfill、Fresh 过时描述、144/144 强制 JS）说明治理体系管得住代码、没管住门面。这件事不做，前两件的成果会被第一条"声称与产物不符"的外部推文抵消。

---

## ⑧ 按"WC 全栈框架"目标的定向重读（归档时追加）

> 维护者已明确：项目目标是 **WC 全栈框架**，而非 SSG 静态站生成器——SSG/static-first 是路径和入口，全栈应用闭环才是产品本体。据此，本报告的若干结论需要换一个读法：① 中"更像 SSG 生成器"是当前成熟度快照，不是方向判定；下列重排不推翻任何事实发现，只改变优先级权重。

**目标对齐后的资产盘点**：全栈框架最难补、最容易烂的部分是协议层，而它恰好是本项目最硬的一环（见 ② 应用闭环）——资产与目标是对齐的。竞争窗口同样支持这个目标：WC 全栈空位上唯一在位者 Enhance 团队已并入 Sanity、活力下降（见 ③ 对比表），Fresh 绑 Preact，Astro 契约非 CE。错位的是路线图排序和营销话术，不是方向。

**优先级重排（相对 ⑦ 的调整）**：

1. **morph 从"第二件事"升为不可谈判的第一件**。SSG 可以没有 morph，全栈框架不行——它是 Application Loop 相对 Enhance MPA 哲学的唯一体验差异。④ 高档 #3 的 5 个实证 bug（尤其 `form.action` 永久卡死）修不掉，0.42 故事立不住。
2. **数据基元（session/CSRF/flash/幂等）应评估从 0.44 提前**。⑤ 把"轻表单应用团队"评为"谨慎可用"，卡的就是这四样；这一档用户是全栈叙事的滩头阵地。与 0.43 排期的通用 WC SSR 相比，数据基元更快让一个真实应用跑在框架上。
3. **server 产物开箱不可运行从"瑕疵"升级为"资格问题"**（④ 高档 #4）。自称全栈的框架，request-time 路径必须是一等公民体验：`deno task start`、部署文档、preview 动态路由要么支持要么显式报错。
4. **"零 JS"话术直接放弃而非修补**。那是 SSG 身份的卖点，与全栈目标不匹配；营销面改讲"标准 WC 从静态页到动态应用的连续谱"，同时自然消解最大的文档失信项（① 144/144 强制注入）。
5. **dogfood 必须换到想成为的那一半**。www 是内容站，验证的是 SSG 身份；数据基元落地后，需要一个 loader/action/session 全链路的带登录态真实应用作旗舰 dogfood——⑥ 风险 #1（用户群未证实）的第一块证据只能自己先给。

**不变的部分**：⑦ 第一件事（第一公里）和第三件事（声称绑证据）的优先级不受目标调整影响——发布纪律、可信度对两种身份都是前提。⑥ 的 TOP-5 结构性风险全部保持有效，且 #1（WC 全应用用户群存在性）对全栈目标的权重更高而非更低。

---

## 补报：门禁与测试数字复现结果（门禁复现代理完成后追加）

全部实跑完成，未修改任何 git 跟踪文件（结束 `git status --porcelain` 为空）。日志在 `/tmp/autoflow-ci.log` 等。

**1. `deno task autoflow:ci` 端到端复现：成立。** CI tier 恰好选中 35 个门禁（policy.ts 对 ci/release 恒全量，无视路径触发器），非 fail-fast、逐条汇总、失败 exit 1。实测 9 分 46 秒，**34/35 PASS**。唯一 FAIL 是 `release:evidence:check`——环境性原因：它要求本地存在 git tag `v0.42.0-alpha.6` 做 `git rev-parse`，本地 clone 只到 alpha.5（已用 `git tag -l` 证实）；审计记录的真实 CI run 中该门禁 PASS。无跳过、无子集替代（`OPEN_ELEMENT_E2E_OFFLINE` 在 ci tier 明确不生效）。

**2. 单测计数：声称 971，实测 973 passed / 0 failed(16s)。** 差异已定位：971 是 alpha.5 审计口径，alpha.6 的 parity 修复净增 2 个用例（`git diff --stat v0.42.0-alpha.5..HEAD` 证实）。口径为 test case。判定：**属实**（数字随版本漂移，当前应说 973)。

**3. "147×3 引擎"的真实口径——需要修正我报告正文的说法。** 实测结果：

- **147 的出处是 fixture 套件**:`live.spec.ts` 每引擎 49 用例，三引擎**合计 147**（不是每引擎 147)。`fixture:request-time:gate` 实测 28 秒、147/147 全过（chromium+firefox+webkit 各 49)。审计原文 "126×3" 同理是合计口径。判定：**数字真实、全部三引擎真跑**，但 "×3" 表述易被读成每引擎 147——按 "147×3=441" 理解则夸大 3 倍。
- **www 主站套件**：每引擎 `--list` 为 159 用例；CI 上 **chromium 全量 159 全过（6.7m),firefox/webkit 各跑 26 个 grep 子集全过**——且这一点 autoflow-ci.yml 注释与 BROWSER_BASELINE.md:12-14 均**如实披露**("full E2E suite on Chromium and the smoke subset on Firefox and WebKit")，无隐瞒。

**修正**：我正文 ②工程质量栏写的 "'147×3' 口径有水分" 应降级为"**口径歧义**"——fixture 三引擎是实打实全量跑的（49×3)，www 侧的子集事实也有文档级如实披露。真正站不住的声称仍然是另外两条：每页强制 5.3KB 客户端 JS 的"零 JS"话术（主审实测 144/144 页面），和幽灵 API `legacyDsdPolyfill`。

**4. 对记分卡的影响**:★★★☆ 维持不变，但依据更新——可复现性这一项从"待验证"变为"**已验证**"(35 门禁真实执行、973 单测全绿、fixture 三引擎 28 秒全过，这套门禁体系不是表演）；不升星的原因也维持原判：interface snapshot 弱（#592 OPEN)、证据 JSON 自证、critical-path 以测试标题为证据、第三方 WC smoke 不在 CI、www 站 Firefox/WebKit 只有 26 用例覆盖（"三引擎验证"对 www 站只能算有限成立）。

至此全部 10 路审查 + 主审复核 + 门禁复现均已闭环，报告中不再有待补项。

---

## 引用时效复核（自动生成）

> 本附录由 `tools/check-audit-citations.ts` 生成。基线：当前工作树。
> 引用总数：41；漂移：13。

### 漂移 / 无法核验的引用

- `postprocess.ts:198-204` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/build-postprocess.ts, packages/adapter-vite/src/internal/ssg/postprocess.ts)
- `jsx-runtime.ts:20-22` — ambiguous path (2 candidates: packages/element/src/internal/core/jsx-runtime.ts, packages/element/src/jsx-runtime.ts)
- `ssg-render.ts:84-98` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
- `framework.ts:18-26` — ambiguous path (3 candidates: packages/adapter-vite/src/internal/protocol/framework.ts, packages/element/src/internal/protocol/framework.ts, packages/element/src/internal/signal/framework.ts)
- `signals-core.d.ts:24` — file not found (moved, deleted, or abbreviated path unresolved)
- `island.ts:153` — ambiguous path (2 candidates: packages/element/src/internal/core/island.ts, packages/element/src/internal/protocol/island.ts)
- `entry-render-helpers.ts:206-460` — file not found (moved, deleted, or abbreviated path unresolved)
- `ssg-render.ts:146-149` — ambiguous path (2 candidates: packages/adapter-vite/src/internal/ssg/ssg-render.ts, packages/adapter-vite/src/cli/ssg-render.ts)
- `island.ts:267-290` — ambiguous path (2 candidates: packages/element/src/internal/core/island.ts, packages/element/src/internal/protocol/island.ts)
- `data.ts:30-35` — ambiguous path (5 candidates: packages/app/src/internal/page-host-data.ts, packages/adapter-vite/src/internal/content/blog/blog-data.ts, packages/element/src/internal/protocol/data.ts, www/app/data/_generated-blog-data.ts, www/app/data/_generated-i18n-data.ts)
- `entry-render-helpers.ts:156-302` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:484` — file not found (moved, deleted, or abbreviated path unresolved)
- `entry-render-helpers.ts:168` — file not found (moved, deleted, or abbreviated path unresolved)
