<template>
  <img
    ref="imgRef"
    :class="classes"
    :src="imgSrc"
    :alt="alt"
    v-bind="$attrs"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from '@vue/composition-api';
import { imageProps } from './image-types';

export default defineComponent({
  name: 'OneImage',
  props: imageProps,
  setup(props, { attrs }) {
    const imgRef = ref<HTMLImageElement | null>(null);
    const imgSrc = ref(props.lazy ? undefined : props.src);
    const lazyLoaded = ref(false);
    let observer: IntersectionObserver | null = null;

    const classes = computed(() => [
      'one-image',
      { 'one-image--fluid': props.fluid },
      attrs.class,
    ]);

    const observe = () => {
      if (!imgRef.value) return;

      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          imgSrc.value = props.src;
          lazyLoaded.value = true;
          // Unobserve after loading
          if (observer && imgRef.value) {
            observer.unobserve(imgRef.value);
          }
        }
      });
      observer.observe(imgRef.value);
    };

    onMounted(() => {
      if (props.lazy) {
        observe();
      }
    });

    onUnmounted(() => {
      if (observer) {
        observer.disconnect();
      }
    });

    watch(
      () => props.src,
      (newSrc) => {
        if (!props.lazy || lazyLoaded.value) {
          imgSrc.value = newSrc;
        }
      }
    );

    return {
      imgRef,
      imgSrc,
      classes,
    };
  },
});
</script>

<style lang="scss" scoped>
.one-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-style: none;

  &--fluid {
    max-width: 100%;
    height: auto;
  }
}
</style>