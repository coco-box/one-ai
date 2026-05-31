<template>
  <div class="interaction-area one-flex one-flex-col one-gap-1">
    <!-- 是否模块 -->
    <div v-if="confirmText" class="ask-wrapper one-flex one-flex-wrap one-justify-between one-items-center">
      <div class="ask-text">{{ confirmText }}</div>
      <div class="ask-btns one-flex one-gap-[8px] one-flex-nowrap one-justify-center one-items-center one-ml-auto">
        <button
          class="ask-btn one-flex one-gap-[4px] one-justify-center one-items-center one-py-[2px] one-px-[12px] one-rounded-[2px] one-text-[14px] one-font-[350] one-leading-[22px] one-text-white one-border-none one-cursor-pointer"
          :class="{
            'one-bg-primary': btn.type === 'primary',
            'hover:one-bg-primary-hover': btn.type === 'primary',
            'one-bg-danger': btn.type === 'danger',
            'hover:one-bg-danger-hover': btn.type === 'danger',
          }"
          v-for="(btn, index) in confirmButtons"
          :key="index"
          type="button"
          @click="handleConfirmClick(btn)"
        >
          <OneIcon v-if="btn.icon" :name="btn.icon" />
          {{ btn.text }}
        </button>
      </div>
    </div>
    <!-- 建议模块 -->
    <div v-if="internalShowSuggestion" class="suggestion-wrapper one-flex one-justify-start one-items-start">
      <div class="suggestion-text" v-if="finalSuggestionText">{{ finalSuggestionText }}</div>
      <div class="suggestion-btns one-flex one-flex-1 one-flex-wrap">
        <button
          v-for="(btn, index) in suggestionButtons"
          :key="index"
          type="button"
          class="suggestion-btn one-flex one-items-center one-text-[#4150FF] one-text-[16px] one-font-[350] one-leading-[28px] one-px-[3px] one-border-none one-bg-transparent one-cursor-pointer"
          @click="handleSuggestionClick(btn)"
        >
          <OneIcon v-if="btn.icon" :name="btn.icon" />
          {{ btn.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, PropType, ref, watch, computed,
} from '@vue/composition-api';
import { interactionConfirmProps } from './interaction-confirm-types';
import { OneIcon } from '../Icon';

export interface InteractionButtonConfig {
  text: string;
  type?: string;
  icon?: string;
  value: string | number | boolean;
  [key: string]: any;
}

export default defineComponent({
  name: 'OneInteractionConfirm',
  components: {
    OneIcon,
  },
  props: interactionConfirmProps,
  setup(props, { emit }) {
    // 内部状态管理
    const internalShowSuggestion = ref(props.showSuggestion);
    const finalSuggestionText = computed(() => {
      if (props.suggestionText) {
        return props.suggestionText;
      }

      return '';
    });

    // 监听外部 showSuggestion 变化
    watch(
      () => props.showSuggestion,
      (newVal) => {
        internalShowSuggestion.value = newVal;
      },
    );

    // 处理确认按钮点击
    const handleConfirmClick = (btn: InteractionButtonConfig) => {
      if (btn.value === false) {
        internalShowSuggestion.value = true;
        emit('cancel', btn);
        return;
      }
      emit('confirm', btn);
    };

    // 处理建议按钮点击
    const handleSuggestionClick = (btn: InteractionButtonConfig) => {
      internalShowSuggestion.value = false;
      emit('suggestion', btn);
    };

    return {
      internalShowSuggestion,
      handleConfirmClick,
      handleSuggestionClick,
      finalSuggestionText,
    };
  },
});
</script>

<style lang="scss" scoped>
@use './index.scss';
</style>