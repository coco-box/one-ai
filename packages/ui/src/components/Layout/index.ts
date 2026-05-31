import Vue, { PluginFunction } from 'vue';
import OneLayoutComponent from './Layout.vue';
import OneLayoutHeader from './Header.vue';
import OneLayoutAside from './Aside.vue';
import OneLayoutContent from './Content.vue';
import OneLayoutSender from './Sender.vue';

// 为组件加上 install 方法的类型
const OneLayout = OneLayoutComponent as typeof OneLayoutComponent & {
  install: PluginFunction<any>
};

OneLayout.install = (_Vue: typeof Vue) => {
  _Vue.component('OneLayout', OneLayout);
  _Vue.component('OneLayoutHeader', OneLayoutHeader);
  _Vue.component('OneLayoutAside', OneLayoutAside);
  _Vue.component('OneLayoutContent', OneLayoutContent);
  _Vue.component('OneLayoutSender', OneLayoutSender);
};

export { OneLayout, OneLayoutHeader, OneLayoutAside, OneLayoutContent, OneLayoutSender };