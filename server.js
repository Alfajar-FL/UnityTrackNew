// === Load Environment Variables ===
import dotenv from 'dotenv';
dotenv.config();

// === Import Dependencies ===
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import TelegramBot from 'node-telegram-bot-api';

// === Local Modules ===
import { pool } from './db.js';
import { runMonitoringCron, executeMonitoring } from './cron.js';
import {bot} from './telegram.js';
import { sendMonitoringStatus, commandBot} from './telegram.js';

// === Import Routes ===
import usersRouter from './src/routes/users.js';
import monitoringSitesRouter from './src/routes/monitoring_sites.js';
import monitoringLogsRouter from './src/routes/monitoring_logs.js';
import monitoringDetailRoutes from './src/routes/monitoring_detail.js';
import settingsRouter from './src/routes/settings.js';

// === Inisialisasi Express ===
const app = express();

// === Middleware ===
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// === Gunakan Routes ===
app.use('/api/users', usersRouter);
app.use('/api/monitoring_sites', monitoringSitesRouter);
app.use('/api/monitoring_logs', monitoringLogsRouter);
app.use('/api/monitoring_detail', monitoringDetailRoutes);
app.use('/api/settings', settingsRouter);

// === Endpoint Root ===
app.get('/', (req, res) => {
  res.json({ message: '✅ Server running and connected to database.' });
});

// === Helper: Kirim Pesan Telegram Terpecah (Max 4000 Karakter) ===
const sendTelegramNotification = (message) => {
  console.log('📨 Mengirim ke Telegram:', message.length, 'karakter');

  if (!chatId || !message) {
    console.warn('⚠️ Chat ID atau pesan kosong!');
    return;
  }

  const maxLength = 4000;
  const chunks = [];

  for (let i = 0; i < message.length; i += maxLength) {
    chunks.push(message.substring(i, i + maxLength));
  }

  for (const chunk of chunks) {
    bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' })
      .then(() => console.log('✅ Chunk terkirim ke Telegram'))
      .catch(err => console.error('❌ Gagal kirim chunk Telegram:', err.message));
  }
};

// === Endpoint Manual Trigger Cron Job ===
app.post('/api/monitoring_sites/trigger-cron', async (req, res) => {
  try {
    await executeMonitoring(true); // ⬅️ true artinya paksa semua diambil
    res.json({ message: '✅ Monitoring cron job berhasil dijalankan secara manual.' });
  } catch (err) {
    console.error('❌ Gagal menjalankan cron job secara manual:', err);
    res.status(500).json({ message: '❌ Gagal menjalankan cron job.', error: err.message });
  }
});


// === Endpoint Login ===
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Username tidak ditemukan" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah" });
    }

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// === Telegram Bot Commands ===
bot.setMyCommands([
  { command: 'id', description: 'Menampilkan ID chat atau grup ini' },
  { command: 'status', description: 'Menampilkan status bot' },
  { command: 'help', description: 'Menampilkan daftar perintah' },
  { command: 'commands', description: 'Menampilkan daftar perintah yang tersedia' }
]);

bot.onText(/\/id/, (msg) => {
  bot.sendMessage(msg.chat.id, `ID chat ini adalah: ${msg.chat.id}`);
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Bot sedang aktif dan berjalan!');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Perintah yang tersedia:\n' +
    '/id - Menampilkan ID chat atau grup ini\n' +
    '/status - Menampilkan status bot\n' +
    '/help - Menampilkan bantuan\n' +
    '/commands - Menampilkan daftar perintah yang tersedia'
  );
});

bot.onText(/\/commands/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Perintah yang tersedia:\n' +
    '/id - Menampilkan ID chat atau grup ini\n' +
    '/status - Menampilkan status bot\n' +
    '/help - Menampilkan bantuan\n' +
    '/commands - Menampilkan daftar perintah yang tersedia'
  );
});

// === Cek Koneksi Database Saat Startup ===
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL database!");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// === Jalankan Server ===
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});