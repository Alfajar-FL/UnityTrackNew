import express from 'express';
import { pool } from '../../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// ✅ Ambil semua user
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error('🔥 Gagal ambil data user:', err);
    res.status(500).json({ message: 'Gagal ambil data user' });
  }
});

// ✅ Buat user baru dengan role dinamis
router.post('/', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    // Cek apakah username sudah digunakan
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah terdaftar.' });
    }

    // Hash password dan simpan user
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date();

    await pool.execute(
      `INSERT INTO users (username, password, role, created_at)
       VALUES (?, ?, ?, ?)`,
      [username, hashedPassword, role.trim(), createdAt]
    );

    res.status(201).json({ message: 'User berhasil dibuat.' });
  } catch (err) {
    console.error('🔥 Error saat membuat user:', err);
    res.status(500).json({ error: 'Gagal membuat user', detail: err.message });
  }
});

// ✅ Update user berdasarkan ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    // Validasi input
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username tidak boleh kosong.' });
    }

    // Mulai query update
    let query = 'UPDATE users SET username = ?';
    const params = [username.trim()];

    // Tambahkan password jika diisi
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    // Tambahkan role jika diisi
    if (role && role.trim()) {
      query += ', role = ?';
      params.push(role.trim());
    }

    // Akhiri query
    query += ' WHERE id = ?';
    params.push(id);

    // Eksekusi update
    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json({ message: 'User berhasil diupdate.' });
  } catch (err) {
    console.error('🔥 Gagal update user:', err);
    res.status(500).json({ message: 'Gagal update user', detail: err.message });
  }
});

// ✅ Hapus user berdasarkan ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('🔥 Gagal hapus user:', err);
    res.status(500).json({ message: 'Gagal hapus user', detail: err.message });
  }
});

export default router;
