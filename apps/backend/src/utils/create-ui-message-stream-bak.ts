// createUIMessageStream.ts
import { Readable } from 'stream';

/**
 * 模拟 ag-ui-protocol 的流式输出
 * @param events 事件数组
 * @param delay 每个事件之间的延迟（毫秒）
 */
export function createUIMessageStream(
  events: any[],
  delay = 200
): Readable {
  let index = 0;

  return new Readable({
    async read() {
      if (index >= events.length) {
        this.push(null); // 结束
        return;
      }

      const event = events[index++];
      // SSE 格式：data: <json字符串>\n\n
      const sseChunk = `data: ${JSON.stringify(event)}\n\n`;

      // 模拟延迟发送
      setTimeout(() => {
        this.push(sseChunk);
      }, delay);
    }
  });
}