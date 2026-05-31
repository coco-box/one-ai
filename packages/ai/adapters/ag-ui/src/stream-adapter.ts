import { mapAgUiEventToUiChunk } from './mapper';
import type { AgUIRawEvent } from './types';
import type { UIMessageChunk } from '@coco-box/ai';

/**
 * 将 AG-UI 原始事件（对象或 JSON 行）流，适配为 AI SDK 的 UIMessageChunk ReadableStream。
 * 可用于自定义 Transport（SSE/WS）。
 * 
 * @param agUIStream AG-UI 原始事件流
 * @param onUpdate 可选的 chunk 更新回调函数
 */
export function createUiChunkStreamFromAgUi(
  agUIStream: ReadableStream<string | Uint8Array | AgUIRawEvent>,
  onUpdate?: (chunk: UIMessageChunk) => void,
): ReadableStream<UIMessageChunk> {
  const textDecoder = new TextDecoder();

  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      const reader = agUIStream.getReader();
      let buffer = '';
      let isClosed = false;  // 标记流是否已关闭，防止重复 close

      // 清理函数
      const cleanup = () => {
        try {
          reader.releaseLock();
        } catch (e) {
          // reader 可能已经释放,忽略错误
        }
      };

      async function pump(): Promise<void> {
        try {
          const { done, value } = await reader.read();

          if (done) {
            // flush buffer - 逐行处理确保所有数据都被正确解析
            if (buffer.trim()) {
              const remainingLines = buffer.split('\n');
              for (const line of remainingLines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                  tryParseAndEmit(trimmedLine);
                }
              }
            }
            cleanup(); // 清理 reader

            // 防止重复 close
            if (!isClosed) {
              isClosed = true;
              controller.close();
            }
            return;
          }

          if (typeof value === 'string') {
            buffer += value;
          } else if (value instanceof Uint8Array) {
            buffer += textDecoder.decode(value, { stream: true });
          } else {
            // 直接对象事件
            emitEventObject(value as AgUIRawEvent);
          }

          // 尝试逐行解析（支持 SSE: `data: {...}\n` 或纯 JSONL）
          let lineBreakIndex: number;
          while ((lineBreakIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, lineBreakIndex).trim();
            buffer = buffer.slice(lineBreakIndex + 1);
            if (!line) continue;

            tryParseAndEmit(line);
          }

          return pump();
        } catch (err) {
          cleanup(); // 错误时也清理 reader

          // 只在流未关闭时报告错误
          if (!isClosed) {
            isClosed = true;
            controller.error(err);
          }
        }
      }

      // 将这些函数移到 start 内部，共享 isClosed 状态
      function tryParseAndEmit(line: string) {
        try {
          // SSE data: 前缀
          const jsonStr = line.startsWith('data:')
            ? line.substring(5)
            : line;

          if (jsonStr === '[DONE]') {
            // 防止重复 close
            if (!isClosed) {
              isClosed = true;
              controller.close();
            }
            return;
          }

          const raw: AgUIRawEvent = JSON.parse(jsonStr);
          emitEventObject(raw);
        } catch (error) {
          // 跳过无法解析的行
          console.error(`无法解析下列 AG-UI 事件行: ${line}, 错误信息:`, error);
        }
      }

      function emitEventObject(raw: AgUIRawEvent) {
        const chunk = mapAgUiEventToUiChunk(raw);
        if (chunk) {
          // 流已关闭时不再 enqueue，防止级联错误
          if (isClosed) return;

          // 调用 onUpdate 回调（如果提供）
          onUpdate?.(chunk as UIMessageChunk);

          // 继续传递 chunk
          controller.enqueue(chunk as UIMessageChunk);

          // 结束
          if (chunk.type === 'finish') {
            // 防止重复 close
            if (!isClosed) {
              isClosed = true;
              controller.close();
            }
            return;
          }
        }
      }

      pump();
    },
  });
}
