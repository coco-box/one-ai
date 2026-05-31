// create-ui-message-ws-stream.ts
import { WebSocket } from 'ws';
import { EventType } from "@ag-ui/core";

type Mode = "sequential" | "concurrent";

interface UIStreamConfig {
  mode?: Mode;
  chunkSize?: [number, number];
  chunkDelay?: [number, number];
  messageDelay?: number;
  defaultToolOutputDelay?: [number, number];
  emitRunEvents?: boolean; // 是否自动发 RUN_STARTED / RUN_FINISHED，默认 true
  runMetadata?: Record<string, any>; // e.g. { threadId: 'thread-1', runId: 'run-1' }
  eventNames?: { runStarted?: string; runFinished?: string }; // 可映射到你的 EventType 常量
}

/**
 * createUIMessageWsStream
 * - messages: 数组，每项支持三种形式：
 *   * { type: 'text', messageId, name, role, text, chunkSize?, chunkDelay? }
 *   * { type: 'toolCall', toolCallId, toolCallName, args, output?, syncOutput?, outputDelay?, chunkSize?, chunkDelay? }
 *   * { type: 'events', events: Array<any> } // 直接原样推事件数组
 * - ws: WebSocket 实例
 *
 * 返回 { addEvent, stop }
 */
export function createUIMessageWsStream(
  messages: any[],
  ws: WebSocket,
  config: UIStreamConfig = {}
) {
  const {
    mode = "sequential",
    chunkSize = [2, 5],
    chunkDelay = [60, 160],
    messageDelay = 200,
    defaultToolOutputDelay = [800, 1800],
    emitRunEvents = true,
    runMetadata,
    eventNames = {},
  } = config;

  const RUN_START_NAME = eventNames.runStarted ?? EventType.RUN_STARTED;
  const RUN_FINISH_NAME = eventNames.runFinished ?? EventType.RUN_FINISHED;

  // 状态追踪
  let activeMessageTasks = 0;
  let pendingTimers = 0;
  let mainSequenceFinished = false;
  let stopped = false;
  let runFinishedPushed = false;

  const timers = new Set<NodeJS.Timeout>();

  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const randDelay = (range: [number, number]) => randInt(range[0], range[1]);

  function randomChunks(text: string, sizeRange: [number, number]) {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      const s = randInt(sizeRange[0], sizeRange[1]);
      chunks.push(text.slice(i, i + s));
      i += s;
    }
    return chunks;
  }

  function pushEventToWs(ev: any) {
    if (stopped || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(ev));
    } catch (e) {
      // ignore
    }
  }

  // schedule 帮助函数：注册 timer，执行后自动减少 pendingTimers & 清理
  function schedule(fn: () => void, delay: number) {
    pendingTimers++;
    const t = setTimeout(() => {
      try {
        fn();
      } finally {
        pendingTimers--;
        timers.delete(t);
        checkFinishAndClose();
      }
    }, delay);
    timers.add(t);
    return t;
  }

  function checkFinishAndClose() {
    if (stopped) return;
    // 当主序列已发送完成，且没有活跃消息任务 & 没有 pending timers 时，推送 RUN_FINISHED 并结束
    if (!runFinishedPushed && mainSequenceFinished && activeMessageTasks === 0 && pendingTimers === 0) {
      runFinishedPushed = true;
      if (emitRunEvents) {
        pushEventToWs({ type: RUN_FINISH_NAME, ...(runMetadata || {}) });
      }
    }
  }

  // 外部可用：动态插入事件（立即或延迟）
  function addEvent(ev: any, delay = 0) {
    if (stopped) return;
    if (delay <= 0) {
      pushEventToWs(ev);
    } else {
      schedule(() => pushEventToWs(ev), delay);
    }
  }

  function stop() {
    stopped = true;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    pendingTimers = 0;
  }

  // 根据单条消息构建它的事件序列（toolCall 的 result 不在这里处理）
  function buildEventListForMessage(msg: any): any[] {
    const isThinking = msg.type === 'thinking';
    if (['thinking', 'text'].includes(msg.type)) {
      const chunks = randomChunks(msg.text ?? "", (msg.chunkSize ?? chunkSize) as [number, number]);
      const events: any[] = [{ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_START : EventType.TEXT_MESSAGE_START, messageId: msg.messageId, name: msg.name, role: msg.role }];
      for (const c of chunks) events.push({ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_CONTENT : EventType.TEXT_MESSAGE_CONTENT, messageId: msg.messageId, delta: c });
      events.push({ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_END : EventType.TEXT_MESSAGE_END, messageId: msg.messageId });
      return events;
    }

    if (msg.type === "toolCall") {
      const argStr = JSON.stringify(msg.args ?? {});
      const argChunks = randomChunks(argStr, (msg.chunkSize ?? chunkSize) as [number, number]);
      const events: any[] = [{ type: EventType.TOOL_CALL_START, toolCallId: msg.toolCallId, toolCallName: msg.toolCallName, parentMessageId: msg.parentMessageId, name: msg.name, role: msg.role }];
      for (const c of argChunks) events.push({ type: EventType.TOOL_CALL_ARGS, toolCallId: msg.toolCallId, delta: c });
      events.push({ type: EventType.TOOL_CALL_END, toolCallId: msg.toolCallId });
      return events;
    }

    if (msg.type === "events" && Array.isArray(msg.events)) {
      return msg.events.slice();
    }

    // fallback raw
    return [msg];
  }

  // schedule toolCall 的异步 result（如果配置为异步）
  function scheduleToolOutput(msg: any) {
    const output = msg.output;
    const delay = typeof msg.outputDelay === "number"
      ? msg.outputDelay
      : Array.isArray(msg.outputDelay)
        ? randDelay(msg.outputDelay)
        : randDelay(defaultToolOutputDelay);

    schedule(() => {
      pushEventToWs({ type: EventType.TOOL_CALL_RESULT, toolCallId: msg.toolCallId, content: output });
    }, delay);
  }

  // 立即发 RUN_STARTED（如果需要）
  if (emitRunEvents) {
    pushEventToWs({ type: RUN_START_NAME, ...(runMetadata || {}) });
  }

  // 监听 WebSocket 关闭事件
  ws.on('close', () => {
    stop();
  });

  // ---------- 执行主逻辑 ----------
  if (mode === "sequential") {
    (async () => {
      for (const msg of messages) {
        if (stopped) break;
        activeMessageTasks++;
        const events = buildEventListForMessage(msg);

        // 逐事件发送（每个事件之间随机 chunkDelay）
        for (const ev of events) {
          if (stopped) break;

          // 使用 schedule 的方式来保证 pendingTimers 被正确统计,
          // 但我们需要 await 这个 schedule，所以用 Promise 包裹
          await new Promise<void>((resolve) => {
            pendingTimers++;
            const t = setTimeout(() => {
              try {
                pushEventToWs(ev);
              } finally {
                pendingTimers--;
                timers.delete(t);
                resolve();
                checkFinishAndClose();
              }
            }, randDelay(chunkDelay));
            timers.add(t);
          });
        }

        // 如果是 toolCall，处理 result（同步或异步）
        if (msg.type === "toolCall") {
          if (msg.syncOutput) {
            // 立即 output
            pushEventToWs({ type: EventType.TOOL_CALL_RESULT, toolCallId: msg.toolCallId, content: msg.output });
          } else {
            scheduleToolOutput(msg);
          }
        }

        activeMessageTasks--;
        if (stopped) break;
        // 等待 messageDelay 再处理下一条 message
        await new Promise((r) => setTimeout(r, messageDelay));
      }

      mainSequenceFinished = true;
      checkFinishAndClose();
    })().catch((e) => {
      mainSequenceFinished = true;
      checkFinishAndClose();
    });
  } else {
    // concurrent 模式：并发为每条消息启动任务（内部顺序保留）
    for (const msg of messages) {
      if (stopped) break;
      activeMessageTasks++;
      (async (m) => {
        try {
          const events = buildEventListForMessage(m);
          for (const ev of events) {
            if (stopped) break;
            pushEventToWs(ev);
            // 并发模式下也加随机 delay 以便交错出现
            await new Promise((r) => setTimeout(r, randDelay(chunkDelay)));
          }

          if (m.type === "toolCall") {
            if (m.syncOutput) {
              pushEventToWs({ type: EventType.TOOL_CALL_RESULT, toolCallId: m.toolCallId, content: m.output });
            } else {
              scheduleToolOutput(m);
            }
          }
        } finally {
          activeMessageTasks--;
          checkFinishAndClose();
        }
      })(msg);
    }
    // 标记主序列发送完（事件都已启动），但 stream 仍会等 activeMessageTasks + pendingTimers 为 0 才结束
    mainSequenceFinished = true;
    checkFinishAndClose();
  }

  return {
    addEvent,
    stop,
  };
}