---
title: '配置'
section: '生产'
label: '配置'
order: 10
---

# 配置

openElement 通过 Vite 配置，并使用受支持的 `@openelement/adapter-vite` root
入口。Element 和 App 包专注于作者体验，不承担构建实现。

## 最小配置

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/adapter-vite';

export default defineConfig({
  plugins: [openElement()],
});
```

## 常用选项

```ts
openElement({
  routesDir: 'app/routes',
  islandsDir: 'app/islands',
  componentsDir: 'app/components',
  packageIslands: ['@openelement/ui'],
});
```

## JSX runtime

生成项目会配置 automatic JSX：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@openelement/element"
  }
}
```

## 应用外壳

应用负责视觉外壳，Framework 负责 route 与 render semantics。外壳配置应使用
受支持的 adapter options，不依赖内部 shell 或 manifest types。

## 产品任务

生成项目提供完整生命周期：

```sh
deno task dev
deno task check
deno task test
deno task build
deno task preview
```
