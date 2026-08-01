# openElement 第四轮审计：一致性 / 整洁 / 可靠性 / 冗余度（round 4 hygiene sweep）

- 审计日期：2026-08-01（晚于同日的 positioning / verification / senior 三份报告）
- 审计主题：一致性、代码整洁、可靠性、**冗余度**（多余文件 / 多余代码 / 重复实现 / 死代码 / 死文档）
- 方法论：8 个只读分区审计代理并行扫描（element / app / adapter-vite / ui+create / tools / docs / www / 根目录+examples），所有「死代码/死导出」结论均经全仓 Grep 引用验证（排除 node_modules/vendor/dist/.git，覆盖 deno.json tasks/exports、.github/workflows、www、e2e、fixtures、tools）；所有「文档漂移」结论均给出代码侧或版本事实反证。协调者（本报告）对 90 条原始发现做了跨分区去重与对既有 issue 的去重。
- 去重基线：同日三份报告（positioning 6 🔴 已在当日修复冲刺中关闭）；既有 open issues #665–#724（重叠项不再新开，两处补充证据以评论形式追加到 #675 / #690）。

<!-- audit-citations-baseline-sha: 735c4b7b7b5cbc993f989426b67d0a0da65f2991 -->

- 引用时效护栏：本报告所有 `file:line` 引用已由 `tools/check-audit-citations.ts` 复核（working tree @ HEAD `735c4b7b`）。重构后运行 `deno run -A tools/check-audit-citations.ts` 复核漂移；`--sha=<commit>` 可针对历史提交复核。

---

## 处置总览

原始发现约 90 条，去重后 80 条。其中 **28 条新发现已提 issue #725–#752**，全部归入里程碑 `v0.42.0-alpha.10`（#17）并打 `alpha.10` 标签；与既有 issue 重叠的不再新开；少量 low 项（约 20 条）未提单，汇总在本文「未提单的 low 项」一节。

| 维度     | high | medium | low | 说明                                     |
| -------- | ---- | ------ | --- | ---------------------------------------- |
| 一致性   | 3    | 10     | 8   | 文档/常量/映射漂移为主                   |
| 代码整洁 | 0    | 3      | 12  | 头注释、复制粘贴命名、悬空注释           |
| 可靠性   | 5    | 6      | 5   | 含两个「下次发版必炸」项                 |
| 冗余度   | 3    | 13     | 12  | 本轮重点：死代码/死文档/重复实现约 35 条 |

## Issue 映射（#725–#752，里程碑 v0.42.0-alpha.10）

### P1（发版/发布正确性、门面文档失实）

| Issue | 标题                                                                        | 要点                                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #725  | fix(adapter-vite): undeclared transitive dependency `typescript`            | `src/internal/content/nav/scanner.ts:13` 经包根可达，deno.json 未声明，发布包消费端加载即炸（monorepo 内被根 deno.json:21 掩盖）                                      |
| #726  | fix(ui): JSX children double-escaped                                        | `open-input.tsx:139,163`、`open-dialog.tsx:122`、`open-callout.tsx:73` 先 `escapeHtml` 再作 JSX child；CSR 显示字面 `&amp;`，SSR 输出 `&amp;amp;`，无测试锁定         |
| #727  | fix(tools): check-public-docs-integrity hardcoded `alpha.11` guard          | `tools/check-public-docs-integrity.ts:57` 与 `tools/check-version-anchors.ts:57` 在下次 bump 时直接矛盾，发版必炸                                                     |
| #728  | docs(integrations): fresh guide + third-party-wc 引用退役 @openelement/core | `docs/integrations/open-element-in-fresh.md:77` import 不存在的 `@openelement/core/hydrate`；`using-third-party-web-components.md:13,50,71` 三处 jsxImportSource 错误 |
| #729  | docs(current): ISR_KV_ADAPTER 契约样例不可编译                              | `docs/current/ISR_KV_ADAPTER.md:32,50,60,79`：类型不可公开导入、样例读不存在的 `entry.tags`、`purgeTag` 列为必需但 runtime 从不调用                                   |
| #730  | docs(www): 多页面宣称未发布 alpha.10 是 published/stable                    | `changelog.tsx:102,121,138`、`roadmap.tsx:401,411`、`index/index.tsx:254`；同根因：`check-version-anchors.ts:61,69` 门禁句式在强制失实表述                            |

### P2

| Issue | 标题                                                                  | 要点                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #731  | fix(app): SPA 链静默吞 redirect()/notFound()                          | `spa.ts:66-70,182-184` 不识别 redirect duck type，与服务器链 `entry-render-helpers.ts:365` 行为相反，无集成测试                                                               |
| #732  | fix(adapter-vite): cli/start.ts 与 CI fixture server 复制粘贴且已漂移 | `start.ts:26-63` vs `__fixtures__/request-time/e2e/server.ts:27-77`：MIME 表缺 `.xml`（sitemap 发错 Content-Type）、候选规则不同；CI 验证的不是用户拿到的 server              |
| #733  | fix(adapter-vite): alias-utils 映射已删/不存在子路径                  | `alias-utils.ts:37`（app `hono` 指向已删文件）、`:50-51`（element `open-element-render`/`open-element-hydration` 非导出子路径）                                               |
| #734  | fix(www): build-output showcase 体积预算是空断言                      | `build-output.test.ts:34-36,56-59` chunk 前缀名对不上，恒 0 字节永远通过                                                                                                      |
| #735  | fix(www): apilist.tsx 文档化不存在的子路径                            | `apilist.tsx:116`（app 多 `hono` 缺 `i18n`）、`:128`（adapter-vite 缺 cli/start、cli/preview）；页面脚注谎称被 package-surface:check 机检                                     |
| #736  | docs(current): STACK_CONTRACT 仍列 #390 为 stable 条件                | `STACK_CONTRACT.md:38-39` 与 ADR-0119:38-42 直接矛盾                                                                                                                          |
| #737  | ci: docs/integrations 不在任何 truth gate 覆盖内                      | `check-public-docs-integrity.ts:8-21` 不盯 integrations，#728 类腐烂 CI 拦不住                                                                                                |
| #738  | docs(examples): 示例卫生——reader VERIFICATION 引用不存在 task 等      | reader 无 `start`/`test` task（实跑失败）、README 列退役包、fresh 示例停滞 alpha.4 无 CI、成员 deno.lock 冗余                                                                 |
| #739  | refactor(element): 折叠三套重叠内部 barrel                            | `internal/core/index.ts:21-211` vs `static.ts:14-83` vs `hydrate.ts:12-56`，45+ 导出重复维护                                                                                  |
| #741  | chore(adapter-vite): 死 codegen/协议面                                | `entry-render-ssg.ts:41-50` 死 re-export 块、`protocol/ssg.ts:15-46,499-558` 两批死协议类型、`virtual:open-routes` 幽灵类型生成、build-context 死字段、blog 插件死输出        |
| #742  | chore(tools): 卫生清扫                                                | walk 四份拷贝、normalizeSlashes/exists/readJson 重复、`perf-request-time.ts` 一次性脚本、mod3 命名、手工 stale 清单双轨、接口快照文件名锚定 v0.41.0                           |
| #743  | chore(app): 卫生清扫                                                  | dev-mode 双探测互盲（`spa.ts:20-24` vs `data-context-store.ts:79-93`）、`ACTION_FETCH_HEADER` 双出口零消费（生成代码硬编码 5 处）、零消费导出、`spa.ts:134-140` 空 catch 漏网 |
| #744  | fix(ui): 生成的 manifest 漏报 named slots/cssParts                    | `generate-ui-manifest.ts:115-146` 只认 doc 注释，漏 `open-card.tsx:97,101`、`open-dialog.tsx:125,149` 等；README 过度承诺                                                     |
| #745  | fix(ui): 固定 ID 跨实例冲突                                           | `open-tabs.tsx:55-57,68-70`、`open-input.tsx:138-162` ARIA id 无实例唯一化（关联 #666）                                                                                       |
| #746  | chore(tools): 删除死 JSR 发布通道                                     | `run-package-graph-task.ts` publish 分支约 300 行 + `wait-jsr-release-metadata.ts` 239 行整体不可达，与「JSR 不再是发布渠道」政策矛盾                                         |

### P3

| Issue | 标题                                                 | 要点                                                                                                                                                                                               |
| ----- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #740  | chore(element): 死/重复代码清扫                      | `client-runtime.ts:141,206` 不可达（224 行，需决策）、`unwrapSignalLike`/`resolveSignalProp` 逐字节重复、`HydrationMarkerAttr` 死类型、`registerBindingKind` 零调用方、Show/For 匹配三处手写       |
| #747  | chore(ui): 卫生清扫                                  | code-block className 写死 language-typescript、theme-toggle 3 处空 catch、composed 策略不一致、StyleSheet 样板 11 份、`:host-context` 死分支、Pure B&W 注释失实                                    |
| #748  | chore(www): 死岛屿/图标/博客内容                     | reactive-showcase/scroll-reveal 被 `island-metadata.test.ts:23-24` 钉住、`design/icons` 与 public 23 个 SVG 逐字节重复、3 篇子目录博客管线不扫描、`hidden: true` 死字段                            |
| #749  | refactor(www): 14 个 guide 页同构复制                | 每页约 80 行逐字相同、10 页类名全叫 `GuideGuidePage`、guide 与 architecture 重复建页、zh 路由静默半成品                                                                                            |
| #750  | chore(create): README stale 子路径 + 模板卫生        | README 引用不存在的 `@openelement/app/vite`、模板 `--brand:#534ab7` 孤儿色值、resolveVersions 同语反复断言                                                                                         |
| #751  | chore(repo): hooks:uninstall 空操作 + 根目录报告归档 | deno.json:107 应为 `git config --unset`；6 份根目录审计/收尾报告的归档约定                                                                                                                         |
| #752  | docs: 归档卫生清扫                                   | `docs/architecture-audit-gao.md` 位置错/结论过时、ADR 编号碰撞 4 组、`0070-bridge-contracts.md` 全文乱码、dogfood 两文档滞留 0.41 alpha、roadmap/v0.16.md 死文档、current 四文件自称 "v0.41 alpha" |

### 既有 issue 补充（评论）

- #675（adapter-vite README 面）：追加 README.md:50-52（nitro handler re-export 不存在）、:61+:92（packageIslands 机制描述错误）、:65（pwa 选项不存在）。
- #690（STATUS 表漂移）：追加 STATUS.md:69 "active TP-5.7 alpha.7" 已过时、VERSION_PLAN 缺 TP-5.8 记录（提交 1041431f）。

## 与既有 issue 重叠、未新开的主要发现

- adapter-vite README 引用已删子路径 plugin/app-vite → #675（+ #719 injectDsdPolyfill）
- `internal/content/mdx/` 整目录死代码（含未声明 `@mdx-js/mdx` 依赖）→ #694
- i18n 三跳 re-export 链 → #712；`filePathToBracketRoute` 重复实现 → #711；JSONC 剥离两套 → #708；protocol seam shells 合并 → #697；test-only ssg 包装 → #696
- STATUS 版本表/ hygiene 编号归属 → #690；start CLI 跨运行时叙事 → #689；www getting-started 陈旧文案 → #692；ROADMAP 表 → #691
- open-tabs 键盘导航/aria → #666（本轮回补 #745 跨实例 ID）

## 未提单的 low 项（记录备查）

- element：29 个文件头注释自称 `./index.ts`（拆分残留）；`open-element-render.ts:46-73,81-106` 近重复（renderIntoLightDom/ShadowRoot）；`open-element-implementation.ts:531` 叙事式删除注释。
- adapter-vite：文件头注释漂移一串（`entry-renderer.ts:2` 自称 @openelement/element 等 6 处）；`internal/ssg/postprocess.ts:266-283` 悬空 docblock；`build-postprocess.ts:93-111` 不可达外层 catch；`cli/preview.ts:31` 硬假设 Deno；`cli/start.ts:199-201` 主模块探测启发式；`internal/ssg/ssg-helpers.ts:214-228` vs `internal/ssg/postprocess.ts:198-204` 注入逻辑两处（可接受，建议互加交叉引用）。
- app：`formatJson` 与 tools 重复（已并入 #742）。
- tools：lib 死导出 readText/StripLineResult（已并入 #742）。
- www：`open-search.tsx:300-302` 静默吞错；guide/security 与 guide/migration 两页无视觉基线（`visual-baselines.spec.ts:32-43`、`page-structure.spec.ts:10-24` 路由清单外）；历史 ADR 博客 86 处 less-core/lessjs 引用（建议渲染时加存档横幅）。
- examples：reader/mastodon 小尺度复制粘贴（vite.config/router.ts/README 尾段，定位为独立模板可容忍）。
- docs/current 四文件 "v0.41 alpha" 自称（已并入 #752）。

## 抽查确认无问题的区域

- 五包版本号一致（0.42.0-alpha.10）；deno.json 80 个 task ↔ tools 文件双向可达；autoflow GATES 引用的 41 个 task 全部存在；.github/workflows 全部 deno task 引用有效。
- createLogger 全仓单实现（85 处引用同源）；escape 系列已合并单一 ESCAPE_MAP；tag 校验已统一 tag-utils；prop 过滤已收敛 collectPublicProps。
- MORPH_CONTRACT 12 个 survival-matrix 测试名与 fixture live.spec.ts 全吻合；PACKAGE_SURFACE 机器映射与各包 deno.json exports 一致。
- 生成产物同步：ui manifest/tokens 实跑生成器 diff 逐字节一致；www `_generated-nav.ts` 与路由 meta 28 条全同步。
- 空 catch 清理基本无回潮（漏网 4 处已提单：app #743、ui #747、adapter-vite 低优先级 1 处、www open-search）。
- audit 目录历史 findings 全部闭环（#632–#644 13/13 CLOSED 等）；.gitignore 覆盖正确（.DS_Store/dist/报告目录均未跟踪）。

## 后续建议

1. P1 六条（#725–#730）建议作为 alpha.10 发布前的船闸项：两条「必炸」（#725 发布依赖、#727 发版门禁）和四条门面失实直接影响发布可信度。
2. element 内部 barrel（#739）与 adapter-vite 死协议面（#741）是下一轮重构的最大漂移源，建议在 TP-6 冻结前处理。
3. #737（integrations 无门禁）是本轮 high 文档腐烂的制度性根因之一，值得优先于单点修文档。

---

## 引用时效复核（自动生成）

> 本附录由 `tools/check-audit-citations.ts` 生成。基线：当前工作树。
> 引用总数：51；漂移：0。

全部引用均能在基线中解析，无行号漂移。
