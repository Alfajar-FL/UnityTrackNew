import express from 'express';
import { pool } from '../../db.js';
import { runMonitoringCron } from '../../cron.js';
import { sendTelegramNotification } from '../../telegram.js';
import axios from 'axios';

const router = express.Router();

// Endpoint untuk menjalankan monitoring manual
router.post('/trigger-cron', async (req, res) => {
  try {
    const monitoringResults = await runMonitoringCron(true); // Mode manual

    const updatedResults = [];

    for (const site of monitoringResults) {
      const [[summary]] = await pool.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS up_count,
                MAX(checked_at) AS last_execution
         FROM monitoring_logs
         WHERE site_id = ?`,
        [site.id]
      );

      const uptime = summary.total > 0
        ? ((summary.up_count / summary.total) * 100).toFixed(2)
        : null;

      await pool.query(
        `UPDATE monitoring_sites
         SET uptime = ?, last_execution = ?
         WHERE id = ?`,
        [uptime, summary.last_execution, site.id]
      );

      updatedResults.push({
        ...site,
        uptime,
        last_execution: summary.last_execution
      });
    }

    // Kirim ke Telegram
    const messages = updatedResults.map(site => (
      `🌐 *${site.title}*\n` +
      `URL: ${site.url}\n` +
      `Status: \`${site.status}\`\n` +
      `Status Code: \`${site.status_code || 'N/A'}\`\n` +
      `Response Time: \`${site.response_time || 'N/A'}ms\`\n` +
      `Uptime: \`${site.uptime || 'N/A'}%\`\n` +
      `Checked At: \`${site.last_execution || 'N/A'}\`\n`
    ));

    const fullMessage =
      `✅ *Cronjob monitoring manual dijalankan*\n📊 Hasil monitoring saat ini:\n\n` +
      messages.join('\n');

    await sendTelegramNotification(fullMessage);

    res.status(200).json({
      message: 'Monitoring berhasil dijalankan dan hasil terbaru dikembalikan.',
      data: updatedResults
    });
  } catch (err) {
    console.error('❌ Gagal menjalankan cronjob manual:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat menjalankan cronjob manual' });
  }
});

// Tambah monitoring site
router.post('/', async (req, res) => {
  try {
    const {
      title,
      url,
      status,
      schedule_type,
      schedule_minutes,
      schedule_hours,
      schedule_hours_minute,
      schedule_day,
      schedule_day_hour,
      schedule_day_minute,
      schedule_month,
      schedule_month_day,
      schedule_year_hour,
      schedule_year_minute
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO monitoring_sites (
        title, url, status, schedule_type, schedule_minutes, schedule_hours,
        schedule_hours_minute, schedule_day, schedule_day_hour,
        schedule_day_minute, schedule_month, schedule_month_day,
        schedule_year_hour, schedule_year_minute
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        url,
        status,
        schedule_type,
        schedule_minutes,
        schedule_hours,
        schedule_hours_minute,
        schedule_day,
        schedule_day_hour,
        schedule_day_minute,
        schedule_month,
        schedule_month_day,
        schedule_year_hour,
        schedule_year_minute
      ]
    );

    res.status(201).json({
      message: 'Monitoring site berhasil ditambahkan.',
      id: result.insertId
    });

    await sendTelegramNotification(`🆕 Monitoring site "*${title}*" berhasil ditambahkan.`);
  } catch (err) {
    console.error('❌ Gagal menambahkan monitoring site:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat menambahkan site' });
  }
});

// Ambil semua monitoring sites
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM monitoring_sites');
    res.json(rows);
  } catch (err) {
    console.error('❌ Gagal mengambil monitoring_sites:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data' });
  }
});

// Ambil semua status monitoring
router.get('/monitoring_status', async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM monitoring_sites');
    const results = [];

    for (const site of sites) {
      const [[summary]] = await pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
                MAX(checked_at) as last_execution
         FROM monitoring_logs
         WHERE site_id = ?`,
        [site.id]
      );

      const [[latestLog]] = await pool.query(
        `SELECT status_code, response_time
         FROM monitoring_logs
         WHERE site_id = ?
         ORDER BY checked_at DESC
         LIMIT 1`,
        [site.id]
      );

      const uptime = summary.total > 0 ? ((summary.up_count / summary.total) * 100).toFixed(2) : null;

      await pool.query(
        `UPDATE monitoring_sites
         SET status = ?, last_execution = ?, status_code = ?, uptime = ?, response_time = ?
         WHERE id = ?`,
        [
          site.status, 
          summary.last_execution || null,
          latestLog?.status_code || null,
          uptime,
          latestLog?.response_time || null,
          site.id
        ]
      );
      
      results.push({
        ...site,
        last_execution: summary.last_execution || null,
        status_code: latestLog?.status_code || null,
        uptime,
        response_time: latestLog?.response_time || null
      });
    }

    res.json(results);
  } catch (err) {
    console.error('❌ Gagal mendapatkan status monitoring:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan internal' });
  }
});

// Ambil logs berdasarkan site_id
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [logs] = await pool.query(
      `SELECT id, site_id, status, status_code, response_time, checked_at
       FROM monitoring_logs
       WHERE site_id = ?
       ORDER BY checked_at DESC`,
      [id]
    );
    res.json(logs);
  } catch (err) {
    console.error('❌ Gagal mengambil logs:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil logs' });
  }
});

// Ambil detail monitoring site by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM monitoring_sites WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Website tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Gagal mengambil detail situs:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan internal' });
  }
});

// Update monitoring site
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      url,
      status,
      schedule_type,
      schedule_minutes,
      schedule_hours,
      schedule_hours_minute,
      schedule_day,
      schedule_day_hour,
      schedule_day_minute,
      schedule_month,
      schedule_month_day,
      schedule_year_hour,
      schedule_year_minute
    } = req.body;

    await pool.query(
      `UPDATE monitoring_sites
       SET title = ?, url = ?, status = ?, schedule_type = ?, schedule_minutes = ?, schedule_hours = ?,
           schedule_hours_minute = ?, schedule_day = ?, schedule_day_hour = ?, schedule_day_minute = ?,
           schedule_month = ?, schedule_month_day = ?, schedule_year_hour = ?, schedule_year_minute = ?
       WHERE id = ?`,
      [
        title,
        url,
        status,
        schedule_type,
        schedule_minutes,
        schedule_hours,
        schedule_hours_minute,
        schedule_day,
        schedule_day_hour,
        schedule_day_minute,
        schedule_month,
        schedule_month_day,
        schedule_year_hour,
        schedule_year_minute,
        id
      ]
    );

    res.json({ message: 'Website berhasil diperbarui.' });
    await sendTelegramNotification(`✏️ Monitoring site "*${title}*" berhasil diperbarui.`);
  } catch (err) {
    console.error('❌ Gagal memperbarui site:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui site.' });
  }
});

// Hapus monitoring site
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM monitoring_sites WHERE id = ?', [id]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Situs berhasil dihapus' });
      await sendTelegramNotification(`🗑️ Monitoring site ID ${id} berhasil dihapus.`);
    } else {
      res.status(404).json({ message: 'Situs tidak ditemukan' });
    }
  } catch (err) {
    console.error('❌ Gagal menghapus site:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus site' });
  }
});

// Reset uptime ke 0
router.post('/reset-uptime', async (req, res) => {
  try {
    await pool.query('UPDATE monitoring_sites SET uptime = 0');
    res.status(200).json({ message: '✅ Uptime berhasil di-reset.' });
  } catch (err) {
    console.error('❌ Gagal reset uptime:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat reset uptime' });
  }
});

// Endpoint untuk update interval
router.put('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { schedule_minutes } = req.body;

  if (!schedule_minutes || schedule_minutes < 1 || schedule_minutes > 60) {
    return res.status(400).json({ success: false, message: 'Interval tidak valid' });
  }

  try {
    await pool.query('UPDATE monitoring_sites SET schedule_minutes = ? WHERE id = ?', [schedule_minutes, id]);
    const [[site]] = await pool.query('SELECT * FROM monitoring_sites WHERE id = ?', [id]);

    if (!site) return res.status(404).json({ success: false, message: 'Situs tidak ditemukan' });

    createSiteCron(site); // Restart cron
    res.json({ success: true, message: 'Jadwal berhasil diperbarui' });

  } catch (err) {
    console.error('Gagal update jadwal:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat update jadwal' });
  }
});

export default router;
