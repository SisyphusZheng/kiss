---
title: '配置'
section: '生产'
label: '配置'
order: 10
---

# 配置

openElement 通过 Vite 配置。根入口用于应用编写；Vite 集成使用 `/vite` 子路径。

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

## AppShell

AppShell 协议支持默认 shell、无 shell 和自定义 route layout。框架负责路由契约，应用负责视觉外壳。
