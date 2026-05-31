<template>
  <div class="welcome-page">
    <McIntroduction
      :logo-img="GlobalConfig.logoPath || Logo2X"
      :title="GlobalConfig.title"
      :sub-title="GlobalConfig.subTitle"
      :description="[$t('welcome.description1'), $t('welcome.description2')]"
      class="welcome-introduction"
    ></McIntroduction>
    <div class="guess-question">
      <div class="guess-title">
        <div>{{ $t("welcome.guessYouWantAsk") }}</div>
        <div>
          <i class="icon-recover"></i>
          <span>{{ $t("welcome.change") }}</span>
        </div>
      </div>
      <div class="guess-content">
        <span
          v-for="(item, index) in list"
          :key="index"
          @click="onItemClick(item)"
        >
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalConfig from "@/global-config";
import {
  guessQuestionsCn,
  guessQuestionsEn,
  mockAnswer,
} from "@/mock-data/mock-chat-view";
import { useChatMessageStore, useLangStore } from "@/store";
import { LangType } from "@/types";
import Logo2X from "../../assets/imgs/logo2x.png";

const langStore = useLangStore();
const chatMessageStore = useChatMessageStore();

const list = computed(() =>
  langStore.currentLang === LangType.CN ? guessQuestionsCn : guessQuestionsEn
);

const onItemClick = (item) => {
  if (mockAnswer[item.value]) {
    chatMessageStore.ask(item.label, mockAnswer[item.value]);
  }
};
</script>

<style scoped lang="scss">
@use "devui-theme/styles-var/devui-var.scss" as devui;

.welcome-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: auto;
  width: 100%;
  max-width: 1200px;
  padding: 0 12px;
  gap: 24px;

  .welcome-introduction {
    :deep() {
      .mc-introduction-description {
        font-size: var(--devui-font-size, 14px);
      }
      .mc-introduction-logo-container {
        img {
          width: 64px;
          height: 64px;
        }
      }
    }
  }

  .guess-question {
    width: 100%;
    padding: 24px;
    border-radius: 24px;
    background-color: devui.$devui-base-bg;

    .guess-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: devui.$devui-text;
      margin-bottom: 16px;

      & > div:first-child {
        font-weight: 700;
        font-size: 16px;
        line-height: 24px;
      }
      & > div:last-child {
        font-size: devui.$devui-font-size;
        color: devui.$devui-aide-text;
        cursor: pointer;

        span {
          margin-left: 4px;
          line-height: 24px;
        }
      }
    }

    .guess-content {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      span {
        font-size: devui.$devui-font-size;
        color: devui.$devui-aide-text;
        padding: 10px 16px;
        border-radius: devui.$devui-border-radius-full;
        background-color: devui.$devui-dividing-line;
        cursor: pointer;
      }
    }
  }
}
</style>
