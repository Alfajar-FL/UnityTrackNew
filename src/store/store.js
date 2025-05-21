import { createStore } from 'vuex'

export default createStore({
  state: {
    monitoringSites: [],
  },
  mutations: {
    setMonitoringSites(state, sites) {
      state.monitoringSites = sites
    },
  },
  actions: {
    async fetchMonitoringSites({ commit }) {
      try {
        const { data } = await axios.get('http://localhost:5001/api/monitoring_sites/monitoring_status')
        commit('setMonitoringSites', Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch websites:', error)
      }
    },
    async addMonitoringSite({ commit }, siteData) {
      try {
        await axios.post('http://localhost:5001/api/monitoring_sites', siteData)
        commit('fetchMonitoringSites')
      } catch (error) {
        console.error('Failed to add new site:', error)
      }
    },
    async updateMonitoringSite({ commit }, { id, siteData }) {
      try {
        await axios.put(`http://localhost:5001/api/monitoring_sites/${id}`, siteData)
        commit('fetchMonitoringSites')
      } catch (error) {
        console.error('Failed to update site:', error)
      }
    },
  },
  getters: {
    getMonitoringSites: (state) => state.monitoringSites,
  },
})
