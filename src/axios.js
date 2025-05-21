// src/axios.js
import axios from 'axios';

// Menyiapkan instance Axios untuk aplikasi
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // Ganti dengan URL API backend kamu
  headers: {
    'Content-Type': 'application/json',
  },
});

// Atur interceptors jika diperlukan
axiosInstance.interceptors.request.use((config) => {
  // Menambahkan token atau header tambahan jika diperlukan
  // Misalnya:
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
