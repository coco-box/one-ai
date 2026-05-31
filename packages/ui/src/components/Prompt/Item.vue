<template>
  <div class="one-prompt-item">
    <div :class="['one-prompt-item-icon', { 'one-description': !(prompt && prompt.desc) }]">
      <Icon v-if="prompt && prompt.iconConfig" v-bind="prompt.iconConfig" />
    </div>
    <div v-if="prompt && (prompt.label || prompt.desc)" class="one-prompt-item-content">
      <div v-if="prompt && prompt.label" class="one-prompt-item-label">{{ prompt.label }}</div>
      <div v-if="prompt && prompt.desc" class="one-prompt-item-description one-text-text-tertiary">{{ prompt.desc }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import Icon from './components/Icon.vue';
import { promptItemProps } from './prompt-types';

export default defineComponent({
  name: 'OnePromptItem',
  components: {
    Icon,
  },
  props: promptItemProps as any,
});
</script>

<style lang="scss" scoped>
.one-prompt-item {
  display: flex;
  gap: 8px;

  .one-prompt-item-icon.no-description {
    display: flex;
    align-items: center;
  }

  .one-prompt-item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .one-prompt-item-label {
      font-weight: bold;
    }
  }
}
</style>