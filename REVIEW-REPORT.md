# openElement 全项目深度审查报告

> 审查日期：2026-07-14（Asia/Shanghai）
>
> 基线：`main` / `bebada50972517de70e612f6d1321c38d86d1a87`
>
> 项目版本：`0.41.0-alpha.10`
>
> 范围：五个发布包、`www`、`examples`、`tools`、测试、文档、CI/发布流程和依赖供应链
>
> 约束：本次只重写本报告；未修改源码、配置、锁文件或生成物

## 1. 执行摘要

openElement 当前不是“存在大量 P0 和普遍复制粘贴”的失控项目。它已经收敛为五包无环架构，类型纪律强，静态门禁、728 项 Deno 测试、146 项 Chromium E2E、网站构建、五包打包及多数消费者证明均通过。生产源码的机械重复总体约为低个位数百分比，主要风险是少数集中契约复制、发布证明未全绿，以及若干未被行为测试覆盖的运行时契约错位。

本轮确认 **0 个 P0、4 个 P1、6 个 P2、5 个 P3**。P1 如下：

1. 干净 HEAD 的 `deno.lock` 已过期，冻结安装失败；当前工作树中的未提交锁文件才是可安装状态。
2. release-tier 的 Nitro Workers 证明失败，Cloudflare Module 构建缺少 `@rollup/plugin-terser`。
3. query 参数被二次 `decodeURIComponent`，合法的编码百分号可使路由抛 `URIError`。
4. SPA 挂载器写入 loader/action 数据的字段与页面编写层读取字段不一致，数据静默丢失。

旧报告中两个最高严重度结论是误报或已过时：JSONC 行注释正则不会破坏字符串中的 `https://`；`clientOnlyTagMap` 当前与 `ssr === false` 条件一致。DSD 填充谓词确有分歧，但相关 helper 没有调用者，不能标为核心路径 P0。

### 总体评级

| 维度 | 结论 |
|---|---|
| 项目质量 | **良好，但 release-tier 当前不全绿** |
| 代码质量 | **良好**；类型边界和测试纪律强，存在少量真实运行时缺陷 |
| 架构 | **健康**；五包 DAG 清晰，`adapter-vite` 公开面仍偏宽 |
| 冗余度 | **总体较低、局部集中**；协议类型双份维护是主要债务 |
| 死代码 | **少量内部孤儿**；公开但仓内未用的 API 不能直接判死 |
| 测试 | **覆盖面强**；覆盖率刚过线，SPA 数据契约等语义存在盲区 |
| 供应链 | **门禁较强**；HEAD 锁文件、Workers 证明和依赖升级需处理 |

## 2. 审查基线与可复现快照

### 2.1 环境

| 项目 | 值 |
|---|---|
| Git | `2.39.5` |
| Deno | `2.9.1` |
| V8 | `14.9` |
| TypeScript（Deno） | `6.0.3` |
| Node | `v24.18.0` |
| npm | `11.16.0` |
| HEAD | `bebada5 fix(ci): stabilize Nitro consumer proofs` |
| 受跟踪文件 | 1,129 个，57,683,211 bytes |

五个包版本均为 `0.41.0-alpha.10`。2026-07-14 查询 npm registry 时，五包最新已发布版本均仍为 `0.41.0-alpha.6`，所以本地 alpha.10 的结论是“待发布产物验证”，不是“已发布版本验证”。

### 2.2 规模

| 区域 | 源码文件 | 源码 LOC | 测试文件 | 测试 LOC |
|---|---:|---:|---:|---:|
| `packages/adapter-vite` | 71 | 10,384 | 34 | 6,925 |
| `packages/app` | 13 | 1,355 | 8 | 1,384 |
| `packages/create` | 2 | 141 | 1 | 97 |
| `packages/element` | 66 | 8,019 | 7 | 1,986 |
| `packages/ui` | 15 | 2,437 | 4 | 1,151 |
| **五包合计** | **167** | **22,336** | **54** | **11,543** |

按受跟踪代码文件统计：`packages` 230 文件/34,171 行，`www` 82/13,599，`examples` 57/8,630，`tools` 58/9,464。生成目录、`node_modules`、缓存及 vendor 实现没有计入项目代码质量。

### 2.3 审查前工作树

审查开始时已有以下用户变更，本轮未清理、未回退：

- 已修改：`deno.lock`、`docs/evidence/dogfood-performance.json`、`examples/deno-desktop-mastodon/deno.lock`。
- 未跟踪：本报告、JSR vendor 目录/元数据、`www/app/data/_generated-blog-data.ts`。
- 验证新增：`packages/adapter-vite/__fixtures__/nitro-proof/.nitro/`。

三个既有已修改文件的审查前后 SHA-256 保持不变：

```text
deno.lock                                      b38b98cb947abea041af1fdfe85c494326028048a07761fe2b75843e479bc45d
docs/evidence/dogfood-performance.json         ce0999008b4918c91035a2d29715a3bc01e1d3d8537f40f8aecdcac3cae0a3d7
examples/deno-desktop-mastodon/deno.lock       2cbd4bab57c9ebaf7450b77befa4d201cabb211f78e15a6922a13c5b1ffeeae1
```

## 3. 自动化验证结果

### 3.1 静态与架构门禁

以下任务全部通过：

- `fmt:check`：722 个文件。
- `lint`：393 个文件。
- 全包 typecheck。
- 包图、架构契约、包表面、导出文件、类型安全、Deno API、信号边界。
- 文档真相、项目工作流、仓库卫生、配置、Action 固定版本、文本完整性。
- 类型安全扫描：362 个 TS/TSX 文件，0 个显式 `any`。

### 3.2 测试与覆盖率

| 命令 | 结果 |
|---|---|
| `deno task test` | **728 passed（35 steps），0 failed，约 10 秒** |
| `deno task test:coverage:check` | **通过** |
| 行覆盖率 | 7,707 / 11,303 = **68.19%**（阈值 68%） |
| 分支覆盖率 | 2,177 / 2,707 = **80.42%**（阈值 80%） |
| 函数覆盖率 | 472 / 663 = **71.19%**（阈值 71%） |

覆盖率只统计 `packages/*/src` 且排除测试。三项仅高于阈值 0.19、0.42、0.19 个百分点，微小新增代码即可使门禁转红；这不是失败，但说明缓冲不足。原始 coverage 数据包含 `examples`、`tools`、`www`，门禁汇总时会过滤它们。

### 3.3 构建、发布产物与消费者

| 验证 | 结果 |
|---|---|
| `deno task build` | 通过：30 routes、40 blog posts、207 HTML、17.9 MB、205 sitemap URLs |
| 网站 artifact truth | 通过；client island JS 102 KB |
| local consumer | 通过 |
| packaged consumer | 通过 |
| Deno + Node ESM core smoke | 通过 |
| 第三方 Web Component | 通过 |
| desktop reader | 44 tests 通过 |
| Nitro Node proof | 通过 |
| Nitro Workers proof | **失败** |
| 五包 package artifacts | 通过 |
| 五包 `pack:dry-run` | 通过 |
| 五包 npm publish dry-run | 通过；`publint` 与 ESM/bundler 类型检查通过 |

本地 npm tarball 约为：create 11.9 KB、element 237.3 KB、app 44.4 KB、adapter-vite 331.7 KB、ui 75.3 KB。`deno pack` 对若干内部模块发出无法生成声明的警告，但公开入口类型解析通过，因此不能把警告直接定性为发布阻断。

### 3.4 浏览器与视觉

- Chromium E2E：**146 passed，约 6.2 分钟**。
- 视觉基线 meta-tests：8 项，每项遍历 30 路由，共比较约 240 张截图，全部通过。
- `deno task test:visual-smoke`：**失败**。docs 构建与 reader 构建成功后，检查器在 `tools/visual-smoke.ts:141` 要求存在 `<open-brand-mark>`；当前头部在 `www/app/site-ui/open-layout.tsx:920` 使用内联 `.logo-glyph`。这是检查器与当前设计漂移，不是页面未渲染品牌标记。

“失败”“未执行”“环境阻塞”已分开记录：本轮无浏览器环境阻塞；Workers 是实际构建失败；视觉 smoke 是实际规则失败。

## 4. 架构审查

### 4.1 五包依赖图

```text
create                 element
                         ├── app
                         ├── ui
                         └── adapter-vite
                              └── app
```

依赖图无环。`element` 提供运行时和协议核心，`app` 提供编写/路由层，`adapter-vite` 负责构建与部署适配，`ui` 是组件库，`create` 是独立脚手架。相比 2026-07-07、2026-07-11 旧审计中的 11 包拓扑，当前五包边界更少、更容易导航；旧拓扑只能作为历史决策证据。

### 4.2 公开接口与模块深度

| 包 | 公开 subpath | 判断 |
|---|---:|---|
| `element` | 5 | 核心能力集中，删除测试和结构测试较强 |
| `app` | 6 | 页面编写与路由职责清晰 |
| `adapter-vite` | 14 | 公开面最宽，暴露 build context、构建阶段与多个 helper |
| `ui` | 13 | 与独立组件边界基本一致 |
| `create` | 1 | 深且简单 |
| **合计** | **39** | 无循环、无空壳发布包 |

主要深度问题位于 `adapter-vite`：它同时暴露插件、CLI 构建阶段、build context、head injection、route manifest、sitemap 等接口。单个能力有实际价值，但整体 Interface 较宽，内部流水线调整更容易成为兼容性约束。后续应先标记“稳定公开契约”和“工具/实验接口”，再缩面，不能直接删除现有 subpath。

### 4.3 跨包 Seam 与 Adapter

`element` 与 `adapter-vite` 各维护一套 `src/internal/protocol`：

| 文件 | 两边行数 | 状态 |
|---|---:|---|
| `manifest.ts` | 111 + 111 | 字节相同 |
| `render.ts` | 199 + 199 | 字节相同 |
| `style-sheet.ts` | 16 + 16 | 字节相同 |
| `vnode.ts` | 30 + 30 | 字节相同 |
| `framework.ts` | 289 + 278 | 大部分相同，已有漂移 |

这是约 600–700 行集中重复，并形成两个协议真源。它比全仓分散的小 clone 更值得优先处理。建议建立一个刻意窄的、type-only 的稳定协议 Seam；不要让 `adapter-vite` 直接依赖 `element` 的任意 internal 路径，也不要为去重重新拆出多个浅包。

### 4.4 Dogfood 代表性

网站、desktop reader、desktop Mastodon、local/packaged consumer 和第三方组件证明提供了真实消费面；Node 和 Workers 部署路径有独立 Nitro proof。缺口是：两套 desktop dogfood 主要覆盖 `defineApp` SPA 用法，却没有断言 loader/action 数据真正抵达 `definePage` 页面实例，这正是本轮 P1 能穿过测试的原因。

## 5. 有效发现与风险清单

严重度定义：P0 为稳定触发的发布阻断、数据/安全事故或核心路径不可用；P1 为重要功能错误或高概率发布/维护风险；P2 为局部缺陷或显著架构债；P3 为清理、观测和优化建议。没有可复现证据的条目不列 P0/P1。

### P1-1：HEAD 锁文件过期，干净检出无法冻结安装

- **位置**：HEAD `deno.lock`、根 `deno.json` workspace/imports。
- **证据**：将 `git archive HEAD` 解到临时目录后运行 `deno install --frozen --node-modules-dir`，退出码 1；报告缺少 `npm:typescript@^5.9.0`，并包含 `packages/content`、`packages/signal` 等已退役 workspace 条目。
- **影响**：任何严格冻结锁文件的干净发布/复现环境会失败；普通 CI 使用非 frozen 安装，可能就地更新锁而掩盖问题。
- **严重度理由**：发布可复现性阻断，但当前工作树已有未提交修复锁文件，故不是整个项目不可用的 P0。
- **建议**：核对当前工作树 `deno.lock`，由正式版本更新流程提交；CI 增加干净树上的 `deno install --frozen --node-modules-dir`。
- **置信度**：高。

### P1-2：Nitro Workers release proof 失败

- **位置**：`tools/nitro-proof.ts`；`tools/autoflow/policy.ts:188`；Nitro 3.0.0 Cloudflare Module 构建。
- **证据**：`deno task nitro:proof:workers` 失败：`Cannot find module '@rollup/plugin-terser'`。同时出现 Cloudflare route rule 序列化和 Node compatibility 警告。
- **调用链**：release tier → `nitro:proof:workers` → Nitro `cloudflare-module` preset → Rollup minification plugin 加载失败。
- **影响**：正式 release gate 不能全绿，Workers 部署兼容性未被证明。
- **严重度理由**：稳定的发布层阻断。它不在常规 CI tier；当前成功的 AutoFlow CI 不能反证 release 成功。
- **建议**：先明确 Nitro preset 的依赖契约，固定并显式提供兼容版本，随后在干净缓存环境复跑 Node/Workers 两条 proof；不要仅通过跳过 terser 消除门禁。
- **置信度**：高。

### P1-3：query 参数双重解码可使路由崩溃

- **位置**：`packages/app/src/internal/router/client-router.ts:89-115`。
- **证据**：`parseQuery` 先调用 `decodeQueryComponent`，随后 `setParam` 再调用 `decodeURIComponent`。最小复现 `matchRoute('/', '?x=100%25', routes)` 抛 `URIError`；`?x=%252F` 被错误解为 `/`。
- **影响**：包含合法编码百分号的 URL 可在初始化或导航时终止匹配。
- **严重度理由**：真实用户输入可稳定触发核心路由错误；范围局限于特定 query 值，未达全站 P0。
- **建议**：每个 key/value 只解码一次，增加 `%25`、双层编码、非法 `%`、重复 key 和 `+` 语义测试。`+` 转空格符合 form-urlencoded 习惯，本身不是旧报告所称的 bug。
- **置信度**：高。

### P1-4：SPA loader/action 数据契约错位

- **位置**：`packages/app/src/spa.ts:67-74`；`packages/app/src/authoring.ts:260-267`。
- **证据**：SPA 把 loader 对象 `Object.assign` 到元素并写 `el.actionData`；`definePage` 实际读取 `this.data` 与 `this.__openElementActionData`。最小 DOM mock 挂载 loader `{answer: 42}` 后，页面元素只有 `answer`，没有 `data`。
- **影响**：SPA 页面通过 `useLoaderData`/`useActionData` 或页面 context 读取不到数据，且无异常提示。
- **严重度理由**：重要功能静默失效，当前测试只验证接口/类型，没有验证行为。
- **建议**：统一页面宿主协议，SPA 与 SSG 使用同一 typed adapter；增加真实 `definePage` + loader + action 的浏览器/DOM 集成测试。
- **置信度**：高。

### P2-1：移除打开的 dialog 后兄弟节点可永久 inert

- **位置**：`packages/ui/src/open-dialog.tsx:202-236`。
- **证据**：打开时 `_syncInert` 记录并设置兄弟节点；`disconnectedCallback` 中元素已经没有 `parentNode`，恢复调用在 `:203-204` 提前返回。
- **影响**：直接移除仍为 open 的 dialog 后，页面其余交互区域可能保持不可交互/不可访问。
- **建议**：打开时保存需要恢复的节点集合，断开前或断开时无父节点也能按原状态恢复；补 DOM 生命周期测试。
- **置信度**：高。

### P2-2：外部修改 theme 属性不会同步全局主题

- **位置**：`packages/ui/src/open-theme-toggle.tsx:211-255`。
- **证据**：点击路径同步 `document.documentElement`、宿主、事件和 localStorage；`attributeChangedCallback` 只更新本地 signal 与自身 `data-theme`。
- **影响**：声明式属性更新后，按钮状态与页面主题可能不一致。
- **建议**：抽单一 `applyTheme(theme, source)`，两条入口共用并防止回环。
- **置信度**：高。

### P2-3：跨包协议约 600–700 行双份维护

- **位置**：`packages/element/src/internal/protocol/*` 与 `packages/adapter-vite/src/internal/protocol/*`。
- **证据**：四个文件完全相同，`framework.ts` 大段重复且已产生 289/278 行差异。
- **影响**：协议修改需要双改，类型可结构兼容但语义漂移，增加构建/运行时边界风险。
- **建议**：抽窄 type-only Seam 或从一处生成另一处；用契约测试保证运行时层不反向依赖构建层。
- **置信度**：高。

### P2-4：视觉 smoke 与品牌实现漂移

- **位置**：`tools/visual-smoke.ts:116-147`；`www/app/site-ui/open-layout.tsx:920-924`。
- **证据**：任务稳定失败于“不存在 `<open-brand-mark>`”，但当前布局有可见内联 `<open/>` glyph，完整 E2E 视觉基线通过。
- **影响**：独立 smoke 不能作为可靠门禁，可能阻碍本地/发布验证并产生误报。
- **建议**：把检查改为可访问名称或稳定 `data-*` 语义标记；避免把具体自定义元素实现当视觉真相。
- **置信度**：高。

### P2-5：发布包携带内部测试源文件

- **位置**：`packages/adapter-vite/deno.json:33-39` 的 `src/**`；`src/internal/content/mdx/__tests__/compile.test.ts`。
- **证据**：实际 dry-run tarball 包含该测试文件；adapter-vite npm 包 114 文件、约 986.3 KB unpacked。
- **影响**：增加发布体积并暴露无用测试实现；目前未影响运行时。
- **建议**：将内部测试移出 `src` 或为发布 include 增加可维护的排除策略，同时保留 artifact 内容测试。
- **置信度**：高。

### P2-6：版本真相门禁仍含硬编码字面量

- **位置**：`tools/check-public-docs-integrity.ts:79`、`tools/check-strategic-docs.ts:66-67`；单一真源是 `tools/project-constants.ts:1`。
- **证据**：当前 alpha.10 通过，但两个检查器直接写死 `0.41.0-alpha.10`。
- **影响**：下次 bump 必须多点同步，漏改会产生假 CI 失败。
- **建议**：统一引用 `PACKAGE_VERSION`/`PACKAGE_VERSION_TAG`，版本 bump 测试覆盖所有消费者。
- **置信度**：高。

### P3 清理与观测项

1. `packages/element/src/internal/core/dsd-hydration.ts` 的 `createDsdRenderRoot`/`hydrateDsdEvents` 只有内部 re-export、无调用者；其 `childElementCount` 与生产路径 `childNodes.length` 分歧。先做删除测试，再删除整个孤儿模块，不能把它描述成运行时 P0。
2. `cemToOpenElementPackageManifest` 和 `readRouteTagNameFromModule` 只有定义/内部 re-export，无调用者，是可验证的内部清理候选。
3. `open-button`、`open-input`、`open-dialog` 的 `_escAttr = escapeAttr` 字段只有赋值、无读取，可机械删除。
4. `tools/autoflow/mod3.ts:84-86` 在浅克隆中用 `HEAD^` 获取 changed paths 会返回空列表；ci/release 当前无条件选择所属 tier 的 gate，因此没有漏跑，但日志误导且给未来路径选择留下隐患。
5. 覆盖率阈值缓冲过薄；先补 P1 行为测试再提高阈值，避免只为数字增加低价值测试。

## 6. 冗余、死代码与旧文件审查

### 6.1 复制检测

用 `jscpd 4.0.7` 对 `packages`、`tools`、`www/app`、`examples` 做启发式扫描，原始结果为 489 文件、60 个 clone、1,722 重复行、2.84%。该原始值包含测试、fixtures、Mastodon JSON 和本轮生成的 Nitro 输出，**不能直接当生产代码重复率**。

剔除上述噪音后，整体重复属低到中低水平，最值得处理的是协议双份维护。其他 clone 多为：

- 两个 desktop 示例的 Vite/router/lifecycle 骨架，可考虑共享测试 harness，但保留独立示例也有教学价值。
- 多个 guide route 的页面 wrapper，属于静态内容模板，可生成但不是高风险。
- `tools` 中 command/git/release helper 的局部重复，可在日常修改触及时收敛。
- CSR/hydrate、tag validation 等小段分叉，应通过共享语义 helper 防漂移。

不建议为追求单一重复率引入通用 god helper 或跨职责基类。

### 6.2 死代码分类

| 分类 | 例子 | 裁决 |
|---|---|---|
| 内部无调用 | DSD hydration helpers、CEM converter、route tag reader | 可做删除测试后清理 |
| 公开但仓内未用 | `unwrap`、`scanSSGOutput` | **不是死代码**；需查外部消费者与弃用策略 |
| 历史文档 | `docs/audit`、旧 ADR/release notes | 历史证据，不应删除 |
| 生成物 | `www/app/data/_generated-blog-data.ts`、`.nitro`、vendor 元数据 | 按生成来源和跟踪策略管理，不计项目源码质量 |
| 第三方 vendor | `vendor/jsr.io` | 只审版本、锁定和许可证，不审实现质量 |

旧报告“约 15 处死代码”不可复现，因为它混合了内部孤儿、公开 API、test-only API 和历史材料。本报告只把有明确源码级零引用证据的内部符号列为候选。

### 6.3 仓库卫生

仓库卫生 gate 通过，vendor 已跟踪 `ATTRIBUTION.md` 和各包 LICENSE。当前未跟踪 vendor 目录、`.nitro` 和 blog data 是验证/生成状态，应由项目既定生成物策略决定是否提交；本轮不擅自删除或归类为旧垃圾。

## 7. 测试、CI 与发布质量

### 7.1 正向结论

- 单元、类型、架构、包表面、文档、浏览器、发布产物形成了多层证据，而非只检查“命令退出 0”。
- 146 项 E2E 包含导航、DSD、island、主题、i18n、性能/可访问性和视觉基线。
- local/packaged/Node/第三方组件/desktop dogfood 覆盖多种消费者，五包 `publint` 和类型消费者均通过。
- GitHub HEAD 的 AutoFlow CI、CodeQL 和 Nightly stress 均成功：
  - [AutoFlow CI run 29303890318](https://github.com/open-element/openelement/actions/runs/29303890318)
  - [CodeQL run 29303890316](https://github.com/open-element/openelement/actions/runs/29303890316)
  - [Nightly stress run 29305230712](https://github.com/open-element/openelement/actions/runs/29305230712)

### 7.2 盲区与门禁解释

- AutoFlow CI 成功不包含 Nitro proof；policy 明确把 Node/Workers proof 放在 `release` tier。旧报告所称“CI/release 的 trigger 全死导致漏跑”不成立：`selectGates` 对 ci/release 忽略 path trigger，所属 tier 全跑。
- CI 浅克隆里 Changed paths 显示 0 是观测问题，不是当前 gate 选择问题。
- `spa.test.ts` 偏接口/类型验证，没有实际页面数据注入断言。
- dialog 测试没有覆盖“open 时直接从 DOM 移除”；theme 测试没有验证 document/root propagation。
- 视觉基线强但成本高；视觉 smoke 又把实现标签当契约，两者应明确分工。

## 8. 安全与供应链

### 8.1 当前查询结果

查询日期均为 2026-07-14：

- GitHub Dependabot open alerts API 返回空数组；HEAD CodeQL 成功。这是正向证据，但不是对所有传递依赖的独立漏洞审计。
- GitHub Actions 固定版本检查通过，dependency review 已配置。
- `deno outdated --recursive` 显示可兼容更新：signals-core 1.14.3→1.14.4、Preact 10.29.2→10.29.7、sanitize-html 2.17.5→2.17.6、Hono 4.12.25→4.12.30、`@preact/signals` 2.9.2→2.9.3、Vite 8.0.10→8.1.4。
- 存在需要迁移评估的主要版本差距：FlexSearch 0.7→0.8、Marked 15→18、pdf-parse 1→2、pdfjs 4→6、Playwright 1.59→1.61 等。过期不等同漏洞。

### 8.2 信任边界

- HTML/MDX 管道使用 `sanitize-html`，URL、静态服务器路径和文件路径均有显式检查；相关 lint/消费者/E2E 通过。
- query 解码是本轮确认的输入边界缺陷，应加入畸形编码 fuzz/table tests。
- 构建期存在动态模块加载和代码生成，发布产物 gate 能发现 Node/CommonJS/导出问题，但 Workers preset 的可选依赖没有被普通 CI 覆盖。
- vendor 许可证/归因文件存在；发布前仍应对五包实际 tarball 做 license inventory，而非只依赖仓库根 LICENSE。

## 9. 旧报告逐项核验

### 9.1 高优先级结论

| 旧结论 | 裁决 | 核验结果 |
|---|---|---|
| JSONC 会把 `https://` 截断（P0） | **误报** | 行注释正则锚定行首；最小解析保留 URL。块注释/尾逗号正则仍可能误伤字符串，是 P2 级解析器分叉，不是该 P0 |
| query 双解码（P0） | **已证实，降为 P1** | `%25` 稳定抛 `URIError`；`+`→空格本身不是错误 |
| SPA loader/action 数据失配（P0） | **已证实，合并为 P1** | 两个表现来自同一宿主协议错位 |
| DSD 填充谓词不一致（P0） | **部分属实，降为 P3** | 分歧存在，但 `dsd-hydration.ts` helpers 无调用者，旧报告没有核心调用链证据 |
| client-only map 条件反转（P0） | **已过时** | 当前 `packages/adapter-vite/src/cli/build-ssg.ts:189-203` 两处均使用 `meta.ssr === false` |
| dialog inert 泄漏（P1） | **已证实，机制修正为 P2** | 断开后 `parentNode === null` 导致无法恢复，不是“重新加 inert” |
| theme 属性不同步（P1） | **已证实，P2** | 外部属性路径不更新 document/root/storage/event |
| 硬编码版本（P1） | **已证实，P2** | 当前不失败，但下一版本易产生维护漂移 |

### 9.2 统计与范围

- 旧报告版本写成 alpha.9，当前实际是 alpha.10，已过时。
- “约 730 测试”与实际 728 接近，但本报告使用 runner 结果而非 grep 声明数。
- “P0×4、真实 bug 7 个”没有对应稳定复现和完整调用链，已撤销。
- “复制粘贴普遍”被 clone 扫描否定；总体重复较低，但协议层存在集中高风险复制。
- “约 15 处死代码”混入公开 API和历史材料，不能作为删除清单。
- `scanSSGOutput` 是公开、测试并记录在 README 的 API，旧报告称其“实质私有”不成立。
- 旧报告主要审查 packages/tools，却自称全项目；本轮补充了 `www`、examples、浏览器、发布、GitHub CI 和供应链。
- 2026-07-07/07-11 的 11 包审计是历史快照，不能用来描述当前五包架构，但保留在 `docs/audit` 合理。

## 10. 分阶段整改路线

### 阶段 A：恢复可发布性

1. 提交经核验的 alpha.10 锁文件，并在干净 archive 上加入 frozen install proof。
2. 修复 Nitro Workers 的 terser/preset 依赖，跑通完整 release tier。
3. 修复 query 单次解码与 SPA 数据宿主协议，增加行为回归测试。

完成标准：干净 HEAD frozen install、`autoflow:release`、Node/Workers proof 和新增回归测试全部通过。

### 阶段 B：补齐 UI 与门禁语义

1. 修复 dialog inert 恢复和 theme 全局传播。
2. 将视觉 smoke 从具体标签改为稳定语义断言。
3. 排除 adapter tarball 中内部测试源，消除公开入口之外的 `deno pack` 类型警告或明确白名单。

### 阶段 C：深化架构而非增加包数

1. 建立窄协议 Seam，消除 `element`/`adapter-vite` 双份协议。
2. 给 adapter-vite 14 个 subpath 标注稳定级别，逐步减少流水线内部公开面。
3. 删除经 deletion test 证明无用的 DSD/CEM/route scanner 孤儿代码和三个 `_escAttr` 字段。

### 阶段 D：降低长期维护成本

1. 统一版本常量、JSONC 解析、git/command helper 等局部真源。
2. 在不重复跑低价值矩阵的前提下提高覆盖率缓冲，优先覆盖本报告四条运行时语义。
3. 周期性运行依赖升级和实际 tarball license inventory；主要版本升级逐项迁移，不做一次性大爆炸更新。

## 11. 证据附录

### 11.1 关键命令

```bash
git status --short
git ls-files | wc -l
git ls-files -z | xargs -0 stat -f %z | awk '{ total += $1 } END { print total }'
deno --version
node --version
deno task fmt:check
deno task lint
deno task test
deno task test:coverage:check
deno task build
deno task test:e2e
deno task test:visual-smoke
deno task consumer:local
deno task consumer:packaged
deno task consumer:core-smoke
deno task third-party-wc:smoke
deno task desktop-reader:smoke
deno task nitro:proof:node
deno task nitro:proof:workers
deno task package-artifacts:check
deno task pack:dry-run
deno task publish:npm:dry-run
deno outdated --recursive
gh api --method GET repos/open-element/openelement/dependabot/alerts -f state=open
npm view @openelement/element version --json
```

任务名称以根 `deno.json` 为准；部分验证由 AutoFlow 聚合任务调用。所有临时最小复现均在仓库外或内存 mock 中执行，没有提交测试文件。

### 11.2 最终边界声明

- 本报告只对基线提交与审查时工作树负责；未把未提交锁文件当作 HEAD 已修复。
- 未对 `node_modules`、缓存和生成目录逐文件审查。
- vendor 第三方实现不计入项目质量，只检查跟踪、锁定、体积和许可证。
- GitHub/registry/依赖结论是 2026-07-14 查询快照，后续可能变化。
- 本轮唯一预期编辑文件为 `REVIEW-REPORT.md`；其他工作树变化均为用户既有内容或已明确列出的验证生成物。
