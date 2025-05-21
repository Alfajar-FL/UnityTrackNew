<template>
  <div class="detail container-fluid bg-dark text-light p-4">
    <h2 class="fw-bold text-light">{{ site.name || 'Detail Website' }}</h2>

    <!-- Top Cards -->
    <div class="row mb-4 g-3">
      <div class="col-md-4">
        <div class="card card-dark p-3 h-100">
          <div class="d-flex align-items-center">
            <div class="logo-container me-3" style="width: 70px; height: 70px;">
              <img
                :src="site.favicon || 'https://www.google.com/s2/favicons?domain=' + site.url"
                alt="Site Favicon"
                style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px;"
              />
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ site.name }}</h5>
              <small class="text-primary">{{ site.url }}</small>
            </div>
          </div>
        </div>
      </div>

    <!-- Uptime -->
      <div class="col-md-4">
        <div class="card card-dark p-3 h-100">
          <div class="d-flex align-items-center">
            <div class="icon-box bg-success-transparent me-3">
              <div class="status-icon up">
                <i class="bi bi-arrow-up-short"></i>
              </div>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ site.uptime || 0 }}%</h5>
              <small class="text-white">Uptime</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Downtime -->
      <div class="col-md-4">
        <div class="card card-dark p-3 h-100">
          <div class="d-flex align-items-center">
            <div class="icon-box bg-danger-transparent me-3">
              <div class="status-icon down">
                <i class="bi bi-arrow-down-short"></i>
              </div>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-white">{{ (100 - (site.uptime || 0)).toFixed(2) }}%</h5>
              <small class="text-white">Downtime</small>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- CHART & METRICS -->
    <div class="metrics-row">
      <!-- Uptime Donut (static) -->
      <div class="uptime-circle-card">
        <h6 class="chart-title">Global Uptime</h6>
        <div class="chart-container donut-container d-flex flex-column align-items-center justify-content-center">
          <canvas id="uptimeChart"></canvas>
          <div class="donut-center-text">
            <div class="uptime-percentage">{{ site.uptime || 0 }}%</div>
          </div>
          <div class="uptime-legends mt-4 mb-2 w-100">
            <div class="d-flex justify-content-center">
              <div class="legend-item d-flex align-items-center me-4">
                <div class="legend-color-box" style="background-color: #4BCF39;"></div>
                <span class="legend-text">Uptime</span>
              </div>
              <div class="legend-item d-flex align-items-center">
                <div class="legend-color-box" style="background-color: #CFE016;"></div>
                <span class="legend-text">Downtime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load Time (static) -->
      <div class="chart-card">
        <h6 class="text-light mb-3">Load Time - Last 24 Hours</h6>
        <div class="chart-container">
          <div class="chart-legend d-flex mb-2">
            <small class="me-3 text-primary">Load Speed</small>
            <small class="text-warning">Response Time</small>
          </div>
          <canvas id="loadTimeChart"></canvas>
        </div>
      </div>
    </div>

    <!-- REPORT -->
    <div class="up-report-section row g-4">

      <div class="col-md-12">
    <div class="details-table-card p-0 h-100">
      <div class="table-header p-3 d-flex justify-content-between align-items-center border-bottom border-dark">
        <div class="d-flex align-items-center">
          <i class="bi bi-chevron-down ms-2 text-muted small-icon"></i>
        </div>
        <div class="status-code-filter d-flex align-items-center">
          <i class="bi bi-chevron-down ms-2 text-muted small-icon"></i>
        </div>
      </div>
      <div class="report-table-container p-0">
        <table class="details-table w-100">
          <thead>
            <tr>
              <th>Status <i class="bi bi-chevron-down ms-1 small"></i></th>
              <th class="text-white-50">Scheduled</th>
              <th class="text-white-50">Load Time</th>
              <th>Status Code <i class="bi bi-chevron-down ms-1 small"></i></th>
            </tr>
          </thead>
          <tbody>
            <!-- Iterate over logs -->
            <tr v-for="(log, index) in siteActivityLogs" :key="index">
            <td>
              <div class="status-indicator">
                <div :class="['status-icon', getStatusClass(log.status)]">
                  <i :class="getStatusIcon(log.status)"></i>
                </div>
                <span>{{ log.status }}</span>
              </div>
            </td>
            <td>{{ log.time }}</td>
            <td>{{ formatLoadTime(log.loadTime) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(log.statusCode)]">
                {{ log.statusCode }}
              </span>
            </td>
          </tr>


            <!-- Jika tidak ada logs -->
            <tr v-if="siteActivityLogs.length === 0">
              <td colspan="4" class="text-center text-muted py-3">No logs available</td>
            </tr>
          </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';
import { useRoute } from 'vue-router';

export default {
  props: {
    site_id: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      site: {
        id: null,
        name: 'Unknown Site',
        url: 'example.com',
        favicon: null,
        status: 'unknown',
        lastExecution: '-',
        statusCode: '-',
        uptime: 0
      },
      siteActivityLogs: [],
      charts: {
        uptime: null,
        loadTime: null
      }
    };
  },
  created() {
    const route = useRoute();
    const siteId = this.site_id;

    const siteFromRoute = route?.state?.site;
    const siteFromStorage = localStorage.getItem('monitoring_site_detail');

    if (siteFromRoute) {
      this.site = siteFromRoute;
      this.$nextTick(() => this.initializeCharts());
    } else if (siteFromStorage) {
      try {
        const storedSite = JSON.parse(siteFromStorage);
        this.site = storedSite;
        this.$nextTick(() => this.initializeCharts());
      } catch (error) {
        console.error("Error parsing site data from localStorage", error);
      }
    }

    if (siteId) {
      Promise.all([this.fetchSiteDetailsById(siteId), this.fetchMonitoringLogs(siteId)]).then(() => {
        this.$nextTick(() => this.initializeCharts());
      });
    }

    console.log('Loaded site data:', this.site);
  },

  methods: {
    // Fungsi untuk mengambil data detail site berdasarkan ID
    async fetchSiteDetailsById(id) {
      try {
        const response = await fetch('http://localhost:5001/api/monitoring_sites/monitoring_status');
        if (!response.ok) {
          throw new Error(`Gagal fetch data site (status: ${response.status})`);
        }

        const data = await response.json();
        const siteDetail = data.find(site => site.id == id);

        if (siteDetail) {
          this.site = {
            id: siteDetail.id,
            name: siteDetail.title || 'Unknown Site',
            url: siteDetail.url || '-',
            favicon: siteDetail.logo || null,
            status: siteDetail.status || 'unknown',
            lastExecution: siteDetail.last_execution ? new Date(siteDetail.last_execution).toLocaleString() : '-',
            statusCode: siteDetail.status_code ? `${siteDetail.status_code} - SUCCESS` : '-',
            uptime: parseFloat(siteDetail.uptime) || 0
          };
        } else {
          console.warn(`Site dengan ID ${id} tidak ditemukan.`);
        }
      } catch (error) {
        console.error("Gagal mengambil data site:", error);
      }
    },

    // Fungsi untuk mengambil monitoring logs
    async fetchMonitoringLogs(siteId) {
      try {
        const response = await fetch(`http://localhost:5001/api/monitoring_logs?site_id=${siteId}`);
        if (!response.ok) throw new Error(`Gagal fetch logs (status: ${response.status})`);

        const logs = await response.json();

        // Mengurutkan logs berdasarkan checked_at (terbaru ke terlama)
        this.siteActivityLogs = logs
          .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))  // Mengurutkan berdasarkan checked_at
          .slice(0, 3);  // Mengambil 3 data log terbaru

        // Mengolah data logs untuk menampilkan informasi yang diperlukan
        this.siteActivityLogs = this.siteActivityLogs.map(log => ({

          status: log.status?.toUpperCase() || 'UNKNOWN',
          time: log.checked_at ? new Date(log.checked_at).toLocaleString() : '-',
          loadTime: log.response_time ? `${log.response_time}s` : '-',
          statusCode: log.status_code ? `${log.status_code} - ${log.status_text || 'SUCCESS'}` : '-'
        }));
      } catch (error) {
        console.error("Gagal mengambil logs:", error);
      }
    },

    // Fungsi untuk menentukan kelas ikon status (Up/Down)
   getStatusClass(status) {
    if (status === 'UP') {
      return 'up'; // Kelas untuk status "Up"
    } else if (status === 'DOWN') {
      return 'down'; // Kelas untuk status "Down"
    } else if (status === 'SCHEDULED') {
      return 'scheduled'; // Kelas untuk status "Scheduled"
    }
    return ''; // Kelas default jika status tidak dikenali
  },

  getStatusIcon(status) {
    if (status === 'UP') {
      return 'bi-arrow-up-short'; // Ikon panah atas untuk status "Up"
    } else if (status === 'DOWN') {
      return 'bi-arrow-down-short'; // Ikon panah bawah untuk status "Down"
    } else if (status === 'SCHEDULED') {
      return 'bi-clock'; // Ikon jam untuk status "Scheduled"
    }
    return ''; // Ikon default jika status tidak dikenali
  },


    // Fungsi untuk memformat load time menjadi format yang lebih mudah dibaca
    formatLoadTime(loadTime) {
      if (loadTime && !isNaN(loadTime)) {
        return `${loadTime.toFixed(2)} s`; // Mengonversi waktu pemuatan menjadi format 2 decimal
      }
      return '-'; // Jika tidak ada waktu pemuatan yang valid
    },

    // Fungsi untuk menginisialisasi grafik
    initializeCharts() {
      // Donut Chart - Uptime
      const uptimeCtx = document.getElementById('uptimeChart')?.getContext('2d');
      if (uptimeCtx) {
        this.charts.uptime = new Chart(uptimeCtx, {
          type: 'doughnut',
          data: {
            labels: ['Uptime', 'Downtime'],
            datasets: [{
              data: [this.site.uptime, 100 - this.site.uptime],
              backgroundColor: ['#4BCF39', '#CFE016'], // Menggunakan warna yang diinginkan
              borderWidth: 0,
              cutout: '80%'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true }
            },
            animation: {
              animateRotate: true,
              animateScale: true
            }
          }
        });
      }

      // Line Chart - Load & Response Time
      const loadTimeCtx = document.getElementById('loadTimeChart')?.getContext('2d');
      if (loadTimeCtx) {
        const gradientLoad = loadTimeCtx.createLinearGradient(0, 0, 0, 250);
        gradientLoad.addColorStop(0, 'rgba(13, 110, 253, 0.4)');
        gradientLoad.addColorStop(1, 'rgba(13, 110, 253, 0)');
        const gradientResponse = loadTimeCtx.createLinearGradient(0, 0, 0, 250);
        gradientResponse.addColorStop(0, 'rgba(255, 204, 0, 0.2)');
        gradientResponse.addColorStop(1, 'rgba(255, 204, 0, 0)');

        this.charts.loadTime = new Chart(loadTimeCtx, {
          type: 'line',
          data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '00:00'],
            datasets: [
              {
                label: 'Load Speed',
                data: [2.5, 1.8, 3.2, 2.7, 3.5, 3.9, 2.3],
                borderColor: '#0D6EFD',
                backgroundColor: gradientLoad,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0D6EFD',
                pointBorderColor: '#0D6EFD',
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: 'Response Time',
                data: [3.2, 2.5, 4.0, 3.5, 4.2, 4.6, 3.0],
                borderColor: '#FFCC00',
                backgroundColor: gradientResponse,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#FFCC00',
                pointBorderColor: '#FFCC00',
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: '#ddd' } },
              y: { ticks: { color: '#ddd' } }
            },
            plugins: {
              legend: { position: 'top' },
              tooltip: { enabled: true }
            }
          }
        });
      }
    }
  }
};
</script>

<style scoped>
/* Main container styles */
.details-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #121212;
  color: white;
}

/* Header styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
}

.website-icon {
  width: 40px;
  height: 40px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 50%;
  overflow: hidden;
}

.site-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.website-title {
  font-weight: bold;
  font-size: 24px;
  margin: 0 0 5px 0;
}

.website-url {
  font-size: 14px;
  color: #0D6EFD;
  text-decoration: none;
}

/* Status box styles */
.status-section {
  display: flex;
  align-items: center;
}

.status-box {
  display: flex;
  background-color: #1E1E1E;
  border-radius: 8px;
  padding: 10px 20px;
}

.status-percentage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
}

.percentage-value {
  font-size: 24px;
  font-weight: bold;
}

.percentage-label {
  font-size: 14px;
  color: #AAAAAA;
}

.uptime {
  color: #4BCF39;
  border-right: 1px solid #333;
}

.downtime {
  color: #FFCC00;
}

/* Metrics row */
.metrics-row {
  display: flex;
  gap: 20px;
  margin-bottom: 30px; /* Increased spacing */
}

/* Chart card styles */
.uptime-circle-card, .chart-card {
  background-color: #1E1E1E;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.uptime-circle-card {
  width: 30%;
}

.chart-card {
  flex-grow: 1;
  width: 70%;
}

.chart-title {
  color: #fff;
  margin-bottom: 15px;
  font-weight: 500;
}

/* Chart container styles */
.chart-container {
  height: 250px;
  position: relative;
}

/* Donut Chart specific styles */
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
  color: #4BCF39;
}

/* Legend styles */
.uptime-legends {
  width: 100%;
  padding: 0 10px;
}

.legend-item {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.legend-color-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 8px;
}

.legend-text {
  color: rgba(255, 255, 255, 0.7);
}

.bg-success {
  background-color: #4BCF39 !important;
}

.bg-warning {
  background-color: #FFCC00 !important;
}

.me-4 {
  margin-right: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.ms-2 {
  margin-left: 0.5rem;
}

.w-100 {
  width: 100%;
}

.d-flex {
  display: flex;
}

.justify-content-center {
  justify-content: center;
}

.align-items-center {
  align-items: center;
}

.flex-column {
  flex-direction: column;
}

.text-light {
  color: #fff;
}

.text-primary {
  color: #0D6EFD;
}

.text-warning {
  color: #FFCC00;
}

.text-muted {
  color: #6c757d;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.me-3 {
  margin-right: 0.75rem;
}

/* Small icon for dropdown indicators */
.small-icon {
  font-size: 12px;
}

/* Up Report Section Styles - Updated for split cards */
.up-report-section {
  margin-bottom: 30px; /* Increased spacing */
}

/* Details table styles */
.details-table-card {
  background-color: #1E1E1E;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Control panel specific styles */
.control-panel {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  height: 100%;
}

.control-panel h4 {
  margin-bottom: 1rem;
}

.select-label {
  color: #AAAAAA;
  font-size: 14px;
  margin-bottom: 0.5rem;
  display: block;
}

.select-wrapper {
  width: 100%;
  margin-bottom: 0.5rem;
}

.time-select, .status-filter {
  background-color: #222;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  width: 100%;
}

.form-select {
  background-color: #222;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  width: 100%;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
}

.select-time-container {
  margin-bottom: 1rem;
}

.custom-range-btn, .generate-report-btn {
  background-color: transparent;
  color: white;
  border: 1px solid #333;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.custom-range-btn:hover {
  background-color: #333;
}

.generate-report-btn {
  background-color: #0D6EFD;
  border: none;
  font-weight: bold;
}

.generate-report-btn:hover {
  background-color: #0b5ed7;
}

/* Table header styles */
.table-header {
  margin-bottom: 0; /* Removed bottom margin */
  background-color: #1E1E1E;
  padding: 1rem 1.5rem;
}

.table-title-section h4 {
  margin: 0;
}

.header-controls {
  width: 100%;
}

.report-table-container {
  border-radius: 8px;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table th, .details-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #333;
}

.details-table th {
  color: rgba(255, 255, 255, 0.5);
  font-weight: normal;
  text-transform: uppercase;
  font-size: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.status-up {
  background-color: #4BCF39;
  color: #ffffff;
}

.status-down {
  background-color: #CFE016;
  color: red;
}

.text-white {
  color: white;
}

.text-white-50 {
  color: rgba(255, 255, 255, 0.5);
}

.bi-arrow-up-short, .bi-arrow-down-short {
  font-size: 18px;
  font-weight: bold;
}

.status-badge {
  padding: 5px 15px;
  border-radius: 999px;
  color: white;
  font-size: 12px;
  display: inline-block;
}

.status-success {
  background-color: rgba(75, 207, 57, 0.1);
  color: #4BCF39;
  border: 1px solid rgba(75, 207, 57, 0.3);
}

.status-error {
  background-color: rgba(255, 59, 59, 0.1);
  color: #FF3B3B;
  border: 1px solid rgba(255, 59, 59, 0.3);
}

/* New styles for the updated cards */
.logo-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  overflow: hidden;
}

.telkom-logo {
  max-width: 100%;
  max-height: 100%;
}

.bg-black {
  background-color: #000000 !important;
}

/* Card styles */
.card-dark {
  background-color: #1E1E1E;
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: none;
  height: 100%;
}

/* Status icon styles from dashboard */
.icon-box {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-success-transparent {
  background-color: rgba(57, 207, 75, 0.2);
}

.bg-danger-transparent {
  background-color: rgba(207, 224, 22, 0.2);
}

/* Styling for status icons */
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

.p-0 {
  padding: 0 !important;
}

.p-3 {
  padding: 1rem !important;
}

.m-0 {
  margin: 0 !important;
}

.border-bottom {
  border-bottom: 1px solid;
}

.border-dark {
  border-color: #333 !important;
}

.bg-transparent {
  background-color: transparent !important;
}

.border-0 {
  border: 0 !important;
}

.justify-content-between {
  justify-content: space-between !important;
}

/* Status code filter style */
.status-code-filter {
  color: white;
}

/* New form styling for consistent look */
.h-100 {
  height: 100% !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .metrics-row {
    flex-direction: column;
  }
  
  .uptime-circle-card, .chart-card {
    width: 100%;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .status-section {
    margin-top: 15px;
    width: 100%;
  }
  
  .status-box {
    width: 100%;
    justify-content: space-around;
  }

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

  .card-dark:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }

  .table-dark {
    --bs-table-bg: transparent;
    --bs-table-hover-bg: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
}

.status-badge-rounded {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
}

</style>