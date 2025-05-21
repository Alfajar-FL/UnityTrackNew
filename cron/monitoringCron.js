const cron = require('node-cron');
const axios = require('axios');
const db = require('../db'); // jika file ini ada di folder cron

async function runMonitoring() {
  const [sites] = await db.query('SELECT * FROM monitoring_sites');
  for (let site of sites) {
    try {
      const res = await axios.get('http://' + site.url);
      const statusCode = res.status;
      const status = statusCode === 200 ? 'up' : 'down';

      await db.query(`
        UPDATE monitoring_sites 
        SET status = ?, status_code = ?, last_execution = NOW()
        WHERE id = ?
      `, [status, statusCode + ' - ' + (status === 'up' ? 'SUCCESS' : 'ERROR'), site.id]);
    } catch (error) {
      await db.query(`
        UPDATE monitoring_sites 
        SET status = 'down', status_code = '503 - ERROR', last_execution = NOW()
        WHERE id = ?
      `, [site.id]);
    }
  }
}

// Jalankan tiap 5 menit
cron.schedule('*/5 * * * *', runMonitoring);
