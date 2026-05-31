import { ExtractPropTypes, PropType } from '@vue/composition-api';

export interface InteractionButtonConfig {
  text: string;
  type?: string;
  icon?: string;
  value: string | number | boolean;
  [key: string]: any;
}

export const interactionConfirmProps = {
  // 是否模块文案
  confirmText: {
    type: String,
    default: '是否执行操作',
  },
  // 是否模块按钮配置
  confirmButtons: {
    type: Array as PropType<InteractionButtonConfig[]>,
    default: () => [
      {
        text: '否', type: 'danger', icon: 'el-icon-close', value: 'no',
      },
      {
        text: '是', type: 'primary', icon: 'el-icon-check', value: 'yes',
      },
    ],
  },
  // 建议模块文案
  suggestionText: {
    type: String,
    default: '建议:',
  },
  // 建议模块按钮配置
  suggestionButtons: {
    type: Array as PropType<InteractionButtonConfig[]>,
    default: () => [],
  },
  // 是否显示建议模块
  showSuggestion: {
    type: Boolean,
    default: false,
  },
};

export type InteractionConfirmProps = ExtractPropTypes<typeof interactionConfirmProps>;