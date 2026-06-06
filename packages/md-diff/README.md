# @coco-box/md-diff

把两份 Markdown 文本做 AST diff，并输出接近 GitHub 文件比对观感的渲染结果。

## 构建

```bash
pnpm --filter @coco-box/md-diff build
```

## 使用

```ts
import { renderMarkdownDiff, createMarkdownDiffAst, MarkdownDiffRenderer } from '@coco-box/md-diff';

const { html, diffAst } = renderMarkdownDiff({
  oldMarkdown,
  newMarkdown,
});
```

## 示例页面

仓库里的静态示例位于 `apps/frontend/md-diff-demo`，用于上传两份 `.md` 文件并查看渲染对比效果。
