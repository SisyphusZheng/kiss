# HVL 风险矩阵与技术决策

> 框架开发过程中的关键挑战、风险评估与解决方案

---

## 一、关键挑战与解决方案

| 挑战 | 严重程度 | 解决方案 | 状态 |
|------|---------|----------|------|
| `@lit-labs/ssr` 模块解析冲突 | **中** | `ssr.noExternal: ['lit', '@lit-labs/ssr', 'lit-html', '@lit/reactive-element']` | ✅ 已验证可行 |
| DSD 浏览器兼容性 | **低** | Chrome 90+/Safari 16.4+/Firefox 123+ 原生支持；旧浏览器条件加载 polyfill | ✅ 路径清晰 |
| Island AST 检测准确性 | **中** | 目录约定(`app/islands/`) + `transform` 钩子分析 + `__island` 标记 | ✅ 方案确定 |
| 边缘运行时 SSR 限制 | **中** | 静态内容构建时预渲染(SSG)；动态内容使用 Node.js 运行时 | ⚠️ 需验证 |

### 详细说明

#### @lit-labs/ssr 模块解析冲突

**问题**：`@lit-labs/ssr` 内部依赖的模块（如 `lit-html`, `@lit/reactive-element`）在 Vite SSR 环境下可能被错误解析或外部化，导致运行时报错。

**解决方案**：
```typescript
// vite.config.ts
export default defineConfig({
  ssr: {
    // 强制将这些包内联到 SSR bundle 中
    noExternal: [
      'lit',
      '@lit-labs/ssr',
      'lit-html',
      '@lit/reactive-element',
      '@lit-labs/task',
    ]
  }
})
```

#### Island AST 检测策略

采用**多层检测**确保可靠性：
1. **目录约定**：仅扫描 `app/islands/` 目录
2. **文件标记**：transform 注入 `export const __island = true`
3. **运行时校验**：客户端水合脚本检查 `__island` 标记

---

## 二、风险矩阵

| 风险 | 概率 | 影响 | 风险等级 | 缓解措施 |
|------|------|------|----------|----------|
| `@lit-labs/ssr` API 变更 | 低 | 高 | 🟡 中 | 锁定版本 + 适配层抽象；关注上游 changelog |
| DSD polyfill 体积过大 | 低 | 中 | 🟢 低 | 仅按需加载（<1% 用户需要）；核心功能不依赖 polyfill |
| Vite SSR 模块图不一致 | 中 | 中 | 🟡 中 | 开发模式严格同步 `ssr.noExternal` 配置；CI 测试多场景 |
| Island 依赖图过度提取 | 中 | 低 | 🟢 低 | tree-shaking + 手动标记 `__island`；构建产物分析 |
| Hono API 破坏性变更 | 低 | 中 | 🟡 低 | 锁定 Hono ^4.x；封装适配层隔离变更 |
| Vite 插件 API 变更 | 低 | 高 | 🟡 中 | 关注 Vite release notes；锁定 ^6.x；核心逻辑抽象 |

### 风险等级说明

- 🔴 **高** — 需要立即制定应急方案
- 🟡 **中** — 需要持续监控，有备选方案
- 🟢 **低** — 影响有限，接受或简单处理即可

---

## 三、兼容性与降级策略

### 3.1 浏览器兼容性

| 特性 | 最低支持 | 降级方案 |
|------|---------|----------|
| **Declarative Shadow DOM** | Chrome 90 / Safari 16.4 / Firefox 123 | 条件加载 `@oddbird/dsd-polyfill` (~2KB gzipped) |
| **Custom Elements v1** | 所有现代浏览器 | 无降级（框架硬性要求） |
| **ES Modules (import)** | 所有现代浏览器 | 无降级（Vite 默认输出 ESM） |
| **CSS Shadow Parts** | Chrome 73+ / Safari 16.4+ / Firefox 72+ | 回退到 CSS 自定义属性穿透 |

> **目标覆盖率**：Chrome 90+, Safari 16.4+, Firefox 123+, Edge 90+
> 
> **不支持**：IE11 及更早浏览器（无计划支持 polyfill）

### 3.2 运行时兼容性

| 场景 | Node.js (SSR) | Edge Runtime (SSG) | 备注 |
|------|---------------|-------------------|------|
| 开发模式 | ✅ 完整支持 | ❌ 不适用 | 使用 `ssrLoadModule` |
| 生产 SSG 构建 | ✅ 可选 | ✅ 推荐 | 构建时预渲染所有页面 |
| 生产 SSR 服务 | ✅ 支持 | ⚠️ 限制 | 边缘无法使用动态 import |
| Island 水合 | ✅ 支持 | ✅ 支持 | 纯客户端操作 |

### 3.3 渐进增强降级链

```
Level 4: 全页 CSR ←────────────── Escape hatch（极端情况）
    ↓ 不可用时
Level 3: WebSocket/SSE ←─────── 降级为轮询
    ↓ 不可用时
Level 2: SPA 导航 ←─────────── 降级为整页刷新
    ↓ 不可用时（默认）
Level 1: Islands 交互 ←──────── 降级为纯展示
    ↓ 不可用时（默认）
Level 0: 纯 HTML SSR ←───────── 基线，始终可用
```

---

## 四、错误处理策略

### 4.1 SSR 错误

```typescript
// ssr-handler.ts
async function handleSSR(vite: ViteDevServer, route: RouteMatch): Promise<Response> {
  try {
    const module = await vite.ssrLoadModule(route.filePath)
    const Page = module.default
    const { render } = await import('@lit-labs/ssr')
    return render(Page, route.props)
  } catch (error) {
    // 降级为 Error Boundary 占位符
    console.error('[HVL] SSR Error:', error)
    return new Response(
      `<div class="hvl-error-boundary">
        <p>⚠️ 页面渲染出错</p>
        <details><pre>${escapeHtml(error.message)}</pre></details>
      </div>`,
      { status: 500, headers: { 'content-type': 'text/html' } }
    )
  }
}
```

### 4.2 水合错误

```typescript
// client.ts (Island hydrate script)
async function hydrateIsland(tagName: string, loader: () => Promise<any>) {
  try {
    const mod = await loader()
    customElements.define(tagName, mod.default)
  } catch (error) {
    console.warn(`[HVL] Island "${tagName}" hydration failed, falling back to CSR`)
    // 回退：重新渲染整个组件为 CSR
    const el = document.querySelector(tagName)
    if (el && !el.shadowRoot) {
      el.attachShadow({ mode: 'open' })
      el.shadowRoot.innerHTML = '<slot></slot>'
      new mod.default(el)  // 直接实例化为 Light DOM
    }
  }
}
```

### 4.3 RPC 错误

```typescript
// @hvl/rpc/client.ts
export class RPCError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'RPCError'
  }
}

// 自动映射 HTTP 状态码到错误类型
const errorMap: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_ERROR',
}
```

---

## 五、性能考量与优化

### 5.1 核心性能指标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse / Web Vitals |
| FID (First Input Delay) | < 100ms | Lighthouse / Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse / Web Vitals |
| TTFB (Time to First Byte) | < 600ms | DevTools Network |
| 首页 JS 大小 (零交互页面) | **0 KB** | Bundle 分析工具 |
| 单个 Island JS | **~6 KB** (gzipped) | Bundle 分析工具 |

### 5.2 性能优化策略

| 优化点 | 策略 | 效果 |
|--------|------|------|
| **Vite SSR 缓存** | 开发模式自动缓存 `ssrLoadModule` 结果 | 模块变更时智能失效，避免重复编译 |
| **Island 懒加载** | transform 钩子分析依赖图，仅打包引用的 Island | 未使用的 Island 不进入客户端 bundle |
| **Shadow DOM CSS 内联** | SSR 时将 Lit 组件样式内联到 DSD `<style>` 标签 | 避免 FOUC（无样式闪烁） |
| **SSR 静态缓存** | 边缘运行时使用构建时预渲染结果 | 零计算成本返回 HTML |
| **代码分割** | 每个 Island 独立 chunk + 动态 import | 按需加载，首屏最小 |
| **预连接/预加载** | HTML template 注入 `<link rel="modulepreload"> | 减少 Island 水合延迟 |

### 5.3 构建产物预算

```
预期产物大小（gzipped）：

服务端 bundle:
├── Hono + Middleware     ~14 KB
├── Lit + SSR             ~8 KB
├── 路由 + 页面组件       ~(应用代码)
└── 总计                  ~(应用代码 + 22 KB)

客户端 bundle (仅 Islands):
├── Lit 运行时            ~6 KB
├── 水合脚本              ~0.5 KB
├── 各 Island 组件        ~每个 1~5 KB
└── 总计                  ~(Islands 数量 × 平均大小 + 6.5 KB)
```

---

## 六、日志规范

### 6.1 开发模式日志

```typescript
// 终端输出格式
console.log(
  '\x1b[36m[HVL]\x1b[0m',           // 青色前缀
  '\x1b[32mGET\x1b[0m',            // 绿色方法
  '/about',                         // 路径
  `\x1b[90m${duration}ms\x1b[0m`,   // 灰色耗时
  islands.length > 0                // Island 信息
    ? `\x1b[33m(${islands.join(', ')})\x1b[0m`  // 黄色 Island 列表
    : ''                            // 无 Island 则省略
)

// 示例输出：
// [HVL] GET /about 23ms
// [HVL] GET /dashboard 45ms (counter, theme-toggle)
// [HVL] POST /api/posts 12ms → 201 Created
```

### 6.2 生产模式日志

```typescript
// 结构化 JSON 日志（Hono logger）
{
  "timestamp": "2026-04-22T06:00:00Z",
  "level": "info",
  "requestId": "req_abc123",          // 携带请求 ID 用于追踪
  "method": "GET",
  "path": "/about",
  "status": 200,
  "duration": 15,
  "islands": [],
  "framework": "hvl"
}
```

---

*文档版本：v1.0 | 最后更新：2026-04-22*
