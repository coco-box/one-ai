import { ref, Ref, ExtractPropTypes, computed, watch, toRefs, reactive } from '@vue/composition-api';
import QueryAiService from '@/services/ai';
import { UIMessage } from '@coco-box/ai';
import { normalizeToSeconds } from '@/utils';
import { mapAgUiHistoryToUiMessages } from '../utils/message-mapping';
import { useAiChatProps } from './useAiChatProps';

export function useHistory(
  props: ExtractPropTypes<typeof useAiChatProps>,
  chatContainerRef: Ref<HTMLElement | null>,
  chatInfo: Ref<{
    session_id: string,
    error: string,
    is_first_dialog: boolean,
  }>,
  isScrolling: Ref<boolean>,
  y: Ref<number>,
  directions: { left: boolean, top: boolean, right: boolean, bottom: boolean },
) {
  const queryAiService = new QueryAiService();
  // 服务器时间
  const serverTimestamp = ref(normalizeToSeconds(Date.now())!);
  // 是否显示历史消息加载 loading 动画和提示
  const showLoadingHistory = ref(false);
  // 是否还有更多历史消息
  const hasMoreHistory = ref(true);
  // 历史消息
  const historyMessages = ref<UIMessage[]>([]);
  // 更新历史消息
  const updateHistoryMessages = (newMessages: UIMessage[]) => {
    // 如果没有新消息，或者当前没有任何历史消息，直接拼接
    if (!newMessages.length || !historyMessages.value.length) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      historyMessages.value = [...newMessages, ...historyMessages.value];
      return;
    }

    const lastNewMessage = newMessages[newMessages.length - 1];
    const firstOldMessage = historyMessages.value[0];

    // 在分页加载历史消息时，智能地合并来自同一个智能体的连续消息，避免不必要的头像和标题重复，从而确保用户体验的连贯性。

    // 检查新消息的最后一条与旧消息的第一条是否来自同一个 agent, 如果是同一个 agent 则合并 parts
    if (lastNewMessage.metadata?.name && lastNewMessage.metadata?.name === firstOldMessage.metadata?.name) {
      // 合并 parts
      firstOldMessage.parts.unshift(...lastNewMessage.parts);
      // 将剩余的新消息拼接到前面
      const remainingNewMessages = newMessages.slice(0, newMessages.length - 1);
      historyMessages.value = [...remainingNewMessages, ...historyMessages.value];
    } else {
      // 如果不是同一个 agent，直接拼接
      historyMessages.value = [...newMessages, ...historyMessages.value];
    }
  };

  // 历史记录加载
  const loadHistory = async (): Promise<{ messages: UIMessage[]; hasMore: boolean }> => {
    try {
      // 直接返回符合类型的对象，而不是axios的原始响应
      const params = {
        session_id: chatInfo.value.session_id,
        // history_message_id: historyMessages.value[0]?.history_message_id || null,
        limit: 5,
      } as any;
      const response = await queryAiService.getHistoryMessages(params);
      if (response.code !== 200 || !response.data?.length || (Array.isArray(response.data) && response.data.length === 0)) {
        return { messages: [], hasMore: false };
      }
      console.log(response.data);
      serverTimestamp.value = normalizeToSeconds(response.timestamp)!;
      const formatMessages = await mapAgUiHistoryToUiMessages(response.data as any);
      console.log(formatMessages);

      return {
        messages: formatMessages || [],
        hasMore: false, // TODO: 现在没有分页，一次性给的
      };
    } catch (error) {
      console.error('加载历史消息失败:', error);
      return { messages: [], hasMore: false };
    }
  };

  const handleLoadHistory = async () => {
    if (showLoadingHistory.value || !hasMoreHistory.value) return;
    showLoadingHistory.value = true;

    // 记录加载前的 scroll 高度
    const prevHeight = chatContainerRef.value?.scrollHeight || 0;

    try {
      // 支持同步异步
      const result = await loadHistory();
      console.log('加载历史消息:', result);
      if (result && Array.isArray(result.messages)) {
        updateHistoryMessages(result.messages as UIMessage[]);
        hasMoreHistory.value = !!result.hasMore;

        // 计算新的 scroll 高度
        requestAnimationFrame(() => {
          const newHeight = chatContainerRef.value?.scrollHeight || 0;
          if (newHeight !== prevHeight) {
            chatContainerRef.value!.scrollTop = newHeight - prevHeight;
          }
        });
      } else {
        hasMoreHistory.value = false;
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    } finally {
      showLoadingHistory.value = false;
    }
  };

  const { top: toTop, bottom: toBottom } = toRefs(reactive(directions));

  const needLoadHistory = computed(() => {
    const _toTop = toTop.value;
    const _y = y.value;
    const _isScrolling = isScrolling.value;
    const _toBottom = toBottom.value;
    return _toTop && _y < 50 && _isScrolling;
  });
  watch(needLoadHistory, async (val: boolean) => {
    if (val) {
      await handleLoadHistory();
    }
  });
  const stopWatchChatInfo = watch(chatInfo, (val) => {
    if (val?.is_first_dialog) {
      // 用于用户首次进来是欢迎状态时, 不去加载历史消息, 因为不会有历史消息, 所有消息要么是当前用户主动发起的或者被动接收的
      hasMoreHistory.value = false;
    }
    stopWatchChatInfo();
  });

  return {
    showLoadingHistory,
    hasMoreHistory,
    historyMessages,
    loadHistory,
    handleLoadHistory,
    serverTimestamp,
  };
}
