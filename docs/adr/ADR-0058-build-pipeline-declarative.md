# ADR-0058: BuildPipeline 声明式 API

> Status: PROPOSED\
> Date: 2026-05-29\
> Target: v0.25.0\
> Replaces: build.ts → build-client.ts → build-ssg.ts 三阶段硬编码
>
> **编号碰撞**: 与 [ADR-0058 (Signal→DOM 直接绑定)](./0058-real-dom-signal-binding.md)、[ADR-0058 (移除 TemplateResult 渲染路径)](./ADR-0058-remove-templateresult-render-path.md) 共用编号 0058——三者系不同决策，均予保留，引用请带文件名区分。

## Context

LessJS 当前构建流程分散在三个文件：

```
build.ts         →  Phase 1 (SSR bundle)
build-client.ts  →  Phase 2 (client islands)
build-ssg.ts     →  Phase 3 (static HTML)
```

用户通过 `less()` Vite 插件配置，插件内部在 `closeBundle` 钩子中串行调用三阶段。这是框架**最大的架构债**——每个阶段都是独立的 `viteBuild()` 调用，配置分散，错误传播依赖 try/catch 嵌套。

同时，`configFile: false` 导致用户自己的 `vite.config.ts` JSX 配置无法传递到 client/SSG 构建（v0.24.1 的 `[object Object]` bug 的直接原因之一）。

## Decision

引入 `BuildPipeline` 类，把三阶段统一为声明式配置对象：

```typescript
class BuildPipeline {
  constructor(config: {
    phases?: ('ssr-bundle' | 'client-chunks' | 'ssg')[];
    routes: { dir: string };
    i18n?: { locales: string[]; defaultLocale: string };
    output?: { cleanUrls?: boolean };
  });
  async run(ctx: LessBuildContext): Promise<void>;
}
```

用户侧：

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [lessPipeline({ routes: { dir: 'app/routes' }, i18n: { locales: ['en', 'zh'] } })],
});
```

### 设计原则

1. **零逻辑变更** — 不修改任何构建行为，纯粹包装现有三阶段调用
2. **配置透传** — 用户的 esbuild/Vite 配置正确传递到每个构建阶段，消除 `configFile: false` 副作用
3. **保持兼容** — `less()` 函数保留，标记 `@deprecated`，内部转为调用 `lessPipeline()`
4. **不改变输出** — dist 目录结构、chunk 命名、发布工序完全不变

### 新增文件

| 文件                                          | 职责                       |
| --------------------------------------------- | -------------------------- |
| `packages/adapter-vite/src/build-pipeline.ts` | `BuildPipeline` 类定义     |
| `packages/adapter-vite/src/less-plugin.ts`    | 新增 `lessPipeline()` 导出 |

### API 签名

```typescript
interface PipelineConfig {
  /** Build phases to execute. Default: all three. */
  phases?: Phase[];
  /** Route directory relative to project root. */
  routes: { dir: string };
  /** Internationalization config. */
  i18n?: I18nConfig;
  /** Output configuration. */
  output?: OutputConfig;
}

interface I18nConfig {
  locales: string[];
  defaultLocale: string;
}

interface OutputConfig {
  /** Strip .html extension from URLs. Default: true. */
  cleanUrls?: boolean;
}

type Phase = 'ssr-bundle' | 'client-chunks' | 'ssg';
```

### Migration

```diff
- export default defineConfig({ plugins: [less({ ... })] });
+ export default defineConfig({ plugins: [lessPipeline({ routes: { dir: 'app/routes' } })] });
```

## Consequences

**正面**：

- 构建流程可读性显著提升（单一配置入口 vs 三文件跳转）
- `configFile: false` 的 JSX 配置问题从根本上解决
- Phase 可选择跳过（如只生成 SSR bundle 而跳过 client/SSG 阶段，用于 CI 快速验证）

**负面**：

- 新增一个抽象层，维护负担轻微增加
- 旧 `less()` 在过渡期需要双重维护

**中性**：

- 不改变 JSR publish 顺序
- 不改变 CI 工作流

## Alternatives Considered

1. **直接在 less() 内重构** — 改动范围大，风险高，不推荐
2. **引入独立的 build runner（如 turborepo）** — 过度设计，LessJS 的构建规模不需要
3. **永不重构，保持三阶段** — 架构债持续累积，JSX 配置问题无法根本解决

## Status

PROPOSED. Implementation planned for v0.25.0 TG-01.
