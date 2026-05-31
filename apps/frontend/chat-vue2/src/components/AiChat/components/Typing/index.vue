<template>
  <div class="typing-container flex justify-start items-center h-full">
    <div class="jelly" />
    <svg width="0" height="0" class="jelly-maker">
      <defs>
        <filter id="uib-jelly-ooze">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6.25" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="ooze" />
          <feBlend in="SourceGraphic" in2="ooze" />
        </filter>
      </defs>
    </svg>
    <span v-if="text" class="typing-text">{{ text }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'AiTyping',
  props: {
    text: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.typing-container {
  display: flex;
  align-items: center;
  gap: 8px;

  .typing-text {
    position: relative;
    font-size: 16px;
    overflow: hidden;
    color: var(--hatech-base-font-color);

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: translateX(-100%);
      background: linear-gradient(
          90deg,
          transparent,
          var(--hatech-base-background-color-element),
          transparent
      );
      animation: shine 2s infinite 0.5s;
    }
  }
}

@keyframes shine {
  100% {
    transform: translateX(100%);
  }
}

.jelly {
  --uib-size: 20px;
  --uib-speed: 1s;
  --uib-color: #4150FF;
  position: relative;
  height: calc(var(--uib-size) / 2);
  width: var(--uib-size);
  filter: url('#uib-jelly-ooze');
  animation: rotate72317 calc(var(--uib-speed) * 2) linear infinite;
}

.jelly::before,
.jelly::after {
  content: '';
  position: absolute;
  top: 0%;
  left: 25%;
  width: 50%;
  height: 100%;
  background: var(--uib-color);
  border-radius: 100%;
}

.jelly::before {
  animation: shift-left var(--uib-speed) ease infinite;
}

.jelly::after {
  animation: shift-right var(--uib-speed) ease infinite;
}

.jelly-maker {
  width: 0;
  height: 0;
  position: absolute;
}

@keyframes rotate72317 {
  0%,
  49.999%,
  100% {
    transform: none;
  }

  50%,
  99.999% {
    transform: rotate(90deg);
  }
}

@keyframes shift-left {
  0%,
  100% {
    transform: translateX(0%);
  }

  50% {
    transform: scale(0.65) translateX(-75%);
  }
}

@keyframes shift-right {
  0%,
  100% {
    transform: translateX(0%);
  }

  50% {
    transform: scale(0.65) translateX(75%);
  }
}
</style>
