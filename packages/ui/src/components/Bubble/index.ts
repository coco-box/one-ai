import Vue, { PluginFunction } from 'vue';
import OneBubbleComponent from './index.vue';

const OneBubble = OneBubbleComponent as typeof OneBubbleComponent & {
  install: PluginFunction<any>
};

OneBubble.install = (_Vue: typeof Vue) => {
  _Vue.component('OneBubble', OneBubble);
};

export { OneBubble };
