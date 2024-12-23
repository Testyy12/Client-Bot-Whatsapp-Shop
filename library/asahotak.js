const axios = require('axios');

// Variabel untuk menyimpan soal dan indeks saat ini
let soalList = [];
let currentSoalIndex = 0;

// Fungsi untuk mendapatkan soal dari API
async function getSoal() {
    try {
        const response = await axios.get('https://api.betabotz.eu.org/api/game/asahotak?apikey=Btz-r7R2Z');
        return response.data;
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return [];
    }
}

// Fungsi untuk memulai permainan
async function startGame(m) {
    soalList = await getSoal();
    currentSoalIndex = 0;

    if (soalList.length > 0) {
        const firstSoal = soalList[currentSoalIndex].soal;
        await m.reply(m, `Soal Pertama: ${firstSoal}`);
    } else {
        await m.reply(m, 'Tidak ada soal yang tersedia.');
    }
}

// Fungsi untuk memeriksa jawaban
async function checkAnswer(m, answer) {
    if (currentSoalIndex < soalList.length) {
        const currentSoal = soalList[currentSoalIndex];

        // Memeriksa apakah pesan adalah balasan
        if (m.quoted && m.quoted.text === currentSoal.soal) {
            if (answer.toLowerCase() === currentSoal.jawaban.toLowerCase()) {
                await m.reply(m, 'Jawaban benar!');

                // Pindah ke soal berikutnya
                currentSoalIndex++;
                if (currentSoalIndex < soalList.length) {
                    const nextSoal = soalList[currentSoalIndex].soal;
                    await m.reply(m, `Soal Berikutnya: ${nextSoal}`);
                } else {
                    await m.reply(m, 'Permainan selesai! Terima kasih telah bermain.');
                }
            } else {
                await m.reply(m, 'Jawaban salah, coba lagi!');

                // Kirimkan soal yang sama untuk dijawab kembali
                const repeatSoal = currentSoal.soal;
                await m.reply(m, `Soal: ${repeatSoal}`);
            }
        } else {
            await m.reply(m, 'Silakan balas soal yang diberikan untuk menjawab.');
        }
    } else {
        await m.reply(m, 'Permainan sudah selesai. Ketik .start untuk memulai lagi.');
    }
}

// Ekspor fungsi-fungsi
module.exports = {
    startGame,
    checkAnswer
};