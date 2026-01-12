import { createRouter, createWebHistory } from 'vue-router'
import Inbox from '../views/Inbox.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Inbox }
  ]
})
export default router