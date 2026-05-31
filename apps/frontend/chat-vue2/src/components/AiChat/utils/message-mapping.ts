import { v4 as uuidv4 } from 'uuid';
import { UIMessage, runUpdateMessageJob, defaultShouldStartNewMessage } from '@coco-box/ai';
import { mapAgUiEventToUiChunk } from '@coco-box/ai-ag-ui-adapter';

type HistoryRound = { content: any[] };

/**
 * 把 ag-ui history 转成 ui-messages
 * @param history
 */
export async function mapAgUiHistoryToUiMessages(history: HistoryRound[]): Promise<UIMessage[]> {
  const messages: UIMessage[] = [];
  for (const round of history) {
    const converted = await convertRoundToMessages(round);
    messages.push(...converted);
  }
  return messages;
}

export async function convertRoundToMessages(round: HistoryRound): Promise<UIMessage[]> {
  const messages: UIMessage[] = [];
  const events = round.content ?? [];
  const userFilter = (e) => e.type === 'CUSTOM' && e.name === 'USER_QUERY'; // 大类是 CUSTOM 自定义类型; 子类是 USER_QUERY 用户消息
  // 1) 用户消息（若存在）
  const userEv = events.find((e: any) => userFilter(e));
  const userMessage = buildUserMessageFromCustom(userEv);
  if (userMessage) messages.push(userMessage);

  // 2) 其余事件 → 转为 ai-sdk 需要的 chunk 数据
  const chunks = events
    .filter((e: any) => !userFilter(e))
    .map((e: any) => mapAgUiEventToUiChunk(e))
    .filter(Boolean) as any[];

  const state = {
    message: userMessage,
    messages,
    activeTextParts: {},
    activeReasoningParts: {},
    partialToolCalls: {},
    currentReasoningIds: {},
    startReceived: false,
  } as any;

  for (const chunk of chunks) {
    await runUpdateMessageJob(state, chunk, undefined, undefined, {
      shouldStartNewMessage: defaultShouldStartNewMessage,
    });
  }

  return state.messages;
}

// —— 工具：根据 CUSTOM & name=USER_QUERY 构造 user 消息 ——
export function buildUserMessageFromCustom(ev: any = { value: '', }): UIMessage {
  const text = ev?.value ?? '';
  const name = ev?.raw_event?.name ?? 'user';
  return createUIMessage({
    role: 'user',
    name,
    createdAt: ev?.timestamp,
    parts: [
      {
        type: 'text',
        text,
        state: 'done',
        rawData: {
          ...ev?.raw_event,
        },
        metadata: {
          role: 'user',
          name,
          createdAt: ev?.timestamp
        }
      },
    ],
  }) as UIMessage;
}

/**
 * TODO: 后期得从 @coco-box/ai 暴露出来
 * 创建新的消息
 * @param generateId 消息 id
 * @param createdAt 消息创建时间
 * @param name 消息名称
 * @param role 消息角色
 * @param parts 消息部分
 * @returns 新的消息
 */
export function createUIMessage({
  id,
  role,
  name,
  createdAt,
  parts,
} = {} as any): UIMessage {
  return {
    id: id ?? uuidv4(),
    role: role ?? 'assistant',
    parts: parts ?? [],
    metadata: {
      createdAt,
      name,
    },
  };
}
