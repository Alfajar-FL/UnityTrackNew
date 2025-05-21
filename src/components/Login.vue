<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">Welcome Back</h2>
      <p class="login-subtitle">Please enter your details</p>

      <!-- Form Login -->
      <form @submit.prevent="login">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input 
            type="text" 
            v-model.trim="username"
            class="form-control"
            :class="{ 'input-error': errors.username }"
            autofocus
          />
          <small v-if="errors.username" class="error-message">{{ errors.username }}</small>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            v-model="password"
            class="form-control"
            :class="{ 'input-error': errors.password }"
          />
          <small v-if="errors.password" class="error-message">{{ errors.password }}</small>
        </div>

        <!-- Display General Error Message -->
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <!-- Button -->
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? "Logging in..." : "LOGIN" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      username: "",
      password: "",
      errorMessage: "",
      loading: false,
      errors: {},
    };
  },

  methods: {
    validateForm() {
      this.errors = {};

      if (!this.username.trim()) {
        this.errors.username = "Username is required";
      }

      if (!this.password) {
        this.errors.password = "Password is required";
      }

      return Object.keys(this.errors).length === 0;
    },

    async login() {
      if (!this.validateForm()) return;

      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await axios.post("http://localhost:5001/login", {
          username: this.username.trim(),
          password: this.password.trim(),
        });

        const user = response.data.user;
        console.log("✅ Login berhasil:", user);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userName", user.name || user.username);

        // Semua role diarahkan ke halaman dashboard yang sama
        this.$router.push("/admin/dashboard");

      } catch (error) {
        console.error("❌ Error dari backend:", error.response?.data || error.message);

        if (error.response) {
          this.errorMessage = error.response.data?.message || "Login gagal";
        } else {
          this.errorMessage = "Tidak dapat menghubungi server";
        }

      } finally {
        this.loading = false;
      }
    }
  }
};
</script>


<style scoped>
/* Background styling */
.login-container {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #131c2e 0%, #0c111e 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Login card */
.login-card {
  background: rgba(25, 29, 36, 0.95);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  width: 320px;
}

/* Title styling */
.login-title {
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin-bottom: 6px;
  text-align: center;
}

/* Subtitle styling */
.login-subtitle {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 30px;
  font-size: 14px;
  text-align: center;
}

/* Form group styling */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 10px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 15px;
}

.input-error {
  border-bottom: 1px solid red !important;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 4px;
}

/* Login button */
.login-button {
  width: 100%;
  padding: 12px;
  background: #0053d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.login-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.login-button:hover:not(:disabled) {
  background: #0046b5;
}
</style>
