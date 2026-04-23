# HVL 错误处理体系

> 类型化错误层级、全局错误处理器、SSR/水合/RPC 三层错误策略、跨边界错误映射

---

## 1. 设计哲学

```
✅ 每个错误都有类型，没有裸 Error
✅ 全局错误处理器捕获一切
✅ 操作性错误 → 结构化响应给用户
✅ 编程性错误 → 日志 + 通用 500
✅ 跨边界（SSR → 浏览器 → API）错误格式统一
```

---

## 2. 类型化错误层级

### 2.1 基础错误类

```typescript
// packages/vite/src/errors.ts

export class HvlError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message)
    this.name = 'HvlError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    }
  }
}
```

### 2.2 领域错误

```typescript
// HTTP 层错误
export class NotFoundError extends HvlError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
  }
}

export class UnauthorizedError extends HvlError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends HvlError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class ValidationError extends HvlError {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }>,
  ) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}

export class ConflictError extends HvlError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}

export class RateLimitError extends HvlError {
  constructor(public readonly retryAfter: number) {
    super('Too many requests', 'RATE_LIMITED', 429)
  }
}

// 框架内部错误
export class SsrRenderError extends HvlError {
  constructor(
    public readonly componentPath: string,
    public readonly cause: Error,
  ) {
    super(`SSR render failed: ${componentPath}`, 'SSR_RENDER_ERROR', 500, false)
  }
}

export class HydrationError extends HvlError {
  constructor(
    public readonly tagName: string,
    public readonly cause: Error,
  ) {
    super(`Hydration failed for <${tagName}>`, 'HYDRATION_ERROR', 500, false)
  }
}
```

---

## 3. 全局错误处理器

### 3.1 API 错误处理

```typescript
// packages/vite/src/error-handler.ts

import type { ErrorHandler } from 'hono'

export const globalErrorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') || 'unknown'

  // 操作性错误 → 结构化响应
  if (err instanceof HvlError && err.isOperational) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && { details: err.details }),
        ...(err instanceof RateLimitError && { retry_after: err.retryAfter }),
        request_id: requestId,
      },
    }, err.statusCode)
  }

  // 编程性错误 / 未知错误 → 日志 + 通用 500
  console.error('[HVL] Unhandled error', {
    error: err.message,
    stack: err.stack,
    request_id: requestId,
    path: c.req.path,
    method: c.req.method,
  })

  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: requestId,
    },
  }, 500)
}
```

### 3.2 注册到 Hono

```typescript
// 框架自动注册
app.onError(globalErrorHandler)
```

---

## 4. SSR 错误处理

### 4.1 组件渲染失败

```typescript
// packages/vite/src/ssr-handler.ts

async function renderPage(vite: ViteDevServer, route: RouteMatch): Promise<string> {
  try {
    const module = await vite.ssrLoadModule(route.filePath)
    const Page = module.default
    const { render } = await import('@lit-labs/ssr')
    return await render(Page, route.props)
  } catch (error) {
    // 开发模式：显示详细错误
    if (isDev) {
      return renderErrorOverlay({
        title: 'SSR Render Error',
        route: route.path,
        error: error as Error,
        stack: (error as Error).stack,
      })
    }
    // 生产模式：降级为 Error Boundary 占位符
    return renderErrorBoundary(route.path)
  }
}
```

### 4.2 Error Boundary 组件

```typescript
// 框架内置 Error Boundary Island
import { LitElement, html } from 'lit'

export class HvlErrorBoundary extends LitElement {
  static properties = {
    error: { type: Object },
  }

  render() {
    if (!this.error) return html`<slot></slot>`
    return html`
      <div class="hvl-error" role="alert">
        <p>⚠️ 页面渲染出错</p>
        ${isDev ? html`<pre>${this.error.message}</pre>` : ''}
      </div>
    `
  }
}
customElements.define('hvl-error-boundary', HvlErrorBoundary)
```

### 4.3 开发模式错误覆盖层

```html
<!-- 开发模式下的全屏错误提示 -->
<div class="hvl-error-overlay">
  <h2>SSR Render Error</h2>
  <p>Route: /dashboard</p>
  <pre>TypeError: Cannot read properties of undefined (reading 'name')</pre>
  <div class="hvl-error-stack">
    at render (app/routes/dashboard.ts:12:5)
    at handleSSR (packages/vite/src/ssr-handler.ts:45:8)
  </div>
</div>
```

---

## 5. 水合错误处理

### 5.1 Island 水合失败策略

```typescript
// packages/vite/src/client/hydrate.ts

async function hydrateIsland(tagName: string, loader: () => Promise<any>) {
  const elements = document.querySelectorAll(tagName)

  try {
    const mod = await loader()
    // SSR 已渲染结构，仅注册行为
    customElements.define(tagName, mod.default)

    // 等待所有实例升级
    await Promise.all(
      Array.from(elements).map(el =>
        customElements.whenDefined(tagName).then(() => el)
      )
    )
  } catch (error) {
    console.warn(`[HVL] Island <${tagName}> hydration failed:`, error)

    // 降级策略：SSR HTML 仍然可见（纯展示），仅丢失交互
    elements.forEach(el => {
      el.setAttribute('data-hvl-hydration-error', 'true')
      // 标记为已降级，辅助测试和日志
    })
  }
}
```

### 5.2 水合不匹配检测

```typescript
// 检测 SSR HTML 与客户端渲染不一致
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.target instanceof HTMLElement &&
        mutation.target.hasAttribute('data-hvl-hydration-error')) {
      // 上报水合错误（开发模式控制台警告，生产模式可上报）
      if (isDev) {
        console.error(`[HVL] Hydration mismatch for <${mutation.target.tagName.toLowerCase()}>`)
      }
    }
  }
})
observer.observe(document.body, { attributes: true, subtree: true })
```

---

## 6. RPC 错误处理

### 6.1 客户端错误类

```typescript
// packages/rpc/src/errors.ts

export class RpcError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly message: string,
    public readonly requestId?: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = 'RpcError'
  }
}
```

### 6.2 自动错误映射

```typescript
// packages/rpc/src/client.ts

async function rpcFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init)

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new RpcError(
      res.status,
      body?.error?.code || 'UNKNOWN_ERROR',
      body?.error?.message || `HTTP ${res.status}`,
      body?.error?.request_id,
      body?.error?.details,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
```

### 6.3 Lit ReactiveController 集成

```typescript
// packages/rpc/src/controller.ts

import { ReactiveController, ReactiveElement } from 'lit'

export class RpcController implements ReactiveController {
  private _loading = false
  private _error: RpcError | null = null

  get loading() { return this._loading }
  get error() { return this._error }

  constructor(private host: ReactiveElement) {
    host.addController(this)
  }

  hostConnected() {}

  async call<T>(fn: () => Promise<T>): Promise<T | null> {
    this._loading = true
    this._error = null
    this.host.requestUpdate()

    try {
      const result = await fn()
      return result
    } catch (err) {
      if (err instanceof RpcError) {
        this._error = err
      } else {
        this._error = new RpcError(0, 'NETWORK_ERROR', 'Network request failed')
      }
      return null
    } finally {
      this._loading = false
      this.host.requestUpdate()
    }
  }
}
```

### 6.4 自动重试（仅 5xx）

```typescript
async function rpcWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      // 4xx 不重试（客户端错误）
      if (err instanceof RpcError && err.status < 500) throw err
      // 最后一次也抛出
      if (attempt === maxRetries) throw err
      // 指数退避
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}
```

---

## 7. 跨边界错误映射

### 7.1 HTTP 状态码 → 用户消息

```typescript
// 框架内置映射，用户可覆盖
const defaultErrorMessages: Record<number, string> = {
  400: '请求格式有误，请检查后重试',
  401: '请先登录后继续',
  403: '您没有权限执行此操作',
  404: '您访问的内容不存在',
  409: '操作冲突，请刷新后重试',
  422: '输入信息有误，请检查后重试',
  429: '请求过于频繁，请稍后再试',
  500: '服务器出现异常，请稍后重试',
  502: '服务暂时不可用',
  503: '服务正在维护中',
}
```

### 7.2 Island 内错误展示

```typescript
// 在 Island 组件中使用 RpcController
class PostEditor extends LitElement {
  private rpc = new RpcController(this)

  render() {
    if (this.rpc.error) {
      return html`
        <div class="error-banner" role="alert">
          <p>${getErrorMessage(this.rpc.error)}</p>
          <button @click=${this.retry}>重试</button>
        </div>
      `
    }
    if (this.rpc.loading) {
      return html`<div class="skeleton">加载中...</div>`
    }
    return html`...`
  }
}
```

---

## 8. 错误日志

### 8.1 开发模式

```
[HVL] ❌ SSR Render Error
  Route: /dashboard
  File: app/routes/dashboard.ts:12:5
  Error: TypeError: Cannot read properties of undefined
  Stack:
    at render (app/routes/dashboard.ts:12:5)
    at handleSSR (@hvl/vite/src/ssr-handler.ts:45:8)

[HVL] ⚠️ Hydration failed for <my-counter>
  Error: Custom element already defined
  Falling back to static HTML

[HVL] ❌ API Error 404
  GET /api/posts/abc123
  Request-ID: req_xyz789
  Error: Post not found: abc123
```

### 8.2 生产模式

```json
{
  "level": "error",
  "timestamp": "2026-04-23T09:00:00Z",
  "message": "API Error",
  "request_id": "req_xyz789",
  "method": "GET",
  "path": "/api/posts/abc123",
  "status": 404,
  "error_code": "NOT_FOUND",
  "duration_ms": 12,
  "framework": "hvl"
}
```

---

## 9. 设计反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| `throw new Error('oops')` | `throw new NotFoundError('Post', id)` |
| 捕获错误后静默忽略 | 日志 + 结构化响应 |
| 返回 stack trace 给客户端 | 通用 500 + request_id |
| 在 handler 里 try/catch 每个错误 | 全局错误处理器统一处理 |
| 客户端重试 4xx 错误 | 仅重试 5xx（指数退避） |
| 水合失败导致白屏 | SSR HTML 仍可见，仅丢失交互 |
| 忽略网络错误 | 显示"无法连接"提示 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
