# KISS 部署指南

> Cloudflare Pages / Vercel / Deno Deploy / Bun / Node.js 多平台部署

---

## 1. 构建产物

### 1.1 双端构建输出

```
dist/
├── server/              # 服务端产物
│   ├── index.js         # SSR 入口
│   └── chunks/          # 服务端模块
├── client/              # 客户端产物
│   ├── assets/
│   │   ├── island-counter.[hash].js    # Island chunk
│   │   └── island-toggle.[hash].js     # Island chunk
│   └── hydrate.[hash].js               # 水合运行时
└── static/              # SSG 预渲染页面（如启用）
    ├── index.html
    ├── about/
    │   └── index.html
    └── posts/
        └── [id]/
            └── index.html
```

### 1.2 构建命令

```bash
# 标准构建（SSR + Islands）
deno task build

# 启用 SSG 预渲染
KISS_SSG=true deno task build

# 仅客户端构建（纯 SPA 模式）
KISS_SPA=true deno task build
```

---

## 2. Cloudflare Pages

### 2.1 部署配置

```toml
# wrangler.toml
name = "my-kiss-app"
compatibility_date = "2026-04-23"

[site]
bucket = "./dist/static"

[build]
command = "deno task build"
```

### 2.2 适配器

```typescript
// app/server.ts — Cloudflare Workers 入口
import { handle } from 'hono/cloudflare-pages'
import app from './.kiss/server'

export const onRequest: PagesFunction = async (context) => {
  return handle(app, context.request)
}
```

### 2.3 环境变量

在 Cloudflare Dashboard → Settings → Environment variables 设置：
- `ORIGIN` = `https://your-app.pages.dev`
- `SESSION_SECRET` = (生成随机密钥)

### 2.4 注意事项

- Cloudflare Workers **不支持** `ssrLoadModule`，需要 SSG 预渲染
- 动态路由需在 `wrangler.toml` 中声明路由规则
- Island JS 通过 `dist/client/` 静态资源提供

---

## 3. Vercel

### 3.1 部署配置

```json
// vercel.json
{
  "buildCommand": "deno task build",
  "outputDirectory": "dist/static",
  "framework": null,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs22.x"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/ssr" }
  ]
}
```

### 3.2 Serverless Function

```typescript
// api/ssr.ts — Vercel Serverless Function
import app from '../.kiss/server'

export default app

export const config = {
  maxDuration: 10,
}
```

### 3.3 环境变量

Vercel Dashboard → Settings → Environment Variables：
- `ORIGIN` = `https://your-app.vercel.app`
- `SESSION_SECRET`
- `DATABASE_URL`（如使用）

---

## 4. Deno Deploy

### 4.1 入口文件

```typescript
// main.ts — Deno Deploy 入口
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import app from './.kiss/server.ts'

serve(app.fetch, {
  port: parseInt(Deno.env.get('PORT') || '8000'),
})
```

### 4.2 部署命令

```bash
deployctl deploy --project=my-kiss-app main.ts
```

### 4.3 注意事项

- Deno 支持 `ssrLoadModule`，可使用运行时 SSR
- 需要配置 `deno.json` 的 `imports` 映射
- Island JS 作为静态资源托管

---

## 5. Node.js（PM2 / Docker）

### 5.1 入口文件

```typescript
// server.ts — Node.js 生产服务器
import { serve } from '@hono/node-server'
import app from './.kiss/server'

const port = parseInt(process.env.PORT || '3000')

serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`[KISS] Server running on http://localhost:${port}`)
})
```

### 5.2 PM2

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'my-kiss-app',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
```

### 5.3 Docker

```dockerfile
# Dockerfile
FROM denoland/deno:2-alpine AS builder
WORKDIR /app
COPY . .
RUN deno task build

FROM denoland/deno:2-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "dist/server/index.js"]
```

### 5.4 Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ORIGIN=http://localhost:3000
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 6. Bun

### 6.1 入口文件

```typescript
// server.ts — Bun 生产服务器
import app from './.kiss/server'

Bun.serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '3000'),
})
```

### 6.2 运行

```bash
bun run dist/server/index.js
```

---

## 7. 静态托管（SSG 模式）

### 7.1 启用 SSG

```bash
# 构建时预渲染所有静态路由
KISS_SSG=true deno task build
```

### 7.2 支持平台

| 平台 | 部署方式 | 配置 |
|------|---------|------|
| **GitHub Pages** | `dist/static/` 推到 gh-pages 分支 | `.nojekyll` 文件 |
| **Netlify** | 指定 `dist/static` 为发布目录 | `_redirects` 配置 |
| **S3 + CloudFront** | 上传 `dist/static/` 到 S3 | CloudFront 分发 |
| **Cloudflare Pages** | 指定构建输出目录 | `wrangler.toml` |

### 7.3 SPA 回退

```nginx
# nginx — SPA 回退配置
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 8. 部署检查清单

### 8.1 部署前

- [ ] `deno task build` 成功，无错误
- [ ] `deno task typecheck` 通过
- [ ] `deno task test` 通过
- [ ] 环境变量已配置（ORIGIN、SESSION_SECRET 等）
- [ ] `.env` 未提交到仓库
- [ ] 构建产物大小合理（客户端 JS < 预算）

### 8.2 部署后

- [ ] 首页可访问，HTML 包含内容
- [ ] Island 组件可交互
- [ ] API 路由正常响应
- [ ] HTTPS 正常
- [ ] 安全头已设置（检查 `curl -I`）
- [ ] 404 页面正常
- [ ] 日志输出正常

### 8.3 监控

```typescript
// 健康检查端点（框架自动注册）
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))
app.get('/ready', async (c) => {
  // 检查数据库连接等
  const checks = { database: await checkDb() }
  const ok = Object.values(checks).every(c => c.status === 'ok')
  return c.json({ status: ok ? 'ok' : 'degraded', checks }, ok ? 200 : 503)
})
```

---

## 9. 部署反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| 在生产使用 `vite dev` | 构建后部署 `dist/` |
| 硬编码端口在代码里 | 环境变量 `PORT` |
| 把 `.env` 打包进镜像 | 运行时注入环境变量 |
| 单实例无健康检查 | `/health` + `/ready` 端点 |
| 不设安全头 | 框架自动注入 + 自定义 CSP |
| Edge Runtime 用运行时 SSR | SSG 预渲染或 Node.js 运行时 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
