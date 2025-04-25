import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/id',
    component: () => import('@/views/id/index.vue')
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router