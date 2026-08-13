import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'hall', component: () => import('../views/SkillHall.vue') },
  { path: '/skills/:slug', name: 'skill-detail', component: () => import('../views/SkillDetail.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
