import './index.css';
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import Aichat from '@coco-box/ai-ui';
import { Button, Tooltip, Avatar, Loading } from 'element-ui';
import App from './App.vue';
import Theme from '@hatech/theme';
import '@/styles/mini-tailwind.scss';

// 1. 按需引入 Element UI 按钮组件

// 2. 引入 Element UI 基础和图标样式
import 'element-ui/lib/theme-chalk/base.css';
import 'element-ui/lib/theme-chalk/icon.css';
import 'element-ui/lib/theme-chalk/button.css';
import 'element-ui/lib/theme-chalk/tooltip.css';
import 'element-ui/lib/theme-chalk/avatar.css';
import 'element-ui/lib/theme-chalk/message.css';

// 3. 引入 MDI 图标库样式
import '@mdi/font/css/materialdesignicons.css';

Vue.use(VueCompositionAPI);
Vue.use(Aichat);

// 全局注册 Element UI 按钮
Vue.use(Button);
Vue.use(Tooltip);
Vue.use(Avatar);
Vue.use(Loading.directive);

Vue.use(Theme, { default: 'white' });

new Vue({
  render: (h) => h(App),
}).$mount('#app');