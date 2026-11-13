// ===== Lisensi per akun (sisi pelanggan) =====
// Alur: admin ajukan jumlah akun -> notifikasi ke Super Admin -> admin transfer -> Super Admin kirim token -> admin masukkan token -> kuota bertambah.
// Kuota (tenants/<kode>.quota) hanya bisa dinaikkan Super Admin atau lewat token yang sah; pemakaian (used) hanya bisa naik/turun bersama
// pembuatan/penghapusan akun karyawan. Dipaksa oleh firestore.rules, bukan hanya oleh aplikasi.
const PAY_DEF={company:"",bank:"BCA",no:"6530119465",name:"GERRI DANELTO",wa:""};
let TEN=null,PAY={...PAY_DEF};
const seatLeft=()=>TEN?Math.max(0,(+TEN.quota||0)-(+TEN.used||0)):0;
async function loadTenant(){
  if(window.DEMO_ON){TEN={quota:99,used:0,price:3500,status:"aktif",name:"Demo"};return TEN}
  if(!TENANT)throw new Error("Kode perusahaan belum diisi");
  const f=firebase.firestore();let d=await f.collection("tenants").doc(TENANT).get();
  if(!d.exists){ // mungkin yang diketik adalah alias/slug: terjemahkan lewat Firestore (tidak bergantung XHR sinkron) lalu muat ulang dengan kode asli
    try{const a=await f.collection("tenantAlias").doc(TENANT).get(),id=a.exists?String((a.data()||{}).id||"").toLowerCase().replace(/[^a-z0-9]/g,""):"";
      if(id&&id!==TENANT){const t2=await f.collection("tenants").doc(id).get();if(t2.exists){try{localStorage.setItem("tenantId",id)}catch(e){}location.href=location.pathname+"?c="+id;await new Promise(()=>{})}}}catch(e){}
    throw new Error("Kode perusahaan tidak ditemukan")}
  TEN={id:d.id,...d.data()};
  if(TEN.status!=="aktif")throw new Error("Akun perusahaan ini sedang dinonaktifkan. Hubungi penyedia layanan.");
  try{if(firebase.auth().currentUser){const p=await f.collection("superMeta").doc("pay").get();if(p.exists)PAY={...PAY_DEF,...p.data()}}}catch(e){}
  return TEN;
}
async function seatGuard(n=1){
  if(window.DEMO_ON)return true;
  try{await loadTenant()}catch(e){toast(e.message);return false}
  if(seatLeft()>=n)return true;
  toast(`Kuota akun tidak cukup (sisa ${seatLeft()}, dibutuhkan ${n}). Ajukan lisensi dulu.`);go("lisensi");return false;
}
// Setiap akun berkursi ditautkan ke SATU lisensi (users.licId): lisensi aktif yang paling dulu berakhir dan masih punya kursi kosong.
// Dengan begitu ketahuan siapa memakai lisensi mana, dan riwayat tambah/hapus akun tersimpan di seatLog (tidak bisa diubah).
const licMs=t=>t&&t.toMillis?t.toMillis():0;
async function pickLic(){
  try{const f=firebase.firestore(),now=Date.now();
    const[ls,us]=await Promise.all([f.collection("licenses").where("tid","==",TENANT).where("status","==","aktif").get(),db.collection("users").where("seat","==",true).get()]);
    const cnt={};us.docs.forEach(x=>{const k=x.data().licId;if(k)cnt[k]=(cnt[k]||0)+1});
    const c=ls.docs.map(x=>({id:x.id,...x.data()})).filter(l=>l.kind!=="perpanjang"&&(!l.expiresAt||licMs(l.expiresAt)>now)&&(cnt[l.id]||0)<(+l.qty||0))
      .sort((x,y)=>(x.expiresAt?licMs(x.expiresAt):9e15)-(y.expiresAt?licMs(y.expiresAt):9e15));
    return c[0]?c[0].id:"";
  }catch(e){return""}
}
const seatLogDoc=(b,o)=>b.set(db.collection("seatLog").doc(),{uid:o.uid,name:String(o.name||o.email||"").slice(0,80),role:String(o.role||"").slice(0,20),action:o.action,licId:o.licId||"",ts:firebase.firestore.FieldValue.serverTimestamp(),by:(typeof ME!=="undefined"&&ME&&ME.id)||firebase.auth().currentUser.uid,byName:String((typeof ME!=="undefined"&&ME&&ME.name)||"").slice(0,80)});
// membuat / menghapus akun karyawan = dokumen users + penghitung kursi dalam satu batch (rules memeriksa keduanya)
// batch kursi ditolak rules -> jelaskan penyebab yang paling mungkin, bukan hanya "Missing or insufficient permissions"
const seatErr=e=>e&&e.code==="permission-denied"?new Error("Ditolak aturan Firestore saat memproses kursi akun. Pastikan firestore.rules versi terbaru (yang memuat aturan seatNew/seatFree dan seatLog) sudah di-publish di Firebase Console, dan kuota akun masih tersedia."):e;
async function addUserDoc(uid,d){
  if(window.DEMO_ON)return db.collection("users").doc(uid).set(d);
  const f=firebase.firestore(),b=f.batch(),licId=await pickLic();
  b.set(db.collection("users").doc(uid),{...d,seat:true,licId,licAt:Date.now()});
  b.update(f.collection("tenants").doc(TENANT),{used:firebase.firestore.FieldValue.increment(1),lastUid:uid});
  seatLogDoc(b,{uid,name:d.name,role:d.role,action:"tambah",licId});
  try{await b.commit()}catch(e){throw seatErr(e)}if(TEN)TEN.used=(+TEN.used||0)+1;
}
async function delUserDoc(id){
  const u=(typeof USERS!=="undefined"?USERS:[]).find(x=>x.id===id);
  if(window.DEMO_ON||!u||u.seat!==true)return db.collection("users").doc(id).delete();
  const f=firebase.firestore(),b=f.batch();
  b.delete(db.collection("users").doc(id));
  b.update(f.collection("tenants").doc(TENANT),{used:firebase.firestore.FieldValue.increment(-1),lastUid:id});
  seatLogDoc(b,{uid:id,name:u.name,role:u.role,action:"hapus",licId:u.licId||""});
  try{await b.commit()}catch(e){throw seatErr(e)}if(TEN)TEN.used=Math.max(0,(+TEN.used||0)-1);
}
const seatBar=()=>{if(window.DEMO_ON||!TEN)return"";const l=seatLeft();
  return`<div class="box lic-bar${l?"":" warn"}"><div>🎫 Kuota akun: <b>${+TEN.used||0}</b> terpakai dari <b>${+TEN.quota||0}</b> · sisa <b>${l}</b>${l?"":(+TEN.used||0)>(+TEN.quota||0)?'<br><small>⚠️ Masa berlaku token habis, jumlah akun melebihi kuota. Perpanjang lisensi agar bisa menambah karyawan.</small>':'<br><small>Belum ada kuota. Ajukan lisensi dulu sebelum menambah karyawan.</small>'}</div><button class="btn sm" onclick="go('lisensi')">${l?"Tambah kuota":"Ajukan lisensi"}</button></div>`};
const _vk=V.karyawan;V.karyawan=async()=>{try{await loadTenant()}catch(e){}return seatBar()+await _vk()};
ADM.splice(2,0,["lisensi","🎫","Lisensi"]);

// ---------- Halaman Lisensi ----------

// ---- bukti pembayaran & WhatsApp ke penyedia layanan ----
const waNum=s=>{let n=String(s||"").replace(/\D/g,"");if(n.startsWith("0"))n="62"+n.slice(1);else if(n.startsWith("8"))n="62"+n;return n};
function licWa(id){const l=(window.LICS||[]).find(x=>x.id===id)||{},n=waNum(PAY.wa);if(!n)return toast("Nomor WhatsApp penyedia layanan belum diisi");
  const m=l.kind==="perpanjang"?`Halo, saya admin ${(TEN&&TEN.name)||TENANT} (kode ${TENANT}). Saya mengajukan PERPANJANGAN lisensi ${l.qty||""} akun ${l.months||1} bulan senilai ${rp(l.total||0)}${l.proof?" dan sudah mengunggah bukti transfer":""}. Mohon dicek dan disetujui. Terima kasih.`:`Halo, saya admin ${(TEN&&TEN.name)||TENANT} (kode ${TENANT}). Saya sudah mengajukan lisensi ${l.qty||""} akun senilai ${rp(l.total||0)}${l.proof?" dan sudah mengunggah bukti transfer":""}. Mohon dicek dan dikirimkan tokennya. Terima kasih.`;
  window.open("https://wa.me/"+n+"?text="+encodeURIComponent(m),"_blank")}
function proofData(f){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{for(const m of [1100,900,720,560]){const s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);const d=c.toDataURL("image/jpeg",.72);if(d.length<600000||m===560)return ok(d)}};im.src=r.result};r.readAsDataURL(f)})}
async function licProof(id,inp){const f=inp.files&&inp.files[0];if(!f)return;if(!/^image\//.test(f.type))return toast("Pilih file gambar (foto / screenshot bukti transfer)");
  try{const d=await proofData(f);await firebase.firestore().collection("licenses").doc(id).update({proof:d,proofAt:firebase.firestore.FieldValue.serverTimestamp()});toast("Bukti pembayaran terkirim. Hubungi penyedia layanan lewat WhatsApp agar cepat diproses.");go("lisensi")}catch(e){toast("Gagal mengirim bukti: "+(e.code||e.message))}}
const proofBox=l=>`<div class="lic-pf"><b>Bukti pembayaran</b>${l.proof?`<div><a href="${l.proof}" target="_blank" rel="noopener"><img src="${l.proof}" alt="Bukti pembayaran" class="lic-pimg"></a></div><small class="mut">Terkirim${l.proofAt&&l.proofAt.toDate?" "+l.proofAt.toDate().toLocaleString("id-ID"):""}. Salah file? Unggah ulang untuk mengganti.</small>`:'<div><small class="mut">Belum ada. Unggah foto / screenshot bukti transfer.</small></div>'}
  <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><input type="file" id="pf_${l.id}" accept="image/*" hidden onchange="licProof('${l.id}',this)"><button class="btn sm" onclick="document.getElementById('pf_${l.id}').click()">📎 ${l.proof?"Ganti bukti":"Unggah bukti"}</button><button class="btn ghost sm" onclick="licWa('${l.id}')">💬 Hubungi via WhatsApp</button></div></div>`;
// ---- masa berlaku token: berlaku sejak diaktifkan sampai N bulan ke depan (N ditentukan Super Admin) ----
const licAddM=(d,n)=>{const x=new Date(d),k=x.getDate();x.setMonth(x.getMonth()+n);if(x.getDate()<k)x.setDate(0);return x};
const licFd=t=>t&&t.toDate?t.toDate().toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"-";
const licLeft=t=>t&&t.toMillis?Math.ceil((t.toMillis()-Date.now())/864e5):null;
const licMo=l=>Math.max(1,parseInt(l&&l.months)||1);
// token yang sudah lewat masa berlakunya: kursinya dicabut dari kuota (kuota tidak boleh jadi negatif; sisanya dirapikan Super Admin)
async function licSweep(){
  if(window.DEMO_ON||!ADMIN()||!TENANT)return;
  try{const f=firebase.firestore(),FV=firebase.firestore.FieldValue,now=Date.now();
    const s=await f.collection("licenses").where("tid","==",TENANT).where("status","==","aktif").get();
    for(const d of s.docs){const l=d.data();if(!l.expiresAt||l.expiresAt.toMillis()>=now)continue;
      await loadTenant();if((+TEN.quota||0)-(+l.qty||0)<0)continue;
      const b=f.batch();b.update(d.ref,{status:"kedaluwarsa"});b.update(f.collection("tenants").doc(TENANT),{quota:FV.increment(-(+l.qty||0)),lastLic:d.id});
      await b.commit();await loadTenant()}
  }catch(e){}
}
const licSt={menunggu:"⏳ Menunggu pembayaran & verifikasi",terbit:"🎫 Token diterima: masukkan untuk mengaktifkan",aktif:"✅ Aktif",ditolak:"❌ Ditolak",kedaluwarsa:"⌛ Berakhir",nonaktif:"⛔ Dinonaktifkan penyedia layanan",diperpanjang:"✅ Perpanjangan disetujui"};
const payBox=(t,renew)=>`<div class="lic-pay"><b>Transfer ke:</b> ${esc(PAY.bank)} <b>${esc(PAY.no)}</b> <button class="btn ghost sm" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(PAY.no)}');toast('No. rekening disalin')">Salin</button><br>a.n. <b>${esc(PAY.name)}</b>${t?`<br>Nominal: <b>${rp(t)}</b>`:""}<br><small class="mut">${renew?"Setelah transfer, tunggu persetujuan dari penyedia layanan. Masa berlaku lisensi akan otomatis bertambah (tanpa token baru).":"Setelah transfer, tunggu token dari penyedia layanan. Token akan muncul di halaman ini."}</small></div>`;
V.lisensi=async()=>{
  if(!ADMIN())return`<div class="box">Menu ini khusus admin.</div>`;
  if(window.DEMO_ON)return head("Lisensi")+`<div class="box">Mode demo: lisensi tidak aktif.</div>`;
  await loadTenant().catch(()=>{});await licSweep();
  const f=firebase.firestore(),ms=x=>x&&x.toMillis?x.toMillis():0,pr=+(TEN&&TEN.price)||3500;
  const ls=(await f.collection("licenses").where("tid","==",TENANT).get()).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>ms(b.ts)-ms(a.ts));window.LICS=ls;const UL=await licUsageLoad();
  const licDone=l=>{const d=licLeft(l.expiresAt);return`<div class="lic-tok"><small class="mut">Token:</small> <span class="lic-code" style="display:inline-block;margin:0 6px">${esc(l.token)}</span>${l.expiresAt?`<div style="margin-top:6px">Aktif sejak <b>${licFd(l.activatedAt)}</b> · berlaku sampai <b>${licFd(l.expiresAt)}</b>${l.status==="aktif"&&d!=null?` <span class="tag${d<=7?" no":" ok"}">${d>0?"sisa "+d+" hari":"berakhir hari ini"}</span>`:""}</div>`:`<div style="margin-top:6px"><small class="mut">Aktif sejak ${licFd(l.activatedAt)} · tanpa batas waktu</small></div>`}</div>`};
  const item0=l=>`<div class="lic-it"><div class="row" style="flex-wrap:wrap;gap:6px"><b>${l.qty} akun · ${licMo(l)} bulan · ${rp(l.total)}</b><span class="tag${l.status==="aktif"||l.status==="diperpanjang"?" ok":l.status==="ditolak"||l.status==="kedaluwarsa"||l.status==="nonaktif"?" no":""}">${licSt[l.status]||esc(l.status)}</span></div><small class="mut">${l.ts&&l.ts.toDate?l.ts.toDate().toLocaleString("id-ID"):""} · ${rp(l.price)}/akun/bulan</small>
    ${l.token&&(l.status==="aktif"||l.status==="kedaluwarsa")?licDone(l):""}
    ${l.status==="aktif"||l.status==="kedaluwarsa"?licUsage(l,UL)+licRenewBtn(l):""}
    ${l.status==="nonaktif"?`<small class="mut">Lisensi ini dinonaktifkan oleh penyedia layanan, kuotanya sudah dicabut. Hubungi penyedia layanan bila ada kekeliruan.</small>`:""}
    ${l.status==="menunggu"?payBox(l.total)+proofBox(l):""}
    ${l.status==="terbit"?`<div class="lic-tok"><small class="mut">Token lisensi dari penyedia layanan · berlaku ${licMo(l)} bulan sejak diaktifkan:</small><div class="lic-code">${esc(l.token)}</div><div class="row" style="gap:8px"><input id="lt_${l.id}" placeholder="Masukkan token di sini" autocomplete="off"><button class="btn" onclick="licActivate('${l.id}')">Aktifkan</button></div></div>`:""}
    ${l.status==="ditolak"&&l.note?`<small class="mut">Alasan: ${esc(l.note)}</small>`:""}
    ${typeof licDocs==="function"?licDocs(l):""}</div>`;
  const item=l=>l.kind==="perpanjang"?renewItem(l):item0(l);
  return head("Lisensi","Harga "+rp(pr)+" per akun")+`<div class="stats"><div class="st"><b>${+TEN.quota||0}</b>Kuota akun</div><div class="st"><b>${+TEN.used||0}</b>Terpakai</div><div class="st"><b>${seatLeft()}</b>Sisa</div>${(()=>{const a=ls.filter(l=>l.status==="aktif"&&l.expiresAt).sort((x,y)=>ms(x.expiresAt)-ms(y.expiresAt))[0];return a?`<div class="st"><b style="font-size:20px">${licFd(a.expiresAt)}</b>Token berikutnya berakhir</div>`:""})()}</div>
  ${licUnlinked(UL,ls)}
  <div class="box"><h3>Ajukan tambahan akun</h3><div class="fg"><div class="f"><label>Jumlah akun karyawan</label><input id="lq" type="number" min="1" max="1000" value="5" oninput="licCalc()"></div><div class="f"><label>Periode berlaku</label><select id="lm" onchange="licCalc()">${[1,2,3,6,12].map(m=>`<option value="${m}">${m} bulan</option>`).join("")}</select></div><div class="f"><label>Total yang harus dibayar</label><div id="lqt" class="lic-total">${rp(5*pr)}</div></div></div>
  <button class="btn" onclick="licRequest()">Kirim permintaan</button><p class="mut" style="margin-top:8px"><small>Harga per akun per bulan. Token berlaku dari saat kamu memasukkannya sampai sebanyak bulan yang dipilih; penyedia layanan bisa menyesuaikan periodenya. Setelah pembayaran diterima, token dikirim ke akun admin ini.</small></p></div>
  <div class="box"><h3>Permintaan & lisensi</h3>${ls.map(item).join("")||'<p class="mut">Belum ada permintaan.</p>'}</div>`;
};
// ---- pemakaian lisensi: siapa memakai lisensi mana ----
async function licUsageLoad(){
  try{const[us,lg]=await Promise.all([db.collection("users").get(),db.collection("seatLog").orderBy("ts","desc").limit(300).get()]);
    return{users:us.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.seat===true),log:lg.docs.map(d=>({id:d.id,...d.data()}))}}
  catch(e){return{users:[],log:[],err:e}}
}
const licDt=n=>n?new Date(n).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"";
const licNo=l=>typeof lpInvNo==="function"?lpInvNo(l):l.id.slice(0,6).toUpperCase();
function licUsage(l,UL){
  const mine=UL.users.filter(u=>u.licId===l.id),gone=UL.log.filter(x=>x.action==="hapus"&&x.licId===l.id),q=+l.qty||0,exp=l.status==="kedaluwarsa";
  return`<div class="lic-us" style="margin-top:10px;padding:10px 12px;border:1px solid var(--line,#e2e8f0);border-radius:10px"><b>👥 Dipakai oleh ${mine.length} dari ${q} akun</b>${exp&&mine.length?`<div class="mut" style="color:#b91c1c"><small>⚠️ Lisensi ini sudah berakhir, akun di bawah tidak lagi tercakup kuota. Perpanjang lisensi, atau pindahkan lewat tombol "Tautkan otomatis" di atas.</small></div>`:""}
    ${mine.length?`<ul style="margin:6px 0 0 18px;padding:0">${mine.map(u=>`<li>${esc(u.name||u.email||u.id)} <small class="mut">${esc(u.role||"")}${u.licAt?" · sejak "+licDt(u.licAt):""}</small></li>`).join("")}</ul>`:'<div><small class="mut">Belum ada akun yang memakai lisensi ini.</small></div>'}
    ${gone.length?`<details style="margin-top:8px"><summary style="cursor:pointer">Akun yang sudah dihapus dan pernah memakai lisensi ini (${gone.length})</summary><ul style="margin:6px 0 0 18px;padding:0">${gone.slice(0,30).map(x=>`<li>${esc(x.name||x.uid)} <small class="mut">dihapus ${licFd(x.ts)} oleh ${esc(x.byName||"-")}</small></li>`).join("")}</ul></details>`:""}</div>`;
}
// akun berkursi yang belum tertaut ke lisensi aktif (akun lama sebelum fitur ini, atau lisensinya sudah berakhir / dinonaktifkan)
function licUnlinked(UL,ls){
  const ok=new Set(ls.filter(l=>l.kind!=="perpanjang"&&l.status==="aktif"&&(!l.expiresAt||licMs(l.expiresAt)>Date.now())).map(l=>l.id)),by=Object.fromEntries(ls.map(l=>[l.id,l]));
  const bad=UL.users.filter(u=>!ok.has(u.licId));
  if(UL.err)return`<div class="box"><small class="mut">Pemakaian lisensi tidak bisa dimuat (${esc(UL.err.code||UL.err.message)}). Pastikan firestore.rules terbaru sudah di-publish.</small></div>`;
  if(!bad.length)return`<div class="box"><b>👥 Semua ${UL.users.length} akun karyawan sudah tertaut ke lisensi aktif.</b><br><small class="mut">Rincian siapa memakai lisensi mana ada di tiap lisensi di bawah.</small></div>`;
  const why=u=>!u.licId?"belum tertaut ke lisensi":by[u.licId]?"lisensi "+licNo(by[u.licId])+" "+(by[u.licId].status==="aktif"?"sudah berakhir":esc(by[u.licId].status)):"lisensi tidak ditemukan";
  return`<div class="box warn"><b>⚠️ ${bad.length} akun belum tertaut ke lisensi aktif</b><ul style="margin:6px 0 8px 18px;padding:0">${bad.map(u=>`<li>${esc(u.name||u.email||u.id)} <small class="mut">${why(u)}</small></li>`).join("")}</ul>
    <button class="btn sm" onclick="licRelink()">🔗 Tautkan otomatis</button> <small class="mut">Akun dipasang ke lisensi aktif yang masih punya kursi kosong (yang paling dulu berakhir lebih dulu).</small></div>`;
}
async function licRelink(){
  const f=firebase.firestore(),now=Date.now(),[ls0,UL]=await Promise.all([f.collection("licenses").where("tid","==",TENANT).where("status","==","aktif").get(),licUsageLoad()]);
  const ls=ls0.docs.map(d=>({id:d.id,...d.data()})).filter(l=>l.kind!=="perpanjang"&&(!l.expiresAt||licMs(l.expiresAt)>now)).sort((x,y)=>(x.expiresAt?licMs(x.expiresAt):9e15)-(y.expiresAt?licMs(y.expiresAt):9e15));
  const free={};ls.forEach(l=>free[l.id]=(+l.qty||0)-UL.users.filter(u=>u.licId===l.id).length);
  const bad=UL.users.filter(u=>!(u.licId&&free[u.licId]!=null)).sort((a,b)=>String(a.name).localeCompare(String(b.name))),plan=[];
  for(const u of bad){const l=ls.find(x=>free[x.id]>0);if(!l)break;free[l.id]--;plan.push([u,l.id])}
  if(!plan.length)return toast("Tidak ada kursi lisensi kosong. Ajukan atau perpanjang lisensi dulu.");
  for(let i=0;i<plan.length;i+=200){const b=f.batch();plan.slice(i,i+200).forEach(([u,id])=>{b.update(db.collection("users").doc(u.id),{licId:id,licAt:now});seatLogDoc(b,{uid:u.id,name:u.name,role:u.role,action:"pindah",licId:id})});await b.commit()}
  toast(`${plan.length} akun ditautkan ke lisensi aktif${plan.length<bad.length?`. ${bad.length-plan.length} akun belum dapat kursi (kuota kurang)`:""}`);render();
}
// ---- perpanjang lisensi: pilih jumlah akun & periode, harga otomatis, bayar seperti biasa, Super Admin menyetujui (tanpa token baru) ----
const licRenewBtn=l=>`<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm" onclick="licRenew('${l.id}')">🔁 Perpanjang lisensi</button><small class="mut" style="align-self:center">Pilih jumlah akun & periode, bayar, lalu penyedia layanan menyetujui. Tidak ada token baru.</small></div>`;
function licRenew(id){
  const l=(window.LICS||[]).find(x=>x.id===id);if(!l)return;const pr=+(TEN&&TEN.price)||3500,cur=licMs(l.expiresAt),open=cur>Date.now();
  const ov=document.createElement("div");ov.className="dlg";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");
  ov.innerHTML=`<div class="dlgb"><div class="dlgh"><span class="dlgi ask">🔁</span><h3>Perpanjang lisensi</h3></div>
    <p class="dlgm">Lisensi ${esc(licNo(l))} · ${l.qty} akun · ${l.expiresAt?(open?"berlaku sampai "+licFd(l.expiresAt)+" (sisa "+licLeft(l.expiresAt)+" hari)":"sudah berakhir "+licFd(l.expiresAt)):"tanpa batas waktu"}</p>
    <div class="dlgf"><div><label>Jumlah akun</label><input class="dlgin" id="rn_q" type="text" inputmode="numeric" value="${+l.qty||1}"></div>
    <div><label>Periode perpanjangan</label><select class="dlgin" id="rn_m">${[1,2,3,6,12].map(m=>`<option value="${m}"${m===licMo(l)?" selected":""}>${m} bulan</option>`).join("")}</select></div></div>
    <div id="rn_i" style="margin:10px 0;line-height:1.7"></div>
    <div class="dlga"><button type="button" class="btn ghost" id="rn_c">Batal</button><button type="button" class="btn" id="rn_ok">Kirim permintaan</button></div></div>`;
  const q=()=>Math.min(1000,Math.max(0,parseInt(ov.querySelector("#rn_q").value)||0)),m=()=>parseInt(ov.querySelector("#rn_m").value)||1;
  const calc=()=>{const n=q(),mo=m(),from=new Date(open?cur:Date.now());ov.querySelector("#rn_i").innerHTML=`Harga: <b>${rp(pr)}</b> per akun per bulan<br>Total: <b style="font-size:18px">${rp(n*pr*mo)}</b> <small class="mut">(${n} akun × ${mo} bulan)</small><br><small class="mut">Setelah disetujui, berlaku sampai ± <b>${licAddM(from,mo).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</b>. Jumlah akun ${n===(+l.qty)?"tetap":n>l.qty?"bertambah "+(n-l.qty):"berkurang "+(l.qty-n)}.</small>`};
  const close=()=>{document.removeEventListener("keydown",kd,true);ov.classList.remove("in");setTimeout(()=>ov.remove(),160)},kd=e=>{if(e.key==="Escape"){e.stopPropagation();close()}};
  ov.querySelector("#rn_q").addEventListener("input",calc);ov.querySelector("#rn_m").addEventListener("change",calc);ov.querySelector("#rn_c").onclick=close;ov.addEventListener("mousedown",e=>{if(e.target===ov)close()});
  ov.querySelector("#rn_ok").onclick=async()=>{const n=q(),mo=m();if(!(n>=1&&n<=1000))return toast("Jumlah akun harus 1 sampai 1000");
    const b=ov.querySelector("#rn_ok");b.disabled=true;
    try{await firebase.firestore().collection("licenses").add({...licPayload(n,pr,mo),kind:"perpanjang",ref:id});close();toast("Permintaan perpanjangan terkirim. Silakan transfer sesuai petunjuk, lalu unggah bukti pembayaran.");render()}
    catch(e){b.disabled=false;toast("Gagal mengirim: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}};
  document.addEventListener("keydown",kd,true);document.body.appendChild(ov);calc();requestAnimationFrame(()=>{ov.classList.add("in");ov.querySelector("#rn_q").select()});
}
function renewItem(l){
  const src=(window.LICS||[]).find(x=>x.id===l.ref)||{};
  return`<div class="lic-it"><div class="row" style="flex-wrap:wrap;gap:6px"><b>🔁 Perpanjangan · ${l.qty} akun · ${licMo(l)} bulan · ${rp(l.total)}</b><span class="tag${l.status==="diperpanjang"?" ok":l.status==="ditolak"?" no":""}">${licSt[l.status]||esc(l.status)}</span></div>
    <small class="mut">${l.ts&&l.ts.toDate?l.ts.toDate().toLocaleString("id-ID"):""} · ${rp(l.price)}/akun/bulan · untuk lisensi ${esc(src.id?licNo(src):"-")}</small>
    ${l.status==="menunggu"?payBox(l.total,true)+proofBox(l):""}
    ${l.status==="diperpanjang"?`<div class="lic-tok"><div>Disetujui <b>${licFd(l.approvedAt)}</b> · lisensi berlaku sampai <b>${licFd(l.newExpiresAt)}</b></div></div>`:""}
    ${l.status==="ditolak"&&l.note?`<small class="mut">Alasan: ${esc(l.note)}</small>`:""}
    ${typeof licDocs==="function"?licDocs(l):""}</div>`;
}
const licCalc=()=>{const q=Math.max(0,parseInt($("#lq").value)||0),m=Math.max(1,parseInt(($("#lm")||{}).value)||1);$("#lqt").textContent=rp(q*m*(+(TEN&&TEN.price)||3500))};
const licPayload=(qty,pr,mo=1)=>({tid:TENANT,tname:(TEN&&TEN.name)||"",qty,price:pr,months:mo,total:qty*pr*mo,status:"menunggu",ts:firebase.firestore.FieldValue.serverTimestamp(),by:ME.id,byName:ME.name||""});
async function licRequest(){
  const qty=parseInt($("#lq").value),pr=+(TEN&&TEN.price)||3500,mo=Math.max(1,parseInt(($("#lm")||{}).value)||1);
  if(!(qty>=1&&qty<=1000))return toast("Jumlah akun harus 1 sampai 1000");
  if(!await uiConfirm(`Ajukan ${qty} akun untuk ${mo} bulan?\nTotal ${rp(qty*pr*mo)} (${rp(pr)} per akun per bulan).`))return;
  await firebase.firestore().collection("licenses").add(licPayload(qty,pr,mo));
  toast("Permintaan terkirim. Silakan transfer sesuai petunjuk.");render();
}
async function licActivate(id){
  const f=firebase.firestore(),FV=firebase.firestore.FieldValue,lref=f.collection("licenses").doc(id),inp=String(($("#lt_"+id)||{}).value||"").trim().toUpperCase();
  const l=(await lref.get()).data();
  if(!l||l.status!=="terbit")return toast("Lisensi ini tidak bisa diaktifkan");
  if(inp!==String(l.token).toUpperCase())return toast("Token salah. Periksa kembali.");
  const b=f.batch(),exp=firebase.firestore.Timestamp.fromDate(licAddM(new Date(),licMo(l)));
  await loadTenant().catch(()=>{});const cur=TEN&&TEN.licUntil&&TEN.licUntil.toMillis?TEN.licUntil:firebase.firestore.Timestamp.fromMillis(0);
  b.update(lref,{status:"aktif",tokenInput:l.token,activatedAt:FV.serverTimestamp(),expiresAt:exp});
  // licUntil = batas akses pegawai (dibaca firestore.rules): yang paling akhir antara lisensi lama dan yang baru diaktifkan
  b.update(f.collection("tenants").doc(TENANT),{quota:FV.increment(l.qty),lastLic:id,licUntil:cur.toMillis()>=exp.toMillis()?cur:exp});
  await b.commit();toast(`Lisensi aktif: kuota bertambah ${l.qty} akun, berlaku ${licMo(l)} bulan`);render();
}
// pemberitahuan REALTIME: begitu Super Admin mengirim token, akun admin tenant langsung dapat toast + item di lonceng (tanpa menunggu login ulang)
let LICW=null,LICW_FIRST=true,LICW_SIG="";const LICW_SEEN=new Set();
function licWatch(){
  if(LICW||window.DEMO_ON||!ADMIN()||!TENANT)return;
  LICW=firebase.firestore().collection("licenses").where("tid","==",TENANT).onSnapshot(s=>{
    const ter=s.docs.filter(d=>d.data().status==="terbit");
    if(!LICW_FIRST)ter.filter(d=>!LICW_SEEN.has(d.id)).forEach(d=>{const l=d.data();toast(`🎫 Token lisensi dikirim: ${l.qty} akun · ${licMo(l)} bulan. Buka menu Lisensi untuk melihat token, unduh PDF & invoice.`)});
    if(!LICW_FIRST)s.docChanges().forEach(c=>{const l=c.doc.data();if(c.type==='modified'&&l.status==='diperpanjang')toast(`✅ Perpanjangan disetujui: lisensi berlaku sampai ${licFd(l.newExpiresAt)}.`);else if(c.type==='modified'&&l.status==='nonaktif')toast('⛔ Sebuah lisensi dinonaktifkan oleh penyedia layanan. Cek menu Lisensi.')});
    ter.forEach(d=>LICW_SEEN.add(d.id));LICW_FIRST=false;
    if(typeof nfRefresh==="function")nfRefresh(true);
    const sig=s.docs.map(d=>d.id+":"+d.data().status+":"+(d.data().proof?1:0)).sort().join("|");   // muat ulang halaman Lisensi hanya bila ada perubahan status
    if(sig!==LICW_SIG&&LICW_SIG!==""&&typeof view!=="undefined"&&view==="lisensi")render();LICW_SIG=sig;
  },e=>console.warn("Lisensi:",e));
}
auth.onAuthStateChanged(u=>{if(!u&&LICW){LICW();LICW=null;LICW_FIRST=true;LICW_SIG="";LICW_SEEN.clear()}});
// item lonceng: token yang sudah dikirim tapi belum diaktifkan (hilang sendiri setelah diaktifkan)
{const _nb=nfBuild;nfBuild=async function(){
  const L=await _nb();if(window.DEMO_ON||!ADMIN()||!TENANT)return L;
  try{const s=await firebase.firestore().collection("licenses").where("tid","==",TENANT).where("status","==","terbit").get();
    s.docs.forEach(d=>{const l=d.data(),t=l.sentAt&&l.sentAt.toMillis?l.sentAt.toMillis():Date.now();
      L.push({id:`lic:${d.id}:terbit`,t,ic:"🎫",title:"Token lisensi diterima",text:`${l.qty} akun · ${licMo(l)} bulan. Buka Lisensi untuk melihat token, unduh PDF token & invoice, lalu aktifkan.`,go:"lisensi"})});
    L.sort((a,b)=>b.t-a.t)}catch(e){}
  return L}}
// pemberitahuan saat login: token baru dari penyedia layanan
async function licBoot(){
  if(window.DEMO_ON||!ADMIN())return;
  try{await loadTenant();licWatch();await licSweep();if(!licValid(TEN))toast("🔒 Lisensi tidak aktif: akun pegawai & HR tidak bisa masuk sampai lisensi diperpanjang atau diaktifkan lagi. Buka menu Lisensi.");const c=firebase.firestore().collection("licenses"),s=await c.where("tid","==",TENANT).where("status","==","terbit").get();
    if(!s.empty)return toast("🎫 Lisensi baru diterima. Buka menu Lisensi lalu masukkan token untuk mengaktifkan.");
    const a=(await c.where("tid","==",TENANT).where("status","==","aktif").get()).docs.map(d=>d.data()).filter(l=>l.expiresAt).sort((x,y)=>x.expiresAt.toMillis()-y.expiresAt.toMillis())[0],d=a&&licLeft(a.expiresAt);
    if(!a){const ex=(await c.where("tid","==",TENANT).where("status","==","kedaluwarsa").get()).docs.map(x=>x.data()).filter(l=>l.kind!=="perpanjang").sort((x,y)=>licMs(y.expiresAt)-licMs(x.expiresAt))[0];if(ex)return toast(`⌛ Lisensi sudah berakhir (${licFd(ex.expiresAt)}). Buka menu Lisensi lalu klik Perpanjang.`)}
    if(a&&d<=7)toast(`⌛ Token lisensi berakhir ${d>0?"dalam "+d+" hari":"hari ini"} (${licFd(a.expiresAt)}). Ajukan perpanjangan di menu Lisensi.`)}catch(e){}
}

// ---------- Kunci akses pegawai bila lisensi tidak aktif / sudah berakhir ----------
// Penjagaan utama ada di firestore.rules (tenants/<kode>.licUntil). Kode ini hanya membuat pesan yang jelas dan mengeluarkan sesi yang sedang terbuka.
// Admin pelanggan TIDAK dikunci supaya tetap bisa membuka menu Lisensi untuk memperpanjang.
const licValid=t=>!!t&&t.status==="aktif"&&!!t.licUntil&&!!t.licUntil.toMillis&&t.licUntil.toMillis()>Date.now();
let LG=null,LG_T=null,LG_LAST=null;
function licLockShow(t){
  if(document.getElementById("lglock"))return;
  const off=t&&t.status!=="aktif",d=document.createElement("div");d.id="lglock";
  d.style.cssText="position:fixed;inset:0;z-index:10000;background:#0b1f3f;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif";
  d.innerHTML=`<div style="background:#fff;border-radius:16px;padding:28px;max-width:400px;width:100%;text-align:center"><div style="font-size:44px">🔒</div><h2 style="margin:8px 0 6px">Akses dikunci</h2><p style="color:#64748b;margin:0 0 16px;font-size:14px;line-height:1.55">${off?"Akun perusahaan ini sedang dinonaktifkan.":"Lisensi perusahaan sudah berakhir atau dinonaktifkan."} Akun pegawai tidak bisa dipakai sampai lisensi diperpanjang atau diaktifkan lagi. Silakan hubungi admin perusahaan Anda.</p><button id="lgre" style="width:100%;padding:12px;border:0;border-radius:10px;background:#f97316;color:#fff;font:inherit;font-weight:600;cursor:pointer">Coba lagi</button></div>`;
  document.body.appendChild(d);document.getElementById("lgre").onclick=()=>location.reload();
  try{reveal()}catch(e){}
}
function licLockNow(t){
  try{if(LG){LG();LG=null}}catch(e){}clearInterval(LG_T);LG_T=null;
  try{auth.signOut()}catch(e){}licLockShow(t);
}
// dipanggil setelah sukses membaca profil (pegawai/HR) atau saat membaca profil ditolak database: true = akses dikunci
async function licGuard(denied){
  if(window.DEMO_ON||!TENANT)return false;
  let t=null;try{const d=await firebase.firestore().collection("tenants").doc(TENANT).get();t=d.exists?d.data():null}catch(e){return false}
  if(licValid(t))return false;
  if(!denied&&ADMIN())return false;
  licLockNow(t);return true;
}
function licGuardWatch(){
  if(LG||window.DEMO_ON||!TENANT||ADMIN())return;
  const chk=()=>{if(LG_LAST&&!licValid(LG_LAST))licLockNow(LG_LAST)};
  LG=firebase.firestore().collection("tenants").doc(TENANT).onSnapshot(s=>{LG_LAST=s.exists?s.data():null;chk()},()=>{});
  LG_T=setInterval(chk,20000);   // lisensi habis tepat waktu walau tidak ada perubahan data
}
auth.onAuthStateChanged(u=>{if(!u&&LG){try{LG()}catch(e){}LG=null;clearInterval(LG_T);LG_T=null;LG_LAST=null}});
// ---------- sambungan awal ----------
if(!window.DEMO_ON){if(!TENANT)document.addEventListener("DOMContentLoaded",()=>tenantGate());else loadTenant().catch(e=>{const g=()=>tenantGate(e.message);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g()})}
