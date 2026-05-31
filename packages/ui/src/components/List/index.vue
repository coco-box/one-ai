<template>
  <div :class="listClasses" @scroll="onListScroll">
    <template v-for="(item, index) in data">
      <div v-if="variant === 'none'" :key="`wrapper-${index}`">
        <slot name="item" :item="item"></slot>
      </div>
      <div
        v-else
        :key="`item-${index}`"
        :class="[
          'one-list-item',
          {
            'one-list-item-disabled': item.disabled,
            'one-list-item-active': item.active,
            'one-list-item-pre-selection': index === preSelectIndex,
          },
          variant,
        ]"
        @click="() => onItemClick(item)"
      >
        <slot name="item" :item="item">
          {{ item.label }}
        </slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { listProps, ListVariant } from './list-types';
import { useList, useListRender } from './useList';

export default defineComponent({
  name: 'OneList',
  props: listProps as any,
  setup(props, { emit }) {
    const { listClasses } = useListRender(props as any);
    const { preSelectIndex, onItemClick, onListScroll } = useList(props as any, emit);

    return {
      listClasses,
      preSelectIndex,
      onItemClick,
      onListScroll,
      ListVariant,
    };
  },
});
</script>

<style lang="scss" scoped>
@use './list.scss';
</style>
