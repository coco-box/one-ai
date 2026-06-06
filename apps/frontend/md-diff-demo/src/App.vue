<script setup lang="ts">
import { computed, ref } from 'vue';
import { MarkdownDiffRenderer } from '@coco-box/md-diff';

type EditorKind = 'old' | 'new';

const oldMarkdown = ref(`# 项目周报

- 完成登录流程改造
- 补充接口重试机制
- 修复消息列表滚动问题
`);

const newMarkdown = ref(`# 项目周报

- 完成登录流程改造
- 补充接口重试机制和错误提示
- 修复消息列表滚动抖动问题
- 新增 Markdown Diff 示例页
`);

const oldFileName = ref('history.md');
const newFileName = ref('current.md');

const summaryText = computed(() => {
  return `历史版本 ${oldMarkdown.value.length} 字 / 当前版本 ${newMarkdown.value.length} 字`;
});

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
  <div class="page-shell">
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
        <MarkdownDiffRenderer
          title="历史版本 vs 当前版本"
          :old-markdown="oldMarkdown"
          :new-markdown="newMarkdown"
        />
      </section>
    </main>
  </div>
</template>
