# ADR-0058: 移除 TemplateResult 渲染路径，仅保留 VNode + string

> **状态**: IMPLEMENTED (2026-05-29)\
> **日期**: 2026-05-29\
> **作者**: LessJS 架构团队\
> **关联**: ADR-0057 (JSX + Signal), SOP-002 (type dedup), SOP-003 (cleanup)\
>
> **编号碰撞**: 与 [ADR-0058 (Signal→DOM 直接绑定)](./0058-real-dom-signal-binding.md)、[ADR-0058 (BuildPipeline 声明式 API)](./ADR-0058-build-pipeline-declarative.md) 共用编号 0058——三者系不同决策，均予保留，引用请带文件名区分。

---

## Context

v0.24.1 (ADR-0057) 引入了 JSX + Signal 新组件模型作为 `html` tagged template 的替代。
迁移完成后，`DsdElement.render()` 同时支持三种返回值：

```typescript
render(): string | TemplateResult | VNode
```

实际使用情况（2026-05-29 审计）：

| 路径             | 调用者                                        | 状态                   |
| ---------------- | --------------------------------------------- | ---------------------- |
| `VNode`          | 10 个 UI 组件 + 40+ 路由页面                  | ✅ 主力                |
| `string`         | 3 个 demo island + adapter-vanilla 第三方使用 | ✅ 低门槛 escape hatch |
| `TemplateResult` | **0 个组件**                                  | ❌ 已无人使用          |

## Decision

**从 `DsdElement.render()` 中移除 `TemplateResult` 作为有效返回类型。**

具体变更：

1. `render()` 返回类型缩减为 `string | VNode`
2. 删除 `template.ts` 中的 7 个 @deprecated DSL 函数及类型
3. 删除 DSD 管线中的 TemplateResult 分支
4. 同步清理 error-boundary、render-dsd、types.ts 中的 TemplateResult 引用

**保留 string 路径的原因**：

- 最简单正确的 DSD 渲染：`innerHTML` 原生解析
- 第三方 WC 适配的逃生舱（无需装 JSX 编译器）
- `dangerouslySetInnerHTML` 的平替（DSD 偏好字符串接口）

## Rationale

### 为什么不保留 TemplateResult 作为"向后兼容"

TemplateResult DSL（`html`、`classMap`、`when`、`choose`、`repeat`、`ref`）的本质是在
JavaScript 的 template literal 之上加了一层自创语法：

```typescript
// TemplateResult DSL（即将删除）
const t = html`
  <div class="${classMap({ active: true })}">${when(show, () =>
    html`
      <span>Hi</span>
    `)}</div>
`;

// JSX 等价（新模型）
const t = <div class={cls({ active: true })}>{show && <span>Hi</span>}</div>;
```

TemplateResult 模式在 TypeScript 中无类型推导、无法静态分析、
无法被 JSX transform 工具链理解。继续保留的唯一价值是"允许用户不迁移"——
但 v0.24.1 已经声明 JSX 是唯一推荐模型。

### 为什么保留 string

`string` 不是 "旧模型"，它是 "平台能力"。`innerHTML` 是 Web Platform 本身就有的
渲染路径，LessJS 没有包装它，只是接受它作为合法的 render 返回值。移除 string
会关闭 DSD 渲染最直接的入口，增加第三方接入的摩擦。

### 影响范围

| 模块                              | 行数变化                                    | 变更                                                                          |
| --------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `template.ts`                     | 602L → 0L（文件名保留但内容清空或整体移除） | 全部 TemplateResult 代码移除                                                  |
| `dsd-element.ts`                  | -60L                                        | 移除 TemplateResult 分支、_bindTemplateRuntime()、_subscribeTemplateSignals() |
| `render-dsd.ts`                   | -20L                                        | 移除 TemplateResult 分支                                                      |
| `error-boundary.ts`               | -5L                                         | onError() 返回类型改为 VNode                                                  |
| `types.ts`                        | -10L                                        | 移除 ReactiveHost.render() 中的 TemplateResult 引用                           |
| `index.ts`                        | -3L                                         | 移除 TemplateResult/模板相关 export                                           |
| `legacy-template.test.ts`         | 整个文件                                    | 删除                                                                          |
| `legacy-template-helpers.test.ts` | 整个文件                                    | 删除                                                                          |
| `legacy-reactive-dsd.test.ts`     | 评估后决定                                  | 可能部分重写                                                                  |

### 不做的事

- 不禁止 `string` 返回（平台能力，不应限制）
- 不立即删除 `template.ts` 在 adapter-lit 中的 Lit TemplateResult 处理（那是 Lit 的 TemplateResult，不同含义）
- 不修改 adapter-vanilla 基于 string 的 DSD 模型

## Consequences

**正面**：

- 代码量减少约 700 行（template.ts 600L + dsd-element.ts 60L + tests）
- 新增组件只有一个正确答案：JSX
- DSD 渲染逻辑简化，两个分支变一个

**负面**：

- `legacy-reactive-dsd.test.ts` 需要重写为 JSX 版本或删除
- 任何静默依赖 TemplateResult 的第三方代码会编译失败

## Status

PROPOSED — 待 SOP-004 执行。
