import { HttpChatTransport, type HttpChatTransportInitOptions } from "@coco-box/ai";
import type { UIMessage, UIMessageChunk } from "@coco-box/ai";
import { createUiChunkStreamFromAgUi } from "./stream-adapter";

/**
 * AgUiHttpTransport 的初始化选项，扩展了 HttpChatTransportInitOptions
 */
export type AgUiHttpTransportInitOptions = 
  HttpChatTransportInitOptions<UIMessage> & {
    /**
     * 当接收到新的 chunk 时的回调函数
     * @param chunk 接收到的 UIMessageChunk
     */
    onUpdate?: (chunk: UIMessageChunk) => void;

    /**
     * 在 SSE 流处理之前，对原始 Response 进行校验的回调。
     * 接收到的是 response 的克隆体，可以安全地读取 body 而不影响流式处理。
     * 若检测到业务级别错误，应抛出 Error，该错误会被 chat 的 onError 回调捕获。
     *
     * @example
     * ```ts
     * onResponse: async (response) => {
     *   const contentType = response.headers.get('content-type');
     *   if (contentType?.includes('application/json')) {
     *     const json = await response.json();
     *     if (json.code !== 200) {
     *       throw new Error(json.msg || '业务错误');
     *     }
     *   }
     * }
     * ```
     */
    onResponse?: (response: Response) => void | Promise<void>;
  };

export class AgUiHttpTransport
  extends HttpChatTransport<UIMessage>
{
  private onUpdate?: (chunk: UIMessageChunk) => void;
  private abortActiveFetch?: (reason?: unknown) => void;

  constructor(options: AgUiHttpTransportInitOptions = {}) {
    const { onResponse, ...rest } = options;
    const originalFetch = rest.fetch ?? globalThis.fetch;
    let activeAbortController: AbortController | undefined;

    const abortActiveFetch = (reason?: unknown) => {
      activeAbortController?.abort(reason);
    };

    rest.fetch = async (input, init = {}) => {
      const abortController = new AbortController();
      activeAbortController = abortController;
      const originalSignal = init.signal;

      if (originalSignal?.aborted) {
        abortController.abort(originalSignal.reason);
      } else {
        originalSignal?.addEventListener('abort', () => {
          abortController.abort(originalSignal.reason);
        }, { once: true });
      }

      const response = await originalFetch(input, {
        ...init,
        signal: abortController.signal,
      });

      if (onResponse) {
        // 使用 clone 避免消耗原始 body
        await onResponse(response.clone());
      }

      return response;
    };

    super(rest);
    this.onUpdate = options.onUpdate;
    this.abortActiveFetch = abortActiveFetch;
  }

  // 仅覆写：把原始 SSE 字节流，转成 UIMessageChunk 流（通过 AG-UI → UIMessageChunk 适配器）
  protected processResponseStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  ): ReadableStream<UIMessageChunk> {
    // 这里的适配器同时支持 data: {json}\n（SSE）或 JSONL 行，或直接对象事件
    // 将 onUpdate 回调传递给 createUiChunkStreamFromAgUi 处理
    return createUiChunkStreamFromAgUi(stream as any, this.onUpdate, (error) => {
      this.abortActiveFetch?.(error);
    });
  }
}