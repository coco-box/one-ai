<template>
  <div :class="inputClasses">
    <slot name="head" />
    <div class="one-input-content">
      <slot name="prefix" />
      <SendTextarea />
      <slot name="suffix" />
      <slot v-if="displayType === DisplayType.Simple" name="button">
        <SendButton />
      </slot>
    </div>
    <div v-if="displayType === DisplayType.Full" class="one-input-foot">
      <div class="one-input-foot-left">
        <slot name="extra" />
        <span v-if="showCount" class="one-input-foot-count">
          {{ inputValue.length }}{{ !(maxLength || false) ? "" : `/${maxLength}` }}
        </span>
      </div>
      <slot name="button">
        <SendButton />
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, provide, SetupContext } from '@vue/composition-api';
import SendTextarea from './components/SendTextarea.vue';
import SendButton from './components/SendButton.vue';
import {
  inputProps,
  InputProps,
  inputInjectionKey,
  DisplayType,
  InputVariant,
} from './input-types';

export default defineComponent({
  name: 'OneInput',
  components: {
    SendTextarea,
    SendButton,
  },
  props: inputProps,
  setup(props: InputProps, ctx: SetupContext) {
    const inputValue = ref('');

    const inputClasses = computed(() => ({
      'one-input': true,
      'one-input-disabled': props.disabled,
      'one-input-simple': props.displayType === DisplayType.Simple,
      'one-input-borderless': props.variant === InputVariant.BorderLess,
    }));

    const clearInput = () => {
      inputValue.value = '';
    };

    const getInput = () => inputValue.value;

    watch(
      () => props.value,
      () => {
        inputValue.value = props.value;
      },
      { immediate: true }
    );

    // 注入给子组件使用
    provide(inputInjectionKey, {
      inputValue,
      rootProps: props,
      rootEmits: ctx.emit,
    });

    // 向父组件暴露方法（通过 ref 调用）
    (ctx.expose as any)?.({
      clearInput,
      getInput,
    });

    return {
      inputValue,
      inputClasses,
      DisplayType,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-input {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 16px 0;
  border: 1px solid var(--one-form-control-line);
  border-radius: 16px;
  box-sizing: border-box;
  background-color: var(--one-base-bg);

  &.one-input-simple {
    border-radius: 24px;

    .one-input-content {
      padding: 0 20px;
    }
  }

  &.one-input-borderless {
    border: none;
    box-shadow: 0 1px 8px 0 var(--one-box-shadow);
  }

  &.one-input-disabled {
    background-color: var(--one-disabled-bg);
    cursor: not-allowed;
  }

  .one-input-content {
    display: flex;
    align-items: flex-end;
    padding: 0 16px;
  }

  .one-input-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    padding: 0 16px;

    .one-input-foot-left {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;

      .one-input-foot-count {
        color: var(--one-text);
        font-size: var(--one-font-size-md);
      }
    }
  }
}
</style>