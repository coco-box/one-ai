<template>
  <div
    :class="['history-list-container', !commonStore.isExpand && 'not-expand']"
  >
    <div class="history-header">
      <div class="history-header-left">
        <span class="history-title">{{ $t("history.applicationFlowName") }}：{{ routerQueryParams.flowName }}</span>
      </div>
    </div>
    <d-search
      v-model="searchKey"
      is-keyup-search
      icon-position="left"
      :placeholder="$t('history.searchChat')"
      :show-glow-style="false"
      class="history-search"
      @search="onSearch"
    />
    <div :class="['history-list-box', !renderList.length && 'empty']">
      <template v-for="(item, index) in renderList" :key="index">
        <Collapse v-model="item.expand" :title="item.title">
          <HistoryItem
            v-for="(val, i) in item.list"
            :key="i"
            :itemData="val"
            :class="{
              active: val.chatId === chatHistoryStore.activeHistoryId,
            }"
            @click="() => onHistoryClick(val)"
            @delete="() => onHistoryDelete(val)"
          />
        </Collapse>
      </template>
      <div v-if="!renderList.length && !sessionList.length && !isLoading" class="history-list-empty">
        <img :src="themeStore.theme === 'light' ? NoDataPng : NoDataDarkPng" />
        <span>{{ $t("noData") }}</span>
      </div>
    </div>
    
    <!-- 会话历史列表区域 -->
    <div class="session-history-section">
      <div class="session-header">
        <div class="session-header-left">
          <span class="session-title">会话历史</span>
        </div>
        <div class="session-actions">
          <button class="action-btn secondary" @click="refreshSessions" :disabled="isLoading">刷新</button>
        </div>
      </div>
      
      <!-- 会话列表 -->
      <div class="session-list" v-if="sessionList.length">
        <div 
          v-for="session in sessionList" 
          :key="session.sessionId"
          class="session-item"
          @click="() => viewSession(session)"
        >
          <div class="session-info">
            <div class="session-flow-name">{{ session.flowName }}</div>
            <div class="session-id">ID: {{ session.sessionId }}</div>
            <div class="session-status">
              <span class="run-status" :class="getStatusClass(session.status)">{{ session.runStatus }}</span>
              <span class="chat-status">{{ session.chatStatus }}</span>
            </div>
          </div>
          <div class="session-time">
            {{ formatTime(session.updateTime || session.createTime) }}
          </div>
        </div>
      </div>
      
      <div v-else-if="isLoading" class="session-loading">
        <span>加载中...</span>
      </div>
      
      <div v-else-if="!renderList.length" class="session-empty">
        <img :src="themeStore.theme === 'light' ? NoDataPng : NoDataDarkPng" />
        <span>暂无会话历史</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance, onMounted } from "vue";
import { Collapse } from "@/components";
import {
  useChatHistoryStore,
  useChatMessageStore,
  useChatStatusStore,
  useThemeStore,
  useCommonStore,
} from "@/store";
import { useSessionList } from "@/hooks";
import type { CategorizedHistoryItem, IHistoryItem } from "@/types";
import { getHistoryTitle } from "@/utils";
import { useI18n } from "vue-i18n";
import { useRouter } from 'vue-router';
import HistoryItem from "./history-item.vue";
import NoDataPng from "../../assets/imgs/no-data.png";
import NoDataDarkPng from "../../assets/imgs/no-data-dark.png";

const router = useRouter();
const routerQueryParams = ref<any>({});
routerQueryParams.value = router.currentRoute.value.query;
const { t } = useI18n();
const chatHistoryStore = useChatHistoryStore();
const chatMessageStore = useChatMessageStore();
const chatStatusStore = useChatStatusStore();
const themeStore = useThemeStore();
const commonStore = useCommonStore();

// 使用会话列表hooks
const {
  sessionList,
  isLoading,
  error,
  updateSessionList,
  refreshSessionList,
  viewSession,
  getHistorySession
} = useSessionList();

const { proxy } = getCurrentInstance();
const searchKey = ref("");
const renderList = ref<CategorizedHistoryItem[]>([]);
let categorizedHistoryList: CategorizedHistoryItem[] = [];

const onSearch = (e: string) => {
  if (e) {
    const res = [];
    for (let i = 0; i < categorizedHistoryList.length; i++) {
      const item = { ...categorizedHistoryList[i] };
      for (let j = 0; j < item.list.length; j++) {
        item.list = item.list.filter((listItem) =>
          listItem.messages?.[0]?.parts?.[0]?.text?.includes(e)
        );
        item.list.length && res.push(item);
      }
    }
    renderList.value = res;
  } else {
    renderList.value = categorizedHistoryList;
  }
};
const onHistoryClick = (e: IHistoryItem) => {
  chatHistoryStore.setActiveHistoryId(e.chatId);
  chatStatusStore.currentChatId = e.chatId;
  chatMessageStore.setMessages(e.messages);
};
const onHistoryDelete = (e: IHistoryItem) => {
  chatHistoryStore.deleteHistory(e.chatId);
  proxy.$notificationService.open({
    type: "success",
    title: t("history.deleteHistoryTipTitle"),
    content: t("deleteSuccess"),
  });
  if (chatStatusStore.currentChatId === e.chatId) {
    chatStatusStore.startChat = false;
    chatMessageStore.messages = [];
  }
};
const updateCategorizedHistoryList = () => {
  const map: Record<
    CategorizedHistoryItem["updateDate"],
    CategorizedHistoryItem
  > = {};
  for (let i = 0; i < chatHistoryStore.historyList.length; i++) {
    const item = chatHistoryStore.historyList[i];
    if (map[item.updateDate]) {
      map[item.updateDate].list.push(item);
    } else {
      map[item.updateDate] = {
        title: getHistoryTitle(item.updateDate),
        updateDate: item.updateDate,
        updateTime: item.updateTime,
        expand: true,
        list: [item],
      };
    }
  }
  categorizedHistoryList = Object.values(map);
};

// 刷新会话列表
const refreshSessions = () => {
  const flowId = routerQueryParams.value.flow_id || 'all';
  refreshSessionList(flowId);
};

// 格式化时间显示
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};

// 获取状态样式类名
const getStatusClass = (status: number) => {
  switch (status) {
    case 0:
      return 'status-created';
    case 1:
      return 'status-running';
    default:
      return 'status-stopped';
  }
};

// 监听路由参数变化，更新会话列表
watch(
  () => routerQueryParams.value.flow_id,
  (newFlowId) => {
    if (newFlowId) {
      updateSessionList(newFlowId);
    }
  },
  { immediate: true }
);

watch(
  chatHistoryStore.historyList,
  () => {
    searchKey.value = "";
    updateCategorizedHistoryList();
    onSearch("");
  },
  { immediate: true }
);

// 组件挂载时获取会话列表和会话历史
onMounted(async () => {
  const flowId = routerQueryParams.value.flow_id || 'all';
  updateSessionList(flowId);
  
  // 如果URL中有session_id参数，则获取该会话的历史记录
  const sessionId = routerQueryParams.value.session_id;
  if (sessionId) {
    try {
      await getHistorySession(sessionId);
      console.log('已加载会话历史：', sessionId);
    } catch (err) {
      console.error('获取会话历史失败：', err);
    }
  }
});
</script>

<style scoped lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.history-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 240px;
  max-width: 380px;
  width: 25%;
  height: 100%;
  padding: 12px;
  color: devui.$devui-text;
  transition: all 0.3s ease-in-out;

  &.not-expand {
    width: 0;
    min-width: 0;
    padding: 0;
    opacity: 0;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .history-header-left,
    .history-header-right {
      display: flex;
      align-items: center;
    }
  }

  .history-title {
    font-size: var(--devui-font-size-lg, 16px);
    font-weight: bold;
    margin-bottom: 8px;
    white-space: nowrap;
  }

  .history-search :deep() {
    .devui-input {
      border: none;
      border-radius: 100px;
    }
  }

  .history-list-box {
    flex: 1;
    margin-top: 8px;
    overflow: auto;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;

      .history-list-empty {
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;

        span {
          margin-top: 20px;
        }
      }
    }
  }
}

body[ui-theme="infinity-theme"] {
  .history-list-container {
    backdrop-filter: blur(50px);
    background-color: rgba(249, 249, 249, 0.8);
  }
}

body[ui-theme="galaxy-theme"] {
  .history-list-container {
    background-color: var(--devui-global-bg, #f3f6f8);
  }
}

// 会话历史列表区域样式
.session-history-section {
  margin-top: 24px;
  border-top: 1px solid var(--devui-dividing-line, #dfe1e6);
  padding-top: 16px;

  .session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .session-title {
      font-size: var(--devui-font-size-lg, 16px);
      font-weight: bold;
      color: var(--devui-text, #252b3a);
    }

    .session-actions {
      .action-btn {
        padding: 4px 12px;
        border: 1px solid var(--devui-form-control-line, #dfe1e6);
        border-radius: 4px;
        background: var(--devui-base-bg, #ffffff);
        color: var(--devui-text, #252b3a);
        cursor: pointer;
        font-size: var(--devui-font-size-sm, 12px);
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: devui.$devui-list-item-hover-bg;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &.secondary {
          background: transparent;
        }
      }
    }
  }

  .session-list {
    max-height: 300px;
    overflow-y: auto;

    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid var(--devui-form-control-line, #dfe1e6);
      border-radius: 6px;
      background: var(--devui-base-bg, #ffffff);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--devui-list-item-hover-bg, #f2f5fc);
        border-color: var(--devui-brand, #5e7ce0);
      }

      .session-info {
        flex: 1;
        min-width: 0;

        .session-flow-name {
          font-weight: 500;
          color: var(--devui-text, #252b3a);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .session-id {
          font-size: var(--devui-font-size-sm, 12px);
          color: var(--devui-text-weak, #8a8e99);
          margin-bottom: 6px;
          font-family: monospace;
        }

        .session-status {
          display: flex;
          gap: 8px;
          align-items: center;

          .run-status {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: var(--devui-font-size-xs, 12px);
            font-weight: 500;

            &.status-created {
              background: var(--devui-warning-bg, #fef0e5);
              color: var(--devui-warning, #fa9841);
            }

            &.status-running {
              background: var(--devui-success-bg, #e8f5e8);
              color: var(--devui-success, #50d4ab);
            }

            &.status-stopped {
              background: var(--devui-danger-bg, #ffeaea);
              color: var(--devui-danger, #f66f6a);
            }
          }

          .chat-status {
            font-size: var(--devui-font-size-xs, 12px);
            color: var(--devui-text-weak, #8a8e99);
          }
        }
      }

      .session-time {
        font-size: var(--devui-font-size-xs, 12px);
        color: var(--devui-text-weak, #8a8e99);
        white-space: nowrap;
        margin-left: 12px;
      }
    }
  }

  .session-loading,
  .session-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--devui-text-weak, #8a8e99);

    img {
      width: 80px;
      height: 80px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    span {
      font-size: var(--devui-font-size-sm, 12px);
    }
  }
}
</style>

<style lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.devui-notification-item-container {
  color: var(--devui-text, #252b3a);

  .devui-notification__icon-close i.icon {
    color: var(--devui-text, #252b3a) !important;
  }
}
</style>
