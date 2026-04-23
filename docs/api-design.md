# HVL API 设计规范

> 框架内置 API 层的设计标准——Hono 路由、验证、错误响应、RPC 类型安全

---

## 1. 设计哲学

HVL 的 API 层建立在 Hono 之上，遵循三个原则：

| 原则 | 说明 |
|------|------|
| **Web Standards First** | 路由处理器返回标准 `Response`，输入使用标准 `Request`/`FormData` |
| **类型安全贯穿** | Zod 验证（用户选择）→ Hono RPC → 客户端自动推断，零 codegen |
| **约定优于配置** | `app/routes/api/` 目录下的文件自动注册为 API 路由 |

> ⚠️ **Zod 和 @hono/zod-validator 不是框架依赖**，而是用户项目层面的选择。框架提供 Hono RPC 类型推断（`hc<AppType>()`），不强制验证方案。详见 [ADR-001 C5](./adr-001-hard-constraints.md#c5-zod--honozod-validator-不属于框架依赖)。

---

## 2. 路由约定

### 2.1 文件路由映射

```
app/routes/api/posts.ts       →  GET/POST   /api/posts
app/routes/api/posts/[id].ts  →  GET/PUT/DEL /api/posts/:id
app/routes/api/auth/login.ts  →  POST        /api/auth/login
```

### 2.2 路由文件结构

```typescript
// app/routes/api/posts.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// GET /api/posts — 列表
app.get('/', async (c) => {
  const posts = await listPosts(c.req.query())
  return c.json({ data: posts, meta: { total: posts.length } })
})

// POST /api/posts — 创建
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

app.post('/', zValidator('json', CreatePostSchema), async (c) => {
  const input = c.req.valid('json')
  const post = await createPost(input)
  return c.json({ data: post }, 201)
})

export default app
export type AppType = typeof app  // ← RPC 类型推断源
```

### 2.3 路由合并

框架自动合并 `app/routes/api/` 下所有路由文件到 Hono 实例：

```typescript
// 框架内部逻辑（自动完成）
const api = new Hono()
api.route('/posts', postsApp)       // from api/posts.ts
api.route('/posts/:id', postApp)    // from api/posts/[id].ts
api.route('/auth/login', loginApp)  // from api/auth/login.ts
```

---

## 3. 请求验证

### 3.1 Zod 集成

所有 API 输入必须通过 Zod 验证——这是框架的硬性规则。

```typescript
import { zValidator } from '@hono/zod-validator'

// JSON Body
app.post('/', zValidator('json', schema), handler)

// Query String
app.get('/', zValidator('query', listSchema), handler)

// Form Data
app.post('/upload', zValidator('form', formSchema), handler)

// Path Params
app.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), handler)
```

### 3.2 验证失败响应

验证失败统一返回 422：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "String must contain at least 1 character(s)" },
      { "field": "content", "message": "Required" }
    ]
  }
}
```

### 3.3 自定义验证错误格式

```typescript
// 框架提供全局 hook 统一格式
app.use('*', async (c, next) => {
  await next()
  // zValidator 失败时，c.res 已被设置
  if (c.res.status === 400 && c.res.headers.get('X-Zod-Error')) {
    const zodError = c.get('zodError')
    return c.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: zodError.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    }, 422)
  }
})
```

---

## 4. 响应格式

### 4.1 成功响应

```typescript
// 单个资源
return c.json({ data: post }, 200)

// 创建资源
return c.json({ data: post }, 201)

// 资源列表（带分页）
return c.json({
  data: posts,
  meta: {
    total: 100,
    page: 1,
    per_page: 20,
    total_pages: 5,
  },
}, 200)

// 无内容
return c.body(null, 204)
```

### 4.2 错误响应

所有错误使用统一格式（详见 [error-handling.md](./error-handling.md)）：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found: abc123",
    "request_id": "req_abc123"
  }
}
```

---

## 5. Hono RPC 类型安全

### 5.1 端到端类型推断

```typescript
// 服务端：app/routes/api/posts.ts
const app = new Hono()
  .get('/', zValidator('query', ListSchema), (c) => c.json({ data: [] }))
  .post('/', zValidator('json', CreateSchema), (c) => c.json({ data: {} }, 201))

export default app
export type AppType = typeof app  // ← 这是类型推断的关键

// 客户端：自动获得类型
import { hc } from '@hvl/rpc'
import type { AppType } from '../routes/api/posts'

const client = hc<AppType>('/api/posts')

// ✅ 完全类型安全
const res = await client.$post({
  json: { title: 'Hello', content: 'World' }  // ← Zod schema 推断
})
const data = await res.json()  // ← 响应类型自动推断
```

### 5.2 多路由类型合并

```typescript
// 框架自动合并所有 API 路由类型
import type { PostsType } from '../routes/api/posts'
import type { AuthType } from '../routes/api/auth/login'

type ApiType = PostsType & AuthType

const client = hc<ApiType>('/')
// client.api.posts.$get()
// client.api.auth.login.$post()
```

---

## 6. 中间件栈

### 6.1 标准中间件顺序

```
Request → RequestID → Logger → CORS → RateLimit → BodyParse
       → Auth → Validation → Handler → ErrorHandler → Response
```

### 6.2 框架内置中间件

```typescript
// 框架自动注册（用户无需手动配置）
app.use('*', requestId())      // 1. 请求 ID
app.use('*', logger())         // 2. 结构化日志
app.use('/api/*', cors())      // 3. CORS
app.use('/api/*', rateLimit()) // 4. 限流
app.use('*', secureHeaders())  // 5. 安全头
```

### 6.3 用户自定义中间件

```typescript
// app/routes/_middleware.ts — 全局中间件
import { createMiddleware } from 'hono/factory'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) throw new UnauthorizedError()
  c.set('user', verifyToken(token))
  await next()
})

// app/routes/api/_middleware.ts — API 专属中间件
app.use('/api/*', authMiddleware)
```

---

## 7. 认证集成

### 7.1 JWT 策略

```typescript
// 框架提供 @hvl/auth 插件（可选）
import { hvlAuth } from '@hvl/auth'

app.use('/api/*', hvlAuth({
  jwtSecret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  // 路由级白名单
  exclude: ['/api/auth/login', '/api/auth/register', '/api/health'],
}))
```

### 7.2 会话策略

```typescript
// Cookie-based session（适合 SSR 优先场景）
app.use('/api/*', hvlSession({
  cookieName: 'hvl_session',
  secret: process.env.SESSION_SECRET,
  maxAge: 60 * 60 * 24 * 7,  // 7 days
}))
```

---

## 8. 分页与排序

### 8.1 标准分页参数

```typescript
const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// GET /api/posts?page=2&per_page=10&sort=created_at&order=desc
```

### 8.2 分页响应格式

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 2,
    "per_page": 10,
    "total_pages": 10
  },
  "links": {
    "self": "/api/posts?page=2&per_page=10",
    "next": "/api/posts?page=3&per_page=10",
    "prev": "/api/posts?page=1&per_page=10"
  }
}
```

---

## 9. 版本控制

### 9.1 URL 路径版本（推荐）

```
app/routes/api/v1/posts.ts  →  /api/v1/posts
app/routes/api/v2/posts.ts  →  /api/v2/posts
```

### 9.2 Header 版本（可选）

```typescript
app.use('/api/*', async (c, next) => {
  const version = c.req.header('Accept-Version') || 'v1'
  c.set('apiVersion', version)
  await next()
})
```

---

## 10. 设计反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| 跳过 Zod 验证直接信任客户端输入 | 所有 API 输入必须验证 |
| 返回原始 Error stack trace | 统一错误格式 + request_id |
| 硬编码 API URL 在客户端 | 环境变量 + hc() 自动推断 |
| 手动同步前后端类型 | Hono RPC 自动推断 |
| 在 handler 里写业务逻辑 | 提取到 service 层 |
| 返回没有 meta 的列表 | 始终包含分页信息 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
