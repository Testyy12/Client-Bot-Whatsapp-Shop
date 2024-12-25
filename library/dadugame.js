const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DaduGame {
  constructor() {
    this.DATABASE_PATH = './database_permainan_dadu.json';
    this.database = this.loadDatabase();
    this.MERCHANT_ID = 'YOUR_MERCHANT_ID';
    this.API_KEY = 'YOUR_API_KEY';
    this.QRIS_CODE = 'YOUR_QRIS_CODE';
  }

  // Load Database
  loadDatabase() {
    try {
      if (fs.existsSync(this.DATABASE_PATH)) {
        return JSON.parse(fs.readFileSync(this.DATABASE_PATH, 'utf8'));
      }
      return {
        users: {},
        deposits: {},
        games: {},
        withdraws: []
      };
    } catch (error) {
      return {
        users: {},
        deposits: {},
        games: {},
        withdraws: []
      };
    }
  }

  // Simpan Database
  saveDatabase() {
    fs.writeFileSync(this.DATABASE_PATH, JSON.stringify(this.database, null, 2));
  }

  // Registrasi User
  async registrasiUser(userId, userData) {
    if (!userData.name || !userData.phoneNumber) {
      throw new Error('Nama dan nomor HP wajib diisi');
    }

    this.database.users[userId] = {
      ...userData,
      saldo: 0,
      userId: userId,
      createdAt: new Date().toISOString()
    };

    this.saveDatabase();
    return this.database.users[userId];
  }

  // Deposit Terintegrasi
  async prosesDeposit(userId, amount) {
    try {
      // Generate deposit unique ID
      const depositId = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      // Buat link pembayaran
      const response = await axios.get(`https://apiv2.abidev.tech/api/orkut/createpayment`, {
        params: {
          amount: amount,
          codeqr: this.QRIS_CODE
        }
      });

      // Simpan detail deposit
      this.database.deposits[depositId] = {
        userId: userId,
        amount: amount,
        status: 'pending',
        paymentLink: response.data.payment_link,
        createdAt: new Date().toISOString(),
        expiredAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 menit
      };

      this.saveDatabase();

      return {
        depositId: depositId,
        paymentLink: response.data.payment_link,
        expiredAt: this.database.deposits[depositId].expiredAt
      };
    } catch (error) {
      throw new Error('Gagal membuat link pembayaran');
    }
  }

  // Cek Status Deposit Otomatis
  async cekStatusDepositOtomatis() {
    const now = new Date();

    for (let [depositId, deposit] of Object.entries(this.database.deposits)) {
      // Lewati deposit yang sudah selesai atau expired
      if (deposit.status !== 'pending') continue;

      const expiredAt = new Date(deposit.expiredAt);
      
      // Batalkan jika sudah expired
      if (now > expiredAt) {
        deposit.status = 'expired';
        continue;
      }

      try {
        // Cek status pembayaran
        const response = await axios.get(`https://apiv2.abidev.tech/api/orkut/cekstatus`, {
          params: {
            merchant: this.MERCHANT_ID,
            keyorkut: this.API_KEY,
            amount: deposit.amount
          }
        });

        if (response.data.status === 'success') {
          // Update saldo user
          const user = this.database.users[deposit.userId];
          user.saldo += deposit.amount;
          
          // Update status deposit
          deposit.status = 'success';

          // Kirim notifikasi
          return {
            userId: deposit.userId,
            amount: deposit.amount,
            status: 'success'
          };
        }
      } catch (error) {
        console.error('Gagal cek status deposit', error);
      }
    }

    this.saveDatabase();
    return null;
  }
// Buat Arena Game
async buatArenaGame(userId, taruhan) {
    // Validasi saldo
    const user = this.database.users[userId];
    if (user.saldo < taruhan) {
      throw new Error('Saldo tidak mencukupi untuk membuat arena');
    }

    // Kurangi saldo
    user.saldo -= taruhan;

    // Buat arena game
    const arenaId = `ARENA_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const arena = {
      id: arenaId,
      creator: userId,
      taruhan: taruhan,
      pemain: [{ 
        userId: userId, 
        prediksi: null,
        joined: true 
      }],
      status: 'menunggu',
      createdAt: new Date().toISOString()
    };

    this.database.games[arenaId] = arena;
    this.saveDatabase();

    return arena;
  }

  // Bergabung Arena Game
  async bergabungArena(userId, arenaId, prediksi) {
    const arena = this.database.games[arenaId];
    const user = this.database.users[userId];

    // Validasi arena
    if (!arena || arena.status !== 'menunggu') {
      throw new Error('Arena tidak valid atau sudah dimulai');
    }

    // Validasi saldo
    if (user.saldo < arena.taruhan) {
      throw new Error('Saldo tidak mencukupi untuk bergabung');
    }

    // Cek apakah sudah bergabung
    if (arena.pemain.some(p => p.userId === userId)) {
      throw new Error('Anda sudah bergabung di arena ini');
    }

    // Kurangi saldo
    user.saldo -= arena.taruhan;

    // Tambahkan pemain
    arena.pemain.push({ 
      userId: userId, 
      prediksi: prediksi,
      joined: true 
    });

    // Cek apakah arena penuh
    if (arena.pemain.length === 4) {
      return await this.mulaiGame(arenaId);
    }

    this.saveDatabase();
    return arena;
  }

  // Mulai Game dengan Roll Dadu
  async mulaiGame(arenaId) {
    const arena = this.database.games[arenaId];

    // Validasi arena
    if (!arena || arena.status !== 'menunggu' || arena.pemain.length !== 4) {
      throw new Error('Arena tidak siap dimulai');
    }

    try {
      // Roll Dadu dari API
      const dadoResponse = await axios.get('https://api.caliph.biz.id/api/dadu', {
        params: { apikey: 'YOUR_API_KEY' }
      });

      const hasilDadu = dadoResponse.data.result;

      // Tentukan pemenang
      const pemenang = arena.pemain.filter(p => p.prediksi === hasilDadu);

      // Hitung total taruhan
      const totalTaruhan = arena.taruhan * arena.pemain.length;
      
      // Hitung hadiah (dikurangi fee admin 10%)
      const hadiah = totalTaruhan * 2 * 0.9;
      const hadiahPerPemenang = pemenang.length > 0 
        ? hadiah / pemenang.length 
        : 0;

      // Update saldo pemenang
      pemenang.forEach(p => {
        const user = this.database.users[p.userId];
        user.saldo += hadiahPerPemenang;
      });

      // Update status arena
      arena.status = 'selesai';
      arena.hasilDadu = hasilDadu;
      arena.pemenang = pemenang.map(p => p.userId);

      this.saveDatabase();

      return {
        arenaId: arenaId,
        hasilDadu: hasilDadu,
        pemenang: arena.pemenang,
        hadiah: hadiahPerPemenang
      };

    } catch (error) {
      throw new Error('Gagal memulai game: ' + error.message);
    }
  }

  // Pencairan Saldo
  async prosePencairan(userId, nominal, dataEwallet) {
    const user = this.database.users[userId];

    // Validasi saldo
    if (user.saldo < nominal) {
      throw new Error('Saldo tidak mencukupi');
    }

    // Kurangi saldo
    user.saldo -= nominal;

    // Buat pengajuan pencairan
    const pencairan = {
      id: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: userId,
      nominal: nominal,
      status: 'pending',
      ...dataEwallet,
      createdAt: new Date().toISOString()
    };

    this.database.withdraws.push(pencairan);
    this.saveDatabase();

    return pencairan;
  }
}

// Handler WhatsApp
const handleWhatsAppCommand = async (sender, command, args) => {
  const daduGame = new DaduGame();

  try {
    switch(command.toLowerCase()) {
      case 'daftar': {
        const [nama, noHP] = args.split('|');
        const user = await daduGame.registrasiUser(sender, { 
          name: nama, 
          phoneNumber: noHP 
        });

        return `✅ Registrasi Berhasil!\n` +
               `Nama: ${nama}\n` +
               `Saldo Awal: Rp. 0`;
      }

      case 'deposit': {
        const amount = parseInt(args);
        const deposit = await daduGame.prosesDeposit(sender, amount);

        return `🔗 Link Pembayaran: ${deposit.paymentLink}\n` +
               `Nominal: Rp. ${amount}\n` +
               `Expired: 10 menit\n` +
               `Silakan scan QR Code`;
      }


      case 'buatgame': {
        const taruhan = parseInt(args);
        const arena = await daduGame.buatArenaGame(sender, taruhan);
        
        return `🎲 Arena Game Dibuat\n` +
               `Arena ID: ${arena.id}\n` +
               `Taruhan: Rp. ${taruhan}\n` +
               `Status: Menunggu Pemain`;
      }

      case 'bergabung': {
        const [arenaId, prediksi] = args.split('|');
        const result = await daduGame.bergabungArena(sender, arenaId, parseInt(prediksi));
        
        if (result.hasilDadu) {
          // Game sudah dimulai
          return `🎲 Game Selesai!\n` +
                 `Hasil Dadu: ${result.hasilDadu}\n` +
                 `Pemenang: ${result.pemenang.length} pemain\n` +
                 `Hadiah per Pemenang: Rp. ${result.hadiah}`;
        }

        return `🤝 Bergabung Arena Berhasil\n` +
               `Arena ID: ${result.id}\n` +
               `Prediksi: ${prediksi}\n` +
               `Pemain: ${result.pemain.length}/4`;
      }

      case 'tarik': {
        const [nominal, ewallet, rekening, nama] = args.split('|');
        const pencairan = await daduGame.prosePencairan(sender, parseInt(nominal), {
          ewallet: ewallet,
          rekening: rekening,
          nama: nama
        });

        return `💸 Pencairan Diproses\n` +
               `Nominal: Rp. ${nominal}\n` +
               `E-Wallet: ${ewallet}\n` +
               `Status: Menunggu Konfirmasi`;
      }
      // Tambahkan case lainnya sesuai kebutuhan
    }
  } catch (error) {
    return `❌ Terjadi Kesalahan: ${error.message}`;
  }
};

// Proses Cek Deposit Berkala
setInterval(async () => {
  const result = await daduGame.cekStatusDepositOtomatis();
  if (result) {
    // Kirim notifikasi ke user
    messagePlatform.sendMessage(result.userId, 
      `✅ Deposit Berhasil\n` +
      `Saldo Ditambahkan: Rp. ${result.amount}`
    );
  }
}, 60000); // Cek setiap 1 menit

module.exports = {
  handleWhatsAppCommand,
  DaduGame
};