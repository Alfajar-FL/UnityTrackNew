import TelegramBot from 'node-telegram-bot-api';

// Telegram Bot 1 (Monitoring Bot) - Dengan polling
export const bot1 = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_1, { polling: true });

// Fungsi untuk mengirim pesan melalui bot1 (Monitoring Bot)
export const sendMessageBot1 = (chatId, message) => {
  bot1.sendMessage(chatId, message)
    .then(() => {
      console.log(`Bot1 berhasil mengirim pesan ke ${chatId}: ${message}`);
    })
    .catch((err) => {
      console.error(`Gagal mengirim pesan dari Bot1 ke ${chatId}: ${err.message}`);
    });
};

// Handler untuk bot1 (Monitoring Bot)
bot1.on('message', (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (msg.text === '/id') {
    sendMessageBot1(chatId, `ID ${isGroup ? 'grup' : 'chat'} ini adalah: ${chatId}`);
  }
});

// Set My Commands untuk bot1 (Monitoring Bot)
bot1.setMyCommands([
  { command: 'id', description: 'Menampilkan ID chat atau grup ini' },
  { command: 'status', description: 'Menampilkan status bot' },
]);

// Menambahkan lebih banyak logika atau handler sesuai kebutuhan
