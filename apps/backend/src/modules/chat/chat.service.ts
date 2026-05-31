import {
  RunAgentInputSchema,
  RunAgentInput,
  EventType,
  Message,
} from "@ag-ui/core";
import { EventEncoder } from "@ag-ui/encoder";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { createUIMessageWsStream } from "../../utils/create-ui-message-ws-stream";

export class ChatService {
  private deepSeek: any;
  private activeIntervals: Record<string, NodeJS.Timeout> = {};

  constructor() {
    // 配置阿里云百炼大模型
    this.deepSeek = createDeepSeek({
      apiKey: "sk-613ae6d6a60749c8b1bf20e52898c7bb",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    this.activeIntervals = {};
  }

  public getChatData(id: string) {
    return {
      message: `This is chat data for id: ${id}`,
      timestamp: new Date(),
    };
  }

  public createChatMessage(message: string) {
    return {
      message: `Created new message: ${message}`,
      status: "success",
      timestamp: new Date(),
    };
  }

  public validateInput(body: any): RunAgentInput {
    return RunAgentInputSchema.parse(body);
  }

  public processMessages(
    messages: Message[]
  ): Array<{ role: "user" | "system" | "assistant"; content: string }> {
    return messages
      .filter((msg: Message) =>
        ["user", "system", "assistant"].includes(msg.role)
      )
      .map((msg: Message) => ({
        role: msg.role as "user" | "system" | "assistant",
        content: msg.content || "",
      }));
  }

  public generateMessageId(): string {
    return uuidv4();
  }

  public createEncoder(): EventEncoder {
    return new EventEncoder();
  }

  public async createTextStream(
    messages: Array<{ role: "user" | "system" | "assistant"; content: string }>
  ) {
    const stream = streamText({
      model: this.deepSeek("deepseek-v3"),
      messages,
    });
    return stream;
  }

  public createRunStartedEvent(threadId: string, runId: string) {
    return {
      type: EventType.RUN_STARTED,
      threadId,
      runId,
    };
  }

  public createTextMessageStartEvent(messageId: string) {
    return {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "assistant",
    };
  }

  public createTextMessageContentEvent(messageId: string, delta: string) {
    return {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta,
    };
  }

  public createTextMessageEndEvent(messageId: string) {
    return {
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    };
  }

  public createRunFinishedEvent(threadId: string, runId: string) {
    return {
      type: EventType.RUN_FINISHED,
      threadId,
      runId,
    };
  }

  /**
   * 处理 WebSocket 对话连接
   * @param {object} ws - WebSocket client instance
   * @param {string} sessionId
   */
  public handleWebSocketConnection(ws: WebSocket, sessionId: string) {
    console.log(`WebSocket connection established for session: ${sessionId}`);

    ws.on("message", (message) => {
      const messageString = message.toString();

      // 处理来自客户端的心跳 ping
      if (messageString === "ping") {
        ws.send("pong");
        return;
      }

      // 如果此会话已有正在运行的流程，先清除它
      if (this.activeIntervals[sessionId]) {
        clearInterval(this.activeIntervals[sessionId]);
        delete this.activeIntervals[sessionId];
      }

      // 收到客户端任何其他消息时，启动数据流
      console.log(
        `Received trigger message from client for session ${sessionId}:`,
        messageString
      );

      // 构造消息数组（示例）- 与 streamMockChat 中的消息数据保持一致
      const messages = [
        // 智能体A 发言（thinking）
        {
          type: "thinking",
          messageId: "msg-a0",
          role: "assistant",
          name: "智能体A",
          text: "好的，我现在需要帮用户分析他们提出的Node.js结合腾讯云是否能满足他们的需求。首先，我要仔细理解用户的场景和要求。用户提到的是初期使用两台4核8GB的服务器，支持大约8万在线设备，每秒处理2000 TPS的消息收发。当达到瓶颈时，可以通过横向扩容或升级服务器配置来扩展。他们考虑用Node.js作为后端，并询问是否可行。首先，我得评估Node.js在这种高并发场景下的表现。Node.js基于事件循环和非阻塞I/O，适合处理大量并发连接，但单线程模型可能在CPU密集型任务上成为瓶颈。不过，用户的场景主要是IO密集型，比如网络通信，所以Node.js应该能胜任。",
        },
        // 智能体A 发言（text）
        {
          type: "text",
          messageId: "msg-a1",
          role: "assistant",
          name: "智能体A",
          text: "我现在正在调用 search-data 工具，请稍等，我会在查到数据后继续回答你……",
          // 可在单条消息上覆盖默认 chunkSize / chunkDelay
          // chunkSize: [1,3],
          // chunkDelay: [40,120],
        },
        // 智能体A 的 toolCall（异步 output，默认）
        {
          type: "toolCall",
          toolCallId: "tool-call-1",
          toolCallName: "search-data",
          role: "assistant",
          name: "智能体A",
          args: { query: "什么是 Agent" },
          output: {
            result:
              "指智能代理，是一种能够自主感知环境、做出决策并执行动作的软件实体或程序。它的核心特点是自主性（无需持续人工干预）、反应性（能响应环境变化）、主动性（可主动完成目标）。",
          },
          syncOutput: false, // 默认 false，可省略
          outputDelay: [300, 900], // 可指定结果延迟范围
        },
        // 智能体B 发言 + toolCall（同步返回）
        {
          type: "text",
          messageId: "msg-b1",
          role: "assistant",
          name: "智能体B",
          text: "我会帮你处理一下刚才的数据。",
        },
        {
          type: "toolCall",
          toolCallId: "tool-call-b1",
          toolCallName: "process-data",
          role: "assistant",
          name: "智能体B",
          args: { data: "B的数据" },
          output: { result: "B处理完成！" },
          syncOutput: true, // 同步输出 result（紧跟 END 后）
        },

        // 智能体A 再次发言（另一个 messageId）
        {
          type: "text",
          messageId: "msg-a2",
          role: "assistant",
          name: "智能体A",
          text: "好的，现在我会对返回的数据进行详细分析，这可能需要调用 analyze-data 工具。",
        },
        {
          type: "toolCall",
          toolCallId: "tool-call-a2",
          toolCallName: "analyze-data",
          role: "assistant",
          name: "智能体A",
          args: { id: 42 },
          output: { result: "分析完成：一切正常" },
          syncOutput: false,
          outputDelay: [1200, 2800],
        },

        // 智能体C / D（并发样例，如果需要并发，请在 createUIMessageStream 中设置 mode: 'concurrent'）
        {
          type: "text",
          messageId: "msg-c1",
          role: "assistant",
          name: "智能体C",
          text: `
大家好，我是智能体C，我会展示数学公式插件 @mdit/plugin-katex 的效果……

$\frac{a}{b} = c$

        `,
        },
        {
          type: "text",
          messageId: "msg-d1",
          role: "assistant",
          name: "智能体D",
          text: `
大家好，我是智能体D，我也在输出一些 Mermaid 插件的渲染效果...

# Flow Chart
\`\`\`mermaid
flowchart LR
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
\`\`\`

# Class Diagram
\`\`\`mermaid
classDiagram
Class01 <|-- AveryLongClass : Cool
<<Interface>> Class01
Class09 --> C2 : Where am I?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
class Class10 {
  <<service>>
  int id
  size()
}
\`\`\`

# State Diagram
\`\`\`mermaid
stateDiagram-v2
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]
\`\`\`
        `,
        },
        {
          type: "text",
          messageId: "msg-e1",
          role: "assistant",
          name: "智能体E",
          text: `
好的，我会继续展示 plantuml 插件的效果。

@startuml
Alice -> "Bob()" : Hello
"Bob()" -> "This is very long" as Long
' You can also declare:
' "Bob()" -> Long as "This is very long"
Long --> "Bob()" : ok
@enduml
`,
        },

        // 可直接插入结束事件
        // {
        //   type: "events",
        //   events: [
        //     { type: "RUN_FINISHED", threadId: "thread-1", runId: "run-1" },
        //   ],
        // },
      ];

      // 创建 WebSocket 消息流
      const { addEvent, stop } = createUIMessageWsStream(messages, ws, {
        mode: "concurrent", // 'sequential' | 'concurrent'
        chunkSize: [2, 5],
        chunkDelay: [50, 200],
        messageDelay: 150,
        defaultToolOutputDelay: [600, 1600],
        runMetadata: { threadId: "thread-1", runId: "run-1" },
        eventNames: {
          runStarted: EventType.RUN_STARTED,
          runFinished: EventType.RUN_FINISHED,
        },
      });
    });

    ws.on("close", () => {
      console.log(`WebSocket connection closed for session: ${sessionId}`);
      // 连接关闭时也清理 interval
      if (this.activeIntervals[sessionId]) {
        clearInterval(this.activeIntervals[sessionId]);
        delete this.activeIntervals[sessionId];
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
    });
  }
}
