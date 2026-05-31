import { generateId as generateIdFunc, type UIMessagePart } from 'ai';
import { type UIMessage } from '../types';

type CreateUIMessageParams = {
  id?: string;
  role?: 'system' | 'user' | 'assistant' | 'tool' | 'developer';
  name?: string;
  createdAt?: number;
  parts?: UIMessagePart<any, any>[];
};

/**
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
}: CreateUIMessageParams = {}): UIMessage {
  return {
    id: id ?? generateIdFunc(),
    role: role ?? 'assistant',
    parts: parts ?? [],
    metadata: {
      createdAt,
      name,
    },
  };
}