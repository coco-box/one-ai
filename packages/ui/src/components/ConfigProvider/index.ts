import Vue, { PluginFunction } from 'vue';
import OneConfigProviderComponent from './ConfigProvider.vue';

const OneConfigProvider = OneConfigProviderComponent as typeof OneConfigProviderComponent & {
  install: PluginFunction<any>
};

OneConfigProvider.install = (_Vue: typeof Vue) => {
  _Vue.component('OneConfigProvider', OneConfigProvider);
};

export { OneConfigProvider };