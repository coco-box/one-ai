import { WSChatTransport, type WSChatTransportInitOptions } from "@coco-box/ai";
import type { UIMessage, UIMessageChunk } from "@coco-box/ai";
import { createUiChunkStreamFromAgUi } from "./stream-adapter";

/**
 * AgUiWsTransport 的初始化选项，扩展了 WSChatTransportInitOptions
 */
export type AgUiWsTransportInitOptions = 
  WSChatTransportInitOptions<UIMessage> & {
    /**
     * 当接收到新的 chunk 时的回调函数
     * @param chunk 接收到的 UIMessageChunk
     */
    onUpdate?: (chunk: UIMessageChunk) => void;
  };

export class AgUiWsTransport
  extends WSChatTransport<UIMessage>
{
  private onUpdate?: (chunk: UIMessageChunk) => void;

  constructor(options: AgUiWsTransportInitOptions = {}) {
    super(options);
    this.onUpdate = options.onUpdate;
  }

  // 仅覆写：把原始 SSE 字节流，转成 UIMessageChunk 流（通过 AG-UI → UIMessageChunk 适配器）
  protected processResponseStream(
    stream: ReadableStream<UIMessageChunk>,
  ): ReadableStream<UIMessageChunk> {
    // 这里的适配器同时支持 data: {json}\n（SSE）或 JSONL 行，或直接对象事件
    // 将 onUpdate 回调传递给 createUiChunkStreamFromAgUi 处理
    return createUiChunkStreamFromAgUi(stream as any, this.onUpdate);
  }
}