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
  let reader: ReadableStreamDefaultReader<string | Uint8Array | AgUIRawEvent> | undefined;
  let isClosed = false;

  const cleanup = (
    currentReader: ReadableStreamDefaultReader<string | Uint8Array | AgUIRawEvent> | undefined = reader,
  ) => {
    try {
      currentReader?.releaseLock();
    } catch (e) {
      // reader 可能已经释放,忽略错误
    }
  };

  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      reader = agUIStream.getReader();
      let buffer = '';

      const cancelUpstream = (reason?: unknown) => {
        const currentReader = reader;
        if (!currentReader) return;

        reader = undefined;
        currentReader.cancel(reason).catch(() => {
          // 上游可能已经结束或不可取消,忽略错误
        }).finally(() => cleanup(currentReader));
      };

      const closeStream = () => {
        if (isClosed) return;
        isClosed = true;
        controller.close();
        cancelUpstream();
      };

      const failStream = (error: unknown) => {
        if (isClosed) return;
        isClosed = true;
        cancelUpstream(error);
        controller.error(error);
      };

      async function pump(): Promise<void> {
        try {
          if (isClosed || !reader) return;

          const { done, value } = await reader.read();

          if (isClosed) return;

          if (done) {
            // flush buffer - 逐行处理确保所有数据都被正确解析
            if (buffer.trim()) {
              const remainingLines = buffer.split('\n');
              for (const line of remainingLines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !isClosed) {
                  tryParseAndEmit(trimmedLine);
                }
              }
            }
            cleanup(); // 清理 reader

            // 防止重复 close
            closeStream();
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
          while (!isClosed && (lineBreakIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, lineBreakIndex).trim();
            buffer = buffer.slice(lineBreakIndex + 1);
            if (!line) continue;

            tryParseAndEmit(line);
          }

          if (!isClosed) {
            return pump();
          }
        } catch (err) {
          cleanup(); // 错误时也清理 reader

          // 只在流未关闭时报告错误
          failStream(err);
        }
      }

      // 将这些函数移到 start 内部，共享 isClosed 状态
      function tryParseAndEmit(line: string) {
        if (isClosed) return;

        // SSE data: 前缀
        const jsonStr = line.startsWith('data:')
          ? line.substring(5)
          : line;

        if (jsonStr === '[DONE]') {
          closeStream();
          return;
        }

        let raw: AgUIRawEvent;
        try {
          raw = JSON.parse(jsonStr);
        } catch (error) {
          failStream(new Error('AG-UI protocol error: invalid JSON event line'));
          return;
        }

        emitEventObject(raw);
      }

      function emitEventObject(raw: AgUIRawEvent) {
        try {
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
              closeStream();
              return;
            }
          }
        } catch (error) {
          failStream(error);
        }
      }

      pump();
    },
    cancel(reason) {
      if (isClosed) return;
      isClosed = true;
      const currentReader = reader;
      reader = undefined;
      currentReader?.cancel(reason).catch(() => {
        // 上游可能已经结束或不可取消,忽略错误
      }).finally(() => cleanup(currentReader));
    },
  });
}
