<template>
  <div
    class="thinking-node"
  >
    <div class="w-full">
      <!-- 上区整体可点击 -->
      <button
        type="button"
        class="operation-button flex items-center justify-between select-none p-0 bg-transparent border-none outline-none focus:outline-none cursor-pointer"
        @click="toggleExpand"
        tabindex="0"
      >
        <div class="flex items-center justify-between flex-1 min-w-0" style="gap: 8px;">
          <span
            class="position flex-shrink-0 text-gray-400 w-4 h-4 flex items-center justify-center"
            style='top: -1px; color: var(--hatech-base-font-color-secondary-text)'
          >
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_308_02595/308_00376"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_308_02595/308_00376)"><g><path d="M2.8671,8C2.8671,5.2385,5.1056,3,7.8671,3C10.6286,3,12.8671,5.2385,12.8671,8C12.8671,10.7615,10.6286,13,7.8671,13C5.1056,13,2.8671,10.7615,2.8671,8ZM6.5001,13.5L9.5001,13.5C9.77624,13.5,10.0001,13.7239,10.0001,14C10.0001,14.2761,9.77624,14.5,9.5001,14.5L6.5001,14.5C6.22396,14.5,6.0001,14.2761,6.0001,14C6.0001,13.7239,6.22396,13.5,6.5001,13.5ZM7.5001,15L8.5001,15C8.77624,15,9.0001,15.2239,9.0001,15.5C9.0001,15.7761,8.77624,16,8.5001,16L7.5001,16C7.22396,16,7.0001,15.7761,7.0001,15.5C7.0001,15.2239,7.22396,15,7.5001,15ZM7.5276,0C7.80374,0,8.0276,0.223858,8.0276,0.5L8.0276,1.5C8.0276,1.77614,7.80374,2,7.5276,2C7.25146,2,7.0276,1.77614,7.0276,1.5L7.0276,0.5C7.0276,0.223858,7.25146,0,7.5276,0ZM12.7226,1.631C12.9455,1.79348,12.9948,2.10583,12.8326,2.329L12.2451,3.138C12.0808,3.35535,11.7728,3.4012,11.5524,3.24112C11.332,3.08104,11.2802,2.77395,11.4361,2.5505L12.0236,1.7415C12.186,1.51807,12.4987,1.4686,12.7221,1.631L12.7226,1.631ZM15.7416,5.3125C15.8269,5.57511,15.6832,5.85716,15.4206,5.9425L14.4696,6.2515C14.2059,6.34035,13.9204,6.19683,13.8344,5.93218C13.7484,5.66754,13.895,5.38361,14.1606,5.3005L15.1116,4.9915C15.3742,4.90619,15.6563,5.0499,15.7416,5.3125ZM15.7416,10.2565C15.6563,10.5191,15.3742,10.6628,15.1116,10.5775L14.1606,10.2685C13.9009,10.181,13.76,9.90078,13.8447,9.64017C13.9294,9.37955,14.2081,9.23565,14.4696,9.3175L15.4206,9.6265C15.6832,9.71184,15.8269,9.99389,15.7416,10.2565ZM0.5245979,10.2565C0.4392872,9.99389,0.5829977,9.71184,0.8455980000000001,9.6265L1.7966,9.3175C2.06029,9.22865,2.3458,9.37217,2.43178,9.63682C2.51777,9.90146,2.3711599999999997,10.1854,2.1056,10.2685L1.154598,10.5775C0.891988,10.6628,0.609939,10.5191,0.5245979,10.2565ZM0.5245979,5.3125C0.609939,5.0499,0.891988,4.90619,1.154598,4.9915L2.1056,5.3005C2.37117,5.38361,2.51779,5.66754,2.4318,5.93219C2.34581,6.19684,2.0603,6.34037,1.7966,6.2515L0.8455980000000001,5.9425C0.5829978,5.85716,0.4392874,5.57511,0.5245979,5.3125ZM3.3176,1.631C3.54086,1.46849,3.85359,1.51774,4.0161,1.741L4.6036,2.5505C4.75445,2.7738,4.70121,3.07648,4.48321,3.23489C4.26521,3.3933,3.96088,3.35045,3.7951,3.138L3.2071,2.329C3.04503,2.1057,3.09449,1.79332,3.3176,1.631ZM3.8671,8C3.8671,10.2091,5.65796,12,7.8671,12C10.07624,12,11.8671,10.2091,11.8671,8C11.8671,5.79086,10.07624,4,7.8671,4C5.65796,4,3.8671,5.79086,3.8671,8Z" fill="currentColor" fill-opacity="1" /></g></g></svg>
          </span>
          <div class="flex items-center flex-1 overflow-hidden w-fit" style="gap: 8px;">
            <span class="reasoning-text flex-shrink-0 relative flex-grow-0">{{ state === 'streaming' ? '思考中...' : '思考过程' }}</span>
            <span v-if="!isExpanded" class="summary-text truncate visible">
              {{ summaryText }}
            </span>
          </div>
        </div>
        <span class="flex items-center justify-center w-3 h-3">
          <svg
            class="w-4 h-4 transform scale-120 transition-transform"
            :class="{ 'rotate-180': isExpanded }"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 9L12 16L5 9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
      <!-- 下区：完整内容（展开时） -->
      <div v-show="isExpanded" class="complete-content hatech-think-block-content">
        <OneMarkdownCard :content="thinkText" :enableThink="true" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';

export default defineComponent({
  name: 'ReasoningNode',
  props: {
    text: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: 'done'
    }
  },
  setup(props) {
    const isExpanded = ref(true);
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
    };
    // 只取一行内容，超出省略号
    const summaryText = computed(() => {
      // 取纯文本，避免 markdown 标签
      return props.text
        .replace(/[#*_`>\-[\]()!]/g, '')
        .replace(/\n/g, ' ');
    });
    // think 包装
    const thinkText = computed(() => props.text);
    return {
      isExpanded,
      toggleExpand,
      summaryText,
      thinkText,
    };
  },
});
</script>

<style lang="scss" scoped>
.thinking-node {
  box-sizing: border-box;
  .bg {
    background-color: #fff;
  }
  ::v-deep {
    p {
      margin: 0;
    }
  }
  button {
    background: var(--hatech-base-fill-color-nav-hover);
    border: none;
    outline: none;
    box-shadow: none;
    padding: 0;
    width: 100%;
    text-align: left;
    font-size: 14px;
    font-weight: 350;
    line-height: 22px;
    color: var(--hatech-base-font-color);
  }
  .operation-button {
    border-radius: 8px;
    box-sizing: border-box;
    padding: 7px 12px;
    width: auto;
    max-width: 100%;
    gap: 8px;

    .summary-text {
      color: var(--hatech-base-font-color-secondary-info);
    }
  }
  .complete-content {
    margin-top: 8px;
    color: var(--hatech-base-font-color-secondary-info);
    font-size: 14px;
    font-weight: 350;
    line-height: 22px;
    .one-markdown-render {
      color: var(--hatech-base-font-color-secondary-info) !important;
    }
  }
  .reasoning-text {
    color: var(--hatech-base-font-color);
  }
  ::v-deep {
    .hatech-think-block-content {
      border-left: 1px solid var(--hatech-base-border-color);
      padding-left: 8px;
    }
  }
}
</style>
