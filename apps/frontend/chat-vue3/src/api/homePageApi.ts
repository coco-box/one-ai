// 首页相关的API请求方法
import { request } from '@/api/request';

// 流程列表数据类型定义
export interface FlowItem {
  workflow_id: string;
  app_name: string;
  workflow_name: string;
  running_count: number;
  isActive?: boolean;
}

// 会话创建响应类型
export interface CreateSessionResponse {
  session_id: string;
}

// 会话列表项类型
export interface SessionItem {
  app_name: string;
  workflow_name: string;
  session_id: string;
  status: number; // 0：已创建 1：运行中 2：已停止
}

// 会话列表响应类型
export interface SessionListResponse {
  code: number;
  msg: string;
  count: number;
  data: SessionItem[];
  timestamp: number;
}

// 会话历史响应类型
export interface SessionHistoryResponse {
  code: number;
  msg: string;
  data: {
    messages: any[];
    session_info: SessionItem;
  };
  timestamp: number;
}

// 获取流程列表
export const getFlowList = async (): Promise<FlowItem[]> => {
  try {
    const response = await request.get<FlowItem[]>('/api/flow/list');
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || '获取流程列表失败');
  } catch (error) {
    console.error('获取流程列表失败：', error);
    throw error;
  }
};

// 获取会话列表
export const getSessionList = async (flowId: string): Promise<SessionItem[]> => {
  try {
  // 构造请求URL，当flowId为all时不传递flow_id参数
  const url = flowId === 'all' 
    ? '/api/session/list'
    : `/api/session/list?flow_id=${flowId}`;
    const response = await request.get<SessionListResponse>(url);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response?.msg || '获取会话列表失败');
  } catch (error) {
    console.error('获取会话列表失败：', error);
    throw error;
  }
};

// 获取会话历史
export const getSessionHistory = async (sessionId: string, userId: string = 'admin'): Promise<any> => {
  try {
    const url = `/api/history_session/${sessionId}?user_id=${userId}`;
    const response = await request.get<SessionHistoryResponse>(url);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response?.msg || '获取会话历史失败');
  } catch (error) {
    console.error('获取会话历史失败：', error);
    throw error;
  }
};

// 创建会话
export const createSession = async (params?: {
  user_id?: string;
  business_id?: string;
  flow_id?: string;
}): Promise<string> => {
  try {
    const requestData = {
      user_id: params?.user_id || "admin",
      business_id: params?.business_id || "",
      flow_id: params?.flow_id || "items_flow_000000000000000000000"
    };
    
    const response = await request.post<CreateSessionResponse>('/api/create_session', requestData);
    if (response.code === 200 && response.data?.session_id) {
      return response.data.session_id;
    }
    throw new Error(response.message || '创建会话失败');
  } catch (error) {
    console.error('创建会话失败：', error);
    throw error;
  }
};

// 创建会话2
export const createSessionNew = async (params?: {
  user_id?: string;
  business_id?: string;
  flow_id?: string;
  app_id?: string;
}): Promise<string> => {
  try {
    const requestData = {
      user_id: params?.user_id || "admin",
      business_id: params?.business_id || "",
      flow_id: params?.flow_id || "items_flow_000000000000000000000",
      app_id: params?.app_id || "permission_application_items_000",
    };
    
    const response = await request.post<CreateSessionResponse>('/api/session/create', requestData);
    if (response.code === 200 && response.data?.session_id) {
      return response.data.session_id;
    }
    throw new Error(response.message || '创建会话失败');
  } catch (error) {
    console.error('创建会话失败：', error);
    throw error;
  }
};