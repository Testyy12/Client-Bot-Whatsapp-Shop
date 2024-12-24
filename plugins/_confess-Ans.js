const before = async function (m) {
    // Cek apakah pesan berasal dari grup
    if (m.isGroup) return m.reply("Fitur ini tidak dapat digunakan di grup. Silakan gunakan di chat pribadi.");

    if (!m.chat.endsWith('@s.whatsapp.net')) return !0;
    this.menfess = this.menfess ? this.menfess : {};
    
    let mf = Object.values(this.menfess).find(v => v.status === false && v.penerima == m.sender);
    if (!mf) return !0;
    
    console.log(m);
    if (m.text === 'Balas' && m.quoted.mtype == 'buttonsMessage') return m.reply("Silahkan kirim pesan balasan kamu.");
    
    let txt = `Hai kak @${mf.dari.split('@')[0]}, kamu menerima balasan nih.\n\nPesan balasannya:\n${m.text}\n`.trim();
    await this.reply(mf.dari, txt, null).then(() => {
        m.reply('Balasan Memfess terkirim.');
        this.delay(1000);
        delete this.menfess[mf.id];
        return !0;
    });
}

module.exports = { before };