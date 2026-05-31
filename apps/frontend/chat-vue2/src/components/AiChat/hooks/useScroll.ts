import {
  ref, onMounted, onUnmounted, Ref, watch, unref, isRef,
} from '@vue/composition-api';

export interface UseScrollOptions {
  /**
   * 节流时间(ms)
   * @default 0
   */
  throttle?: number
  /**
   * 滚动结束的检测时间(ms)
   * @default 200
   */
  idle?: number
  /**
   * 滚动事件监听器选项
   * @default {capture: false, passive: true}
   */
  eventListenerOptions?: boolean | AddEventListenerOptions
  /**
   * 滚动行为
   * @default 'auto'
   */
  behavior?: ScrollBehavior
}

export interface UseScrollReturn {
  x: Ref<number>
  y: Ref<number>
  isScrolling: Ref<boolean>
  arrivedState: {
    left: boolean
    right: boolean
    top: boolean
    bottom: boolean
  }
  directions: {
    left: boolean
    right: boolean
    top: boolean
    bottom: boolean
  }
  distanceToBottom: Ref<number>
  measure: () => void
}

export function useScroll(
  element: Ref<HTMLElement | Window | null | undefined> | HTMLElement | Window | null | undefined,
  options: UseScrollOptions = {},
): UseScrollReturn {
  const {
    throttle = 0,
    idle = 200,
    eventListenerOptions = { capture: false, passive: true },
  } = options;
  const distanceToBottom = ref(0);

  const x = ref(0);
  const y = ref(0);
  const isScrolling = ref(false);
  const arrivedState = {
    left: true,
    right: false,
    top: true,
    bottom: false,
  };
  const directions = {
    left: false,
    right: false,
    top: false,
    bottom: false,
  };

  let scrollTimer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let cleanup: (() => void) | undefined;

  const updateScroll = () => {
    const el = unref(element);
    if (!el) return;

    const scrollLeft = el instanceof Window ? window.scrollX : el.scrollLeft;
    const scrollTop = el instanceof Window ? window.scrollY : el.scrollTop;

    // 更新方向
    directions.left = scrollLeft < lastX;
    directions.right = scrollLeft > lastX;
    directions.top = scrollTop < lastY;
    directions.bottom = scrollTop > lastY;

    // 更新位置
    x.value = scrollLeft;
    y.value = scrollTop;
    lastX = scrollLeft;
    lastY = scrollTop;

    if (!(el instanceof Window)) {
      const {
        clientWidth, clientHeight, scrollWidth, scrollHeight,
      } = el;

      arrivedState.left = scrollLeft <= 0;
      arrivedState.right = scrollLeft + clientWidth >= scrollWidth;
      arrivedState.top = scrollTop <= 0;
      arrivedState.bottom = scrollTop + clientHeight >= scrollHeight;

      // 🟡 计算距底部距离
      distanceToBottom.value = scrollHeight - (scrollTop + clientHeight);
    } else {
      // 处理 window 的情况（你其实不需要）
      const { innerWidth, innerHeight } = window;
      const { scrollWidth, scrollHeight } = document.documentElement;

      arrivedState.left = scrollLeft <= 0;
      arrivedState.right = scrollLeft + innerWidth >= scrollWidth;
      arrivedState.top = scrollTop <= 0;
      arrivedState.bottom = scrollTop + innerHeight >= scrollHeight;

      distanceToBottom.value = scrollHeight - (scrollTop + innerHeight);
    }

    // 更新到达状态
    if (el instanceof Window) {
      const { innerWidth, innerHeight } = window;
      const { scrollWidth, scrollHeight } = document.documentElement;
      arrivedState.left = scrollLeft <= 0;
      arrivedState.right = scrollLeft + innerWidth >= scrollWidth;
      arrivedState.top = scrollTop <= 0;
      arrivedState.bottom = scrollTop + innerHeight >= scrollHeight;
    } else {
      const {
        clientWidth, clientHeight, scrollWidth, scrollHeight,
      } = el;
      arrivedState.left = scrollLeft <= 0;
      arrivedState.right = scrollLeft + clientWidth >= scrollWidth;
      arrivedState.top = scrollTop <= 0;
      arrivedState.bottom = scrollTop + clientHeight >= scrollHeight;
    }
  };

  const onScroll = () => {
    isScrolling.value = true;
    updateScroll();
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }

    scrollTimer = window.setTimeout(() => {
      isScrolling.value = false;
    }, idle);
  };

  const throttledScroll = throttle > 0
    ? (() => {
      let lastTime = 0;
      return () => {
        const now = Date.now();
        if (now - lastTime >= throttle) {
          lastTime = now;
          onScroll();
        }
      };
    })()
    : onScroll;

  const cleanupScroll = () => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  };

  const setupScroll = () => {
    cleanupScroll();
    const el = unref(element);
    if (!el) return;
    el.addEventListener('scroll', throttledScroll, eventListenerOptions);
    updateScroll();

    cleanup = () => {
      el.removeEventListener('scroll', throttledScroll, eventListenerOptions);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
    };
  };

  // 监听 element 变化
  if (isRef(element)) {
    watch(element, () => {
      setupScroll();
    }, { immediate: true });
  } else {
    onMounted(() => {
      setupScroll();
    });
  }

  onUnmounted(() => {
    cleanupScroll();
  });

  return {
    x,
    y,
    isScrolling,
    arrivedState,
    directions,
    distanceToBottom,
    measure: updateScroll,
  };
}
