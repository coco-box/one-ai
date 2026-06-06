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

export const MARKDOWN_DIFF_BODY_CLASS_NAME = 'md-diff-body';

export function renderDiffAstToHtml(ast: Root): string {
  return `<div class="${MARKDOWN_DIFF_BODY_CLASS_NAME}">${renderChildren(ast.children ?? [])}</div>`;
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
