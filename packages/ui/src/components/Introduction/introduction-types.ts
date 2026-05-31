import { PropType } from '@vue/composition-api';
import { ImageProps } from '../Image/image-types';

export type IntroductionBackground = 'filled' | 'transparent';

export type IntroductionAlign = 'left' | 'center' | 'right';

export const props = {
  /**
   * Configuration for the logo image.
   * This object accepts all props from the OneImage component.
   */
  logoConfig: {
    type: Object as PropType<ImageProps>,
    default: () => ({}),
  },
  title: {
    type: String,
    default: '',
  },
  subTitle: {
    type: String,
    default: '',
  },
  description: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  background: {
    type: String as PropType<IntroductionBackground>,
    default: 'transparent',
  },
  align: {
    type: String as PropType<IntroductionAlign>,
    default: 'center',
  },
};
