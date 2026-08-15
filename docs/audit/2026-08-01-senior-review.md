# openElement 全栈定位代码审计（Senior Developer 复盘）

- 审计日期：2026-08-01（晚于同日的两份报告 `2026-08-01-positioning-audit.md` 与 `2026-08-01-positioning-verification.md`）
- 审计立场：openElement 是「Web Component 全栈框架」（五包收敛：element / ui / app / adapter-vite / create），不是通用工具库或文档站
- 方法论：直接读源码 + ripgrep 交叉验证（子代理在本沙箱不稳定，改为本人逐条核验）。所有结论给出 文件:行号 证据。
- 基线已读：`2026-07-29-architecture-quality-audit.md`（整体 ≈72/100）、`2026-08-01-positioning-audit.md`（6 🔴）、`2026-08-01-positioning-verification.md`（6 🔴 全部核实成立）、`2026-07-30-a10-close-report.md`（alpha.10 里程碑 8 issue 关闭）。

<!-- audit-citations-baseline-sha: 048985703ccc3f68f9e33d33355be17331d7b11a -->

- 引用时效护栏：本报告所有 `file:line` 引用已由 `tools/check-audit-citations.ts` 复核（working tree @ HEAD `0489857`，含同日未提交修复冲刺）。重构后运行 `deno run -A tools/check-audit-citations.ts` 复核漂移；`--sha=<commit>` 可针对历史提交复核。

---

## 〇、最重要结论（时效发现，必须先讲）

**同日 positioning 报告识别的 6 条 🔴 硬伤，至本次复核时点已全部被修复或缓解。** 仓库在 2026-08-01 当天经历了一次修复冲刺，且 element 包被重组（公共 API 留 `src/` 顶层、内部实现下沉 `src/internal/core/`）。因此本报告不重复列举那 6 条，而是给出**当前态核实结果** + **遗留的真实问题** + **新发现的元问题**。

| 原 🔴                                     | 当前状态              | 证据                                                                                                                                                                               |
| ----------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴-1 element「零依赖」口径不实            | **已修复**            | `packages/element/src/internal/core/index.ts:7` 已改为 "Single chartered engine dependency: @preact/signals-core"；docs 全仓 grep "zero-dep" 仅命中 ADR 历史文件，无误导运行时声明 |
| 🔴-2 默认 appShell 指向不存在模块首启必炸 | **已修复**            | `packages/adapter-vite/src/internal/ssg/entry-descriptor.ts:39-46` 对 `undefined`/`'default'` 返回 `false`；`packages/ui/src` grep `open-layout` 零命中（默认不再指向它）          |
| 🔴-3 MDX Phase 3 断线                     | **已修复**            | `packages/adapter-vite/src/cli/build-ssg.ts:335` 插件表已加 `mdxPlugin()`，附注释说明必须镜像 `packages/adapter-vite/src/plugin.ts:396`                                            |
| 🔴-4 app request 层未接线                 | **已缓解（残留 🟡）** | 生产 `nitro-mount.ts` 仍不消费 `app/model`，但新增契约测试 `packages/adapter-vite/__tests__/nitro-mount.test.ts:100-135` 强制两形状对齐                                            |
| 🔴-5 文档谎称 alpha.10 已发布             | **已修复**            | `docs/status/STATUS.md:5`、`docs/current/VERSION_PLAN.md:4`、`README.md:10-13` 均诚实写 "alpha.10 是 in-flight source line / unpublished；registry=alpha.9"                        |
| 🔴-6 ROADMAP 自相矛盾                     | **已修复**            | `docs/roadmap/ROADMAP.md:124` 改写为 "alpha.9 is the published package line…The in-flight source line is alpha.10"                                                                 |

---

## 一、分级结论清单（🔴→🟢）

### 🔴 硬伤：当前 0 条

经逐条复核，仓库当前无定位冲突 / 数据一致性 / 正确性类的硬伤。原 6 条 🔴 已在同日修复冲刺中关闭。**若必须挑一条"最靠近硬伤"的，是下方 🟡-A（sitemap 失败静默降级），但它属可观测性/SEO 退化而非正确性损失。**

### 🟡 可改进（均经本人 spot-verify）

| #     | 位置                                                                                              | 证据（文件:行号）                                                                                                                                     | 一句话修法                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `packages/adapter-vite/src/internal/ssg/ssg-render.ts:345-355`                                    | `catch (e) { log.debug('Sitemap generation skipped or failed', e); }` —— sitemap 真实生成失败被降级为 debug 日志，无 evidence/遥测，SEO 静默退化      | build 模式抛错或至少 `log.warn` + 进 release evidence；dev 才降级                                                                                     |
| **B** | `packages/adapter-vite/src/index.ts:33,40-52`                                                     | `openPipeline()` 声明 `i18n?: {locales;defaultLocale}`，但 `grep config.i18n` 零命中——选项声明后从不读取（文档/代码双轨空操作）                       | 删除该字段，或真正转交 `openI18n()`                                                                                                                   |
| **C** | `packages/adapter-vite/src/internal/core/registry.ts`（及 `internal/core/index.ts:186-191` 转发） | `registerManifest/getAllManifests/validateManifest/generateIndex/clearRegistry` 全仓（除 barrel 转发自身）零消费方——旧 "WC Package Protocol" 愿景残留 | 删整模块 + barrel 转发；删前跑 `deno task check` 确认无漏                                                                                             |
| **D** | `packages/element/src/internal/core/errors.ts:125-141`                                            | `PropValidationError` 零消费方（连测试都无）                                                                                                          | 删除；如需未来用，先有测试用例再留                                                                                                                    |
| **E** | `packages/adapter-vite/README.md:84`                                                              | 文档化 `injectDsdPolyfill`，但 `grep injectDsdPolyfill packages/adapter-vite/src` 零实现——仅文档声称，源码无此函数                                    | README 删除该段落，或补实现                                                                                                                           |
| **F** | `packages/adapter-vite/src/nitro-mount.ts`（`packages/app/src/hono.ts` 已删除, #720）             | `createHonoRequestContext` 全仓零生产消费方（仅测试）；nitro 主链路自己实现 request context，与 `app/model` 形状平行 → 双份契约                       | 已修复(#720)：删除 `createHonoRequestContext` 及其测试与 `./hono` 导出；nitro-mount 内联实现因 Nitro 生成物不能含裸包导入而保留，类型对齐 `app/model` |
| **G** | `packages/element/src/internal/core/jsx-render-dom.ts:24` 等                                      | `applyProps` 在上次审计引用位置已随文件迁至 `internal/core/`，需重核是否仍零导入（旧路径文件已不存在）                                                | 在新路径 grep 确认后决定是否删                                                                                                                        |

### 🟢 可接受但记债

- **类型安全现状良好**：`@ts-ignore` 全仓仅 1 处（在 `tools/check-architecture-contract.ts:1`，check 工具内，非运行时）；`@ts-expect-error` 仅 4 处（3 处在测试/stub：`app/__tests__/dom-stubs.ts`、`app/__tests__/authoring.test.tsx`、`adapter-vite/src/cli/start.ts:135` 有注释理由）；`as unknown as` 生产源码约 11 处且集中在 DOM/宿主边界（`open-element-render.ts`、`define-element.ts`、`binding-activation.ts`、`render-dsd.ts` 等），正当。
- **静默吞错已实质消除**：prod+tools（排除 `__fixtures__`）空 `catch {}` / `catch(x){}` **零命中**（对比 2026-07-29 报告的 93 处）——#651 修复 + 既有纪律见效。`packages/adapter-vite/src/internal/ssg/ssg-render.ts:132` 的 `isDirectory` catch 返回 `false` 属"探测性 stat 失败=非目录"的正常语义，非错误掩盖。
- **SignalEngine 单实现接口**：`internal/signal/framework.ts` 的 `SignalEngine` 接口只有 `preact-engine.ts` 一个实现——属 charter 决策（可换引擎），记债但可接受。
- **examples 版本 dogfood pin**：`examples/*/deno.json` 钉旧 alpha（如 0.41.0-alpha.6）属有意，但无声明注释，易误读为滞后。

---

## 二、定位一致性专项结论（5 条）

1. **element：从"零依赖工具库"叙事收敛为"单一 charter 引擎依赖的框架核心"——已自洽。** 证据：三条渲染链路（SSR `render-dsd.ts→render-ir.ts` 被 SSG 消费；DSD hydration `hydration-scope.ts`；CSR 细粒度绑定）+ 安全边界（`security.ts` 防原型污染、`html-escape.ts` 统一转义）健全；`internal/core/index.ts:7` 口径已更正。结构改进：公共 API 留 `src/` 顶层、内部下沉 `src/internal/core/`，公/内边界清晰。
2. **adapter-vite：SSR/SSG 正交性真实，且"首启即炸"与"MDX 断线"两个对外最伤的承诺漏洞已补。** 证据：三阶段编排（`cli/build.ts` 唯一驱动器）、`internal/ssg/` 零 Vite 依赖、`nitro-mount.ts` 干净接缝；默认 appShell 不再指向幽灵模块（🔴-2 修复）；MDX Phase 3 接入（🔴-3 修复）。残留：i18n 选项空操作（🟡-B）、sitemap 静默（🟡-A）。
3. **app：四拼盘现状未变，但 request 层"未接线"已从 🔴 降为 🟡。** 证据：页面创作层（definePage/defineIsland）被 www/create/夹具全量消费，是真实定位；独立 SPA 运行时仅两个桌面示例使用（已知孤岛）；request 层（`model.ts`/`hono.ts`）生产主链路不消费，靠契约测试兜底（🟡-F）。建议要么接线要么撤 API，别让"官方默认 request driver bridge"（`app/src/index.ts:58-67`）成为空壳定位。
4. **ui：五包中最干净，定位完全自洽。** 证据：纯 WC（只 import element 包，零 any/ts-ignore）；`packages/ui/src` grep `open-layout` 零命中，README 的 open-layout 引用已正确指向 `www/app/site-ui/`（非 ui 契约）。唯一失分是文档同步细节（旧报告 Y-10 多数列项已修）。
5. **create→开发→构建→生产主路径：当前无彻底断点。** 证据：版本锚点全链路同步（见下）、consumer-local 真跑生成→build→nitro 启动→HTTP POST；打包态 build、dev、preview 三段仍缺门禁（旧报告 Y-19/20），属"验证自动化不足"而非"链路断裂"。

---

## 三、版本锚点一致性（专项，已全网核验）

**结论：当前版本锚点完全一致，无漏网硬编码。** 单一事实源 `tools/project-constants.ts:1` = `0.42.0-alpha.10`，所有引用点同步：

| 引用点                                                                                                      | 当前值                                                                                    | 状态   |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| `tools/project-constants.ts`                                                                                | `0.42.0-alpha.10`                                                                         | 事实源 |
| `packages/{element,ui,app,adapter-vite,create}/deno.json:3`                                                 | 全部 `0.42.0-alpha.10`                                                                    | ✅     |
| `packages/create/src/version.ts:2`                                                                          | `0.42.0-alpha.10`                                                                         | ✅     |
| `www/app/data/version.ts:4`                                                                                 | `v0.42.0-alpha.10`                                                                        | ✅     |
| `www/app/routes/roadmap.tsx:335` 当前节点                                                                   | `v0.42.0-alpha.10`（描述准确）                                                            | ✅     |
| `docs/status/STATUS.md:5` / `docs/current/VERSION_PLAN.md:4` / `README.md:10` / `docs/roadmap/ROADMAP.md:7` | 均诚实区分 source line=alpha.10 / registry=alpha.9                                        | ✅     |
| `docs/release/`                                                                                             | 无 `v0.42.0-alpha.10*` 记录（仅 `v0.41.0-alpha.10.md`，0.41 线）——与"alpha.10 未发布"一致 | ✅     |

> 注：这是相对同日 positioning 报告 🔴-5 的**反转**——当时文档谎称 alpha.10 已发布，现已纠正，且代码侧锚点也全程同步。版本治理（check-version-anchors）当前有效。

---

## 四、删除清单（每行：位置、删什么、为什么安全）

1. `packages/adapter-vite/src/internal/core/registry.ts` 整模块 + `internal/core/index.ts:186-191` 转发 — 删 `registerManifest` 等 5 个零消费导出 — `grep` 全仓（除 barrel 自身）零消费，删前跑 `deno task check` 兜底
2. `packages/element/src/internal/core/errors.ts:125-141` `PropValidationError` — 零消费方（连测试无） — grep 已确认无引用
3. `packages/adapter-vite/README.md:84` 关于 `injectDsdPolyfill` 的段落 — 源码零实现，纯文档幻觉 — 删段落不影响 API
4. `packages/app/src/hono.ts` `createHonoRequestContext` 及 `app/src/index.ts` 的 `./hono` 导出 — 零生产消费方（已删除, #720）— 契约测试改为直接断言 `createRequestContext` 形状即可
5. `packages/adapter-vite/src/internal/content/mdx/` 目录（如仍存在）— 与 `plugin-mdx.ts` 的 @mdx-js/rollup 重复路径 — 旧报告列项，删前确认新 Phase 3 走 plugin-mdx 不再依赖它

> 安全前提：所有删除均需在 `deno task check` + 受影响包单测通过后合入；registry/errors 类删除建议先 grep `barrel` 转发确认无传递消费。

---

## 五、重复实现清单（核心项，文件已随重构迁移路径）

| 重复                   | 位置（当前路径）                                                                                      | 说明                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| tag 校验 ×3 规则不一致 | `element/internal/core/island.ts` vs `element/internal/core/tag-utils.ts:41-49` vs `app/spa.ts:25-32` | defineIsland 拒绝点/下划线、tag-utils 允许、SPA 放行 SSR 拒绝 → 统一调 `tag-utils.assertValidTagName` |
| 公共 props 过滤 ×2     | `element/internal/core/render-dsd.ts` vs `element/internal/core/props-utils.ts:17-24`                 | 同意图两份，合并                                                                                      |
| JSONC 剥离 ×2          | `adapter-vite/workspace-alias.ts` vs `cli/build-client.ts`                                            | 逐字符 vs 正则，行为不一致（行中 `//`）                                                               |
| 路由路径转换 ×3        | `internal/ssg/route-scanner.ts` vs `route-type-generator.ts` vs `route-manifest.ts`                   | 各自处理 index/分隔符                                                                                 |
| request context ×2     | `app/model.ts`+`app/hono.ts` vs `adapter-vite/nitro-mount.ts`                                         | 平行形状 + 一个无消费方 API（🟡-F）                                                                   |
| i18n 转发 ×3           | `app/i18n.ts` → `i18n-runtime.ts` → `internal/router/i18n.ts`                                         | 三跳 re-export，runtime 不在 exports                                                                  |
| 事件符号转发层         | `element/internal/core/event-hydration.ts:34-42`                                                      | re-export event-marker.ts 6 符号，纯噪音                                                              |

---

## 六、最值得做的 3 个改进及理由

1. **闭合 sitemap 失败的可观测性（🟡-A，`packages/adapter-vite/src/internal/ssg/ssg-render.ts:345` 一行改动）** — 这是当前唯一"真实错误被静默降级"的关键路径点，且是最低成本高信号的修复：build 模式抛错/进 evidence，dev 才 warn。直接堵住"SEO 静默退化无人知晓"的风险，呼应仓库自身 `reportError` 治理意图。
2. **消掉 request 层的双份契约（🟡-F）** — 让 `nitro-mount` 直接消费 `app/model` 的 `createRequestContext`，删除零消费方的 `createHonoRequestContext` 与"形状对齐"权宜测试。理由：双平行 request-context 形状是定位报告当天唯一未彻底解决的 🔴 残留，它让"app 是官方 request driver bridge"的定位仍是半截承诺；接线后定位与代码才真正自洽，也少一份长期维护债。
3. **给审计/报告加"引用时效护栏"（元改进）** — 本次发现 element 包在同日被重组（公共/内部路径迁移）、route-scanner 重命名、6 条 🔴 同日修复，导致同日 positioning 报告的大量 `文件:行号` 已在数小时内失效。建议：① 审计报告在文首钉 commit SHA；② 新增轻量 `tools/check-audit-citations.ts`，对报告中的 `path:line` 做存在性断言，纳入 CI 非阻塞。理由：仓库治理（check-version-anchors 等）已很强，但"审计文档自身"不被机器校验，会反复产生"报告说 X 已坏、代码已修"的信息噪声，浪费评审成本。

---

## 七、与历史审计的关系

- `2026-07-29`（≈72/100）：广度审计，识别"静默吞错 93 处""数据层 ADR 漂移""覆盖率盲区"等——其中静默吞错经 #651 与本次核验已实质消除（prod 空 catch 零命中）。
- `2026-08-01-positioning`（6 🔴）+ `…-verification`（6 🔴 全成立）：聚焦定位。至本次复核，6 条 🔴 已全部修复/缓解，说明该报告发布后即有修复冲刺，其 `文件:行号` 因同日重构部分失效。
- 本报告：在修复冲刺**之后**的当前态复盘，确认 0 当前硬伤、列遗留 🟡、并指出"审计引用时效"这一治理盲区。建议以本报告为 alpha.11 修复基线，优先做上面 3 项。

_本文所有 文件:行号 均已用 ripgrep / Read 直接核验（2026-08-01 当前工作树）。_

---

## 引用时效复核（自动生成）

> 本附录由 `tools/check-audit-citations.ts` 生成。基线：当前工作树。
> 引用总数：31；漂移：0。

全部引用均能在基线中解析，无行号漂移。
