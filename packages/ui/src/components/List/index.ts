import Vue, { PluginFunction } from 'vue';
import OneListComponent from './index.vue';

export * from './list-types';

const OneList = OneListComponent as typeof OneListComponent & {
  install: PluginFunction<any>
};

OneList.install = (_Vue: typeof Vue) => {
  _Vue.component('OneList', OneList);
};

export { OneList };