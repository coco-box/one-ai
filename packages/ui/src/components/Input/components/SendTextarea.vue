<template>
  <textarea
    ref="textareaRef"
    v-model="inputValue"
    :placeholder="placeholder"
    :disabled="rootProps.disabled"
    :maxlength="rootProps.maxLength"
    :class="[
      'one-textarea',
      {
        'one-textarea-simple': rootProps.displayType === DisplayType.Simple,
        'one-textarea-disabled': rootProps.disabled,
      },
    ]"
    :style="textareaStyle"
    :rows="rootProps.rows"
    @input="onInput"
    @compositionstart="onCompositionStart"
    @compositionend="onCompositionEnd"
    @keydown="onKeydown"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  inject,
  computed,
  nextTick,
  ref,
  watch,
} from '@vue/composition-api';
import { inputInjectionKey, SubmitShortKey, DisplayType } from '../input-types';
import type { InputContext } from '../input-types';
import { useCalculateTextareaHeight } from '../hooks/useCalculateTextareaHeight';

export default defineComponent({
  name: 'OneTextarea',
  setup() {
    const { inputValue, rootProps, rootEmits } = inject(inputInjectionKey) as InputContext;

    // lock 是组合输入期间防止触发 input 的标志
    const lock = ref(false);

    const placeholder = computed(() => {
      let enterKey = '';
      let shiftEnterKey = '';
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (rootProps.submitShortKey === SubmitShortKey.Enter) {
        enterKey = 'Enter';
        shiftEnterKey = 'Shift + Enter';
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (rootProps.submitShortKey === SubmitShortKey.ShiftEnter) {
        enterKey = 'Shift + Enter';
        shiftEnterKey = 'Enter';
      }
      return (
        rootProps.placeholder ??
        (enterKey
          ? `请输入您的问题，并按${enterKey}发送，按${shiftEnterKey}换行`
          : '请输入您的问题...')
      );
    });

    const textareaRef = ref<Element | null>(null);

    const emitChange = () => {
      nextTick(() => {
        resizeTextarea();
        rootEmits('change', inputValue.value, textareaCalcStyle.value?.actualRows ?? 1);
      });
    };

    const onInput = () => {
      if (!lock.value) {
        emitChange();
      }
    };

    const onCompositionStart = () => {
      lock.value = true;
    };

    const onCompositionEnd = () => {
      lock.value = false;
      emitChange();
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (rootProps.submitShortKey === null) return;

      const shiftKey =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line no-nested-ternary
        rootProps.submitShortKey === SubmitShortKey.Enter
          ? !e.shiftKey
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line no-nested-ternary
          : rootProps.submitShortKey === SubmitShortKey.ShiftEnter
            ? e.shiftKey
            : false;

      if (shiftKey && e.key === 'Enter' && !lock.value) {
        e.preventDefault();
        rootEmits('submit', inputValue.value, e, textareaRef.value as HTMLTextAreaElement);
        inputValue.value = '';
      }
    };

    const onFocus = (e: FocusEvent) => {
      rootEmits('focus', e);
    };

    const onBlur = (e: FocusEvent) => {
      rootEmits('blur', e);
    };

    const textareaCalcStyle = ref({} as { minHeight?: string; height?: string; actualRows?: number });
    const textareaStyle = computed(() => {
      const style = Object.assign({}, textareaCalcStyle.value, {
        resize: rootProps.resize,
      });
      return style;
    });

    const resizeTextarea = () => {
      const { autosize } = rootProps;
      if (!autosize) {
        textareaCalcStyle.value = {
          minHeight: useCalculateTextareaHeight(textareaRef.value as HTMLTextAreaElement).minHeight,
        };
        return;
      }
      const minRows = (autosize as { minRows?: number }).minRows;
      const maxRows = (autosize as { maxRows?: number }).maxRows;
      textareaCalcStyle.value = useCalculateTextareaHeight(textareaRef.value as HTMLTextAreaElement, minRows, maxRows);
    }

    watch(() => inputValue.value, (val) => {
      if (val === '') {
        nextTick(() => resizeTextarea());
      }
    });

    return {
      inputValue,
      rootProps,
      placeholder,
      DisplayType,
      onInput,
      onCompositionStart,
      onCompositionEnd,
      onKeydown,
      onFocus,
      onBlur,
      textareaRef,
      textareaStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-textarea {
  width: 100%;
  // height: 64px;
  padding: 4px 0;
  color: var(--one-text);
  font-size: var(--one-font-size-md);
  background-color: var(--one-form-control-bg);
  line-height: var(--one-line-height-sm);
  vertical-align: middle;
  outline: none;
  box-sizing: border-box;
  resize: none;
  border: none;

  &.one-textarea-simple {
    height: 32px;
  }

  &.one-textarea-disabled {
    color: var(--one-disabled-text);
    background-color: var(--one-disabled-bg);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--one-placeholder);
  }
}
</style>