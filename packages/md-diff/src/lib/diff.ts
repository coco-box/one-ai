import type { Root } from 'mdast';
import { diffMarkdownAst, transformAstWithDiffDataToAstWithDiffNode } from './core';
import { renderDiffAstToHtml } from './html';
import { markdownToAst } from './markdown';
import type { MarkdownDiffRenderOptions, MarkdownDiffResult } from './types';

export function createMarkdownDiffAst(oldMarkdown: string, newMarkdown: string): Root {
  const diffAst = diffMarkdownAst(markdownToAst(oldMarkdown), markdownToAst(newMarkdown));
  return transformAstWithDiffDataToAstWithDiffNode(diffAst) as Root;
}

export function renderMarkdownDiff(options: MarkdownDiffRenderOptions): MarkdownDiffResult {
  const diffAst = createMarkdownDiffAst(options.oldMarkdown, options.newMarkdown);
  return {
    diffAst,
    html: renderDiffAstToHtml(diffAst),
  };
}
