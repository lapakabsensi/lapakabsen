// ===== PWA: tombol unduh/pasang aplikasi, manifest mengikuti logo & warna perusahaan, service worker =====
// Event "beforeinstallprompt" ditangkap lebih awal oleh skrip kecil di <head> index.html (window.__pwaEv). Sebelumnya listener baru dipasang di akhir halaman,
// sehingga kalau Chrome mengirim event itu saat skrip lain masih dimuat, event terlewat dan tombol Pasang tidak bisa memunculkan dialog instal.
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isInApp=()=>/FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp|TikTok|Snapchat|; wv\)/i.test(navigator.userAgent);
function pwaPaint(){
  const show=!isStandalone()&&(!!window.__pwaEv||isIOS()||/android/i.test(navigator.userAgent));
  document.querySelectorAll(".pwabtn").forEach(b=>b.hidden=!show);
}
addEventListener("pwa-ready",pwaPaint);
addEventListener("appinstalled",()=>{window.__pwaEv=null;pwaPaint();toast("Aplikasi terpasang 🎉")});
// Diagnosa: pastikan manifest & ikon benar-benar terbaca sebagai file asli (bukan halaman tantangan/proteksi bot dari hosting)
async function pwaDiag(){
  try{
    const chk=async(u,json,cred)=>{const r=await fetch(u,{credentials:cred,cache:"no-store"}),t=r.headers.get("content-type")||"";return r.ok&&(json?/json/.test(t):/image/.test(t))};
    const mj=await chk("manifest.json",true,"include");
    if(!mj)return"Aplikasi belum bisa dipasang: file manifest.json tidak terbaca sebagai JSON (hosting mengembalikan halaman lain, mis. proteksi bot/anti-DDoS atau file belum ter-upload). Pastikan manifest.json ada di folder yang sama dengan index.html dan bisa dibuka langsung di browser.";
    if(!(await chk("icons/icon-512.png",false,"omit")))return"Aplikasi belum bisa dipasang: ikon aplikasi (icons/icon-512.png) tidak terbaca tanpa login/cookie. Biasanya karena proteksi bot di hosting gratis (halaman tantangan ikut menutup file gambar). Matikan proteksi itu untuk file di folder icons/, atau pindahkan hosting (mis. Firebase Hosting, gratis dan sudah satu paket dengan database kamu).";
  }catch(e){}
  return"";
}
async function pwaInstall(){
  const ev=window.__pwaEv;
  if(ev){window.__pwaEv=null;ev.prompt();try{await ev.userChoice}catch(e){}pwaPaint();return}
  if(isIOS())return uiAlert("Cara pasang di iPhone/iPad:\n\n1. Buka halaman ini di Safari (bukan di dalam aplikasi lain)\n2. Ketuk tombol Bagikan (kotak dengan panah ke atas)\n3. Pilih \"Tambahkan ke Layar Utama\"\n4. Ketuk Tambah");
  if(isInApp())return uiAlert("Halaman ini terbuka di dalam aplikasi lain (WhatsApp/Instagram/dll) sehingga tidak bisa dipasang.\n\nBuka menu ⋮ lalu pilih \"Buka di Chrome\" / \"Open in browser\", kemudian tekan tombol Pasang lagi.");
  if(!isSecureContext)return uiAlert("Aplikasi hanya bisa dipasang jika alamat web memakai HTTPS (gembok).");
  const dg=await pwaDiag();if(dg)return uiAlert(dg);
  uiAlert("Buka menu browser (⋮) lalu pilih \"Instal aplikasi\" atau \"Tambahkan ke layar utama\".\n\nJika menu itu tidak ada, tutup lalu buka ulang Chrome dan muat ulang halaman ini sekali.");
}
// Branding: warna bilah browser, judul di iOS, dan ikon iOS mengikuti Pengaturan.
// PENTING: manifest TIDAK boleh diganti jadi blob:/data: URL. Chrome Android menolak memasang (WebAPK) kalau URL manifest-nya bukan http(s),
// akibatnya tombol Pasang tidak pernah muncul. Jadi manifest.json + folder icons/ tetap file statis di server.
function logoPng(src,size,bg){return new Promise(ok=>{const i=new Image();i.onload=()=>{try{const c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");
  if(bg){x.fillStyle=bg;x.fillRect(0,0,size,size)}const k=Math.min(size/i.width,size/i.height)*(bg?.8:1),w=i.width*k,h=i.height*k;x.drawImage(i,(size-w)/2,(size-h)/2,w,h);ok(c.toDataURL("image/png"))}catch(e){ok(null)}};i.onerror=()=>ok(null);i.src=src})}
async function pwaBrand(){
  try{
    const color=COMP.color||"#0d9488",name=COMP.name||"Lapak Absen",tm=document.querySelector("meta[name=theme-color]");if(tm)tm.content=color;
    const at=document.querySelector("meta[name=apple-mobile-web-app-title]");if(at)at.content=name.slice(0,20);
    if(!COMP.logo)return;
    const ap=await logoPng(COMP.logo,180,"#ffffff");
    if(ap)document.getElementById("ati").href=ap;
  }catch(e){}
}
pwaPaint();pwaBrand();
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{}));

// ---------- Paket ikon aplikasi (HP): dibuat dari logo & nama di Pengaturan ----------
// Ikon dan nama aplikasi yang terpasang di HP dibaca dari file statis (manifest.json + icons/) di server, bukan dari database,
// jadi tidak bisa berubah otomatis. Admin mengunduh paket ini lalu menimpa file di server.
const pwaIconBox=()=>`<div class="box"><h3>Ikon aplikasi di HP</h3><p class="mut" style="margin-bottom:12px">Ikon dan nama aplikasi yang terpasang di HP dibaca dari file di server, bukan dari pengaturan di atas. Setelah mengganti logo atau nama: simpan dulu, unduh paket ini, ekstrak ke folder website (timpa folder <b>icons</b> dan file <b>manifest.json</b>), lalu hapus dan pasang ulang aplikasi di HP.</p><button class="btn" onclick="pwaIconPack()">⬇️ Unduh paket ikon aplikasi</button></div>`;
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=-1;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return(c^-1)>>>0};
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cen=[],u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];let off=0;
  files.forEach(f=>{const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0),...nm]);
    parts.push(lh,f.data);
    cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off),...nm]));
    off+=lh.length+sz});
  const cs=cen.reduce((a,b)=>a+b.length,0);
  return new Blob([...parts,...cen,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0])],{type:"application/zip"});
}
function iconPng(src,size,scale){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,size,size);
  const k=Math.min(size/i.width,size/i.height)*scale,w=i.width*k,h=i.height*k;x.drawImage(i,(size-w)/2,(size-h)/2,w,h);c.toBlob(b=>b?b.arrayBuffer().then(a=>ok(new Uint8Array(a))):no(new Error("Gagal membuat PNG")),"image/png")};
  i.onerror=()=>no(new Error("Logo tidak bisa dimuat"));i.src=src})}
async function pwaIconPack(){
  try{
    toast("Menyiapkan paket ikon...");
    const src=COMP.logo||"img/logo.svg",color=COMP.color||"#0d9488",name=COMP.name||"Lapak Absen";
    let mf={};try{mf=await(await fetch("manifest.json",{credentials:"include",cache:"no-store"})).json()}catch(e){}
    if(!mf.icons)mf={id:"./",start_url:"./",scope:"./",display:"standalone",background_color:"#f1f5f9",lang:"id",prefer_related_applications:false,
      icons:[{src:"icons/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"icons/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},{src:"icons/icon-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}]};
    mf={...mf,name,short_name:name.slice(0,12),theme_color:color};
    const out=[];for(const[n,s,k]of[["icons/icon-192.png",192,.86],["icons/icon-512.png",512,.86],["icons/icon-maskable-512.png",512,.6],["icons/apple-touch-icon.png",180,.8]])out.push({name:n,data:await iconPng(src,s,k)});
    out.push({name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(mf,null,2))});
    const a=document.createElement("a");a.href=URL.createObjectURL(zipStore(out));a.download="paket-ikon-aplikasi.zip";a.click();toast("Paket ikon diunduh");
  }catch(e){toast("Gagal: "+e.message)}
}
