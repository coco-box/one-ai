import request from '@/api/request';
import { useErrorMessage } from '@/utils/notify';

export const aiBaseURL = '/api/ai_agent';

export interface IHistorySessionDeleteQuery {
  session_id: string;
  user_id: string;
}

export default class QueryAiService {
  request: typeof request;
  constructor() {
    this.request = request;
  }

  // 接口响应值处理
  handleResponse(res: any) {
    if (res) {
      if (!res.success) {
        useErrorMessage(res.msg || '操作失败');
      }
      return res;
    }
    return { success: false };
  }

  /**
   * 获取应用页面配置
   * docs: https://gvdafqehhu.feishu.cn/wiki/VlZhwk3JfivOlpkBsqIcqpJVndd#share-UKKRdUt6koyY03xGDaacaCPhnkc
   */
  async getAppPageConfig(query: { app_id: string }) {
    const res = await this.request.get(`${aiBaseURL}/app/page_config`, {
      params: query,
    });
    return this.handleResponse(res);
  }

  /**
   * 获取 历史会话列表
   */
  async getHistorySessionList(query: {
    user_id: string;
    app_id: string;
    flow_id: string;
    page: number;
    limit: number;
  }) {
    const res = await this.request.get(`${aiBaseURL}/session/page`, {
      params: query,
    });
    return this.handleResponse(res);
  }

  /**
   * 删除某个会话记录
   */
  async deleteHistorySession(params: IHistorySessionDeleteQuery) {
    const { session_id, ...rest } = params;
    const res = await this.request.post(`${aiBaseURL}/session/delete/${session_id}`, rest);
    return this.handleResponse(res);
  }

  /**
   * 重命名某个会话
   */
  async renameHistorySession(params: IHistorySessionDeleteQuery & { name: string }) {
    const { session_id, ...rest } = params;
    const res = await this.request.post(`${aiBaseURL}/session/rename/${session_id}`, rest);
    return this.handleResponse(res);
  }

  /**
   * 创建会话
   */
  async createSession(params: {
    user_id?: string;
    business_id?: string;
    flow_id?: string;
    app_id?: string;
  }) {
    const res = await this.request.post(`${aiBaseURL}/session/create`, params);
    return this.handleResponse(res);
  }

  /**
   * 终止聊天
   */
  async terminateChat(params: {
    chatId: string;
    user_id?: string;
  }) {
    const { chatId, ...rest } = params;
    const res = await this.request.post(`${aiBaseURL}/session/end/${chatId}`, rest);
    return this.handleResponse(res);
  }

  /**
   * 获取会话的历史消息
   */
  async getHistoryMessages(params: {
    session_id?: string;
  }) {
    const { session_id, ...rest } = params;
    const res = await this.request.get(`${aiBaseURL}/session/history/${session_id}`, {
      params: rest,
    });
    return this.handleResponse(res);
  }

  /**
   * 查询 AI 聊天状态
   */
  async getChatStatus(sessionId: string) {
    const res = await this.request.get(`${aiBaseURL}/chat/is_running/${sessionId}`);
    return this.handleResponse(res);
  }
}
