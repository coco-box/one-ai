import { computed, onMounted, ref } from '@vue/composition-api';
import { ListDirection } from './list-types';
import type { ListProps, ListItemData } from './list-types';
import { LazyLoadThreshold, InputTagNames, ArrowUp, ArrowDown, Enter } from './const';

type InputElement = HTMLElement & { $el?: HTMLElement };

export function useList(props: ListProps & {
  data: ListItemData[],
  direction: ListDirection,
  inputEl?: InputElement
}, emits: (event: 'select' | 'loadMore', ...args: any[]) => void) {
  const preSelectIndex = ref(props.enableShortKey ? 0 : -1);
  const onItemClick = (item: ListItemData) => {
    if (item.disabled) {
      return;
    }
    if (props.selectable) {
      for (let i = 0; i < props.data.length; i++) {
        props.data[i].active = props.data[i].value === item.value;
      }
    }
    emits('select', { ...item });
  };

  const onListScroll = (e: Event) => {
    if (!props.enableLazyLoad || props.direction !== ListDirection.Vertical) {
      return;
    }
    const targetEl = e.target as HTMLElement;
    const { scrollHeight } = targetEl;
    const { clientHeight } = targetEl;
    const { scrollTop } = targetEl;

    if (scrollHeight - clientHeight - scrollTop < LazyLoadThreshold) {
      emits('loadMore', e);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === ArrowUp) {
      preSelectIndex.value = preSelectIndex.value === 0
        ? props.data.length - 1
        : preSelectIndex.value - 1;
    }
    if (e.code === ArrowDown) {
      preSelectIndex.value = preSelectIndex.value === props.data.length - 1
        ? 0
        : preSelectIndex.value + 1;
    }
    if (e.code === Enter) {
      if (props.selectable) {
        props.data[preSelectIndex.value].active = true;
      }
      emits('select', { ...props.data[preSelectIndex.value] });
    }
  };

  onMounted(() => {
    let listenDom;

    if (props.inputEl) {
      const el = props.inputEl.$el ?? props.inputEl;
      if (InputTagNames.includes(el.tagName)) {
        listenDom = el;
      } else {
        listenDom = el.querySelector('textarea') || el.querySelector('input') || document;
      }
    } else {
      listenDom = document;
    }
    if (props.enableShortKey) {
      listenDom.addEventListener('keydown', onKeyDown);
    }
  });

  return { preSelectIndex, onItemClick, onListScroll };
}

export function useListRender(props: ListProps & { direction: ListDirection }) {
  const listClasses = computed(() => ({
    'one-list': true,
    'one-list-horizontal': props.direction === ListDirection.Horizontal,
    'one-list-nowrap': props.direction === ListDirection.Horizontal && !props.autoWrap,
  }));

  return { listClasses };
}
