# OpenElement 0.42.0-alpha.9 稳定性与发布就绪度审计报告

- **审计对象**：OpenElement 0.42.0-alpha.9（Deno + Vite + Preact，Web Component / Islands SSR-SSG 框架）
- **审计时间**：2026-07-30
- **审计模式**：只读审计，未修改任何文件
- **审计方法**：代码静态审查 + grep 空异常 + npm/gh/git 实证 + Playwright fixture 与 E2E 用例核查
- **仓库**：`open-element/openelement`，分支 `main`
- **当前 tag**：`v0.42.0-alpha.9`（commit `2872999b`）

---

## 一、结论速览表

| 检查项                                   | 优先级 | 状态                               | 关键证据                                                                                                                                                                                                                                                                                                                                         | 建议                                                                                                                                           |
| ---------------------------------------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A. shadow DOM 事件流（form 冒泡）        | P0     | **PASS（带测试缺口）**             | `packages/app/src/spa.ts:160-207` 用 `composedPath()` 反查真实 form；`packages/adapter-vite/src/internal/ssg/entry-generators.ts:538-672` shadow root 递归挂 submit 监听                                                                                                                                                                         | 见 A 节缺口                                                                                                                                    |
| A. shadow DOM 事件流（morph 后状态保留） | P0     | **PASS**                           | `entry-generators.ts:321-372 __islandIntact` + `449-491 __morphNode`；E2E `live.spec.ts:131-176,448-460` 断言 count 保持                                                                                                                                                                                                                         | —                                                                                                                                              |
| A. applyEvent 裸 addEventListener        | P0     | **PASS（α9 已修，留有复发风险）**  | `binding-activation.ts:498-522` 仍裸 `addEventListener`；`open-button.tsx:232` 已改箭头字段（#637）；其余组件全用箭头包装                                                                                                                                                                                                                        | 加 dev-only 守卫                                                                                                                               |
| A. shadow DOM 事件流测试覆盖             | P0     | **WARN**                           | `live.spec.ts` 覆盖无 JS / morph / region；但 `open-button type=submit` 嵌套在另一 WC shadow root 的 E2E = 0 命中                                                                                                                                                                                                                                | 补端到端用例                                                                                                                                   |
| B. publish-existing 管道 npm 硬门禁      | P0     | **PASS（仅限该路径）**             | `tools/autoflow/release.ts:264-289` publishSteps（publish→verify-npm-release→consumer-smoke→third-party-wc-smoke）先于 tagSteps；`runReleaseStep` 失败即抛错                                                                                                                                                                                     | —                                                                                                                                              |
| B. α9 实际发布路径的 npm 门禁            | P0     | **FAIL（证据链双重缺陷）**         | α9 实际 publish run `30553856284`（"AutoFlow Publish Existing", workflow_dispatch, conclusion=**failure**，冗余 re-tag 假失败，publish+verify+smoke 在失败前已过）；但 autoflow3 快照 `successfulReleaseRun` 指向的是更早的 PR CI run `30550568968`（"AutoFlow CI", event=pull_request），快照 `kind:"release"` 仅 3 步，无 publish/verify/smoke | 修复证据捕获：publish-existing run 失败也持久化证据；`successfulReleaseRun` 必须指向真正含 publish 的 run；所有 release 路径强制+记录 npm 校验 |
| C. α8 版本空洞                           | P1     | **FAIL（已确认空洞）**             | `npm view @openelement/element@0.42.0-alpha.8` → 404；git tag `0ec10568` 在；GitHub Release 2026-07-29T19:08:23Z 在；`docs/release/` 无 α8 closure.json，仅 `.md` 标 `incomplete`                                                                                                                                                                | 维持现状（已被 α9 取代），但应在 STATUS / VERSION_PLAN 显式标注 α8=skipped                                                                     |
| C. α9 npm 真实性                         | P1     | **PASS（包在）+ 文档错误**         | 5 包 `npm view` 全返回 `0.42.0-alpha.9`；`dist-tags.alpha=0.42.0-alpha.9`；但 CHANGELOG.md:31 与 release note 写"unpublished-to-npm"——**与事实矛盾**                                                                                                                                                                                             | 立即更正 CHANGELOG:31 与 v0.42.0-alpha.9.md 的发布状态描述                                                                                     |
| D. 静默吞错（关键路径）                  | P1     | **WARN（实际低于传闻）**           | 全仓 `catch {` 共 ~46 处（packages/）；抽查关键路径：`island.ts:87` 有 `log.warn`、`spa.ts:150` 返回 undefined、`render-dsd.ts:366` 注释跨域跳过、`client-router.ts:128/136` decode fallback、`ssg-render.ts:132` fs probe。真正"静默且关键"的很少                                                                                               | 见 D 节清单，补 dev 日志                                                                                                                       |
| E. CHANGELOG α7/α8                       | P1     | **FAIL**                           | `CHANGELOG.md` 仅有 α1-α6、α9 条目；**缺 α7、α8**                                                                                                                                                                                                                                                                                                | 补 α7/α8 条目（α8 标 incomplete）                                                                                                              |
| E. docs/release note + closure           | P1     | **WARN**                           | α1-α7、α9 closure+note 齐全；**α8 仅 .md 无 closure.json**（by design，因未发布）                                                                                                                                                                                                                                                                | 可接受，但建议 α8 .md 顶部加红色"版本空洞"横幅                                                                                                 |
| F. 无 JS 表单闭环                        | P2     | **PASS**                           | `entry-render-helpers.ts:131-454` 服务端 action：303 PRG / 422 重渲染 / CSRF 同源地板 / 10MB 限制；`live.spec.ts:116-129` `javaScriptEnabled:false` 实测闭环                                                                                                                                                                                     | —                                                                                                                                              |
| G. MemoryIsrCache 多实例一致性           | P2     | **FAIL（高危：ISR 运行时未接线）** | `isr.ts:64-118` 进程内 LRU max 1000 无 TTL 驱逐；`CacheAdapter.purgeTag` 接口未实现；ADR-0038 承诺的 CfKv/DenoKv 适配器零实现；**`ssg-helpers.ts:178-235` 请求时入口从不调用 `renderIsrResponse`**，ISR 契约存在但运行时未消费                                                                                                                   | 见 G 节，这是 0.42 最大的文档-实现背离                                                                                                         |
| 附. GitHub Release prerelease 标记       | P3     | **WARN**                           | α8/α9 GitHub Release `isPrerelease:false`（alpha 应为 true）                                                                                                                                                                                                                                                                                     | 发布脚本设置 `--prerelease`                                                                                                                    |

---

## 二、逐项详细发现

### A. shadow DOM 事件流正确性（P0）— PASS（带 1 处测试缺口）

**A1. enhanced form 提交冒泡** — 两条路径均已正确处理 shadow DOM：

- **SPA 路径** `packages/app/src/spa.ts:160-207`：根级 `submit` 监听器，`handleFormSubmit` 在 `event.target` 被 shadow 重定向时用 `event.composedPath()` 反查真实 `<form>`（注释 161-168 明确说明 retargeting）。
- **SSG 增强路径** `packages/adapter-vite/src/internal/ssg/entry-generators.ts:538-560`：`__scanSubmitRoots` 递归进入每个 `el.shadowRoot` 并在各 shadow root 上挂 submit 监听器，注释 545-548 写明"submit 事件跨引擎不可靠 composed，故 shadow 内增强表单在 root 拦截"。`__onSubmit`（578-672）走 `fetch + __morphDocument`。
- **`<open-button>`** `packages/ui/src/open-button.tsx:268-292`：`_submitForm` 显式 `new SubmitEvent('submit', { bubbles:true, cancelable:true, composed:true })` 重派发到 form，未 preventDefault 时回退 `requestSubmit()`。

**A2. morph 后 island 状态保留** — 是。已水合 island 在 light-DOM 表面未变时整体保留（不替换、不 re-hydrate），`@preact/signals` 状态因此保留；表面变化时整节点替换（状态重置 by design）。证据：`entry-generators.ts:321-372 __islandIntact` + `449-491 __morphNode`（island 分支 `if (__islandIntact) return;` 保留）。E2E 验证：`live.spec.ts:131-144`（PRG morph count=1）、`148-161`（422 count=3）、`163-176`（count=2）、`448-460`（list prepend island 保留）。

**A3. applyEvent 裸 addEventListener** — `binding-activation.ts:498-522`（第 511 行 `el.addEventListener(type, handler, listenerOptions)`）**仍为裸调用，无 `.bind(this)`**。`this` 绑定责任在调用方。α9 已将 `<open-button>` 的 `_handleClick` 改为箭头函数字段（`open-button.tsx:232`），#637 已修复。全 `packages/ui/src` grep 仅 open-button 一处 `onClick={this._*}` 且已是箭头字段；其余组件（open-input/open-dialog/open-tabs/open-dropdown/open-code-block/open-theme-toggle）全用箭头包装。**复发风险**：`applyEvent` 自身不防御 this 丢失，未来新增组件若用原型方法裸传 `onClick={this._method}` 会重现 #637 类 bug。

**A4. 测试缺口（唯一 WARN）**：

- 已覆盖：`live.spec.ts:116-129`（`javaScriptEnabled:false` 无 JS 表单闭环）、`131-176/448-460`（morph 状态保留）、`345-382`（region-scoped morph）；单元 `open-button-click.test.ts:116-170`（handler 引用稳定性 + href 分支不提交）、`components.test.ts:568-597`（type=submit 派发 composed submit）。
- **缺口 1**：无 E2E 覆盖 `<open-button type="submit">` 嵌套在**另一个 Web Component 的 shadow root 内**的端到端闭环。所有 fixture 的 form 均用原生 `<button type="submit">`（grep `open-button.*submit` 在 `__fixtures__` 下 0 命中）。composed submit 跨多层 shadow boundary 到达 root listener 的链路只在单元层验证了 dispatch，未在真实浏览器 + 真实 SPA/morph root listener 下验证。
- **缺口 2**：无测试断言 `__scanSubmitRoots` 在 morph 后对动态新增 shadow root 的重新挂载（仅 line 642 调用，无断言）。

### B. 发布流程健壮性（P0）— FAIL（α9 实际路径未受门禁）

**B1. 工作流清单**：`.github/workflows/` 发布相关 3 个：

- `autoflow-release.yml`（"AutoFlow Publish Existing"）：`workflow_dispatch` 手动触发，唯一步骤 `deno task autoflow:publish-existing --to <version>`。这是标准发布管道。
- `published-consumers.yml`：发布后消费者资格验证，独立运行，不阻塞发布。
- `autoflow-ci.yml`：push/PR 触发，跑全套 gates。

**B2. publish-existing 路径的 npm 硬门禁（PASS）**：`tools/autoflow/release.ts:264-289` 的 `publishSteps` 依次为：

1. `publish npm packages` → `deno task publish:npm`
2. `verify npm versions and dist-tags` → `tools/verify-npm-release.ts`（对 5 包分别 `npm view`，6 次重试，预发布校验 `dist-tags.alpha`）
3. `post-publish npm consumer smoke` → `tools/consumer-smoke.ts`（临时项目 `npm install` + import 运行 `isVNode`）
4. `post-publish third-party WC smoke` → `deno task third-party-wc:smoke`（lit/shoelace/material-web 可消费）

`runReleaseStep`（release.ts:977-979）失败即抛 `Release step failed`，`executeReleasePlan` catch 后标记 evidence `failed` 并重抛，工作流 FAIL。这些步骤在 `tagSteps` **之前**（release.ts:414-431：base→publish→evidence→push→tag），故 npm 失败会阻塞 tag。**该路径下不存在"npm 失败但 tag 仍创建"的风险。**

**B3. α9 实际发布路径的证据链双重缺陷（FAIL）**：

经 gh 实证两个 run，α9 的发布实际跨两个 run，证据链存在双重缺陷：

- **实际 publish run `30553856284`**：workflow = "AutoFlow Publish Existing"，event = workflow_dispatch，conclusion = **failure**。该 run 跑了完整 publish-existing 管道（publish npm → verify-npm-release → consumer-smoke → third-party-wc-smoke，均通过），但末步 `tag release` 因 tag `v0.42.0-alpha.9` 已存在报 `Refusing to overwrite existing tag` 而"失败"（冗余 re-tag 假失败，npm 包实际已上线）。**因为该 run conclusion=failure，其证据从未被持久化到 autoflow3 快照。**
- **autoflow3 快照引用的 run `30550568968`**：workflow = "AutoFlow CI"，event = **pull_request**（PR #645 的 CI run），conclusion = success。快照 `v0.42.0-alpha.9.json` `kind:"release"`，仅 3 步（`verify main CI success for HEAD` / `package artifact gate` / `merge release pull request #645`），**完全没有 publish/verify-npm/consumer-smoke/third-party-wc-smoke 步骤**。closure.json 与 release note 的 `successfulReleaseRun` 也指向这个 PR CI run。
- `npm view @openelement/{element,app,adapter-vite,ui,create}@0.42.0-alpha.9` **全部返回 `0.42.0-alpha.9`**，`dist-tags.alpha=0.42.0-alpha.9`。5 包确在 npm。

**双重缺陷**：

1. **证据缺失**：α9 的 durable autoflow3 证据不含 publish/verify/smoke 步骤——npm 校验发生在 run 30553856284 内，但该 run 失败，证据未被捕获。
2. **指向错误 run**：`successfulReleaseRun` 指向 run 30550568968（一个 PR CI run），而非真正执行 publish 的 run 30553856284。

**风险推演**：若未来某次 publish-existing run 在 verify-npm-release **之前**失败（例如 npm publish 本身失败），registry 将为空，但 durable 证据（从 PR-merge "release" 路径捕获）仍会显示绿色并引用一个通过的 CI run——这正是 α8 空洞的结构性成因，只是 α8 连 PR-merge 证据也没捕获。**当前架构下，publish-existing run 的 conclusion=failure 会阻止证据持久化，使真正包含 npm 校验的证据永远无法进入 durable 链。**

**B4. release:evidence:check**：`tools/check-release-evidence-consistency.ts` 校验 tag 存在 + closure.json 存在 + tag commit 一致 + autoflow3 快照一致性 + 祖先关系 + release note 存在。它是 `autoflow:ci` 的 ci/release tier gate（policy.ts:160-169），main CI 会因此阻塞下一次 publish-existing。**但它只校验"证据文件存在且自洽"，不校验"证据是否包含 publish 步骤"**——所以 α9 的 3 步不完整证据能通过校验。

### C. 版本一致性（P1）— α8 空洞确认 + α9 文档错误

**C1. α8 版本空洞（FAIL，已确认）**：

| 维度           | 状态    | 证据                                                                                        |
| -------------- | ------- | ------------------------------------------------------------------------------------------- |
| git tag        | ✅ 在   | `v0.42.0-alpha.8` → `0ec1056854e19fe4128b0876dd640e8c3bf5d4a4`                              |
| GitHub Release | ✅ 在   | `gh release view` → published 2026-07-29T19:08:23Z, isPrerelease:false                      |
| npm 包         | ❌ 不在 | `npm view @openelement/element@0.42.0-alpha.8` → **404**                                    |
| closure.json   | ❌ 不在 | `docs/release/` 仅有 `v0.42.0-alpha.8.md`，无 `-closure.json`                               |
| autoflow3 快照 | ❌ 不在 | `docs/release/autoflow3/` 无 `v0.42.0-alpha.8.json`（α7、α9 都有）                          |
| release note   | ✅ 补写 | `v0.42.0-alpha.8.md` 标 `Status: incomplete`，明述"npm publish step of the pipeline failed" |

**处理建议**：α8 已被 α9 取代，无需回填 npm。但应在 `docs/status/STATUS.md` / `VERSION_PLAN.md` 显式标注"α8 = skipped/npm-unpublished prerelease"，避免未来 `release:evidence:check` 在 α8 tag 上误判，也避免消费者误装。

**C2. α9 npm 真实性（PASS）+ 文档错误（FAIL）**：

- 5 包全在 npm：`element/app/adapter-vite/ui/create` @ `0.42.0-alpha.9` 全部 `npm view` 成功。
- `dist-tags`：`latest=0.41.2`，`alpha=0.42.0-alpha.9`。
- **文档错误**：`CHANGELOG.md:31` 写"tag `v0.42.0-alpha.9` is unpublished-to-npm (source train only)"；`docs/release/v0.42.0-alpha.9.md` evidence 只列 3 步无 publish。**两者都与 npm 事实矛盾**。推测：release note 在 npm publish 之前撰写（evidence 仅记录到 merge PR #645），publish 随后单独完成但未回填证据与文档。
- **建议**：立即更正 CHANGELOG:31 与 v0.42.0-alpha.9.md，补录 npm publish 事实；并追溯 α9 实际 publish 命令，补全 autoflow3 快照的 publish/verify/smoke 步骤记录。

### D. 静默吞错盘点（P1）— WARN（实际风险低于传闻）

全仓 `catch {`（无绑定）共 ~46 处（packages/）。逐项抽查关键路径，**多数有正当理由**，并非全静默：

| 文件:行号                                                        | 上下文                   | 是否静默                    | 评级              |
| ---------------------------------------------------------------- | ------------------------ | --------------------------- | ----------------- |
| `packages/element/src/internal/core/island.ts:87`                | `getSsrProps` JSON.parse | **有 `log.warn`**           | ✅ 非静默         |
| `packages/element/src/internal/core/errors.ts:176`               | 错误报告器自身           | 注释 `/* must not throw */` | ✅ 合理           |
| `packages/element/src/internal/core/hydration-scope.ts:297,304`  | dispose/cleanup          | 注释 ignore                 | ✅ 合理（清理）   |
| `packages/element/src/internal/core/render-dsd.ts:366`           | 读取 cssRules            | 注释"跨域 stylesheet 跳过"  | ✅ 合理           |
| `packages/element/src/internal/core/client-runtime.ts:128`       | disposeScope             | 注释 ignore                 | ✅ 合理（清理）   |
| `packages/app/src/spa.ts:150`                                    | createFormData           | 返回 undefined，下游处理    | ⚠️ 无日志，但可控 |
| `packages/app/src/internal/router/client-router.ts:128,136`      | decodeURIComponent       | 返回原值 fallback           | ✅ 合理           |
| `packages/app/src/internal/router/data-context-store.ts:85`      | data context             | **需关注**                  | ⚠️ 待查           |
| `packages/adapter-vite/src/internal/ssg/ssg-render.ts:132,345`   | fs probe / render        | 返回 false / fallback       | ⚠️ 渲染路径无日志 |
| `packages/adapter-vite/src/internal/ssg/entry-generators.ts:104` | entry 生成               | **需关注**                  | ⚠️ 待查           |
| `packages/adapter-vite/src/internal/ssg/ssg-dynamic.ts:263`      | 动态 SSG                 | **需关注**                  | ⚠️ 待查           |
| `packages/adapter-vite/src/plugin.ts:141`                        | vite 插件                | **需关注**                  | ⚠️ 构建路径       |
| `packages/adapter-vite/src/cli/build-client.ts:54,109,135`       | CLI build                | **需关注**                  | ⚠️ 构建路径       |
| `packages/adapter-vite/__tests__/*` 多处                         | 测试 teardown            | 注释 ignore                 | ✅ 合理（测试）   |

**结论**：prompt 所称"93 空 catch / 111 未用 e"包含 vendor/ 与测试代码，关键路径真正"静默且可能掩盖问题"的约 6-8 处（上表 ⚠️）。**最高优先级**：渲染路径（`ssg-render.ts:345`、`entry-generators.ts:104`、`ssg-dynamic.ts:263`）与构建路径（`plugin.ts:141`、`build-client.ts:*`）的空 catch 应至少加 dev 模式 `console.warn`，避免构建/渲染异常被无声吞掉。

### E. 文档完整性（P1）— CHANGELOG 缺 α7/α8

- **CHANGELOG.md**：grep `^## 0.42.0-alpha` 命中 α1、α2、α3、α4、α5、α6、α9。**缺 α7、α8**（确认）。
- **docs/release/**：α1-α7、α9 的 `-closure.json` + `.md` 齐全；α9 另有 `-plan.md`；α8 **仅有 `.md`（标 incomplete）无 closure.json**（因 npm 未发布，by design）。
- **autoflow3/**：0.42 线 α1-α7、α9 快照在；**α8 快照缺失**（印证 α8 管道在 evidence commit 前中止）。
- **建议**：补 CHANGELOG α7、α8 条目（α8 条目明标 `incomplete / npm-unpublished`）；α8 `.md` 顶部加显眼"版本空洞"标注。

### F. 无 JS 表单闭环（P2）— PASS

服务端 action 实现完整（`packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts:131-454`）：

- POST 注册 + 10MB body 限制（413 回退）；`Cache-Control: no-store` + `Vary: x-openelement-action`。
- `?/name` 命名 action 派发，`hasOwnProperty` 防原型污染；`x-openelement-action` 头切换 JSON/HTML 双通道。
- Origin / Sec-Fetch-Site 同源 CSRF 地板（可 `OPEN_ELEMENT_DISABLE_CSRF=1` 关闭）。
- 成功 = 303 PRG（剥离 `?/name`）；`fail()` = 422 重渲染带 `actionData`；`redirect()` 在 POST 强制 303。

Progressive enhancement：JS 启用走 `spa.ts:160-207` 根级 submit → fetch + morph；JS 禁用走原生 form POST → 服务端 action → 浏览器原生跳转。

测试覆盖：`live.spec.ts:116-129` `browser.newContext({ javaScriptEnabled: false })` 实测无 JS 闭环（303 跳转 + 422 错误回显）；同文件 53-92 用 curl 风格覆盖 303/422/命名 action/404/405/CSRF。

**小风险**：CSRF 全局开关 `OPEN_ELEMENT_DISABLE_CSRF=1` 缺按路由粒度；无 JS 路径 422 重渲染依赖 error 边界，未声明边界的路由会落到 500。

### G. 缓存与扩展（P2）— FAIL（ISR 运行时未接线，高危）

**G1. MemoryIsrCache**（`packages/element/src/internal/core/isr.ts:64-118`）：

- 进程内 LRU，基于 `Map` 插入序；`get` touch（删除重插），`set` 按 `maxEntries` 淘汰最旧。
- `maxEntries` 默认 **1000**，仅校验正整数；**无字节 size 限制**；**无真正 TTL**（`revalidate` 秒数仅把命中标 `stale`，不驱逐，stale 条目仍返回缓存 HTML）。
- `CacheAdapter` 接口（`protocol/isr.ts:14-20`）声明的 `purgeTag` **未实现**。

**G2. KV 适配器**：ADR-0038 承诺 v0.22 提供 `CfKvIsrCache` / `DenoKvIsrCache`，**全仓 grep 零实现**，0.42 仍未交付。

**G3. ISR 运行时未接线（最大背离）**：

- `renderIsrResponse` 在 `packages/element/src/internal/core/isr-runtime.ts:53-156` 实现了 blocking/background 再生。
- **但生产请求时服务器入口未调用它**：`packages/adapter-vite/src/internal/ssg/ssg-helpers.ts:178-235` 的 `renderRequestTimeServerModule` 直接 `app.fetch(request, ...)`，从不调用 `renderIsrResponse`；`packages/adapter-vite` 内 grep `MemoryIsrCache`/`renderIsrResponse` **零命中**。
- SSG 仍生成 `isr-manifest.json`（`ssg-helpers.ts:81-106`）与每路由 `revalidate` 字段（`entry-render-ssg.ts:70-72`），**但运行时无人消费**。

**G4. 多实例/边缘风险**：

1. 缓存不一致：每实例独立 Map，实例 A 再生后 HTML 不同步到实例 B，同 URL 不同实例返回不同版本。
2. action 写后不失效：POST 成功后无 `purgeTag`/跨实例失效通道，stale HTML 持续命中。
3. stale 永驻：stale 条目不驱逐，仅在 LRU 容量压力下淘汰，冷门页面 stale 长期存活。
4. 再生失败无退避：`isr-runtime.ts:118-130` 失败仅回调，无重试/错误 TTL。
5. **静默失效**：`revalidate: N` 路由声明在 0.42 等同普通 dynamic 路由，用户以为开启 ISR 实则未生效。

**结论**：ISR 契约（manifest + revalidate 字段 + CacheAdapter 接口）存在但运行时未接线，是 0.42 最大的"文档与实现背离"。多实例部署下进程内缓存天然不一致，必须自建 KV 适配器或外置 CDN 兜底。

---

## 三、总体稳定性结论

**整体成熟度**：α9 在**功能正确性**上已达到发布门槛——shadow DOM 事件流（A）、morph 状态保留（A）、无 JS 表单闭环（F）三条主线均有实现 + E2E 覆盖，α5/α6/α9 三轮审计加固效果可见。`<open-button>` #637 修复落地干净，全仓无残留裸方法引用。

**阻断性缺陷（必须在 0.42.0 正式版前解决）**：

1. **G（ISR 运行时未接线）**：ISR 契约存在但生产入口不消费，`revalidate` 声明对用户是"沉默的谎言"。要么接线 `renderIsrResponse`，要么在文档/类型层把 ISR 标为 `@experimental` 并从 SSG manifest 移除 `revalidate` 字段，避免误用。
2. **B3（α9 release 路径 npm 门禁缺失）**：`release`/approved-release 路径不强制+不记录 npm 校验，α9 的 publish 发生在证据链外。下一次该路径若 publish 失败而 PR 已合并，重演 α8 空洞。
3. **C2（α9 文档错误）**：CHANGELOG:31 与 release note 的"unpublished-to-npm"陈述与 npm 事实矛盾，会误导消费者与下游审计。

**非阻断但应修复**：

- A4 测试缺口（open-button 嵌套 shadow DOM 的 E2E）。
- D 渲染/构建路径 6-8 处空 catch 补 dev 日志。
- E CHANGELOG 补 α7/α8。
- GitHub Release α8/α9 应标 `isPrerelease:true`。

---

## 四、优先修复顺序

| 序 | 项                                                                                                                                          | 优先级 | 工作量                 | 理由                                |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------- | ----------------------------------- |
| 1  | **C2 更正 α9 发布状态文档**（CHANGELOG:31 + v0.42.0-alpha.9.md）                                                                            | P0     | 极小                   | 事实错误，立即误导，5 分钟可改      |
| 2  | **B3 所有 release 路径强制+记录 npm 校验**（让 `release` kind 也跑 verify-npm-release + consumer-smoke 并写入 autoflow3 步骤）              | P0     | 中                     | 防止 α8 空洞重演，是发布工程根本    |
| 3  | **G ISR 决策**：接线 `renderIsrResponse` 或显式降级 ISR 为 experimental（移除 manifest revalidate 消费承诺）                                | P0     | 大（接线）/ 小（降级） | 文档-实现背离，影响用户信任         |
| 4  | **E 补 CHANGELOG α7/α8**（α8 标 incomplete）                                                                                                | P1     | 小                     | 发布记录完整性                      |
| 5  | **A4 补 open-button 嵌套 shadow DOM 的 E2E**                                                                                                | P1     | 中                     | 唯一事件流测试缺口，#637 类回归防线 |
| 6  | **D 渲染/构建路径空 catch 补 dev 日志**（ssg-render.ts:345、entry-generators.ts:104、ssg-dynamic.ts:263、plugin.ts:141、build-client.ts:*） | P1     | 小                     | 可观测性                            |
| 7  | **G2 交付至少一个 KV 适配器**（DenoKvIsrCache 最简）或文档明确"自建"                                                                        | P2     | 中                     | 多实例/边缘部署前置                 |
| 8  | **GitHub Release prerelease 标记** + α8 STATUS/VERSION_PLAN 显式标注 skipped                                                                | P3     | 极小                   | 卫生                                |

---

## 五、审计证据附录（关键命令输出）

```
# α8 npm 空洞
$ npm view @openelement/element@0.42.0-alpha.8 version
npm error 404 ...

# α9 npm 真实
$ npm view @openelement/element@0.42.0-alpha.9 version
0.42.0-alpha.9
$ npm view @openelement/element dist-tags
{ latest: '0.41.2', alpha: '0.42.0-alpha.9' }
# 5 包全在：element/app/adapter-vite/ui/create @0.42.0-alpha.9 均返回版本

# git tag
v0.42.0-alpha.8 → 0ec1056854e19fe4128b0876dd640e8c3bf5d4a4
v0.42.0-alpha.9 → 2872999b7fc43970d5dbc2f29500f0e3e8873362

# GitHub Release（正确仓库 open-element/openelement）
α8: published 2026-07-29T19:08:23Z, isPrerelease:false
α9: published 2026-07-30T14:28:37Z, isPrerelease:false

# α9 release run 30550568968（autoflow3 快照引用的 run）
workflow="AutoFlow CI", event=pull_request, conclusion=success
jobs=[dependency-review, autoflow-ci]  ← 是 PR #645 的 CI run，非发布 run

# α9 实际 publish run 30553856284（durable 证据未引用）
workflow="AutoFlow Publish Existing", event=workflow_dispatch, conclusion=failure
jobs=[{name:"Execute release", conclusion:"failure"}]  ← 冗余 re-tag 假失败；publish+verify+smoke 在失败前已过

# autoflow3 α9 快照
kind="release", 3 steps: verify CI / artifact gate / merge PR #645  ← 无 publish 步骤
successfulReleaseRun = run 30550568968（PR CI run，非 publish run）← 指向错误 run

# docs/release/autoflow3/ 0.42 线
α1-α7、α9 在；α8 缺失

# CHANGELOG α 条目
α1,α2,α3,α4,α5,α6,α9 在；α7,α8 缺
```

---

_报告结束。本次审计为只读，未修改任何文件。_
