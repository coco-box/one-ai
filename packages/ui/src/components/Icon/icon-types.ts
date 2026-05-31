import { PropType } from '@vue/composition-api';

export const oneIconProps = {
  /**
   * 呈现 icon 图标的 class 类
   * @example 'el-icon-close', 'fas fa-home'
   */
  name: {
    type: String as PropType<string>,
    required: true,
  },
  /**
   * 呈现 icon 图标的 HTML 标签
   * @default 'i'
   */
  tag: {
    type: String as PropType<string>,
    default: 'i',
  },
};