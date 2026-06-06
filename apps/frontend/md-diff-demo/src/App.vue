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
        <svg v-if="themeMode === 'light'" viewBox="0 0 1024 1024" role="presentation">
          <path d="M554.666667 42.666667v85.333333a42.666667 42.666667 0 0 1-85.333334 0V42.666667a42.666667 42.666667 0 0 1 85.333334 0z m-42.666667 810.666666a42.666667 42.666667 0 0 0-42.666667 42.666667v85.333333a42.666667 42.666667 0 0 0 85.333334 0v-85.333333a42.666667 42.666667 0 0 0-42.666667-42.666667zM149.962667 149.962667a42.666667 42.666667 0 0 0 0 60.341333l60.341333 60.341333a42.666667 42.666667 0 0 0 60.341333-60.341333l-60.341333-60.341333a42.666667 42.666667 0 0 0-60.341333 0z m603.392 603.392a42.666667 42.666667 0 0 0 0 60.330666v0.010667l60.341333 60.341333a42.666667 42.666667 0 0 0 60.341333-60.341333l-60.341333-60.341333a42.656 42.656 0 0 0-60.341333 0zM0 512a42.666667 42.666667 0 0 0 42.666667 42.666667h85.333333a42.666667 42.666667 0 0 0 0-85.333334H42.666667a42.666667 42.666667 0 0 0-42.666667 42.666667z m853.333333 0a42.666667 42.666667 0 0 0 42.666667 42.666667h85.333333a42.666667 42.666667 0 0 0 0-85.333334h-85.333333a42.666667 42.666667 0 0 0-42.666667 42.666667zM149.962667 874.037333a42.666667 42.666667 0 0 0 60.341333 0l60.330667-60.341333a42.666667 42.666667 0 0 0-60.330667-60.341333l-60.341333 60.341333a42.666667 42.666667 0 0 0 0 60.341333z m603.392-603.392a42.666667 42.666667 0 0 0 60.330666 0h0.010667l60.341333-60.341333a42.666667 42.666667 0 0 0-60.341333-60.341333l-60.341333 60.341333a42.656 42.656 0 0 0 0 60.341333zM768 512c0 141.386667-114.613333 256-256 256S256 653.386667 256 512s114.613333-256 256-256 256 114.613333 256 256z m-85.333333 0c0-94.261333-76.405333-170.666667-170.666667-170.666667s-170.666667 76.405333-170.666667 170.666667 76.405333 170.666667 170.666667 170.666667 170.666667-76.405333 170.666667-170.666667z"></path>
        </svg>
        <svg v-else viewBox="0 0 1024 1024" role="presentation">
          <path d="M593.054 120.217C483.656 148.739 402.91 248.212 402.91 366.546c0 140.582 113.962 254.544 254.544 254.544 118.334 0 217.808-80.746 246.328-190.144C909.17 457.12 912 484.23 912 512c0 220.914-179.086 400-400 400S112 732.914 112 512s179.086-400 400-400c27.77 0 54.88 2.83 81.054 8.217z"></path>
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
