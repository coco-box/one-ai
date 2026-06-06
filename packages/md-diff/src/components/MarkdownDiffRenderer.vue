<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { getMarkdownDiffStyles, renderMarkdownDiff } from '../lib';

const props = withDefaults(defineProps<{
  oldMarkdown: string;
  newMarkdown: string;
  title?: string;
}>(), {
  title: '渲染结果',
});

const result = computed(() => renderMarkdownDiff({
  oldMarkdown: props.oldMarkdown,
  newMarkdown: props.newMarkdown,
}));

const styleElementId = 'markdown-diff-renderer-styles';

onMounted(() => {
  if (document.getElementById(styleElementId)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleElementId;
  styleElement.textContent = getMarkdownDiffStyles();
  document.head.appendChild(styleElement);
});
</script>

<template>
  <section class="viewer-panel">
    <div class="panel-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="viewer-surface">
      <div class="viewer-html" v-html="result.html"></div>
    </div>
  </section>
</template>
