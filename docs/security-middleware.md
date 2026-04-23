# KISS 安全与中间件栈

> 安全头、CORS、限流、输入验证、中间件链顺序

---

## 1. 中间件链

### 1.1 标准顺序

```
Request → RequestID → Logger → CORS → SecurityHeaders
       → RateLimit → BodyParse → Auth → Validation → Handler
       → ErrorHandler → Response
```

顺序原则：越早的中间件影响范围越大，越晚的越具体。

### 1.2 框架自动注册

```typescript
// 框架内部注册（用户无需手动）
const app = new Hono()

app.use('*', requestId())        // 1. 请求 ID — 所有日志和错误追踪的基础
app.use('*', logger())           // 2. 结构化日志 — 记录请求进入
app.use('*', corsMiddleware())   // 3. CORS — 跨域策略
app.use('*', securityHeaders())  // 4. 安全头 — 防御 XSS、点击劫持等
app.use('/api/*', rateLimit())   // 5. 限流 — 防暴力攻击
app.use('*', bodyParse())        // 6. 请求体解析 — Hono 内置
// 用户中间件注入点
app.use('*', errorHandler())     // N. 全局错误处理 — 兜底
```

---

## 2. 安全头

### 2.1 默认安全头

```typescript
// packages/vite/src/middleware/security-headers.ts
import { secureHeaders } from 'hono/secure-headers'

// Hono 内置安全头，框架默认启用
app.use('*', secureHeaders())

// 等效于以下响应头：
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}
```

### 2.2 CSP 策略

```typescript
// 用户可自定义 CSP（覆盖默认值）
kiss({
  middleware: {
    securityHeaders: true,
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],  // Island 水合需要 inline
      'style-src': ["'self'", "'unsafe-inline'"],    // Lit 组件样式
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],                      // RPC 请求
    },
  },
})
```

> ⚠️ Island 水合脚本目前需要 `'unsafe-inline'`。未来版本将通过 nonce 替代。

---

## 3. CORS

### 3.1 开发模式

```typescript
// 开发模式：宽松 CORS（localhost 任意端口）
app.use('*', cors({
  origin: [/^http:\/\/localhost:\d+$/],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}))
```

### 3.2 生产模式

```typescript
// 生产模式：严格 CORS（仅允许配置的 ORIGIN）
app.use('*', cors({
  origin: process.env.ORIGIN,  // 从环境变量读取
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}))
```

### 3.3 规则

```
✅ 生产环境明确指定 origin，不用 *
✅ credentials: true 时 origin 不能是 *
✅ 配合 ORIGIN 环境变量管理
❌ 绝不在生产用 origin: '*'
```

---

## 4. 限流

### 4.1 内置限流

```typescript
// packages/vite/src/middleware/rate-limit.ts
import { rateLimiter } from 'hono-rate-limiter'

// 框架默认配置
app.use('/api/*', rateLimiter({
  windowMs: 60 * 1000,    // 1 分钟窗口
  max: 100,               // 每窗口最大请求数
  standardHeaders: true,  // 返回 RateLimit-* 头
  legacyHeaders: false,   // 不返回 X-RateLimit-* 头
  keyGenerator: (c) => {
    return c.req.header('X-Forwarded-For')?.split(',')[0]
        || c.req.header('X-Real-IP')
        || 'unknown'
  },
}))
```

### 4.2 用户自定义

```typescript
// 特定路由更严格的限流
app.use('/api/auth/login', rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                     // 每窗口 5 次
  skipSuccessfulRequests: true, // 成功的不计数
}))

// 文件上传限流
app.use('/api/upload', rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
}))
```

### 4.3 限流响应

```json
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1682236800

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 45,
    "request_id": "req_abc123"
  }
}
```

---

## 5. 输入验证

### 5.1 全局验证钩子

```typescript
// 框架自动注册 — 所有 /api/* 路由强制 Zod 验证
app.use('/api/*', async (c, next) => {
  await next()
  // 如果路由使用了 zValidator，验证失败自动拦截
  // 如果路由没有验证，开发模式输出警告
  if (isDev && !c.req.route.includes('zValidator')) {
    console.warn(`[KISS] Route ${c.req.path} has no input validation`)
  }
})
```

### 5.2 常见验证模式

```typescript
// UUID 参数
const IdSchema = z.object({ id: z.string().uuid() })

// 分页查询
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

// 文件上传
const UploadSchema = z.object({
  file: z.instanceof(File).refine(f => f.size < 10 * 1024 * 1024, 'Max 10MB'),
  type: z.enum(['avatar', 'document', 'image']),
})
```

---

## 6. 认证中间件

### 6.1 JWT Bearer

```typescript
// packages/vite/src/middleware/auth.ts
import { jwt } from 'hono/jwt'

// 框架提供的认证中间件（可选启用）
export function authMiddleware(options: AuthOptions) {
  return async (c, next) => {
    // 白名单路由跳过
    if (options.exclude?.some(p => c.req.path.startsWith(p))) {
      return next()
    }

    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedError()

    try {
      const payload = await jwt.verify(token, options.secret)
      c.set('user', { id: payload.sub, roles: payload.roles })
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }

    await next()
  }
}
```

### 6.2 Cookie Session

```typescript
// SSR 优先场景推荐 Cookie Session
import { getCookie } from 'hono/cookie'

export function sessionMiddleware(options: SessionOptions) {
  return async (c, next) => {
    const sid = getCookie(c, options.cookieName)
    if (!sid) throw new UnauthorizedError()

    const session = await sessionStore.get(sid)
    if (!session) throw new UnauthorizedError('Session expired')

    c.set('user', session.user)
    c.set('session', session)
    await next()
  }
}
```

---

## 7. 安全清单

### 7.1 框架级（自动）

- [x] 安全头（X-Content-Type-Options, X-Frame-Options, etc.）
- [x] CORS 策略（开发宽松，生产严格）
- [x] 请求 ID 追踪
- [x] 输入验证强制（开发模式警告）
- [x] 限流保护
- [x] HSTS（Strict-Transport-Security）

### 7.2 用户级（需配置）

- [ ] HTTPS 强制（部署平台配置）
- [ ] 认证中间件（JWT / Session）
- [ ] CSP 策略调整（如需 CDN / 外部资源）
- [ ] 敏感数据加密（数据库 / 环境变量）
- [ ] 日志脱敏（不记录密码、token）

---

## 8. 安全反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| CORS `origin: '*'` 在生产 | 明确指定 ORIGIN |
| 跳过输入验证 | 所有 API 入口 Zod 验证 |
| JWT 存 localStorage | httpOnly cookie + 内存 |
| 在 URL 传 token | Authorization header |
| 记录密码/token 到日志 | 日志脱敏 |
| 手动拼接 SQL | ORM / 参数化查询 |
| 信任 X-Forwarded-For | 配置信任代理层级 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
