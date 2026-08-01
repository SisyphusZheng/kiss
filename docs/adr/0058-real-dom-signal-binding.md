# ADR-0058: Signal→DOM 直接绑定，消灭全量 re-render

> **状态**: IMPLEMENTED (v0.26.1)\
> **日期**: 2026-05-29\
> **作者**: LessJS 架构团队\
> **关联**: ADR-0057 (JSX+Signal 组件模型), ADR-0039 (DsdElement Signals Reactive)\
> **前置讨论**: [signal-reactivity-loop-discussion.md](../../conversation/v0.26.1/signal-reactivity-loop-discussion.md)
>
> **编号碰撞**: 与 [ADR-0058 (BuildPipeline 声明式 API)](./ADR-0058-build-pipeline-declarative.md)、[ADR-0058 (移除 TemplateResult 渲染路径)](./ADR-0058-remove-templateresult-render-path.md) 共用编号 0058——三者系不同决策，均予保留，引用请带文件名区分。

---

## Context

### 问题

`less-theme-toggle` 在 CSR island 路径下发生 `RangeError: Maximum call stack size exceeded` 死循环。

调用链：

```
connectedCallback → _renderIntoShadowRoot → effect(() => render() + clear+rebuild)
  → onCsrRendered → _initTheme → signal.value = 'dark'
    → effect 重触发 → render() + clear+rebuild → 元素销毁重建
      → connectedCallback → ...
```

### 根因

**`effect(() => this.render())` + `clear+rebuild` 模式是隐含的 VDOM**。每次 signal 变化全量执行 `render()`，返回新 VNode 树，然后清空 shadow DOM 并重新创建。元素 identity 丢失 → `connectedCallback` 重入 → 死循环。

这个模式与 LessJS 宣称的 "Real DOM" 定位根本矛盾。`effect(() => render())` 本身就是一个 VDOM reconciliation 循环——无论你接下来是 clear+rebuild 还是 diff+patch。

### 为什么之前的绕过方案都无效

| 尝试                                   | 为什么失败                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `_initDone` guard                      | 实例级 guard。元素重建后是新实例，guard 重置                               |
| `requestAnimationFrame`                | 把同步循环变成异步循环，不消除重建                                         |
| 移除 `onCsrRendered` 中的 `_initTheme` | 仍有 `connectedCallback` 中的 `rAF(() => _initTheme())`，最终都要设 signal |
| `_patchChildren` (方案 A)              | 避免重建但仍是 VDOM diff，每次 signal 变化全量 render                      |

全部失败因为它们都在绕 symptom，没有动根因：**不应该有 `effect(() => render())`**。

---

## Decision

### 废除

**删除 `DsdElement._renderIntoShadowRoot()` 中的 `effect(() => this.render())` 回调。** 这是 VDOM 循环的根源。

### 采用

**在 `applyProps()` 中实现 Signal→DOM 直接绑定。** 当 prop 值是 signal-like 对象时，不为 DOM 设静态值，而是创建 `effect(() => { el.setAttribute(attr, unwrap(value)) })`，让 signal 变化直接更新 DOM 属性，不触发 render，不进入任何生命周期。

### 模型对比

|                    | 旧模型 (ADR-0057 实现)                    | 新模型 (ADR-0058)             |
| ------------------ | ----------------------------------------- | ----------------------------- |
| signal 变化后      | `effect(render)` → VNode → diff/patch DOM | `effect(el.attr = val)` → DOM |
| render 执行次数    | 初始 + 每次 signal 变化                   | 仅初始一次                    |
| VNode 的角色       | 每次变化都生成新 VNode                    | 仅首次 render 生成 VNode      |
| DOM 更新粒度       | 全量（需要 diff 或 clear+rebuild）        | 单属性级                      |
| 与 Real DOM 一致性 | ❌ 隐含 VDOM                              | ✅ 细粒度绑定                 |

### API 影响

**无破坏性变更。** 组件代码不变：

```tsx
// less-theme-toggle.tsx — 代码完全不变
private _theme = signal<'dark' | 'light'>('dark');

override render() {
    const lightClass = this._theme.value === 'light' ? ' is-light' : '';
    return (
        <button className={`theme-toggle${lightClass}`} ...>
            ...
        </button>
    );
}
```

`_theme` 是 signal → `render()` 首次执行时 `this._theme.value` 被 `applyProps` 检测到 → 自动绑定 `effect(() => el.className = ...)` → signal 变化时只更新 className，不重跑 render。

### 条件渲染的处理（MVP 暂不覆盖）

JSX 中的条件表达式 `{dark ? <MoonIcon/> : <SunIcon/>}` 在 render 阶段求值，需要 render 重跑才能反映 signal 变化。ADR-0058 MVP 阶段**不处理条件渲染**。

应对策略：

1. 用 CSS 替代条件渲染（`display:none` / CSS class toggle）
2. 后续 ADR 引入 `<Show when={signal}>` / `<For each={signal}>` 控制流组件（参照 SolidJS）

`less-theme-toggle` 和其他现有组件恰好不受影响——它们只依赖 className 切换，不依赖条件渲染。

### SSR 兼容性

`renderToString()` 应 unwrap signal 值的首轮快照（已在 ADR-0057 实现中处理）。方案 B 不改变 SSR 行为——SSR 路径不使用 `effect()`，signal 值仅被读取一次以生成静态 HTML。

---

## Consequences

### 正面

1. **彻底消灭 VDOM**：LessJS 从 "effect+render→VDOM diff" 升级为 "signal→property binding"
2. **性能提升**：render 只跑一次，后续 signal 变化 O(1) 属性更新
3. **架构一致性**：与 SolidJS/Qwik 同属细粒度响应式阵营，与 Lit（脏检查）和 React（VDOM）都不同
4. **`connectedCallback` 不再重入**：元素 identity 永不变

### 负面

1. **条件渲染缺失**：MVP 阶段不支持 `{signal ? <A/> : <B/>}` 模式（需要 `<Show>` 组件）
2. **`applyProps` 复杂度增加**：需要区分 signal 绑定 vs 静态值设置
3. **disposer 生命周期管理**：每个 signal→DOM 绑定需要随元素销毁清理（AbortController 已就位）

### 中性

1. **开发体验不变**：组件代码不需要改动，render 中的 JSX 语法完全兼容
2. **SSR 路径不变**：`renderToString` 只读 signal 快照，不创建 effect

---

## 实施路径

参见 [SOP-v0.26.1-001: Real DOM Signal Binding](../../sop/v0.26.1/SOP-001-real-dom-signal-binding.md)
