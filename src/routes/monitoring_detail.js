import express from 'express';
import { pool } from '../../db.js'; 

const router = express.Router();

// Endpoint: GET /api/monitoring_sites/:id/detail
router.get('/:id/detail', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Ambil detail website
    const [siteResult] = await pool.query(
      'SELECT id, url, schedule, created_at FROM monitoring_sites WHERE id = ?', 
      [id]
    );

    if (siteResult.length === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const site = siteResult[0];

    // 2. Ambil 20 log monitoring terbaru
    const [logs] = await pool.query(
      `SELECT id, site_id, status_code, response_time, status, checked_at 
       FROM monitoring_logs 
       WHERE site_id = ? 
       ORDER BY checked_at DESC 
       LIMIT 20`,
      [id]
    );

    // 3. Hitung Uptime
    const [[uptimeRow]] = await pool.query(
      `SELECT 
         SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS upCount, 
         COUNT(*) AS totalCount
       FROM monitoring_logs
       WHERE site_id = ?`,
      [id]
    );

    const uptime = uptimeRow.totalCount > 0 
      ? ((uptimeRow.upCount / uptimeRow.totalCount) * 100).toFixed(2)
      : 0;

    // 4. Response final
    res.json({
      site,
      activityLogs: logs,
      uptime
    });

  } catch (error) {
    console.error('Error in GET /api/monitoring_sites/:id/detail:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
