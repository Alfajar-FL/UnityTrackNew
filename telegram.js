import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_1;
let dynamicChatId = process.env.TELEGRAM_CHAT_ID; // fallback dari .env

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const getDynamicChatId = () => dynamicChatId;

// Ambil chat ID terbaru dari database saat server start
(async () => {
  try {
    const [[row]] = await pool.query('SELECT value FROM settings WHERE name = "telegram_chat_id"');
    if (row && row.value) {
      dynamicChatId = row.value;
      console.log(`📥 Chat ID berhasil dimuat dari DB: ${dynamicChatId}`);
    } else {
      console.warn('⚠️ Chat ID tidak ditemukan di DB, gunakan .env sebagai fallback');
    }
  } catch (err) {
    console.error('❌ Gagal memuat chat ID dari DB:', err.message);
  }
})();

// Fungsi kirim pesan umum
const sendTelegramNotification = async (message) => {
  try {
    await bot.sendMessage(dynamicChatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error('❌ Gagal mengirim pesan Telegram:', err.message);
  }
};

// Fungsi kirim notifikasi per status monitoring
const sendMonitoringStatus = async (title, url, status, code) => {
  const emoji = status === 'up' ? '✅' : '❌';
  const message = `
${emoji} *${title}*
🌐 ${url}
📶 *Status*: ${status.toUpperCase()}
🧾 *Kode*: ${code}
`.trim();

  await sendTelegramNotification(message);
};

// Fungsi untuk set dan simpan chat ID terbaru
const setDynamicChatId = async (newChatId) => {
  dynamicChatId = newChatId;
  console.log(`🔄 Chat ID diperbarui: ${newChatId}`);

  try {
    await pool.query(`
      INSERT INTO settings (name, value)
      VALUES ('telegram_chat_id', ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `, [newChatId]);
  } catch (err) {
    console.error('❌ Gagal menyimpan chat ID ke database:', err.message);
  }
};

// Fungsi set ulang perintah bot
const commandBot = () => {
  bot.setMyCommands([
    { command: 'id', description: 'Menampilkan ID chat atau grup ini' },
    { command: 'status', description: 'Menampilkan status bot' },
    { command: 'monitoring', description: 'Menjalankan monitoring manual' }
  ]);

  console.log('✅ Perintah bot telah didaftarkan ulang.');
};

// 🔄 Lazy load executeMonitoring dari cron.js agar tidak circular import
let executeMonitoringLazy;
const loadExecuteMonitoring = async () => {
  if (!executeMonitoringLazy) {
    const module = await import('./cron.js');
    executeMonitoringLazy = module.executeMonitoring;
  }
};

// Handler semua perintah
bot.onText(/\/(id|status|monitoring)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];

  // Update chatId setiap ada interaksi
  await setDynamicChatId(chatId);

  if (command === 'id') {
    return bot.sendMessage(chatId, `ID chat ini adalah: ${chatId}`);
  }

  if (command === 'status') {
    return bot.sendMessage(chatId, '🤖 Bot aktif dan berjalan normal.');
  }

  if (command === 'monitoring') {
    await bot.sendMessage(chatId, '⏳ Menjalankan monitoring manual...');
    await loadExecuteMonitoring();              // ⬅️ Load modul secara dinamis
    await executeMonitoringLazy(true);          // ⬅️ Panggil setelah loaded
    return bot.sendMessage(chatId, '✅ Monitoring selesai.');
  }
});

// Export
export {
  sendMonitoringStatus,
  sendTelegramNotification,
  bot,
  commandBot,
  setDynamicChatId,
  getDynamicChatId
};
