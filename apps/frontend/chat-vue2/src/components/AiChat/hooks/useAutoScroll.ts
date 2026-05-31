import {
  ref, onMounted, onUnmounted, Ref, watch,
} from '@vue/composition-api';

export function useAutoScroll(chatContainerRef: Ref<HTMLElement | null>, bottomAnchorRef: Ref<HTMLElement | null>, status: Ref<'submitted' | 'streaming' | 'ready' | 'error'>) {
  const isUserScrolling = ref(false);
  const scrollLockTimeout = ref<number | null>(null);
  const isInitialized = ref(false);
  // 点击滑动到底部的按钮
  const toBottomButtonRef = ref<HTMLElement | null>(null);
  // 是否展示点击滑动到底部的按钮
  const showToBottomButton = ref(false);
  // 检车是否展示点击滑动到底部的按钮
  const checkShowToBottomButton = () => {
    setTimeout(() => {
      showToBottomButton.value = !isNearBottom() && status.value === 'streaming';
    }, 100);
  };

  const isNearBottom = () => {
    const el = chatContainerRef.value;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  const scrollToBottom = (arg: (boolean | ScrollIntoViewOptions) = { behavior: 'smooth', block: 'start' }) => {
    setTimeout(() => {
      bottomAnchorRef.value?.scrollIntoView(arg);
    }, 100);
  };

  const lockScroll = () => {
    isUserScrolling.value = true;

    // 清除旧的 timeout
    if (scrollLockTimeout.value) {
      clearTimeout(scrollLockTimeout.value);
      scrollLockTimeout.value = null;
    }

    // 500ms 后自动检查
    scrollLockTimeout.value = window.setTimeout(async () => {
      isUserScrolling.value = false;

      if (isNearBottom() && status.value === 'streaming') {
        scrollToBottom(); // 距底部近了，恢复自动滚动
      } else {
        isUserScrolling.value = true;
      }
    }, 500);
  };

  const markUserScroll = () => {
    lockScroll(); // 触发用户锁定逻辑
  };

  const init = () => {
    if (isInitialized.value) return;

    const el = chatContainerRef.value;
    if (el) {
      el.addEventListener('wheel', markUserScroll, { passive: true });
      el.addEventListener('touchstart', markUserScroll, { passive: true });
      isInitialized.value = true;
    }
  };

  onMounted(() => {
    watch(chatContainerRef, (newVal) => {
      if (newVal && !isInitialized.value) {
        init();
      }
    }, { immediate: true });
  });

  onUnmounted(() => {
    const el = chatContainerRef.value;
    if (el) {
      el.removeEventListener('wheel', markUserScroll);
      el.removeEventListener('touchstart', markUserScroll);
    }
    if (scrollLockTimeout.value) {
      clearTimeout(scrollLockTimeout.value);
      scrollLockTimeout.value = null;
    }
    isInitialized.value = false;
  });

  const tryAutoScroll = async (force = true, scrollBehavior: 'auto' | 'smooth' = 'smooth') => {
    if (force) {
      isUserScrolling.value = false;
      scrollToBottom({ behavior: scrollBehavior, block: 'start' });
    } else if (!isUserScrolling.value) {
      scrollToBottom({ behavior: scrollBehavior, block: 'start' });
    }
  };

  return {
    tryAutoScroll,
    toBottomButtonRef,
    showToBottomButton,
    checkShowToBottomButton,
  };
}
