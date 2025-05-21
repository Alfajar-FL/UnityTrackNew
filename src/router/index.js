import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '@/components/layouts/AdminLayout.vue';
import Login from '@/components/Login.vue';

import Dashboard from '@/views/admin/Dashboard.vue';
import Monitoring from '@/views/admin/Monitoring.vue';
import AccountSetting from '@/views/admin/AccountSetting.vue';
import ManageAccount from '@/views/admin/ManageAccount.vue';
import TelegramInfo from '@/views/admin/TelegramInfo.vue';
import Detail from '@/views/admin/Detail.vue';


const routes = [
  { path: '/login', component: Login },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'monitoring', component: Monitoring },
      { path: 'account-setting', component: AccountSetting },
      { path: 'manage-account', component: ManageAccount },
      { path: 'telegram-info', component: TelegramInfo },
      {
        path: 'detail/:site_id',  
        name: 'Detail',        
        component: Detail,
        props: true
      }
    ]
  },
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Global Route Guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('userRole');
  const role = localStorage.getItem('userRole');

  if (to.path.startsWith('/admin') && !isLoggedIn) {
    return next('/login');
  }

  if (to.path === '/admin/manage-account' && role !== 'admin') {
    alert('⚠️ Maaf, Anda tidak memiliki akses ke halaman Manage Account.');
    return next('/admin/dashboard');
  }

  next();
});

export default router;
