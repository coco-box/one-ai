import { ChatRequestOptions, UIMessage } from '@coco-box/ai';

interface AutoRunConfig {
  input: { value: string }
  handleSubmitButtonClick: (event?: { preventDefault?: () => void; shiftKey?: boolean }, options?: ChatRequestOptions) => void
}

/**
 * 检查消息中是否有自动运行事件，如果有则执行自动发送
 * @param messages 消息列表
 * @param config 自动运行配置
 * @returns 是否执行了自动发送
 */
export async function checkAndExecuteAutoRun(
  messages: UIMessage[],
  config: AutoRunConfig
) {
  if (!messages.length) return false;

  const lastMessage = messages[messages.length - 1];
  const autoNextAgentPart = lastMessage.parts.find((part) => part.type === 'data-auto_run_next_agent') as any;
  console.log(autoNextAgentPart);

  // 检查是否有 AUTO_RUN_NEXT_AGENT 事件
  if (autoNextAgentPart) {
    // 检查是否有有效的查询内容
    const query = autoNextAgentPart?.data?.query;
    if (!query || typeof query !== 'string' || !query.trim()) {
      console.warn('检测到自动运行事件，但查询内容为空:', autoNextAgentPart?.data);
      return false;
    }

    setTimeout(() => {
      // 设置输入内容
      config.input.value = query.trim();

      // 执行提交
      config.handleSubmitButtonClick();

      console.log('自动发送完成');
    }, 500);
    return true;
  }
  return false;
}
