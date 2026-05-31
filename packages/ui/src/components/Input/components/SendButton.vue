<template>
  <button
    type="button"
    :disabled="rootProps.disabled || (!rootProps.loading && !inputValue)"
    :class="buttonClasses"
    @click="onConfirm"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >
    <span class="one-button-content">
      <LoadingIcon v-if="rootProps.loading" />
      <SendIcon v-else />
      <span v-if="rootProps.sendBtnVariant === SendBtnVariant.Full">
        {{ rootProps.loading ? '停止' : '发送' }}
      </span>
    </span>
    <div v-if="showWave" class="one-button-water-wave" :style="waveStyle" />
  </button>
</template>

<script lang="ts">
import Vue, { defineComponent, ref, reactive, computed, inject } from '@vue/composition-api';
import LoadingIcon from './LoadingIcon.vue';
import SendIcon from './SendIcon.vue';
import { inputInjectionKey, SendBtnVariant } from '../input-types';
import type { InputContext } from '../input-types';

export default defineComponent({
  name: 'SendButton',
  components: {
    LoadingIcon,
    SendIcon,
  },
  setup() {
    // 从注入中获取 input 相关上下文（包含 inputValue、rootProps、rootEmits）
    const { inputValue, rootProps, rootEmits } = inject(inputInjectionKey) as InputContext;

    const isMouseDown = ref(false);
    const showWave = ref(false);
    const waveStyle = reactive({
      top: '0px',
      left: '0px',
    });

    const buttonClasses = computed(() => ({
      'one-button': true,
      'one-button-loading': rootProps.loading,
      mousedown: isMouseDown.value,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      'one-button-simple': rootProps.sendBtnVariant === SendBtnVariant.Simple,
    }));

    const onMouseDown = () => {
      isMouseDown.value = true;
    };

    const onMouseUp = () => {
      isMouseDown.value = false;
    };

    const showClickWave = (e: MouseEvent) => {
      waveStyle.left = `${e.offsetX}px`;
      waveStyle.top = `${e.offsetY}px`;
      showWave.value = true;
      setTimeout(() => {
        showWave.value = false;
      }, 300);
    };

    const onConfirm = (e: MouseEvent) => {
      showClickWave(e);
      if (rootProps.loading) {
        rootEmits('cancel');
      } else {
        rootEmits('submit', inputValue.value);
        inputValue.value = '';
      }
    };

    return {
      inputValue,
      rootProps,
      SendBtnVariant,
      buttonClasses,
      isMouseDown,
      showWave,
      waveStyle,
      onConfirm,
      onMouseDown,
      onMouseUp,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  height: 32px;
  line-height: 1.5;
  color: var(--one-light-text);
  font-size: var(--one-font-size-md);
  padding: 0 12px;
  border-radius: 20px;
  background-color: var(--one-primary);
  overflow: hidden;
  border: none;
  cursor: pointer;
  transition: background-color var(--one-animation-duration-slow) var(--one-animation-ease-in-out-smooth),
              border-color var(--one-animation-duration-slow) var(--one-animation-ease-in-out-smooth),
              color var(--one-animation-duration-slow) var(--one-animation-ease-in-out-smooth);

  &.one-button-loading {
    svg {
      animation: rotating 1s linear infinite;
    }
  }

  &.mousedown:not(:disabled) {
    transform: scale(0.95);
  }

  &.one-button-simple {
    width: 32px;
    padding: 6px;
    flex-shrink: 0;
    border-radius: 100%;

    svg {
      margin-right: 0;
    }
  }

  &:hover {
    background-color: var(--one-primary-hover);
  }
  &:active {
    background-color: var(--one-primary-active);
  }
  &:disabled {
    color: var(--one-light-text);
    background-color: var(--one-primary-disabled);
    cursor: not-allowed;
  }

  .one-button-content {
    display: inline-flex;
    align-items: center;
    font-size: var(--one-font-size-md);
  }

  .one-button-water-wave {
    position: absolute;
    background-color: var(--one-base-bg);
    border-radius: 50%;
    opacity: 0;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    animation: waterWave var(--one-animation-duration-slow) var(--one-animation-linear);
  }

  svg {
    :deep(path) {
      fill: var(--one-light-text);
    }
    margin-right: 4px;
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(180deg);
  }
}

@keyframes waterWave {
  0% {
    opacity: 0.2;
    width: 30px;
    height: 30px;
  }
  100% {
    opacity: 0;
    width: 200px;
    height: 200px;
  }
}
</style>