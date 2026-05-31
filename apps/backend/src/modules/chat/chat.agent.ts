import {
  AgentConfig,
  AbstractAgent,
  EventType,
  BaseEvent,
  Message,
  AssistantMessage,
  RunAgentInput,
  MessagesSnapshotEvent,
  RunFinishedEvent,
  RunStartedEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallStartEvent,
  ToolCall,
  ToolMessage,
  ToolCallResultEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
} from "@ag-ui/client";
import { Observable } from "rxjs";
import {
  CoreMessage,
  LanguageModelV1,
  processDataStream,
  streamText,
  tool as createVercelAISDKTool,
  ToolChoice,
  ToolSet,
} from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";

type ProcessedEvent =
  | MessagesSnapshotEvent
  | RunFinishedEvent
  | RunStartedEvent
  | TextMessageStartEvent
  | TextMessageEndEvent
  | TextMessageContentEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallStartEvent
  | ToolCallResultEvent;

interface VercelAISDKAgentConfig extends AgentConfig {
  model: LanguageModelV1;
  maxSteps?: number;
  toolChoice?: ToolChoice<Record<string, unknown>>;
}

export class VercelAISDKAgent extends AbstractAgent {
  model: LanguageModelV1;
  maxSteps: number;
  toolChoice: ToolChoice<Record<string, unknown>>;
  constructor({ model, maxSteps, toolChoice, ...rest }: VercelAISDKAgentConfig) {
    super({ ...rest });
    this.model = model;
    this.maxSteps = maxSteps ?? 1;
    this.toolChoice = toolChoice ?? "auto";
  }

  protected run(input: RunAgentInput): Observable<BaseEvent> {
    const finalMessages: Message[] = input.messages;

    return new Observable<ProcessedEvent>((subscriber) => {
      subscriber.next({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      } as RunStartedEvent);

      const response = streamText({
        model: this.model,
        messages: convertMessagesToVercelAISDKMessages(input.messages),
        tools: convertToolToVerlAISDKTools(input.tools),
        maxSteps: this.maxSteps,
        toolChoice: this.toolChoice,
      });

      let messageId = randomUUID();
      let assistantMessage: AssistantMessage = {
        id: messageId,
        role: "assistant",
        content: "",
        toolCalls: [],
      };
      finalMessages.push(assistantMessage);

      processDataStream({
        stream: response.toDataStreamResponse().body!,
        onTextPart: (text) => {
          if (!assistantMessage.content) {
            const event: TextMessageStartEvent = {
              type: EventType.TEXT_MESSAGE_START,
              messageId,
              role: "assistant",
            };
            subscriber.next(event);
          }
          assistantMessage.content += text;
          const event: TextMessageContentEvent = {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: text,
          };
          subscriber.next(event);
        },
        onFinishMessagePart: () => {
          shouldEmitTextMessageEnd(assistantMessage, subscriber);
          // Emit message snapshot
          const event: MessagesSnapshotEvent = {
            type: EventType.MESSAGES_SNAPSHOT,
            messages: finalMessages,
          };
          subscriber.next(event);

          // Emit run finished event
          subscriber.next({
            type: EventType.RUN_FINISHED,
            threadId: input.threadId,
            runId: input.runId,
          } as RunFinishedEvent);

          // Complete the observable
          subscriber.complete();
        },
        onToolCallPart(streamPart) {
          shouldEmitTextMessageEnd(assistantMessage, subscriber);
          let toolCall: ToolCall = {
            id: streamPart.toolCallId,
            type: "function",
            function: {
              name: streamPart.toolName,
              arguments: JSON.stringify(streamPart.args),
            },
          };
          assistantMessage.toolCalls!.push(toolCall);

          const startEvent: ToolCallStartEvent = {
            type: EventType.TOOL_CALL_START,
            parentMessageId: messageId,
            toolCallId: streamPart.toolCallId,
            toolCallName: streamPart.toolName,
          };
          subscriber.next(startEvent);

          const argsEvent: ToolCallArgsEvent = {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: streamPart.toolCallId,
            delta: JSON.stringify(streamPart.args),
          };
          subscriber.next(argsEvent);

          const endEvent: ToolCallEndEvent = {
            type: EventType.TOOL_CALL_END,
            toolCallId: streamPart.toolCallId,
          };
          subscriber.next(endEvent);
        },
        onToolResultPart(streamPart) {
          shouldEmitTextMessageEnd(assistantMessage, subscriber);
          // const toolMessage: ToolMessage = {
          //   role: "tool",
          //   id: randomUUID(),
          //   toolCallId: streamPart.toolCallId,
          //   content: JSON.stringify(streamPart.result),
          // };
          // finalMessages.push(toolMessage);
          const toolCallResultEvent: ToolCallResultEvent = {
            type: EventType.TOOL_CALL_RESULT,
            toolCallId: streamPart.toolCallId,
            content: JSON.stringify(streamPart.result),
            messageId: messageId,
            role: "tool",
          };
          subscriber.next(toolCallResultEvent);
        },
        onErrorPart(streamPart) {
          subscriber.error(streamPart);
        },
      }).catch((error) => {
        console.error("catch error", error);
        // Handle error
        subscriber.error(error);
      });

      return () => {};
    });
  }
}

export function convertMessagesToVercelAISDKMessages(messages: Message[]): CoreMessage[] {
  const result: CoreMessage[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      const parts: any[] = message.content ? [{ type: "text", text: message.content }] : [];
      for (const toolCall of message.toolCalls ?? []) {
        parts.push({
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments),
        });
      }
      result.push({
        role: "assistant",
        content: parts,
      });
    } else if (message.role === "user") {
      result.push({
        role: "user",
        content: message.content || "",
      });
    } else if (message.role === "tool") {
      let toolName = "unknown";
      for (const msg of messages) {
        if (msg.role === "assistant") {
          for (const toolCall of msg.toolCalls ?? []) {
            if (toolCall.id === message.toolCallId) {
              toolName = toolCall.function.name;
              break;
            }
          }
        }
      }
      result.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: message.toolCallId,
            toolName: toolName,
            result: message.content,
          },
        ],
      });
    }
  }

  return result;
}

export function convertJsonSchemaToZodSchema(jsonSchema: any, required: boolean): z.ZodSchema {
  if (jsonSchema.type === "object") {
    const spec: { [key: string]: z.ZodSchema } = {};

    if (!jsonSchema.properties || !Object.keys(jsonSchema.properties).length) {
      return !required ? z.object(spec).optional() : z.object(spec);
    }

    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      spec[key] = convertJsonSchemaToZodSchema(
        value,
        jsonSchema.required ? jsonSchema.required.includes(key) : false,
      );
    }
    let schema = z.object(spec).describe(jsonSchema.description);
    return required ? schema : schema.optional();
  } else if (jsonSchema.type === "string") {
    let schema = z.string().describe(jsonSchema.description);
    return required ? schema : schema.optional();
  } else if (jsonSchema.type === "number") {
    let schema = z.number().describe(jsonSchema.description);
    return required ? schema : schema.optional();
  } else if (jsonSchema.type === "boolean") {
    let schema = z.boolean().describe(jsonSchema.description);
    return required ? schema : schema.optional();
  } else if (jsonSchema.type === "array") {
    let itemSchema = convertJsonSchemaToZodSchema(jsonSchema.items, true);
    let schema = z.array(itemSchema).describe(jsonSchema.description);
    return required ? schema : schema.optional();
  }
  throw new Error("Invalid JSON schema");
}

export function convertToolToVerlAISDKTools(tools: RunAgentInput["tools"]): ToolSet {
  // 如果没有传递工具或工具为空，使用内置工具
  const finalTools = tools && tools.length > 0 ? tools : getBuiltinTools();
  
  return finalTools.reduce(
    (acc: ToolSet, tool: RunAgentInput["tools"][number]) => ({
      ...acc,
      [tool.name]: createVercelAISDKTool({
        description: tool.description,
        parameters: convertJsonSchemaToZodSchema(tool.parameters, true),
        execute: async (args: any) => {
          return await executeToolFunction(tool.name, args);
        },
      }),
    }),
    {},
  );
}

// 内置工具定义
function getBuiltinTools(): RunAgentInput["tools"] {
  return [
    {
      name: "calculator",
      description: "执行数学计算",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "要计算的数学表达式，例如：'2 + 3 * 4'"
          }
        },
        required: ["expression"]
      }
    },
    {
      name: "weather_query",
      description: "查询指定城市的天气信息",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "城市名称，例如：'北京'"
          }
        },
        required: ["city"]
      }
    }
  ];
}

// 工具执行函数
async function executeToolFunction(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case "calculator":
      return calculateExpression(args.expression);
    
    case "weather_query":
      return queryWeather(args.city);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// 计算器工具实现
function calculateExpression(expression: string): any {
  try {
    // 简单的数学表达式计算（生产环境建议使用更安全的计算库）
    const result = Function(`"use strict"; return (${expression})`)();
    return {
      success: true,
      expression,
      result,
      message: `计算结果：${expression} = ${result}`
    };
  } catch (error) {
    return {
      success: false,
      expression,
      error: "计算表达式无效",
      message: `无法计算表达式：${expression}`
    };
  }
}

// 天气查询工具实现
async function queryWeather(city: string): Promise<any> {
  // 模拟天气查询（实际项目中应该调用真实的天气API）
  const mockWeatherData = {
    "北京": { temperature: "15°C", condition: "晴朗", humidity: "45%" },
    "上海": { temperature: "18°C", condition: "多云", humidity: "60%" },
    "广州": { temperature: "25°C", condition: "小雨", humidity: "80%" },
    "深圳": { temperature: "24°C", condition: "阴天", humidity: "70%" }
  };

  const weather = mockWeatherData[city as keyof typeof mockWeatherData] || {
    temperature: "未知",
    condition: "数据不可用", 
    humidity: "未知"
  };

  return {
    success: true,
    city,
    weather,
    message: `${city}当前天气：${weather.condition}，温度${weather.temperature}，湿度${weather.humidity}`
  };
}

function shouldEmitTextMessageEnd(message: Message, subscriber: any): void {
  if (message.role === "assistant" && message.content && message.content.length > 0) {
    const event: TextMessageEndEvent = {
      type: EventType.TEXT_MESSAGE_END,
      messageId: message.id,
    };
    subscriber.next(event);
  }
}