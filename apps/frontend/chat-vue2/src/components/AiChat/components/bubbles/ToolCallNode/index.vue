<template>
  <div class="function-call-node flex flex-col">
    <div v-if="aiConfig.toolCalls.images.includes(part.type.replace('tool-', ''))" class='flex flex-column'>
      <div class='font-semibold my-1 flex justify-start align-center gap'><i class='one-icons-jqgl'></i>{{ part.type }}</div>
      <ImageNode :text='output' :state="part.state === 'output-error' ? 'error' : part.state === 'output-available' ? 'success' : 'loading'" />
    </div>
    <div v-else class="width-expander">
      <OneMarkdownCard
        :content="codeBlock"
        :defaultExpanded="defaultExpanded"
      >
        <template #lang>
          <div class="tool-line">
          <span class="mono flex justify-center items-center"><i :class="[
          part.state === 'output-error'
            ? 'el-icon-error text-error'
            : part.state === 'output-available'
              ? 'el-icon-circle-check text-success'
              : 'el-icon-loading text-primary'
          ]"></i></span>
            <span class="one-code-lang">{{ part.type }}</span>
          </div>
        </template>
      </OneMarkdownCard>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject } from '@vue/composition-api';
import ImageNode from '../ImageNode/index.vue';

export const parseRealData = (value: any, isImg = false) => {
  try {
    const data = JSON.parse(value);
    // console.log('parseRealData try', data);
    if (isImg) {
      return data?.url || '';
    }
    return JSON.stringify(data, null, 2);
  } catch (e) {
    // console.log('parseRealData catch', e, value);
    return value;
  }
};

export const parseString2Object = (value: string) => {
  try {
    const outer = JSON.parse(value);
    // console.log('parseString2Object try', outer);
    return outer[0] ?? { text: JSON.stringify(outer, null, 2) || '' }; // 兼容外层包数组的情况
  } catch (e) {
    // console.log('parseString2Object catch', e, value);
    return {
      text: value,
    };
  }
};

export default defineComponent({
  name: 'FunctionCallNode',
  components: { ImageNode },
  props: {
    part: {
      type: Object,
      default: () => ({
        state: '',
        output: '',
        errorText: '',
        type: ''
      }),
    },
    defaultExpanded: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const aiConfig = inject('aiConfig', {}) as any;
    const formatCodeSyntax = (code: string) => {
      // 尝试格式化为带缩进的 JSON；非法 JSON 则保持原文
      let content: string;
      try {
        content = JSON.stringify(JSON.parse(code), null, 2);
      } catch {
        content = code || '';
      }
      // 统一换行符，保留真实换行（fenced code block 内换行是安全的）
      content = content.replace(/\r\n?/g, '\n');
      // 找到内容中最长的连续反引号序列，外层 fence 长度 = max(3, longest + 1)
      const longest = (content.match(/`+/g) || []).reduce((max, seq) => Math.max(max, seq.length), 0);
      const fence = '`'.repeat(Math.max(3, longest + 1));
      const ret = `\n${fence}json\n${content}\n${fence}\n`;
      // console.log('formatCodeSyntax', { content, longest, fence, ret, rawContent: props.part.output, title: props.part.type, state: props.part.state });
      return ret;
    };

    const output = computed(() => {
      const isImg = aiConfig.toolCalls.images.includes(props.part.type.replace('tool-', ''));
      const parsed = parseString2Object(props.part.output);
      const rawText = typeof parsed?.text === 'string' ? parsed.text : String(parsed?.text ?? '');
      return parseRealData(rawText, isImg);
    });

    const codeBlock = computed(() => {
      const state = props.part.state; // 单独提取，确保追踪
      const content = state === 'output-error'
        ? props.part.errorText
        : state === 'output-available'
          ? output.value
          : '';

      return formatCodeSyntax(content);
    });

    return {
      codeBlock,
      aiConfig,
      output,
    };
  },
});
</script>

<style lang="scss" scoped>
.function-call-new-node {
  width: 100%;
  max-width: 100%;
  .desc {
    font-size: 16px;
    margin-bottom: 8px;
  }
}

.tool-line {
  display: inline-flex;
  justify-content: flex-start;
  align-content: center;
  gap: 6px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  i {
    position: relative;
    &.text-success {
      color: var(--hatech-success-color);
    }
    &.text-primary {
      color: var(--hatech-primary-color);
    }
    &.text-error {
      color: var(--hatech-danger-color);
    }
  }
}
</style>
