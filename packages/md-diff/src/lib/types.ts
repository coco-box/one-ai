import type { Root } from 'mdast';

export interface MarkdownDiffResult {
  diffAst: Root;
  html: string;
}

export interface MarkdownDiffRenderOptions {
  oldMarkdown: string;
  newMarkdown: string;
}
