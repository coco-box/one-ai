<template>
  <div class="one-introduction" :class="[align, background]">
    <div class="one-introduction-logo-container">
      <OneImage v-if="logoConfig" v-bind="logoConfig" />
      <div class="one-introduction-title">{{ title }}</div>
    </div>
    <div v-if="subTitle" class="one-introduction-sub-title">{{ subTitle }}</div>
    <div v-if="description.length" class="one-introduction-description">
      <div v-for="(item, index) in description" :key="index">{{ item }}</div>
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { props as introductionProps } from './introduction-types';
import { OneImage } from '../Image';

export default defineComponent({
  name: 'OneIntroduction',
  props: introductionProps,
  components: {
    OneImage,
  },
  setup(props) {
    return {
      props,
    };
  }
});
</script>

<style scoped lang="scss">
.one-introduction {
  display: flex;
  gap: 12px;
  flex-direction: column;
  color: var(--one-text);

  .one-introduction-logo-container {
    display: flex;
    align-items: center;
    gap: 8px;

    .one-introduction-title {
      font-weight: 700;
      font-size: 32px;
      letter-spacing: 1px;
    }
  }

  .one-introduction-sub-title {
    font-weight: 500;
    font-size: 18px;
  }

  .one-introduction-description {
    font-size: var(--one-font-size-md);

    & > div {
      line-height: 1.5;
    }
  }

  &.filled {
    background-color: var(--one-global-bg);
    border-radius: 8px;
    padding: 8px 12px;
  }

  &.center {
    align-items: center;
    .one-introduction-description {
      text-align: center;
    }
  }

  &.left {
    align-items: flex-start;
    .one-introduction-description {
      text-align: left;
    }
  }

  &.right {
    align-items: flex-end;
    .one-introduction-description {
      text-align: right;
    }
  }
}
</style>
