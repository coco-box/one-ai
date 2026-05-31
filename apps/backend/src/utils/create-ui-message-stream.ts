// createUIMessageStream.ts
import { Readable } from "stream";
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
  eventNames?: { runStarted?: string; runFinished?: string; runError?: string, startStep?: string, finishStep?: string }; // 可映射到你的 EventType 常量
}

/**
 * createUIMessageStream
 * - messages: 数组，每项支持三种形式：
 *   * { type: 'text', messageId, name, role, text, chunkSize?, chunkDelay? }
 *   * { type: 'toolCall', toolCallId, toolCallName, args, output?, syncOutput?, outputDelay?, chunkSize?, chunkDelay? }
 *   * { type: 'events', events: Array<any> } // 直接原样推事件数组
 *
 * 返回 { stream, addEvent, stop }
 */
export function createUIMessageStream(
  messages: any[],
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
  const RUN_ERROR_NAME = eventNames.runError ?? EventType.RUN_ERROR;

  const START_STEP_NAME = eventNames.startStep ?? EventType.STEP_STARTED;
  const FINISH_STEP_NAME = eventNames.finishStep ?? EventType.STEP_FINISHED;

  const stream = new Readable({ read() { } });

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

  function pushEventToStream(ev: any) {
    if (stopped) return;
    try {
      stream.push(`data: ${JSON.stringify(ev)}\n\n`);
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
        pushEventToStream({ type: RUN_FINISH_NAME, ...(runMetadata || {}) });
      }
      // 稍微延迟一下再真正 close（保证 CLIENT 有机会接收上面的 event）
      schedule(() => {
        try {
          stream.push(null);
        } catch (e) {}
      }, 20);
    }
  }

  // 外部可用：动态插入事件（立即或延迟）
  function addEvent(ev: any, delay = 0) {
    if (stopped) return;
    if (delay <= 0) {
      pushEventToStream(ev);
    } else {
      schedule(() => pushEventToStream(ev), delay);
    }
  }

  function stop() {
    stopped = true;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    pendingTimers = 0;
    try {
      stream.push(null);
    } catch (e) {}
  }

  // 根据单条消息构建它的事件序列（toolCall 的 result 不在这里处理）
  function buildEventListForMessage(msg: any): any[] {
    const isThinking = msg.type === 'thinking';
    if (['thinking', 'text'].includes(msg.type)) {
      const chunks = randomChunks(msg.text ?? "", (msg.chunkSize ?? chunkSize) as [number, number]);
      const events: any[] = [{ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_START : EventType.TEXT_MESSAGE_START, messageId: msg.messageId, role: msg.role, rawEvent: { name: msg.name } }];
      for (const c of chunks) events.push({ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_CONTENT : EventType.TEXT_MESSAGE_CONTENT, messageId: msg.messageId, delta: c, rawEvent: { name: msg.name } });
      events.push({ type: isThinking ? EventType.THINKING_TEXT_MESSAGE_END : EventType.TEXT_MESSAGE_END, messageId: msg.messageId, rawEvent: { name: msg.name } });
      return events;
    }

    if (msg.type === "toolCall") {
      const argStr = JSON.stringify(msg.args ?? {});
      const argChunks = randomChunks(argStr, (msg.chunkSize ?? chunkSize) as [number, number]);
      const events: any[] = [{ type: EventType.TOOL_CALL_START, toolCallId: msg.toolCallId, toolCallName: msg.toolCallName, parentMessageId: msg.parentMessageId, role: msg.role, rawEvent: { name: msg.name } }];
      for (const c of argChunks) events.push({ type: EventType.TOOL_CALL_ARGS, toolCallId: msg.toolCallId, delta: c });
      events.push({ type: EventType.TOOL_CALL_END, toolCallId: msg.toolCallId });
      return events;
    }

    if (msg.type === EventType.CUSTOM) {
      return [{ type: msg.type, name: msg.typeName, role: msg.role, value: msg.text, rawEvent: { name: msg.name } }];
    }

    if (msg.type === EventType.RUN_ERROR) {
      return [{ type: msg.type, message: msg.text, rawEvent: { name: msg.name, messageId: msg.messageId, raw_event_data: msg } }];
    }

    if (msg.type === "start-step") {
      return [{ type: START_STEP_NAME, stepName: msg.stepName, rawEvent: { payload: 233 } }];
    }

    if (msg.type === "finish-step") {
      return [{ type: FINISH_STEP_NAME, stepName: msg.stepName, rawEvent: { payload: 333 } }];
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
      pushEventToStream({ type: EventType.TOOL_CALL_RESULT, toolCallId: msg.toolCallId, content: output });
    }, delay);
  }

  // 立即发 RUN_STARTED（如果需要）
  if (emitRunEvents) {
    pushEventToStream({ type: RUN_START_NAME, ...(runMetadata || {}) });
  }

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
          if (ev.type === EventType.RUN_ERROR) {
            // 立即发送错误事件
            pushEventToStream(ev);
            // 错误事件立即结束 run
            runFinishedPushed = true;
            stop();
            return;
          }

          // 使用 schedule 的方式来保证 pendingTimers 被正确统计,
          // 但我们需要 await 这个 schedule，所以用 Promise 包裹
          await new Promise<void>((resolve) => {
            pendingTimers++;
            const t = setTimeout(() => {
              try {
                pushEventToStream(ev);
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
            pushEventToStream({ type: EventType.TOOL_CALL_RESULT, toolCallId: msg.toolCallId, content: msg.output });
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
    // concurrent 模式：支持 depId / depOn 依赖关系
    // depId: 当前消息的唯一标识，完成后会通知依赖它的消息
    // depOn: 依赖的 depId 数组，当前消息会等待所有依赖完成后才开始
    // resolveOnOutput: 仅对 toolCall 生效，为 true 时 depId 在 TOOL_CALL_RESULT 推送后才解析（而非 TOOL_CALL_END 后）
    const depResolvers = new Map<string, () => void>();
    const depPromises = new Map<string, Promise<void>>();

    // 预注册所有 depId
    for (const msg of messages) {
      if (msg.depId) {
        depPromises.set(msg.depId, new Promise<void>((resolve) => {
          depResolvers.set(msg.depId, resolve);
        }));
      }
    }

    function resolveDepId(depId: string) {
      const resolver = depResolvers.get(depId);
      if (resolver) {
        resolver();
        depResolvers.delete(depId);
      }
    }

    for (const msg of messages) {
      if (stopped) break;
      activeMessageTasks++;
      (async (m) => {
        try {
          // 等待依赖完成
          if (Array.isArray(m.depOn) && m.depOn.length > 0) {
            const deps = m.depOn
              .map((id: string) => depPromises.get(id))
              .filter((p: any): p is Promise<void> => !!p);
            await Promise.all(deps);
          }
          if (stopped) return;

          const events = buildEventListForMessage(m);
          for (const ev of events) {
            if (stopped) break;
            if (ev.type === EventType.RUN_ERROR) {
              // 立即发送错误事件
              pushEventToStream(ev);
              // 错误事件立即结束 run
              runFinishedPushed = true;
              stop();
              return;
            }

            pushEventToStream(ev);
            // 并发模式下也加随机 delay 以便交错出现
            await new Promise((r) => setTimeout(r, randDelay(chunkDelay)));
          }

          let depResolved = false;

          if (m.type === "toolCall" && m.output !== undefined) {
            if (m.syncOutput) {
              pushEventToStream({ type: EventType.TOOL_CALL_RESULT, toolCallId: m.toolCallId, content: m.output });
              // syncOutput + resolveOnOutput: depId 在 result 推送后解析
              if (m.resolveOnOutput && m.depId) {
                resolveDepId(m.depId);
                depResolved = true;
              }
            } else {
              // 异步 output
              const outputDelay = typeof m.outputDelay === "number"
                ? m.outputDelay
                : Array.isArray(m.outputDelay)
                  ? randDelay(m.outputDelay)
                  : randDelay(defaultToolOutputDelay);

              if (m.resolveOnOutput && m.depId) {
                // 等待 output 推送完成后再解析 depId，确保依赖方拿到结果后才继续
                await new Promise<void>((resolve) => {
                  schedule(() => {
                    pushEventToStream({ type: EventType.TOOL_CALL_RESULT, toolCallId: m.toolCallId, content: m.output });
                    resolveDepId(m.depId);
                    resolve();
                  }, outputDelay);
                });
                depResolved = true;
              } else {
                scheduleToolOutput(m);
              }
            }
          }

          // 默认: 事件发送完成后立即解析 depId
          if (m.depId && !depResolved) {
            resolveDepId(m.depId);
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
    stream,
    addEvent,
    stop,
  };
}

/**
 * createEventStringStream
 * - 接收原始字符串或字符串数组（每项形如 `data:{...}`），按顺序推送到 SSE 流
 * - 返回 { stream, addEvent, stop }
 */
export function createEventStringStream(
  input: string | string[],
  config: {
    mode?: 'sequential' | 'concurrent'
    lineDelay?: number | [number, number]
    autoClose?: boolean
  } = {}
) {
  const {
    mode = 'sequential',
    lineDelay = [50, 200],
    autoClose = true,
  } = config;

  const stream = new Readable({ read() {} });
  let stopped = false;
  let pendingTimers = 0;
  let mainSequenceFinished = false; // 修复：仅在全部事件已排完且无 pendingTimers 时关闭
  let closeScheduled = false; // 防止重复安排关闭
  const timers = new Set<NodeJS.Timeout>();

  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const randDelay = (range: [number, number]) =>
    Array.isArray(range) ? randInt(range[0], range[1]) : range;

  function normalizeLine(line: string) {
    const trimmed = (line ?? '').trim();
    if (!trimmed) return '';
    return trimmed.startsWith('data:') ? `${trimmed}\n\n` : `data: ${trimmed}\n\n`;
  }

  function pushRawToStream(line: string) {
    if (stopped) return;
    const payload = normalizeLine(line);
    if (!payload) return;
    try {
      stream.push(payload);
    } catch (_) {
      // ignore push errors
    }
  }

  function schedule(fn: () => void, delay: number) {
    pendingTimers++;
    const t = setTimeout(() => {
      try {
        fn();
      } finally {
        pendingTimers--;
        timers.delete(t);
        maybeClose();
      }
    }, delay);
    timers.add(t);
    return t;
  }

  function maybeClose() {
    if (!autoClose || stopped || closeScheduled) return;
    if (mainSequenceFinished && pendingTimers === 0) {
      // 稍作延迟，确保最后一个事件被客户端接收
      closeScheduled = true;
      schedule(() => {
        try { stream.push(null); } catch (_) {}
      }, 20);
    }
  }

  function addEvent(line: string, delay = 0) {
    if (stopped) return;
    if (delay <= 0) {
      pushRawToStream(line);
    } else {
      schedule(() => pushRawToStream(line), delay);
    }
  }

  function stop() {
    stopped = true;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    pendingTimers = 0;
    try { stream.push(null); } catch (_) {}
  }

  // 解析输入为行数组（过滤空行）
  const lines: string[] = Array.isArray(input)
    ? input
    : String(input)
        .split(/\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

  // 推送逻辑
  if (mode === 'sequential') {
    (async () => {
      for (const line of lines) {
        if (stopped) break;
        await new Promise<void>((resolve) => {
          pendingTimers++;
          const t = setTimeout(() => {
            try { pushRawToStream(line); }
            finally {
              pendingTimers--;
              timers.delete(t);
              resolve();
              // 这里不立即关闭，由 mainSequenceFinished 控制关闭时机
            }
          }, randDelay(lineDelay as [number, number]));
          timers.add(t);
        });
      }
      // 顺序模式：所有行已安排/执行完成
      mainSequenceFinished = true;
      maybeClose();
    })().catch(() => {
      mainSequenceFinished = true;
      maybeClose();
    });
  } else {
    // concurrent：并发推送每一行（内部保持每行自身的延迟）
    for (const line of lines) {
      if (stopped) break;
      schedule(() => pushRawToStream(line), randDelay(lineDelay as [number, number]));
    }
    // 并发模式：所有事件的调度已完成，等待 pendingTimers 归零再关闭
    mainSequenceFinished = true;
    maybeClose();
  }

  return { stream, addEvent, stop };
}