const axios = require("axios");
const cheerio = require("cheerio");

let handler = async (m, { Sky, text }) => {
  if (!text) throw "Mau Cari Apk Apa?";
  m.reply("Tunggu sebentar...");
  let hasil = await PlayStoreScraper.search(text);
  if (hasil.error) throw hasil.error;

  let anu = hasil.map((v) => 
    `*Nama:* ${v.nama}\n*Developer:* ${v.developer}\n*Rate:* ${v.rate}\n*Rate 2:* ${v.rate2}\n*Link:* ${v.link}\nLinkDev: ${v.link_dev}`
  ).join("\n\n°°°°°°°°°°°°°°°°°°°°°°°°°°°°°\n\n");

  m.reply(anu);
};


handler.command = ["playstore"];

export default handler;

class PlayStoreScraper {
  static async search(query) {
    try {
      const { data } = await axios.get(`https://play.google.com/store/search?q=${query}&c=apps`);
      const results = [];
      const $ = cheerio.load(data);

      $(".ULeU3b > .VfPpkd-WsjYwc").each((_, element) => {
        const linkk = $(element).find("a").attr("href");
        const nama = $(element).find(".DdYX5").text();
        const developer = $(element).find(".wMUdtb").text();
        const img = $(element).find("img").attr("src");
        const rate = $(element).find(".ubGTjb > div").attr("aria-label");
        const rate2 = $(element).find(".w2kbF").text();
        const link = `https://play.google.com${linkk}`;

        results.push({
          link: link,
          nama: nama || "No Name",
          developer: developer || "No Developer",
          img: img || "https://i.ibb.co/G7CrCwN/404.png",
          rate: rate || "No Rate",
          rate2: rate2 || "No Rate",
          link_dev: `https://play.google.com/store/apps/developer?id=${developer.split(" ").join("+")}`,
        });
      });

      if (!results.length) {
        return { error: "Tidak ditemukan hasil pencarian." };
      }

      return results;
    } catch (error) {
      console.error(error);
      return { error: "Gagal mengambil data dari Play Store." };
    }
  }
}
