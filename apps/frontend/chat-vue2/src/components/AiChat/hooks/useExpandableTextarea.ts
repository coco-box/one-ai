import { ref, watch } from '@vue/composition-api';

export const useExpandableTextarea = () => {
  const expandTriggerLineCount = 12; // 超过此行数需要显示展开按钮
  // 当前 input 实际行数
  const currentActualRows = ref(0);
  // 是否显示展开输入框按钮
  const showTextareaExpandButton = ref(false);
  // 是否全屏输入
  const isTextareaExpanded = ref(false);
  // 切换全屏输入
  const toggleTextareaExpanded = () => {
    isTextareaExpanded.value = !isTextareaExpanded.value;
    if (!isTextareaExpanded.value && currentActualRows.value <= expandTriggerLineCount) {
      showTextareaExpandButton.value = false;
    }
  };
  // 重置全屏输入
  const resetTextareaExpandState = () => {
    isTextareaExpanded.value = false;
    showTextareaExpandButton.value = false;
  };
  // 监听 实际行数
  watch(currentActualRows, (val: number) => {
    showTextareaExpandButton.value = val > expandTriggerLineCount;
    if (isTextareaExpanded.value) {
      showTextareaExpandButton.value = true;
    }
  });

  return {
    currentActualRows,
    showTextareaExpandButton,
    isTextareaExpanded,
    toggleTextareaExpanded,
    resetTextareaExpandState,
  };
};
