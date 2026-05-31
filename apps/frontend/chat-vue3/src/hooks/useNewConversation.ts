import { useRouter } from 'vue-router';
import { useCommonStore, useChatHistoryStore, useChatStatusStore, useChatMessageStore } from '@/store';
import { createSession } from '@/api/homePageApi';

/**
 * 新建对话的公共逻辑hooks
 */
export const useNewConversation = () => {
  const router = useRouter();
  const commonStore = useCommonStore();
  const chatHistoryStore = useChatHistoryStore();
  const chatStatusStore = useChatStatusStore();
  const chatMessageStore = useChatMessageStore();

  /**
   * 重置聊天状态
   */
  const resetChatState = () => {
    chatHistoryStore.setActiveHistoryId('');
    chatStatusStore.startChat = false;
    chatMessageStore.setMessages([]);
  };

  /**
   * 创建新会话
   * @param options 创建会话的选项
   * @param options.shouldNavigate 是否需要跳转到聊天页面，默认为true
   * @returns Promise<string | null> 返回sessionId，失败时返回null
   */
  const createNewConversation = async (options: { shouldNavigate?: boolean } = {}) => {
    const { shouldNavigate = true } = options;
    
    try {
      // 获取当前选中的流程
      const currentFlow = commonStore.getActiveFlow();
      
      // 检查是否选择了有效的流程
      if (!currentFlow || (currentFlow.app_name === '全部' && currentFlow.workflow_id === 'all')) {
        alert('请选择应用流程');
        return null;
      }

      // 调用创建会话接口
      const sessionId = await createSession({
        user_id: 'admin',
        business_id: '',
        flow_id: currentFlow.workflow_id
      });
      
      // 存储session_id到全局状态
      commonStore.setSessionId(sessionId);
      
      // 重置聊天状态
      resetChatState();
      
      // 如果需要跳转到聊天页面
      if (shouldNavigate) {
        router.push({
          path: '/chat',
          query: {
            session_id: sessionId,
            flowName: `${currentFlow.app_name}/${currentFlow.workflow_name}`,
            flow_id: currentFlow.workflow_id
          }
        });
      } else {
        // 在当前页面更新路由参数，确保message-store中的session_id能够更新
        router.replace({
          query: {
            ...router.currentRoute.value.query,
            session_id: sessionId,
            flowName: `${currentFlow.app_name}/${currentFlow.workflow_name}`,
            flow_id: currentFlow.workflow_id
          }
        });
      }
      
      return sessionId;
    } catch (error) {
      console.error('创建会话失败：', error);
      alert('创建会话失败，请重试');
      return null;
    }
  };

  return {
    resetChatState,
    createNewConversation
  };
};