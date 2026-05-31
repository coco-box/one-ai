import { UIPart } from '@coco-box/ai-ui';

export function hiddenFromMessage(part: UIPart | UIPart[]): boolean {
  if (Array.isArray(part)) {
    return part?.length === 1 && part[0]?.type === 'unknown';
  }
  return part.type === 'unknown';
}