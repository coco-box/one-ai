<script setup lang="ts">
import { computed, ref } from 'vue';
import { renderMarkdownDiff } from '@coco-box/md-diff';

type EditorKind = 'old' | 'new';
type ThemeMode = 'light' | 'dark';

const oldMarkdown = ref(`# Markdown Diff 测试文档

欢迎使用这个测试页面，本文档专为**Markdown差异对比工具**的性能验证而设计。

## 更新日志
- **版本 1.0**：项目正式发布，包含基础的文字渲染和简单的表格。
- **版本 1.1**：增加了代码高亮支持和部分引用块。

## 待办事项清单
- 完成核心功能开发
- 编写全面的单元测试
- 部署到生产环境

这是一段普通的文本，我们将通过后续修改来测试工具的增删逻辑。
`);

const newMarkdown = ref(`# Markdown Diff 测试文档（已更新）

欢迎使用这个测试页面，本文档专为**Markdown差异对比工具**的性能验证与逻辑测试而设计。

## 更新日志
- **版本 1.1**：增加了代码高亮支持和部分引用块。
- **版本 1.2**：修复了已知的渲染 Bug，优化了前端加载速度 [查看更新说明](https://example.com)。

> **注意**：此处为新增的引用块，用于验证工具对块级元素和新样式的识别能力。

## 待办事项清单（已优化）
- 部署到生产环境

这是一段普通的文本，修改了部分形容词，以此来测试工具对**词级别高亮**和**文本微调**的抓取效果。
`);

const oldFileName = ref('history.md');
const newFileName = ref('current.md');
const themeMode = ref<ThemeMode>('light');

const summaryText = computed(() => {
  return `历史版本 ${oldMarkdown.value.length} 字 / 当前版本 ${newMarkdown.value.length} 字`;
});

const themeLabel = computed(() => {
  return themeMode.value === 'dark' ? '暗黑模式' : '浅色模式';
});

const diffResult = computed(() => renderMarkdownDiff({
  oldMarkdown: oldMarkdown.value,
  newMarkdown: newMarkdown.value,
}));

function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode;
}

async function handleFileChange(event: Event, kind: EditorKind) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const content = await file.text();

  if (kind === 'old') {
    oldMarkdown.value = content;
    oldFileName.value = file.name;
  } else {
    newMarkdown.value = content;
    newFileName.value = file.name;
  }

  input.value = '';
}
</script>

<template>
  <div class="page-shell" :data-theme="themeMode">
    <button
      type="button"
      class="theme-fab"
      :aria-label="themeMode === 'dark' ? '切换到浅色模式' : '切换到暗黑模式'"
      :title="themeMode === 'dark' ? '切换到浅色模式' : '切换到暗黑模式'"
      @click="setThemeMode(themeMode === 'dark' ? 'light' : 'dark')"
    >
      <span class="theme-fab__icon" aria-hidden="true">
        <svg v-if="themeMode === 'light'" viewBox="0 0 24 24" role="presentation">
          <path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0 3a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1Zm0-22a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V0a1 1 0 0 1 1-1Zm9 10a1 1 0 0 1 1 1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1 1 1 0 0 1 0-2h1Zm-22 0a1 1 0 0 1 1 1H1a1 1 0 0 1 0 2H0a1 1 0 0 1-1-1 1 1 0 0 1 0-2h1Zm15.36-6.36a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41Zm-12.02 12.02a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41Zm12.02 1.41a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0ZM4.67 4.67a1 1 0 0 1 0-1.41l.71-.71A1 1 0 1 1 6.79 3.96l-.71.71a1 1 0 0 1-1.41 0Z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" role="presentation">
          <path d="M20.8 14.2A8.6 8.6 0 0 1 9.8 3.2 1 1 0 0 0 8.6 2 10.5 10.5 0 1 0 22 15.4a1 1 0 0 0-1.2-1.2Zm-8.6 6.8A8.5 8.5 0 0 1 5.5 5.5 10.5 10.5 0 1 0 18.5 18.5 8.5 8.5 0 0 1 12.2 21Z"/>
        </svg>
      </span>
      <span class="theme-fab__text">{{ themeMode === 'dark' ? '浅色' : '暗黑' }}</span>
    </button>

    <header class="hero">
      <div class="hero-copy">
        <p class="hero-kicker">Turbo Monorepo / Vue 3 Demo</p>
        <h1>Markdown 渲染 Diff 示例</h1>
        <p>
          分别上传历史版和当前版的 Markdown 文件，页面会在下方直接展示渲染后的差异效果，
          重点是内容呈现的变化，而不是源码行级对比。
        </p>
      </div>
      <div class="hero-meta">
        <span>子包：<code>@coco-box/md-diff</code></span>
        <span>{{ summaryText }}</span>
      </div>
    </header>

    <main class="content-grid">
      <section class="editors-grid">
        <article class="editor-card">
          <div class="card-head">
            <div>
              <p class="card-label">历史版本</p>
              <h2>{{ oldFileName }}</h2>
            </div>
            <label class="upload-button">
              上传 <code>.md</code>
              <input accept=".md,text/markdown,text/plain" type="file" @change="handleFileChange($event, 'old')" />
            </label>
          </div>
          <textarea v-model="oldMarkdown" class="editor-textarea" spellcheck="false"></textarea>
        </article>

        <article class="editor-card">
          <div class="card-head">
            <div>
              <p class="card-label">当前版本</p>
              <h2>{{ newFileName }}</h2>
            </div>
            <label class="upload-button upload-button--accent">
              上传 <code>.md</code>
              <input accept=".md,text/markdown,text/plain" type="file" @change="handleFileChange($event, 'new')" />
            </label>
          </div>
          <textarea v-model="newMarkdown" class="editor-textarea" spellcheck="false"></textarea>
        </article>
      </section>

      <section class="result-card">
        <div class="card-head">
          <div>
            <p class="card-label">渲染结果</p>
            <h2>Markdown Diff 视图</h2>
          </div>
        </div>
        <div class="viewer-surface">
          <div class="viewer-html markdown-diff-host" v-html="diffResult.html"></div>
        </div>
      </section>
    </main>
  </div>
</template>
