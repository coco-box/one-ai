import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { renderMarkdownDiff } from '../lib';

export function useMarkdownDiff(oldMarkdown: MaybeRefOrGetter<string>, newMarkdown: MaybeRefOrGetter<string>) {
  return computed(() => renderMarkdownDiff({
    oldMarkdown: toValue(oldMarkdown),
    newMarkdown: toValue(newMarkdown),
  }));
}
