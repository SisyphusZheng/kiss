# Contributing to KISS

感谢你对 KISS 框架的兴趣！

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/SisyphusZheng/kiss.git
cd kiss

# 安装依赖
deno install

# 运行测试
deno task test

# 启动文档站开发服务器
deno task docs:dev
```

## 项目结构

```
kiss/
├── packages/
│   ├── kiss-core/    # 核心 Vite 插件
│   ├── kiss-rpc/     # RPC 客户端控制器
│   └── kiss-ui/      # UI 插件
├── docs/             # 文档站（自举）
├── examples/         # 示例项目
└── scripts/          # 工具脚本
```

## 开发规范

### 代码风格

- 使用 Deno 内置格式化：`deno fmt`
- 使用 Deno 内置 lint：`deno lint`
- 遵循 KISS Architecture 四约束（K·I·S·S）

### 提交规范

使用 Conventional Commits：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 杂项

### 分层原则

在添加新功能前，检查是否可以用更低层级解决：

```
L0  HTML5 语义       — 结构、内容、导航
L1  CSS 表现         — 视觉、布局、动画
L2  浏览器平台 API    — Clipboard, IntersectionObserver
L3  Hono/Vite/Lit    — 路由、构建、组件封装
L4  自研代码          — Island 水合、RPC、插件逻辑
```

**跳过任何一层 = 违反 KISS 架构约束**

### 测试

```bash
# 运行所有测试
deno task test

# 监听模式
deno task test:watch

# 类型检查
deno task typecheck
```

## 发布流程

1. 更新版本号（packages/*/package.json）
2. 更新 CHANGELOG.md
3. 运行测试：`deno task test`
4. 发布到 JSR：`deno task publish`
5. 创建 GitHub Release

## 架构决策记录（ADR）

重大架构变更需要创建 ADR 文档：

```markdown
# ADR-XXX: 标题

## 状态
提议 / 已接受 / 已废弃

## 背景
为什么需要这个决策

## 决策
我们决定做什么

## 后果
这个决策的影响
```

## 问题反馈

- GitHub Issues: https://github.com/SisyphusZheng/kiss/issues
- 提交前请搜索已有 issue

---

KISS — Keep It Simple, Stupid / K·I·S·S Architecture
