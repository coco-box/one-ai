import { getChatStatus, SessionResponseData } from '@/api/chat';
import { ChatRequestOptions } from '@coco-box/ai-ui';
import { onMounted, onUnmounted, Ref, ref, watch } from '@vue/composition-api';

export function useMultiPersonConversation(
  status: Ref<'submitted' | 'streaming' | 'ready' | 'error'>,
  chatInfo: Ref<SessionResponseData | null>,
  isFirstConversation: Ref<boolean>,
  handleSubmitButtonClick: (
    event?: {
      preventDefault?: () => void,
      shiftKey?: boolean,
    },
    options?: ChatRequestOptions,
  ) => void,
  isView: boolean,
) {
  let timer = null as any;
  const isConversationRunning = ref<boolean>(false); // 是否正在对话
  const isCurrentUserConversation = ref<boolean>(true); // 是否当前用户在对话 ｜ false 表示用户被动同步对话消息

  // 获取对话状态
  const fetchConversationState = async () => {
    if (!chatInfo.value?.sessionId) return ['sessionId 为空', null];
    try {
      const resp = await getChatStatus(chatInfo.value?.sessionId || '');
      if (resp.success) {
        return [null, resp.data];
      }
      return [resp.msg, null];
    } catch (e) {
      return [e, null];
    }
  };

  // 获取最新一轮历史消息 id
  // const fetchLastHistoryMessageId = async () => {
  //   try {
  //     const resp = await getAiChatLastHistoryMessageId(chatInfo.value?.sessionId || '');
  //     if (resp.success) {
  //       return [null, resp.data];
  //     }
  //     return [resp.msg, null];
  //   } catch (e) {
  //     return [e, null];
  //   }
  // };

  const updateState = async () => {
    const [err, data] = await fetchConversationState();
    if (!err) {
      isConversationRunning.value = !!data;
      isCurrentUserConversation.value = true;
    }
  };

  const startInterval = () => {
    // 轮询接口查看会话状态
    timer = setInterval(updateState, 1000);
  };

  const stopInterval = () => {
    clearInterval(timer);
    timer = null;
  };

  watch(() => isConversationRunning.value, (val) => {
    console.log('isConversationRunning.value', val, status.value);
    if (val && ['ready', 'error'].includes(status.value)) { // 对话中
      // 1. 暂停会话状态查询
      // 2. 请求 sse
      if (isFirstConversation.value) {
        isFirstConversation.value = false;
      }
      stopInterval();
      // eslint-disable-next-line no-use-before-define
      sendMessage();
    }
  });

  watch(() => status.value, (val) => {
    if (['ready', 'error'].includes(val)) {
      startInterval();
    } else {
      stopInterval();
    }
  });

  // 发送消息
  const sendMessage = async () => {
    if (typeof handleSubmitButtonClick === 'function') {
      isCurrentUserConversation.value = false;
      // const [err, data] = await fetchLastHistoryMessageId();
      // if (!err && data) {
      //   lastHistoryMessageId.value = data as string;
      // }
      handleSubmitButtonClick({}, {
        allowEmptySubmit: true,
      });
    }
  };

  onMounted(async () => {
    if (isView) return;
    await updateState();
    // 轮询接口查看会话状态
    startInterval();
  });
  onUnmounted(() => {
    // 关闭轮询
    stopInterval();
  });

  return {
    isConversationRunning,
    sendMessage,
    isCurrentUserConversation,
  };
}
