import { EventType } from '@ag-ui/client';

/**
 * 创建带随机块拆分的文本消息事件
 * @param messageId 消息唯一 ID
 * @param text 完整文本
 * @param role 角色（默认 assistant）
 * @param source 来源（智能体名称）
 */
export function createTextMessageEvents({
  messageId,
  text,
  role = 'assistant',
  source,
  minChunkSize = 1,
  maxChunkSize = 3,
}: {
  messageId: string;
  text: string;
  role?: string;
  source?: string;
  minChunkSize?: number;
  maxChunkSize?: number;
}) {
  const events: any[] = [];

  // 1. Start 事件
  events.push({
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role,
    source,
  });

  // 2. 按随机长度拆分
  let i = 0;
  while (i < text.length) {
    const chunkSize =
      Math.floor(Math.random() * (maxChunkSize - minChunkSize + 1)) +
      minChunkSize;
    const chunk = text.slice(i, i + chunkSize);
    events.push({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: chunk,
    });
    i += chunkSize;
  }

  // 3. End 事件
  events.push({
    type: EventType.TEXT_MESSAGE_END,
    messageId,
  });

  return events;
}