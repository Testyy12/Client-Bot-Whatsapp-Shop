async function createStickerFromText(m, text) {
    try {
        const response = await axios.get(`https://fastrestapis.fasturl.link/tool/furbrat?text=${encodeURIComponent(text)}&style=1&mode=center`);
        
        // Pastikan API mengembalikan URL gambar stiker
        const stickerUrl = response.data; // Sesuaikan dengan struktur respons API

        // Mengirimkan stiker ke pengguna
        await Sky.sendMessage(m.chat, { sticker: { url: stickerUrl } });
    } catch (error) {
        console.error('Error fetching data from API:', error);
        await m.reply(m, 'Terjadi kesalahan saat membuat stiker.');
    }
}

module.exports = { furbrat }