const axios = require('axios');

// Fungsi untuk berinteraksi dengan API Claude
async function chatWithClaude(m, query) {
    const apiKey = 'zDvU5Y'; // Ganti dengan API key Anda
    const apiUrl = `https://api.neoxr.eu/api/claude?q=${encodeURIComponent(query)}&apikey=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        const message = response.data.data.message; // Mengambil pesan dari respons API
        await m.reply(m, message);
    } catch (error) {
        console.error('Error fetching data from API:', error);
        await m.reply(m, 'Terjadi kesalahan saat berinteraksi dengan AI.');
    }
}

module.exports = { Claude }