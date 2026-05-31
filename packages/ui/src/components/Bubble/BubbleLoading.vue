<template>
  <div class="one-bubble-loading">
    <div class="loading-dot dot-start" />
    <div class="loading-dot dot-middle" />
    <div class="loading-dot dot-end" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OneBubbleLoading',
});
</script>

<style scoped lang="scss">
.one-bubble-loading {
  display: flex;
  align-items: center;
  gap: 8px;

  .loading-dot {
    width: 8px;
    height: 8px;
    border-radius: 5px;
    background-color: #9880ff;

    &.dot-start {
      animation: dotFlashing 1s infinite linear alternate;
      animation-delay: 0s;
    }

    &.dot-middle {
      animation: dotFlashing 1s infinite linear alternate;
      animation-delay: 0.5s;
    }

    &.dot-end {
      animation: dotFlashing 1s infinite linear alternate;
      animation-delay: 1s;
    }
  }
}

@keyframes dotFlashing {
  0% {
    background-color: #9880ff;
  }
  100% {
    background-color: #ebe6ff;
  }
}
</style>
