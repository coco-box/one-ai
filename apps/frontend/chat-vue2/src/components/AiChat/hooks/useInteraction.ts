import { ref } from '@vue/composition-api';
import { InteractionButtonConfig, Message } from '@coco-box/ai-ui';

export function useInteraction(
  confirmCallback: (value: any) => void,
  cancelCallback: (value: any) => void,
) {
  // 交互配置
  const interactionConfig = ref({} as any);
  // 是否展示交互区域
  const showInteractionArea = ref(false);
  // 显示建议
  const showSuggestionArea = ref(true);
  // 处理交互确认按钮
  const handleInteractionConfirm = (value: InteractionButtonConfig) => {
    if (value.value === true) {
      showInteractionArea.value = false;
      confirmCallback(value);
    } else {
      showInteractionArea.value = true;
      cancelCallback(value);
    }
  };
  // 更新交互组件状态
  const updateInteractionState = (messages: Message[]) => {
    const { parts } = messages[messages.length - 1];
    if (parts?.length) {
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.text) {
        // 替换末尾的 TERMINATE
        lastPart.text = lastPart.text?.replace(/TERMINATE/g, '');
      }
      // 根据最后一条消息是否有交互配置来决定是否展示交互组件
      if (lastPart && lastPart.type === 'data-suggested_action') {
        // 展示确认按钮
        showInteractionArea.value = true;
        const finalOptions = {
          description: lastPart.data?.nextActionDescription || '', // 交互组件描述文本
          suggestionOptions: lastPart.data?.suggestedAction || [], // 交互组件底部建议按钮文本集合
          submitText: lastPart.data?.nextActionQuery || '', // 用户点击确认按钮后实际发送给后端的消息文本
        } as any;
        interactionConfig.value = {
          confirmText: finalOptions.description || '',
          confirmButtons: [
            {
              // confirmBtnText: ui按钮文本; submitText: 实际发送文本
              text: finalOptions.confirmBtnText ?? '确认', type: 'primary', icon: 'el-icon-check', value: true, submitText: finalOptions.submitText ?? '继续',
            },
          ],
          suggestionText: '',
          suggestionButtons: finalOptions.suggestionOptions.map((item: string) => ({
            text: item, type: 'text', value: true,
          })),
        };
      } else {
        // 隐藏确认按钮
        showInteractionArea.value = false;
      }
    } else {
      // 隐藏确认按钮
      showInteractionArea.value = false;
    }
  };
  return {
    interactionConfig,
    showInteractionArea,
    showSuggestionArea,
    handleInteractionConfirm,
    updateInteractionState,
  };
}
