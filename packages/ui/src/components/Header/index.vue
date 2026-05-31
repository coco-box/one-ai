<template>
  <div class="one-header">
    <div class="one-header-logo-container" :class="{ clickable: logoClickable }" @click="onLogoClicked">
      <img v-if="logoImg" class="one-header-logo" :src="logoImg" :alt="logoImg" />
      <div class="one-header-title">{{ title }}</div>
    </div>
    <div class="one-header-operation">
      <slot name="operationArea" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, SetupContext } from '@vue/composition-api';
import { props as headerProps, HeaderProps } from './header-types';

export default defineComponent({
  name: 'OneHeader',
  props: headerProps,
  setup(props: HeaderProps, { emit }: SetupContext) {
    const onLogoClicked = () => {
      if (props.logoClickable) {
        emit('logoClicked');
      }
    };

    return {
      onLogoClicked,
    };
  },
});
</script>

<style scoped lang="scss">
.one-header {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .one-header-logo-container {
    display: flex;
    align-items: center;
    gap: 4px;

    &.clickable {
      cursor: pointer;
    }

    .one-header-title {
      letter-spacing: 1px;
      font-weight: 500;
      font-size: 20px;
    }
  }
}
</style>