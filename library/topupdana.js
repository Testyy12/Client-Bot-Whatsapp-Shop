const axios = require('axios');

/**
 * Fungsi untuk melakukan top-up Dana
 * @param {string} number - Nomor Dana yang akan di-top-up
 * @param {number} amount - Jumlah uang yang akan di-top-up
 * @param {string} apiKey - API key untuk autentikasi
 * @returns {Promise<string>} - Mengembalikan pesan status dari proses top-up
 */
async function topUpDana(number, amount, apiKey) {
    try {
        const response = await axios.get(`https://api.neoxr.eu/api/topup-dana`, {
            params: {
                number: number,
                amount: amount,
                apikey: apiKey
            }
        });

        // Memeriksa status dari response
        if (response.data.status) {
            const data = response.data.data;
            return `
Top-up berhasil!
ID Transaksi: ${data.id}
Kode Transaksi: ${data.code}
Nomor Dana: ${data.number}
Layanan: ${data.product.service}
Jumlah: ${data.price_format}
Kedaluwarsa: ${data.expired_at}
Gambar QR: ${data.qr_image}
            `;
        } else {
            return `Top-up gagal: ${response.data.message}`;
        }
    } catch (error) {
        return `Terjadi kesalahan: ${error.message}`;
    }
}

// Ekspor fungsi agar dapat digunakan di file lain
module.exports = { topUpDana };