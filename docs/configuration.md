# KISS 配置管理

> 框架配置项、用户项目环境变量、多环境策略、启动验证

---

## 1. 设计哲学

```
✅ 所有配置集中管理，零散落 process.env
✅ 必需变量启动时验证，缺失则 fail fast
✅ 类型在配置层转换，不在使用处
✅ 提交 .env.example，绝不提交 .env
```

---

## 2. 框架配置（`kiss()` 选项）

### 2.1 完整配置项

```typescript
// vite.config.ts
import { kiss } from '@kiss/vite'

export default defineConfig({
  plugins: [
    kiss({
      // 路由配置
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',

      // SSR 配置
      ssr: {
        noExternal: ['lit', '@lit-labs/ssr', 'lit-html', '@lit/reactive-element'],
        preRender: false,    // 启用 SSG 预渲染
        preRenderRoutes: [], // 指定预渲染路由（空=全部静态路由）
      },

      // Island 配置
      island: {
        autoDetect: true,    // 自动扫描 islandsDir
        hydrationStrategy: 'lazy', // 'eager' | 'lazy' | 'idle' | 'visible'
      },

      // 开发服务器
      dev: {
        port: 3000,
        hmr: true,
        overlay: true,      // 错误覆盖层
      },

      // 构建配置
      build: {
        outDir: 'dist',
        ssgOutDir: 'dist/static',
      },

      // 中间件
      middleware: {
        cors: true,
        requestId: true,
        logger: true,
        rateLimit: false,    // 开发模式默认关闭
        securityHeaders: true,
      },
    }),
  ],
})
```

### 2.2 配置默认值

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `routesDir` | `'app/routes'` | 文件路由目录 |
| `islandsDir` | `'app/islands'` | Island 组件目录 |
| `componentsDir` | `'app/components'` | 普通 Lit 组件目录 |
| `ssr.noExternal` | `[lit packages]` | SSR 不外部化的包 |
| `ssr.preRender` | `false` | 是否启用 SSG |
| `island.autoDetect` | `true` | 自动检测 Island |
| `island.hydrationStrategy` | `'lazy'` | 水合策略 |
| `dev.port` | `3000` | 开发服务器端口 |
| `dev.overlay` | `true` | 显示错误覆盖层 |
| `middleware.cors` | `true` | 启用 CORS |
| `middleware.securityHeaders` | `true` | 启用安全头 |

---

## 3. 运行时环境变量

### 3.1 框架识别的环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | `3000` | 服务端口 |
| `HOST` | 否 | `0.0.0.0` | 监听地址 |
| `NODE_ENV` | 否 | `development` | 环境 |
| `ORIGIN` | 是* | — | 公开访问 URL（SSR 需要） |
| `SESSION_SECRET` | 是** | — | 会话加密密钥 |
| `JWT_SECRET` | 是** | — | JWT 签名密钥 |
| `DATABASE_URL` | 否 | — | 数据库连接串 |
| `LOG_LEVEL` | 否 | `info` | 日志级别 |

\* 生产环境必需
\** 使用认证功能时必需

### 3.2 客户端环境变量

Vite 内置的 `import.meta.env` 机制：

```typescript
// 仅 VITE_ 前缀的变量暴露给客户端
VITE_API_URL=https://api.example.com
VITE_PUBLIC_ORIGIN=https://example.com

// 客户端访问
const apiUrl = import.meta.env.VITE_API_URL
```

### 3.3 .env.example（项目模板）

```bash
# 服务端
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
ORIGIN=http://localhost:3000

# 认证（如使用）
# SESSION_SECRET=your-session-secret-here
# JWT_SECRET=your-jwt-secret-here

# 数据库（如使用）
# DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# 日志
LOG_LEVEL=debug

# 客户端
VITE_API_URL=http://localhost:3000
```

---

## 4. 启动验证

### 4.1 Fail-Fast 策略

```typescript
// packages/vite/src/config.ts

interface RuntimeConfig {
  port: number
  host: string
  origin: string
  nodeEnv: 'development' | 'production' | 'test'
  sessionSecret?: string
  jwtSecret?: string
  databaseUrl?: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

function loadConfig(): RuntimeConfig {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProd = nodeEnv === 'production'

  // 必需变量验证
  if (isProd && !process.env.ORIGIN) {
    throw new Error(
      '[KISS] ORIGIN environment variable is required in production. ' +
      'Set it to your public URL (e.g., https://example.com)'
    )
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    origin: process.env.ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
    nodeEnv: nodeEnv as RuntimeConfig['nodeEnv'],
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: (process.env.LOG_LEVEL as RuntimeConfig['logLevel']) || (isProd ? 'info' : 'debug'),
  }
}
```

### 4.2 类型安全访问

```typescript
// 框架导出配置访问器
import { getConfig } from '@kiss/vite'

const config = getConfig()
// config.port → number
// config.origin → string
// config.logLevel → 'debug' | 'info' | 'warn' | 'error'
```

---

## 5. 多环境策略

### 5.1 环境文件优先级

```
.env                    # 所有环境
.env.local              # 所有环境（不提交）
.env.[mode]             # 特定环境
.env.[mode].local       # 特定环境（不提交）
```

### 5.2 典型多环境配置

```bash
# .env                  — 共享默认值
PORT=3000
LOG_LEVEL=info

# .env.development      — 开发
ORIGIN=http://localhost:3000
LOG_LEVEL=debug

# .env.production       — 生产
ORIGIN=https://myapp.com
LOG_LEVEL=warn

# .env.local            — 个人覆盖（不提交）
DATABASE_URL=postgresql://localhost:5432/mydb_dev
```

### 5.3 .gitignore

```gitignore
.env.local
.env.*.local
```

---

## 6. 部署平台配置

| 平台 | 设置方式 | 关键变量 |
|------|---------|----------|
| **Cloudflare Pages** | Dashboard 环境变量 | `ORIGIN`, `SESSION_SECRET` |
| **Vercel** | `vercel.json` + Dashboard | `ORIGIN`, `JWT_SECRET` |
| **Deno Deploy** | `deno.json` + Dashboard | `ORIGIN`, `DATABASE_URL` |
| **Railway** | Dashboard + `railway.toml` | `ORIGIN`, `DATABASE_URL` |
| **Node.js (PM2)** | `ecosystem.config.cjs` | 全部 |

---

## 7. 配置反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| 硬编码端口/URL 在代码里 | 环境变量 + 配置层 |
| `process.env.X` 散落各处 | `getConfig()` 集中访问 |
| 提交 `.env` 到仓库 | 只提交 `.env.example` |
| 启动时不验证必需变量 | Fail fast，缺失立即报错 |
| 客户端读取服务端环境变量 | `VITE_` 前缀 + `import.meta.env` |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
