import Vue, { PluginFunction } from 'vue';
import OneInteractionConfirmComponent from './index.vue';

export * from './interaction-confirm-types';

// eslint-disable-next-line vue/max-len
const OneInteractionConfirm = OneInteractionConfirmComponent as typeof OneInteractionConfirmComponent & {
  install: PluginFunction<any>
};

OneInteractionConfirm.install = (_Vue: typeof Vue) => {
  _Vue.component('OneInteractionConfirm', OneInteractionConfirm);
};

export { OneInteractionConfirm };