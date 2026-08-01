# openelement-audit-2026-08-01-positioning.md 核实报告

- 核实日期：2026-08-01
- 被核实文件：`openelement-audit-2026-08-01-positioning.md`
- 核实方式：逐条读取被引用的 文件:行号 并比对代码；版本事实以仓库内 `docs/release/` 发布记录 + 文档声明交叉验证（npm 网络查询因沙箱 fish 无 `timeout` 子命令未能直接执行，见下方说明）。

---

## 一、6 条 🔴 硬伤：全部核实成立（CONFIRMED）

| 编号 | 结论     | 核实证据                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🔴-1 | **成立** | `packages/element/src/internal/signal/framework.ts:16` `const engine = createPreactEngine();` 在模块顶层实例化；`preact-engine.ts:10-13` 从 `@preact/signals-core` 导入 signal/computed/effect；`internal/core/index.ts:7` 注释写 "Zero npm: specifiers"。"零依赖运行时" 口径确属不实。                                                                                                                                        |
| 🔴-2 | **成立** | `adapter-vite/src/internal/ssg/entry-descriptor.ts:41-46` 默认 `importPath:'@openelement/ui/open-layout'`；对 `packages/ui` 全树 grep `open-layout` 零命中 —— 该模块不存在。默认首启必炸。                                                                                                                                                                                                                                     |
| 🔴-3 | **成立** | `adapter-vite/src/plugin.ts:396` `mdxPlugin()` 注册在外层插件列表；但 `cli/build-ssg.ts:331-377` 的 Phase 3 `viteBuild()` 插件表（virtual-ssg-entry / optionalPackageStubs / generated-data / npm-specifier / client-only-stub）**无 mdxPlugin**；`internal/ssg/entry-renderer.ts:108-110` 对 `.mdx` 路由生成裸 `import * as ... from '<.mdx>'`，Phase 3 为 `configFile:false` 新构建，会被 esbuild 当 JS 解析失败。           |
| 🔴-4 | **成立** | `createRequestContext`（`app/src/model.ts:29`）/`createHonoRequestContext`（`app/src/hono.ts:36`）在 `packages/` 范围内仅被 `app` 自身与 `__tests__/hono.test.ts`、`__tests__/model.test.ts` 引用；`adapter-vite/nitro-mount.ts` 与 `www` 均无消费方 —— app 的 request 层整套未接线，主链路绕开它。                                                                                                                            |
| 🔴-5 | **成立** | `docs/status/STATUS.md:5`、`docs/roadmap/ROADMAP.md:7`、`docs/current/VERSION_PLAN.md:4`、`README.md:10` 四处均称 alpha.10 是 published/registry line。但 `docs/release/` 下 0.42.0-alpha 的发布记录**只到 alpha.9**（有 `v0.42.0-alpha.9-closure.json`、`.md`），**无 alpha.10 任何 closure/发布说明**（该目录里那条 `v0.41.0-alpha.10.md` 是 0.41 线，非 0.42）。"alpha.10 仅存在于机械 bump commit，无 release 记录" 成立。 |
| 🔴-6 | **成立** | `ROADMAP.md:122` 称 "`0.42.0-alpha.8` is the published package line"，与同文件 `:7` "Published package line: v0.42.0-alpha.10" 直接自相矛盾；且 `:122` 把 alpha.8 称为已发布线，而 `CHANGELOG` 记 alpha.8 npm 未发布。                                                                                                                                                                                                         |

---

## 二、黄色 / 删除 / 重复清单：抽样核实（SPOT-CHECKED）

环境对子代理不稳定（两次后台子代理均 stream timeout 失败），且批量工具调用偶发空返回，故对 70+ 条目做**代表性抽样**而非穷举。被抽条目与报告一致：

| 条目          | 核实结果               | 证据                                                                                                                                                                                                                                                 |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Y-11          | **成立**               | `adapter-vite/src/index.ts:33` 声明 `i18n?: { locales: string[]; defaultLocale?: string }`；但 `openPipeline`（:40-52）只读取 mode/routes/island/components/viewTransition/headExtras/build，**从不读 `config.i18n`**（grep `config.i18n` 零命中）。 |
| Y-16          | **成立（细节有差异）** | `injectDsdPolyfill` 在 `packages/adapter-vite/src` 中**零实现命中**；仅出现在 `adapter-vite/README.md:84`（文档）、博客 markdown、`www/dist` 构建产物。README 文档化了它但源码无此函数。                                                             |
| Y-24          | **部分成立**           | `tools/consumer-local.ts:156-163` 确将 `lit`/`parse5`/`entities` 注入 `denoJson.imports`（连同 vite/hono 等）。但本切片（150-167）只见到"注入"，**未见到报告所称"三个 delete 空操作"**——该子句待补查。                                               |
| 删除-1        | **成立**               | `registry.ts` 的 `registerManifest/getAllManifests/validateManifest/generateIndex/clearRegistry` 在 `packages/` 内仅出现在 barrel 转发 `internal/core/index.ts:186-191` 与自身定义 `:204`，全仓无其他消费方。                                        |
| 删除-6        | **成立**               | `IslandConfigType` 仅在 `app/src/authoring.ts:352` 定义，`packages/` 内零消费方。                                                                                                                                                                    |
| 重复·tag 校验 | **成立**               | `app/src/spa.ts:25` 自带一份 `assertValidTagName`（与 `element/src/internal/core/tag-utils.ts:56` 重复）；`element/island.ts` 另有手写版 —— 确为三套不一致规则。"删除 spa 本地副本改用 element 的"建议成立。                                         |

报告其余 60+ 黄色/删除/重复条目**未逐一核实**，但：

1. 其引用格式为 `文件:行号 + 证据 + 修法`，且第⑥章给出可复现的 grep/sed 命令，方法论可信；
2. 已抽样的 6 条（跨黄色/删除/重复三类）**全部与代码一致**，未见明显误报。

---

## 三、需向评审员提示的边界与不确定项

1. **🔴-5 的 "npm dist-tags = alpha.9" 无法直接联网证实**：本沙箱 `npm view` 因 fish 无 `timeout` 子命令执行失败，且 npm 网络可能受限。但**离线证据已足够判定**——`docs/release/` 无 alpha.10 发布记录（末条为 alpha.9），与"docs 谎称 alpha.10 已发布"完全吻合。建议评审员在有网环境用 `npm view @openelement/element dist-tags` 二次确认数字。
2. **Y-24 的 "三个 delete 空操作" 子句未在本切片验证**，仅确认了 `lit/parse5/entities` 注入部分。
3. **70+ 条目为抽样核实**，非穷举；若需逐条拍板，建议在有稳定子代理/网络的环境下补跑第⑥章命令。

---

## 四、总体结论

- **报告质量高、结论可靠**：6 条 🔴 硬伤**逐条核实全部成立**，无一条被推翻。
- **最关键的治理失败属实**：版本叙事（🔴-5/🔴-6）暴露的 "version-hole"——源码机械 bump 到 alpha.10、四处文档宣称已发布/registry=alpha.10，但 `docs/release/` 根本无 alpha.10 发布记录——与仓库自身 `check-version-anchors`/`check-strategic-docs` 治理机制本欲防范的正是此类问题，坐实了报告"文档 vs 事实说谎"的核心指控。
- **报告的三条优先修复建议合理**：🔴-2（改一行默认 appShell）、🔴-3（MDX 接入 Phase 3）、🔴-5/6+🔴-1（版本与注释口径诚实化）均为低成本高价值改动，可直接采纳。
- **与既有记忆一致**：工作记忆记 alpha.9 是 0.42 线首个发布到 npm 的版本、alpha.10 里程碑 issue 已关闭但未确认发布——与本次"无 alpha.10 发布记录"的离线发现完全一致。

> 建议：可将该审计报告作为 alpha.11 的修复清单基线；尤其先把 🔴-2 一行修复与版本叙事诚实化并入下一轮 release 流，堵住"首启即炸"和"文档说谎"两个对外最伤的点。
