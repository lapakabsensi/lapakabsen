// ===== Foto di Firebase Storage (bukan base64 di dokumen Firestore) =====
// Dokumen Firestore hanya menyimpan PATH file, mis. "bukti/<uid>/att_2026-11-05_in.jpg" (foto absen/lampiran, dihapus otomatis oleh lifecycle bucket) atau "photos/<uid>/avatar_….jpg" (profil/wajah). Foto lama yang masih berupa teks base64 ("data:image/...")
// tetap tampil seperti biasa, dan bisa dipindahkan sekaligus lewat Pengaturan -> "Pindahkan foto lama ke Storage".
// Kalau upload gagal (offline / aturan Storage belum dipasang) foto otomatis disimpan lama (base64) supaya absen tidak terblokir.
// Dimuat setelah app.js; fungsi dipakai saat runtime oleh extra.js, field.js, cuti.js, dash.js, ui.js.
const PH_BLANK="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const phInline=v=>typeof v==="string"&&/^(data:|https?:)/.test(v);
const phSrc=v=>!v?"":phInline(v)?v:PH_BLANK;                       // nilai src untuk <img>
const phAttr=v=>v&&!phInline(v)?` data-sp="${esc(v)}"`:"";         // penanda path Storage; diisi otomatis oleh phHydrate
const PH_URL=new Map();
function phUrl(v){
  if(!v||phInline(v))return Promise.resolve(v||"");
  if(typeof firebase.storage!=="function")return Promise.reject(new Error("Storage tidak tersedia"));
  if(!PH_URL.has(v))PH_URL.set(v,sref(v).getDownloadURL().catch(e=>{PH_URL.delete(v);throw e}));
  return PH_URL.get(v);
}
const phGone=e=>!!e&&e.code==="storage/object-not-found";
function phHydrate(root){
  (root||document).querySelectorAll("img[data-sp]").forEach(im=>{
    const p=im.getAttribute("data-sp");im.removeAttribute("data-sp");
    phUrl(p).then(u=>{im.src=u}).catch(e=>{im.title=phGone(e)?"Foto sudah dihapus otomatis (lebih dari 3 bulan)":"Foto tidak dapat dimuat";im.style.background="#e2e8f0"});
  });
}
// semua <img data-sp> yang muncul di halaman (termasuk jendela popup) otomatis diisi
let PH_T=0;new MutationObserver(()=>{if(PH_T)return;PH_T=requestAnimationFrame(()=>{PH_T=0;phHydrate(document)})}).observe(document.documentElement,{childList:true,subtree:true});

// Unggah foto (data URL) ke Storage. Mengembalikan path file, atau data URL aslinya kalau gagal.
async function savePhoto(dataUrl,name,uid){
  if(!dataUrl||!/^data:/.test(dataUrl))return dataUrl||"";
  uid=uid||(ME&&ME.id);
  if(window.DEMO_ON||window.NO_STORAGE||!uid||typeof firebase.storage!=="function")return dataUrl;
  const path=`${/^(att|lap|req)_/.test(name)?"bukti":"photos"}/${uid}/${name}`; // bukti/ = foto yang terhapus otomatis (lifecycle 90 hari); photos/ = foto profil & wajah (permanen)
  try{
    const up=sref(path).putString(dataUrl,"data_url",{cacheControl:"private,max-age=31536000"});
    await Promise.race([up,new Promise((_,no)=>setTimeout(()=>no(new Error("Upload foto terlalu lama")),25000))]);
    return path;
  }catch(e){console.warn("Upload foto ke Storage gagal, foto disimpan di dokumen:",e);return dataUrl}
}
const delPhoto=v=>{if(v&&!phInline(v)&&typeof firebase.storage==="function")sref(v).delete().catch(()=>{})};

// ---------- Foto profil ----------
async function setAvatar(inp){
  const f=inp.files[0];if(!f)return;
  try{
    const a=await imgData(f,160,true),old=ME.avatar,v=await savePhoto(a,`avatar_${Date.now()}.jpg`);
    await db.collection("users").doc(ME.id).update({avatar:v});ME.avatar=v;delPhoto(old);userUI();
    toast(TT("Foto profil diperbarui","Profile photo updated","头像已更新"));
  }catch(e){toast("Gagal: "+e.message)}
  inp.value="";
}

// ---------- Pindahkan foto lama (base64) ke Storage: khusus admin ----------
const MIG_FIELDS={attendance:["inPhoto","midPhoto","aftPhoto","outPhoto"],requests:["photo","lampiran","surat"],users:["avatar","facePhoto"]};
const migBox=()=>ADMIN()&&!window.DEMO_ON&&!window.NO_STORAGE?`<div class="box"><h3>Pindahkan foto lama ke Storage</h3>
  <p class="mut" style="margin-bottom:12px">Foto absen, lampiran, foto profil, dan foto wajah yang dulu tersimpan sebagai teks di database dipindahkan ke Firebase Storage supaya database tetap ringan. Aman dijalankan berulang: foto yang sudah dipindah dilewati. Biarkan halaman ini terbuka sampai selesai.</p>
  <button class="btn" id="migBtn" onclick="migrasiFoto()">☁️ Mulai pindahkan</button> <span id="migSt" class="mut" style="margin-left:8px"></span></div>`:"";
async function migrasiFoto(){
  if(!ADMIN()||window.DEMO_ON)return;
  if(typeof firebase.storage!=="function")return toast("Library Firebase Storage belum termuat. Muat ulang halaman.");
  if(!await uiConfirm("Pindahkan semua foto lama ke Firebase Storage sekarang?\nPastikan aturan Storage (storage.rules) sudah dipublikasikan."))return;
  const st=$("#migSt"),btn=$("#migBtn");btn.disabled=true;let scan=0,moved=0,docs=0,fail=0;
  try{
    for(const col of Object.keys(MIG_FIELDS)){
      let last=null;
      for(;;){
        let q=db.collection(col).orderBy(firebase.firestore.FieldPath.documentId()).limit(100);if(last)q=q.startAfter(last);
        const s=await q.get();if(s.empty)break;
        for(const d of s.docs){
          scan++;const x=d.data(),up={};
          for(const f of MIG_FIELDS[col]){
            const v=x[f];if(typeof v!=="string"||!v.startsWith("data:image"))continue;
            const uid=col==="users"?d.id:x.uid;if(!uid){fail++;continue}
            const nm=col==="attendance"?`att_${x.date||d.id}_${f.replace("Photo","")}.jpg`:col==="users"?`${f==="avatar"?"avatar":"face"}_${Date.now()}.jpg`:`req_${d.id}_${f}.jpg`;
            const p=await savePhoto(v,nm,uid);
            if(p&&!phInline(p)){up[f]=p;moved++}else fail++;
          }
          if(Object.keys(up).length){await d.ref.update(up);docs++}
          if(scan%10===0)st.textContent=`Memeriksa ${scan} dokumen · ${moved} foto dipindah…`;
        }
        last=s.docs[s.docs.length-1];if(s.size<100)break;
      }
    }
    st.textContent=`Selesai: ${moved} foto dipindah dari ${docs} dokumen (${scan} diperiksa)${fail?` · ${fail} gagal (cek aturan Storage lalu jalankan lagi)`:""}.`;
    toast(`${moved} foto dipindah ke Storage`);
  }catch(e){st.textContent="Berhenti: "+errMsg(e);toast("Migrasi berhenti: "+errMsg(e))}
  btn.disabled=false;
}
{const _s=V.setting;V.setting=async()=>(await _s())+migBox()}

// ---------- Hapus foto lama otomatis (tanpa Storage lifecycle, jadi jalan juga di paket gratis) ----------
// Foto absen / absen lapangan / lampiran yang umurnya lebih dari N hari (default 90) dihapus dari dokumennya (dan dari Storage kalau path).
// Data absen (jam, status, lokasi) tetap utuh. Dijalankan otomatis sekali sehari saat admin membuka aplikasi; bisa juga manual di Pengaturan.
// Posisi terakhir yang sudah dibersihkan disimpan di settings/purge supaya tiap proses hanya memindai data baru.
const PURGE_ATT=["inPhoto","midPhoto","aftPhoto","outPhoto"],PURGE_REQ=["photo","lampiran","surat"];
const ymdLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
async function purgeFoto(manual){
  if(!ADMIN()||window.DEMO_ON)return;
  const ref=db.collection("settings").doc("purge"),ps=await ref.get(),P=ps.exists?ps.data():{};
  if(!manual&&P.ranAt&&Date.now()-P.ranAt<20*36e5)return;
  const days=Math.max(30,+P.days||90),cutMs=Date.now()-days*864e5,cutD=ymdLocal(new Date(cutMs)),fromD=P.upToDate||"";
  const DEL=firebase.firestore.FieldValue.delete();let n=0,docs=0,reqStop=cutMs;
  const wipe=async(d,x,fields)=>{const up={};fields.forEach(f=>{if(typeof x[f]==="string"&&x[f]){up[f]=DEL;delPhoto(x[f]);n++}});if(Object.keys(up).length){await d.ref.update(up);docs++}};
  // absensi: pakai tanggal absen
  let q0=db.collection("attendance");if(fromD)q0=q0.where("date",">=",fromD);q0=q0.where("date","<",cutD).orderBy("date");let last=null;
  for(;;){
    const s=await(last?q0.startAfter(last):q0).limit(200).get();if(s.empty)break;
    for(const d of s.docs){const x=d.data();if(x.date&&x.date<cutD&&(!fromD||x.date>=fromD))await wipe(d,x,PURGE_ATT)}
    last=s.docs[s.docs.length-1];if(s.size<200)break;
  }
  // pengajuan: pakai waktu dibuat; yang masih menunggu tidak disentuh dan menahan penanda supaya diperiksa lagi nanti
  let q1=db.collection("requests");if(P.upToMs)q1=q1.where("createdAt",">=",P.upToMs);q1=q1.where("createdAt","<",cutMs).orderBy("createdAt");last=null;
  for(;;){
    const s=await(last?q1.startAfter(last):q1).limit(200).get();if(s.empty)break;
    for(const d of s.docs){const x=d.data();if(!(x.createdAt<cutMs))continue;if(x.status==="menunggu"){reqStop=Math.min(reqStop,x.createdAt);continue}await wipe(d,x,PURGE_REQ)}
    last=s.docs[s.docs.length-1];if(s.size<200)break;
  }
  await ref.set({...P,days,upToDate:cutD,upToMs:reqStop,ranAt:Date.now(),lastCount:n,lastDocs:docs},{merge:true});
  if(manual)toast(n?`${n} foto lama dihapus dari ${docs} dokumen`:"Tidak ada foto yang perlu dihapus");
  return n;
}
async function purgeNow(){
  const b=$("#pgBtn"),st=$("#pgSt");b.disabled=true;st.textContent="Memproses…";
  try{const d=Math.max(30,+$("#pgDays").value||90);await db.collection("settings").doc("purge").set({days:d},{merge:true});
    if(!await uiConfirm(`Hapus semua foto absen & lampiran yang lebih dari ${d} hari? Data absen tetap ada, hanya fotonya yang hilang. Tidak bisa dibatalkan.`)){st.textContent="";b.disabled=false;return}
    const n=await purgeFoto(true);st.textContent=`Selesai: ${n||0} foto dihapus.`}
  catch(e){st.textContent="Gagal: "+errMsg(e)}
  b.disabled=false;
}
const purgeBox=async()=>{if(!ADMIN()||window.DEMO_ON)return"";let P={};try{const s=await db.collection("settings").doc("purge").get();if(s.exists)P=s.data()}catch(e){}
  return `<div class="box"><h3>Hapus foto lama otomatis</h3>
  <p class="mut" style="margin-bottom:12px">Foto absen, absen lapangan, dan lampiran pengajuan yang sudah lebih dari batas hari di bawah dihapus otomatis (dicek sekali sehari saat admin membuka aplikasi), supaya database tetap ringan. Data absen (jam, status, lokasi) tetap utuh. Foto profil dan foto wajah tidak ikut dihapus.</p>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">Simpan foto selama <input id="pgDays" type="number" min="30" value="${Math.max(30,+P.days||90)}" style="width:80px"> hari
  <button class="btn" id="pgBtn" onclick="purgeNow()">🧹 Hapus sekarang</button><span id="pgSt" class="mut">${P.ranAt?`Terakhir dicek ${new Date(P.ranAt).toLocaleString("id-ID")}${P.lastCount?` · ${P.lastCount} foto dihapus`:""}`:""}</span></div></div>`};
{const _s2=V.setting;V.setting=async()=>(await _s2())+(await purgeBox())}
function sref(p){const st=firebase.storage();if(window.DEMO_ON||!TENANT)return st.ref(p);const i=p.indexOf("/");return st.ref(p.slice(0,i)+"/"+TENANT+p.slice(i))}
