# ADR-0070: 三层桥接可信化 — 从字符串拼接到 AST 契约

- **状态**：提案
- **日期**：2026-05-31
- **替代**：无（新架构能力）

> **编号碰撞说明**：本文件（桥接契约，2026-05-31，LessJS 时代）与
> [ADR-0070: Generated Data Namespace and App Shell Boundary](./ADR-0070-generated-data-app-shell-boundary.md)
> 共用编号 0070——两者是不同决策，均予保留；引用时请带文件名区分。
> **编码修复说明**：本文件曾在 openelement 改名提交（f5e58b3b）中被错误转码为
> GBK 乱码，2026-08 依据改名前干净版本（04ffdde0）加同名替换恢复为 UTF-8。

---

## 动机

LessJS 的三层架构（组件模型+信号、DSD 渲染管线、Builder 管线）在理论上简洁优美。但三层之间的两个桥接点全部依赖运行时字符串操作和 try/catch，导致桥梁脆弱、错误不可见、修复不可靠。

### 当前桥接问题清单

| 桥                     | 当前实现                                                   | 问题                                             |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Builder → Render       | `lines.push('return \`<open-layout>${c}</open-layout>\`')` | 字符串拼接生成 JS 代码，缺失 await 不报错        |
| Component → Render     | `renderDsd()` call `render()` → try/catch 兜底             | 浏览器 API 调用在 SSR 炸了被静默吞掉             |
| Render → Render (内部) | `visitedKey = "${tagName}@${depth}"`                       | 5 个 `<open-code-block>` 深度=1，后4个被误判循环 |

---

## 决策

用三个独立但互补的机制，把桥接从运行时试探升级为静态可验证的契约：

### 桥1：Builder → Render — 生成代码 → 真实函数

**不生成代码。导入真实函数。**

```
之前：entry-renderer.ts 生成字符串 → 拼成 .js → 运行时执行
之后：entry-renderer.ts 生成 import 语句 → 导入 packages/core/src/entry-bridge.ts
```

`entry-bridge.ts` 是一个**被 TypeScript 类型检查覆盖的普通函数**：

```ts
// packages/core/src/entry-bridge.ts
export async function wrapAppShell(
  content: string,
  routePath: string,
  options: {
    navSections: NavSection[];
    headerNav: HeaderNavLink[];
    locales: string[];
    defaultLocale: string;
  },
): Promise<string> {
  // 函数体内所有逻辑受 TypeScript 检查
  // await 缺失 → 编译错误，不是运行时 [object Promise]
}
```

**entry-renderer.ts 的角色变化**：从"代码生成器"降级为"import + 参数拼接器"。

### 桥2：Component → Render — try/catch → SSR Context

**不给组件 try/catch 当安全网。给组件 SSR Context。**

```ts
// dsd-element.ts
export interface SsrContext {
  path: string;
  locale: string;
  params: Record<string, string>;
}

export class DsdElement extends _HTMLElement {
  // renderDsd() 在调用 render() 前设置此值
  #ssrContext: SsrContext | null = null;

  // 组件需要路径时使用此方法，而不是 Router
  protected get currentPath(): string {
    return this.#ssrContext?.path ?? this.routing?.path ?? '/';
  }
}
```

**关键变化**：

- `renderDsd()` 在 injectProps 之后、render() 之前注入 `#ssrContext`
- Router 不再被 render() 调用（render 走 ssrContext）
- Router 只在 connectedCallback 之后使用（CSR 安全）
- 不再需要 try/catch 兜底——没路径信息就优雅降级到 `/`，不会抛异常

### 桥3：Render 内部 — tagName@depth → node identity

**不用 tag+depth 判断循环。用 parse5 node 的身份。**

```ts
// render-nested.ts
// 之前：
const visitedKey = `${tagName}@${depth}`; // 5 个 less-code-block 共享同一个 key

// 之后：
let occurrenceIndex = 0;
const visitedNodes = new WeakMap<P5Element, number>();
// 用 parse5 节点引用作为身份，不靠 tagName+depth 猜
```

但 parse5 节点每次 `parseFragment()` 都创建新对象，无法用对象引用追踪跨调用循环。真正的方案是：

**不靠 key 去重。靠 parent-child 关系判定真正循环。**

```ts
function isAncestor(child: P5Element, ancestor: P5Element): boolean {
  let current = child.parentNode;
  while (current) {
    if (current === ancestor) return true;
    current = (current as P5Element).parentNode;
  }
  return false;
}

// 在渲染链路中：
// 只跳过"render() 输出中包含自己 tag 的组件"（真正的循环）
// 不跳过"兄弟节点中同类型的组件"（false positive）
```

**规则变更**：

- 旧：`visited.has("less-code-block@1")` → skip（兄弟也跳过）
- 新：检查 render() 输出的 AST 中是否包含相同 tag 在更深的层级 → 只跳过自引用循环

---

## 实现路线

### Phase 1：建桥3（最小改动，最大收益）

**改 `render-nested.ts` 的 cycle detection**：

- 删除 `${tagName}@${depth}` visited Set
- 在 `renderDsd()` 输出解析后，检查 render() 输出中是否包含同名 tag → 只在真循环时跳过
- 预估：~30 行改动

### Phase 2：建桥2（加固 bridge1 的前提）

**给 DsdElement 加 `#ssrContext`**：

- 新增 `SsrContext` 接口
- `renderDsd()` 注入 ssrContext
- `LessLayout._currentPath()` 改为读 ssrContext
- 删除 Router 相关的 try/catch 代码
- 预估：~50 行改动，影响 3 个文件

### Phase 3：建桥1（长期信任）

**提取 `entry-bridge.ts`**：

- 新建 `packages/core/src/entry-bridge.ts`
- `wrapAppShell()` 从 lines.push 字符串 → 真实函数
- `entry-renderer.ts` 简化为 import + 参数拼接
- `renderNestedCustomElements` 在函数内调用，类型安全
- 预估：~80 行新增 + ~30 行删除

---

## 影响的包

| 包                        | 变更                                                    |
| ------------------------- | ------------------------------------------------------- |
| @openelement/core         | 新增 entry-bridge.ts, SsrContext, 修改 render-nested.ts |
| @openelement/ui           | LessLayout._currentPath() 不再依赖 Router               |
| @openelement/adapter-vite | entry-renderer.ts 简化                                  |
| @openelement/router       | 不受影响（仅 CSR 使用）                                 |

---

## 风险与取舍

| 风险                                             | 缓解                                                     |
| ------------------------------------------------ | -------------------------------------------------------- |
| entry-bridge.ts 在 core 中增加 deno.json imports | core 已有 render-nested 依赖 parse5，bridge 不增加新依赖 |
| SsrContext 暴露内部接口                          | 标记为 `@internal`，不导出到 public API                  |
| AST 循环检测性能                                 | parse5 树遍历是 O(depth)，一页最多几百节点，零影响       |

---

## 不做什么

1. 不引入 Babel/SWC 编译步骤（保持零编译）
2. 不把 Router 改成 SSR 感知（Router 是纯 CSR 组件）
3. 不改变 render() 签名（保持 `render(): string | VNode`）

---

## 附录：修复后的数据流

```
Builder (entry-renderer)
    │ 不再 lines.push 生成代码
    │ 改为: import { wrapAppShell } from '@openelement/core/entry-bridge'
    │ 然后: content = await wrapAppShell(content, routePath, {...})
    │
    │                       ↓ 类型安全的函数调用
    │
组件模型 (DsdElement)
    │ renderDsd() 注入 #ssrContext.path
    │ render() 通过 this.currentPath 获取路径
    │ 不调用 Router、不访问 location
    │
    │                       ↓ 不抛异常、不 try/catch
    │
DSD 渲染 (renderNested)
    │ 循环检测：检查 output AST 中同名 tag 的祖先链
    │ 兄弟节点正确渲染
    │
    │                       ↓ 零误杀
    │
最终 HTML（完整、正确）
```
