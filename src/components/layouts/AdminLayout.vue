<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <Sidebar class="sidebar" />

    <!-- Konten Halaman -->
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidebar from '../../views/Sidebar.vue';

export default {
  components: {
    Sidebar,
  },
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden; /* Mencegah scroll tidak perlu */
}

.sidebar {
  width: 250px;
  height: 100vh;
  position: fixed; /* Agar sidebar tetap di tempat */
  top: 0;
  left: 0;
  background: #111;
  color: white;
  padding: 20px;
}

.content {
  flex-grow: 1;
  margin-left: 250px; /* Sesuai dengan lebar sidebar */
  padding: 20px;
  overflow-y: auto;
  background: #0D0D0D; /* Warna tema sesuai dengan desain */
  color: white;
}
</style>