import { EventType } from "@ag-ui/client";

/**
 * 创建带随机块拆分的 Tool Call 事件
 * @param toolCallId 工具调用唯一 ID
 * @param toolCallName 工具名称
 * @param input 工具输入对象
 * @param output 工具输出（可选）
 */
export function createToolCallEvents({
  toolCallId,
  toolCallName,
  input,
  output,
  parentMessageId,
  minChunkSize = 1,
  maxChunkSize = 5,
  syncOutput = false,
}: {
  toolCallId: string;
  toolCallName: string;
  input: Record<string, any>;
  output?: any;
  parentMessageId?: string;
  minChunkSize?: number;
  maxChunkSize?: number;
  syncOutput?: boolean;
}) {
  const inputEvents: any[] = [];

  // 1. Start
  inputEvents.push({
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName,
    parentMessageId,
  });

  // 2. 模拟 delta
  const inputString = JSON.stringify(input);
  let i = 0;
  while (i < inputString.length) {
    const chunkSize =
      Math.floor(Math.random() * (maxChunkSize - minChunkSize + 1)) +
      minChunkSize;
    const chunk = inputString.slice(i, i + chunkSize);
    inputEvents.push({
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta: chunk,
    });
    i += chunkSize;
  }

  // 3. 调用结束
  inputEvents.push({
    type: EventType.TOOL_CALL_END,
    toolCallId,
  });

  // 4. 调用结果
  if (syncOutput) {
    inputEvents.push({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId,
      content: output,
    });
  }

  return {
    inputEvents,
    createOutputEvent: (innerOutput?: any) => ({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId,
      content: innerOutput ?? output,
    }),
  };
}