import type {
  Blockquote,
  Code,
  Content,
  Delete,
  Emphasis,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast';
import type { Node } from 'unist';
import { marked } from 'marked';

type DiffNodeType = 'ins' | 'del' | 'inlineIns' | 'inlineDel';

interface DiffWrapperNode extends Node {
  type: DiffNodeType;
  children?: Content[];
}

const GITHUB_MARKDOWN_BODY_CLASS = 'md-diff-body';

export function renderDiffAstToHtml(ast: Root): string {
  return `<div class="${GITHUB_MARKDOWN_BODY_CLASS}">${renderChildren(ast.children ?? [])}</div>`;
}

export function getMarkdownDiffStyles(): string {
  return `
.md-diff-body {
  color: #1f2328;
  font: 400 14px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.md-diff-body > :first-child {
  margin-top: 0;
}

.md-diff-body > :last-child {
  margin-bottom: 0;
}

.md-diff-body h1,
.md-diff-body h2,
.md-diff-body h3,
.md-diff-body h4,
.md-diff-body h5,
.md-diff-body h6 {
  margin: 24px 0 16px;
  font-weight: 600;
  line-height: 1.25;
}

.md-diff-body h1,
.md-diff-body h2 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid #d1d9e0;
}

.md-diff-body p,
.md-diff-body ul,
.md-diff-body ol,
.md-diff-body blockquote,
.md-diff-body pre,
.md-diff-body table {
  margin: 0 0 16px;
}

.md-diff-body ul,
.md-diff-body ol {
  padding-left: 2em;
}

.md-diff-body blockquote {
  margin-left: 0;
  padding: 0 1em;
  color: #59636e;
  border-left: 0.25em solid #d1d9e0;
}

.md-diff-body code,
.md-diff-body pre {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
}

.md-diff-body code {
  padding: 0.2em 0.4em;
  border-radius: 6px;
  background: rgba(175, 184, 193, 0.2);
  font-size: 85%;
}

.md-diff-body pre {
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: #f6f8fa;
}

.md-diff-body pre code {
  padding: 0;
  background: transparent;
}

.md-diff-body table {
  display: block;
  width: max-content;
  max-width: 100%;
  border-collapse: collapse;
  overflow: auto;
}

.md-diff-body table th,
.md-diff-body table td {
  padding: 6px 13px;
  border: 1px solid #d1d9e0;
}

.md-diff-body table tr:nth-child(2n) {
  background: #f6f8fa;
}

.md-diff-body a {
  color: #0969da;
  text-decoration: none;
}

.md-diff-body a:hover {
  text-decoration: underline;
}

.md-diff-body hr {
  height: 0.25em;
  margin: 24px 0;
  padding: 0;
  background: #d1d9e0;
  border: 0;
}

.md-diff-ins,
.md-diff-inline-ins {
  background: #dafbe1;
}

.md-diff-del,
.md-diff-inline-del {
  background: #ffebe9;
}

.md-diff-ins {
  display: block;
  padding: 0 12px;
  margin: 0 0 16px;
  border-left: 4px solid #1a7f37;
  border-radius: 0 8px 8px 0;
}

.md-diff-del {
  display: block;
  padding: 0 12px;
  margin: 0 0 16px;
  border-left: 4px solid #cf222e;
  border-radius: 0 8px 8px 0;
}

.md-diff-inline-ins,
.md-diff-inline-del {
  padding: 0 2px;
  border-radius: 4px;
}

.md-diff-inline-del {
  text-decoration: line-through;
}

.md-diff-list-item-ins {
  background: #dafbe1;
  border-radius: 6px;
}

.md-diff-list-item-del {
  background: #ffebe9;
  border-radius: 6px;
}

.md-diff-list-item-del > * {
  text-decoration: line-through;
}
`;
}

function renderChildren(children: Content[]): string {
  return children.map((child) => renderNode(child)).join('');
}

function renderNode(node: Content | DiffWrapperNode): string {
  switch (node.type) {
    case 'heading':
      return renderHeading(node as Heading);
    case 'paragraph':
      return wrapTag('p', {}, renderChildren((node as Paragraph).children ?? []));
    case 'text':
      return escapeHtml((node as Text).value);
    case 'strong':
      return wrapTag('strong', {}, renderChildren((node as Strong).children ?? []));
    case 'emphasis':
      return wrapTag('em', {}, renderChildren((node as Emphasis).children ?? []));
    case 'delete':
      return wrapTag('del', {}, renderChildren((node as Delete).children ?? []));
    case 'inlineCode':
      return wrapTag('code', {}, escapeHtml((node as InlineCode).value));
    case 'code':
      return renderCode(node as Code);
    case 'blockquote':
      return wrapTag('blockquote', {}, renderChildren((node as Blockquote).children ?? []));
    case 'list':
      return renderList(node as List);
    case 'listItem':
      return renderListItem(node as ListItem);
    case 'link':
      return renderLink(node as Link);
    case 'image':
      return renderImage(node as Image);
    case 'thematicBreak':
      return '<hr />';
    case 'html':
      return renderRawHtml(node as Html);
    case 'table':
      return renderTable(node as Table);
    case 'tableRow':
      return wrapTag('tr', {}, renderChildren((node as TableRow).children ?? []));
    case 'tableCell':
      return renderTableCell(node as TableCell);
    case 'break':
      return '<br />';
    case 'ins':
      return wrapTag('div', { class: 'md-diff-ins' }, renderChildren((node as DiffWrapperNode).children ?? []));
    case 'del':
      return wrapTag('div', { class: 'md-diff-del' }, renderChildren((node as DiffWrapperNode).children ?? []));
    case 'inlineIns':
      return wrapTag('span', { class: 'md-diff-inline-ins' }, renderChildren((node as DiffWrapperNode).children ?? []));
    case 'inlineDel':
      return wrapTag('span', { class: 'md-diff-inline-del' }, renderChildren((node as DiffWrapperNode).children ?? []));
    default:
      return 'children' in node && Array.isArray(node.children) ? renderChildren(node.children as Content[]) : '';
  }
}

function renderHeading(node: Heading): string {
  const level = Math.min(Math.max(node.depth ?? 1, 1), 6);
  return wrapTag(`h${level}`, {}, renderChildren(node.children ?? []));
}

function renderCode(node: Code): string {
  const className = node.lang ? `language-${escapeHtml(node.lang)}` : '';
  const code = wrapTag('code', className ? { class: className } : {}, escapeHtml(node.value));
  return wrapTag('pre', {}, code);
}

function renderList(node: List): string {
  const tag = node.ordered ? 'ol' : 'ul';
  const attrs: Record<string, string> = {};
  if (node.start && node.start !== 1) {
    attrs.start = String(node.start);
  }
  return wrapTag(tag, attrs, renderChildren(node.children ?? []));
}

function renderListItem(node: ListItem): string {
  const diffType = node.data?.diff;
  const className = diffType === 'ins'
    ? 'md-diff-list-item-ins'
    : diffType === 'del'
      ? 'md-diff-list-item-del'
      : '';
  return wrapTag('li', className ? { class: className } : {}, renderChildren(node.children ?? []));
}

function renderLink(node: Link): string {
  return wrapTag(
    'a',
    {
      href: node.url,
      title: node.title ?? '',
      target: '_blank',
      rel: 'noreferrer noopener',
    },
    renderChildren(node.children ?? []),
  );
}

function renderImage(node: Image): string {
  return `<img src="${escapeAttribute(node.url)}" alt="${escapeAttribute(node.alt ?? '')}"${node.title ? ` title="${escapeAttribute(node.title)}"` : ''} />`;
}

function renderRawHtml(node: Html): string {
  return marked.parseInline(node.value, { async: false });
}

function renderTable(node: Table): string {
  const rows = node.children ?? [];
  if (rows.length === 0) {
    return '<table></table>';
  }
  const [head, ...body] = rows;
  const thead = wrapTag('thead', {}, renderTableRow(head, true));
  const tbody = body.length > 0 ? wrapTag('tbody', {}, body.map((row) => renderTableRow(row, false)).join('')) : '';
  return wrapTag('table', {}, `${thead}${tbody}`);
}

function renderTableRow(row: TableRow, isHeader: boolean): string {
  return wrapTag(
    'tr',
    {},
    (row.children ?? []).map((cell) => renderTableCell(cell as TableCell, isHeader)).join(''),
  );
}

function renderTableCell(node: TableCell, forceHeader = false): string {
  const tag = forceHeader ? 'th' : 'td';
  return wrapTag(tag, {}, renderChildren(node.children ?? []));
}

function wrapTag(tag: string, attrs: Record<string, string>, content: string): string {
  const attrString = Object.entries(attrs)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
    .join('');
  return `<${tag}${attrString}>${content}</${tag}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(text: string): string {
  return escapeHtml(text);
}
