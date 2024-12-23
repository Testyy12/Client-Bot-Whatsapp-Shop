const { MessageType } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');

/**
 * Fungsi untuk mengonversi gambar menjadi stiker dan mengirimkannya
 * @param {Object} chat - Objek chat untuk mengirim stiker
 * @param {Buffer} imageBuffer - Buffer gambar yang akan dikonversi menjadi stiker
 * @param {Object} message - Objek pesan yang digunakan untuk referensi
 * @param {Object} options - Opsi tambahan untuk pengiriman stiker
 */
async function imgToSticker(chat, imageBuffer, message, options = {}) {
    try {
        // Mengonversi gambar menjadi stiker
        const stickerBuffer = await createSticker(imageBuffer);

        // Mengirim stiker ke chat
        await Sky.sendMessage(chat, {
            sticker: stickerBuffer,
            ...options
        }, { quoted: message });
    } catch (error) {
        console.error('Error while sending sticker:', error);
        throw new Error('Gagal mengirim stiker');
    }
}

/**
 * Fungsi untuk mengonversi gambar menjadi stiker
 * @param {Buffer} imageBuffer - Buffer gambar yang akan dikonversi
 * @returns {Promise<Buffer>} - Buffer stiker yang dihasilkan
 */
async function createSticker(imageBuffer) {
    // Membaca gambar menggunakan Jimp
    const image = await Jimp.read(imageBuffer);

    // Mengubah ukuran gambar jika perlu
    image.resize(512, 512); // Ukuran stiker standar

    // Mengonversi gambar menjadi stiker
    const stickerBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return stickerBuffer;
}

// Ekspor fungsi agar dapat digunakan di file lain
module.exports = { imgToSticker };