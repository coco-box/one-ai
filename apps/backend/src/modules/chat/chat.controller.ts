import { Request, Response } from "express";
import { success, created, serverError } from "../../utils/response";
import { ChatService } from "./chat.service";
import { VercelAISDKAgent } from "./chat.agent";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createUIMessageStream, createTextMessageEvents, createEventStringStream } from "../../utils";
import { createUIMessageWsStream } from "../../utils/create-ui-message-ws-stream";
import { EventType } from "@ag-ui/core";
import { WebSocket } from "ws";
import { topology, topology2 } from "./mock-data";
import { stepEventMessages, multiAgentMessages } from "./mock-data/mock-messages";

const chatService = new ChatService();

// 创建 VercelAISDKAgent 实例
const deepSeekModel = createDeepSeek({
  apiKey: "sk-613ae6d6a60749c8b1bf20e52898c7bb",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const vercelAgent = new VercelAISDKAgent({
  model: deepSeekModel("deepseek-v3"),
  maxSteps: 5,
  toolChoice: "auto",
});

// 模拟消息
const mockMessages = multiAgentMessages;

export class ChatController {
  public getChat(req: Request, res: Response) {
    try {
      const { id } = req.query;
      const data = chatService.getChatData(id as string);
      success(res, "Chat data retrieved successfully", data);
    } catch (error: any) {
      serverError(res, error.message);
    }
  }

  public createChat(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const data = chatService.createChatMessage(message);
      created(res, "Chat message created successfully", data);
    } catch (error: any) {
      serverError(res, error.message);
    }
  }

  // 原有的 SSE 接口，保持兼容性
  public async streamChat(req: Request, res: Response) {
    try {
      // 解析并验证请求体
      const input = chatService.validateInput(req.body);

      // 设置 SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // 创建事件 encoder
      const encoder = chatService.createEncoder();

      // 发送 started 事件
      const runStarted = chatService.createRunStartedEvent(
        input.threadId,
        input.runId
      );
      res.write(encoder.encode(runStarted));

      // 处理消息
      const messages = chatService.processMessages(input.messages);

      // 生成消息 ID
      const messageId = chatService.generateMessageId();

      // 发送 '文本消息开始' 事件
      const textMessageStart =
        chatService.createTextMessageStartEvent(messageId);
      res.write(encoder.encode(textMessageStart));

      // 创建流式传输完成请求
      const stream = await chatService.createTextStream(messages);

      for await (const textPart of stream.textStream) {
        const textMessageContent = chatService.createTextMessageContentEvent(
          messageId,
          textPart
        );
        res.write(encoder.encode(textMessageContent));
      }

      // 发送 '文本消息结束' 事件
      const textMessageEnd = chatService.createTextMessageEndEvent(messageId);
      res.write(encoder.encode(textMessageEnd));

      // 发送 finished 事件
      const runFinished = chatService.createRunFinishedEvent(
        input.threadId,
        input.runId
      );
      res.write(encoder.encode(runFinished));

      // 结束响应
      res.end();
    } catch (error: any) {
      console.log(error);
      res.status(422).json({ error: error.message });
    }
  }

  public async streamMockChat(req: Request, res: Response) {
    // 测试请求业务错误码的示例: 临时拦截：skill 上传期间禁止对话
    // res.status(200).json({
    //   code: 500,
    //   message: "当前 skill 正在上传，无法对话。",
    //   data: null,
    // });
    // return;

    // SSE 响应头
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 构造消息数组（示例）
    const messages = mockMessages;

    // 创建 stream（示例：顺序模式）
    const { stream, addEvent, stop } = createUIMessageStream(messages, {
      mode: "concurrent", // 'sequential' | 'concurrent'
      chunkSize: [2, 5],
      chunkDelay: [10, 50],
      messageDelay: 50,
      defaultToolOutputDelay: [600, 1600],
      runMetadata: { threadId: "thread-1", runId: "run-1" },
      eventNames: {
        runStarted: EventType.RUN_STARTED,
        runFinished: EventType.RUN_FINISHED,
        runError: EventType.RUN_ERROR,
      },
    });
    // note: 方便测试后端数据在前端展示问题, 直接复制浏览器 dev tool 中打印的 sse 事件到这里
//     const input = String.raw`
// data:{"type": "RUN_STARTED", "timestamp": 1760418918, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "thread_id": "c2e329cca40c4030b61da65923f059de", "run_id": "chaos_search_report_file_agent00"}

// data:{"type": "TOOL_CALL_START", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "tool_call_id": "call_0d451f4de1fd453e8ee7b6", "tool_call_name": "query_inspect_report_status", "parent_message_id": ""}

// data:{"type": "TOOL_CALL_ARGS", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "tool_call_id": "call_0d451f4de1fd453e8ee7b6", "delta": "{\"tenantId\": \"102a2ad43b176e16dc653ef7931c8d34\", \"chatId\": \"zzxxxccvvbbnnmm\", \"content\": \"fineract\u4ea4\u6613\u7cfb\u7edf-\u590d\u5236\", \"reportType\": \"appReportStatus\"}"}

// data:{"type": "TOOL_CALL_END", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "tool_call_id": "call_0d451f4de1fd453e8ee7b6"}

// data:{"type": "TOOL_CALL_RESULT", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "message_id": "", "tool_call_id": "call_0d451f4de1fd453e8ee7b6", "content": "{\"data\": \"\\u67e5\\u8be2\\u6267\\u884c\\u72b6\\u6001\\u5f02\\u5e38 'NoneType' object is not subscriptable\"}", "role": null}

// data:{"type": "CUSTOM", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "name": "AUTO_RUN_NEXT_AGENT", "value": {"next_agent_name": "chaos_search_report_file_agent", "query": "\u7ee7\u7eed"}}

// data:{"type": "RUN_FINISHED", "timestamp": 1760418925, "raw_event": {"name": "chaos_search_report_file_agent", "raw_event_data": null}, "thread_id": "c2e329cca40c4030b61da65923f059de", "run_id": "chaos_search_report_file_agent00", "result": null}
//     `;
//     const { stream, addEvent, stop } = createEventStringStream(input, {
//       mode: "sequential", // 'sequential' | 'concurrent'
//       lineDelay: [50, 200],     // 每个事件之间的随机延迟（毫秒）
//       autoClose: true           // 推送完成后自动关闭流
//     });

    // 当客户端断开连接时，清理定时器并停止流
    res.on("close", () => {
      stop();
    });

    // pipe 到响应
    stream.pipe(res);
  }

  // WebSocket 版本的模拟聊天接口
  public async wsMockChat(ws: WebSocket, req: Request) {
    console.log("wsMockChat req", req);
    try {
      // 构造消息数组（示例）- 与 streamMockChat 中的消息数据保持一致
      const messages = mockMessages;

      // 创建 WebSocket 消息流
      const { addEvent, stop } = createUIMessageWsStream(messages, ws, {
        mode: "concurrent", // 'sequential' | 'concurrent'
        chunkSize: [1, 2],
        chunkDelay: [50, 200],
        messageDelay: 150,
        defaultToolOutputDelay: [600, 1600],
        runMetadata: { threadId: "thread-1", runId: "run-1" },
        eventNames: {
          runStarted: EventType.RUN_STARTED,
          runFinished: EventType.RUN_FINISHED,
        },
      });

      // 处理客户端消息
      ws.on("message", (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          console.log("Received message:", data);

          // 这里可以处理客户端发来的消息，例如新的聊天请求
          // 如果需要，可以调用 addEvent 来发送新的事件
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });

      // 处理WebSocket错误
      ws.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
        stop();
      });
    } catch (error: any) {
      console.error("wsMockChat error:", error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", error: error.message }));
      }
    }
  }

  // 新的基于 VercelAISDKAgent 的接口
  public async agentChat(req: Request, res: Response) {
    try {
      // 解析并验证请求体
      const input = chatService.validateInput(req.body);

      // 设置 SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // 创建事件 encoder
      const encoder = chatService.createEncoder();

      // 运行 VercelAISDKAgent
      const eventStream = (vercelAgent as any).run(input);

      // 订阅事件流并发送给客户端
      eventStream.subscribe({
        next: (event: any) => {
          res.write(encoder.encode(event));
        },
        error: (error: any) => {
          console.error("Agent execution error:", error);
          res.status(500).json({ error: error.message });
        },
        complete: () => {
          res.end();
        },
      });
    } catch (error: any) {
      console.log("Controller error:", error);
      res.status(422).json({ error: error.message });
    }
  }
}
