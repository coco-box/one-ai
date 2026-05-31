<template>
  <div class="input-container">
    <McInput
      :value="inputValue"
      :max-length="2000"
      variant="borderless"
      :loading="chatMessageStore.isLoading"
      @change="(e:string) => (inputValue = e)"
      @submit="onSubmit"
      @cancel="onCancel"
    >
      <template #extra>
        <div class="input-foot-wrapper">
          <!-- <InputOnlineSearch />
          <span class="input-foot-dividing-line"></span>
          <InputAtModel @click="onModelClick" />
          <d-popover
            :content="$t('underDevelop')"
            trigger="hover"
            :position="['top']"
            style="color: var(--devui-text)"
          >
            <div class="input-word-container">
              <PromptsIcon />
              <span>{{ $t("thesaurus") }}</span>
            </div>
          </d-popover>
          <InputAppendix />
          <span class="input-foot-dividing-line"></span> -->
          <span class="input-foot-maxlength">
            {{ inputValue.length }}/2000
          </span>
        </div>
      </template>
    </McInput>
    <div class="statement-box">
      <span>{{ $t("input.disclaimer") }}</span>
      <span class="separator" />
      <span class="link-span">{{ $t("input.privacyStatement") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatMessageStore, useChatModelStore } from "@/store";
import { InputAppendix } from "@view/appendix";
// import { InputAtModel } from "@view/chat-model";
// import { InputOnlineSearch } from "@view/online-search";
import { PromptsIcon } from "@/components";
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { endSession } from "@/api/sessionApi";
// 移除 vue-devui message 导入，使用原生 alert

const route = useRoute();
const chatMessageStore = useChatMessageStore();
const chatModelStore = useChatModelStore();

const inputValue = ref("");
// 从路由参数中获取session_id
const session_id = computed(() => route.query.session_id as string);

chatMessageStore.$onAction(({ name }) => {
  if (name === "ask") {
    inputValue.value = "";
  }
});

const onSubmit = (val: string) => {
  chatMessageStore.ask(val);
};

const onCancel = async () => {
  // 停止当前聊天
  chatMessageStore.cancel();
  
  // 调用停止会话接口
  if (session_id.value) {
    try {
      await endSession(session_id.value);
      alert('会话已成功停止');
    } catch (error) {
      console.error('停止会话失败：', error);
      alert('停止会话失败，请重试');
    }
  } else {
    alert('当前没有活跃的会话');
  }
};

const onModelClick = () => {
  inputValue.value += `@${chatModelStore.currentModel?.modelName}`;
};
</script>

<style scoped lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.input-container {
  width: 100%;
  max-width: 1200px;
  padding: 0 12px 12px 12px;

  .input-foot-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    margin-right: 8px;

    .input-word-container {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      color: devui.$devui-text;
      font-size: devui.$devui-font-size;
      border-radius: 4px;
      padding: 6px;
      cursor: pointer;

      svg {
        width: 14px;
        height: 14px;
      }

      span {
        font-size: devui.$devui-font-size-sm;
      }

      &:hover {
        background-color: var(--devui-icon-hover-bg);
      }
    }

    span {
      color: devui.$devui-text;
      cursor: pointer;
    }

    .input-foot-dividing-line {
      width: 1px;
      height: 14px;
      background-color: devui.$devui-line;
      margin: 0 8px;
    }

    .input-foot-maxlength {
      font-size: devui.$devui-font-size-sm;
      color: devui.$devui-aide-text;
    }
  }
  :deep() {
    .mc-input-foot-left {
      overflow-x: auto;
      scrollbar-width: none;
    }
    .mc-button svg path {
      transition: fill devui.$devui-animation-duration-slow
        devui.$devui-animation-ease-in-out-smooth;
    }
  }

  .statement-box {
    font-size: 12px;
    margin-top: 8px;
    color: devui.$devui-aide-text;
    text-align: center;

    .separator {
      height: 12px;
      margin: 0 4px;
      border: 0.6px solid devui.$devui-disabled-text;
    }

    .link-span {
      cursor: pointer;
      text-decoration: underline;
    }
  }
}

body[ui-theme="galaxy-theme"] {
  .input-container {
    :deep() {
      .mc-button:disabled {
        color: devui.$devui-disabled-text;
        background-color: devui.$devui-disabled-bg;
        svg path {
          fill: devui.$devui-disabled-text;
        }
      }
    }
  }
}

@media screen and (max-width: 520px) {
  .input-word-container span {
    display: none;
  }
}
</style>
