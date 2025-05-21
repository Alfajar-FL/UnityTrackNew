<template>
  <div class="sidebar">
    <div class="logo-container">
      <img src="/logo.jpg" alt="Unity Track Logo" class="logo-img" />
    </div>

    <nav class="menu-container">
      <h5 class="menu-title">MAIN MENU</h5>
      <ul class="nav-list">
        <li>
          <router-link
            to="/admin/dashboard"
            class="nav-link"
            @click.native="setActive('dashboard')"
            :class="{ active: activeMenu === 'dashboard' }"
          >
            <i class="fas fa-chart-bar"></i> <span>Dashboard</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/monitoring"
            class="nav-link"
            @click.native="setActive('monitoring')"
            :class="{ active: activeMenu === 'monitoring' }"
          >
            <i class="fas fa-tv"></i> <span>Monitoring</span>
          </router-link>
        </li>
        <li v-if="userRole === 'admin'">
          <router-link
            to="/admin/manage-account"
            class="nav-link"
            @click.native="setActive('manage-account')"
            :class="{ active: activeMenu === 'manage-account' }"
          >
            <i class="fas fa-users-cog"></i> <span>Manage Account</span>
          </router-link>
        </li>
      </ul>

      <h5 class="menu-title">PREFERENCE</h5>
      <ul class="nav-list">
        <li>
          <router-link
            to="/admin/account-setting"
            class="nav-link"
            @click.native="setActive('account-setting')"
            :class="{ active: activeMenu === 'account-setting' }"
          >
            <i class="fas fa-cog"></i> <span>Account Setting</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/admin/telegram-info"
            class="nav-link"
            @click.native="setActive('telegram-info')"
            :class="{ active: activeMenu === 'telegram-info' }"
          >
            <i class="fas fa-paper-plane"></i> <span>Telegram Info</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="spacer"></div>

    <div class="profile-section">
      <div class="profile">
        <img src="/AryaMohan.jpg" alt="Profile Picture" class="profile-img" />
        <div class="profile-info">
          <p class="name" :data-tooltip="userName">{{ userName }}</p>
          <p class="role">{{ userRoleDisplay }}</p>
        </div>
        <div class="logout-icon" @click="logout" title="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
      activeMenu: '',
      userName: '',
      userRole: ''
    };
  },
  computed: {
    userRoleDisplay() {
      if (this.userRole === 'admin') return 'Admin';
      if (this.userRole === 'user') return 'User';
      return 'Unknown Role';
    }
  },
  mounted() {
    this.updateUserInfo();
    this.setActiveMenuFromRoute();
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  watch: {
    '$route'() {
      this.updateUserInfo();
      this.setActiveMenuFromRoute();
    }
  },
  methods: {
    updateUserInfo() {
      this.userName = localStorage.getItem('userName') || 'User';
      this.userRole = localStorage.getItem('userRole') || 'user';
    },
    setActiveMenuFromRoute() {
      const path = this.$route?.path || '';
      if (path.includes('/admin/dashboard')) this.activeMenu = 'dashboard';
      else if (path.includes('/admin/monitoring')) this.activeMenu = 'monitoring';
      else if (path.includes('/admin/manage-account')) this.activeMenu = 'manage-account';
      else if (path.includes('/admin/account-setting')) this.activeMenu = 'account-setting';
      else if (path.includes('/admin/telegram-info')) this.activeMenu = 'telegram-info';
    },
    toggleMenu(event) {
      event.stopPropagation();
      this.menuOpen = !this.menuOpen;
    },
    handleClickOutside(event) {
      const menu = this.$refs.dotsMenu;
      if (menu && !menu.contains(event.target)) {
        this.menuOpen = false;
      }
    },
    logout() {
      localStorage.clear();
      sessionStorage.clear();
      this.menuOpen = false;
      this.$router.replace('/login');
    },
    setActive(menu) {
      this.activeMenu = menu;
    }
  }
};
</script>


<style scoped>
.sidebar {
  width: 260px; /* Slightly wider for better proportions */
  background: linear-gradient(to bottom, #0d1319, #1e2733); /* Enhanced gradient */
  height: 100vh;
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 28px 0; /* Increased vertical padding */
  background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent, rgba(0, 0, 0, 0.2));
  margin-bottom: 10px;
}

.logo-img {
  width: 160px; /* Larger logo */
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)); /* Subtle logo shadow */
}

.menu-container {
  flex-grow: 0;
  padding: 0 15px;
}

.menu-title {
  font-size: 12px;
  text-transform: uppercase;
  color: #9aa3af;
  margin: 25px 0 15px 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  color: #e0e0e0;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  margin: 3px 0;
  border-radius: 0; /* Remove border radius to match design */
  position: relative; /* For hover effect */
}

.nav-link i {
  margin-right: 12px;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.nav-link:hover {
  background: rgba(0, 48, 136, 0.08); /* Subtle background */
  color: #003088; /* Match the color in your image */
  border-radius: 12px;
}

/* Match the design in the image with a left border on hover */
.nav-link:hover::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: #003088;
  border-radius: 12px;
}

.nav-link.active {
  background: #003088;
  color: #ffffff;
  border-left: 3px solid #003088;
  padding-left: 15px;
  border-radius: 12px;
}

/* Improved spacer with minimum height */
.spacer {
  flex-grow: 1;
  min-height: 80px; /* Increased minimum height */
}

.profile-section {
  padding: 0 20px 25px 20px; /* Increased padding */
  width: 100%;
  margin-bottom: 15px; /* Margin to keep away from bottom edge */
}

.profile {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
  box-sizing: border-box;
}



.profile-img {
  width: 42px; /* Larger profile image */
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2); /* Subtle border */
}

.profile-info {
  margin-left: 12px;
  margin-right: auto;
  min-width: 0; /* Allow ellipsis to work */
  overflow: hidden;
}

.name {
  position: relative;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  cursor: default;
}

/* Tooltip custom saat hover */
.name::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 120%;
  left: 0;
  background-color: #1e2733;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.name:hover::after {
  opacity: 1;
  transform: translateY(0);
}


.role {
  font-size: 12px;
  color: #b0b8c1;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dots-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dots-menu li {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
}

.dropdown {
  position: absolute;
  right: 0;
  bottom: 40px; /* Position above instead of below */
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  min-width: 130px;
  z-index: 100;
  overflow: hidden;
}

.dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dropdown li {
  padding: 12px 15px;
  color: #333;
  font-size: 13px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown li:hover {
  background: #f0f4f8;
}

.dropdown li i {
  margin-right: 10px;
  color: #556;
}

.logout-icon {
  color: #e0e0e0;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
  margin-left: 10px;
  flex-shrink: 0; 
}

.logout-icon:hover {
  color: #ff5c5c;
}

</style>