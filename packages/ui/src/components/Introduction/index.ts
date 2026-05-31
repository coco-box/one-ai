import Vue, { PluginFunction } from 'vue';
import OneIntroductionComponent from './index.vue';

const OneIntroduction = OneIntroductionComponent as typeof OneIntroductionComponent & {
  install: PluginFunction<any>
};

OneIntroduction.install = (_Vue: typeof Vue) => {
  _Vue.component('OneIntroduction', OneIntroduction);
};

export { OneIntroduction };
