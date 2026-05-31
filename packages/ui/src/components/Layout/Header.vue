<template>
  <div class="one-layout-header">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneLayoutHeader',
});
</script>

<style scoped lang="scss">
.one-layout-header {
  flex: 0 0 auto;
  min-height: 40px;
}
</style>