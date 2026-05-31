<template>
  <div class="one-prompt">
    <OneList
      :data="props.list"
      :direction="props.direction"
      :variant="props.variant"
      :selectable="false">
      <template #item="{ item }">
        <PromptItem :prompt="item" @click.native="handleItemClick(item)" />
      </template>
    </OneList>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { OneList } from '../List';
import PromptItem from './Item.vue';
import { promptProps } from './prompt-types';

export default defineComponent({
  name: 'OnePrompt',
  components: {
    OneList,
    PromptItem,
  },
  props: promptProps as any,
  setup(props, { emit }) {
    function handleItemClick(item: any) {
      emit('itemClick', item);
    }

    return {
      props,
      handleItemClick,
    };
  },
});
</script>

<style scoped lang="scss">
/* 你可以在此处添加样式 */
</style>