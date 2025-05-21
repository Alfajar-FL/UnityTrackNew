import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const siteId = req.query.site_id;

  try {
    let query = 'SELECT * FROM monitoring_logs';
    let params = [];

    // Jika site_id bukan 'all' dan ada, maka kita validasi
    if (siteId && siteId !== 'all') {
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "Site ID harus berupa angka yang valid atau 'all'." });
      }
      query += ' WHERE site_id = ?';
      params.push(Number(siteId)); // Ubah ke number jika valid
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tidak ada log ditemukan." });
    }

    res.json(rows); // Kirimkan hasil logs
  } catch (err) {
    console.error("Error fetching monitoring logs:", err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil log monitoring.", error: err.message });
  }
});



// POST log monitoring
router.post('/', async (req, res) => {
  const { site_id, status_code, response_time, status, checked_at } = req.body;

  if (!site_id || !status_code || response_time === undefined || !status || !checked_at) {
    return res.status(400).json({ message: "Semua field harus diisi: site_id, status_code, response_time, status, checked_at." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO monitoring_logs (site_id, status_code, response_time, status, checked_at)
       VALUES (?, ?, ?, ?, ?)`,
      [site_id, status_code, response_time, status, checked_at]
    );

    if (result.affectedRows > 0) {
      res.status(201).json({ message: 'Log berhasil disimpan.', log_id: result.insertId });
    } else {
      res.status(500).json({ message: 'Gagal menyimpan data log.' });
    }
  } catch (err) {
    console.error("Error saving monitoring log:", err);
    res.status(500).json({ message: "Terjadi kesalahan saat menyimpan log monitoring.", error: err.message });
  }
});

// GET uptime summary by site_id
router.get('/uptime_summary', async (req, res) => {
  const siteId = req.query.site_id;
  if (!siteId || isNaN(siteId)) {
    return res.status(400).json({ message: "Site ID harus berupa angka yang valid." });
  }

  try {
    // Ambil total log, total UP, response time rata-rata, dan eksekusi terakhir
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total_logs,
        SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) AS total_up,
        SUM(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END) AS total_down,
        AVG(response_time) AS avg_response_time,
        MAX(checked_at) AS last_checked
      FROM monitoring_logs
      WHERE site_id = ?
    `, [siteId]);

    if (rows.length === 0 || rows[0].total_logs === 0) {
      return res.status(404).json({ message: "Belum ada data log untuk site ini." });
    }

    const { total_logs, total_up, total_down, avg_response_time, last_checked } = rows[0];
    const uptime_percentage = ((total_up / total_logs) * 100).toFixed(2);

    res.json({
      site_id: Number(siteId),
      total_logs,
      total_up,
      total_down,
      uptime_percentage: Number(uptime_percentage),
      avg_response_time: Number(avg_response_time.toFixed(2)),
      last_checked
    });
  } catch (err) {
    console.error("Error calculating uptime summary:", err);
    res.status(500).json({ message: "Gagal menghitung uptime summary.", error: err.message });
  }
});
// GET monitoring logs with filters (waktu, status, site_id)
router.get('/filter', async (req, res) => {
  const { start_date, end_date, status, site_id } = req.query;

  // Validasi parameter
  if (!start_date || !end_date) {
    return res.status(400).json({ message: "start_date dan end_date harus diisi." });
  }

  let query = 'SELECT * FROM monitoring_logs WHERE checked_at BETWEEN ? AND ?';
  let params = [start_date, end_date];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (site_id && site_id !== 'all') {
    query += ' AND site_id = ?';
    params.push(site_id);
  }

  try {
    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tidak ada log ditemukan untuk filter yang diberikan." });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching monitoring logs:", err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil log monitoring.", error: err.message });
  }
});

export default router;