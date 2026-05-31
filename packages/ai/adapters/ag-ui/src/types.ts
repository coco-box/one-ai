// AG-UI 原始事件导入
// https://docs.ag-ui.com/sdk/js/core/events#events
import type {
  // 生命周期事件
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StepStartedEvent,
  StepFinishedEvent,
  // 文本消息事件
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ThinkingTextMessageStartEvent,
  ThinkingTextMessageContentEvent,
  ThinkingTextMessageEndEvent,
  // 工具调用事件
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  // 状态管理事件
  StateSnapshotEvent,
  StateDeltaEvent,
  MessagesSnapshotEvent,
  // 特殊事件
  RawEvent, // 来自外部系统的事件
  CustomEvent, // 特定于应用程序的自定义事件
} from "@ag-ui/core";

// AG-UI 原始事件定义（可按需扩展）
// ai-sdk: packages/ai/src/ui-message-stream/ui-message-chunks.ts
export type AgUIRunStarted = RunStartedEvent;
export type AgUIRunFinished = RunFinishedEvent;
export type AgUIRunError = RunErrorEvent;
export type AgUIStepStarted = StepStartedEvent;
export type AgUIStepFinished = StepFinishedEvent;

export type AgUIMessagesSnapshot = MessagesSnapshotEvent;
export type AgUIStateSnapshot = StateSnapshotEvent;
export type AgUIStateDelta = StateDeltaEvent;

export type AgUITextMessageStart = TextMessageStartEvent & {
  name?: string;
};

export type AgUITextMessageContent = TextMessageContentEvent & {
  delta: string;
  name?: string;
};

export type AgUITextMessageEnd = TextMessageEndEvent & {
  name?: string;
};

export type AgUIToolCallStart = ToolCallStartEvent & {
  name?: string;
  dynamic?: boolean;
};

export type AgUIToolCallArgs = ToolCallArgsEvent & {
  name?: string;
};

export type AgUIToolCallEnd = ToolCallEndEvent & {
  input: unknown; // 完整入参对象
  name?: string;
  toolCallName?: string;
  dynamic?: boolean;
};

export type AgUIToolCallResult = ToolCallResultEvent & {
  output: unknown;
  name?: string;
  dynamic?: boolean;
};

export type AgUIToolCallError = ToolCallResultEvent & {
  output: unknown;
  name?: string;
  dynamic?: boolean;
};

export type AgUIReasoningStart = ThinkingTextMessageStartEvent & {
  messageId: string;
  role: string;
  name?: string;
};

export type AgUIReasoningContent = ThinkingTextMessageContentEvent & {
  messageId: string;
  delta: string;
  name?: string;
};

export type AgUIReasoningEnd = ThinkingTextMessageEndEvent & {
  messageId: string;
  name?: string;
};

export type AgUICustomPart = CustomEvent & {
  messageId?: string;
  role?: string;
};

export type AgUIRawEvent =
  | AgUITextMessageStart
  | AgUITextMessageContent
  | AgUITextMessageEnd
  | AgUIStepStarted
  | AgUIStepFinished
  | AgUIToolCallStart
  | AgUIToolCallArgs
  | AgUIToolCallEnd
  | AgUIToolCallResult
  | AgUIToolCallError
  | AgUIReasoningStart
  | AgUIReasoningContent
  | AgUIReasoningEnd
  | AgUICustomPart
  | AgUIRunStarted
  | AgUIRunFinished
  | AgUIRunError
  | AgUIMessagesSnapshot
  | AgUIStateSnapshot
  | AgUIStateDelta;


