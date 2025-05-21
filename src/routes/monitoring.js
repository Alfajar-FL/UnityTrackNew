import express from 'express';
import { pool } from '../db.js';
import { runMonitoringCron } from '../cron.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { title, url, execution_schedule, created_by } = req.body;

  if (!title || !url || !execution_schedule || !created_by) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  const sql = `
    INSERT INTO website (title, url, execution_schedule, created_by)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await pool.execute(sql, [title, url, execution_schedule, created_by]);
    res.status(201).json({ message: 'Website added', id: result.insertId });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/trigger-cron', async (req, res) => {
  try {
    global.RUNNING_MANUALLY = true; // pakai flag untuk lewati schedule check
    await runMonitoringCron();
    res.status(200).json({ message: 'Cronjob berhasil dijalankan manual.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menjalankan cronjob manual.' });
  }
});

export default router;
