import Vue, { PluginFunction } from 'vue';
import OneInputComponent from './index.vue';

const OneInput = OneInputComponent as typeof OneInputComponent & {
  install: PluginFunction<any>
};

OneInput.install = (_Vue: typeof Vue) => {
  _Vue.component('OneInput', OneInput);
};

export { OneInput };
