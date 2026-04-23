# HVL 测试策略

> 框架自身测试 + 用户项目测试模板、分层策略、CI 集成

---

## 1. 测试分层

```
                    ┌─────────────┐
                    │   E2E 测试   │  ← 少量，关键流程
                    │  (Playwright) │     跨浏览器验证
                    ├─────────────┤
                    │  集成测试     │  ← 中等，API + SSR
                    │  (Deno test) │     真实模块交互
                    ├─────────────┤
                    │  单元测试     │  ← 大量，纯逻辑
                    │  (Deno test) │     隔离、快速
                    └─────────────┘
```

| 层级 | 占比 | 速度 | 目的 |
|------|------|------|------|
| 单元 | 70% | <10ms/个 | 验证独立函数/组件逻辑 |
| 集成 | 20% | <100ms/个 | 验证模块协作（路由+SSR+渲染） |
| E2E | 10% | 秒级 | 验证关键用户流程 |

---

## 2. 框架自身测试

### 2.1 测试工具

| 工具 | 用途 | 理由 |
|------|------|------|
| **Deno test** | 单元 + 集成 | Deno 内置，零配置，极速 |
| **Playwright** | E2E | 多浏览器，SSR 验证 |
| **@lit-labs/testing** | Lit 组件测试 | 官方工具，Shadow DOM 支持 |

> ⚠️ 测试框架已从 Vitest 迁移到 Deno 内置测试（`Deno.test()` + `jsr:@std/assert`）。详见 [ADR-001 C1](./adr-001-hard-constraints.md#c1-纯-esm零-cjs)。

### 2.2 核心模块测试矩阵

| 模块 | 单元测试 | 集成测试 | E2E 测试 |
|------|---------|---------|----------|
| `route-scanner` | ✅ 文件名→路由映射 | ✅ 完整目录扫描 | — |
| `island-transform` | ✅ AST 标记注入 | ✅ transform 输出验证 | — |
| `ssr-handler` | ✅ 错误边界逻辑 | ✅ Vite SSR + Lit 渲染 | ✅ 页面输出 HTML |
| `dev-server` | — | ✅ Hono 中间件注入 | ✅ 请求/响应完整链路 |
| `build-ssr` | ✅ 构建配置验证 | ✅ 产物检查 | ✅ 部署后可访问 |
| `build-client` | ✅ Island 提取 | ✅ bundle 分析 | ✅ 浏览器水合成功 |
| `html-template` | ✅ 注入脚本逻辑 | — | — |

### 2.3 关键测试用例

#### 路由扫描

```typescript
// packages/vite/__tests__/route-scanner.test.ts
import { assertEquals } from 'jsr:@std/assert'
import { scanRoutes } from '../src/route-scanner.ts'

Deno.test('route-scanner: maps index.ts to /', async () => {
  const routes = await scanRoutes('./fixtures/routes-basic')
  assertEquals(routes.some(r => r.path === '/' && r.filePath.includes('index')), true)
})

Deno.test('route-scanner: maps [id].ts to /:id', async () => {
  const routes = await scanRoutes('./fixtures/routes-dynamic')
  assertEquals(routes.some(r => r.path === '/posts/:id'), true)
})

Deno.test('route-scanner: ignores _renderer and _middleware', async () => {
  const routes = await scanRoutes('./fixtures/routes-layout')
  const paths = routes.map(r => r.path)
  assertEquals(paths.includes('/_renderer'), false)
  assertEquals(paths.includes('/_middleware'), false)
})
```

#### SSR 渲染

```typescript
// packages/vite/__tests__/ssr-handler.test.ts
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert'

Deno.test('ssr-handler: renders Lit component to HTML with DSD', async () => {
  const html = await renderPage(TestPage, {})
  assertStringIncludes(html, '<template shadowroot="open"')
  assertStringIncludes(html, '<h1>Test Page</h1>')
})

Deno.test('ssr-handler: includes Island hydrate script', async () => {
  const html = await renderPage(PageWithIsland, {})
  assertStringIncludes(html, 'data-islands')
  assertStringIncludes(html, 'my-counter')
})

Deno.test('ssr-handler: returns error boundary on render failure', async () => {
  const html = await renderPage(BrokenPage, {})
  assertStringIncludes(html, 'hvl-error-boundary')
})
```

#### Island 水合

```typescript
// packages/vite/__tests__/island-hydrate.test.ts
import { assertStringIncludes, assertEquals } from 'jsr:@std/assert'

Deno.test('island-hydrate: transforms island component with __island marker', () => {
  const result = islandTransform(islandCode, '/app/islands/counter.ts')
  assertStringIncludes(result, 'export const __island = true')
  assertStringIncludes(result, "export const __tagName = 'my-counter'")
})

Deno.test('island-hydrate: skips non-island files', () => {
  const result = islandTransform(compCode, '/app/components/header.ts')
  assertEquals(result, null)
})
```

#### E2E — 完整流程

```typescript
// e2e/basic-flow.spec.ts
import { test, expect } from '@playwright/test'

test('SSR page renders HTML without JS', async ({ page }) => {
  await page.goto('/')
  // 禁用 JS 也应该能看到内容
  const heading = await page.textContent('h1')
  expect(heading).toBe('Hello World')
})

test('Island hydrates on interaction', async ({ page }) => {
  await page.goto('/')
  const counter = page.locator('my-counter')
  await counter.locator('button.increment').click()
  await expect(counter.locator('span.count')).toHaveText('1')
})

test('API returns typed JSON', async ({ request }) => {
  const res = await request.get('/api/posts')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('data')
  expect(body).toHaveProperty('meta')
})
```

---

## 3. 用户项目测试

### 3.1 框架提供的测试工具

```typescript
// @hvl/testing — 框架测试辅助包
import { createTestApp, renderPage, fetchApi } from '@hvl/testing'

// 创建测试用 Hono 应用
const app = createTestApp({
  routesDir: './app/routes',
})

// 渲染页面
const html = await renderPage(app, '/about')

// 调用 API
const res = await fetchApi(app, 'GET', '/api/posts')
```

### 3.2 Lit 组件测试

```typescript
// 用户项目的组件测试
import { fixture, assert } from '@open-wc/testing'
import { MyCounter } from './counter'

describe('my-counter', () => {
  it('increments on button click', async () => {
    const el = await fixture<MyCounter>(html`<my-counter></my-counter>`)
    el.shadowRoot!.querySelector('button.increment')!.click()
    await el.updateComplete
    assert.equal(el.count, 1)
  })
})
```

### 3.3 API 路由测试

```typescript
// tests/api/posts.test.ts
import { describe, it, expect } from 'vitest'
import app from '../../app/routes/api/posts'

describe('POST /api/posts', () => {
  it('creates a post', async () => {
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', content: 'Hello' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.title).toBe('Test')
  })

  it('returns 422 on invalid input', async () => {
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),  // missing required fields
    })
    expect(res.status).toBe(422)
  })
})
```

---

## 4. CI 配置

### 4.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        deno-version: [2.x]

    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: ${{ matrix.deno-version }}

      - run: deno task build
      - run: deno task test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: deno task lint
      - run: deno task typecheck
```

### 4.2 质量门禁

| 检查 | 阻塞 | 说明 |
|------|------|------|
| 类型检查 | ✅ | `tsc --noEmit` |
| Lint | ✅ | ESLint + Prettier |
| 单元测试覆盖率 > 80% | ✅ | Deno test --coverage |
| 集成测试通过 | ✅ | 关键模块交互 |
| E2E 关键流程 | ✅ | 首页渲染、Island 水合、API 调用 |
| Bundle 大小检查 | ⚠️ | 客户端产物不超过预期 |

---

## 5. 测试反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| Mock 所有依赖 | Repository mock，Service 和 Controller 用真实实例 |
| 测试实现细节 | 测试行为和输出 |
| E2E 测试覆盖所有路径 | 仅覆盖关键用户流程 |
| 集成测试连接真实数据库 | 使用内存 DB 或事务回滚 |
| 跳过失败的测试 | 修复或标记为 known issue |
| 只在 CI 跑测试 | 开发时 `deno task test` 实时反馈 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
