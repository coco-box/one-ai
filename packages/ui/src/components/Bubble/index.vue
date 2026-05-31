<template>
  <div class="one-bubble one-text-sm" :class="bubbleClasses">
    <div v-if="$scopedSlots.avatar" class="one-bubble-avatar">
      <slot name="avatar" />
    </div>
    <div v-else-if="avatarConfig" class="one-bubble-avatar" :class="{ 'empty-avatar': isEmptyAvatar }">
      <Avatar
        v-bind="
          isEmptyAvatar
            ? {
              width: (avatarConfig && avatarConfig.width) || DEFAULT_AVATAR_WIDTH,
              height: (avatarConfig && avatarConfig.height) || DEFAULT_AVATAR_HEIGHT,
            }
            : avatarConfig
        "
      />
      <span v-if="avatarPosition === 'top'" class="one-bubble-avatar-name">
        {{ avatarConfig && avatarConfig.displayName }}
      </span>
    </div>

    <div class="one-bubble-content-container" :class="{ 'with-avatar': avatarConfig }">
      <slot v-if="!loading" name="top" />

      <div v-if="loading" class="loading-container">
        <slot name="loadingTpl">
          <BubbleLoading />
        </slot>
      </div>

      <div v-if="($scopedSlots.default || content) && !loading" class="one-bubble-content" :class="[variant]">
        <slot>{{ content }}</slot>
      </div>

      <slot v-if="!loading" name="bottom" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, SetupContext } from '@vue/composition-api';
import Avatar from './components/Avatar/index.vue';
import BubbleLoading from './BubbleLoading.vue';
import { bubbleProps, BubbleProps } from './bubble-types';
import { DEFAULT_AVATAR_WIDTH, DEFAULT_AVATAR_HEIGHT, AVATAR_NAME, AVATAR_IMG } from './bubble-constants';

export default defineComponent({
  name: 'OneBubble',
  components: {
    Avatar,
    BubbleLoading,
  },
  props: bubbleProps,
  setup(props: BubbleProps, { slots }: SetupContext) {
    const bubbleClasses = computed(() => [
      `one-bubble-avatar-${props.avatarPosition}`,
      `one-bubble-${props.align}`,
      props.loading ? 'one-bubble-loading' : '',
    ]);

    const isEmptyAvatar = computed(() => {
      if (props.avatarConfig) {
        const keys = Object.keys(props.avatarConfig);
        const shouldShow = keys.some((k) => k === AVATAR_NAME || k === AVATAR_IMG);
        return keys.length < 1 || !shouldShow;
      }
      return true;
    });

    return {
      bubbleClasses,
      isEmptyAvatar,
      DEFAULT_AVATAR_WIDTH,
      DEFAULT_AVATAR_HEIGHT,
    };
  },
});
</script>

<style scoped lang="scss">
@use './bubble.scss';
</style>