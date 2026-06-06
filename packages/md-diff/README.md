# @coco-box/md-diff

`@coco-box/md-diff` 是一个无关框架的 Markdown AST diff 工具包。

它负责两件事：

1. 把两份 Markdown 转成 diff AST。
2. 把 diff AST 渲染成带有 diff class 的 HTML。

包本身不依赖 Vue、React 等框架。你可以在任意前端项目里直接使用它，再按需引入 `@coco-box/md-diff/styles.css` 来加载 diff 样式。

## 安装

```bash
pnpm add @coco-box/md-diff
```

## 基础用法

先引入样式，再调用 `renderMarkdownDiff`：

```ts
import '@coco-box/md-diff/styles.css';
import { renderMarkdownDiff } from '@coco-box/md-diff';

const { html, diffAst } = renderMarkdownDiff({
  oldMarkdown,
  newMarkdown,
});

container.innerHTML = html;
```

如果你想自己接管 AST 到 HTML 的过程，也可以拆开使用：

```ts
import '@coco-box/md-diff/styles.css';
import { createMarkdownDiffAst, renderDiffAstToHtml } from '@coco-box/md-diff';

const diffAst = createMarkdownDiffAst(oldMarkdown, newMarkdown);
const html = renderDiffAstToHtml(diffAst);
```

## Vue 3 用法

`main.ts`

```ts
import { createApp } from 'vue';
import App from './App.vue';
import '@coco-box/md-diff/styles.css';
import './style.css';

createApp(App).mount('#app');
```

`App.vue`

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { renderMarkdownDiff } from '@coco-box/md-diff';

const oldMarkdown = ref('# 旧版本\n\n第一段内容。');
const newMarkdown = ref('# 新版本\n\n第一段内容');

const diffResult = computed(() => renderMarkdownDiff({
  oldMarkdown: oldMarkdown.value,
  newMarkdown: newMarkdown.value,
}));
</script>

<template>
  <div class="markdown-diff-host" v-html="diffResult.html"></div>
</template>
```

## React 用法

```tsx
import { useMemo } from 'react';
import '@coco-box/md-diff/styles.css';
import { renderMarkdownDiff } from '@coco-box/md-diff';

type Props = {
  oldMarkdown: string;
  newMarkdown: string;
};

export function MarkdownDiffPreview({ oldMarkdown, newMarkdown }: Props) {
  const result = useMemo(() => {
    return renderMarkdownDiff({
      oldMarkdown,
      newMarkdown,
    });
  }, [oldMarkdown, newMarkdown]);

  return (
    <div
      className="markdown-diff-host"
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
}
```

## 暗黑模式与样式覆盖

默认样式包含两层能力：

1. 自动跟随 `prefers-color-scheme: dark`。
2. 支持 `.dark`、`[data-theme="dark"]`、`[data-color-mode="dark"]` 这类常见显式暗黑模式容器。

如果你想自定义主题，推荐在自己的容器上覆盖 CSS 变量：

```css
.markdown-diff-host {
  --md-diff-color: #1e293b;
  --md-diff-link-color: #0f766e;
  --md-diff-insert-bg: #dcfce7;
  --md-diff-delete-bg: #fee2e2;
}

[data-theme="dark"] .markdown-diff-host {
  --md-diff-color: #e2e8f0;
  --md-diff-pre-bg: #0f172a;
  --md-diff-insert-border: #4ade80;
  --md-diff-delete-border: #fb7185;
}
```

如果你想直接覆盖具体节点样式，也可以在本地样式文件中放在包样式之后声明：

```css
.markdown-diff-host .md-diff-inline-ins {
  border-bottom: 1px solid currentColor;
}

.markdown-diff-host .md-diff-del {
  border-left-width: 6px;
}
```

## 导出内容

- `createMarkdownDiffAst`
- `renderMarkdownDiff`
- `renderDiffAstToHtml`
- `markdownToAst`
- `MARKDOWN_DIFF_BODY_CLASS_NAME`
- `@coco-box/md-diff/styles.css`
