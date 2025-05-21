<template>
  <div class="container mt-4">
    <h2 class="fw-bold text-light">Account Setting</h2>
    <div class="row">
      <div class="col-md-12 mx-auto"> <!-- Lebar lebih besar -->
        <div class="card bg-dark text-light p-4 shadow-lg w-100">
          <form>
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" v-model="form.name" />
            </div>

            <div class="mb-3">
              <label class="form-label">Username</label>
              <input type="text" class="form-control" v-model="form.username" />
            </div>

            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" v-model="form.email" />
            </div>

            <div class="mb-3">
              <label class="form-label">Phone Number</label>
              <input type="text" class="form-control" v-model="form.phone" />
            </div>

            <div class="mb-3">
              <label class="form-label">Reset Password</label>
              <input type="password" class="form-control mb-2" placeholder="Masukkan password baru" v-model="form.password" />
              <input type="password" class="form-control" placeholder="Ulangi Password" v-model="form.confirmPassword" />
            </div>

            <div class="d-flex justify-content-end">
              <button type="button" class="btn btn-secondary me-2" @click="goBack">BACK</button>
              <button type="submit" class="btn btn-primary">SAVE</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AccountSetting",
  data() {
    return {
      form: {
        name: "Han Sooyoung",
        username: "HanSooyoung",
        email: "hansooyoung@gmail.com",
        phone: "089757372",
        password: "",
        confirmPassword: "",
      },
    };
  },
  methods: {
    goBack() {
      this.$router.push("/admin/dashboard"); // Kembali ke dashboard atau halaman sebelumnya
    }
  }
};
</script>

<style scoped>
/* Background Halaman */
body {
  background-color: #121212;
}

/* Card Styling */
.card {
  max-width: 1300px; /* Lebih lebar */
  width: 98%; /* Supaya fleksibel */
  margin: auto;
  border-radius: 12px;
  border: none;
  background: #1e1e1e;
}

/* Input Styling */
.form-control {
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
}

/* Tombol */
.btn-primary {
  background-color: #0044cc;
  border: none;
}

.btn-primary:hover {
  background-color: #0033aa;
}

.btn-secondary {
  background-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>