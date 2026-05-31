import { generateId as generateIdFunc } from 'ai';
import {
  type StandardSchemaV1,
  validateTypes,
  type Validator,
} from '@ai-sdk/provider-utils';
import { type ProviderMetadata } from '../types';
import {
  type DataUIMessageChunk,
  type InferUIMessageChunk,
  isDataUIMessageChunk,
  type UIMessageChunk,
} from '../ui-message-stream/ui-message-chunks';
import { type ErrorHandler } from 'ai' // '../util/error-handler';
import { mergeObjects } from '../util/merge-objects';
import { parsePartialJson } from '../util/parse-partial-json';
import { type UIDataTypesToSchemas } from './chat';
import {
  type DataUIPart,
  type DynamicToolUIPart,
  getToolName,
  type InferUIMessageData,
  type InferUIMessageMetadata,
  type InferUIMessageToolCall,
  type InferUIMessageTools,
  isToolUIPart,
  type ReasoningUIPart,
  type TextUIPart,
  type ToolUIPart,
  // type UIMessage,
  type UIMessagePart,
} from './ui-messages';
import { type UIMessage } from '../types';
import { createUIMessage } from './create-ui-message';

export type StreamingUIMessageState<UI_MESSAGE extends UIMessage> = {
  message: UI_MESSAGE;
  messages: UI_MESSAGE[];
  activeTextParts: Record<string, TextUIPart>;
  activeTextMessageIndices: Record<string, number>; // text id → 该 text 所在消息在 state.messages 中的索引
  activeReasoningParts: Record<string, ReasoningUIPart>;
  partialToolCalls: Record<
    string,
    { text: string; index: number; toolName: string; dynamic?: boolean }
  >;
  currentReasoningIds: Record<string, string>; // agent name → reasoning id，支持并行思考
  activeReasoningMessageIndices: Record<string, number>; // reasoning id → 该 reasoning 所在消息在 state.messages 中的索引
  dirtyMessageIndices: Set<number>; // 被 continuation 事件修改的非当前消息索引（state.messages 索引），供 write() 同步
  startReceived: boolean; // 是否已收到第一个 start 事件（多智能体并行会发送多次 RUN_STARTED）
};

export function createStreamingUIMessageState<UI_MESSAGE extends UIMessage>({
  lastMessage,
  messageId,
}: {
  lastMessage: UI_MESSAGE | undefined;
  messageId: string;
}): StreamingUIMessageState<UI_MESSAGE> {
  const message = lastMessage?.role === 'assistant'
        ? lastMessage
        : (createUIMessage({ id: messageId }) as UI_MESSAGE);
  return {
    message,
    messages: [message],
    activeTextParts: {},
    activeTextMessageIndices: {},
    activeReasoningParts: {},
    partialToolCalls: {},
    currentReasoningIds: {},
    activeReasoningMessageIndices: {},
    dirtyMessageIndices: new Set(),
    startReceived: false,
  };
}

export function processUIMessageStream<UI_MESSAGE extends UIMessage>({
  stream,
  messageMetadataSchema,
  dataPartSchemas,
  runUpdateMessageJob,
  onError,
  onToolCall,
  onData,
  shouldStartNewMessage,
}: {
  // input stream is not fully typed yet:
  stream: ReadableStream<UIMessageChunk>;
  messageMetadataSchema?:
    | Validator<InferUIMessageMetadata<UI_MESSAGE>>
    | StandardSchemaV1<InferUIMessageMetadata<UI_MESSAGE>>;
  dataPartSchemas?: UIDataTypesToSchemas<InferUIMessageData<UI_MESSAGE>>;
  onToolCall?: (options: {
    toolCall: InferUIMessageToolCall<UI_MESSAGE>;
  }) => void | PromiseLike<void>;
  onData?: (dataPart: DataUIPart<InferUIMessageData<UI_MESSAGE>>) => void;
  runUpdateMessageJob: (
    job: (options: {
      state: StreamingUIMessageState<UI_MESSAGE>;
      write: () => void;
    }) => Promise<void>,
  ) => Promise<void>;
  onError: ErrorHandler;
  shouldStartNewMessage: (
    currentMessage: UI_MESSAGE,
    newChunkData: Record<string, any>,
  ) => boolean;
}): ReadableStream<InferUIMessageChunk<UI_MESSAGE>> {
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, InferUIMessageChunk<UI_MESSAGE>>({
      async transform(chunk, controller) {
        await runUpdateMessageJob(async ({ state, write }) => {
          await applyUIMessageChunk(
            { state, chunk, write, controller },
            {
              messageMetadataSchema,
              dataPartSchemas,
              onToolCall,
              onData,
              onError,
              shouldStartNewMessage,
            },
          );
        });
      },
    }),
  );
}

// ---
// 为 history 静态构建提供的独立方法：仅需传入 state 与 chunk（write/controller 可不传）
// 保持与上面 runUpdateMessageJob 内逻辑一致，但不改变现有流程。
// ---
export async function runUpdateMessageJob<UI_MESSAGE extends UIMessage>(
  state: StreamingUIMessageState<UI_MESSAGE>,
  chunk: any,
  write?: () => void,
  controller?: { enqueue: (value: any) => void },
  options?: {
    messageMetadataSchema?:
      | Validator<InferUIMessageMetadata<UI_MESSAGE>>
      | StandardSchemaV1<InferUIMessageMetadata<UI_MESSAGE>>;
    dataPartSchemas?: UIDataTypesToSchemas<InferUIMessageData<UI_MESSAGE>>;
    onToolCall?: (options: { toolCall: InferUIMessageToolCall<UI_MESSAGE> }) => void | PromiseLike<void>;
    onData?: (dataPart: DataUIPart<InferUIMessageData<UI_MESSAGE>>) => void;
    onError?: ErrorHandler;
    shouldStartNewMessage?: (
      currentMessage: UI_MESSAGE,
      newChunkData: Record<string, any>,
    ) => boolean;
  },
): Promise<void> {
  await applyUIMessageChunk(
    { state, chunk, write, controller },
    options,
  );
}

// 公共实现：applyUIMessageChunk
async function applyUIMessageChunk<UI_MESSAGE extends UIMessage>(
  params: {
    state: StreamingUIMessageState<UI_MESSAGE>;
    chunk: any;
    write?: () => void; // 统一使用可选
    controller?: { enqueue: (value: any) => void };
  },
  options?: {
    messageMetadataSchema?:
      | Validator<InferUIMessageMetadata<UI_MESSAGE>>
      | StandardSchemaV1<InferUIMessageMetadata<UI_MESSAGE>>;
    dataPartSchemas?: UIDataTypesToSchemas<InferUIMessageData<UI_MESSAGE>>;
    onToolCall?: (options: { toolCall: InferUIMessageToolCall<UI_MESSAGE> }) => void | PromiseLike<void>;
    onData?: (dataPart: DataUIPart<InferUIMessageData<UI_MESSAGE>>) => void;
    onError?: ErrorHandler;
    shouldStartNewMessage?: (
      currentMessage: UI_MESSAGE,
      newChunkData: Record<string, any>,
    ) => boolean;
  },
): Promise<void> {
  const { state, chunk, write, controller } = params;
  const messageMetadataSchema = options?.messageMetadataSchema;
  const dataPartSchemas = options?.dataPartSchemas;
  const onToolCall = options?.onToolCall;
  const onData = options?.onData;
  const onError = options?.onError;
  const shouldStartNewMessage =
    options?.shouldStartNewMessage ?? (() => false);

  function getToolInvocation(toolCallId: string) {
    let toolInvocation;
    
    // 遍历所有消息查找匹配的工具调用
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i];
      toolInvocation = message.parts.find(
        (part): part is ToolUIPart<any> =>
          isToolUIPart(part) && part.toolCallId === toolCallId
      );
      if (toolInvocation) break;
    }

    if (toolInvocation == null) {
      throw new Error(
        'tool-output-error must be preceded by a tool-input-available',
      );
    }

    return toolInvocation;
  }

  function getDynamicToolInvocation(toolCallId: string) {
    let toolInvocation;
    
    // 遍历所有消息查找匹配的动态工具调用
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i];
      toolInvocation = message.parts.find(
        (part): part is DynamicToolUIPart =>
          part.type === 'dynamic-tool' && part.toolCallId === toolCallId
      );
      if (toolInvocation) break;
    }

    if (toolInvocation == null) {
      throw new Error(
        'tool-output-error must be preceded by a tool-input-available',
      );
    }

    return toolInvocation;
  }
  
  function updateToolPart(
    options: {
      toolName: keyof InferUIMessageTools<UI_MESSAGE> & string;
      toolCallId: string;
      providerExecuted?: boolean;
    } & (
      | {
          state: 'input-streaming';
          input?: unknown;
          providerExecuted?: boolean;
        }
      | {
          state: 'input-available';
          input?: unknown;
          providerExecuted?: boolean;
          providerMetadata?: ProviderMetadata;
        }
      | {
          state: 'output-available';
          input?: unknown;
          output: unknown;
          providerExecuted?: boolean;
        }
      | {
          state: 'output-error';
          input?: unknown;
          rawInput?: unknown;
          errorText: string;
          providerExecuted?: boolean;
          providerMetadata?: ProviderMetadata;
        }
    ),
  ) {
    let part: ToolUIPart<InferUIMessageTools<UI_MESSAGE>> | undefined;
    let foundMsgIdx = -1;
    
    // 遍历所有消息查找匹配的工具部分
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i];
      part = message.parts.find(
        (p): p is ToolUIPart<InferUIMessageTools<UI_MESSAGE>> =>
          isToolUIPart(p) && p.toolCallId === options.toolCallId
      );
      if (part) { foundMsgIdx = i; break; }
    }

    const anyOptions = options as any;
    const anyPart = part as any;

    if (part != null) {
      part.state = options.state;
      if (anyOptions.input) {
        anyPart.input = anyOptions.input
      }
      anyPart.output = anyOptions.output;
      anyPart.errorText = anyOptions.errorText;
      anyPart.rawInput = anyOptions.rawInput;

      // once providerExecuted is set, it stays for streaming
      anyPart.providerExecuted =
        anyOptions.providerExecuted ?? part.providerExecuted;

      if (
        anyOptions.providerMetadata != null &&
        part.state === 'input-available'
      ) {
        part.callProviderMetadata = anyOptions.providerMetadata;
      }

      // 标记脏消息：工具调用所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      if (foundMsgIdx >= 0 && state.messages[foundMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(foundMsgIdx);
      }
    } else {
      state.message.parts.push({
        type: `tool-${options.toolName}`,
        toolCallId: options.toolCallId,
        state: options.state,
        input: anyOptions.input,
        output: anyOptions.output,
        rawInput: anyOptions.rawInput,
        errorText: anyOptions.errorText,
        providerExecuted: anyOptions.providerExecuted,
        ...(anyOptions.providerMetadata != null
          ? { callProviderMetadata: anyOptions.providerMetadata }
          : {}),
      } as ToolUIPart<InferUIMessageTools<UI_MESSAGE>>);
    }
  }

  function updateDynamicToolPart(
    options: {
      toolName: keyof InferUIMessageTools<UI_MESSAGE> & string;
      toolCallId: string;
      providerExecuted?: boolean;
    } & (
      | {
          state: 'input-streaming';
          input?: unknown;
        }
      | {
          state: 'input-available';
          input?: unknown;
          providerMetadata?: ProviderMetadata;
        }
      | {
          state: 'output-available';
          input?: unknown;
          output: unknown;
        }
      | {
          state: 'output-error';
          input?: unknown;
          errorText: string;
          providerMetadata?: ProviderMetadata;
        }
    ),
  ) {
    let part: DynamicToolUIPart | undefined;
    let foundDynMsgIdx = -1;
    
    // 遍历所有消息查找匹配的动态工具部分
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i];
      part = message.parts.find(
        (p): p is DynamicToolUIPart =>
          p.type === 'dynamic-tool' && p.toolCallId === options.toolCallId
      );
      if (part) { foundDynMsgIdx = i; break; }
    }

    const anyOptions = options as any;
    const anyPart = part as any;

    if (part != null) {
      part.state = options.state;
      anyPart.toolName = options.toolName;
      if (anyOptions.input) {
        anyPart.input = anyOptions.input;
      }
      anyPart.output = anyOptions.output;
      anyPart.errorText = anyOptions.errorText;
      anyPart.rawInput = anyOptions.rawInput ?? anyPart.rawInput;

      if (
        anyOptions.providerMetadata != null &&
        part.state === 'input-available'
      ) {
        part.callProviderMetadata = anyOptions.providerMetadata;
      }

      // 标记脏消息：动态工具调用所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      if (foundDynMsgIdx >= 0 && state.messages[foundDynMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(foundDynMsgIdx);
      }
    } else {
      state.message.parts.push({
        type: 'dynamic-tool',
        toolName: options.toolName,
        toolCallId: options.toolCallId,
        state: options.state,
        input: anyOptions.input,
        output: anyOptions.output,
        errorText: anyOptions.errorText,
        ...(anyOptions.providerMetadata != null
          ? { callProviderMetadata: anyOptions.providerMetadata }
          : {}),
      } as DynamicToolUIPart);
    }
  }
  
  async function updateMessageMetadata(metadata: unknown) {
    if (metadata != null) {
      const mergedMetadata =
        state.message.metadata != null
          ? mergeObjects(state.message.metadata, metadata)
          : metadata;

      if (messageMetadataSchema != null) {
        await validateTypes({
          value: mergedMetadata,
          schema: messageMetadataSchema,
        });
      }

      state.message.metadata =
        mergedMetadata as InferUIMessageMetadata<UI_MESSAGE>;
    }
  }

  // 是否创建新消息（由外部 shouldStartNewMessage 回调决定）
  if (shouldStartNewMessage(state.message, chunk)) {
    state.message = createUIMessage({ createdAt: chunk?.rawData?.timestamp }) as UI_MESSAGE;
    state.messages.push(state.message);
  }

  // 没有 metadata 时，创建一个
  if (!state.message.metadata?.name) {
    // 设置 metadata
    await updateMessageMetadata({
      name: (chunk as any)?.rawData?.rawEvent?.name,
      role: (chunk as any)?.rawData?.role,
    });
  }

  switch (chunk.type) {
    case 'text-start': {
      const textPart: TextUIPart = {
        type: 'text',
        text: '',
        providerMetadata: chunk.providerMetadata,
        state: 'streaming',
        rawData: chunk.rawData,
      };
      state.activeTextParts[chunk.id] = textPart;
      state.activeTextMessageIndices[chunk.id] = state.messages.length - 1; // 记录 text 所在消息索引
      state.message.parts.push(textPart);
      write?.();
      break;
    }

    case 'text-delta': {
      const textPart = state.activeTextParts[chunk.id];
      textPart.text += chunk.delta;
      textPart.providerMetadata =
        chunk.providerMetadata ?? textPart.providerMetadata;

      // 标记脏消息：text 所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      const textDeltaMsgIdx = state.activeTextMessageIndices[chunk.id];
      if (textDeltaMsgIdx !== undefined && state.messages[textDeltaMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(textDeltaMsgIdx);
      }

      write?.();
      break;
    }

    case 'text-end': {
      const textPart = state.activeTextParts[chunk.id];
      textPart.state = 'done';
      textPart.providerMetadata =
        chunk.providerMetadata ?? textPart.providerMetadata;

      // 标记脏消息：text 所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      const textEndMsgIdx = state.activeTextMessageIndices[chunk.id];
      if (textEndMsgIdx !== undefined && state.messages[textEndMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(textEndMsgIdx);
      }

      delete state.activeTextParts[chunk.id];
      delete state.activeTextMessageIndices[chunk.id]; // 清除索引跟踪
      write?.();
      break;
    }

    case 'reasoning-start': {
      // 以 agent name 为 key 跟踪每个智能体的 reasoning id，支持并行思考
      const agentName = (chunk as any)?.rawData?.rawEvent?.name
        ?? (chunk as any)?.rawData?.name
        ?? '__default__';
      const reasoningPart: ReasoningUIPart = {
        type: 'reasoning',
        text: '',
        providerMetadata: chunk.providerMetadata,
        state: 'streaming',
        rawData: (chunk as any)?.rawData,
      };
      chunk.id = chunk.id ?? generateIdFunc(); // 生成或使用现有 id
      state.currentReasoningIds[agentName] = chunk.id; // 按 agent name 存储 reasoning id
      state.activeReasoningParts[chunk.id] = reasoningPart;
      state.activeReasoningMessageIndices[chunk.id] = state.messages.length - 1; // 记录 reasoning 所在消息索引
      state.message.parts.push(reasoningPart);
      write?.();
      break;
    }

    case 'reasoning-delta': {
      // 从 rawData 中提取 agent name，查找对应的 reasoning id
      const agentName = (chunk as any)?.rawData?.rawEvent?.name
        ?? (chunk as any)?.rawData?.name
        ?? '__default__';
      chunk.id = chunk.id ?? state.currentReasoningIds[agentName];
      const reasoningPart = state.activeReasoningParts[chunk.id];
      if (!reasoningPart) break; // 防御：并行场景下若 part 未找到则跳过
      reasoningPart.text += chunk.delta;
      reasoningPart.providerMetadata =
        chunk.providerMetadata ?? reasoningPart.providerMetadata;

      // 标记脏消息：reasoning 所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      const reasoningDeltaMsgIdx = state.activeReasoningMessageIndices[chunk.id];
      if (reasoningDeltaMsgIdx !== undefined && state.messages[reasoningDeltaMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(reasoningDeltaMsgIdx);
      }

      write?.();
      break;
    }

    case 'reasoning-end': {
      // 从 rawData 中提取 agent name，查找对应的 reasoning id
      const agentName = (chunk as any)?.rawData?.rawEvent?.name
        ?? (chunk as any)?.rawData?.name
        ?? '__default__';
      chunk.id = chunk.id ?? state.currentReasoningIds[agentName];
      delete state.currentReasoningIds[agentName]; // 清除该 agent 的 reasoning id
      const reasoningPart = state.activeReasoningParts[chunk.id];
      if (!reasoningPart) break; // 防御：并行场景下若 part 未找到则跳过

      // 标记脏消息：reasoning 所在消息非当前消息时，需通知 write() 同步旧消息到 UI
      const reasoningEndMsgIdx = state.activeReasoningMessageIndices[chunk.id];
      if (reasoningEndMsgIdx !== undefined && state.messages[reasoningEndMsgIdx] !== state.message) {
        state.dirtyMessageIndices.add(reasoningEndMsgIdx);
      }

      reasoningPart.providerMetadata =
        chunk.providerMetadata ?? reasoningPart.providerMetadata;
      reasoningPart.state = 'done';
      delete state.activeReasoningParts[chunk.id];
      delete state.activeReasoningMessageIndices[chunk.id]; // 清除索引跟踪

      write?.();
      break;
    }

    case 'file': {
      state.message.parts.push({
        type: 'file',
        mediaType: chunk.mediaType,
        url: chunk.url,
      });

      write?.();
      break;
    }

    case 'source-url': {
      state.message.parts.push({
        type: 'source-url',
        sourceId: chunk.sourceId,
        url: chunk.url,
        title: chunk.title,
        providerMetadata: chunk.providerMetadata,
      });

      write?.();
      break;
    }

    case 'source-document': {
      state.message.parts.push({
        type: 'source-document',
        sourceId: chunk.sourceId,
        mediaType: chunk.mediaType,
        title: chunk.title,
        filename: chunk.filename,
        providerMetadata: chunk.providerMetadata,
      });

      write?.();
      break;
    }

    case 'tool-input-start': {
      const toolInvocations = state.message.parts.filter(isToolUIPart);

      // add the partial tool call to the map
      state.partialToolCalls[chunk.toolCallId] = {
        text: '',
        toolName: chunk.toolName,
        index: toolInvocations.length,
        dynamic: chunk.dynamic,
      };

      if (chunk.dynamic) {
        updateDynamicToolPart({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          state: 'input-streaming',
          input: undefined,
        });
      } else {
        updateToolPart({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          state: 'input-streaming',
          input: undefined,
          providerExecuted: chunk.providerExecuted,
        });
      }

      write?.();
      break;
    }

    case 'tool-input-delta': {
      const partialToolCall = state.partialToolCalls[chunk.toolCallId];

      partialToolCall.text += chunk.inputTextDelta;

      const { value: partialArgs } = await parsePartialJson(
        partialToolCall.text,
      );

      if (partialToolCall.dynamic) {
        updateDynamicToolPart({
          toolCallId: chunk.toolCallId,
          toolName: partialToolCall.toolName,
          state: 'input-streaming',
          input: partialArgs,
        });
      } else {
        updateToolPart({
          toolCallId: chunk.toolCallId,
          toolName: partialToolCall.toolName,
          state: 'input-streaming',
          input: partialArgs,
        });
      }

      write?.();
      break;
    }

    case 'tool-input-available': {
      if (chunk.dynamic) {
        updateDynamicToolPart({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          state: 'input-available',
          // input: chunk.input,
          providerMetadata: chunk.providerMetadata,
        });
      } else {
        updateToolPart({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          state: 'input-available',
          // input: chunk.input,
          providerExecuted: chunk.providerExecuted,
          providerMetadata: chunk.providerMetadata,
        });
      }

      write?.();

      // invoke the onToolCall callback if it exists. This is blocking.
      // In the future we should make this non-blocking, which
      // requires additional state management for error handling etc.
      // Skip calling onToolCall for provider-executed tools since they are already executed
      if (onToolCall && !chunk.providerExecuted) {
        await onToolCall({
          toolCall: chunk as InferUIMessageToolCall<UI_MESSAGE>,
        });
      }
      break;
    }
    // @ts-ignore
    case 'tool-input-error': {
      if ((chunk as any).dynamic) {
        updateDynamicToolPart({
          toolCallId: (chunk as any).toolCallId,
          toolName: (chunk as any).toolName,
          state: 'output-error',
          input: (chunk as any).input,
          errorText: (chunk as any).errorText,
          providerMetadata: (chunk as any).providerMetadata,
        });
      } else {
        updateToolPart({
          toolCallId: (chunk as any).toolCallId,
          toolName: (chunk as any).toolName,
          state: 'output-error',
          // input: undefined,
          rawInput: (chunk as any).input,
          errorText: (chunk as any).errorText,
          providerExecuted: (chunk as any).providerExecuted,
          providerMetadata: (chunk as any).providerMetadata,
        });
      }

      write?.();
      break;
    }

    case 'tool-output-available': {
      if (chunk.dynamic) {
        const toolInvocation = getDynamicToolInvocation(
          chunk.toolCallId,
        );

        updateDynamicToolPart({
          toolCallId: chunk.toolCallId,
          toolName: toolInvocation.toolName,
          state: 'output-available',
          input: (toolInvocation as any).input,
          output: chunk.output,
        });
      } else {
        const toolInvocation = getToolInvocation(chunk.toolCallId);
        updateToolPart({
          toolCallId: chunk.toolCallId,
          toolName: getToolName(toolInvocation),
          state: 'output-available',
          input: (toolInvocation as any).input,
          output: chunk.output,
          providerExecuted: chunk.providerExecuted,
        });
      }

      write?.();
      break;
    }

    case 'tool-output-error': {
      if (chunk.dynamic) {
        const toolInvocation = getDynamicToolInvocation(
          chunk.toolCallId,
        );

        updateDynamicToolPart({
          toolCallId: chunk.toolCallId,
          toolName: toolInvocation.toolName,
          state: 'output-error',
          input: (toolInvocation as any).input,
          errorText: chunk.errorText,
        });
      } else {
        const toolInvocation = getToolInvocation(chunk.toolCallId);

        updateToolPart({
          toolCallId: chunk.toolCallId,
          toolName: getToolName(toolInvocation),
          state: 'output-error',
          input: (toolInvocation as any).input,
          rawInput: (toolInvocation as any).rawInput,
          errorText: chunk.errorText,
        });
      }

      write?.();
      break;
    }

    case 'start-step': {
      // add a step boundary part to the message
      state.message.parts.push({ type: 'step-start', rawData: { ...chunk.rawData, isCompleted: false } });
      break;
    }

    case 'finish-step': {
      // reset the current text and reasoning parts
      // NOTE: 源码中是下方两行代码, 但由于担心基座返回的 finish-step 打断了正在流式输出的 text/reasoning, 所以暂时注释掉, 改为在当前 messages.parts 中查找最后与之对应的 start-step 并更新其状态
      // state.activeTextParts = {};
      // state.activeReasoningParts = {};

      // NOTE: 找到最后与之对应的 start-step 并更新其状态
      for (let i = state.message.parts.length - 1; i >= 0; i--) {
        const part = state.message.parts[i];
        if (part.type === 'step-start' && part.rawData && !part.rawData.isCompleted) {
          part.rawData.isCompleted = true;
          break;
        }
      }
      break;
    }

    case 'start': {
      // 多智能体并行时会发送多次 RUN_STARTED，只处理第一次
      if (state.startReceived) break;
      state.startReceived = true;

      if (chunk.messageId != null) {
        state.message.id = chunk.messageId;
      }

      await updateMessageMetadata(chunk.messageMetadata);

      if (chunk.messageId != null || chunk.messageMetadata != null) {
        write?.();
      }
      break;
    }

    case 'finish': {
      await updateMessageMetadata(chunk.messageMetadata);
      if (chunk.messageMetadata != null) {
        write?.();
      }
      break;
    }

    case 'message-metadata': {
      await updateMessageMetadata(chunk.messageMetadata);
      if (chunk.messageMetadata != null) {
        write?.();
      }
      break;
    }

    case 'error': {
      onError?.(new Error(chunk.errorText));
      break;
    }

    default: {
      if (isDataUIMessageChunk(chunk)) {
        // validate data chunk if dataPartSchemas is provided
        if (dataPartSchemas?.[chunk.type] != null) {
          await validateTypes({
            value: chunk.data,
            schema: dataPartSchemas[chunk.type],
          });
        }

        // cast, validation is done above
        const dataChunk = chunk as DataUIMessageChunk<
          InferUIMessageData<UI_MESSAGE>
        >;

        // transient parts are not added to the message state
        if (dataChunk.transient) {
          onData?.(dataChunk);
          break;
        }

        const existingUIPart =
          dataChunk.id != null
            ? (state.message.parts.find(
                chunkArg =>
                  dataChunk.type === chunkArg.type &&
                  dataChunk.id === chunkArg.id,
              ) as
                | DataUIPart<InferUIMessageData<UI_MESSAGE>>
                | undefined)
            : undefined;

        if (existingUIPart != null) {
          existingUIPart.data = dataChunk.data;
        } else {
          state.message.parts.push(dataChunk);
        }

        onData?.(dataChunk);

        write?.();
      }
    }
  }

  controller?.enqueue(chunk as InferUIMessageChunk<UI_MESSAGE>);
}