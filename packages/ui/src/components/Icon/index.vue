<template>
  <component :is="tag" :class="name" />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { oneIconProps } from './icon-types';

export default defineComponent({
  name: 'OneIcon',
  props: oneIconProps,
});
</script>