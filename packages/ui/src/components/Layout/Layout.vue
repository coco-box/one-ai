<template>
  <div class="one-layout">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneLayout',
});
</script>

<style scoped lang="scss">
.one-layout {
  display: flex;
  flex: auto;
  flex-direction: column;

  &-aside {
    flex-direction: row;
  }
}
</style>