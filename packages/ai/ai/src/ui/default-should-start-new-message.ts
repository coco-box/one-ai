import type { UIMessage } from "../types";

// 不会创建新 part 的事件类型——这些事件仅通过引用更新已有 part，
// 不应触发新消息创建，否则并发场景下交替收到不同智能体的事件时会产生空消息。
const CONTINUATION_EVENT_TYPES = new Set([
  'text-delta',
  'text-end',
  'reasoning-delta',
  'reasoning-end',
  'tool-input-delta',
  'tool-input-available',
  'tool-output-available',
  'tool-output-error',
  'finish-step',
  'start',
  'finish',
  'message-metadata',
  'error',
  'reasoning',
]);

/**
 * 默认的判断逻辑：
 * 1. 续传 / 更新类事件（delta、end、output 等）始终返回 false——它们只修改已有 part 的引用，不应创建新消息。
 * 2. 当新数据块的 agent `name` 与当前消息的 `name` 不同时，开启一个新消息。
 * @param currentMessage - 当前正在构建的消息。
 * @param newChunkData - 从流中新接收到的数据块。
 * @returns `true` 如果应该开启新消息。
 */
export function defaultShouldStartNewMessage<UI_MESSAGE extends UIMessage>(
  currentMessage: UI_MESSAGE,
  newChunkData: Record<string, any>,
): boolean {
  // 续传 / 更新类事件不创建新消息
  if (CONTINUATION_EVENT_TYPES.has(newChunkData.type)) {
    return false;
  }
  // 如果当前消息还没有 agent 名称，继续使用当前消息
  if (!currentMessage.metadata?.name) {
    return false;
  }
  // 如果新数据块有 agent 名称，且与当前消息的 agent 名称不同，则开启新消息
  return !!(newChunkData.rawData?.rawEvent?.name && newChunkData.rawData.rawEvent.name !== currentMessage.metadata?.name);
}