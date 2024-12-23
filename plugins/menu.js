const fs = require("fs")
const os = require('os');

let handler = async (m, { Sky, isCreator, isPremium, qtext, runtime, toIDR }) => {
let teksnya = `
 *乂 Information - Bot*
  • Botname : *${global.botname2}*
  • Version : *${global.versi}*
  • Mode : *${Sky.public ? "Public": "Self"}*
  • Creator : @${global.owner}
  • Runtime Bot : *${runtime(process.uptime())}*
  • Uptime Vps : *${runtime(os.uptime())}*
  
 *乂 Information - Users*
  • Number : ${m.sender.split("@")[0]}
  • Status : *${isCreator ? "Owner" : isPremium ? "Premium" : "Free User"}*

  *— Othermenu*
  ⳺ .cekidch
  ⳺ .cekidgc
  ⳺ .qc
  ⳺ .brat
  ⳺ .readviewonce
  ⳺ .stickerwm
  ⳺ .sticker
  
  *— Searchmenu*
  ⳺ .yts
  ⳺ .apkmod
  ⳺ .pinterest
  
  *— Toolsmenu*
  ⳺ .ai
  ⳺ .gpt
  ⳺ .tourl
  ⳺ .tourl2
  ⳺ .ssweb
  ⳺ .translate
  ⳺ .tohd
  ⳺ .shortlink
  ⳺ .shortlink2
  ⳺ .enc
  
  *— Shopmenu*
  ⳺ .buypanel
  ⳺ .buyadp
  ⳺ .buyscript
  ⳺ .buyvps
  
  *— Downloadmenu*
  ⳺ .tiktok
  ⳺ .tiktokmp3
  ⳺ .instagram
  ⳺ .ytmp3
  ⳺ .ytmp4
  ⳺ .play
  ⳺ .playvid
  ⳺ .gitclone
  ⳺ .mediafire
  
  *— Storemenu*
  ⳺ .addrespon
  ⳺ .delrespon
  ⳺ .listrespon
  ⳺ .done
  ⳺ .proses
  ⳺ .jpm
  ⳺ .jpm2
  ⳺ .jpmtesti
  ⳺ .jpmslide
  ⳺ .jpmslideht
  ⳺ .sendtesti
  ⳺ .pushkontak
  ⳺ .pushkontak2
  ⳺ .payment
  ⳺ .produk
  ⳺ .subdomain
  
  *— Digitaloceanmenu*
  ⳺ .r1c1
  ⳺ .r2c1
  ⳺ .r4c2
  ⳺ .r8c4
  ⳺ .r16c4
  ⳺ .sisadroplet
  ⳺ .deldroplet
  ⳺ .listdroplet
  ⳺ .rebuild
  ⳺ .restartvps
  
  *— Panelmenu Reseller*
  ⳺ .addseller
  ⳺ .delseller
  ⳺ .listseller
  ⳺ .1gb
  ⳺ .2gb
  ⳺ .3gb
  ⳺ .4gb
  ⳺ .5gb
  ⳺ .6gb
  ⳺ .7gb
  ⳺ .8gb
  ⳺ .9gb
  ⳺ .10gb
  ⳺ .unlimited
  ⳺ .cadmin
  ⳺ .delpanel
  ⳺ .deladmin
  ⳺ .listpanel
  ⳺ .listadmin
    
  *— Panelmenu Owner*
  ⳺ .1gb-v2
  ⳺ .2gb-v2
  ⳺ .3gb-v2
  ⳺ .4gb-v2
  ⳺ .5gb-v2
  ⳺ .6gb-v2
  ⳺ .7gb-v2
  ⳺ .8gb-v2
  ⳺ .9gb-v2
  ⳺ .10gb-v2
  ⳺ .unlimited-v2
  ⳺ .cadmin-v2
  ⳺ .delpanel-v2
  ⳺ .deladmin-v2
  ⳺ .listpanel-v2
  ⳺ .listadmin-v2
  
  *— Installermenu*
  ⳺ .hackbackpanel
  ⳺ .installpanel
  ⳺ .installtemastellar
  ⳺ .installtemabilling
  ⳺ .installtemaenigma
  ⳺ .uninstallpanel
  ⳺ .uninstalltema
  
  *— Groupmenu*
  ⳺ .add
  ⳺ .kick
  ⳺ .close
  ⳺ .open
  ⳺ .hidetag
  ⳺ .kudetagc
  ⳺ .leave
  ⳺ .tagall
  ⳺ .promote
  ⳺ .demote
  ⳺ .resetlinkgc
  ⳺ .on
  ⳺ .off
  ⳺ .linkgc
  
  *— Ownermenu*
  ⳺ .autoread
  ⳺ .autopromosi
  ⳺ .autoreadsw
  ⳺ .autotyping
  ⳺ .addplugins
  ⳺ .listplugins
  ⳺ .delplugins
  ⳺ .getplugins
  ⳺ .saveplugins
  ⳺ .addowner
  ⳺ .listowner
  ⳺ .delowner
  ⳺ .self/public
  ⳺ .setimgmenu
  ⳺ .setimgfake
  ⳺ .setppbot
  ⳺ .clearsession
  ⳺ .clearchat
  ⳺ .resetdb
  ⳺ .restartbot
  ⳺ .getsc
  ⳺ .getcase
  ⳺ .listgc
  ⳺ .joingc
  ⳺ .joinch
  ⳺ .upchannel
  ⳺ .upchannel2
`
await Sky.sendMessage(m.chat, {text: teksnya, mentions: [m.sender, global.owner+"@s.whatsapp.net"]}, {quoted: qtext})
}

handler.command = ["menu"]

module.exports = handler