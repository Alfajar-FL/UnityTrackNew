<template>
  <div>
    <template v-if="!isAdminPage">
      <Login />
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Login from "./components/Login.vue";

export default {
  components: { Login },
  setup() {
    const route = useRoute();
    const isAdminPage = computed(() => route.path.startsWith("/admin"));
    return { isAdminPage };
  }
};
</script>