import type { Root } from 'mdast';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';

export function markdownToAst(markdownText: string): Root {
  const processor = unified().use(remarkParse).use(remarkGfm);
  return processor.parse(markdownText) as Root;
}
