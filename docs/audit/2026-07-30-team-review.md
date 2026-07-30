# OpenElement packages/ 团队交叉审查报告（2026-07-30）

> 本文档是 **团队版独立审查记录**，与 `2026-07-30-packages-code-review.md`（单轮核实版）互为补充。
> 团队：主理人 齐活林（Delivery Director）｜架构师 高见远｜工程师 寇豆码｜QA 严过关。
> 审查性质：**仅审查，不修改任何文件**。三方各自独立读源码，结论经主理人汇总对照。

## 方法论与前提说明

- 上一轮（2026-07-30 单审）由主理人一人逐条核实，结论已写入 `2026-07-30-packages-code-review.md` 并发出 11 个 issue（milestone `v0.42.0-alpha.9`）。
- 本轮由三位成员**独立**重读源码交叉验证，不以主理人结论为前提（仅作为对照锚点）。
- 环境限制：本运行时未注册 `software-architect` / `software-engineer` / `software-qa-engineer` 自定义 agent 类型，spawn 阶段即失败。已用基础 `general-purpose` agent 等价替代，角色职责在 prompt 内显式指定，团队归属不变。结论有效性不受影响。

## 交叉审查结论总表

| 条目 | 单审结论 | 团队结论（三方） | 偏差 / 校正 |
|---|---|---|---|
| **H-1** dataStack 并发 SSR | 主路径不成立，High→Medium；残余=async 阶段读空帧 | 架构师：主路径**不成立**（同步 try/finally 内无 await 间隙）；残余风险**重新定性为单请求作用域 bug**（嵌套非页面组件序列化期调用 `useLoaderData` 读空栈），**非并发竞态** | ✅ 方向一致，归因更精确：是作用域缺陷，不是并发 |
| **H-2** escape 双实现 | 属实，成立 | 工程师：属实但**非安全问题**（结果正确，仅实现不一致）→ **Low** | ⚠️ **严重度应降**：原报告/issue #633 标 High，团队独立判定 Low（维护性） |
| **M-1** 冗余间接层 | 属实 | 工程师：属实 Low | 一致 |
| **M-2** task 不一致 | 表格属实；"测试不会执行"表述过重 | QA：表格属实；根 `deno test` 无路径→递归发现，CI 门 `test:coverage:check` 同样递归，**不漏跑**；真正盲区在 M-4/L-4 边界 | ✅ 一致；措辞应改为"仅影响单包本地 `deno task test`" |
| **M-3** console.error | 属实 | 工程师：属实 Medium；补充"跨包不一致"（app 无自身 `createLogger`） | 一致 |
| **M-4** _handleClick 职责重 | 属实 | QA：属实中，提交路径难孤立测试；工程师：属实 Medium + 4 个额外异味 | 一致，且发现增量问题（见下） |
| **M-5** default export | 属实（原报 10 个组件） | 工程师：属实 Low，**实际 11 处** `export default`（`index.ts` 仅 named 导出，无消费者） | 数量校正：11 处 |
| **L-1** locale cast | 属实 | 工程师：属实（弱）Low | 一致 |
| **L-2** Fragment 冗余 | 补为 3 处 | 工程师：确认 **3 处**（`render-ir.ts:216` / `jsx-render-dom.ts:328` / `event-hydration.ts:86`） | 一致 |
| **L-3** create 缺 test task | 属实 | QA：属实 Low（`cli.test.ts` 179 行存在，deno.json 无 test task） | 一致 |
| **L-4** spa.ts tagName | 属实（"静默失败"） | 工程师：**描述需修正**——非法字符 `tagName` 会**抛 `SyntaxError`**（非静默）；未注册自定义元素才静默空渲染；QA：边界未被覆盖是盲区 | ⚠️ 描述精确化：区分"非法字符抛错"与"未注册静默" |

## 三方独立贡献 / 增量发现

### 架构师（高见远）—— 并发与进程级单例
- **F1** `dataStack` 跨请求交错覆盖：**主路径不成立**。证据：`authoring.ts:298` push → `definition.render` → `popData:319` 全在同步 `try/finally` 内；`callComponent` 同步执行，`await` 在求值之后，单线程无间隙可插入。
- **F2** 残余风险重定性：嵌套"非页面"组件在序列化期调用 `useLoaderData` → 读空栈，属**单请求作用域缺陷**，非并发竞态。
- **F3** `logger.ts` `_warned` 进程级 `Set`：`warnOnce` 一旦触发即**永久抑制**该进程内其他请求/SSG 多页同名告警 → Low。
- **F4** `errors.ts` `_telemetryHook` 全局单例：若每请求 `setErrorTelemetryHook` 则 **last-writer-wins 竞态 + 跨租户泄漏** → Low（启动一次性）/ High（每请求 set）。建议改为请求级上下文。
- 架构健康度：**B+**——依赖方向 `adapter-vite → element/app`、`app → element`、`ui → element` 单向无环，`element` 零依赖纯净。

### 工程师（寇豆码）—— 实现质量与新增异味
- H-2 / M-1 / M-3 / M-4 / M-5 / L-1 / L-2 / L-4 逐条核实见总表。
- **M-4 关联 4 个额外代码异味**（均 `packages/ui/src/open-button.tsx` / `packages/app/src/spa.ts`）：
  1. `spa.ts:78` `if (!route.tagName) return;` **死代码守卫不可达**——`RouteConfig.tagName` 必填（`client-router.ts:17`），`:72` 强转 `{tagName?: string}` 掩盖事实。
  2. `open-button.tsx:178` `onClick={(e)=>this._handleClick(e)}` **多余箭头包装**；同文件 `:165` 锚点分支直接传引用，风格不一致。
  3. `_handleClick` 在 `href`（锚点 `<a>`）分支仍可能触发表单提交（若 `type="submit"` 则 `form.dispatchEvent`），**`<a>` 上语义不当**。
  4. `escapeHtml` 对 non-string 返回 `''`（`:33`），而 `escapeAttrValue` 经 `String()` 转换（`:48-50`）——**同包两种空值约定**。

### QA（严过关）—— 测试覆盖与边界
- 覆盖率门禁**真实存在**：阈值 lines 73 / branch 82 / func 77（`check-coverage.ts:73`、`deno.json:97`），scope = `packages/*/src` + `tools/lib`。
- 根 `deno test` 与 CI 门均**无路径参数→递归发现**，`app/ui/create` 的 `__tests__/` 全部被跑入 → **M-2「测试不会被执行」不成立**。
- 真正漏测盲区：**M-4 `_handleClick` 提交路径难孤立测试**、**L-4 `spa.ts` 无效 tagName / 空白页 / `applyPageHostData` 静默失败边界无覆盖**。建议保留门禁并补这两条路径单测，而非仅为包补 test task。

## 整体评级

**维持 B+**。三方独立结论一致支持单审的"报告代码事实基本属实、总体结论可信"判断，但严重度整体应**下调**：

- H-1 由 High 降 Medium（且残余风险重新定性为作用域 bug）；
- H-2 由 High 降 **Low**（维护性问题，非安全缺口）；
- 其余 Medium/Low 与单审一致。

## 对 2026-07-29/30 已发 issue 的校正建议

| Issue | 当前 | 建议校正 |
|---|---|---|
| #632 H-1 | Medium（已含同步窗口证据） | 补一句：残余风险是**单请求作用域缺陷**而非并发竞态（采纳 F2） |
| #633 H-2 | **High / Gate 1 必须** | ⚠️ 降为 **Low**（团队独立判定非安全） |
| #634 M-1 | Low | 数量无关，保持 |
| #635 M-2 | Medium | 描述改为"单包本地 task 缺失，CI 不漏跑" |
| #636 M-3 | Medium | 补"跨包不一致" |
| #637 M-4 | Medium | 补 4 个关联异味（死代码守卫 / 多余箭头 / `<a>` submit 语义 / 空值约定） |
| #638 M-5 | Low | 数量更正：11 处 `export default` |
| #639 L-1 | Low | 保持 |
| #640 L-2 | Low | 确认 3 处（补 `jsx-render-dom.ts:328`、`event-hydration.ts:86`） |
| #641 L-3 | Low | 保持 |
| #642 L-4 | Low | 描述精确化：非法字符抛 `SyntaxError` / 未注册静默空渲染 |
| — | — | **建议新增** F3 `_warned` 进程级单例（Low）、F4 `_telemetryHook` 全局单例竞态（Low/High）—— 可并入 #632 或单独开 issue |

## 整改优先级重排（团队版）

1. **必须（安全/正确性）**：F2 嵌套组件 `useLoaderData` 空帧作用域缺陷；F4 `_telemetryHook` 每请求 set 竞态（若确有此用法）；L-4 未注册 tagName 静默空渲染无提示。
2. **建议（一致性/可维护性）**：H-2 统一 escape；M-1 删冗余层；M-3 统一 createLogger；M-4 拆分 `_handleClick`；F3 `_warned` 进程级单例。
3. **后续（清洁）**：M-5 去 default export（11 处）；L-1 locale 类型；L-2 清 3 处 Fragment 冗余；L-3 create test task；M-2 补单包 task（非 CI 必需）。

---
*本记录由团队主理人汇总，三方独立结论为 source of truth；未修改任何源码。*
