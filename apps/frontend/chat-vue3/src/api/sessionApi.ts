/*
 * @Author: AI Assistant
 * @Date: 2025-01-28
 * @Description: 会话相关的API请求方法
 */
import { request } from '@/api/request';

/**
 * 停止会话
 * @param sessionId 会话ID
 * @param userId 用户ID，默认为admin
 * @returns Promise<any>
 */
export const endSession = async (sessionId: string, userId: string = 'admin'): Promise<any> => {
  const response = await request.post(`/api/end_session/${sessionId}`, {
    user_id: userId
  });
  return response;
};

/**
 * 暂停会话
 * @param sessionId 会话ID
 * @param userId 用户ID，默认为admin
 * @returns Promise<any>
 */
export const pauseSession = async (sessionId: string, userId: string = 'admin'): Promise<any> => {
  const response = await request.post(`/api/pause_session/${sessionId}`, {
    user_id: userId
  });
  return response;
};

/**
 * 恢复会话
 * @param sessionId 会话ID
 * @param userId 用户ID，默认为admin
 * @returns Promise<any>
 */
export const resumeSession = async (sessionId: string, userId: string = 'admin'): Promise<any> => {
  const response = await request.post(`/api/resume_session/${sessionId}`, {
    user_id: userId
  });
  return response;
};