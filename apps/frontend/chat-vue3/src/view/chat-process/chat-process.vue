<template>
  <div
    ref="conversationRef"
    class="conversation-area mc-scroll-overlay"
  >
    <div class="chat-list">
      <template
        v-for="(msg, idx) in chatMessageStore.messages"
        :key="idx"
      >
        <template v-if="msg.role === 'user'">
          <McBubble
            :align="'right'"
            :content="msg.parts?.[0]?.text ?? ''"
            :variant="'filled'"
          >
            <template #top>
              <div class="bubble-top-area">
                <span>用户</span>
              </div>
            </template>
          </McBubble>
        </template>
        <template v-else>
          <McBubble
            v-for="(part, partIdx) in msg.parts"
            :key="msg.id + partIdx + part.type"
            :align="'left'"
            :variant="'none'"
            :avatar-config="partIdx === 0 ? {
              ...aiModelAvatar,
              displayName: msg.metadata?.name ?? 'AI助手',
            } : {}"
          >
            <template #top>
              <div
                v-if="partIdx === 0"
                class="bubble-top-area"
              >
                <span>{{ msg.metadata?.name ?? 'AI助手' }}</span>
              </div>
            </template>
            <!-- 文本 -->
            <McMarkdownCard
              v-if="part.type === 'text'"
              :content="part.text"
              :theme="themeStore.theme"
              :md-plugins="mdPlugins"
              :enable-mermaid="true"
            />
            <!-- 思考 -->
            <div
              v-else-if="part.type === 'reasoning'"
              class="hatech-think-block"
              :data-thinking="`${msg.id}_${idx}_${partIdx}`"
            >
              <div
                class="think-toggle-btn"
                @click="toggleThink(msg, idx, part, partIdx)"
              >
                <i class="icon-point" />
                <span>{{ part.state === 'streaming' ? '思考中...' : '思考过程' }}</span>
                <i :class="btnIcon" />
              </div>
              <div class="hatech-think-block-content">
                <McMarkdownCard
                  :content="part.text"
                  :theme="themeStore.theme"
                  :enable-think="true"
                />
              </div>
            </div>
            <!-- 工具调用 -->
            <div
              v-else-if="part.type === 'dynamic-tool' || part.type.startsWith('tool-')"
              class="tool-part"
            >
              <div class="tool-line">
                <span class="label">工具</span>
                <span
                  v-if="(part as any).type"
                  class="mono"
                >{{ (part as any).type }}</span>
                <span class="label small">状态</span>
                <span class="mono">{{ (part as any).state }}</span>
              </div>
              <div
                v-if="(part as any).input !== undefined"
                class="tool-block"
              >
                <div class="label">
                  入参
                </div>
                <pre>{{ (part as any).input }}</pre>
              </div>
              <div
                v-if="(part as any).output !== undefined"
                class="tool-block"
              >
                <div class="label">
                  输出
                </div>
                <pre>{{ (part as any).output }}</pre>
              </div>
              <div
                v-if="(part as any).errorText"
                class="tool-block error"
              >
                <div class="label">
                  错误
                </div>
                <pre>{{ (part as any).errorText }}</pre>
              </div>
            </div>
            <!-- 自定义事件 -->
            <div
              v-else-if="part.type.startsWith('data-')"
              class="custom-part"
            >
              <div class="custom-line">
                <span class="label">自定义事件</span>
                <span class="mono">事件类型: {{ part.type }}</span>
              </div>
              <div class="custom-block">
                <pre>{{ part.data }}</pre>
              </div>
            </div>
            <template #bottom>
              <div
                v-if="part.state === 'done'"
                class="bubble-bottom-operations"
              >
                <i class="icon-copy-new" />
                <i class="icon-like" />
                <i class="icon-dislike" />
              </div>
            </template>
          </McBubble>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatHistoryStore, useChatMessageStore, useThemeStore, useChatStatusStore, useChatModelStore } from '@/store';
import type { IMessageAvatar } from "../../types/type-chat-view";
import { nextTick, ref, watch } from 'vue';
import dayjs from "dayjs";

import { katex } from '@mdit/plugin-katex';
import PlantUml from 'markdown-it-plantuml';

const mdPlugins = ref([
  {
    plugin: katex,
  },
  {
    plugin: PlantUml,
    opts: {
      server: 'https://www.plantuml.com/plantuml'
    },
  }
]);
const aiModelAvatar: IMessageAvatar = {
  imgSrc: "../../assets/svg/logo.svg",
  width: 32,
  height: 32,
};

const chatMessageStore = useChatMessageStore();
const chatHistoryStore = useChatHistoryStore();
const chatStatusStore = useChatStatusStore();
const chatModelStore = useChatModelStore();
const themeStore = useThemeStore();

const conversationRef = ref();

// 自动滚动到底部
function scrollToBottom() {
  nextTick(() => {
    conversationRef.value?.scrollTo({
      top: conversationRef.value.scrollHeight,
      behavior: 'smooth',
    });
  });
}

watch(
  () => chatMessageStore.messages,
  () => {
    scrollToBottom();
    if (chatHistoryStore.activeHistoryId) {
      chatHistoryStore.addHistory(
        chatStatusStore.currentChatId,
        dayjs().format("YYYY-MM-DD HH:mm"),
        chatMessageStore.messages,
        chatModelStore.currentModel
      );
    }
  },
  {
    deep: true,
  }
);

const btnIcon = ref('icon-chevron-up-2');
const toggleThink = (msg: any, idx: number, part: any, partIdx: number) => {
  if (part.state === 'streaming') {
    return;
  }
  const targetNode = document.querySelector(`.hatech-think-block[data-thinking="${msg.id}_${idx}_${partIdx}"]`);
  if (targetNode) {
    const thinkBlock = targetNode.querySelector('.hatech-think-block-content') as HTMLElement;
    if (thinkBlock) {
      const currentDisplay = getComputedStyle(thinkBlock).display;
      thinkBlock.style.display = currentDisplay === 'none' ? 'block' : 'none';
      btnIcon.value = currentDisplay === 'none' ? 'icon-chevron-up-2' : 'icon-chevron-down-2';
    }
  }
};
</script>

<style scoped lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.conversation-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
  padding-top: 20px;

  .chat-list {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 12px;
    :deep(.mc-bubble .mc-bubble-content-container) {
      max-width: calc(100% - 32px);
    }
    :deep(.mc-markdown-render ) {
      .h1, .h2, .h3, .h4, .h5, .h6, h1, h2, h3, h4, h5, h6 {
        line-height: 2;
      }
    }

    &>* {
      margin-top: 8px;
    }

    .mc-bubble-right .bubble-top-area {
      text-align: right;
    }

    .mc-bubble-left .bubble-top-area {
      text-align: left;
    }

    .think-toggle-btn {
      display: flex;
      gap: 8px;
      align-items: center;
      border-radius: 10px;
      padding: 7px 10px;
      margin-bottom: 12px;
      width: fit-content;
      cursor: pointer;
      background-color: devui.$devui-area;

      &:hover {
        background-color: var(--devui-btn-common-bg-hover);
      }
    }

    :deep(.hatech-think-block-content) {
      border-left: 1px solid devui.$devui-line;
      padding-left: 8px;
    }

    .custom-part {
      background: #ffc21b;
      border: 1px dashed #cfd8dc;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;

      .custom-line {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.35rem;
      }

      .custom-block {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.5rem;
        margin-top: 0.35rem;
      }

      .custom-block pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
      }
    }
  }

  .bubble-bottom-operations {
    margin-top: 8px;

    i {
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: devui.$devui-gray-10;
      }
    }
  }
}

body[ui-theme='galaxy-theme'] {
  .conversation-area {
    :deep() {
      .mc-bubble-content.filled {
        background-color: devui.$devui-base-bg;
      }
    }
  }
}

.tool-part {
  background: #f5f7fa;
  border: 1px dashed #cfd8dc;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;

  .tool-line {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.35rem;
    font-size: 12px;
    color: #555;
  }

  .label {
    color: #666;
    font-size: 12px;
    margin-right: 4px;
  }

  .label.small {
    opacity: 0.8;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
  }

  .tool-block {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
    margin-top: 0.35rem;
  }

  .tool-block.error {
    border-color: #fecaca;
    background: #fff1f2;
  }

  .tool-block pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
  }
}
</style>
