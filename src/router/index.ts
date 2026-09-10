import { createRouter, createWebHistory } from 'vue-router'
import ViewerView from '@/views/ViewerView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/demo',
    },
    {
      path: '/:projectId',
      name: 'viewer',
      component: ViewerView,
      props: true,
    },
  ],
})

export default router
