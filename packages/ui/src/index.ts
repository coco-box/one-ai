import '@coco-box/ai-tailwindcss-config/theme.css';
import './styles/index.scss';

import Vue from 'vue';
import { OneBubble } from './components/Bubble';
import { OneHeader } from './components/Header';
import { OneInput } from './components/Input';
import { OneIntroduction } from './components/Introduction';
import { OneLayout, OneLayoutHeader, OneLayoutAside, OneLayoutContent, OneLayoutSender } from './components/Layout';
import { OneList } from './components/List';
import { OneMarkdownCard } from './components/MarkdownCard';
import { OnePrompt } from './components/Prompt';
import { OneInteractionConfirm, type InteractionButtonConfig } from './components/InteractionConfirm';
import { OneIcon } from './components/Icon';
import { OneImage } from './components/Image';
import { OneConfigProvider } from './components/ConfigProvider';

export * from './utils';
export type { InteractionButtonConfig };

const installs = [
  OneBubble,
  OneHeader,
  OneInput,
  OneIntroduction,
  OneLayout,
  OneLayoutHeader,
  OneLayoutAside,
  OneLayoutContent,
  OneLayoutSender,
  OneList,
  OneMarkdownCard,
  OnePrompt,
  OneInteractionConfirm,
  OneIcon,
  OneImage,
  OneConfigProvider,
];

export {
  OneBubble,
  OneHeader,
  OneInput,
  OneIntroduction,
  OneLayout,
  OneLayoutHeader,
  OneLayoutAside,
  OneLayoutContent,
  OneLayoutSender,
  OneList,
  OneMarkdownCard,
  OnePrompt,
  OneInteractionConfirm,
  OneIcon,
  OneImage,
  OneConfigProvider,
};

export default {
  install(_Vue: typeof Vue) {
    installs.forEach((component) => {
      if (component.name) {
        _Vue.component(component.name, component);
      }
    });
  },
};