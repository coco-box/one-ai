<template>
  <div class="loading-container">
    <div class="loading-dots">
      <div class="dot" />
      <div class="dot" />
      <div class="dot" />
    </div>
    <div class="loading-text" v-if="text">{{ text }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'AiLoading',
  props: {
    text: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  gap: 8px;

  .loading-dots {
    display: flex;
    gap: 4px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #409eff;
      animation: bounce 1.4s infinite ease-in-out both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
  }

  .loading-text {
    font-size: 14px;
    color: #666;
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
}
</style>
