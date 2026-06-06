import { Paragraph, Root, Text } from 'mdast';
import type { Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { random, similarity } from '../../lib/strings';
import { NodeType } from '../../types/base';
import { replaceChildNode } from '../../utils/node';

function isParagraphOk(node: Paragraph): boolean {
  if (!node.children || node.children.length !== 1) {
    return false;
  }

  const text = node.children[0];
  if (text.type !== NodeType.Text) {
    return false;
  }

  return Boolean(text.value);
}

export function prepareParagraph(oldTree: Root, newTree: Root) {
  let oldParagraphs: Array<[Paragraph, string]> = [];
  let newParagraphs: Array<[Paragraph, string]> = [];

  const oldParagraphTextSet = new Set<string>();
  const newParagraphTextSet = new Set<string>();

  visit(oldTree, NodeType.Paragraph, (node: Paragraph) => {
    if (!isParagraphOk(node)) {
      return;
    }

    const value = (node.children[0] as Text).value;
    oldParagraphTextSet.add(value);
    oldParagraphs.push([node, value]);
  });

  visit(newTree, NodeType.Paragraph, (node: Paragraph) => {
    if (!isParagraphOk(node)) {
      return;
    }

    const value = (node.children[0] as Text).value;
    newParagraphTextSet.add(value);
    newParagraphs.push([node, value]);
  });

  oldParagraphs = oldParagraphs.filter(([_, value]) => !newParagraphTextSet.has(value));
  newParagraphs = newParagraphs.filter(([_, value]) => !oldParagraphTextSet.has(value));

  type Match = { oldIndex: number; newIndex: number; similarity: number };
  const allPairs: Match[] = [];

  for (let i = 0; i < oldParagraphs.length; i++) {
    for (let j = 0; j < newParagraphs.length; j++) {
      const score = similarity(oldParagraphs[i][1], newParagraphs[j][1]);
      if (score > 0.5) {
        allPairs.push({
          oldIndex: i,
          newIndex: j,
          similarity: score,
        });
      }
    }
  }

  allPairs.sort((a, b) => b.similarity - a.similarity);

  const usedOld = new Set<number>();
  const usedNew = new Set<number>();

  allPairs.forEach((pair) => {
    if (usedOld.has(pair.oldIndex) || usedNew.has(pair.newIndex)) {
      return;
    }

    usedOld.add(pair.oldIndex);
    usedNew.add(pair.newIndex);

    const token = random(16);
    const oldParagraph = oldParagraphs[pair.oldIndex][0];
    const newParagraph = newParagraphs[pair.newIndex][0];

    oldParagraph.children.push({
      type: NodeType.Text,
      value: token,
      data: {
        paragraphDiffToken: true,
      },
    } as Text);

    newParagraph.children.push({
      type: NodeType.Text,
      value: token,
      data: {
        paragraphDiffToken: true,
      },
    } as Text);
  });

  return (compTree: Root) => {
    visit(compTree, NodeType.Text, (node: Text, _, parent: Parent) => {
      if ((node.data as { paragraphDiffToken?: boolean } | undefined)?.paragraphDiffToken) {
        replaceChildNode(parent, node, []);
      }
    });
  };
}
