import { UIMessageChunk } from '../ui-message-stream/ui-message-chunks';
import type { ChatTransport } from 'ai';
import type { UIMessage } from './ui-messages';
import { Resolvable, resolve } from '@ai-sdk/provider-utils';

export type PrepareWSSendMessagesRequest<UI_MESSAGE extends UIMessage> = (
  options: {
    id: string;
    messages: UI_MESSAGE[];
    requestMetadata: unknown;
    body: Record<string, any> | undefined;
    headers: Record<string, string> | undefined;
    api: string;
  } & {
    trigger: 'submit-message' | 'regenerate-message';
    messageId: string | undefined;
  },
) =>
  | {
      body: object;
      headers?: Record<string, string>;
      api?: string;
    }
  | PromiseLike<{
      body: object;
      headers?: Record<string, string>;
      api?: string;
    }>;

export type PrepareWSReconnectToStreamRequest = (options: {
  id: string;
  requestMetadata: unknown;
  body: Record<string, any> | undefined;
  headers: Record<string, string> | undefined;
  api: string;
}) =>
  | {
      headers?: Record<string, string>;
      api?: string;
    }
  | PromiseLike<{
      headers?: Record<string, string>;
      api?: string;
    }>;

/**
 * WSChatTransport 类的选项.
 *
 * @param UI_MESSAGE - 聊天中要使用的消息类型.
 */
export type WSChatTransportInitOptions<UI_MESSAGE extends UIMessage> = {
  /**
   * 用于聊天传输的WebSocket url.
   * 默认值为 '/api/chat'.
   */
  api?: string;

  /**
   * 要使用的 WebSocket 协议.
   */
  protocols?: string | string[];

  /**
   * 要发送的 HTTP 头.
   * 注意: 并非所有浏览器都支持在 WebSocket 连接中使用自定义头.
   */
  headers?: Resolvable<Record<string, string> | Headers>;

  /**
   * 要发送的额外 body 对象.
   * @example
   * 发送一个 `sessionId` 到 API 请求中.
   * ```js
   * useChat({
   *   body: {
   *     sessionId: '123',
   *   }
   * })
   * ```
   */
  body?: Resolvable<object>;

  /**
   * 自定义 WebSocket 实现.
   */
  WebSocket?: typeof WebSocket;

  /**
   * WebSocket 连接超时时间.
   * 默认值为 10000ms (10 秒).
   */
  connectionTimeout?: number;

  /**
   * 是否自动重连.
   * 默认值为 true.
   */
  autoReconnect?: boolean;

  /**
   * 最大重连次数.
   * 默认值为 5.
   */
  maxReconnectAttempts?: number;

  /**
   * 重连间隔时间.
   * 默认值为 1000ms (1 秒).
   */
  reconnectDelay?: number;

  /**
   * 当提供一个函数时，被用于准备聊天 API 的请求体.
   * 这可以用于根据消息和聊天中的数据自定义请求体.
   *
   * @param id 聊天 id.
   * @param messages 当前消息.
   * @param requestBody 传递给聊天请求的请求体对象.
   */
  prepareSendMessagesRequest?: PrepareWSSendMessagesRequest<UI_MESSAGE>;

  /**
   * 当提供一个函数时，被用于准备聊天 API 的请求体.
   * 场景: 根据消息和聊天中的数据自定义请求体.
   *
   * @param id 聊天 id.
   * @param messages 当前消息.
   * @param requestBody 传递给聊天请求的请求体对象.
   */
  prepareReconnectToStreamRequest?: PrepareWSReconnectToStreamRequest;
};

export abstract class WSChatTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  protected api: string;
  protected protocols?: string | string[];
  protected headers: WSChatTransportInitOptions<UI_MESSAGE>['headers'];
  protected body: WSChatTransportInitOptions<UI_MESSAGE>['body'];
  protected WebSocket: typeof WebSocket;
  protected connectionTimeout: number;
  protected autoReconnect: boolean;
  protected maxReconnectAttempts: number;
  protected reconnectDelay: number;
  protected prepareSendMessagesRequest?: PrepareWSSendMessagesRequest<UI_MESSAGE>;
  protected prepareReconnectToStreamRequest?: PrepareWSReconnectToStreamRequest;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private connectionPromise: Promise<WebSocket> | null = null;

  constructor({
    api = '/api/chat',
    protocols,
    headers,
    body,
    WebSocket: CustomWebSocket,
    connectionTimeout = 10000,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    prepareSendMessagesRequest,
    prepareReconnectToStreamRequest,
  }: WSChatTransportInitOptions<UI_MESSAGE> = {}) {
    this.api = api;
    this.protocols = protocols;
    this.headers = headers;
    this.body = body;
    this.WebSocket = CustomWebSocket || globalThis.WebSocket;
    this.connectionTimeout = connectionTimeout;
    this.autoReconnect = autoReconnect;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectDelay = reconnectDelay;
    this.prepareSendMessagesRequest = prepareSendMessagesRequest;
    this.prepareReconnectToStreamRequest = prepareReconnectToStreamRequest;
  }

  async sendMessages({
    abortSignal,
    ...options
  }: Parameters<ChatTransport<UI_MESSAGE>['sendMessages']>[0]): Promise<ReadableStream<UIMessageChunk>> {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);

    const preparedRequest = await this.prepareSendMessagesRequest?.({
      api: this.api,
      id: options.chatId,
      messages: options.messages,
      body: { ...resolvedBody, ...options.body },
      headers: { ...resolvedHeaders, ...options.headers },
      requestMetadata: options.metadata,
      trigger: options.trigger,
      messageId: options.messageId,
    });

    const api = preparedRequest?.api ?? this.api;
    const headers = preparedRequest?.headers ?? { ...resolvedHeaders, ...options.headers };
    const body = preparedRequest?.body ?? {
      ...resolvedBody,
      ...options.body,
      id: options.chatId,
      messages: options.messages,
      trigger: options.trigger,
      messageId: options.messageId,
    };

    // 创建 WebSocket 连接
    const ws = await this.connect(api);
    
    // 发送初始消息
    ws.send(JSON.stringify(body));

    // 创建 ReadableStream 消息
    return this.createMessageStream(ws, abortSignal);
  }

  async reconnectToStream(
    options: Parameters<ChatTransport<UI_MESSAGE>['reconnectToStream']>[0],
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);

    const preparedRequest = await this.prepareReconnectToStreamRequest?.({
      api: this.api,
      id: options.chatId,
      body: { ...resolvedBody, ...options.body },
      headers: { ...resolvedHeaders, ...options.headers },
      requestMetadata: options.metadata,
    });

    const api = preparedRequest?.api ?? `${this.api}/${options.chatId}/stream`;
    const headers = preparedRequest?.headers ?? { ...resolvedHeaders, ...options.headers };

    const body = {
      ...resolvedBody,
      ...options.body,
      id: options.chatId,
      action: 'reconnect',
    };

    try {
      const ws = await this.connect(api);
      ws.send(JSON.stringify(body));
      return this.createMessageStream(ws);
    } catch (error) {
      // 如果重连失败，返回 null 表示没有活跃的 stream
      return null;
    }
  }

  private async connect(api?: string): Promise<WebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.createConnection(api);
    
    try {
      const ws = await this.connectionPromise;
      this.isConnecting = false;
      this.connectionPromise = null;
      return ws;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  private createConnection(api?: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`WebSocket 连接超时: ${this.connectionTimeout}ms`));
      }, this.connectionTimeout);

      try {
        const ws = new this.WebSocket(api || this.api, this.protocols);
        
        ws.onopen = () => {
          clearTimeout(timeoutId);
          this.ws = ws;
          this.reconnectAttempts = 0;
          resolve(ws);
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          reject(new Error(`WebSocket 连接失败: ${error}`));
        };

        ws.onclose = (event) => {
          this.ws = null;
          
          if (this.autoReconnect && !event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect().catch(() => {
                // 静默失败重连
              });
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private createMessageStream(
    ws: WebSocket,
    abortSignal?: AbortSignal,
  ): ReadableStream<UIMessageChunk> {
    // Create a ReadableStream from WebSocket messages
    const wsStream = new ReadableStream<UIMessageChunk>({
      start: (controller) => {
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            controller.enqueue(data);
          } catch (error) {
            controller.error(error);
          }
        };

        const errorHandler = (event: Event) => {
          controller.error(new Error(`WebSocket error: ${event}`));
        };

        const closeHandler = () => {
          controller.close();
        };

        ws.addEventListener('message', messageHandler);
        ws.addEventListener('error', errorHandler);
        ws.addEventListener('close', closeHandler);

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            ws.close();
            controller.error(new Error('Request aborted'));
          });
        }

        // Return cleanup function
        return () => {
          ws.removeEventListener('message', messageHandler);
          ws.removeEventListener('error', errorHandler);
          ws.removeEventListener('close', closeHandler);
        };
      },
    });

    // Process the stream using the abstract method
    return this.processResponseStream(wsStream);
  }

  /**
   * Manually close the WebSocket connection.
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get the current connection state.
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  protected abstract processResponseStream(
    stream: ReadableStream<UIMessageChunk>,
  ): ReadableStream<UIMessageChunk>;
}
