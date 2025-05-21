<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="fw-bold text-light">Manage User</h2>
      <button class="btn btn-primary px-4" @click="openModal()">+ Create User</button>
    </div>

    <!-- Table -->
    <div class="card bg-dark text-light p-4 shadow-lg w-100">
      <table class="table table-dark table-hover text-center align-middle">
        <thead>
          <tr>
            <th>Profile Photo</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>
              <img :src="user.photo || '/profile-default.jpg'" class="rounded-circle profile-img" alt="Profile" />
            </td>
            <td>{{ user.username }}</td>
            <td>{{ user.role }}</td>
            <td>
              <div class="dropdown position-relative">
                <button class="btn btn-action" @click="toggleDropdown($event, user.id)">⋮</button>
                <div :id="'dropdown-' + user.id" class="custom-dropdown-menu">
                  <button class="dropdown-item" @click="openModal(user)">
                    <i class="fas fa-edit me-2"></i>Edit
                  </button>
                  <button class="dropdown-item text-danger" @click="deleteUser(user.id)">
                    <i class="fas fa-trash-alt me-2"></i>Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3">
        <span class="text-light small">
          Showing <strong>{{ paginatedUsers.length }}</strong> of <strong>{{ users.length }}</strong> users
        </span>
        <nav>
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link circle-page" @click="goToPage(currentPage - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
            </li>

            <li
              v-for="(page, index) in visiblePages"
              :key="index"
              class="page-item"
              :class="{ active: currentPage === page, disabled: page === '...'}"
            >
              <button
                class="page-link circle-page"
                v-if="page !== '...'"
                :class="{
                  'bg-primary text-white': currentPage === page,
                  'bg-dark text-light': currentPage !== page
                }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <span
                v-else
                class="page-link bg-dark text-light border-0"
                style="pointer-events: none;"
              >
                ...
              </span>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link circle-page" @click="goToPage(currentPage + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ selectedUser ? "Edit User" : "Create User" }}</h3>
          <button class="close-button" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <label>Username</label>
          <input type="text" v-model="form.username" placeholder="Input Username" />

          <label>Role</label>
          <select v-model="form.role" class="form-select custom-select-role">
            <option disabled value="">-- Select Role --</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <label>Password</label>
          <input type="password" v-model="form.password" placeholder="Input Password" />
        </div>
        <div class="modal-footer">
          <button class="btn-create" @click="saveUser">
            {{ selectedUser ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Confirm Delete -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-button" @click="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this user?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-danger" @click="confirmDelete">Yes, Delete</button>
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 10,
      showModal: false,
      showDeleteModal: false,
      selectedUser: null,
      activeDropdown: null,
      users: [],
      form: {
        username: "",
        password: "",
        role: "user"
      }
    };
  },

  computed: {
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.users.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.users.length / this.itemsPerPage);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;

      if (total <= 5) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);

        if (this.currentPage > 3) {
          pages.push('...');
        }

        if (this.currentPage > 1 && this.currentPage < total) {
          pages.push(this.currentPage);
        }

        if (this.currentPage < total - 2) {
          pages.push('...');
        }

        if (!pages.includes(total)) {
          pages.push(total);
        }
      }

      return pages;
    }
  },

  methods: {
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:5001/api/users');
        this.users = response.data;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        alert("Could not connect to server. Please try again later.");
      }
    },

    toggleDropdown(event, userId) {
      if (this.activeDropdown && this.activeDropdown !== userId) {
        document.getElementById('dropdown-' + this.activeDropdown)?.classList.remove('show');
      }
      const dropdownElement = document.getElementById('dropdown-' + userId);
      dropdownElement?.classList.toggle('show');
      this.activeDropdown = dropdownElement?.classList.contains('show') ? userId : null;
      event.stopPropagation();
    },

    closeAllDropdowns() {
      document.querySelectorAll('.custom-dropdown-menu.show').forEach(el => el.classList.remove('show'));
      this.activeDropdown = null;
    },

    openModal(user = null) {
      this.closeAllDropdowns();
      this.selectedUser = user;
      this.form = user
        ? { username: user.username, password: "", role: user.role }
        : { username: "", password: "", role: "user" };
      this.showModal = true;
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.currentPage = page;
      }
    },

    async saveUser() {
      const { username, password, role } = this.form;

      if (!username.trim()) {
        alert("Username is required.");
        return;
      }

      try {
        if (this.selectedUser) {
          const updatePayload = { username: username.trim(), role };
          if (password && password.trim()) {
            updatePayload.password = password.trim();
          }

          await axios.put(`http://localhost:5001/api/users/${this.selectedUser.id}`, updatePayload);
          alert("User updated!");
        } else {
          if (!password.trim()) {
            alert("Password is required for new users.");
            return;
          }

          await axios.post('http://localhost:5001/api/users', {
            username: username.trim(),
            password: password.trim(),
            role
          });
          alert("User created!");
        }

        this.showModal = false;
        await this.fetchUsers();
      } catch (error) {
        console.error("Error saving user:", error);
        alert("Failed to save user.");
      }
    },

    deleteUser(id) {
      this.closeAllDropdowns();
      this.selectedUser = this.users.find(u => u.id === id);
      this.showDeleteModal = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`http://localhost:5001/api/users/${this.selectedUser.id}`);
        this.users = this.users.filter(u => u.id !== this.selectedUser.id);
        this.showDeleteModal = false;
        this.selectedUser = null;
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete user.");
      }
    },

    handleEscapeKey(e) {
      if (e.key === 'Escape') {
        this.showModal = false;
        this.showDeleteModal = false;
      }
    }
  },

  mounted() {
    document.addEventListener('click', this.closeAllDropdowns);
    document.addEventListener('keydown', this.handleEscapeKey);
    this.fetchUsers();
  },

  beforeDestroy() {
    document.removeEventListener('click', this.closeAllDropdowns);
    document.removeEventListener('keydown', this.handleEscapeKey);
  }
};
</script>


<style scoped>
/* Styling modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.page-link {
  transition: all 0.3s ease;
}

.page-link:hover {
  background-color: #0d6efd;
  color: white !important;
}

.page-item.active .page-link {
  background-color: #0d6efd !important;
  border-color: transparent;
}

.circle-page {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50% !important;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  border: none;
  margin: 0 10px; /* Jarak antar tombol */
}

.circle-page:hover {
  background-color: #0d6efd;
  color: white !important;
}

.page-item.active .circle-page {
  background-color: #0d6efd !important;
  color: white !important;
}

/* Styling modal box */
.modal-box {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: white;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  text-align: left;
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}

.modal-box h3 {
  color: white;
  margin: 0;
}

.modal-box label {
  display: block;
  color: white;
  text-align: left;
  margin: 10px 0 5px 0;
}

.modal-box input {
  width: 100%;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 5px;
  border: none;
  background: #333;
  color: white;
}

.note {
  font-size: 12px;
  color: #bbb;
  text-align: left;
  margin: 5px 0 15px 0;
}

.btn-create {
  width: 100%;
  padding: 10px;
  background: #007bff;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

.btn-create:hover {
  background: #0056b3;
}

.btn-danger {
  padding: 10px 15px;
  background: #dc3545;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-cancel {
  padding: 10px 15px;
  background: #444;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
}

.btn-cancel:hover {
  background: #333;
}

/* Styling tabel */
.profile-img {
  width: 45px;
  height: 45px;
  object-fit: cover;
}

/* Custom Dropdown */
.dropdown {
  position: relative;
  display: inline-block;
}

.btn-action {
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 3px;
}

.btn-action:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.custom-dropdown-menu {
  position: absolute;
  right: 0;
  background-color: #2c2c2c;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  border-radius: 4px;
  display: none;
}

.custom-dropdown-menu.show {
  display: block;
}

.dropdown-item {
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #3e3e3e;
}

.dropdown-item.text-danger {
  color: #dc3545;
}

.dropdown-item.text-danger:hover {
  background-color: rgba(220, 53, 69, 0.2);
}

.custom-select-role {
  background-color: #2c2c2c;
  color: white;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.custom-select-role:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.custom-select-role option {
  background-color: #2c2c2c;
  color: white;
}

/* Modal Konfirmasi Delete 2-Button Layout */
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>