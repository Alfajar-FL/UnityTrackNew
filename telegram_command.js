import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const commandBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_2, { polling: true });

commandBot.setMyCommands([
  { command: 'id', description: 'Menampilkan ID chat atau grup ini' },
  { command: 'status', description: 'Menampilkan status bot' },
  { command: 'help', description: 'Menampilkan daftar perintah' },
  { command: 'commands', description: 'Menampilkan daftar perintah yang tersedia' }
]);

commandBot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  commandBot.sendMessage(chatId, `ID ${isGroup ? 'grup' : 'chat'} ini adalah: ${chatId}`);
});

commandBot.onText(/\/status/, (msg) => {
  commandBot.sendMessage(msg.chat.id, 'Bot sedang aktif dan berjalan!');
});

commandBot.onText(/\/help|\/commands/, (msg) => {
  const helpText = `
Perintah yang tersedia:
/id - Menampilkan ID chat atau grup ini
/status - Menampilkan status bot
/help - Menampilkan bantuan
/commands - Menampilkan daftar perintah yang tersedia
`;
  commandBot.sendMessage(msg.chat.id, helpText);
});

export default commandBot;
