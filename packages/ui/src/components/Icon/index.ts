import Vue, { PluginFunction } from 'vue';
import OneIconComponent from './index.vue';

export * from './icon-types';

const OneIcon = OneIconComponent as typeof OneIconComponent & {
  install: PluginFunction<any>
};

OneIcon.install = (_Vue: typeof Vue) => {
  _Vue.component('OneIcon', OneIcon);
};

export { OneIcon };