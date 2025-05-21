<template>
  <div class="container mt-4">
    <div class="card custom-card text-white">
      <div class="card-header bg-dark border-secondary">Telegram Info</div>
      <div class="card-body">
        <!-- Info dan Petunjuk -->
        <div class="card bg-custom-dark text-light mb-3 shadow-sm">
          <div class="card-header border-secondary">Hint</div>
          <div class="card-body">
            <p>
              Jika Anda mengganti grup Telegram, pastikan untuk menambahkan
              <b>@WebUnitTrackingBot</b> sebagai anggota grup.
              Sistem memerlukan akses agar dapat mengirim notifikasi.
            </p>
            <p>
              Untuk mendapatkan Chat ID grup:
              Gunakan bot <b>@WebUnitTrackingBot</b> dan ketik <code>/id</code> di dalam grup (setelah bot dimasukkan).
            </p>
          </div>
        </div>

        <!-- Form untuk Chat ID -->
        <div class="card bg-custom-dark text-light shadow-sm">
          <div class="card-header border-secondary">Set Chat ID Telegram</div>
          <div class="card-body">
            <p>Chat ID yang digunakan saat ini:</p>
            <code class="text-warning">{{ currentChatId || '(Belum diset)' }}</code>

            <div class="mt-3">
              <input
                v-model="chatIdInput"
                type="text"
                class="form-control bg-dark text-white border-secondary"
                placeholder="Masukkan Chat ID Telegram baru"
              />
              <div class="mt-3">
                <button class="btn btn-outline-light me-2" @click="saveChatId">💾 Simpan</button>
                <button class="btn btn-outline-info" @click="testTelegram">📤 Test Kirim Pesan</button>
              </div>
              <div v-if="message" class="mt-3 alert alert-info p-2">
                {{ message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TelegramInfo',
  data() {
    return {
      chatIdInput: '',
      currentChatId: '',
      message: ''
    };
  },
  mounted() {
    this.loadChatId();
  },
  methods: {
    async loadChatId() {
      try {
        const res = await axios.get('http://localhost:5001/api/settings/telegram_chat_id');
        this.currentChatId = res.data.value;
        this.chatIdInput = res.data.value;
      } catch (err) {
        console.error('❌ Gagal ambil chat ID:', err);
        this.message = 'Gagal mengambil Chat ID.';
      }
    },
    async saveChatId() {
      try {
        await axios.post('http://localhost:5001/api/settings', {
          name: 'telegram_chat_id',
          value: this.chatIdInput
        });
        this.message = '✅ Chat ID berhasil disimpan.';
        this.currentChatId = this.chatIdInput;
      } catch (err) {
        console.error('❌ Gagal menyimpan Chat ID:', err);
        this.message = '❌ Gagal menyimpan Chat ID.';
      }
    },
    async testTelegram() {
      try {
        await axios.get('http://localhost:5001/api/settings/test-telegram');
        this.message = '✅ Test pesan Telegram berhasil dikirim.';
      } catch (err) {
        console.error('❌ Gagal kirim pesan test:', err);
        this.message = '❌ Gagal kirim pesan test ke Telegram.';
      }
    }
  }
};
</script>

<style scoped>
.card-header {
  font-weight: bold;
}

.bg-custom-dark {
  background-color: rgba(33, 37, 41, 0.85); /* dark glassy */
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.custom-card {
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
}
</style>
