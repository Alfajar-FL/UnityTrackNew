<template>
  <div class="dashboard container-fluid bg-dark text-light p-4">
    <h2 class="fw-bold text-light">Dashboard</h2>

    <!-- Top Cards -->
    <div class="row mb-4 g-3">
      <div class="col-md-4">
        <div class="card card-dark p-3">
          <div class="d-flex align-items-center">
            <div class="icon-box bg-primary-transparent me-3">
              <i class="bi bi-window fs-3 text-primary"></i>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ totalWebsites }}</h5>
              <small class="text-white">Total Website</small>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-dark p-3">
          <div class="d-flex align-items-center">
            <div class="icon-box bg-success-transparent me-3">
              <div class="status-icon up">
                <i class="bi bi-arrow-up-short"></i>
              </div>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ upWebsites }}</h5>
              <small class="text-white">Up Website</small>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-dark p-3">
          <div class="d-flex align-items-center">
            <div class="icon-box bg-danger-transparent me-3">
              <div class="status-icon down">
                <i class="bi bi-arrow-down-short"></i>
              </div>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ downWebsites }}</h5>
              <small class="text-white">Down Website</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card card-dark p-3 filter-card">
          <div class="row gy-2 gx-3">
            <!-- Time Period Filter -->
            <div class="col-auto">
              <div class="dropdown position-relative" ref="timeFilterDropdown">
                <button 
                  class="btn btn-sm btn-dark dropdown-toggle w-100" 
                  type="button" 
                  @click.stop="toggleDropdown('timeFilter')"
                >
                  <i class="bi bi-calendar me-1"></i> 
                  {{ selectedTimePeriodDisplay }}
                </button>
                <ul 
                  class="dropdown-menu dropdown-menu-dark" 
                  :class="{ 'show': activeDropdown === 'timeFilter' }"
                >
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('today')">Today</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('yesterday')">Yesterday</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('last24hours')">Last 24 Hours</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('last7days')">Last 7 Days</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('thisweek')">This Week</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('thismonth')">This Month</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="changeTimePeriod('last30days')">Last 30 Days</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="toggleCustomDateRange">Custom Range</a></li>
                </ul>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="col-auto">
              <div class="dropdown" ref="statusFilterDropdown">
                <button 
                  class="btn btn-sm btn-dark dropdown-toggle w-100" 
                  type="button" 
                  @click.stop="toggleDropdown('statusFilter')"
                >
                  <i class="bi bi-check-circle me-1"></i> 
                  {{ selectedStatus === 'all' ? 'All Status' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) }}
                </button>
                <ul 
                  class="dropdown-menu dropdown-menu-dark" 
                  :class="{ 'show': activeDropdown === 'statusFilter' }"
                >
                  <li><a class="dropdown-item" href="#" @click.prevent="setStatus('all')">All Status</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="setStatus('up')">Up</a></li>
                  <li><a class="dropdown-item" href="#" @click.prevent="setStatus('down')">Down</a></li>
                </ul>
              </div>
            </div>

            <!-- Custom Date Range -->
            <div v-if="showCustomDateRange" class="col-12 d-flex flex-wrap align-items-center gap-2 mt-2">
              <input 
                type="date" 
                class="form-control form-control-sm bg-dark text-light border-dark" 
                v-model="customStartDate"
              >
              <span class="text-light">to</span>
              <input 
                type="date" 
                class="form-control form-control-sm bg-dark text-light border-dark" 
                v-model="customEndDate"
              >
              <button 
                class="btn btn-sm btn-primary" 
                @click="applyCustomDateRange"
              >Apply</button>
              <button 
                class="btn btn-sm btn-outline-secondary" 
                @click="cancelCustomDateRange"
              >Cancel</button>
            </div>

            <!-- Clear Filters -->
            <button 
              v-if="hasActiveFilters" 
              class="btn btn-sm btn-outline-secondary ms-auto" 
              @click="clearFilters"
            >
              <i class="bi bi-x-circle me-1"></i> Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Uptime Donut Chart and Load Time Line Graph -->
    <div class="row mb-4 g-3">
      <div class="col-md-4">
        <div class="card card-dark p-3 h-100">
          <h6 class="text-light mb-3">Global Uptime</h6>
          <div class="chart-container donut-container d-flex flex-column align-items-center justify-content-center">
            <canvas id="uptimeChart"></canvas>
            <div class="donut-center-text">
              <div class="uptime-percentage">{{ uptimePercentage }}%</div>
            </div>
            <div class="uptime-legends mt-4 mb-2 w-100">
              <div class="d-flex justify-content-center">
                <div class="legend-item d-flex align-items-center me-4">
                  <div class="legend-color-box bg-success"></div>
                  <span class="legend-text">Uptime</span>
                </div>
                <div class="legend-item d-flex align-items-center">
                  <div class="legend-color-box bg-warning"></div>
                  <span class="legend-text">Downtime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card card-dark p-3 h-100">
          <h6 class="text-light mb-3">Load Time - Last 24 Hours</h6>
          <div class="chart-container" :class="{ 'disable-pointer': activeDropdown }">
            <div class="chart-legend d-flex mb-2">
              <small class="me-3 text-primary">Current Period</small>
              <small class="text-muted">Previous Period</small>
            </div>
            <canvas id="loadTimeChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtered Activity Table -->
    <div class="row mt-4">
      <div class="col-12">
        <h6 class="text-light mb-3">{{ selectedTimePeriodDisplay }} Activity</h6>
        <div class="card card-dark p-3">
          <div class="table-responsive">
            <table class="table table-dark table-borderless">
              <thead>
                <tr class="text-muted">
                  <th>Status</th>
                  <th>Domain</th>
                  <th>Last Execution</th>
                  <th>Status Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
            <tr v-for="(site, index) in paginatedData" :key="site.id || index">
              <td>
                <div class="d-flex align-items-center">
                  <div :class="['status-circle', site.status === 'up' ? 'bg-success' : 'bg-warning']">
                    <i :class="['bi', site.status === 'up' ? 'bi-arrow-up' : 'bi-arrow-down']"></i>
                  </div>
                  <span :class="site.status === 'up' ? 'text-success' : 'text-warning'">
                    {{ site.status }}
                  </span>
                </div>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="favicon-wrapper rounded overflow-hidden d-flex justify-content-center align-items-center" style="width: 24px; height: 24px; background-color: #2c2f33;">
                    <img :src="site.favicon || 'https://www.google.com/s2/favicons?domain=' + site.url" alt="favicon" style="width: 16px; height: 16px;" />
                  </div>
                  <span class="ms-2">{{ site.title }}</span>
                </div>
              </td>
              <td class="text-white">
                {{ formatDate(site.checked_at) }}
              </td>
              <td>
                <span
                  v-if="site.status_code"
                  class="badge bg-dark border border-success text-success rounded-pill"
                >
                  {{ site.status_code }} - SUCCESS
                </span>
                <span
                  v-else
                  class="badge bg-dark border border-danger text-danger rounded-pill"
                >
                  FAILED
                </span>
              </td>
              <td class="text-end">
                <i class="bi bi-three-dots-vertical"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="d-flex justify-content-center mt-3">
  <ul class="pagination mb-0">
    <li class="page-item" :class="{ disabled: currentPage === 1 }">
      <button class="circle-page page-link" @click="changePage(currentPage - 1)">
        <i class="bi bi-chevron-left"></i>
      </button>
    </li>

    <li 
      v-for="(page, index) in paginationPages" 
      :key="index" 
      class="page-item"
      :class="{ active: currentPage === page, disabled: page === '...' }"
    >
      <button 
        class="circle-page page-link" 
        @click="page !== '...' && changePage(page)"
        :disabled="page === '...'"
      >
        {{ page }}
      </button>
    </li>

    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
      <button class="circle-page page-link" @click="changePage(currentPage + 1)">
        <i class="bi bi-chevron-right"></i>
      </button>
    </li>
  </ul>
</nav>


    </div>
  </div>
</div>


```

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';

let uptimeChart = null;
let loadTimeChart = null;
let pollingInterval = null;

const monitoringData = ref([]);
const logs = ref([]);
const sites = ref([]);
const totalWebsites = ref(0);
const upWebsites = ref(0);
const downWebsites = ref(0);
const uptimePercentage = ref(0);

const activeDropdown = ref(null);
const selectedTimePeriod = ref('last24hours');
const selectedStatus = ref('all');
const selectedWebsite = ref('all');
const showCustomDateRange = ref(false);
const customStartDate = ref(getDefaultStartDate());
const customEndDate = ref(getDefaultEndDate());
const pauseRendering = ref(false);

const timeFilterDropdown = ref(null);
const statusFilterDropdown = ref(null);


const dropdownRefs = {
  timeFilter: timeFilterDropdown,
  statusFilter: statusFilterDropdown
};

const selectedTimePeriodDisplay = computed(() => {
  const mapping = {
    today: 'Today',
    yesterday: 'Yesterday',
    last24hours: 'Last 24 Hours',
    last7days: 'Last 7 Days',
    thisweek: 'This Week',
    thismonth: 'This Month',
    last30days: 'Last 30 Days',
    custom: `${customStartDate.value} - ${customEndDate.value}`
  };
  return mapping[selectedTimePeriod.value] || 'Custom Range';
});

const hasActiveFilters = computed(() => {
  return selectedTimePeriod.value !== 'last24hours' ||
         selectedStatus.value !== 'all' ||
         selectedWebsite.value !== 'all';
});

const toggleDropdown = (dropdown) => {
  nextTick(() => {
    const isSame = activeDropdown.value === dropdown;
    activeDropdown.value = isSame ? null : dropdown;
    pauseRendering.value = !isSame;
    if (isSame) {
      setTimeout(() => pauseRendering.value = false, 300);
    }
  });
};

const closeAllDropdowns = () => {
  activeDropdown.value = null;
};

const getDateRangeForPeriod = (period) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (period) {
    case 'today':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;

    case 'yesterday':
      const yStart = new Date(now);
      yStart.setDate(now.getDate() - 1); 
      yStart.setHours(0, 0, 0, 0); // Mulai jam 00:00

      const yEnd = new Date(now);
      yEnd.setDate(now.getDate() - 1); 
      yEnd.setHours(23, 59, 59, 999); 

      start = yStart;
      end = yEnd;
      break;

    case 'last7days':
      const last7Start = new Date(now);
      last7Start.setUTCDate(now.getUTCDate() - 6);
      start = new Date(Date.UTC(last7Start.getUTCFullYear(), last7Start.getUTCMonth(), last7Start.getUTCDate(), 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;

    case 'last30days':
      const last30Start = new Date(now);
      last30Start.setUTCDate(now.getUTCDate() - 29);
      start = new Date(Date.UTC(last30Start.getUTCFullYear(), last30Start.getUTCMonth(), last30Start.getUTCDate(), 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;

    case 'thisweek':
      const weekStart = new Date(now);
      const day = now.getUTCDay() || 7; // default ke Minggu = 7
      weekStart.setUTCDate(now.getUTCDate() - day + 1);
      start = new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate(), 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;

    case 'thismonth':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;

    case 'last24hours':
      end = now;
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;

    case 'custom':
      return {
        start: new Date(customStartDate.value + 'T00:00:00.000Z'),
        end: new Date(customEndDate.value + 'T23:59:59.999Z')
      };

    default:
      break;
  }

  return { start, end };
};


const changeTimePeriod = (period) => {
  selectedTimePeriod.value = period;
  showCustomDateRange.value = period === 'custom';
  activeDropdown.value = null;
  applyFilters();
};

const toggleCustomDateRange = () => {
  showCustomDateRange.value = !showCustomDateRange.value;
  selectedTimePeriod.value = 'custom';
  activeDropdown.value = null;
};

const applyCustomDateRange = () => {
  if (new Date(customStartDate.value) > new Date(customEndDate.value)) {
    alert('Tanggal mulai tidak boleh melebihi tanggal akhir.');
    return;
  }
  selectedTimePeriod.value = 'custom';
  showCustomDateRange.value = false;
  applyFilters();
};

const cancelCustomDateRange = () => {
  showCustomDateRange.value = false;
  if (selectedTimePeriod.value === 'custom') {
    selectedTimePeriod.value = 'last24hours';
  }
};

const setStatus = (status) => {
  selectedStatus.value = status;
  activeDropdown.value = null;
  applyFilters();
};

const clearFilters = () => {
  selectedTimePeriod.value = 'last24hours';
  selectedStatus.value = 'all';
  selectedWebsite.value = 'all';
  showCustomDateRange.value = false;
  customStartDate.value = getDefaultStartDate();
  customEndDate.value = getDefaultEndDate();
  applyFilters();
};

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}

const applyFilters = async () => {
  await fetchMonitoringData();
};

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : '-';
};
const fetchMonitoringData = async () => {
  try {
    const [logsRes, sitesRes] = await Promise.all([
      axios.get('http://localhost:5001/api/monitoring_logs'),
      axios.get('http://localhost:5001/api/monitoring_sites')
    ]);

    if (!Array.isArray(logsRes.data) || !Array.isArray(sitesRes.data)) {
      throw new Error("Invalid API response");
    }

    logs.value = logsRes.data;
    sites.value = sitesRes.data;

    const range = getDateRangeForPeriod(selectedTimePeriod.value);

    let filteredLogs = logs.value.filter(log => {
      const checked = new Date(log.checked_at);
      return checked >= range.start && checked <= range.end;
    });

    if (selectedStatus.value !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.status === selectedStatus.value);
    }

    // Gabungkan logs dengan site info
    const enriched = filteredLogs.map(log => {
      const site = sites.value.find(s => s.id === log.site_id) || {};
      return {
        ...log,
        ...site
      };
    });

    monitoringData.value = enriched;
  } catch (err) {
    console.error('Error fetching monitoring data:', err);
    monitoringData.value = [];
  }

  updateWebsiteStats();
  await nextTick();
  renderCharts();
};


const updateWebsiteStats = () => {
  const latestStatusBySite = {};

  // Ambil log terakhir per site_id
  monitoringData.value.forEach(log => {
    const existing = latestStatusBySite[log.site_id];
    const currentTime = new Date(log.checked_at).getTime();

    if (!existing || currentTime > new Date(existing.checked_at).getTime()) {
      latestStatusBySite[log.site_id] = log;
    }
  });

  const values = Object.values(latestStatusBySite);

  totalWebsites.value = values.length;
  upWebsites.value = values.filter(site => site.status === 'up').length;
  downWebsites.value = values.filter(site => site.status === 'down').length;

  const uptimes = values
    .map(site => parseFloat(site.uptime)) // uptime dari `sites`, bukan dari logs
    .filter(uptime => !isNaN(uptime));

  uptimePercentage.value = uptimes.length
    ? parseFloat((uptimes.reduce((sum, v) => sum + v, 0) / uptimes.length).toFixed(2))
    : 0;
};


const renderCharts = () => {
  const uptime = uptimePercentage.value;
  const downtime = 100 - uptime;

  const uptimeCtx = document.getElementById('uptimeChart')?.getContext('2d');
  if (uptimeCtx) {
    if (uptimeChart) uptimeChart.destroy();
    uptimeChart = new Chart(uptimeCtx, {
      type: 'doughnut',
      data: {
        labels: ['Uptime', 'Downtime'],
        datasets: [{
          data: [uptime, downtime],
          backgroundColor: ['#28a745', '#ffc107'],
          borderWidth: 0,
          cutout: '80%'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  const loadCtx = document.getElementById('loadTimeChart')?.getContext('2d');
  if (loadCtx) {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const loadSpeedData = Array.from({ length: 24 }, () => Math.random() * 2 + 1);
    const responseTimeData = Array.from({ length: 24 }, () => Math.random() * 3 + 0.5);

    const blue = loadCtx.createLinearGradient(0, 0, 0, 250);
    blue.addColorStop(0, 'rgba(0, 123, 255, 0.4)');
    blue.addColorStop(1, 'rgba(0, 123, 255, 0)');

    const yellow = loadCtx.createLinearGradient(0, 0, 0, 250);
    yellow.addColorStop(0, 'rgba(255, 193, 7, 0.4)');
    yellow.addColorStop(1, 'rgba(255, 193, 7, 0)');

    if (loadTimeChart) loadTimeChart.destroy();
    loadTimeChart = new Chart(loadCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Load Speed',
            data: loadSpeedData,
            borderColor: '#007bff',
            backgroundColor: blue,
            tension: 0.4,
            fill: true,
            borderWidth: 2
          },
          {
            label: 'Response Time',
            data: responseTimeData,
            borderColor: '#ffc107',
            backgroundColor: yellow,
            tension: 0.4,
            fill: true,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: { stepSize: 0.5, color: 'rgba(255,255,255,0.7)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.7)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255,255,255,0.7)',
              padding: 20,
              font: { size: 12 }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }
};

const filteredMonitoringData = computed(() => {
  const range = getDateRangeForPeriod(selectedTimePeriod.value);
  return monitoringData.value.filter(site => {
    if (!site.checked_at) return false;
    const checkedDate = new Date(site.checked_at);
    return checkedDate >= range.start && checkedDate <= range.end;
  });
});


const currentPage = ref(1);
const itemsPerPage = 16;

const totalPages = computed(() => {
  return Math.ceil(filteredMonitoringData.value.length / itemsPerPage);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(
        1,
        '...',
        current - 1,
        current,
        current + 1,
        '...',
        total
      );
    }
  }

  return pages;
});


const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredMonitoringData.value.slice(start, end);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handleOutsideClick = (e) => {
  const currentDropdownRef = dropdownRefs[activeDropdown.value];
  if (currentDropdownRef?.value && !currentDropdownRef.value.contains(e.target)) {
    closeAllDropdowns();
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  fetchMonitoringData();
  pollingInterval = setInterval(fetchMonitoringData, 5000);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  clearInterval(pollingInterval);
  if (uptimeChart) uptimeChart.destroy();
  if (loadTimeChart) loadTimeChart.destroy();
});
</script>

<style scoped>
body, html, #app {
  background-color: #0D0D0D !important;
  color: #FFFFFF;
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', sans-serif;
}

.dashboard {
  background-color: #0D0D0D !important;
  padding: 1.5rem;
}

.card-dark {
  background-color: #1A1A1A !important;
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  background-color: #1A1A1A;
  border-radius: 8px;
  padding: 0.5rem 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  min-width: 180px;
  z-index: 2080; /* lebih tinggi dari .card dan .chart */
  transform: translateY(-10px);
  display: block;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

/* Perhalus item dalam dropdown */
.dropdown-item {
  padding: 0.5rem 1rem;
  color: #fff;
  font-size: 0.875rem;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Divider Style */
.dropdown-divider {
  margin: 0.5rem 0;
  border-color: rgba(255, 255, 255, 0.1);
}

/* Responsive tweak */
@media (max-width: 576px) {
  .dropdown-menu {
    max-height: 200px;
    overflow-y: auto;
  }
}

.dropdown-menu:not(.show) {
  display: none !important;
}

.dropdown {
  position: relative;
  z-index: 1065; /* lebih tinggi dari .card dan elemen chart */
}


.card-dark:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.table-dark {
  --bs-table-bg: transparent;
  --bs-table-hover-bg: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.table-dark thead th {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
  font-size: 0.9rem;
}

.table-dark tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-dark tbody tr:last-child {
  border-bottom: none;
}

.chart-container {
  height: 250px;
  overflow: visible !important;
  z-index: 0 !important;
  position: relative;
}

/* Improved Donut Chart Container */
.donut-container {
  height: 220px;
  position: relative;
  padding: 10px;
}

/* Center text inside donut */
.donut-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.uptime-percentage {
  font-size: 1.8rem;
  font-weight: bold;
  color: #28a745;
}

/* Improved legends with rectangular boxes */
.uptime-legends {
  width: 100%;
  padding: 0 10px;
}

.legend-item {
  font-size: 0.85rem;
}

/* Rectangular indicator instead of circular */
.legend-color-box {
  width: 12px;
  height: 12px;
  border-radius: 3px; /* Slightly rounded corners */
  margin-right: 8px;
}

.legend-text {
  color: rgba(255, 255, 255, 0.7);
}

.bg-warning {
  background-color: #CFE016 !important;
}

.icon-box {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-transparent {
  background-color: rgba(13, 110, 253, 0.2);
}

.bg-success-transparent {
  background-color: rgba(57, 207, 75, 0.2);
}

.bg-danger-transparent {
  background-color: rgba(207, 224, 22, 0.2);
}

/* New status circle with icon for Last Activity table */
.status-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

/* Styling untuk ikon status up dan down seperti yang ada di gambar (arrow) */
.status-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.status-icon.up {
  background-color: #4BCF39;
  color: white;
}

.status-icon.down {
  background-color: #CFE016;
  color: white;
}

.bi-arrow-up-short, .bi-arrow-down-short {
  font-size: 18px;
  font-weight: bold;
}

/* Domain info styling */
.domain-info {
  display: flex;
  flex-direction: column;
}

.domain-name {
  font-weight: 500;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

.domain-logo {
  height: 30px; /* Ukuran logo yang lebih besar */
  width: 28px; /* Ukuran logo yang lebih besar */
  margin-right: 10px;
  border-radius: 2px;
}

.domain-url {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  padding-left: 34px; /* Menyesuaikan dengan ukuran logo yang lebih besar */
}

.badge {
  font-weight: 500;
  padding: 0.4em 0.8em;
  border-radius: 50px;
}

/* Updated badge styles */
.badge.bg-success-pill {
  background-color: rgba(75, 207, 57, 0.1) !important;
  color: #4BCF39;
  border: 1px solid rgba(75, 207, 57, 0.3);
}

.badge.bg-warning-pill {
  background-color: rgba(207, 224, 22, 0.1) !important;
  color: #CFE016;
  border: 1px solid rgba(207, 224, 22, 0.3);
}

.badge.bg-danger-pill {
  background-color: rgba(207, 224, 22, 0.1) !important;
  color: #CFE016;
  border: 1px solid rgba(207, 224, 22, 0.3);
}

.text-muted {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* Make sure all text in cards is white */
.card-dark h5, .card-dark small {
  color: white !important;
}

/* Menyesuaikan tinggi card agar sejajar */
.h-100 {
  height: 100% !important;
}

/* Make dropdowns work */
.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-container {
    height: 200px;
    z-index: 1 ;
  }
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
  margin: 0 10px;
}

.circle-page:hover {
  background-color: #0d6efd;
  color: white !important;
}

.page-item.active .circle-page {
  background-color: #0d6efd !important;
  color: white !important;
}

.row {
  overflow: visible !important;
}

.chart-container canvas {
  pointer-events: none !important;
  z-index: 0;
}

.disable-pointer canvas {
  pointer-events: none;
}

.filter-card{
  z-index: 1080;
}

</style>
