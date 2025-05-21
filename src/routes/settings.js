// src/routes/settings.js
import express from 'express';
import { pool } from '../../db.js';                // ⬅️ perbaiki path
import { getDynamicChatId, bot, setDynamicChatId } from '../../telegram.js'; // ⬅️ perbaiki path

const router = express.Router();


router.get('/test-telegram', async (req, res) => {
    try {
      const chatId = getDynamicChatId();
      if (!chatId) {
        return res.status(400).send('❌ Chat ID belum diset.');
      }
  
      await bot.sendMessage(chatId, '🚀 Test pesan Telegram dari sistem berhasil terkirim!');
      res.send('✅ Test pesan berhasil dikirim.');
    } catch (err) {
      console.error('❌ Gagal kirim test Telegram:', err.message);
      res.status(500).send('❌ Gagal kirim test Telegram.');
    }
  });
  
// Endpoint untuk menyimpan atau update setting
router.post('/', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).json({ message: 'Name dan value wajib diisi.' });
  }

  try {
    await pool.query(`
      INSERT INTO settings (name, value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `, [name, value]);

    if (name === 'telegram_chat_id') {
      setDynamicChatId(value); // update nilai dinamis ke Telegram bot
    }

    res.json({ message: '✅ Chat ID berhasil disimpan.' });
  } catch (err) {
    console.error('❌ Gagal simpan chat ID:', err.message);
    res.status(500).json({ message: 'Gagal menyimpan Chat ID' });
  }
});

// Endpoint untuk mengambil chat ID
router.get('/telegram_chat_id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT value FROM settings WHERE name = "telegram_chat_id"');
    res.json({ value: row?.value || '' });
  } catch (err) {
    console.error('❌ Gagal ambil Chat ID:', err.message);
    res.status(500).json({ message: 'Gagal mengambil Chat ID' });
  }
});

export default router;
