import { getCurrentInstance } from '@vue/composition-api';

// Fragment 模拟组件（函数式组件）
// 它在 render 时直接返回其 children，不包额外 DOM 节点
// 使用动态获取 Vue 实例的方式，避免在 VuePress 等环境中 Vue 被重命名的问题
export const Fragment = {
  name: 'Fragment',
  functional: true,
  render(h: any, ctx: any) {
    return ctx.children; // 直接返回子 vnode 数组
  }
};

/**
 * Vue2 版本的 isVNode 实现，兼容 Vue3 语义。
 * - 在 Vue2 中，VNode 是内部结构（_isVNode 不存在）
 * - 我们通过判断对象特征（tag/context/componentOptions 等）来识别
 */
export const isVNode = (value: any): value is any => {
  if (!value || typeof value !== 'object') return false;

  // Vue3 兼容性：如果运行时已有 _isVNode 标记，则直接返回
  if ((value as any)._isVNode) return true;

  // Vue2 内部 vnode 特征
  return (
    typeof value.tag === 'string' ||
    typeof value.tag === 'function' ||
    // 组件 vnode
    (!!value.componentOptions && typeof value.componentOptions === 'object')
  );
};

export function useSlots() {
  const instance = getCurrentInstance();
  if (!instance) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[useSlotsCompat] must be called inside setup().');
    }
    return {};
  }

  // Vue 2 中的 slots 可能在 $slots 或 $scopedSlots
  const proxy = instance.proxy as any;

  // 兼容两种写法
  return new Proxy({}, {
    get(_, key: string) {
      return proxy.$scopedSlots?.[key] || proxy.$slots?.[key];
    },
  });
}