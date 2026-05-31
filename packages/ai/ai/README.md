# @coco-box/ai

基于 [Vercel AI SDK v5](https://ai-sdk.dev/) 前端 UI（[Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)）思路的轻量魔改版封装，面向本仓库 monorepo 的前端聊天开发。核心目标是把“UI 消息流协议”、传输抽象与增量更新逻辑打包为易复用的前端库，供 `@coco-box/ai-vue`、`@coco-box/ai-vue-2` 以及你自己的前端实现直接使用。

## 特色与设计

- UI 消息流协议：对接 AI SDK “UIMessage/MessageParts” 协议，支持文本、思考、工具输入/输出、错误与数据分片。
- 抽象传输层：内置默认 HTTP 传输（复用 AI SDK 的默认实现）、提供可扩展的 WebSocket 传输基类，便于切换 SSE/WS。
- 增量更新与串行任务：对流式分片做细粒度更新；串行执行（避免并发状态竞争），更适合复杂 UI。
- 工具调用：在前端收到工具调用分片时触发 `onToolCall`，可在浏览器侧自动执行业务工具并回传结果。
- 类型完善：公共类型与工具函数与 UI 协议契合，便于自定义实现。

## 安装与使用范围

- 在本 monorepo 中由以下包依赖与使用：
  - `@coco-box/ai-vue`（Vue 3 包）
  - `@coco-box/ai-vue-2`（Vue 2 包）
- 你也可以直接使用本包导出的抽象类与工具，按照两者的用法自己实现前端 chat。

## 快速上手

实现 `@coco-box/ai` 抽象类 `AbstractChat`, 以 Vue 2 为例，管理 `messages` 与 `status` 状态：

```ts
import {
  AbstractChat,
  type ChatInit as BaseChatInit,
  type ChatState,
  type ChatStatus,
  type UIMessage,
} from '@coco-box/ai';
import { ref, Ref } from '@vue/composition-api';

class VueChatState<UI_MESSAGE extends UIMessage> implements ChatState<UI_MESSAGE> {
  private messagesRef: Ref<UI_MESSAGE[]>;

  private statusRef = ref<ChatStatus>('ready');

  private errorRef = ref<Error | undefined>(undefined);

  constructor(messages?: UI_MESSAGE[]) {
    this.messagesRef = ref(messages ?? []) as Ref<UI_MESSAGE[]>;
  }

  get messages(): UI_MESSAGE[] {
    return this.messagesRef.value;
  }

  set messages(messages: UI_MESSAGE[]) {
    this.messagesRef.value = messages;
  }

  get status(): ChatStatus {
    return this.statusRef.value;
  }

  set status(status: ChatStatus) {
    this.statusRef.value = status;
  }

  get error(): Error | undefined {
    return this.errorRef.value;
  }

  set error(error: Error | undefined) {
    this.errorRef.value = error;
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.messagesRef.value = [...this.messagesRef.value, message];
  };

  popMessage = () => {
    this.messagesRef.value = this.messagesRef.value.slice(0, -1);
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.messagesRef.value.splice(index, 1, { ...message });
  };

  snapshot = <T>(value: T): T => value;
}

export class Chat<
  UI_MESSAGE extends UIMessage,
> extends AbstractChat<UI_MESSAGE> {
  constructor({ messages, ...init }: BaseChatInit<UI_MESSAGE>) {
    super({
      ...init,
      state: new VueChatState(messages),
    });
  }
}
```

实现后可参考官网用法：<https://ai-sdk.dev/docs/ai-sdk-ui/chatbot>

## 公共 API

以下仅列出前端开发常用导出；完整类型与导出以源码为准。

### 核心类

- `AbstractChat`
  - 构造参数：`ChatInit`（包含 `state`、`transport`、`onError`、`onData`、`onToolCall`、`onFinish`、`shouldStartNewMessage` 等）
  - 关键方法：
    - `sendMessage(message?, options?)` 发送或替换用户消息
    - `regenerate({ messageId?, ...options })` 重新生成指定消息
    - `resumeStream(options?)` 尝试重连到后端流
    - `addToolResult({ tool, toolCallId, output })` 前端回传工具结果
    - `stop()` 停止当前流
    - `clearError()` 清除错误状态
  - 状态只读属性：`status`、`error`、`messages`、`lastMessage`

### 传输层

- `DefaultChatTransport`（复用 AI SDK 默认 HTTP 传输）
  - 常用配置：`api`、`headers`、`body`
- `WSChatTransport`
  - 初始化项：`api`、`protocols`、`headers`、`body`、`connectionTimeout`、`autoReconnect`、`maxReconnectAttempts`、`reconnectDelay`、`prepareSendMessagesRequest`、`prepareReconnectToStreamRequest`
  - 需覆写：`processResponseStream(stream)`（将原始 WS 消息适配为 `ReadableStream<UIMessageChunk>`）
- `HttpChatTransport`（从 AI SDK 直接复用导出）

### 工具与类型

- `processUIMessageStream`：将 `ReadableStream<UIMessageChunk>` 转换为 UI 消息增量更新（内部统一处理分片 switch 与增量写入）。
- `createUIMessage`：创建一条新的空消息（可传入时间戳等元数据）。
- 类型：
  - `UIMessage`、`UIMessageChunk`、`UIMessagePart`（含 `text/reasoning/tool/...`）
  - `ChatState`（需传入状态容器对象，含 `pushMessage/popMessage/replaceMessage/snapshot`）
  - `ChatInit`、`ChatRequestOptions`、`ChatStatus`

## 与 Vue/Vue 2 的集成

- 推荐直接使用：
  - Vue 3 包：`@coco-box/ai-vue`（示例与封装见其 README）
  - Vue 2 包：`@coco-box/ai-vue-2`（示例与封装见其 README）
- 两者都基于本包的 `AbstractChat` 与传输层封装。你也可以参考它们的用法，自行实现抽象类并在你的组件中管理 `messages` 与 `status`。
