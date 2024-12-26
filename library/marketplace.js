const fs = require('fs');
const axios = require('axios');

// Load database
const databasePath = './library/database/market.json';
let database = JSON.parse(fs.readFileSync(databasePath));

// Fungsi untuk menulis kembali database ke file
const saveDatabase = () => {
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
};

// Fungsi untuk menampilkan daftar produk
const listProduk = async (m) => {
    const produk = database.products;
    const text = produk.map((p) => `ID: ${p.id}\nNama: ${p.name}\nStok: ${p.stock}\nHarga: Rp ${p.price}\nDeskripsi: ${p.description}`).join('\n\n');
    m.reply(text || 'Tidak ada produk tersedia.');
};

// Fungsi untuk membeli produk
const beliProduk = async (m, idProduk, jumlah) => {
    const produk = database.products.find((p) => p.id === idProduk);
    if (!produk) return m.reply('Produk tidak ditemukan.');
    if (jumlah > produk.stock) return m.reply('Stok tidak cukup.');

    const totalHarga = produk.price * jumlah;
    const response = await axios.get(`https://apiv2.abidev.tech/api/orkut/createpayment?amount=${totalHarga}&codeqr=YOUR_QRIS_CODE`);
    const paymentLink = response.data.payment_link;

    m.reply(`Total harga: Rp ${totalHarga}\nSilakan lakukan pembayaran melalui link berikut: ${paymentLink}`);

    // Cek status pembayaran
    const interval = setInterval(async () => {
        const statusResponse = await axios.get(`https://apiv2.abidev.tech/api/orkut/cekstatus?merchant=YOUR_MERCHANT_ID&keyorkut=YOUR_API_KEY&amount=${totalHarga}`);
        if (statusResponse.data.status === 'success') {
            clearInterval(interval);
            produk.stock -= jumlah;
            saveDatabase();
            m.reply(`Pembelian berhasil! Produk ${produk.name} telah dikirim.`);
        } else if (statusResponse.data.status === 'pending') {
            m.reply('Pembayaran masih pending.');
        } else {
            clearInterval(interval);
            m.reply('Pembayaran gagal.');
        }
    }, 5000);
};

// Fungsi untuk mengupdate stok produk
const updateStok = async (m, action, idProduk, jumlah) => {
    const produk = database.products.find((p) => p.id === idProduk);
    if (!produk) return m.reply('Produk tidak ditemukan.');

    if (action === 'tambah') {
        produk.stock += jumlah;
        m.reply(`Stok produk ${produk.name} berhasil ditambah. Stok sekarang: ${produk.stock}`);
    } else if (action === 'kurang') {
        if (jumlah > produk.stock) return m.reply('Stok tidak cukup untuk dikurangi.');
        produk.stock -= jumlah;
        m.reply(`Stok produk ${produk.name} berhasil dikurangi. Stok sekarang: ${produk.stock}`);
    } else {
        return m.reply('Perintah tidak dikenali. Gunakan "tambah" atau "kurang".');
    }

    saveDatabase();
};

// Fungsi untuk menambah produk
const tambahProduk = async (m, name, price, stock, description) => {
    const newId = `Prod${String(database.products.length + 1).padStart(3, '0')}`;
    const newProduct = {
        id: newId,
        name,
        stock,
        price,
        description
    };
    database.products.push(newProduct);
    saveDatabase();
    m.reply(`Produk ${name} berhasil ditambahkan dengan ID ${newId}`);
};

// Fungsi untuk menghapus produk
const hapusProduk = async (m, idProduk) => {
    const index = database.products.findIndex((p) => p.id === idProduk);
    if (index === -1) return m.reply('Produk tidak ditemukan.');
    database.products.splice(index, 1);
    saveDatabase();
    m.reply(`Produk dengan ID ${idProduk} berhasil dihapus.`);
};

// Fungsi untuk memberi diskon
const setDiskon = async (m, idProduk, discount, startDate, endDate) => {
    const produk = database.products.find((p) => p.id === idProduk);
    if (!produk) return m.reply('Produk tidak ditemukan.');

    database.discounts.push({
        id: idProduk,
        discount,
        startDate,
        endDate
    });
    saveDatabase();
    m.reply(`Diskon ${discount}% berhasil ditambahkan untuk produk ${produk.name}.`);
};

// Fungsi untuk meng atur harga produk
const setHarga = async (m, idProduk, newPrice) => {
    const produk = database.products.find((p) => p.id === idProduk);
    if (!produk) return m.reply('Produk tidak ditemukan.');

    produk.price = newPrice;
    saveDatabase();
    m.reply(`Harga produk ${produk.name} berhasil diperbarui menjadi Rp ${newPrice}.`);
};

// Ekspor fungsi untuk digunakan dalam bot
module.exports = {
    listProduk,
    beliProduk,
    updateStok,
    tambahProduk,
    hapusProduk,
    setDiskon,
    setHarga
};