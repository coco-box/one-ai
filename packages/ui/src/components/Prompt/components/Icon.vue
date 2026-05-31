<template>
  <div class="one-prompt-icon">
    <component
      v-if="IconComponent"
      :is="IconComponent"
      :name="name"
      :color="color"
      :size="iconSize"
    />

    <img
      v-else-if="isUrl(name)"
      :src="name"
      :alt="imgAlt"
      :style="{ width: iconSize || '', verticalAlign: 'middle' }"
    />

    <i
      v-else
      :class="fontIconClass"
      :style="{ fontSize: iconSize, color: color }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { iconProps } from './icon-types';

function isUrl(value: string): boolean {
  return /^((http|https):)?\/\//.test(value);
}

export default defineComponent({
  name: 'OnePromptIcon',
  props: iconProps,
  setup(props) {
    const iconSize = computed(() =>
      typeof props.size === 'number' ? `${props.size}px` : props.size
    );

    const fontIconClass = computed(() =>
      /^el-icon-/.test(props.name) ? props.name : ''
    );

    const imgAlt = computed(() =>
      props.name.split('/')[props.name.split('/').length - 1]
    );

    // Vue 2 无 resolveDynamicComponent，因此传入的 props.component 必须为已注册组件名
    const IconComponent = computed(() => props.component || null);

    return {
      iconSize,
      fontIconClass,
      IconComponent,
      imgAlt,
      isUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-prompt-icon {
  display: inline-block;
  color: var(--one-icon-fill);

  i {
    display: block;
    transition: all var(--one-animation-duration-slow) var(--one-animation-ease-in-out-smooth);
  }

  img {
    display: block;
  }
}
</style>