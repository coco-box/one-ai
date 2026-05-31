import { onMounted, onBeforeUnmount, Ref } from '@vue/composition-api';

export function useFirstVisible(elRef: Ref<HTMLElement | Vue | null>, callback: () => void) {
  let hasFired = false;
  let observer: ResizeObserver | null = null;

  const getEl = (): HTMLElement | null => {
    const val = elRef.value;
    if (!val) return null;
    // 兼容 DOM ref 或 组件 ref
    return val instanceof HTMLElement ? val : (val as any).$el ?? null;
  };

  const isVisible = (el: HTMLElement) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };

  onMounted(() => {
    const el = getEl();
    if (!el || hasFired) return;

    observer = new ResizeObserver(() => {
      const el = getEl();
      if (el && !hasFired && isVisible(el)) {
        hasFired = true;
        callback();
        observer?.disconnect();
      }
    });

    observer.observe(el);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
  });
}
