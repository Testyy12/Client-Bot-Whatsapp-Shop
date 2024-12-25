const axios = require('axios');
const cheerio = require('cheerio');

// PlayStoreScraper class definition
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

// Command handler function
async function handler(command, args) {
  if (command === 'search') {
    const query = args.join(' ');
    const results = await PlayStoreScraper.search(query);
    
    // Format the results for output
    if (results.error) {
      return results.error;
    }

    return results.map(app => {
      return `Name: ${app.nama}\nDeveloper: ${app.developer}\nRating: ${app.rate}\nLink: ${app.link}\nImage: ${app.img}\n\n`;
    }).join('');
  } else {
    return 'Unknown command. Please use "search <query>" to search for apps.';
  }
}

// Export the command handler
module.exports = {
  handler,
};