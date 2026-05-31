import type { UIMessageChunk, TextStreamPart } from '@coco-box/ai';
import type {
  AgUIRawEvent,
  AgUIRunStarted,
  AgUIRunFinished,
  AgUIStepStarted,
  AgUIStepFinished,
  AgUITextMessageStart,
  AgUITextMessageContent,
  AgUITextMessageEnd,
  AgUIToolCallStart,
  AgUIToolCallArgs,
  AgUIToolCallEnd,
  AgUIToolCallResult,
  AgUIToolCallError,
  AgUIReasoningStart,
  AgUIReasoningContent,
  AgUIReasoningEnd,
  AgUICustomPart,
} from './types';

import { EventType } from '@ag-ui/client';

/**
 * 将字符串从下划线命名法转换为驼峰命名法
 * @param str 下划线命名的字符串
 * @returns 驼峰命名的字符串
 */
function underscoreToCamelcase(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * 递归将对象(包括嵌套对象)的下划线字段转换为驼峰命名
 * @param obj 要转换的对象
 * @returns 转换后的新对象
 */
function convertObjectKeysToCamelcase<T extends object>(obj: T): T {
  // 如果不是对象或为null，直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj as T;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' && item !== null 
        ? convertObjectKeysToCamelcase(item as object) 
        : item
    ) as unknown as T;
  }

  // 处理对象
  const converted: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // 特殊字段映射处理
      const newKey = key === 'agent_name' ? 'name' as keyof T : key;
      const camelKey = underscoreToCamelcase(String(newKey));
      const value = obj[key];
      // 递归处理嵌套对象
      converted[camelKey] = typeof value === 'object' && value !== null
        ? convertObjectKeysToCamelcase(value as object)
        : value;
    }
  }
  
  return converted as T;
}

/** 将 AG-UI 事件映射为 AI SDK 的 UIMessageChunk **/
export function mapAgUiEventToUiChunk(event: AgUIRawEvent): UIMessageChunk | TextStreamPart<any> | null {
  event = convertObjectKeysToCamelcase(event);
  switch (event.type) {
    // 文本消息
    case EventType.TEXT_MESSAGE_START: {
      const e = event as AgUITextMessageStart;
      return { type: 'text-start', id: e.messageId, rawData: e };
    }
    case EventType.TEXT_MESSAGE_CONTENT: {
      const e = event as AgUITextMessageContent;
      return { type: 'text-delta', id: e.messageId, delta: e.delta, rawData: e };
    }
    case EventType.TEXT_MESSAGE_END: {
      const e = event as AgUITextMessageEnd;
      return { type: 'text-end', id: e.messageId, rawData: e };
    }
    // 思考消息
    case EventType.THINKING_TEXT_MESSAGE_START: {
      const e = event as AgUIReasoningStart;
      return { type: 'reasoning-start', id: e.messageId, rawData: e };
    }
    case EventType.THINKING_TEXT_MESSAGE_CONTENT: {
      const e = event as AgUIReasoningContent;
      return { type: 'reasoning-delta', id: e.messageId, delta: e.delta, rawData: e };
    }
    case EventType.THINKING_TEXT_MESSAGE_END: {
      const e = event as AgUIReasoningEnd;
      return { type: 'reasoning-end', id: e.messageId, rawData: e };
    }
    // 工具调用
    case EventType.TOOL_CALL_START: {
      const e = event as AgUIToolCallStart;
      return {
        type: 'tool-input-start',
        toolCallId: e.toolCallId,
        toolName: e.toolCallName,
        dynamic: e.dynamic,
        rawData: e
      };
    }
    case EventType.TOOL_CALL_ARGS: {
      const e = event as AgUIToolCallArgs;
      return { type: 'tool-input-delta', toolCallId: e.toolCallId, inputTextDelta: e.delta, rawData: e };
    }
    // https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#tool-output-available-part
    case EventType.TOOL_CALL_END: {
      const e = event as AgUIToolCallEnd;
      return {
        type: 'tool-input-available',
        toolCallId: e.toolCallId,
        toolName: e.toolCallName || '',
        input: e.input, // todo: 需要后端在 tool_call_end 时把完整 input 返回
        dynamic: e.dynamic,
        rawData: e
      };
    }
    // https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#tool-output-available-part
    case EventType.TOOL_CALL_RESULT: {
      const e = event as AgUIToolCallResult;
      if (e.content) {
        return {
          type: 'tool-output-available',
          toolCallId: e.toolCallId,
          output: e.content,
          dynamic: e.dynamic,
          rawData: e
        };
      }
      return {
        type: 'tool-output-error',
        toolCallId: e.toolCallId,
        errorText: e.content,
        dynamic: e.dynamic,
        rawData: e
      };
    }
    // 兜底事件
    default: {
      // 自定义事件: CUSTOM → data-*
      if (event.type === EventType.CUSTOM) {
        const e = event as AgUICustomPart;
        const name = e.name?.toLowerCase();
        return {
          type: `data-${name}` as any,
          id: e.messageId,
          data: e.value,
          transient: false, // 都是需要展示的(false代表展示)
          rawData: e
        } as UIMessageChunk;
      }

      // 运行级事件（非 UIMessageChunk，前端可自行订阅）：忽略/返回 null
      // - RUN_ERROR：映射为 UI 协议的 error 块，触发 AbstractChat onError
      if (event.type === EventType.RUN_ERROR) {
        return { type: 'error', errorText: (event as any).message || 'AG-UI run error' };
      }
      // - RUN_STARTED
      if (event.type === EventType.RUN_STARTED) {
        const { threadId, runId, timestamp: runStartedTimestamp, rawEvent } = event as AgUIRunStarted;
        return { type: 'start', rawData: event, messageMetadata: { threadId, runId, runStartedTimestamp, rawEvent: rawEvent as any } };
      }
      // - RUN_FINISHED
      if (event.type === EventType.RUN_FINISHED) {
        const { threadId, runId, timestamp: runFinishedTimestamp, rawEvent, result } = event as AgUIRunFinished;
        return { type: 'finish', rawData: event, messageMetadata: { threadId, runId, runFinishedTimestamp, rawEvent: rawEvent as any, result } };
      }
      // - STEP_STARTED
      if (event.type === EventType.STEP_STARTED) {
        return { type: 'start-step', rawData: event as AgUIStepStarted };
      }
      // - STEP_FINISHED
      if (event.type === EventType.STEP_FINISHED) {
        return { type: 'finish-step', rawData: event as AgUIStepFinished };
      }

      // 状态/快照类事件（不直接做 UIMessage 更新，转 data-* 以便 onData 处理或 UI 面板显示）
      if (event.type === EventType.MESSAGES_SNAPSHOT) {
        return { type: 'data-messages-snapshot' as any, data: (event as any).messages, rawData: event };
      }
      if (event.type === EventType.STATE_SNAPSHOT) {
        return { type: 'data-state-snapshot' as any, data: (event as any).state, rawData: event };
      }
      if (event.type === EventType.STATE_DELTA) {
        return { type: 'data-state-delta' as any, data: (event as any).delta, transient: true, rawData: event };
      }

      return null;
    }
  }
}


