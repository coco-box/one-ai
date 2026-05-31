# one-ai

`one-ai` 是一个用于沉淀 AI 相关 SDK、适配器、组件库和示例应用的 monorepo。项目使用 `pnpm workspace` 管理依赖，使用 `turbo` 统一编排开发、构建、测试和检查任务。

## 环境要求

- Node.js >= 20.19.3
- pnpm >= 10.15.0

建议通过 Corepack 使用项目声明的 pnpm 版本：

```bash
corepack pnpm install
```

如果直接运行 `pnpm` 命中了旧版本，请先升级全局 pnpm，或统一使用 `corepack pnpm ...`。

## 目录结构

```text
apps/
  backend/                 后端示例服务
  frontend/
    chat-vue2/             Vue 2 聊天应用
    chat-vue3/             Vue 3 聊天应用
configs/
  eslint-config/           共享 ESLint 配置
  tailwindcss-config/      共享 Tailwind 配置
  tsconfig/                共享 TypeScript 配置
packages/
  ai/
    ai/                    核心 AI SDK 封装
    adapters/ag-ui/        AG-UI 适配器
    react/                 React 绑定
    vue/                   Vue 3 绑定
    vue-2/                 Vue 2 绑定
  ui/                      Vue 2 组件库
```

## 常用命令

```bash
# 安装所有 workspace 依赖
corepack pnpm install

# 启动所有包含 dev 脚本的包和应用
corepack pnpm run dev

# 构建全部包
corepack pnpm run build

# 构建核心包
corepack pnpm run build:ai

# 构建 Vue 2 / Vue 3 前端应用
corepack pnpm --filter @coco-box/chat-vue2 run build
corepack pnpm --filter @coco-box/chat-vue3 run build
```

## Workspace 说明

根目录的 `pnpm-workspace.yaml` 会扫描以下路径：

```yaml
packages:
  - apps/*
  - apps/*/*
  - packages/*
  - packages/ai/*
  - packages/ai/*/*
  - configs/*
```

`apps/frontend/chat-vue2` 和 `apps/frontend/chat-vue3` 位于二级目录，因此必须保留 `apps/*/*`。如果缺少这一项，pnpm 不会把这两个应用识别为 workspace package，`workspace:*` 依赖也不会被正确软链。

## 开发注意事项

- 本项目依赖 pnpm 的严格 workspace 解析；新增内部包时，请确保它被 `pnpm-workspace.yaml` 覆盖。
- 前端应用在开发模式下会通过 Vite alias 直接引用内部包源码，避免依赖内部包 `dist` 的生成时序。
- `chat-vue2` 默认监听 `8080`，`chat-vue3` 默认监听 `5173`，后端服务默认监听 `3007`。
- 如果后端启动时报 `EADDRINUSE`，说明 `3007` 已被其他进程占用。
