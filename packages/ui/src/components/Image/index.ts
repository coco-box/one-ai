import Vue, { PluginFunction } from 'vue';
import OneImageComponent from './index.vue';

export * from './image-types';

const OneImage = OneImageComponent as typeof OneImageComponent & {
  install: PluginFunction<any>
};

OneImage.install = (_Vue: typeof Vue) => {
  _Vue.component('OneImage', OneImage);
};

export { OneImage };