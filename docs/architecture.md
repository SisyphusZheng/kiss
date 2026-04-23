# HVL 架构设计文档

> Hono + Vite + Lit 全栈框架架构详解

---

## 1. 架构总览

### 1.1 用户视角

```typescript
// vite.config.ts — 唯一配置
import framework from '@hvl/vite'
export default defineConfig({
  plugins: [framework()]
})
```

### 1.2 插件内部架构

```
┌─────────────────────────────────────────────────────────────┐
│                    @hvl/vite (核心插件)                      │
│                                                             │
│  ┌─ configureServer ───────────────────────────────────┐   │
│  │  Hono app ← Vite middlewares                        │   │
│  │                                                      │   │
│  │  app.use('/api/*', apiMiddleware)     # API 直通    │   │
│  │  app.use('*', pageHandler)            # 页面 SSR      │   │
│  │    ├─ 文件路由匹配 (virtual:routes)                 │   │
│  │    ├─ Vite SSR 加载页面组件                           │   │
│  │    ├─ @lit-labs/ssr 渲染 → HTML                     │   │
│  │    ├─ 收集 Island → 注入水合脚本                     │   │
│  │    └─ 返回 Response                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ resolveId + load ─────────────────────────────────┐    │
│  │  virtual:routes  → 扫描 app/routes/ 生成路由表       │    │
│  │  virtual:islands → 扫描 app/islands/ 生成 Island 表 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ transform ────────────────────────────────────────┐    │
│  │  Island 组件 AST 标记 (__island, __tagName)          │    │
│  │  客户端入口代码自动生成                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ build ───────────────────────────────────────────┐     │
│  │  Step 1: build({ ssr: true })        服务端构建     │     │
│  │  Step 2: build({ input: client.ts })  客户端构建     │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─ transformIndexHtml ─────────────────────────────┐     │
│  │  注入 Island 水合脚本、样式链接、meta 标签           │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 数据流

### 2.1 开发模式数据流

```mermaid
flowchart LR
    subgraph Client["🌐 浏览器"]
        Req["HTTP Request"]
        Res["HTML + DSD"]
    end

    subgraph ViteDev["⚡ Vite Dev Server"]
        HM["Hono Middleware"]
        FR["文件路由匹配"]
        SSR["Vite ssrLoadModule"]
        LitR["@lit-labs/ssr"]
        IslC["Island 收集器"]
        Inj["水合脚本注入"]
    end

    subgraph FS["📁 文件系统"]
        Routes["app/routes/*.ts"]
        Islands["app/islands/*.ts"]
        Comps["app/components/*.ts"]
    end

    Req --> HM
    HM -->|API 路由| API_H["Hono 直通处理"]
    HM -->|页面路由| FR
    FR -->|查找路由模块| Routes
    SSR -->|加载组件| Routes
    SSR -->|加载组件| Islands
    SSR -->|加载组件| Comps
    SSR --> LitR
    LitR --> IslC
    IslC -->|提取 Island 标记| Islands
    IslC --> Inj
    Inj --> Res
    API_H --> Res
```

### 2.2 构建模式数据流

```mermaid
flowchart TB
    subgraph Build["📦 Vite Build"]
        SB["Step 1: 服务端构建<br/>ssr: true"]
        CB["Step 2: 客户端构建<br/>仅 Islands + 入口"]
    end

    subgraph Output["产物"]
        SBundle["服务端 Bundle<br/>(SSR Entry)"]
        CBundle["客户端 Bundle<br/>(Island JS only)"]
    end

    subgraph Runtime["运行时"]
        Edge["CF Workers / Deno / Bun"]
        Node["Node.js"]
        Browser["浏览器"]
    end

    SB --> SBundle
    CB --> CBundle
    Edge -->|"部署"| SBundle
    Node -->|"运行"| SBundle
    Browser -->|"加载"| CBundle
    Browser -->|"渲染"| StaticHTML["预渲染 HTML"]
```

---

## 3. 渐进增强层级

### 3.1 层级模型

```mermaid
flowchart TD
    L0["Level 0: 纯 HTML SSR<br/>✅ 零 JS · 完整内容可达<br/>Vite SSR + @lit-labs/ssr"]
    L1["Level 1: Islands 交互<br/>🔄 仅交互组件加载 JS<br/>Vite transform 检测"]
    L2["Level 2: 客户端导航<br/>📍 SPA 路由 · 预加载<br/>可选插件"]
    L3["Level 3: 实时功能<br/>⚡ WebSocket / SSE<br/>Hono 中间件"]
    L4["Level 4: 全页 CSR<br/>🏃‍♂️ 极端交互场景<br/>Escape Hatch"]

    L0 -->|"按需升级"| L1
    L1 -->|"按需开启"| L2
    L2 -->|"按需添加"| L3
    L3 -->|"极端降级"| L4
    
    style L0 fill:#4CAF50,color:#fff
    style L1 fill:#2196F3,color:#fff
    style L2 fill:#9E9E9E,color:#fff
    style L3 fill:#9E9E9E,color:#fff
    style L4 fill:#9E9E9E,color:#fff
```

### 3.2 各层级输出对比

| 层级 | 首页 JS | 交互能力 | 适用场景 |
|------|---------|----------|----------|
| Level 0 | **0 KB** | 无（纯静态） | 博客文章、文档页、SEO 关键页 |
| Level 1 | **~6KB** | Island 内部交互 | 大部分 Web 应用 |
| Level 2 | **~10KB+** | SPA 导航 + 预加载 | 后台管理、仪表盘 |
| Level 3 | **~12KB+** | 实时推送 | 协作工具、聊天 |
| Level 4 | **全量** | 纯 CSR | 复杂表单、富编辑器 |

---

## 4. 包结构与依赖关系

### 4.1 Monorepo 结构

```mermaid
flowchart TB
    subgraph Root["framework/"]
        WS["deno.json"]
        PKG["package.json"]
        
        subgraph Packages["packages/"]
            VP["@hvl/vite<br/>核心插件包"]
            RP["@hvl/rpc<br/>RPC 客户端包"]
            CR["create-hvl<br/>脚手架工具"]
        end
        
        subgraph Examples["examples/"]
            BL["blog/"]
            DS["dashboard/"]
            TA["todo-app/"]
        end
    end

    RP -->|"依赖 hc() 类型推断"| VP
    CR -->|"模板使用"| VP
    CR -->|"模板使用"| RP
    BL -->|"使用"| VP
    BL -->|"使用"| RP
    DS -->|"使用"| VP
    DS -->|"使用"| RP
    TA -->|"使用"| VP
    TA -->|"使用"| RP
```

### 4.2 `@hvl/vite` 内部模块依赖

```
index.ts          ← 插件入口，导出 framework()
  ├── plugin.ts   ← 组合所有子插件为单一 Plugin[]
  │     ├── dev-server.ts         ← configureServer
  │     │     └── hono-app.ts     ← Hono 应用创建
  │     │     └── ssr-handler.ts  ← SSR + Lit 渲染协调
  │     │           └── context.ts ← 请求上下文
  │     ├── route-scanner.ts      ← resolveId/load 虚拟模块
  │     ├── island-transform.ts   ← transform Island 标记
  │     ├── island-extractor.ts   ← 构建时 Island 提取
  │     ├── build-ssr.ts          ← 服务端构建配置
  │     ├── build-client.ts       ← 客户端构建配置
  │     ├── html-template.ts      ← transformIndexHtml
  │     └── ssg.ts               ← 可选 SSG 构建
  └── types.ts     ← 公共类型定义
```

---

## 5. 请求生命周期

### 5.1 页面请求完整流程

```mermaid
sequenceDiagram
    participant B as 浏览器
    participant V as Vite Dev Server
    participant H as Hono App
    participant R as Route Scanner
    participant S as Vite SSR Engine
    participant L as Lit Renderer
    participant I as Island Collector

    B->>V: GET /about
    V->>H: 中间件转发
    H->>R: 匹配文件路由
    R-->>H: route = { path: '/about', filePath: 'app/routes/about.ts' }
    H->>S: vite.ssrLoadModule('app/routes/about.ts')
    S-->>H: { default: AboutPage }
    H->>L: render(AboutPage, props)
    L-->>H: HTML string (+ DSD)
    H->>I: collectIslands(HTML)
    I-->>H: [ { tag: 'my-counter', hydrate: true } ]
    H->>H: 注入水合脚本到 HTML
    H-->>B: Response (HTML + DSD + hydrate script)
    
    Note over B: 浏览器渲染 HTML（零 JS）
    Note over B: 水合脚本检测 Island
    Note over B: 仅下载 Island 组件 JS
    Note over B: Custom Elements 注册 + 水合
```

### 5.2 API 请求流程

```mermaid
sequenceDiagram
    participant B as 浏览器/客户端
    participant V as Vite Dev Server
    participant H as Hono App
    participant Z as Zod Validator
    participant Handler as 路由处理函数

    B->>V: POST /api/posts
    V->>H: 中间件转发
    H->>Z: zValidator('json', schema)
    Z-->>H: validated data (或 400)
    H->>Handler: c.req.valid('json')
    Handler-->>H: result
    H-->>B: JSON Response (201)
```

---

## 6. Island 架构

### 6.1 Island 工作原理

```
┌─────────────────────────────────────────────────────────┐
│                    SSR 输出的 HTML                       │
│                                                          │
│  <main>                                                  │
│    <article>                                             │
│      <h1>Hello World</h1>                                │
│      <p>这是纯静态内容，不包含任何 JS</p>                  │
│    </article>                                            │
│                                                          │
│    <my-counter>                                           │
│      <template shadowroot="open">                        │
│        <style>/* scoped styles */</style>                │
│        <button>-</button><span>0</span><button>+</button> │
│      </template>                                         │
│      <!-- Declarative Shadow DOM：浏览器原生渲染 -->       │
│    </my-counter>                                          │
│  </main>                                                 │
│                                                          │
│  <script type="module" data-islands>                      │
│    import { defineIsland } from '/@hvl/hydrate'           │
│    defineIsland('my-counter', () => import('/islands/counter.ts'))
│  </script>                                                │
└─────────────────────────────────────────────────────────┘

关键点：
1. 非 Island 内容 = 纯 HTML，无任何 JS 依赖
2. Island = Declarative Shadow DOM，浏览器直接渲染样式和结构
3. 水合脚本仅在检测到 Island 时才执行
4. 每个 Island 的 JS 独立下载、独立注册、独立水合
```

### 6.2 Island vs Component 对比

| 特性 | Island (`app/islands/`) | Component (`app/components/`) |
|------|------------------------|------------------------------|
| **SSR 渲染** | ✅ 是 | ✅ 是 |
| **客户端 JS** | ✅ 发送并水合 | ❌ 不发送 |
| **交互能力** | ✅ 有（事件监听） | ❌ 无（纯展示） |
| **Custom Element** | ✅ 自动注册 | ❌ 不注册 |
| **Shadow DOM** | ✅ 封装 | ✅ 封装 |
| **适用场景** | 计数器、表单、主题切换 | Header、Footer、卡片 |

---

## 7. 多运行时部署策略

```mermaid
flowchart LR
    subgraph Source["源码"]
        Code["app/routes/<br/>app/islands/<br/>app/components/"]
    end

    subgraph Build["构建"]
        SSG["SSG 静态预渲染"]
        SSR_Bundle["SSR Bundle"]
        ClientBundle["Client Bundle (Islands)"]
    end

    subgraph Deploy["部署目标"]
        CF["Cloudflare Pages/Workers"]
        Deno["Deno Deploy"]
        Bun["Bun"]
        Node["Node.js (Vercel/Railway)"]
    end

    Code --> SSG
    Code --> SSR_Bundle
    Code --> ClientBundle

    SSG --> CF
    SSG --> Deno
    SSR_Bundle --> Node
    ClientBundle --> CF
    ClientBundle --> Deno
    ClientBundle --> Bun
    ClientBundle --> Node

    style Source fill:#1565C0,color:#fff
    style Build fill:#2E7D32,color:#fff
    style Deploy fill:#F57C00,color:#fff
```

**边缘优先策略**：
- **纯静态页面**（博客、文档）：构建时 SSG → 直接托管，无需 SSR 运行时
- **动态页面**（需要请求数据）：Node.js 运行时 + `@lit-labs/ssr` 流式渲染
- **混合场景**：静态骨架 + Island 动态注入

---

## 8. 类型安全链路

```mermaid
flowchart LR
    subgraph Server["服务端"]
        Schema["Zod Schema"]
        Route["Hono Router<br/>zValidator"]
        AppType["export type AppType<br/>= typeof routes"]
    end

    subgraph RPC_Package["@hvl/rpc"]
        HC["hc&lt;AppType&gt;()<br/>类型封装"]
        Infer["InferRequest/ResponseType<br/>工具类型"]
        Controller["Lit ReactiveController<br/>集成"]
    end

    subgraph Client["客户端"]
        TypedClient["完全类型安全的<br/>API 调用"]
        AutoComplete["自动补全<br/>编译期错误检查"]
    end

    Schema --> Route
    Route --> AppType
    AppType --> HC
    HC --> Infer
    Infer --> Controller
    Controller --> TypedClient
    TypedClient --> AutoComplete
```

---

*文档版本：v1.0 | 最后更新：2026-04-22*
