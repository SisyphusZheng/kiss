# ADR-0059: Route Params Reactive + `static head` + `static client` + `data-keep-alive`

> Status: PROPOSED\
> Date: 2026-05-29\
> Target: v0.25.0 (static head, static client) + v0.26.0 (route params, keep-alive)\
> Depends on: ADR-0058 (BuildPipeline for static head injection)
>
> Numbering collision: shares ADR-0059 with
> [0059-show-for-control-flow.md](./0059-show-for-control-flow.md) (VNode 层控制流组件
> `<Show>`/`<For>`) — they are different decisions, both retained; cite by filename.

## Context

v0.24.3 完成了组件模型迁移（JSX+Signal）和 API 命名统一（Web Platform style）。但 DX 层面仍有硬编码：

1. **页面元数据**：所有页面通过 `<open-layout head-extras='<title>...</title><meta...>'>` 字符串拼接注入 title/meta
2. **Island 声明**：`island()` 函数调用是 LessJS 特有的非标准模式，与 `static props` / `static styles` 的声明式风格不一致
3. **SPA 导航**：`_getRouteParams()` 返回的值在 SPA 导航后仍是旧值——本框架自己的网站就需要修复
4. **DOM 重渲染**：VNode re-render 是全量 shadow DOM 替换，`<input>` 的 focus 和 CSS transition 在每次 signal 变更时丢失

## Decision

### Part 1: `static head` 页面元数据 (v0.25.0 TG-03)

路由组件通过 `static head` 声明 title/meta，SSG 构建时自动注入 `<head>`。

```typescript
class MyPage extends DsdElement {
  static head = {
    title: 'My Page',
    description: 'Page description',
  };
}
// SSG output → <title>My Page</title><meta name="description" content="...">
```

实现要点：

- Route scanner 读取 `static head` 声明
- SSG 阶段在 HTML 生成时注入 `<head>` 内容
- `less-layout` 的 `head-extras` 属性保留兼容（过渡期）

### Part 2: `static client` Island 声明 (v0.25.0 TG-04)

Island 通过 `static client` class field 声明升级策略，替代 `island()` 函数。

```typescript
// Before: export default island('my-widget', MyWidget, { strategy: 'visible' })
// After:
class MyWidget extends DsdElement {
  static client = { strategy: 'visible' };
}
```

实现要点：

- build-client.ts 扫描 `static client` 声明，自动注册为 island chunk
- `island()` 函数保留兼容（过渡期）
- Island chunk 命名和输出结构不变

### Part 3: Route Params Reactive (v0.26.0 TG-01)

DsdElement 基类暴露 `this.params`，SPA 导航后自动随路由变化更新。

```typescript
class BlogPost extends DsdElement {
  override render() {
    const slug = this.params.slug;
    return post ? <article>{post.content}</article> : <p>Not found</p>;
  }
}
```

实现方式：

- 内部使用 signal + `onNavigate()` 订阅
- `effect()` 驱动 re-render（复用现有 VNode tracking 基础设施）
- 不引入新的跨组件状态管理机制（SignalContext 明确不做）

### Part 4: `data-keep-alive` 细粒度 DOM (v0.26.0 TG-02)

在 VNode re-render 路径中检测 `data-keep-alive` 属性，跳过 DOM 替换，仅 patch 属性。

```html
<input data-keep-alive value="{this.query}" onInput="{...}" />
```

实现方式：

- 在 `_renderIntoShadowRoot` / `renderToDom` 的 effect 路径中增加 keep-alive 检测
- 匹配 tagName 相同的元素，preserve 现有 DOM node，patch attributes only
- 适用场景：input focus 保持、CSS transition 不中断

### Part 5: SignalContext — DOM-Tree-Based (v0.25.0 TG-05, P2 conditional)

See ADR-0060 for the full decision. ~20 lines implementation:

```typescript
const themeCtx = createContext<Theme>(Symbol('theme'), 'light');
provideContext(this, themeCtx, value); // provider
const theme = consumeContext(this, themeCtx); // consumer → returns signal
```

### 明确不做

| 不做                    | 原因                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `static data` SSG fetch | content system 已处理数据获取，不重复                                 |
| `static middleware`     | 0 处使用，不加抽象                                                    |
| SignalQuery             | Promise 风格已够用                                                    |
| VDOM diff               | shadow DOM 场景 full re-render 代价低，`data-keep-alive` 解决具体痛点 |

## Consequences

**正面**：

- DX 统一为声明式风格（`static props` / `static styles` / `static head` / `static client`）
- SPA 导航的正确性——本框架网站自身受益
- `data-keep-alive` 修复真实的 input focus 丢失 bug

**负面**：

- `static head` 依赖 BuildPipeline (ADR-0058)，不能独立实现
- `data-keep-alive` 在 effect re-render 路径增加了条件分支

**中性**：

- 不改变组件模型核心（DSD + JSX + Signal）
- 不改变包依赖图和发布顺序

## Status

PROPOSED. Implementation details in SOP v0.25.0 and v0.26.0.
