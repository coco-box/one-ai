# one-ai

`one-ai` 是一组面向 AI 聊天场景的前端工具库与示例集合，主要提供：

- 基于 AI SDK UI Message 协议的聊天核心能力
- AG-UI 协议到 UI Message 的适配器
- React / Vue 3 / Vue 2 的状态绑定
- Vue 2 聊天 UI 组件库
- 可直接参考的前后端示例应用

## 适用场景

- 你的前端需要消费流式聊天消息，并维护统一的消息状态
- 你的后端返回的是 AI SDK 风格的 UI Message 流
- 你的后端输出的是 AG-UI 协议事件流，希望快速接到现有聊天 UI
- 你在维护 Vue 2 / Vue 3 / React 聊天应用，希望复用一套消息模型
- 你需要一个现成的 Vue 2 聊天组件库，而不是从零搭界面

## 包清单

| 包名 | 作用 | 适合谁 |
| --- | --- | --- |
| `@coco-box/ai` | 核心聊天抽象、消息模型、传输层、流式增量处理 | 需要自定义聊天 UI 或自己做框架绑定的开发者 |
| `@coco-box/ai-ag-ui-adapter` | 把 AG-UI 的 SSE / WebSocket 事件流转换成 `@coco-box/ai` 可消费的消息流 | 后端输出 AG-UI 协议的项目 |
| `@coco-box/ai-react` | React 侧的聊天状态绑定实现 | React 项目 |
| `@coco-box/ai-vue` | Vue 3 侧的聊天状态绑定实现 | Vue 3 项目 |
| `@coco-box/ai-vue-2` | Vue 2.6 + Composition API 的聊天状态绑定实现 | Vue 2 项目 |
| `@coco-box/ai-ui` | Vue 2 聊天 UI 组件库 | 需要快速搭建 Vue 2 聊天界面的项目 |

## 如何选包

### 1. 你的后端已经输出 AI SDK 风格消息流

直接选择：

- Vue 3：`@coco-box/ai` + `@coco-box/ai-vue`
- Vue 2：`@coco-box/ai` + `@coco-box/ai-vue-2`
- React：`@coco-box/ai` + `@coco-box/ai-react`

### 2. 你的后端输出的是 AG-UI 协议

在上面的基础上再加：

- `@coco-box/ai-ag-ui-adapter`

### 3. 你需要现成的 Vue 2 组件

再加：

- `@coco-box/ai-ui`

## 安装

### Vue 3

```bash
pnpm add @coco-box/ai @coco-box/ai-vue
```

如果后端是 AG-UI：

```bash
pnpm add @coco-box/ai @coco-box/ai-vue @coco-box/ai-ag-ui-adapter
```

### Vue 2

```bash
pnpm add vue @vue/composition-api @coco-box/ai @coco-box/ai-vue-2
```

如果后端是 AG-UI：

```bash
pnpm add vue @vue/composition-api @coco-box/ai @coco-box/ai-vue-2 @coco-box/ai-ag-ui-adapter
```

如果还需要 UI 组件：

```bash
pnpm add @coco-box/ai-ui
```

### React

```bash
pnpm add react @coco-box/ai @coco-box/ai-react
```

## 快速开始

### Vue 3 最小示例

```vue
<script setup lang="ts">
import { DefaultChatTransport } from '@coco-box/ai';
import { Chat } from '@coco-box/ai-vue';
import { ref } from 'vue';

const input = ref('');
const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
});

const submit = async () => {
  const text = input.value.trim();
  if (!text) return;

  await chat.sendMessage({ text });
  input.value = '';
};
</script>

<template>
  <div v-for="message in chat.messages" :key="message.id">
    <div v-for="(part, index) in message.parts" :key="index">
      <span v-if="part.type === 'text'">{{ part.text }}</span>
    </div>
  </div>

  <form @submit.prevent="submit">
    <input v-model="input" placeholder="请输入消息" />
    <button type="submit" :disabled="chat.status !== 'ready'">发送</button>
  </form>
</template>
```

### Vue 2 + AG-UI 最小示例

```ts
import { Chat } from '@coco-box/ai-vue-2';
import { AgUiHttpTransport } from '@coco-box/ai-ag-ui-adapter';

const chat = new Chat({
  transport: new AgUiHttpTransport({
    api: '/api/chat',
    onUpdate: (chunk) => {
      console.log('收到增量消息', chunk);
    },
  }),
});

chat.sendMessage({ text: '你好' });
```

## 核心能力

### `@coco-box/ai`

核心包围绕 `AbstractChat` 组织，负责：

- 维护 `messages`、`status`、`error`
- 发送消息、重新生成、停止流式响应
- 处理工具调用结果回传
- 统一消费 HTTP / WebSocket 传输层
- 将流式分片合并为前端可渲染的消息列表

常用导出包括：

- `AbstractChat`
- `DefaultChatTransport`
- `WSChatTransport`
- `HttpChatTransport`
- `processUIMessageStream`
- `createUIMessage`

### `@coco-box/ai-ag-ui-adapter`

适配器包会把 AG-UI 原始事件转换为 `UIMessageChunk`，便于继续接入 `@coco-box/ai` 的整套能力。

常用导出包括：

- `AgUiHttpTransport`
- `AgUiWsTransport`
- `createUiChunkStreamFromAgUi`
- `mapAgUiEventToUiChunk`

### `@coco-box/ai-ui`

这是一个偏 Vue 2 的聊天 UI 组件库，当前导出的组件包括：

- `OneBubble`
- `OneInput`
- `OneMarkdownCard`
- `OneLayout`
- `OnePrompt`
- `OneHeader`
- `OneInteractionConfirm`
- `OneImage`
- `OneIcon`
- `OneList`
- `OneConfigProvider`

如果你已经有自己的消息状态层，可以只拿这些组件做界面拼装。

## 示例应用

仓库里有两个前端示例和一个后端示例，适合拿来对照接入：

- [apps/frontend/chat-vue2](/Users/lance/Documents/GitHub/one-ai/apps/frontend/chat-vue2/README.md)
- [apps/frontend/chat-vue3](/Users/lance/Documents/GitHub/one-ai/apps/frontend/chat-vue3/README.md)
- `apps/backend`

其中：

- `apps/frontend/chat-vue2` 更接近组件库和 AG-UI 的综合使用方式
- `apps/frontend/chat-vue3` 更适合看 Vue 3 侧的聊天状态组织

## 本地调试这个仓库

只有在你需要修改源码、跑示例时才需要关心以下内容。

环境要求：

- Node.js >= 20.19.3
- pnpm >= 10.15.0

安装依赖：

```bash
pnpm install
```

常用命令：

```bash
pnpm run dev
pnpm run build
pnpm --filter @coco-box/chat-vue2 run build
pnpm --filter @coco-box/chat-vue3 run build
```

## 仓库结构

```text
apps/
  backend/                 后端示例服务
  frontend/
    chat-vue2/             Vue 2 聊天示例
    chat-vue3/             Vue 3 聊天示例
configs/
  eslint-config/           共享 ESLint 配置
  tailwindcss-config/      共享 Tailwind 配置
  tsconfig/                共享 TypeScript 配置
packages/
  ai/
    ai/                    核心聊天 SDK
    adapters/ag-ui/        AG-UI 适配器
    react/                 React 绑定
    vue/                   Vue 3 绑定
    vue-2/                 Vue 2 绑定
  ui/                      Vue 2 聊天组件库
```
