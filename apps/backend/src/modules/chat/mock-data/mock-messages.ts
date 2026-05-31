import { EventType } from "@ag-ui/core";
import { topology, topology2 } from "./index";

export { multiAgentMessages } from './mock-multi-agent-messages';

export const stepEventMessages = [
  // 智能体A 发言（start-step）
  {
    type: "start-step",
    stepName: '读取文件'
  },
  {
    type: "finish-step",
    stepName: '读取文件'
  },
  {
    type: "start-step",
    stepName: '开始思考'
  },
  // 智能体A 发言（thinking）
  {
    type: "thinking",
    // messageId: "msg-a0",
    role: "assistant",
    name: "智能体A",
    text: "好的，我现在需要帮用户分析他们提出的Node.js结合腾讯云是否能满足他们的需求。首先，我要仔细理解用户的场景和要求。用户提到的是初期使用两台4核8GB的服务器，支持大约8万在线设备，每秒处理2000 TPS的消息收发。当达到瓶颈时，可以通过横向扩容或升级服务器配置来扩展。他们考虑用Node.js作为后端，并询问是否可行。首先，我得评估Node.js在这种高并发场景下的表现。Node.js基于事件循环和非阻塞I/O，适合处理大量并发连接，但单线程模型可能在CPU密集型任务上成为瓶颈。不过，用户的场景主要是IO密集型，比如网络通信，所以Node.js应该能胜任。",
  },
  {
    type: "thinking",
    // messageId: "msg-a0",
    role: "assistant",
    name: "智能体B",
    text: "好的，我现在需要帮用户分析他们提出的Node.js结合腾讯云是否能满足他们的需求。首先，我要仔细理解用户的场景和要求。用户提到的是初期使用两台4核8GB的服务器，支持大约8万在线设备，每秒处理2000 TPS的消息收发。当达到瓶颈时，可以通过横向扩容或升级服务器配置来扩展。他们考虑用Node.js作为后端，并询问是否可行。首先，我得评估Node.js在这种高并发场景下的表现。Node.js基于事件循环和非阻塞I/O，适合处理大量并发连接，但单线程模型可能在CPU密集型任务上成为瓶颈。不过，用户的场景主要是IO密集型，比如网络通信，所以Node.js应该能胜任。",
  },
  {
    type: "finish-step",
    stepName: '开始思考'
  },
  {
    type: "start-step",
    stepName: '开始文本'
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
  {
    type: "finish-step",
    stepName: '开始文本'
  },
  // 智能体A 的 toolCall（异步 output，默认）
  {
    type: "toolCall",
    toolCallId: "tool-call-1",
    toolCallName: "search-data",
    role: "assistant",
    name: "智能体A",
    args: { query: "什么是 Agent,a的1数据" },
    output: {
      data:
        "指智能代理，是一种能够自主感知环境、做出决策并执行动作的软件实体或程序。它的核心特点是自主性（无需持续人工干预）、反应性（能响应环境变化）、主动性（可主动完成目标）。",
      type: 'text',
    },
    syncOutput: false, // 默认 false，可省略
    outputDelay: [300, 900], // 可指定结果延迟范围
  },
  {
    type: "toolCall",
    toolCallId: "tool-call-2",
    toolCallName: "process-data",
    role: "assistant",
    name: "智能体A",
    args: { data: "A的2数据" },
    output: {
      data: JSON.stringify(topology),
      type: '我是类型: topology, 根据我判断当前 toolCall 结果用什么组件展示',
    },
    syncOutput: true, // 同步输出 result（紧跟 END 后）
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
    output: {
      data: JSON.stringify(topology),
      type: '我是类型: topology, 根据我判断当前 toolCall 结果用什么组件展示',
    },
    syncOutput: true, // 同步输出 result（紧跟 END 后）
  },

  // 智能体B2 意图识别
  {
    type: EventType.CUSTOM,
    typeName: 'intent',
    role: "assistant",
    name: "智能体B",
    text: '意图识别失败',
  },

  // 智能体A 再次发言（另一个 messageId）
  {
    type: "text",
    messageId: "msg-a2",
    role: "assistant",
    name: "智能体A",
    text: "好的，现在我会对返回的数据进行详细分析，这可能需要调用 analyze-data 工具。",
  },
  // NOTE: 以下事件用于测试后端推流抛错
  // {
  //   type: EventType.RUN_ERROR,
  //   messageId: "msg-a2",
  //   role: "assistant",
  //   name: "智能体A",
  //   text: "运行出错：工具调用 analyze-data 失败",
  // },
  {
    type: "toolCall",
    toolCallId: "tool-call-a2",
    toolCallName: "analyze-data",
    role: "assistant",
    name: "智能体A",
    args: { id: 42 },
    output: {
      data: "分析完成：一切正常",
      type: 'text',
    },
    syncOutput: false,
    outputDelay: [1200, 2800],
  },
  // {
  //   type: EventType.CUSTOM,
  //   typeName: 'topology',
  //   messageId: "msg-a2",
  //   role: "assistant",
  //   name: "智能体A",
  //   text: JSON.stringify(topology),
  // },

  // 智能体C / D / E（并发样例，如果需要并发，请在 createUIMessageStream 中设置 mode: 'concurrent'）
  {
    type: "text",
    messageId: "msg-c1",
    role: "assistant",
    name: "智能体C",
    text: `
大家好，我是智能体C，我会展示数学公式插件 @mdit/plugin-katex 的效果……

$\\frac{a}{b} = c$

    `,
  },
  {
    type: "text",
    messageId: "msg-d1",
    role: "assistant",
    name: "智能体D",
    text: `
大家好，我是智能体D，我也在输出一些代码块...

#  JavaScript
\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

#  Python
\`\`\`python
def add(a, b):
  return a + b
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
  //   {
  //     type: "text",
  //     messageId: "msg-d1",
  //     role: "assistant",
  //     name: "智能体D",
  //     text: `
  // 大家好，我是智能体D，我也在输出一些 Mermaid 插件的渲染效果...

  // # Flow Chart
  // \`\`\`mermaid
  // flowchart LR
  // A[Hard] -->|Text| B(Round)
  // B --> C{Decision}
  // C -->|One| D[Result 1]
  // C -->|Two| E[Result 2]
  // \`\`\`

  // # Class Diagram
  // \`\`\`mermaid
  // classDiagram
  // Class01 <|-- AveryLongClass : Cool
  // <<Interface>> Class01
  // Class09 --> C2 : Where am I?
  // Class09 --* C3
  // Class09 --|> Class07
  // Class07 : equals()
  // Class07 : Object[] elementData
  // Class01 : size()
  // Class01 : int chimp
  // Class01 : int gorilla
  // class Class10 {
  // <<service>>
  // int id
  // size()
  // }
  // \`\`\`

  // # State Diagram
  // \`\`\`mermaid
  // stateDiagram-v2
  // [*] --> Still
  // Still --> [*]
  // Still --> Moving
  // Moving --> Still
  // Moving --> Crash
  // Crash --> [*]
  // \`\`\`
  //     `,
  //   },
  //   {
  //     type: "text",
  //     messageId: "msg-e1",
  //     role: "assistant",
  //     name: "智能体E",
  //     text: `
  // 好的，我会继续展示 plantuml 插件的效果。

  // @startuml
  // Alice -> "Bob()" : Hello
  // "Bob()" -> "This is very long" as Long
  // ' You can also declare:
  // ' "Bob()" -> Long as "This is very long"
  // Long --> "Bob()" : ok
  // @enduml
  // `,
  //   },

  // {
  //   type: EventType.CUSTOM,
  //   typeName: 'AUTO_RUN_NEXT_AGENT',
  //   messageId: "msg-g1",
  //   role: "assistant",
  //   name: "智能体C",
  //   text: {
  //     "next_agent_name": "Analyse_Agent", // 下一个智能体名称
  //     "query": "", // 静默发送的query消息
  //   },
  // }

  // 可直接插入结束事件
  // {
  //   type: "events",
  //   events: [
  //     { type: "RUN_FINISHED", threadId: "thread-1", runId: "run-1" },
  //   ],
  // },
];