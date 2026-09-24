import { createParser } from 'eventsource-parser';
import type { UIMessageChunk } from '@coco-box/ai';
import { mapAgUiEventToUiChunk } from './mapper';
import type { AgUIRawEvent } from './types';

export type AgUiChunkTransformer = (
  chunk: UIMessageChunk,
) => UIMessageChunk | null;

export interface AgUiStreamAdapterOptions {
  /** 在 chunk 进入 @coco-box/ai 状态机前进行替换；返回 null 可丢弃该 chunk。 */
  transformChunk?: AgUiChunkTransformer;
  /** 收到保留下来的 chunk 时触发。 */
  onUpdate?: (chunk: UIMessageChunk) => void;
  /** 流解析、映射或回调失败时触发。 */
  onStreamError?: (error: unknown) => void;
}

type StreamValue = string | Uint8Array | AgUIRawEvent;
type TextStreamMode = 'sse' | 'jsonl';

/**
 * 将 AG-UI 原始事件（SSE、JSONL 或对象）流适配为 UIMessageChunk 流。
 *
 * 旧的三个位置参数签名继续保留；新代码建议传入 options 对象。
 */
export function createUiChunkStreamFromAgUi(
  agUIStream: ReadableStream<StreamValue>,
  options?: AgUiStreamAdapterOptions,
): ReadableStream<UIMessageChunk>;
export function createUiChunkStreamFromAgUi(
  agUIStream: ReadableStream<StreamValue>,
  onUpdate?: (chunk: UIMessageChunk) => void,
  onStreamError?: (error: unknown) => void,
): ReadableStream<UIMessageChunk>;
export function createUiChunkStreamFromAgUi(
  agUIStream: ReadableStream<StreamValue>,
  optionsOrOnUpdate?: AgUiStreamAdapterOptions | ((chunk: UIMessageChunk) => void),
  legacyOnStreamError?: (error: unknown) => void,
): ReadableStream<UIMessageChunk> {
  const options: AgUiStreamAdapterOptions =
    typeof optionsOrOnUpdate === 'function' || optionsOrOnUpdate === undefined
      ? {
          onUpdate: optionsOrOnUpdate,
          onStreamError: legacyOnStreamError,
        }
      : optionsOrOnUpdate;
  const textDecoder = new TextDecoder();
  let reader: ReadableStreamDefaultReader<StreamValue> | undefined;
  let isClosed = false;

  const cleanup = (
    currentReader: ReadableStreamDefaultReader<StreamValue> | undefined = reader,
  ) => {
    try {
      currentReader?.releaseLock();
    } catch {
      // reader 可能已经释放。
    }
  };

  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      reader = agUIStream.getReader();
      let textMode: TextStreamMode | undefined;
      let undecidedText = '';
      let jsonLineBuffer = '';

      const cancelUpstream = (reason?: unknown) => {
        const currentReader = reader;
        if (!currentReader) return;

        reader = undefined;
        currentReader
          .cancel(reason)
          .catch(() => {
            // 上游可能已经结束或不可取消。
          })
          .finally(() => cleanup(currentReader));
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
        try {
          options.onStreamError?.(error);
        } catch {
          // 错误回调不应覆盖原始流错误。
        }
        cancelUpstream(error);
        controller.error(error);
      };

      const emitEventObject = (raw: AgUIRawEvent) => {
        if (isClosed) return;

        try {
          const mappedChunk = mapAgUiEventToUiChunk(raw);
          if (!mappedChunk) return;

          const chunk = options.transformChunk
            ? options.transformChunk(mappedChunk as UIMessageChunk)
            : (mappedChunk as UIMessageChunk);
          if (!chunk || isClosed) return;

          options.onUpdate?.(chunk);
          controller.enqueue(chunk);

          if (chunk.type === 'finish') {
            closeStream();
          }
        } catch (error) {
          failStream(error);
        }
      };

      const parseAndEmit = (payload: string, source: string) => {
        if (isClosed) return;

        const normalizedPayload = payload.trim();
        if (!normalizedPayload) return;
        if (normalizedPayload === '[DONE]') {
          closeStream();
          return;
        }

        try {
          emitEventObject(JSON.parse(normalizedPayload) as AgUIRawEvent);
        } catch {
          if (!isClosed) {
            failStream(createInvalidJsonLineError(source));
          }
        }
      };

      const sseParser = createParser({
        onEvent(event) {
          parseAndEmit(event.data, `data: ${event.data}`);
        },
      });

      const parseJsonLine = (line: string) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        parseAndEmit(trimmedLine, trimmedLine);
      };

      const feedJsonLines = (text: string, final = false) => {
        jsonLineBuffer += text;

        while (!isClosed) {
          const lineBreakIndex = jsonLineBuffer.search(/[\r\n]/);
          if (lineBreakIndex < 0) break;
          if (
            !final &&
            jsonLineBuffer[lineBreakIndex] === '\r' &&
            lineBreakIndex === jsonLineBuffer.length - 1
          ) {
            break;
          }

          const width =
            jsonLineBuffer[lineBreakIndex] === '\r' &&
            jsonLineBuffer[lineBreakIndex + 1] === '\n'
              ? 2
              : 1;
          parseJsonLine(jsonLineBuffer.slice(0, lineBreakIndex));
          jsonLineBuffer = jsonLineBuffer.slice(lineBreakIndex + width);
        }

        if (final && !isClosed && jsonLineBuffer) {
          parseJsonLine(jsonLineBuffer);
          jsonLineBuffer = '';
        }
      };

      const feedDetectedText = (text: string) => {
        if (textMode === 'sse') {
          sseParser.feed(text);
        } else {
          feedJsonLines(text);
        }
      };

      const feedText = (text: string) => {
        if (!text || isClosed) return;
        if (textMode) {
          feedDetectedText(text);
          return;
        }

        undecidedText += text;
        const detectedMode = detectTextStreamMode(undecidedText);
        if (!detectedMode) return;

        textMode = detectedMode;
        const pendingText = undecidedText;
        undecidedText = '';
        feedDetectedText(pendingText);
      };

      const flushBufferedText = () => {
        if (!textMode && undecidedText.trim()) {
          textMode = detectTextStreamMode(undecidedText, true) ?? 'jsonl';
          const pendingText = undecidedText;
          undecidedText = '';
          feedDetectedText(pendingText);
        }

        if (textMode === 'sse') {
          // 标准 SSE 在空行处派发事件；结束时补空行兼容缺少结尾分隔符的旧服务。
          sseParser.feed('\n\n');
        } else if (textMode === 'jsonl') {
          feedJsonLines('', true);
        }
      };

      const flushText = () => {
        const decoderTail = textDecoder.decode();
        if (decoderTail) feedText(decoderTail);
        if (isClosed) return;
        flushBufferedText();
      };

      const finishNaturally = () => {
        if (isClosed) return;
        const currentReader = reader;
        reader = undefined;
        cleanup(currentReader);
        isClosed = true;
        controller.close();
      };

      const pump = async () => {
        try {
          while (!isClosed && reader) {
            const { done, value } = await reader.read();
            if (isClosed) return;

            if (done) {
              flushText();
              finishNaturally();
              return;
            }

            if (typeof value === 'string') {
              feedText(value);
            } else if (value instanceof Uint8Array) {
              feedText(textDecoder.decode(value, { stream: true }));
            } else {
              // 混合输入时先结算前面的文本，保持文本事件与对象事件的原始顺序。
              flushBufferedText();
              emitEventObject(value);
            }
          }
        } catch (error) {
          failStream(error);
        }
      };

      void pump();
    },
    cancel(reason) {
      if (isClosed) return;
      isClosed = true;
      const currentReader = reader;
      reader = undefined;
      currentReader
        ?.cancel(reason)
        .catch(() => {
          // 上游可能已经结束或不可取消。
        })
        .finally(() => cleanup(currentReader));
    },
  });
}

function detectTextStreamMode(text: string, final = false): TextStreamMode | undefined {
  const sample = text.replace(/^\uFEFF/, '').trimStart();
  if (!sample) return undefined;

  if (sample.startsWith('{') || sample.startsWith('[')) {
    return 'jsonl';
  }

  const lineBreakIndex = sample.search(/[\r\n]/);
  const firstLine = lineBreakIndex < 0 ? sample : sample.slice(0, lineBreakIndex);
  if (
    firstLine.startsWith(':') ||
    /^(?:data|event|id|retry)(?::|$)/.test(firstLine) ||
    firstLine.includes(':')
  ) {
    return 'sse';
  }

  if (lineBreakIndex >= 0 || final) {
    return 'jsonl';
  }

  return undefined;
}

function createInvalidJsonLineError(line: string): Error {
  return new Error(`AG-UI protocol error: invalid JSON event line: ${truncateLine(line)}`);
}

function truncateLine(line: string): string {
  const maxLength = 1000;
  if (line.length <= maxLength) return line;
  return `${line.slice(0, maxLength)}...`;
}
