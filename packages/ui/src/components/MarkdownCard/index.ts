import Vue, { PluginFunction } from 'vue';
import OneMarkdownCardComponent from './index.vue';

export * from './mdCard-types';

const OneMarkdownCard = OneMarkdownCardComponent as typeof OneMarkdownCardComponent & {
  install: PluginFunction<any>
};

OneMarkdownCard.install = (_Vue: typeof Vue) => {
  _Vue.component('OneMarkdownCard', OneMarkdownCard);
};

export { OneMarkdownCard };