import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@view/home/homePage.vue';
import ChatView from '@view/chat-view/chat-view.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;