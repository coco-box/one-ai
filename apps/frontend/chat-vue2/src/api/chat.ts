import request from './request';
import apiBaseMap from './apiBaseMap';
/**
 * 会话响应接口
 */
export interface SessionResponseData {
  sessionId: string;
  error?: string;
  isFirstConversation?: boolean; // 是否是首次会话
}
export interface BaseResponse<T> {
  code: number;
  msg: string;
  success?: boolean;
  data: T
}

/**
 * 暂停聊天响应接口
 */
export interface PauseResponse {
  status: string;
  message: string;
}

/**
 * 终止聊天响应接口
 */
export interface TerminateResponse {
  code: number;
  msg: string;
  success?: boolean;
  data: null
}

/**
 * 历史消息响应接口
 */
export interface HistoryItem {
  history_message_id: string;
  create_time: string | number | null | undefined;
  answer_list: any[];
}
export type HistoryResponse = HistoryItem[] | null;

/**
 * 获取 AI 初始化配置响应
 */
export interface AiInitConfigResponse {
  url: string;
  agentNames: string[];
}

/**
 * 获取 chat 聊天状态响应
 */
export type AiChatStatusResponse = boolean;

/**
 * 获取 AI 初始化配置
 */
export function getAiInitConfig(query: {
  emergencyEventId: string;
}): Promise<BaseResponse<AiInitConfigResponse>> {
  return request.get(
    '/chat/it/core/emergency/mcp/tool/getAiUrl',
    {
      baseURL: apiBaseMap.chat,
    },
  );
}

/**
 * 查询 AI 聊天状态
 */
export function getChatStatus(sessionId: string): Promise<BaseResponse<AiChatStatusResponse>> {
  return request.get(
    `/chat/is_running/${sessionId}`,
    {
      baseURL: apiBaseMap.chat,
    }
  );
}

/**
 * 开始聊天
 * @param additionalParams 对象
 * @returns 返回包含新聊天ID的响应
 */
export function startChat(
  params: { [key: string]: any },
): Promise<BaseResponse<SessionResponseData>> {
  return request.post(
    '/start_session',
    {
      ...params,
    },
    {
      baseURL: apiBaseMap.chat,
    },
  );
}

/**
 * 暂停聊天
 */
export function pauseChat(chatId: string): Promise<PauseResponse> {
  return request.post(
    `/pause/${chatId}`,
    {},
    {
      baseURL: apiBaseMap.chat,
    },
  );
}

/**
 * 终止聊天
 */
export function terminateChat(chatId: string): Promise<TerminateResponse> {
  return request.post(
    `/end_session/${chatId}`,
    {},
    {
      baseURL: apiBaseMap.chat,
    },
  );
}

/**
 * 获取历史消息（锚点）
 * @param history_message_id 第一条消息的ID
 * @param limit 每页条数
 * @param sessionId 会话ID
 * @returns 历史消息列表
 */
export function getHistoryMessagesByAnchor(
  {
    limit,
    session_id,
    history_message_id,
  }: {
    limit: number;
    session_id: string;
    history_message_id?: string;
  }
): Promise<BaseResponse<HistoryResponse>> {
  const realUrl = '/chat/history';
  return request.get(
    realUrl,
    {
      params: {
        history_message_id,
        limit,
        session_id,
      },
      baseURL: apiBaseMap.chat,
    },
  );
}

/**
 * 获取历史消息（分页）
 */
export function getHistoryMessagesByPage(data: {
  page: number;
  limit: number;
  chat_id?: string;
}): Promise<BaseResponse<HistoryResponse>> {
  const realUrl = '/chat/history';
  return request.post(
    realUrl,
    {
      page: data.page,
      limit: data.limit,
      chat_id: data.chat_id,
    },
    {
      baseURL: apiBaseMap.chat,
    },
  );
}
