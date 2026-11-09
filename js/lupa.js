// ===== Lupa password: permintaan ke admin -> kode dikirim admin lewat WhatsApp -> pengguna login pakai kode lalu buat password baru =====
// Alur (tanpa server / Cloud Functions):
//  1. Pengguna klik "Lupa password?" di halaman login, isi email -> dokumen resetReq/{email} dibuat (status menunggu) + lonceng admin menyala.
//  2. Admin (menu Password) menekan "Setujui & buat kode". Aplikasi memakai salinan password tersinkron (credentials) untuk masuk sebagai
//     akun itu di aplikasi sekunder, mengganti passwordnya menjadi KODE acak 8 karakter, dan menandai akun wajib ganti password (pwDone=false).
//  3. Admin mengirim kode lewat WhatsApp ke nomor HP yang terdaftar (tombol langsung membuka WhatsApp dengan pesan siap kirim).
//  4. Pengguna login dengan email + kode sebagai password -> otomatis masuk halaman "Setup Akun" untuk membuat password baru.
// Dimuat setelah password.js (pakai pwDlg, pwClose, secApp, credSync, PWU, PWC, uiConfirm, toast, esc).
const LP_CH="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const lpCode=()=>{const a=new Uint32Array(8);crypto.getRandomValues(a);return[...a].map(x=>LP_CH[x%LP_CH.length]).join("")};
const lpWa=n=>{let d=String(n||"").replace(/\D/g,"");if(d.startsWith("0"))d="62"+d.slice(1);else if(d.startsWith("8"))d="62"+d;return d};
let LPR=[];

// ---------- Sisi pengguna (halaman login) ----------
function lupaOpen(){
  const em=($("#em").value||"").trim();
  pwDlg(`<div class="row"><h3 style="margin:0">🔑 Lupa password</h3><button class="btn ghost sm" onclick="pwClose()">✕</button></div>
  <div id="lpBody"><p class="mut" style="margin:8px 0 14px">Masukkan email akunmu. Permintaan dikirim ke admin. Setelah admin menyetujui, kamu menerima <b>kode</b> lewat WhatsApp ke nomor HP yang terdaftar. Login dengan email dan kode itu sebagai password, lalu buat password baru.</p>
  <div class="f"><label>Email</label><input id="lp_em" type="email" autocomplete="username" value="${esc(em)}"></div>
  <button class="btn" id="lp_ok" style="width:100%" onclick="lupaSend()">Kirim permintaan ke admin</button>
  <p class="mut" style="margin:14px 0 6px"><small>Akun admin, atau email kamu aktif? Link reset bisa dikirim langsung ke email.</small></p>
  <button class="btn ghost sm" onclick="lupaEmail()">✉️ Kirim link reset lewat email</button></div>`);
}
async function lupaSend(){
  const em=($("#lp_em").value||"").trim().toLowerCase(),b=$("#lp_ok");
  if(!/^\S+@\S+\.\S+$/.test(em))return toast("Isi email dengan benar");
  b.disabled=true;
  try{
    const ref=db.collection("resetReq").doc(em),ex=await ref.get();
    if(!ex.exists)await ref.set({email:em,at:Date.now(),status:"menunggu"});
    $("#lpBody").innerHTML=`<div style="text-align:center;padding:10px 0"><div style="font-size:40px">📨</div><h3 style="margin:8px 0">${ex.exists?"Permintaan sudah dikirim":"Permintaan terkirim"}</h3>
    <p class="mut">Admin sudah diberi tahu. Tunggu kode dari admin lewat <b>WhatsApp</b>. Setelah kode diterima, login dengan <b>email</b> dan <b>kode itu sebagai password</b>, lalu buat password baru.</p>
    <button class="btn" style="width:100%;margin-top:14px" onclick="pwClose()">Mengerti</button></div>`;
  }catch(e){b.disabled=false;toast("Gagal mengirim permintaan: "+(e.code==="permission-denied"?"admin belum mempublikasikan firestore.rules terbaru":e.message))}
}
async function lupaEmail(){
  const em=($("#lp_em").value||"").trim();if(!/^\S+@\S+\.\S+$/.test(em))return toast("Isi email dengan benar");
  try{await auth.sendPasswordResetEmail(em)}catch(e){if(e.code!=="auth/user-not-found")return toast(pwErr(e))}
  toast("Jika email terdaftar, link reset sudah dikirim. Cek kotak masuk / spam.");pwClose();
}

// ---------- Sisi admin (menu Password) ----------
async function lpBox(){
  if(!ADMIN())return"";
  try{LPR=(await get("resetReq")).sort((a,b)=>(a.at||0)-(b.at||0))}catch(e){LPR=[];return`<div class="box"><h3>Permintaan lupa password</h3><p class="warn">Tidak bisa dibaca. Publikasikan firestore.rules terbaru di Firebase Console.</p></div>`}
  if(!LPR.length)return`<div class="box"><h3 style="margin-bottom:4px">Permintaan lupa password</h3>${emptyBox("🔑","Tidak ada permintaan lupa password")}</div>`;
  const rows=LPR.map(r=>{const u=PWU.find(x=>(x.email||"").toLowerCase()===r.id);
    return`<tr><td>${u?`<b>${esc(u.name)}</b><br>`:'<span class="warn">Email tidak terdaftar</span><br>'}<small class="mut">${esc(r.email)}</small></td><td>${u?esc(u.wa||"-"):"-"}${u&&!u.wa?'<br><small class="warn">⚠ nomor WA kosong</small>':""}</td><td><small>${ago(r.at||Date.now())}</small></td>
    <td class="act">${u?`<button class="btn sm" onclick="lpApprove('${esc(r.id)}')">✅ Setujui & buat kode</button> `:""}<button class="btn ghost sm" onclick="lpDel('${esc(r.id)}')">${u?"Tolak":"Hapus"}</button></td></tr>`}).join("");
  return`<div class="box" style="border-left:4px solid var(--ac)"><h3 style="margin-bottom:4px">🔑 Permintaan lupa password <span class="tag">${LPR.length}</span></h3>
  <p class="mut" style="margin-bottom:12px">Pastikan permintaan benar dari pemilik akun (mis. konfirmasi langsung). Setelah disetujui, password akun diganti dengan kode acak dan harus dikirim ke WhatsApp pemiliknya. Pengguna lalu login dengan kode itu dan wajib membuat password baru.</p>
  <div class="tw"><table><tr><th>Akun</th><th>No. WhatsApp</th><th>Diminta</th><th></th></tr>${rows}</table></div></div>`;
}
async function lpDel(id){
  if(!await uiConfirm("Hapus permintaan ini?"))return;
  try{await db.collection("resetReq").doc(id).delete();toast("Permintaan dihapus");nfRefresh(true);render()}catch(e){toast(e.message)}
}
async function lpApprove(id){
  const u=PWU.find(x=>(x.email||"").toLowerCase()===id);if(!u)return toast("Email belum terdaftar sebagai akun");
  const c=PWC[u.id],mailFallback=async why=>{if(await uiConfirm(why+`\n\nKirim link reset ke ${u.email} sebagai gantinya?`)){try{await auth.sendPasswordResetEmail(u.email);toast("Link reset dikirim ke "+u.email)}catch(e){toast(pwErr(e))}}};
  if(!c)return mailFallback("Password "+u.name+" belum tersinkron ke daftar admin, jadi kode tidak bisa dibuat otomatis.");
  if(!await uiConfirm(`Buat kode reset untuk ${u.name}?\nPassword akun ini akan diganti kode acak baru dan ${u.name} wajib membuat password baru saat login. Kirim kodenya lewat WhatsApp.`))return;
  const code=lpCode();
  try{const a=secApp().auth();try{await a.signInWithEmailAndPassword(u.email,c.pw);await a.currentUser.updatePassword(code)}finally{try{await a.signOut()}catch(_){}}}
  catch(e){return mailFallback(["auth/wrong-password","auth/invalid-credential"].includes(e.code)?"Password tersimpan tidak cocok (kemungkinan diganti di luar aplikasi).":pwErr(e))}
  await credSync(code,u.id,u.email,"admin");
  try{await db.collection("users").doc(u.id).update({pwDone:false})}catch(e){}
  try{await db.collection("resetReq").doc(id).delete()}catch(e){}
  nfRefresh(true);lpShow(u,code);
}
function lpShow(u,code){
  const msg=`Halo ${u.name}, kode reset password akun ${(COMP&&COMP.name)||"Absensi"} kamu: ${code}\n\nLogin dengan email kamu dan kode ini sebagai password, lalu buat password baru. Jangan bagikan kode ini ke siapa pun.`,wa=lpWa(u.wa);
  pwDlg(`<div class="row"><h3 style="margin:0">✅ Kode reset dibuat</h3><button class="btn ghost sm" onclick="pwClose();render()">✕</button></div>
  <p class="mut" style="margin:6px 0 10px"><b>${esc(u.name)}</b> · ${esc(u.email)}</p>
  <div style="font:700 30px/1.2 ui-monospace,Consolas,monospace;letter-spacing:4px;text-align:center;background:var(--bg);border-radius:12px;padding:16px;margin-bottom:12px;user-select:all">${code}</div>
  ${wa?`<a class="btn" style="width:100%;display:block;text-align:center;text-decoration:none;margin-bottom:8px" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}">📲 Kirim via WhatsApp (${esc(u.wa)})</a>`:`<p class="warn" style="margin-bottom:8px">⚠ Nomor WhatsApp ${esc(u.name)} belum diisi di menu Karyawan. Sampaikan kode ini lewat cara lain.</p>`}
  <button class="btn ghost" style="width:100%" onclick="navigator.clipboard.writeText(${esc(JSON.stringify(msg))}).then(()=>toast('Pesan disalin'),()=>toast('Gagal menyalin'))">📋 Salin pesan</button>
  <p class="mut" style="margin-top:12px"><small>${u.role==="admin"?"Akun admin tidak dipaksa ganti password. Minta pemiliknya segera menggantinya lewat menu foto profil → Ganti password. ":""}Kode ini juga tampil di kolom "Password saat ini" sampai pengguna menggantinya.</small></p>`);
}
{const _pv=V.password;V.password=async()=>{const h=await _pv();if(!ADMIN())return h;const b=await lpBox();return h.replace('<div class="box">',b+'<div class="box">')}}
Object.assign(DICT,{"Lupa password?":["Forgot password?","忘记密码？"]});
