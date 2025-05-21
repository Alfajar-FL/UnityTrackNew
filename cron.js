import cron from 'node-cron';
import axios from 'axios';
import { pool } from './db.js';
import { format } from 'date-fns';
import { sendMonitoringStatus, sendTelegramNotification } from './telegram.js';

// Fungsi untuk mengeksekusi monitoring
export const executeMonitoring = async (force = false) => {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1; // getMonth() mulai dari 0
  const currentYear = now.getFullYear();
  const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss');

  console.log(`⏰ Monitoring berjalan pada: ${timestamp} ${force ? '(Manual)' : '(Otomatis)'}`);

  const monitoringResults = [];

  try {
    // Ambil semua situs
    const [websites] = await pool.query('SELECT * FROM monitoring_sites');

    for (const site of websites) {
      const {
        id, url, title, schedule_type,
        schedule_minutes,
        schedule_hours_minute,
        schedule_day, schedule_day_hour, schedule_day_minute,
        schedule_month, schedule_month_day,
        schedule_year, schedule_year_minute
      } = site;

      // Tentukan apakah monitoring perlu dijalankan
      const shouldCheck = (() => {
        if (force) return true;

        switch (schedule_type) {
          case 'minutes':
            return schedule_minutes && currentMinute % schedule_minutes === 0;

          case 'hours':
            return schedule_hours_minute !== null && currentMinute === schedule_hours_minute;

          case 'month':
            return (
              schedule_month_day !== null &&
              schedule_day_hour !== null &&
              schedule_day_minute !== null &&
              currentDate === schedule_month_day &&
              currentHour === schedule_day_hour &&
              currentMinute === schedule_day_minute
            );

          case 'year':
            return (
              schedule_year !== null &&
              schedule_month !== null &&
              schedule_month_day !== null &&
              schedule_day_hour !== null &&
              schedule_year_minute !== null &&
              currentYear === schedule_year &&
              currentMonth === schedule_month &&
              currentDate === schedule_month_day &&
              currentHour === schedule_day_hour &&
              currentMinute === schedule_year_minute
            );

          default:
            return false;
        }
      })();

      if (!shouldCheck) continue;

      let newStatus = 'down'; // Default ke 'down'
      let statusCode = 0;
      let metaDescription = '';
      let ogImage = '';

      try {
        const fullUrl = url.startsWith('http') ? url : `http://${url}`;
        const urlRegex = /^(http:\/\/|https:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}(\/[^\s]*)?$/;
        if (!urlRegex.test(fullUrl)) throw new Error('URL tidak valid');

        const response = await axios.get(fullUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        });

        statusCode = response.status;
        newStatus = (statusCode >= 200 && statusCode < 400) ? 'up' : 'down';

        const html = response.data;
        metaDescription = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || '';
        ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || '';

      } catch (error) {
        console.error(`❌ Gagal mengakses ${title} (${url}): ${error.message}`);
        newStatus = 'down';
        statusCode = 0;
      }

      // Simpan hasil ke database
      await pool.query(
        `UPDATE monitoring_sites SET status = ?, status_code = ?, last_execution = ? WHERE id = ?`,
        [newStatus, statusCode, timestamp, id]
      );

      await pool.query(
        `INSERT INTO monitoring_logs (site_id, status_code, status, checked_at) VALUES (?, ?, ?, ?)`,
        [id, statusCode, newStatus, timestamp]
      );

      await sendMonitoringStatus(title, url, newStatus, statusCode);

      monitoringResults.push({
        ...site,
        status: newStatus,
        status_code: statusCode,
        checked_at: timestamp
      });

      console.log(`✅ ${title} dicek - Status: ${newStatus.toUpperCase()} (${statusCode})`);
    }

    console.log('📡 Selesai monitoring semua situs');

    if (monitoringResults.length > 0) {
      const messages = monitoringResults.map(site => (
        `🌐 *${site.title}*\n` +
        `URL: ${site.url}\n` +
        `Status Code: \`${site.status_code || 'N/A'}\`\n` +
        `Uptime: \`${site.uptime ?? 'N/A'}%\`\n` +
        `Response Time: \`${site.response_time || 'N/A'}ms\`\n` +
        `Last Execution: \`${site.checked_at || 'N/A'}\`\n`
      ));

      const fullMessage =
        `✅ *Monitoring ${force ? 'manual' : 'otomatis'} selesai*\n📊 Status monitoring saat ini:\n\n` +
        messages.join('\n');

      await sendTelegramNotification(fullMessage);
    }

    return monitoringResults;

  } catch (error) {
    console.error('❌ Error saat monitoring:', error.message);
    return [];
  }
};

// Fungsi utama untuk dijalankan secara manual atau oleh cron
export const runMonitoringCron = async (force = false) => {
  console.log('🌀 Cron job dimulai');
  return await executeMonitoring(force);
};

// Cron job utama: setiap menit
cron.schedule('* * * * *', () => {
  runMonitoringCron();
});

// Reset uptime setiap tengah malam
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('⏰ Reset uptime otomatis...');
    await axios.post('http://localhost:5001/api/monitoring_sites/reset-uptime');
    console.log('✅ Reset uptime selesai.');
  } catch (err) {
    console.error('❌ Gagal reset uptime:', err.message);
  }
});
