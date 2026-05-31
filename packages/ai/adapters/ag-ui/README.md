# @coco-box/ai-ag-ui-adapter

将 [AG-UI](https://github.com/ag-ui-protocol/ag-ui) 协议事件适配为 `AI SDK` 的 [UI 消息流](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message#uimessage)，便于直接接入前端 Chat 组件或自定义界面。

## 特性

- 支持多协议输入：SSE、WebSocket 。
- 可选 `onUpdate` 回调：接收每个 `UIMessageChunk`，可用于数据流监听和改造。

## 安装

### 工作区（monorepo）使用

```json
"dependencies": {
  "@coco-box/ai-ag-ui-adapter": "workspace:*",
}
```

### 独立项目使用

前置依赖：

- `@coco-box/ai`：核心库，提供 `AbstractChat`、`Transport` 等基础功能。
- `@coco-box/ai-vue`：Vue 组件库，提供 `Chat` 类。
- `@coco-box/ai-vue-2`：Vue 2 组件库，提供 `Chat` 类。

> 说明：`@cocobox-/ai-vue` 与 `@coco-box/ai-vue-2` 是可选依赖（二选一），根据项目使用的 Vue 版本选择安装。

```bash
npm i @coco-box/ai @coco-box/ai-vue
# or
npm i @coco-box/ai @coco-box/ai-vue-2
```

安装依赖：

```bash
npm i @coco-box/ai-ag-ui-adapter
```

## 快速开始

> 下方 `AgUiHttpTransport` 或 `AgUiWsTransport` 使用参考见文档： [AI SDK UI - Transport](https://ai-sdk.dev/docs/ai-sdk-ui/transport#transport)

```ts
import { Chat } from '@coco-box/ai-vue-2';
import { AgUiHttpTransport } from '@coco-box/ai-ag-ui-adapter';

// HTTP 版（SSE/HTTP 流式）
const chatHttp = new Chat({
  transport: new AgUiHttpTransport({
    api: '/api/chat',
    onUpdate: (chunk) => {
      // UI 增量渲染或日志
    },
  }),
});

// WebSocket 版（WS 文本/二进制消息）
const chatWs = new Chat({
  transport: new AgUiWsTransport({
    api: '/api/chat',
    onUpdate: (chunk) => {
      // UI 增量渲染或日志
    },
  }),
});
```

## API 参考

### 函数

- `mapAgUiEventToUiChunk(event)`
  - 作用：将单个 AG-UI 原始事件映射为 `UIMessageChunk` 或 `TextStreamPart`。
  - 入参：`AgUIRawEvent`（见 `src/types.ts`）。
  - 返回：`UIMessageChunk | TextStreamPart<any> | null`。
  - 说明：处理文本、思考、工具调用与自定义 `CUSTOM` 事件（转为 `data-*`）。

- `createUiChunkStreamFromAgUi(stream, onUpdate?)`
  - 作用：将 AG-UI 原始事件流（字符串、`Uint8Array` 或对象）转换为 `ReadableStream<UIMessageChunk>`。
  - 入参：`ReadableStream<string | Uint8Array | AgUIRawEvent>`；可选 `onUpdate(chunk)`。
  - 返回：`ReadableStream<UIMessageChunk>`。
  - 说明：自动识别 SSE 与 JSONL 格式，逐个事件映射并输出 UI 协议分片。

### 类

- `AgUiHttpTransport`
  - 继承：`HttpChatTransport<UIMessage>`（来自 `@coco-box/ai`）。
  - 初始化：`AgUiHttpTransportInitOptions = HttpChatTransportInitOptions<UIMessage> & { onUpdate?: (chunk: UIMessageChunk) => void }`。
  - 特性：覆写 `processResponseStream`，将后端返回的原始流适配为 `UIMessageChunk` 流；`onUpdate` 在收到新分片时触发。

- `AgUiWsTransport`
  - 继承：`WSChatTransport<UIMessage>`（来自 `@coco-box/ai`）。
  - 初始化：`AgUiWsTransportInitOptions = WSChatTransportInitOptions<UIMessage> & { onUpdate?: (chunk: UIMessageChunk) => void }`。
  - 特性：同上，适配 WS 原始消息到 `UIMessageChunk` 流；`onUpdate` 在收到新分片时触发。

## 事件映射一览

- 文本：`TEXT_MESSAGE_START` → `text-start`，`TEXT_MESSAGE_CONTENT` → `text-delta`，`TEXT_MESSAGE_END` → `text-end`
- 思考：`THINKING_TEXT_MESSAGE_START` → `reasoning-start`，`THINKING_TEXT_MESSAGE_CONTENT` → `reasoning-delta`，`THINKING_TEXT_MESSAGE_END` → `reasoning-end`
- 工具（输入）：`TOOL_CALL_START` → `tool-input-start`，`TOOL_CALL_ARGS` → `tool-input-delta`
- 工具（可用/结果/错误）：`TOOL_CALL_END` → `tool-input-available`，`TOOL_CALL_RESULT` → `tool-output-available` 或 `tool-output-error`
- 自定义数据：`CUSTOM(name,value)` → `data-<name>`（小写，放入 `data` 字段）
- 运行状态：`RUN_STARTED` → `start`，`RUN_FINISHED` → `finish`，`RUN_ERROR` → `error`
- 快照/状态：`MESSAGES_SNAPSHOT` → `data-messages-snapshot`，`STATE_SNAPSHOT` → `data-state-snapshot`，`STATE_DELTA` → `data-state-delta`
