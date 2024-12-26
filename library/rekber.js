const fs = require('fs')
const crypto = require('crypto')
const axios = require('axios')

class RekberManager {
    constructor(Sky) {
        this.Sky = Sky
        this.config = this.loadConfig()
        this.activeRekbers = this.loadDatabase('rekber_active')
        this.rekberHistory = this.loadDatabase('rekber_history')
        this.userRekberCount = this.loadDatabase('user_rekber_count')
    }

    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync('./library/database/rekber_config.json', 'utf8'))
        } catch {
            return {
                maxRekberPerWeek: 100,
                maxTransactionAmount: 10000000,
                adminFee: 2000
            }
        }
    }

    loadDatabase(filename) {
        try {
            return JSON.parse(fs.readFileSync(`./library/database/${filename}.json`, 'utf8'))
        } catch {
            return filename === 'rekber_active' ? {} : []
        }
    }

    saveDatabase(filename, data) {
        fs.writeFileSync(`./library/database/${filename}.json`, JSON.stringify(data, null, 2))
    }

    generateRekberId() {
        return crypto.randomBytes(6).toString('hex')
    }

    async validateNumber(number) {
        try {
            const [result] = await this.Sky.onWhatsApp(number)
            return result?.exists || false
        } catch {
            return false
        }
    }

    async createRekber(m, seller, buyer, title) {
        // Validasi jumlah rekber per minggu
        const currentWeek = this.getCurrentWeek()
        this.userRekberCount[seller] = this.userRekberCount[seller] || {}
        this.userRekberCount[seller][currentWeek] = 
            (this.userRekberCount[seller][currentWeek] || 0) + 1

        if (this.userRekberCount[seller][currentWeek] > this.config.maxRekberPerWeek) {
            return m.reply(`Anda telah mencapai batas maksimal rekber per minggu (${this.config.maxRekberPerWeek})`)
        }

        const rekberId = this.generateRekberId()
        
        try {
            // Buat Grup Rekber
            const groupMetadata = await this.Sky.groupCreate(title, [seller, buyer])
            
            // Simpan Data Rekber
            this.activeRekbers[rekberId] = {
                id: rekberId,
                title: title,
                seller: seller,
                buyer: buyer,
                groupId: groupMetadata.id,
                status: 'CREATED',
                createdAt: Date.now(),
                details: null,
                payment: null
            }

            this.saveDatabase('rekber_active', this.activeRekbers)
            this.saveDatabase('user_rekber_count', this.userRekberCount)

            // Kirim Instruksi ke Grup
            await this.Sky.sendMessage(groupMetadata.id, {
                text: `🤝 Rekber Dibuat! 

Gunakan format berikut:
.rekber [Nama Barang],[Harga],[Penjual&Nomor],[Pembeli&Nomor]

Contoh:
.rekber Laptop Bekas,5000000,Budi&6285xxx,Ani&6281xxx`
            })

            return rekberId
        } catch (error) {
            console.error("Gagal membuat rekber:", error)
            return null
        }
    }

    async setupRekberTransaction(m, rekberId, details) {
        const [barang, harga, penjual, pembeli] = details.split(',')
        
        // Validasi nominal transaksi
        const hargaNumeric = parseInt(harga)
        if (hargaNumeric > this.config.maxTransactionAmount) {
            return m.reply(`Nominal transaksi melebihi batas maksimal Rp${this.config.maxTransactionAmount}`)
        }

        // Tambahkan fee admin
        const totalHarga = hargaNumeric + this.config.adminFee

        const rekber = this.activeRekbers[rekberId]
        
        if (!rekber) {
            return m.reply("Rekber tidak ditemukan!")
        }

        rekber.details = {
            barang,
            hargaAsli: hargaNumeric,
            hargaTotal: totalHarga,
            adminFee: this.config.adminFee,
            penjual: penjual.split('&')[0],
            nomorPenjual: penjual.split('&')[1],
            pembeli: pembeli.split('&')[0],
            nomorPembeli: pembeli.split('&')[1]
        }

        // Generate Pembayaran QRIS
        try {
            const paymentResponse = await axios.get(`https://apiv2.abidev.tech/api/orkut/createpayment?amount=${totalHarga}&codeqr=QRIS_CODE`)
            
            rekber.payment = {
                amount: totalHarga,
                qrisUrl: paymentResponse.data.result.qrImageUrl,
                transactionId: paymentResponse.data.result.transactionId,
                status: 'PENDING'
            }

            this.saveDatabase('rekber_active', this.activeRekbers)

            // Kirim detail pembayaran dengan info fee
            await this.Sky.sendMessage(rekber.buyer, {
                image: { url: rekber.payment.qrisUrl },
                caption: `Detail Pembayaran Rekber:
• Harga Barang: Rp${hargaNumeric.toLocaleString()}
• Biaya Admin: Rp${this.config.adminFee.toLocaleString()}
• Total Pembayaran: Rp${totalHarga.toLocaleString()}

Silakan bayar sesuai nominal di atas.`
            })

            // Otomatis cek status pembayaran setiap 30 detik selama 10 menit
            this.startPaymentCheck(rekberId)

            return true
        } catch (error) {
            console.error("Gagal membuat pembayaran:", error)
            return false
        }
    }

    async startPaymentCheck(rekberId) {
        const maxAttempts = 20 // 10 menit (30 detik * 20)
        let attempts = 0

        const checkPayment = async () => {
            if (attempts >= maxAttempts) {
                // Batalkan rekber jika pembayaran tidak diterima
                await this.batalkanRekber(rekberId)
                return
            }

            try {
                const rekber = this.activeRekbers[rekberId]
                if (!rekber || !rekber.payment) return

                const statusResponse = await axios.get(`https://apiv2.abidev.tech/api/orkut/cekstatus?merchant=${global.merchantIdOrderKuota}&keyorkut=${global.apiOrderKuota}&amount=${rekber.payment.amount}`)
                
                if (statusResponse.data.status === 'SUCCESS') {
                    rekber.payment.status = 'PAID'
                    rekber.status = 'PAYMENT_CONFIRMED'
                    
                    this.saveDatabase('rekber_active', this.activeRekbers)
                    
                    // Notifikasi Penjual
                    await this.Sky.sendMessage(rekber.seller, {
                        text: `Pembayaran untuk rekber ${rekber.id} telah diterima. Silakan kirim barang.`
                    })
                } else {
                    attempts++
                    setTimeout(checkPayment, 30000) // Cek ulang setelah 30 detik
                }
            } catch (error) {
                console.error("Gagal cek status pembayaran:", error)
                attempts++
                setTimeout(checkPayment, 30000)
            }
        }

        checkPayment()
    }

    async batalkanRekber(rekberId) {
        const rekber = this.activeRekbers[rekberId]
        
        if (!rekber) return

        // Kirim notifikasi pembatalan
        await this.Sky.sendMessage(rekber.seller, {
            text: `Rekber ${rekberId} dibatalkan karena pembayaran tidak diterima dalam waktu 10 menit.`
        })
        await this.Sky.sendMessage(rekber.buyer, {
            text: `Rekber ${rekberId} dibatalkan karena pembayaran tidak diterima dalam waktu 10 menit.`
        })
 
        // Hapus rekber
        delete this.activeRekbers[rekberId]
        this.saveDatabase('rekber_active', this.activeRekbers)
    }

    async cairkanDana(m, rekberId, ewallet) {
        const rekber = this.activeRekbers[rekberId]
        
        if (!rekber || rekber.status !== 'PAYMENT_CONFIRMED') {
            return m.reply("Transaksi belum dapat dicairkan!")
        }

        const [namaEwallet, nomorEwallet, perusahaanEwallet] = ewallet.split(',')
        
        // Kirim detail pencairan ke admin
        await this.Sky.sendMessage(global.owner+"@s.whatsapp.net", {
            text: `📦 PENCAIRAN DANA REKBER

• Rekber ID: ${rekberId}
• Nominal Asli: Rp${rekber.details.hargaAsli.toLocaleString()}
• Fee Admin: Rp${rekber.details.adminFee.toLocaleString()}
• Total Diterima Penjual: Rp${rekber.details.hargaAsli.toLocaleString()}

• E-Wallet: ${namaEwallet}
• Nomor: ${nomorEwallet}
• Perusahaan: ${perusahaanEwallet}

*Silakan transfer manual ke rekening yang tertera*`
        })

        // Update status rekber
        rekber.status = 'DANA_DICAIRKAN'
        this.saveDatabase('rekber_active', this.activeRekbers)

        return true
    }
}

module.exports = RekberManager