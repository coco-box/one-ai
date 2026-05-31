// useAiChatProps.ts
import { PropType } from '@vue/composition-api';

export const useAiChatProps = {
  title: {
    type: String,
    default: '智能应急',
  },
  avatars: {
    type: Object as PropType<Record<string, { backgroundColor: string }>>,
    default: () => ({}),
  },
};
