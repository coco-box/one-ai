export { default as MarkdownDiffRenderer } from './components/MarkdownDiffRenderer.vue';
export { useMarkdownDiff } from './composables/useMarkdownDiff';
export { createMarkdownDiffAst, renderMarkdownDiff, renderDiffAstToHtml, getMarkdownDiffStyles, markdownToAst } from './lib';
export type { MarkdownDiffRenderOptions, MarkdownDiffResult } from './lib';
