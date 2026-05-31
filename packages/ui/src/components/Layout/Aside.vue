<template>
  <div class="one-layout-aside">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneLayoutAside',
});
</script>

<style scoped lang="scss"></style>