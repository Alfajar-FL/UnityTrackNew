<template>
  <div class="monitoring-container p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold text-light">Monitoring</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="openModal()">+ Add Website</button>
        <button class="btn btn-outline-light" @click="runCronjobNow" :disabled="isCronRunning">
          <span v-if="isCronRunning" class="spinner-border spinner-border-sm me-1"></span>
          Trigger Cronjob
        </button>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Table Section -->
    <div v-else class="bg-dark rounded shadow-sm p-3">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle" style="font-size: 1.05rem;">
          <thead class="text-white" style="background: linear-gradient(135deg, #007bff, #6c757d);">
            <tr class="text-nowrap">
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Website</th>
              <th class="px-3 py-3">Last Execution</th>
              <th class="px-3 py-3">Status Code</th>
              <th class="px-3 py-3">Uptime</th>
              <th class="px-3 py-3 text-end">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="site in paginatedSites" :key="site.id" class="border-top">
              <!-- Status -->
              <td class="px-3 py-3">
                <div class="d-flex align-items-center gap-2">
                  <div :class="['status-circle', site.status?.toLowerCase() === 'up' ? 'status-up' : 'status-down']">
                    <i :class="['bi', site.status?.toLowerCase() === 'up' ? 'bi-arrow-up' : 'bi-arrow-down']"></i>
                  </div>
                  <span
                    :class="[site.status?.toLowerCase() === 'up' ? 'text-success' : 'text-danger', 'fw-semibold']"
                  >
                    {{ site.status?.toLowerCase() === 'up' ? 'up' : 'down' }}
                  </span>
                </div>
              </td>

              <!-- Website -->
              <td class="px-3 py-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="favicon-wrapper border border-secondary rounded d-flex justify-content-center align-items-center" style="width: 28px; height: 28px; background-color: #2c2f33;">
                    <img
                      :src="getFaviconUrl(site.url)"
                      @error="setDefaultFavicon($event)"
                      alt="favicon"
                      style="width: 18px; height: 18px;"
                    />
                  </div>
                  <span class="text-truncate" style="max-width: 200px;">{{ site.title }}</span>
                </div>
              </td>

              <!-- Last Execution -->
              <td class="px-3 py-3">{{ formatDate(site.last_execution) }}</td>

              <!-- Status Code -->
              <td class="px-3 py-3">
                <span v-if="site.status_code" class="badge bg-dark border border-success text-success rounded-pill px-3 py-2">
                  {{ site.status_code }} - SUCCESS
                </span>
                <span v-else class="badge bg-dark border border-danger text-danger rounded-pill px-3 py-2">
                  FAILED
                </span>
              </td>

              <!-- Uptime -->
              <td class="px-3 py-3">
                <div class="progress" style="height: 15px;">
                  <div
                    class="progress-bar"
                    role="progressbar"
                    :style="{ width: (site.uptime || 0) + '%' }"
                    :class="{
                      'bg-success': site.uptime === 100,
                      'bg-info': site.uptime >= 90 && site.uptime < 100,
                      'bg-warning': site.uptime >= 50 && site.uptime < 90,
                      'bg-danger': site.uptime < 50
                    }"
                    :aria-valuenow="site.uptime || 0"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {{ site.uptime ? site.uptime + '%' : '0%' }}
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-3 py-3 text-end">
                <div class="dropdown position-relative">
                  <button class="btn btn-sm btn-outline-light px-2" @click.stop="toggleDropdown(site.id)">
                    &#8942;
                  </button>
                  <ul
                    class="dropdown-menu dropdown-menu-end"
                    :class="{ show: showDropdown === site.id }"
                    style="z-index: 1050; position: absolute;"
                  >
                    <li>
                      <router-link 
                        :to="{ name: 'Detail', params: { site_id: site.id } }"
                        class="dropdown-item"
                      >
                        Detail
                      </router-link>
                    </li>
                    <li><a class="dropdown-item" @click="openModal(site)">Edit</a></li>
                    <li><a class="dropdown-item text-danger" @click="deleteSite(site)">Delete</a></li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 d-flex justify-content-center">
        <nav>
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link circle-page" @click="changePage(currentPage - 1)">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>

            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: currentPage === page }"
            >
              <button class="page-link circle-page" @click="changePage(page)">
                {{ page }}
              </button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link circle-page" @click="changePage(currentPage + 1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal -->
      <div class="modal fade" id="websiteModal" ref="websiteModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-white">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Website' : 'Add Website' }}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Title</label>
                <input v-model="form.title" class="form-control" placeholder="Enter title" />
              </div>

              <div class="mb-3">
                <label class="form-label">URL</label>
                <input v-model="form.url" class="form-control" placeholder="https://example.com" />
              </div>

              <div class="mb-3">
                <label class="form-label">Status</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" id="statusUp" value="up" v-model="form.status" />
                    <label class="form-check-label" for="statusUp">Active</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" id="statusDown" value="down" v-model="form.status" />
                    <label class="form-check-label" for="statusDown">Inactive</label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Tipe Jadwal</label>
                <select
                  class="form-select bg-dark text-white border-secondary"
                  v-model="form.scheduleType"
                >
                  <option value="minutes">Setiap X Menit</option>
                  <option value="hours">Setiap Jam ke-X</option>
                </select>
              </div>

              <div class="mb-3" v-if="form.scheduleType === 'minutes'">
                <label class="form-label">Interval (menit)</label>
                <input type="number" class="form-control" min="1" max="60" v-model.number="form.scheduleMinutes" placeholder="Contoh: 5" />
              </div>

              <div class="mb-3" v-if="form.scheduleType === 'hours'">
                <label class="form-label">Jam (0-23)</label>
                <input type="number" class="form-control" min="0" max="23" v-model.number="form.scheduleHours" placeholder="Contoh: 3" />
              </div>
            </div> <!-- Tutup modal-body -->

            <div class="modal-footer">
              <button class="btn btn-primary" :disabled="isSubmitting" @click="submitForm">
                {{ isSubmitting ? 'Saving...' : 'Submit' }}
              </button>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Modal } from 'bootstrap'

const router = useRouter()
const API_BASE = 'http://localhost:5001/api/monitoring_sites'

const monitoringSites = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isCronRunning = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

const websiteModal = ref(null)
const modalInstance = ref(null)
const isEditing = ref(false)
const editingId = ref(null)

const form = ref(getEmptyForm())
const showDropdown = ref(null)

// Computed properties
const totalPages = computed(() => Math.ceil(monitoringSites.value.length / itemsPerPage))

const paginatedSites = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return monitoringSites.value.slice(start, start + itemsPerPage)
})

const isFormValid = computed(() =>
  form.value.title.trim() !== '' && form.value.url.trim() !== ''
)

// Lifecycle
onMounted(() => {
  fetchMonitoringSites()
  document.addEventListener('click', closeDropdownOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOutside)
})

// Helpers
function getEmptyForm() {
  return {
    title: '',
    url: '',
    status: 'up',
    scheduleType: 'minutes',
    scheduleMinutes: 5,
    scheduleHours: null,
  }
}

function openModal(site = null) {
  isEditing.value = !!site
  editingId.value = site?.id ?? null
  form.value = site
    ? {
        title: site.title,
        url: site.url,
        status: site.status,
        scheduleType: site.schedule_type || 'minutes',
        scheduleMinutes: site.schedule_minutes ?? 5,
        scheduleHours: site.schedule_hours ?? null,
      }
    : getEmptyForm()

  if (!modalInstance.value && websiteModal.value) {
    modalInstance.value = new Modal(websiteModal.value)
  }

  modalInstance.value?.show()
}

async function submitForm() {
  if (!isFormValid.value) {
    alert('⚠️ Title dan URL wajib diisi.')
    return
  }

  isSubmitting.value = true

  const payload = {
    title: form.value.title,
    url: form.value.url,
    status: form.value.status,
    schedule_type: form.value.scheduleType,
    schedule_minutes: form.value.scheduleMinutes ?? null,
    schedule_hours: form.value.scheduleHours ?? null,
  }

  try {
    if (isEditing.value) {
      await axios.put(`${API_BASE}/${editingId.value}`, payload)
    } else {
      await axios.post(`${API_BASE}`, payload)
    }

    modalInstance.value?.hide()
    await fetchMonitoringSites()
  } catch (err) {
    alert('❌ Gagal menyimpan data website.')
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

async function fetchMonitoringSites() {
  isLoading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/monitoring_status`)
    monitoringSites.value = Array.isArray(data) ? data : []
    currentPage.value = 1
  } catch (error) {
    console.error('❌ Gagal mengambil data monitoring:', error)
  } finally {
    isLoading.value = false
  }
}

async function deleteSite(site) {
  if (!confirm(`Hapus website "${site.title}"?`)) return
  try {
    await axios.delete(`${API_BASE}/${site.id}`)
    await fetchMonitoringSites()
  } catch (err) {
    alert('❌ Gagal menghapus website.')
    console.error(err)
  }
}

async function runCronjobNow() {
  isCronRunning.value = true
  try {
    await axios.post(`${API_BASE}/trigger-cron`)
    await fetchMonitoringSites()
  } catch (err) {
    alert('❌ Gagal menjalankan cronjob.')
    console.error(err)
  } finally {
    isCronRunning.value = false
  }
}

// Pagination
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Dropdown
function toggleDropdown(id) {
  showDropdown.value = showDropdown.value === id ? null : id
}

function closeDropdownOutside(e) {
  if (!e.target.closest('.dropdown')) {
    showDropdown.value = null
  }
}

// Utility
function formatDate(dateString) {
  return dateString ? new Date(dateString).toLocaleString() : '-'
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url.startsWith('http') ? url : `http://${url}`).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}`
  } catch {
    return 'https://via.placeholder.com/16'
  }
}

function setDefaultFavicon(event) {
  event.target.src = 'https://via.placeholder.com/16'
}
</script>

<style scoped>
/* Main container styles */
.monitoring-container {
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

.title {
  font-weight: bold;
  margin: 0;
  font-size: 20px;
}

.add-btn {
  background-color: #0D6EFD;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
}

/* Card styles */
.monitoring-card {
  background-color: #1E1E1E;
  border-radius: 8px;
  overflow: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Table styles */

.table-dark-custom {
  background-color: #1e1e2f;
  border-radius: 0.5rem;
  overflow: hidden;
  color: #fff;
}

.table-dark-custom thead {
  background-color: #2a2a3b;
}

.table-dark-custom tbody tr {
  border-bottom: 1px solid #34344a;
}

.table-dark-custom tbody tr:hover {
  background-color: #2f2f40;
}

.monitoring-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.monitoring-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  color: #AAAAAA;
  border-bottom: 1px solid #333;
  font-size: 14px;
  white-space: nowrap;
}

.table-row {
  border-bottom: 1px solid #333;
}

.monitoring-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

/* Status indicator styles */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
}

.status-up {
  background-color: #4BCF39;
  color: white;
}

.status-down {
  background-color: #FFCC00;
  color: #dc3545; 
}

.status-text {
  font-weight: 500;
  font-size: 14px;
}

.text-success {
  color: #4BCF39;
}

.text-warning {
  color: #FFCC00;
}

/* Website info styles */
.website-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-logo {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.website-detail {
  display: flex;
  flex-direction: column;
}

.website-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.website-url {
  font-size: 12px;
  color: #0D6EFD;
  text-decoration: none;
}

/* Last execution styling */
.last-execution {
  white-space: nowrap;
  font-size: 14px;
}

/* Status code badge styles */
.status-code-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-code-success {
  background-color: rgba(75, 207, 57, 0.2);
  color: #4BCF39;
  border: 1px solid rgba(75, 207, 57, 0.3);
}

.status-code-warning {
  background-color: rgba(255, 204, 0, 0.2);
  color: #FFCC00;
  border: 1px solid rgba(255, 204, 0, 0.3);
}

/* Uptime cell styling */
.uptime-cell {
  text-align: center;
  font-weight: 500;
  font-size: 14px;
}

/* Progress segments styles */
.progress-segments {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 12px;
}

.segment {
  flex: 1;
  height: 100%;
  border-radius: 2px;
}

.segment-up {
  background-color: #4BCF39;
}

.segment-down {
  background-color: #FFCC00;
}

.segment-empty {
  background-color: #333;
}

/* Action menu styles */
.action-menu {
  position: relative;
}

.menu-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: #2C2C2C;
  border-radius: 4px;
  padding: 8px 0;
  list-style: none;
  display: none;
  min-width: 150px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: white;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #3C3C3C;
}

/* Modal styles */
.modal-content {
  background-color: #1E1E1E;
  color: white;
  border-radius: 8px;
}

.modal-header {
  border-bottom: 1px solid #333;
}

.modal-footer {
  border-top: 1px solid #333;
  justify-content: center;
}

.form-control, .input-group-text, .form-select-sm, .form-control-sm {
  background-color: #2C2C2C;
  color: white;
  border: 1px solid #444;
}

.form-control:focus, .form-select-sm:focus, .form-control-sm:focus {
  background-color: #2C2C2C;
  color: white;
  border-color: #0D6EFD;
  box-shadow: none;
}

.form-check-input {
  background-color: #2C2C2C;
  border-color: #444;
}

.form-check-input:checked {
  background-color: #0D6EFD;
  border-color: #0D6EFD;
}

.schedule-input {
  width: 50px;
  display: inline-block;
  margin: 0 5px;
}

.schedule-select {
  display: inline-block;
  width: auto;
  margin: 0 5px;
}

.submit-btn {
  background-color: #0D6EFD;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 30px;
  font-weight: bold;
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .monitoring-card {
    overflow-x: auto;
  }
}

.table-dark {
  background-color: #1f1f1f;
  color: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.table-dark th {
  background-color: #2b2b2b;
  color: #d1d1d1;
  font-weight: 500;
  border: none;
}

.table-dark td {
  background-color: #2b2b2b;
  border: none;
}

.badge {
  font-size: 0.9rem;
  padding: 6px 10px;
}

.favicon-wrapper {
  background-color: #2c2f33;
  border: 1px solid #444;
}

.text-white {
  color: #fff !important;
}

.progress {
  background-color: #444;
  border-radius: 20px;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.6s ease;
  font-size: 0.8rem;
  font-weight: 500;
}


.dropdown-item {
  color: #fff;
}


.btn-outline-light {
  border-color: #555;
  color: #ccc;
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

.table-responsive {
  overflow: visible !important;
}

table {
  overflow: visible !important;
}

tbody {
  overflow: visible !important;
}

</style>
