import Vue, { PluginFunction } from 'vue';
import OnePromptComponent from './index.vue';

// 为组件加上 install 方法的类型
const OnePrompt = OnePromptComponent as typeof OnePromptComponent & {
  install: PluginFunction<any>
};

OnePrompt.install = (_Vue: typeof Vue) => {
  _Vue.component('OnePrompt', OnePrompt);
};

export { OnePrompt };