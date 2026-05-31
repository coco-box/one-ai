import type {
  Options,
  PluginSimple,
  PluginWithOptions,
  PluginWithParams,
} from 'markdown-it';
import type { PropType, ComponentPropsOptions, ExtractPropTypes } from '@vue/composition-api';

export interface MermaidConfig {
  theme?: string;
}

export interface CustomXssRule {
  key: string;
  value: string[] | null;
}

export interface CodBlockData {
  code: string;
  language: string;
}

export type CodeBlockSlot = {
  lang?: () => void;
  actions?: () => void;
  header?: () => void;
  content?: () => void;
};

export type Theme = 'light' | 'dark';

export type TypingStyle = 'normal' | 'cursor' | 'color' | 'gradient';

export type IntervalType = number | [number, number];

export const defaultTypingConfig = {
  step: 2,
  interval: 50,
  style: 'normal',
};

export interface MdPlugin {
  plugin: PluginSimple | PluginWithOptions | PluginWithParams;
  opts?: unknown;
}

export const props = {
  content: {
    type: String,
    default: '',
  },

  typing: {
    type: Boolean,
    default: false,
  },

  enableThink: {
    type: Boolean,
    default: false,
  },

  typingOptions: {
    step: {
      type: Number,
      default: 2,
    },

    interval: {
      type: [Number, Array] as PropType<number | [number, number]>,
      default: 60,
    },

    style: {
      type: String as PropType<TypingStyle>,
      default: 'normal'
    }
  },

  thinkOptions: {
    customClass: {
      type: String,
      default: '',
    },
  },

  mdOptions: {
    type: Object as PropType<Options>,
    default: () => ({}),
  },

  mdPlugins: {
    type: Array as PropType<Array<MdPlugin>>,
    default: () => [],
  },

  customXssRules: {
    type: Array as PropType<Array<CustomXssRule>>,
    default: () => [],
  },

  theme: {
    type: String as PropType<Theme>,
    default: 'light',
  },

  enableMermaid: {
    type: Boolean,
    default: false,
  },

  mermaidConfig: {
    type: Object as PropType<MermaidConfig>,
    default: () => ({}),
  },

  defaultExpanded: {
    type: Boolean,
    default: true,
  },
};

export const mdCardProps = props as ComponentPropsOptions;

export type MdCardProps = ExtractPropTypes<typeof props>;