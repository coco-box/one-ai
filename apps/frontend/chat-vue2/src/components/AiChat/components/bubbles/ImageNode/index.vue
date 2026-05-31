<template>
  <div class="image-wrapper">
    <el-image
      class="preview-image"
      :src="text"
      :preview-src-list="[text]"
      fit="contain"
    >
      <!-- 加载中 -->
      <template #placeholder>
        <div
          class="image-slot w-full flex justify-center align-center p-2"
          style="background-color: var(--hatech-base-fill-color-nav-hover);"
        >
          <!--<i class="el-icon-loading mr-1"></i> 图片加载中...-->
          {{ currentState === 'error' ? '图片加载失败' : '图片加载中...' }}
        </div>
      </template>
      <!-- 加载失败 -->
      <template #error>
        <div class='flex'></div>
      </template>
    </el-image>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'IndexImage',
  props: {
    text: {
      type: String,
      required: true
    },
    // 可选的外部状态控制
    state: {
      type: String,
      default: 'loading' // 可为 'loading' | 'error' | 'success'
    }
  },
  setup(props) {
    const currentState = ref<'loading' | 'error' | 'success'>('loading');

    // 当外部传入 state 时优先使用
    watch(
      () => props.state,
      (newVal) => {
        if (newVal) currentState.value = newVal as any;
        console.log(currentState.value, newVal);
      },
      { immediate: true }
    );

    return {
      currentState,
    };
  }
});
</script>

<style scoped lang='scss'>
.image-wrapper {
  display: inline-block;
  cursor: zoom-in;
}

.preview-image {
  max-width: 100%;
  border-radius: 4px;
}

::v-deep {
  .image-slot {
    box-sizing: border-box;
    aspect-ratio: 1.68 / 1;
  }
}
</style>
