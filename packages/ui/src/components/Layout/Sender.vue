<template>
  <div class="one-layout-sender">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneLayoutSender',
});
</script>

<style scoped lang="scss"></style>