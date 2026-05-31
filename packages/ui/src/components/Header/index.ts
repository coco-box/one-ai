import Vue, { PluginFunction } from 'vue';
import OneHeaderComponent from './index.vue';

const OneHeader = OneHeaderComponent as typeof OneHeaderComponent & {
  install: PluginFunction<any>
};

OneHeader.install = (_Vue: typeof Vue) => {
  _Vue.component('OneHeader', OneHeader);
};

export { OneHeader };