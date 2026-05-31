<template>
  <div :class="themeClass">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

type Theme = 'light' | 'dark';

export default defineComponent({
  name: 'OneConfigProvider',
  props: {
    theme: {
      type: String as PropType<Theme>,
      default: 'light',
      validator: (value: string) => ['light', 'dark'].includes(value),
    },
  },
  setup(props) {
    const themeClass = computed(() =>
      props.theme // aichat's theme.css is designed to use .dark class
    );

    return {
      themeClass,
    };
  },
});
</script>

<style lang="scss" scoped>
.light,
.dark {
  color: var(--one-text);
}
</style>