import { ref, Ref, watch } from '@vue/composition-api';

export function useToBottomButton(distanceToBottom: Ref<number>) {
  const toBottomButtonRef = ref<HTMLElement | null>(null);
  const showToBottomButton = ref(false);

  watch(() => distanceToBottom.value, (newVal) => {
    if (newVal > 200) {
      showToBottomButton.value = true;
    } else {
      showToBottomButton.value = false;
    }
  });

  return {
    toBottomButtonRef,
    showToBottomButton,
  };
}
