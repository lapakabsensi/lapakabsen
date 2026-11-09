// ===== Password: ganti password sendiri (semua akun) + menu admin untuk mengelola password semua akun =====
// Dimuat setelah app.js. Salinan password tiap akun disimpan di koleksi `credentials/{uid}` yang HANYA bisa dibaca admin
// (lihat firestore.rules). Salinan itu otomatis diperbarui setiap kali: pemilik akun login, pemilik akun ganti password,
// atau admin mengganti password akun tersebut. Karena itu admin selalu melihat password terbaru ("sinkron").
const CRED=()=>db.collection("credentials");
const pwErr=e=>["auth/wrong-password","auth/invalid-credential"].includes(e.code)?"Password lama salah":e.code==="auth/too-many-requests"?"Terlalu banyak percobaan, coba lagi beberapa menit lagi":e.code==="auth/weak-password"?"Password baru minimal 6 karakter":(e.message||String(e));
async function credSync(pw,uid,email,by){
  try{const u=auth.currentUser;uid=uid||(u&&u.uid);if(!uid||!pw)return false;
    await CRED().doc(uid).set({pw,email:email||(u&&u.email)||"",updatedAt:Date.now(),by:by||"self"});return true}
  catch(e){return false}
}
const secApp=()=>firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(firebaseConfig,"sec");

// ---------- Dialog kecil ----------
function pwDlg(html){
  pwClose();const o=document.createElement("div");o.className="zoom absd";o.id="pwdlg";
  o.innerHTML=`<div class="box absd-c" onclick="event.stopPropagation()">${html}</div>`;document.body.appendChild(o);tr(o);
  const f=o.querySelector("input:not([readonly])");if(f)f.focus();
}
const pwClose=()=>{const o=document.getElementById("pwdlg");if(o)o.remove()};
function pwToggle(cb){document.querySelectorAll("#pwdlg input.pwf").forEach(i=>i.type=cb.checked?"text":"password")}
const pwField=(id,l,v="",ac="new-password")=>`<div class="f"><label>${l}</label><input id="${id}" class="pwf" type="password" autocomplete="${ac}" value="${esc(v)}"></div>`;
const pwShowCb=()=>`<label class="rem" style="margin:2px 0 12px"><input type="checkbox" onchange="pwToggle(this)"> Tampilkan password</label>`;
const demoNote=email=>window.DEMO_ON&&window.DEMO?`<p class="mut" style="margin:0 0 10px"><small>🎮 Demo: password saat ini = <b>${esc(DEMO.pwOf(email)||"-")}</b></small></p>`:"";

// ---------- Ganti password akun sendiri (semua role, dari menu foto profil) ----------
function pwSelf(){
  const m=document.getElementById("umenu");if(m)m.classList.remove("show");
  pwDlg(`<div class="row"><h3 style="margin:0">🔑 Ganti password</h3><button class="btn ghost sm" onclick="pwClose()">✕</button></div>
  <p class="mut" style="margin:6px 0 14px">${esc(ME.name)} · ${esc(auth.currentUser?auth.currentUser.email:"")}</p>${demoNote(auth.currentUser&&auth.currentUser.email)}
  ${pwField("pw_old","Password lama","","current-password")}${pwField("pw_new","Password baru (min 6)")}${pwField("pw_new2","Ulangi password baru")}${pwShowCb()}
  <button class="btn" id="pw_ok" style="width:100%" onclick="pwSelfSave()">Simpan password</button>`);
}
async function pwSelfSave(){
  const o=$("#pw_old").value,n=$("#pw_new").value,n2=$("#pw_new2").value,u=auth.currentUser,b=$("#pw_ok");
  if(!o)return toast("Isi password lama");
  if(n.length<6)return toast("Password baru minimal 6 karakter");
  if(n!==n2)return toast("Ulangi password baru tidak sama");
  if(n===o)return toast("Password baru harus berbeda dari yang lama");
  b.disabled=true;
  try{await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,o));await u.updatePassword(n)}
  catch(e){b.disabled=false;return toast(pwErr(e))}
  const ok=await credSync(n,ME.id,u.email,"self");
  try{if(!ADMIN()&&!ME.pwDone){await db.collection("users").doc(ME.id).update({pwDone:true});ME.pwDone=true}}catch(e){}
  pwClose();toast(ok?"Password diganti ✅ Admin otomatis ikut tersinkron":"Password diganti ✅ (sinkron ke admin gagal: minta admin mempublikasikan firestore.rules terbaru)");
  if(view==="setup")render();
}

// ---------- Menu admin: kelola password semua akun ----------
let PWU=[],PWC={};
const ROLE_ORD={admin:0,hr:1,atasan:2,karyawan:3};
async function passwordView(){
  if(!ADMIN())return`<div class="box">Menu ini hanya untuk admin.</div>`;
  const[us,cr]=await Promise.all([get("users"),get("credentials").catch(()=>[])]);
  PWU=us.sort((a,b)=>(ROLE_ORD[a.role||"karyawan"]-ROLE_ORD[b.role||"karyawan"])||String(a.name).localeCompare(String(b.name)));
  PWC=Object.fromEntries(cr.map(c=>[c.id,c]));
  const rows=PWU.map(u=>{const c=PWC[u.id],me=u.id===ME.id;
    return`<tr class="pwr" data-s="${esc([u.name,u.email,u.role,u.jabatan,u.dept].join(" ").toLowerCase())}"><td>${esc(u.name)}${me?' <span class="tag ok">Kamu</span>':""}<br><small class="mut">${esc(u.email)}</small></td><td>${esc(u.role||"karyawan")}<br><small class="mut">${esc(u.jabatan||"")}</small></td>
    <td>${c?`<span class="pwv" id="pwv_${u.id}">••••••••</span> <button class="btn ghost sm" onclick="pwReveal('${u.id}')" title="Lihat / sembunyikan">👁️</button> <button class="btn ghost sm" onclick="pwCopy('${u.id}')" title="Salin password">📋</button>`:'<span class="warn">belum tersinkron</span><br><small class="mut">muncul otomatis setelah akun ini login / ganti password</small>'}</td>
    <td>${c&&c.updatedAt?`<small>${new Date(c.updatedAt).toLocaleString("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</small><br><small class="mut">oleh ${c.by==="admin"?"admin":"pemilik akun"}</small>`:"-"}</td>
    <td class="act"><button class="btn sm" onclick="pwAdmin('${u.id}')">🔑 Ganti password</button></td></tr>`}).join("");
  return head("Password","Kelola password semua akun, termasuk akun admin")
  +`<div class="box"><p class="mut" style="margin-bottom:12px">Setiap akun bisa mengganti passwordnya sendiri lewat menu foto profil → <b>Ganti password</b>. Perubahan itu otomatis tersinkron ke halaman ini. Admin juga bisa mengganti password akun mana pun (termasuk admin sendiri) di sini.</p>
  <div class="kbar"><div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Cari nama, email, role..." oninput="pwFilter(this.value)"></div><small class="mut" id="pwcount">${PWU.length} akun</small></div>
  <div class="tw"><table><tr><th>Akun</th><th>Role</th><th>Password saat ini</th><th>Terakhir diubah</th><th></th></tr>${rows}</table></div></div>`;
}
function pwFilter(q){q=q.trim().toLowerCase();let n=0;document.querySelectorAll("tr.pwr").forEach(r=>{const on=!q||r.dataset.s.includes(q);r.style.display=on?"":"none";if(on)n++});const c=$("#pwcount");if(c)c.textContent=n+" akun"}
function pwReveal(id){const e=document.getElementById("pwv_"+id),c=PWC[id];if(!e||!c)return;const hid=e.textContent.startsWith("•");e.textContent=hid?c.pw:"••••••••";e.title=hid?c.pw:""}
async function pwCopy(id){const c=PWC[id];if(!c)return;try{await navigator.clipboard.writeText(c.pw);toast("Password disalin")}catch(e){toast("Gagal menyalin, klik 👁️ lalu salin manual")}}

function pwAdmin(id){
  const u=PWU.find(x=>x.id===id);if(!u)return;const c=PWC[id],me=id===ME.id;
  pwDlg(`<div class="row"><h3 style="margin:0">🔑 Ganti password</h3><button class="btn ghost sm" onclick="pwClose()">✕</button></div>
  <p class="mut" style="margin:6px 0 14px"><b>${esc(u.name)}</b>${me?" (akun kamu)":""} · ${esc(u.email)}</p>
  ${pwField("pw_old","Password saat ini"+(c?" (terisi otomatis dari data tersinkron)":" (belum tersinkron, isi jika kamu tahu)"),c?c.pw:"","current-password")}
  ${pwField("pw_new","Password baru (min 6)")}${pwField("pw_new2","Ulangi password baru")}${pwShowCb()}
  <button class="btn" id="pw_ok" style="width:100%" onclick="pwAdminSave('${id}')">Simpan password</button>
  <p class="mut" style="margin:14px 0 6px"><small>Tidak tahu password saat ini? Kirim email reset ke ${esc(u.email)}, lalu pemilik akun membuat password baru sendiri dari link di email tersebut.</small></p>
  <button class="btn ghost sm" onclick="pwReset('${id}')">✉️ Kirim email reset password</button>`);
}
async function pwAdminSave(id){
  const u=PWU.find(x=>x.id===id),o=$("#pw_old").value,n=$("#pw_new").value,n2=$("#pw_new2").value,b=$("#pw_ok");
  if(!o)return toast("Isi password saat ini (atau kirim email reset)");
  if(n.length<6)return toast("Password baru minimal 6 karakter");
  if(n!==n2)return toast("Ulangi password baru tidak sama");
  if(n===o)return toast("Password baru harus berbeda dari yang lama");
  b.disabled=true;
  try{
    if(id===ME.id){const c=auth.currentUser;await c.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(c.email,o));await c.updatePassword(n)}
    else{
      const a=secApp().auth();
      try{await a.signInWithEmailAndPassword(u.email,o);await a.currentUser.updatePassword(n)}finally{try{await a.signOut()}catch(_){}}
    }
  }catch(e){b.disabled=false;
    return toast(["auth/wrong-password","auth/invalid-credential"].includes(e.code)?"Password saat ini salah. Isi yang benar, atau kirim email reset.":pwErr(e))}
  const ok=await credSync(n,id,u.email,"admin");
  pwClose();toast(ok?`Password ${u.name} diganti ✅`:"Password diganti ✅ tapi gagal disimpan di daftar (publikasikan firestore.rules terbaru)");render();
}
async function pwReset(id){
  const u=PWU.find(x=>x.id===id);if(!u)return;
  if(!await uiConfirm(`Kirim email reset password ke ${u.email}?`))return;
  try{await auth.sendPasswordResetEmail(u.email);toast("Email reset terkirim ke "+u.email)}catch(e){toast(pwErr(e))}
}
V.password=passwordView;
Object.assign(DICT,{"Password":["Password","密码"],"Ganti password":["Change password","修改密码"]});
