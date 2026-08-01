# ADR-0059: VNode 层控制流组件 — `<Show>` 与 `<For>`

> **状态**: IMPLEMENTED (v0.26.1)\
> **日期**: 2026-05-30\
> **作者**: LessJS 架构团队\
> **关联**: ADR-0058 (Real DOM Signal Binding)\
> **前置讨论**: [children-signal-binding-discussion.md](../../conversation/v0.26.1/children-signal-binding-discussion.md)
>
> **编号碰撞**: 与 [ADR-0059 (Route Params Reactive + `static head`/`static client`/`data-keep-alive`)](./ADR-0059-static-head-client-route-params-keep-alive.md) 共用编号 0059——两者系不同决策，均予保留，引用请带文件名区分。

---

## Context

ADR-0058 实现了 props 层的 Signal→DOM 绑定（`className={sig}` 等），但 JSX children 中的 signal 表达式——`{sig}` 动态文本、`{sig ? A : B}` 条件渲染、`.map()` 列表渲染——在 `render()` 只跑一次的约束下无法响应式更新。

### 根因

react-jsx transform 在 JSX 构建时将 children 中的表达式求值为静态值。`{count.value}` 变成 `jsx("div", null, 42)`——signal 身份在 VNode 构建阶段丢失。到 `renderToDom` 时，children 数组里已经是 plain values。

### 为什么属性层没这个问题

属性层的 signal 在 `applyProps` 中通过 `isSignalLike(value)` 检测被拦截——props 值在 VNode 中保留为 signal 对象引用，不是静态快照。

---

## Decision

### Children 动态文本

`renderToDom` 中 `isSignalLike(node)` 分支改为 **effect 绑定** 而非静态展开：

```typescript
// Before (static — signal identity lost):
if (isSignalLike(node)) {
  return renderToDom((node as { value: unknown }).value, signal);
}

// After (reactive — TextNode + effect):
if (isSignalLike(node)) {
  const sig = node as SignalLike;
  const textNode = document.createTextNode(String(sig.value));
  const dispose = effect(() => {
    textNode.textContent = String(sig.value);
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  return textNode;
}
```

### `<Show when={signal}>` 条件渲染

在 `renderToDom` 中新增内置 VNode 标签 `Show`（`Symbol('lessjs.show')`）。

Semantic：第一个 child 是 truthy 分支，第二个 child 是 falsy 分支。effect 跟踪 `when` prop 并在 signal 变化时 swap 子节点。

### `<For each={signal}>` 列表渲染

内置 VNode 标签 `For`（`Symbol('lessjs.for')`）。child 是 render function `(item, index) => VNode`。effect 跟踪 `each` prop（Array signal），变化时 reconcile DOM children。

---

## Consequences

### 正面

- Children 层 signal 响应式完整——动态文本、条件、列表全覆盖
- 不换 JSX transform，所有逻辑在 DOM renderer 层
- 组件 API 不退化：`{sig}` 继续在 JSX 中直接使用

### 负面

- `<Show>` / `<For>` 是 `Symbol`-based 内置组件，用户不能自定义同名组件
- SSR 路径（`renderToString`）需要对应的控制流处理

### 中性

- `<Show>` / `<For>` 对标 SolidJS 同名组件，迁移路径清晰
- alien-signals 的 `effect()` 已是核心依赖

---

## 实现

参见 [SOP-v0.26.1-001 补充](../../sop/v0.26.1/SOP-001-real-dom-signal-binding.md)
