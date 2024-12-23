const fs = require('fs');
const axios = require('axios');
const cron = require('node-cron');

class SholatNotification {
    constructor() {
        this.dbPath = './library/database/sholat.json';
        this.loadDatabase();
        this.isGlobalActive = true;
    }

    loadDatabase() {
        try {
            const data = fs.readFileSync(this.dbPath);
            this.db = JSON.parse(data);
        } catch (error) {
            this.db = {
                groups: [],
                settings: {
                    globalActive: true,
                    location: 'kediri'
                }
            };
            this.saveDatabase();
        }
    }

    saveDatabase() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
    }

    addGroup(groupId) {
        if (!this.db.groups.find(g => g.id === groupId)) {
            this.db.groups.push({
                id: groupId,
                active: true,
                notifications: {
                    subuh: true,
                    dzuhur: true,
                    ashar: true,
                    maghrib: true,
                    isya: true
                }
            });
            this.saveDatabase();
            return true;
        }
        return false;
    }

    removeGroup(groupId) {
        const index = this.db.groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            this.db.groups.splice(index, 1);
            this.saveDatabase();
            return true;
        }
        return false;
    }

    toggleGlobalActive() {
        this.db.settings.globalActive = !this.db.settings.globalActive;
        this.saveDatabase();
        return this.db.settings.globalActive;
    }

    toggleGroupActive(groupId) {
        const group = this.db.groups.find(g => g.id === groupId);
        if (group) {
            group.active = !group.active;
            this.saveDatabase();
            return group.active;
        }
        return null;
    }

    async getJadwalSholat() {
        try {
            const response = await axios.get(
                `https://api.lolhuman.xyz/api/sholat/${this.db.settings.location}?apikey=facd4b1df412ec0ab6f8649c`
            );
            return response.data.result;
        } catch (error) {
            console.error('Error fetching jadwal sholat:', error);
            return null;
        }
    }

    getActiveGroups() {
        return this.db.groups.filter(g => g.active);
    }

    isGroupRegistered(groupId) {
        return this.db.groups.some(g => g.id === groupId);
    }

    formatNotificationMessage(waktu, jam) {
        return `⏰ *WAKTU SHOLAT*
        
🕌 Telah masuk waktu ${waktu}
🕐 Pukul: ${jam}

"Dan apabila kamu telah menyelesaikan shalat, ingatlah Allah di waktu berdiri, di waktu duduk dan di waktu berbaring." (QS. An Nisa: 103)`;
    }
}

module.exports = { SholatNotification };