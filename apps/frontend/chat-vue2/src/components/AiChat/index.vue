<template>
  <OneLayout class="ai-chat-container bg-one-global" ref='aiChatRef'>
    <OneHeader :title="title" class="ai-header">
      <!-- 透传具名插槽 operationArea -->
      <template #operationArea>
        <slot name="operationArea" />
      </template>

      <!-- 透传默认插槽 -->
      <template #default>
        <slot />
      </template>
    </OneHeader>
    <OneLayoutContent v-if="!chatInfo.is_first_dialog && allMessages.length" :class="[
      'layout-content-container',
      isTextareaExpanded ? 'content-shrink' : ''
    ]">
      <!-- 历史消息加载 loading 动画和提示 -->
      <Loading class="absolute left-0 top-0 right-0" v-if="showLoadingHistory" />
      <!-- 滚动到底部按钮 -->
      <div class="to-bottom-button" :class="{ 'streaming': status === 'streaming' }" v-if="showToBottomButton"
        ref="toBottomButtonRef" @click="tryAutoScroll(true)">
        <ChevronDownIcon />
      </div>
      <!-- 聊天主内容区 -->
      <div class="chat-main" ref="chatContainerRef">
        <div class="top-space" />
        <!-- 消息列表 -->
        <div class="message-list w-full max-w-800px mx-auto px-2 box-border" ref="messageListRef">
          <template v-if='allMessages.length'>
            <div v-for="(message, messageIndex) in allMessages" :key="message.id || messageIndex">
              <div class="message-content box-border">
                <template v-if="message.role === 'user'">
                  <OneBubble :variant="'none'" :align="'right'">
                    <template #avatar>
                      <el-tooltip class="item" effect="dark" :content="message.metadata.username || '用户'"
                        placement="left">
                        <Avatar class="sticky top-0" :role="message.role" :name="message.metadata.username || '用户'"
                          :time='formatAvatarTime(message)' :scrollContainer='chatContainerRef' />
                      </el-tooltip>
                    </template>
                    <template #top>
                      <div class="bubble-top-area">
                        <span class="name">{{ message.metadata.username || '用户' }}</span>
                        <span class="time">{{ formatAvatarTime(message) }}</span>
                      </div>
                    </template>
                    <div class="user-bubble text-left whitespace-pre-wrap break-words">{{ message.parts[0].text || ''
                    }}</div>
                  </OneBubble>
                </template>
                <template v-else>
                  <OneBubble :variant="'none'" :align="'left'" v-if='message.parts.length'>
                    <template #avatar>
                      <el-tooltip class="item" effect="dark" :content="message.metadata.name || 'AI助手'"
                        placement="right">
                        <Avatar class="sticky top-0" :role="message.role" :name="message.metadata.name"
                          :avatars="avatars" :time='formatAvatarTime(message)' :scrollContainer='chatContainerRef' />
                      </el-tooltip>
                    </template>
                    <template #top>
                      <div class="bubble-top-area">
                        <span class="name">{{ message.metadata.name || 'AI助手' }}</span>
                        <span class="time">{{ formatAvatarTime(message) }}</span>
                      </div>
                    </template>
                    <div v-for="(part, partIndex) in message.parts" :key="`${message.id}-${partIndex}`"
                      :class="{ gap: partIndex > 0 }">
                      <!-- 文本 -->
                      <OneMarkdownCard v-if="part.type === 'text'" :content="part.text" :enableMermaid="true" />
                      <!-- 思考 -->
                      <ReasoningNode v-else-if="part.type === 'reasoning'" :text="part.text" :state='part.state' />
                      <!-- 工具调用 -->
                      <div v-else-if="part.type === 'dynamic-tool' || part.type.startsWith('tool-')">
                        <ToolCallNode :part='part' :defaultExpanded="false" />
                      </div>
                      <!-- 步骤状态 -->
                      <StepNode
                        v-else-if="
                          part.type === 'step-start' &&
                          part.rawData &&
                          part.rawData.stepName &&
                          !part.rawData.isCompleted
                        "
                        :stepName="part.rawData.stepName"
                      />
                      <!-- 自定义事件 -->
                      <div v-else-if="part.type.startsWith('data-')" class="custom-part">
                        <!-- 意图识别失败、会话正在运行 -->
                        <OneMarkdownCard v-if="['data-intent_fail', 'data-session_running'].includes(part.type)"
                          :content="part.data" />
                        <!-- 交互组件 -->
                        <OneInteractionConfirm v-if="
                          part.type === 'data-suggested_action'
                          && showInteractionArea
                        " :showSuggestion="showSuggestionArea" :confirmText="interactionConfig.confirmText"
                          :confirmButtons="interactionConfig.confirmButtons"
                          :suggestionText="interactionConfig.suggestionText"
                          :suggestionButtons="interactionConfig.suggestionButtons" @confirm="handleInteractionConfirm"
                          @suggestion="handleInteractionConfirm"></OneInteractionConfirm>
                      </div>
                    </div>
                  </OneBubble>
                </template>
              </div>
            </div>
          </template>
        </div>
        <div class="bottom-space" />
        <!-- 锚点元素，用于丝滑滚动到底部 -->
        <div ref="bottomAnchorRef" />
      </div>
    </OneLayoutContent>
    <OneLayoutContent class="welcome-container flex justify-center items-center" v-else>
      <div class="w-full max-w-800px mx-auto px-2 box-border h-full">
        <slot name="welcome" />
      </div>
    </OneLayoutContent>
    <OneLayoutSender :class="[
      'layout-sender flex flex-col',
      isTextareaExpanded
        ? 'sender-expand'
        : ''
    ]">
      <!-- 缓解焦虑 -->
      <div class="loading-container w-full max-w-800px mx-auto box-border px-2 my-1"
        :class="{ 'mt-0': isTextareaExpanded }" v-if="showTerminateButton">
        <Typing text="正在生成中" />
      </div>
      <!-- 聊天底部 -->
      <div class="chat-footer z-100 w-full max-w-800px mx-auto box-border">
        <!-- 全屏 input 按钮 -->
        <div class="full-screen-input-btn" v-if="showTextareaExpandButton" @click="toggleTextareaExpanded">
          <TextareaExpandIcon :isTextareaExpanded="isTextareaExpanded" />
        </div>
        <OneInput placeholder="请输入您的问题..." :value="input" :maxLength="2000" @change="handleInputChange"
          @submit="handleInputEnter" :rows="1" :autosize="{ minRows: 1, maxRows: 12 }">
          <template #extra>
            <div class="input-foot-wrapper">
              <div class="input-foot-left">
                <el-tooltip v-if='false' class="item" effect="dark" placement="top">
                  <ul slot="content" class="m-0 px-1 text-xs">
                    <li class="list-disc">文件数量：最多 5 个</li>
                    <li class="list-disc">文件大小：单个最大 5 M</li>
                    <li class="list-disc" :style="{ maxWidth: '200px' }">
                      文件类型：pdf、txt、csv、docx、doc、xlsx、xls、png、jpeg、jpg</li>
                  </ul>
                  <el-button class="tool-btn" @click="handleAttachment">
                    <div class="btn-inner flex justify-center items-center">
                      <AttachmentIcon />
                      <span>附件</span>
                    </div>
                  </el-button>
                </el-tooltip>
              </div>
              <div class="input-foot-right">
                <!-- NOTE: 录音功能后端未实现, 目前隐藏此功能 -->
                <el-tooltip v-if='false' class="item" effect="dark" placement="top" :manual="true"
                  :value="tooltipVisible">
                  <div slot="content">{{ tooltipContent }}</div>
                  <el-button class="tool-btn offset" :title="tooltipContent"
                    @mouseenter.native="handleVoiceBtnHover(true)" @mouseleave.native="handleVoiceBtnHover(false)"
                    @click="isRecording ? stopRecording() : startRecording()" :disabled="showTerminateButton">
                    <!-- 录音动画 -->
                    <div v-if="isRecording" class="recording-animation" />
                    <!-- 静态图标 -->
                    <RecordIcon v-else />
                  </el-button>
                </el-tooltip>
                <!-- 终止按钮 -->
                <el-tooltip v-show="showTerminateButton" :disabled="!showTerminateButton" class="item relative"
                  effect="dark" placement="top" style="top: 2px;">
                  <div slot="content">终止</div>
                  <div>
                    <el-button class="operation-btn terminate-btn offset-2 flex justify-center items-center"
                      size="small" circle @click="handleTerminate">
                      <!-- :disabled="!isCurrentUserConversation" -->
                      <TerminateIcon />
                    </el-button>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </template>
          <template #button>
            <!-- 提交按钮 -->
            <el-tooltip v-show="showSubmitButton" :disabled="!showSubmitButton" class="item relative" effect="dark"
              placement="top" style="margin-left: 12px; top: 2px;">
              <div slot="content">提交</div>
              <div>
                <el-button type="primary" class="operation-btn submit-btn offset-2 flex justify-center items-center"
                  size="small" circle :disabled="submitButtonDisabled" :loading="status === 'submitted'"
                  @click="handleSubmitButtonClick">
                  <SubmitIcon />
                </el-button>
              </div>
            </el-tooltip>
          </template>
        </OneInput>
      </div>
    </OneLayoutSender>
  </OneLayout>
</template>

<script lang="ts">
// vue core
import {
  defineComponent,
  ref,
  computed,
  nextTick,
  watch,
  ExtractPropTypes,
  inject,
  onMounted,
  reactive,
} from '@vue/composition-api';

// api
import QueryAiService, { aiBaseURL } from '@/services/ai';

// utils
import { joinUrl, getRelativeChatTime, normalizeToSeconds } from '@/utils';
import { useWarningMessage, useErrorMessage } from '@/utils/notify';
import { cloneDeep } from 'lodash';

// ai core
import type { ChatRequestOptions, PrepareSendMessagesRequest } from '@coco-box/ai';
import { Chat } from '@coco-box/ai-vue-2';
import { AgUiHttpTransport } from '@coco-box/ai-ag-ui-adapter';

// hooks
import { useScroll } from './hooks/useScroll';
import { useAutoScroll } from './hooks/useAutoScroll';
import { useAiChatProps } from './hooks/useAiChatProps';
import { useHistory } from './hooks/useHistory';
import { useInteraction } from './hooks/useInteraction';
import { useExpandableTextarea } from './hooks/useExpandableTextarea';
import { useToBottomButton } from './hooks/useToBottomButton';
import { useVoiceChat } from './hooks/useVoiceChat';
import { checkAndExecuteAutoRun } from './utils/autoRunNextAgent';
import { useServerTime } from './hooks/useServerTime';

// components
import Avatar from './components/Avatar/index.vue';
import Typing from './components/Typing/index.vue';
import Loading from './components/Loading/index.vue';
import ReasoningNode from './components/bubbles/ReasoningNode/index.vue';
import ToolCallNode from './components/bubbles/ToolCallNode/index.vue';
import StepNode from './components/bubbles/StepNode/index.vue';
import ChevronDownIcon from './components/Icons/ChevronDownIcon.vue';
import TextareaExpandIcon from './components/Icons/TextareaExpandIcon.vue';
import AttachmentIcon from './components/Icons/AttachmentIcon.vue';
import RecordIcon from './components/Icons/RecordIcon.vue';
import TerminateIcon from './components/Icons/TerminateIcon.vue';
import SubmitIcon from './components/Icons/SubmitIcon.vue';

export { useAiChatProps };

export default defineComponent({
  name: 'AiChat',
  components: {
    Avatar,
    Typing,
    Loading,
    ToolCallNode,
    ReasoningNode,
    StepNode,
    ChevronDownIcon,
    TextareaExpandIcon,
    AttachmentIcon,
    RecordIcon,
    TerminateIcon,
    SubmitIcon,
  },
  props: useAiChatProps,
  defineEmits: ['messageFinish', 'terminateError', 'terminateSuccess', 'chatInfoChange'],
  setup(props: ExtractPropTypes<typeof useAiChatProps>, { emit }) {
    const queryAiService = new QueryAiService();
    // 当前 aiConfig 配置
    const aiConfig = inject('aiConfig', {}) as any;
    const currentAgent = computed(() => {
      return {
        "agentName": "IT应急知识库问答",
        "urlRouter": "default",
        "appId": "permission_application_xiaoyi_00",
        "flowId": "xiaoyi_items_flow_00000000000000",
        "businessId": "1d0bfa7d57abb800a6dd55f22275ef14",
      }
    }); // 获取当前的agent信息
    // 连接状态
    const connectionInfo = reactive({
      status: 'init', // init | error | success
      initText: '与服务器连接中，请稍后...',
      errorText: '与服务器连接失败，请刷新页面后重试',
    });
    const aiChatRef = ref<HTMLElement | null>(null); // 组件根节点Ref
    // 聊天信息
    const chatInfo = ref({
      session_id: '',
      error: '',
      is_first_dialog: true, // 是否是首次对话
    });
    const chatContainerRef = ref<HTMLElement | null>(null); // 聊天容器Ref
    const messageListRef = ref<HTMLElement | null>(null); // 消息列表Ref

    // 交互 hooks
    const {
      interactionConfig,
      showInteractionArea,
      showSuggestionArea,
      handleInteractionConfirm,
      updateInteractionState,
    } = useInteraction(
      (value: any) => {
        input.value = value.submitText ? value.submitText : value.text;
        handleSubmitButtonClick();
      },
      () => {
        setTimeout(() => {
          tryAutoScroll();
        });
      },
    );

    // 聊天 hooks
    const input = ref('');
    const chat = new Chat({
      transport: new AgUiHttpTransport({
        api: '',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        prepareSendMessagesRequest: (({ messages, trigger, body }) => {
          const api = joinUrl(aiBaseURL, 'session/start', chatInfo.value.session_id);
          switch (trigger) {
            case 'submit-message': {
              const lastMessage = messages[messages.length - 1];
              console.log('submit-message');
              // 更新 is_first_dialog 状态
              if (chatInfo.value.is_first_dialog) {
                chatInfo.value.is_first_dialog = false;
              }

              // 只向服务器发送最后一条消息以限制请求大小:
              return {
                body: {
                  ...body,
                  user_id: aiConfig.userInfo.id,
                  query: lastMessage.parts[0]?.text,
                  inputs: {},
                },
                api,
              };
            }
            default:
              return { body: {}, api };
          }
        }) as PrepareSendMessagesRequest<any>,
        onUpdate: () => {
          tryAutoScroll(false, 'auto');
        },
        onResponse: async (response) => {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const json = await response.json();
            if (json.code !== 200) {
              throw new Error(json.message || '请求失败');
            }
          }
        },
      }),
      onError: (error) => {
        console.log('onError', error);
        useErrorMessage(error.message);
      },
      onFinish: async ({ messages }) => {
        console.log('onFinish', messages);
        // // 重置对话中的状态
        // isConversationRunning.value = false;
        updateInteractionState(messages);

        // 检查是否需要自动运行下一个智能体
        const needAutoRun = await checkAndExecuteAutoRun(cloneDeep(messages), {
          input,
          handleSubmitButtonClick
        });
        if (!needAutoRun) {
          emit('messageFinish', {
            historyMessages: [...historyMessages.value],
            currentMessages: [...messages],
          });
        }
      }
    }) as {
      messages: any[];
      status: 'submitted' | 'streaming' | 'ready' | 'error';
      sendMessage: any,
      stop: any,
    };

    const _origReplaceMessage = (chat as any).state.replaceMessage.bind((chat as any).state);
    (chat as any).state.replaceMessage = (index: number, message: any) => {
      _origReplaceMessage(index, {
        ...message,
        parts: message.parts?.map((p: any) => ({ ...p })) ?? message.parts,
      });
    };

    const status = ref(chat.status);
    watch(
      () => chat.status,
      (val) => {
        status.value = val;
      }
    );
    // 滚动监听, 滚动到顶部时, 加载历史消息
    const { isScrolling, y, directions, distanceToBottom } = useScroll(chatContainerRef);

    // 点击滑动到底部的按钮
    const { toBottomButtonRef, showToBottomButton } = useToBottomButton(distanceToBottom);

    // 历史消息 hooks
    const {
      historyMessages,
      showLoadingHistory,
      handleLoadHistory,
      serverTimestamp,
    } = useHistory(props, chatContainerRef, chatInfo, isScrolling, y, directions);
    // 监听第一次历史消息加载完成, 用 watch 的 stop 来停止监听
    const stopHistoryMessageWatch = watch(() => historyMessages.value, (messages: any[]) => {
      if (messages.length > 0) {
        updateInteractionState(messages);
        stopHistoryMessageWatch();
      }
    });

    // 同步服务端时间
    const {
      getServerNow,
    } = useServerTime(serverTimestamp);

    // 所有消息
    const allMessages = computed(() => [...historyMessages.value, ...chat.messages]);

    // 锚点元素Ref
    const bottomAnchorRef = ref<HTMLElement | null>(null);
    const { tryAutoScroll } = useAutoScroll(chatContainerRef, bottomAnchorRef, status);

    // 计算提交按钮显示状态
    const showSubmitButton = computed(() => (status.value === 'ready' || status.value === 'error'));
    // 计算提交按钮禁用状态
    const submitButtonDisabled = computed(() => {
      if (status.value === 'submitted') return true;
      return !input.value.trim();
    });
    // 计算终止按钮显示状态
    const showTerminateButton = computed(() => status.value === 'streaming' || status.value === 'submitted');

    // 处理终止
    const handleTerminate = async () => {
      const res = await queryAiService.terminateChat({
        chatId: chatInfo.value?.session_id ?? '',
        user_id: aiConfig.userInfo.id,
      });
      if (res.success) {
        chat.stop();
        await nextTick();
        await nextTick();
        emit('terminateSuccess');
        return true;
      }
      emit('terminateError', new Error(`终止失败, ${res?.msg}`));
      console.error(`终止失败, ${res?.msg}`);
      return false;
    };

    // 处理输入回车
    const handleInputEnter = async (
      event?: { preventDefault?: () => void; shiftKey?: boolean },
    ) => {
      // 如果不是当前用户主动发的消息，则不让发消息
      // if (!isCurrentUserConversation.value) return;
      // 如果正在进行中, 则终止请求
      if (!showSubmitButton.value) {
        if (!input.value.trim()) return;
        const result = await handleTerminate();
        if (result) {
          handleSubmitButtonClick(event);
        }
      } else {
        handleSubmitButtonClick(event);
      }
    };

    // 展开输入框相关逻辑
    const {
      currentActualRows,
      showTextareaExpandButton,
      isTextareaExpanded,
      toggleTextareaExpanded,
      resetTextareaExpandState,
    } = useExpandableTextarea();

    // 处理输入变化
    const handleInputChange = (inputValue: string, actualRows: number) => {
      input.value = inputValue;
      currentActualRows.value = actualRows;
    };

    // 对外暴露的发送消息方法
    const sendMessage = (message: any) => {
      if (showSubmitButton.value) {
        input.value = message;
        handleSubmitButtonClick();
      }
    };

    // 获取会话信息
    const getChatInfo = async (): Promise<[string | null, typeof chatInfo.value | null]> => {
      try {
        const response = await queryAiService.createSession({
          user_id: aiConfig.userInfo.id,
          flow_id: currentAgent.value.flowId,
          business_id: currentAgent.value.businessId,
          app_id: currentAgent.value.appId,
        });
        if (response && response.code === 200 && response.data?.session_id) {
          return [null, response.data];
        }
        return [response?.data?.error || '出错了', null];
      } catch (error: any) {
        console.error('创建连接失败，请稍后再试。', error);
        return [error?.toString() || '出错了', null];
      }
    };
    // 更新聊天信息
    const updateChatInfo = (data: typeof chatInfo.value, source: 'init' | 'refresh' = 'init') => {
      chatInfo.value = data;
      chatInfo.value.is_first_dialog = data.is_first_dialog ?? true;
      emit('chatInfoChange', data, source);
    };

    const formatAvatarTime = (message: any) => {
      const localTimestamp = normalizeToSeconds(Date.now());
      const chatTimestamp = message?.metadata?.createdAt || message?.metadata?.runStartedTimestamp;

      return getRelativeChatTime({
        messageTimestamp: chatTimestamp || localTimestamp!,
        serverNow: getServerNow() || localTimestamp!
      });
    };

    // 处理提交按钮点击
    const handleSubmitButtonClick = (
      event?: { preventDefault?: () => void; shiftKey?: boolean },
      // https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#send-message
      options?: ChatRequestOptions,
    ) => {
      // 如果是 shift + 回车，不触发发送
      if (event?.shiftKey) {
        return;
      }
      if (status.value === 'streaming') {
        // 终止请求
        chat.stop();
      } else if (['error', 'ready'].includes(status.value)) {
        // 发送之前把 input 全屏状态清空
        resetTextareaExpandState();
        // 发送
        onSubmit(event, options);
      }
    };

    // 语音 hooks
    const {
      isRecording, // 是否正在录音
      startRecording, // 开始录音
      stopRecording, // 停止录音
      tooltipVisible, // 是否显示 el-tooltip
      tooltipContent, // 语音按钮提示内容
      toggleRecording, // 切换录音状态
      handleVoiceBtnHover, // 处理语音按钮悬停
    } = useVoiceChat({
      maxDuration: 30,
      onText: (text) => {
        // 解析完文字后, 往 input 中写入文字
        input.value += text;
      },
    });

    // 处理提交
    const onSubmit = (
      event?: { preventDefault?: () => void },
      options?: ChatRequestOptions,
    ) => {
      nextTick(() => {
        tryAutoScroll();
      });
      event?.preventDefault?.();

      const message = input.value ? {
        text: input.value,
        metadata: {
          name: aiConfig.userInfo.id,
          createdAt: normalizeToSeconds(Date.now()),
          username: aiConfig.userInfo.name,
        },
      } : null;

      chat.sendMessage(
        message,
        options,
      );
      // 清空输入框
      input.value = '';

      // 清空附件列表
      // attachments.value = [];
      showInteractionArea.value = false;
    };

    onMounted(async () => {
      const [error, data] = await getChatInfo();
      if (error) {
        console.error(connectionInfo.errorText, error);
        useWarningMessage(connectionInfo.errorText);
        connectionInfo.status = 'error';
      } else {
        connectionInfo.status = 'success';
        chatInfo.value.is_first_dialog = data!.is_first_dialog ?? true;
        updateChatInfo(data!);
      }
      if (!chatInfo.value.is_first_dialog) {
        await handleLoadHistory();
        nextTick(() => {
          tryAutoScroll(undefined, 'auto');
        });
      }
    });

    return {
      chatInfo,

      input,
      status,
      allMessages,

      // 自动滚动到最底部
      tryAutoScroll,

      // 点击滑动到底部的按钮
      toBottomButtonRef,
      showToBottomButton,

      showSubmitButton,
      submitButtonDisabled,
      showTerminateButton,

      interactionConfig,
      showInteractionArea,
      showSuggestionArea,
      handleInteractionConfirm,

      handleInputChange,
      handleTerminate,

      chatContainerRef,
      messageListRef,
      currentActualRows,
      showTextareaExpandButton,
      isTextareaExpanded,
      toggleTextareaExpanded,

      showLoadingHistory,

      bottomAnchorRef,
      aiChatRef,
      sendMessage,
      formatAvatarTime,
      handleSubmitButtonClick,
      handleInputEnter,

      isRecording, // 是否正在录音
      startRecording, // 开始录音
      stopRecording, // 停止录音
      tooltipVisible, // 是否显示 el-tooltip
      tooltipContent, // 语音按钮提示内容
      toggleRecording, // 切换录音状态
      handleVoiceBtnHover, // 处理语音按钮悬停

      currentAgent,
      aiConfig,
    };
  },
});
</script>

<style scoped lang="scss">
$headerHeight: 48px;

.recording-animation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  &:before,
  &:after {
    content: '';
    position: absolute;
    border-radius: 50%;
    animation: pulsOut 1.8s ease-in-out infinite;
    filter: drop-shadow(0 0 3px rgba(0, 17, 255, 0.734));
  }

  &:before {
    width: 100%;
    padding-bottom: 100%;
    box-shadow: inset 0 0 0 3px #0011ff;
    animation-name: pulsIn;
  }

  &:after {
    width: calc(100% - 6px);
    padding-bottom: calc(100% - 6px);
    box-shadow: 0 0 0 0 #0011ff;
  }
}

@keyframes pulsIn {
  0% {
    box-shadow: inset 0 0 0 3px #0011ff;
    opacity: 1;
  }

  50%,
  100% {
    box-shadow: inset 0 0 0 0 #0011ff;
    opacity: 0;
  }
}

@keyframes pulsOut {

  0%,
  50% {
    box-shadow: 0 0 0 0 #0011ff;
    opacity: 0;
  }

  100% {
    box-shadow: 0 0 0 3px #0011ff;
    opacity: 1;
  }
}

// 最外层容器
.ai-chat-container {
  display: flex;
  flex-direction: column;
  // justify-content: space-between;
  height: 100%;
  background-color: var(--hatech-base-background-color);
  border: none;
  border-top: 1px solid var(--hatech-base-border-color-shallow);
  border-radius: 0;
  box-sizing: border-box;
  color: var(--hatech-base-font-color);
  overflow: hidden;

  // 聊天头部
  .ai-header {
    height: $headerHeight;
    padding: 12px 20px;
    background: var(--hatech-base-fill-color-nav-hover);
    border-width: 0 0 1px 0;
    border-style: solid;
    border-color: var(--hatech-base-border-color-shallow);
    color: var(--hatech-base-font-color);
    font-size: 16px;
    font-weight: 500;

    ::v-deep {
      .show-filtered-agent {
        position: absolute;
        top: 0;
        right: 40px;
        max-width: 300px;
        height: 32px;

        .agent-item {
          font-size: 14px;
          line-height: 22px;
          color: var(--hatech-base-font-color);
          font-weight: 350;

          .agent-color {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 999px;
            overflow: hidden;
          }
        }
      }

      .filter-agent-input {
        .el-input {
          input {
            text-align: right;
            border: none;
            background: transparent;
            box-shadow: none !important;

            &::placeholder {
              color: transparent !important;
            }
          }
        }

        .el-tag {
          background: transparent !important;

          i {
            display: none !important;
          }
        }

        .el-select__tags {
          visibility: hidden !important;
        }
      }
    }
  }

  // 聊天主内容区
  .layout-content-container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;

    // transition: all 0.3s ease-in-out;
    &.content-shrink {
      flex: 0;
      opacity: 0;
    }

    .to-bottom-button {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      position: absolute;
      z-index: 10;
      left: 50%;
      transform: translateX(-50%);
      bottom: 20px;
      cursor: pointer;
      border: 1px solid var(--hatech-base-border-color);
      border-radius: 999px;
      background: var(--hatech-base-background-color);

      svg {
        color: #666666;
      }

      &:hover {
        box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
      }

      &.streaming {
        border-color: #4151ff75;

        svg {
          color: #4150ff;
        }

        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: 999px;
          animation: spin 1s linear infinite;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
          box-shadow: 0 -1px 0 #4150ff;
        }

        50% {
          transform: rotate(180deg);
          box-shadow: 0 -1px 0 #4150ff;
        }

        100% {
          transform: rotate(360deg);
          box-shadow: 0 -1px 0 #4150ff;
        }
      }
    }

    .chat-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;

      ::v-deep {

        .top-space,
        .bottom-space {
          height: 20px;
        }
      }

      .message-list {
        display: flex;
        flex-direction: column;
        gap: 40px;
      }

      .message-content {
        .gap {
          margin-top: 8px;
        }

        ::v-deep {
          .one-bubble-content-container {
            max-width: calc(100% - 44px);
          }

          .one-bubble-avatar-image-wrapper {
            padding: 6px;
          }

          .one-bubble-right {
            .bubble-top-area {
              text-align: right;
              justify-content: flex-end;
            }

            .one-bubble-content {
              display: flex;
              justify-content: flex-end;
            }
          }

          .one-bubble-left {
            .bubble-top-area {
              text-align: left;
              justify-content: flex-start;
            }
          }
        }

        .user-bubble {
          font-size: 14px;
          font-weight: 350;
          line-height: 22px;
          border-radius: 8px;
          color: var(--hatech-base-font-color);
          background: linear-gradient(0deg, rgba(65, 80, 255, 0.08), rgba(65, 80, 255, 0.08)),
            var(--custom-button-default-touch-background);
          padding: 8px 12px;
        }

        .bubble-top-area {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 0 0 4px 0;

          .name {
            font-size: 12px;
            font-weight: 350;
            line-height: 18px;
            color: var(--hatech-base-font-color-secondary-info);
            letter-spacing: normal;
          }

          .time {
            font-size: 12px;
            color: var(--hatech-base-font-color-secondary-info);
          }
        }

        .node-bottom-area {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;

          .icon-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            cursor: pointer;

            &:hover {
              background-color: #f0f0f0;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }

  // 欢迎区
  .welcome-container {
    &.content-shrink {
      flex: 0;
      opacity: 0;
    }
  }

  // 聊天发送区
  .layout-sender {

    // transition: height 0.3s ease-in-out;
    &.sender-expand {
      margin-top: 20px;
      flex: 1;

      .chat-footer {
        height: 100%;

        ::v-deep {

          .one-input,
          .one-textarea,
          .one-input-content {
            height: 100% !important;
          }
        }
      }
    }

    .chat-footer {
      background-color: transparent;
      padding: 0 20px 20px;
      position: relative;

      .full-screen-input-btn {
        position: absolute;
        right: 30px;
        top: 10px;

        ::v-deep {
          .resize-input {
            width: 20px;
            height: 20px;
            cursor: pointer;
            fill: #666;

            &:hover {
              fill: var(--hatech-base-font-color);
            }
          }
        }
      }

      ::v-deep {
        .one-input-foot {
          height: auto;
          margin-top: 10px;
        }
      }

      .input-foot-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 100%;

        ::v-deep {
          .el-button {
            height: auto;
          }
        }

        .tool-btn {
          min-width: 0;
          padding: 8px 10px;
          border: 1px solid #d8d9e6;
          border-radius: 10px;

          &:focus {
            background-color: transparent !important;
          }

          &.offset {
            position: relative;
            top: 4px;
          }

          .btn-inner {
            gap: 6px;

            span {
              color: var(--hatech-base-font-color-secondary-text);
              font-size: 14px;
              font-weight: 500;
              line-height: 22px;
            }
          }

          &.el-button:focus,
          &.el-button:hover {
            color: var(--hatech-base-font-color);
            background-color: rgba(0, 0, 0, 0.04);
          }

          ::v-deep {
            i {
              font-size: 16px;
              color: #4d4d4d;
            }
          }
        }

        .input-foot-left {
          display: flex;
          align-items: center;
          gap: 8px;

          i {
            font-size: 18px;
            color: #666;
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
              color: #409eff;
            }
          }

          span {
            font-size: 14px;
            color: var(--hatech-base-font-color);
            cursor: pointer;
          }
        }

        .input-foot-right {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;

          .tool-btn {
            background-color: transparent;
            border: none;

            ::v-deep i {
              font-size: 20px;
            }
          }

          ::v-deep {

            .el-button+.el-button,
            .el-checkbox.is-bordered+.el-checkbox.is-bordered {
              margin-left: 0px;
            }
          }
        }
      }

      .el-button.operation-btn {
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;

        ::v-deep {
          i {
            font-size: 16px;
          }

          .offset {
            position: relative;
            top: 1px;
          }

          &.offset {
            position: relative;
            top: 4px;
          }

          &.offset-1 {
            position: relative;
            top: 1px;
          }

          &.offset-2 {
            position: relative;
            top: 2px;
          }
        }

        // & + .operation-btn {
        //   margin-left: 12px;
        // }
      }

      ::v-deep {
        .operation-btn.el-button {
          background-color: #eaebf1;
        }

        .operation-btn.el-button:focus,
        .operation-btn.el-button:hover {
          background-color: #eaebf1;
        }

        .operation-btn.el-button.is-disabled,
        .operation-btn.el-button.is-disabled:active,
        .operation-btn.el-button.is-disabled:focus,
        .operation-btn.el-button.is-disabled:hover {
          background-color: #c0c5fc;
        }

        .operation-btn.el-button--primary,
        .operation-btn.el-button--primary:hover,
        .operation-btn.el-button--primary:focus {
          background-color: #4150ff;
        }

        .operation-btn.el-button.terminate-btn {
          color: #4d4d4d;

          &.is-disabled {
            background-color: #eaebf1;
            color: #999;
          }
        }
      }
    }
  }
}
</style>

<style lang='scss' scoped>
::v-deep {
  .hatech-think-block-content {
    border-left: 1px solid var(--hatech-base-border-color);
    padding-left: 8px;
  }

  .operation-btn {
    .el-btn-content {
      display: flex;
    }
  }
}
</style>
