import type { ExtractPropTypes } from '@vue/composition-api';

export const imageProps = {
  /**
   * The source URL of the image.
   */
  src: {
    type: String,
    required: true,
  },
  /**
   * The alternative text for the image, for accessibility.
   */
  alt: {
    type: String,
    default: '',
  },
  /**
   * Enables lazy loading for the image.
   * The image will only be loaded when it enters the viewport.
   */
  lazy: {
    type: Boolean,
    default: false,
  },
  /**
   * Makes the image responsive, scaling with its parent container.
   * Applies `max-width: 100%` and `height: auto`.
   */
  fluid: {
    type: Boolean,
    default: false,
  },
} as const;

export type ImageProps = ExtractPropTypes<typeof imageProps>;