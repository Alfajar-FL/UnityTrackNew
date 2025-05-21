// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from './axios'; 
import store from './store/store'

import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const app = createApp(App);

// Menambahkan axios yang sudah dikonfigurasi ke globalProperties
app.config.globalProperties.$axios = axios;
app.use(store)
app.use(router);
app.mount('#app');
