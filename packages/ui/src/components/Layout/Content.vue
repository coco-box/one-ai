<template>
  <div class="one-layout-content">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneLayoutContent',
});
</script>

<style scoped lang="scss">
.one-layout-content {
  flex: auto;
  /* 修复 Firefox 无法在 flex 项目上设置小于内容的高度 */
  min-height: 0;
}
</style>