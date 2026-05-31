import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionList, getSessionHistory, type SessionItem } from '@/api/homePageApi';
import { useChatMessageStore } from '@/store';

/**
 * 会话列表的公共逻辑hooks
 */
export const useSessionList = () => {
  const router = useRouter();
  
  // 会话列表数据
  const sessionList = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const chatMessageStore = useChatMessageStore();

  /**
   * 获取并更新会话列表
   * @param flowId 流程ID，'all'表示获取所有会话
   */
  const updateSessionList = async (flowId: string) => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // const sessions = await getSessionList(flowId);
      // // 将API返回的会话数据转换为页面显示格式
      // sessionList.value = sessions.map((session: SessionItem, index: number) => ({
      //   id: index + 1,
      //   flowName: `${session.app_name}/${session.workflow_name}`,
      //   workflow_name: session.workflow_name,
      //   app_name: session.app_name,
      //   sessionId: session.session_id.trim(),
      //   user: 'admin', // 默认用户，可根据实际需求调整
      //   runStatus: getRunStatus(session.status),
      //   chatStatus: getChatStatus(session.status),
      //   status: session.status,
      //   createTime: session.create_time || new Date().toISOString(),
      //   updateTime: session.update_time || new Date().toISOString()
      // }));
      console.log('会话列表已更新：', sessionList.value);
    } catch (err) {
      console.error('更新会话列表失败：', err);
      error.value = '获取会话列表失败';
      // 如果获取失败，保持原有数据不变
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取运行状态文本
   */
  const getRunStatus = (status: number): string => {
    switch (status) {
      case 0:
        return '已创建';
      case 1:
        return '运行中';
      default:
        return '已停止';
    }
  };

  /**
   * 获取会话状态文本
   */
  const getChatStatus = (status: number): string => {
    switch (status) {
      case 0:
        return '待开始';
      case 1:
        return '进行中';
      default:
        return '已结束';
    }
  };

  /**
   * 刷新会话列表
   * @param flowId 流程ID
   */
  const refreshSessionList = (flowId: string) => {
    updateSessionList(flowId);
  };

  /**
   * 查看会话详情
   * @param session 会话数据
   * @param flowList 流程列表，用于查找对应的workflow_id
   */
  const viewSession = async (session: any, flowList?: any[]) => {
    console.log('viewSession', session);
    
    let workflowId = '';
    if (flowList) {
      const workflow = flowList.find((flow) => flow.workflow_name === session.workflow_name);
      workflowId = workflow?.workflow_id || '';
    }
    
    // 获取会话历史
    try {
      await getHistorySession(session.sessionId);
    } catch (err) {
      console.error('获取会话历史失败：', err);
      // 即使获取历史失败，也继续导航到聊天页面
    }
    
    router.push({
      path: '/chat',
      query: {
        session_id: session.sessionId,
        flowName: session.flowName,
        flow_id: workflowId
      }
    });
  };

  /**
   * 根据关键词搜索会话
   * @param keyword 搜索关键词
   * @param originalList 原始会话列表
   */
  const searchSessions = (keyword: string, originalList: any[]) => {
    if (!keyword.trim()) {
      return originalList;
    }
    
    return originalList.filter(session => 
      session.flowName.toLowerCase().includes(keyword.toLowerCase()) ||
      session.sessionId.toLowerCase().includes(keyword.toLowerCase()) ||
      session.user.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  /**
   * 按时间分组会话列表
   * @param sessions 会话列表
   */
  const groupSessionsByTime = (sessions: any[]) => {
    const groups: Record<string, any> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.createTime || session.updateTime);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          title: formatDateTitle(date),
          date: dateKey,
          expand: true,
          list: []
        };
      }
      
      groups[dateKey].list.push(session);
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  /**
   * 格式化日期标题
   */
  const formatDateTitle = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric'
      });
    }
  };

  /**
   * 获取会话历史
   * @param sessionId 会话ID
   * @param userId 用户ID，默认为admin
   */
  const getHistorySession = async (sessionId: string, userId: string = 'admin') => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const historyData = await getSessionHistory(sessionId, userId);
      // 更新消息存储
      if (historyData.messages) {
        chatMessageStore.setMessages(historyData.messages);
      }
      console.log('会话历史已加载：', historyData);
      return historyData;
    } catch (err) {
      console.error('获取会话历史失败：', err);
      error.value = '获取会话历史失败';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    sessionList,
    isLoading,
    error,
    updateSessionList,
    refreshSessionList,
    viewSession,
    searchSessions,
    groupSessionsByTime,
    getRunStatus,
    getChatStatus,
    getHistorySession
  };
};