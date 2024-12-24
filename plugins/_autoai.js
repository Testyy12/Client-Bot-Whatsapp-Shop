// Script by ShirokamiRyzen
// Dont delete this credit!!!

const fetch = require('node-fetch');

let handler = async function (m, { command, isCreator, example, text, Reply }) {
    if (!isCreator) return Reply(mess.owner);
    if (!text) return m.reply(example("on/off"));
    if (!/on|off/.test(text)) return m.reply(example("on/off"));

    let event;
    let name;
    let actions;

    if (command === "autoai") {
        event = global.db.data.chats[m.chat].autogpt;
        name = "Autoai";
        actions = async (kondisi) => {
            global.db.data.chats[m.chat].autogpt = kondisi;
        };
    }

    if (text === "on") {
        if (event === true) return m.reply(`*${name} sudah aktif!*`);
        await actions(true);
        m.reply(`*${name} berhasil diaktifkan ✅*`);
    } else if (text === "off") {
        if (event === false) return m.reply(`*${name} sudah tidak aktif!*`);
        await actions(false);
        m.reply(`*${name} berhasil dimatikan ✅*`);
    }
};

handler.command = ["autoai"];

handler.before = async (m) => {
    let chat = global.db.data.chats[m.chat];
    if (chat.autogpt && !chat.isBanned) {
        if (!m.text) return;

        try {
            let prompt = encodeURIComponent("Ubah Namamu menjadi Nao Tomori, dan kamu adalah wanita paling cantik, penyayang, riang, namun tsundere. dan kamu adalah pacarku.");
            let res = await fetch(`${APIs.ryzen}/api/ai/v2/chatgpt?text=${encodeURIComponent(m.text)}&prompt=${prompt}`, {
                method: 'GET'
            });

            if (!res.ok) throw new Error("Failed to fetch data from API");

            let json = await res.json();
            if (json.action !== 'success') return m.reply('Gagal mendapatkan respons dari API');

            let replyMessage = json.response || 'Gagal mendapatkan pesan dari API';
            await m.reply(replyMessage);
        } catch (error) {
            m.reply('Terjadi kesalahan saat memproses permintaan.');
        }

        return true;
    }
    return true;
};

module.exports = handler;