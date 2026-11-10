// ===== Audit log (siapa mengubah apa) + Backup / Export seluruh data: khusus admin =====
// Dimuat setelah app.js (butuh db, ME, V, ADM, UF, USERS, csv, esc, head, toast).
//
// AUDIT LOG
//  - Semua tulisan Firestore (set / update / delete / add / batch) dibungkus di tingkat library, jadi seluruh fitur yang ada
//    (karyawan, penggajian, persetujuan, jadwal, pengaturan, dll.) otomatis tercatat tanpa mengubah file lain.
//  - Satu entri = siapa (uid, nama, role), kapan (waktu server), apa (koleksi + dokumen), dan perubahan field "lama -> baru".
//    Nilai lama hanya tersedia bila yang mengubah admin (dokumen dibaca dulu sebelum ditulis).
//  - Tidak dicatat: absen masuk/pulang sendiri (terlalu ramai), sinkron password saat login, penghapusan foto otomatis, dan koleksi audit itu sendiri.
//  - Nilai rahasia (password, data wajah, PIN) dan foto TIDAK pernah ditulis ke log; hanya tertulis "[disembunyikan]" / "[foto]".
//  - Entri tidak bisa diubah/dihapus dari aplikasi (lihat firestore.rules).
//
// BACKUP / EXPORT
//  - Menu "Backup": unduh seluruh data (JSON) atau per koleksi (CSV). Koleksi "credentials" (salinan password) tidak pernah ikut.
(function(){
  const tpath=p=>String(p||"").replace(/^tenants\/[^/]+\//,"");   // data tiap pelanggan ada di tenants/<kode>/<koleksi>
  const COLN={users:"Karyawan",attendance:"Absensi",requests:"Pengajuan",settings:"Pengaturan",schedules:"Jadwal Shift",payslips:"Slip Gaji",credentials:"Password",meta:"Setup",audit:"Audit Log"};
  const ACTN={create:"Tambah",update:"Ubah",set:"Simpan",delete:"Hapus",batch:"Massal",export:"Ekspor"};
  const SECRET=/^(pw|password|faceDesc|faceDescPending|slipPin)$/;
  const PHOTOK=new Set(["inPhoto","midPhoto","aftPhoto","outPhoto","photo","lampiran","surat","avatar","facePhoto","facePhotoPending"]);
  const DEL="(dihapus)";                                   // penanda FieldValue.delete() / field yang hilang
  const FS=firebase.firestore;
  let warned=false;

  // ---------- util ----------
  const isFV=v=>!!v&&typeof v==="object"&&((typeof FS.FieldValue==="function"&&v instanceof FS.FieldValue)||!!v._methodName||!!(v._delegate&&v._delegate._methodName));
  function plain(v){
    if(isFV(v)){const m=String((v._delegate&&v._delegate._methodName)||v._methodName||"");return /delete/i.test(m)?DEL:"["+(m.replace("FieldValue.","")||"nilai khusus")+"]"}
    return v;
  }
  const trunc=(s,n)=>s.length>n?s.slice(0,n)+"…":s;
  function cl(k,v){                                          // nilai yang aman ditulis ke log
    if(SECRET.test(k))return "[disembunyikan]";
    v=plain(v);
    if(v===DEL)return DEL;
    if(v===undefined||v===null)return null;
    if(PHOTOK.has(k)||(typeof v==="string"&&v.startsWith("data:")))return v?"[foto]":"";
    if(typeof v==="object"){let s;try{s=JSON.stringify(v)}catch(e){s="[objek]"}return trunc(s,300)}
    return typeof v==="string"?trunc(v,300):v;
  }
  const fkey=k=>String(k).replace(/[^\w\-]/g,"_").slice(0,60)||"_";
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

  function diff(before,after,keys){                          // {field:{from,to}}, hanya yang benar-benar berubah
    const out={};let n=0;
    for(const k of keys){
      if(n>=40)break;
      const a=before?before[k]:undefined,b=after[k],gone=b===DEL||(plain(b)===DEL);
      if(before){if(gone&&a===undefined)continue;if(!gone&&same(a,plain(b)))continue}
      out[fkey(k)]={from:before?cl(k,a):null,to:gone?DEL:cl(k,b)};n++;
    }
    return out;
  }
  const keysOfUpdate=a=>{if(a[0]&&typeof a[0]==="object")return[a[0],Object.keys(a[0])];const o={};for(let i=0;i+1<a.length;i+=2)o[String(a[i])]=a[i+1];return[o,Object.keys(o)]};

  function skip(col,id,keys,data){
    if(col==="audit"||col==="meta")return true;
    if(col==="settings"&&id==="purge")return true;           // catatan internal pembersih foto
    if(col==="credentials")return !data||data.by==="self";    // sinkron otomatis saat login / ganti password sendiri
    if(col==="attendance"&&ME&&id.startsWith(ME.id+"_"))return true; // absen masuk/pulang milik sendiri
    if(keys.length&&keys.every(k=>PHOTOK.has(k))&&(col==="attendance"||col==="requests"||col==="users"))return true; // hapus/pindah foto, ganti foto profil
    return false;
  }
  function label(col,id,before,after){
    const U=typeof USERS!=="undefined"&&Array.isArray(USERS)?USERS:[];
    let n=(after&&after.name)||(before&&before.name)||"";
    if(!n&&col==="users")n=(U.find(u=>u.id===id)||{}).name||"";
    if(!n&&(col==="payslips"||col==="attendance")){const uid=id.split("_")[0],u=U.find(x=>x.id===uid);if(u){n=u.name;const r=id.slice(uid.length+1);if(r)n+=" · "+r}}
    if(col==="requests"){const t=(after&&after.type)||(before&&before.type);if(t)n+=(n?" · ":"")+t}
    if(col==="settings"&&!n)n=id;
    return trunc(String(n||id),80);
  }

  // ---------- menulis entri ----------
  const O={};                                                // fungsi asli (belum dibungkus)
  function put(e){
    try{
      if(!ME||window.DEMO_ON||!O.add)return;
      const d={at:Date.now(),ts:FS.FieldValue.serverTimestamp(),uid:ME.id,name:trunc(String(ME.name||""),80),role:ME.role||"",...e};
      O.add.call(db.collection("audit"),d).catch(x=>{
        console.warn("Audit log gagal tersimpan:",x);
        if(!warned&&ADMIN()){warned=true;toast("Audit log gagal tersimpan. Publikasikan firestore.rules terbaru di Firebase Console.")}
      });
    }catch(x){console.warn("Audit log:",x)}
  }

  // ---------- bungkus tulisan Firestore ----------
  function install(){
    if(window.DEMO_ON||window.__audOn)return;
    const DR=FS.DocumentReference&&FS.DocumentReference.prototype,CR=FS.CollectionReference&&FS.CollectionReference.prototype,WB=FS.WriteBatch&&FS.WriteBatch.prototype;
    if(!DR||!CR||!WB||!DR.set||!CR.add||!WB.commit){console.warn("Audit log tidak aktif: kelas Firestore tidak ditemukan");return}
    window.__audOn=true;O.add=CR.add;

    // dokumen tunggal: set / update / delete
    for(const nm of["set","update","delete"]){
      const orig=DR[nm];O[nm]=orig;
      DR[nm]=async function(...a){
        const ref=this;let ctx=null;
        try{
          const seg=tpath(ref.path).split("/");
          if(seg.length===2){
            const[data,keys]=nm==="delete"?[null,[]]:nm==="update"?keysOfUpdate(a):[a[0]||{},Object.keys(a[0]||{})];
            if(!skip(seg[0],seg[1],keys,data)){
              ctx={nm,col:seg[0],id:seg[1],data,keys,merge:nm==="set"&&!!(a[1]&&a[1].merge),before:undefined};
              if(ADMIN()){try{const s=await ref.get();ctx.before=s.exists?s.data():null}catch(e){}} // nilai lama (hanya admin yang boleh membaca semuanya)
            }
          }
        }catch(e){ctx=null}
        const r=await orig.apply(ref,a);
        try{if(ctx)logDoc(ctx)}catch(e){console.warn("Audit log:",e)}
        return r;
      };
    }
    // tambah dokumen baru: collection.add()
    CR.add=async function(d){
      const ref=await O.add.call(this,d);
      try{const col=tpath(this.path).split("/")[0],keys=Object.keys(d||{});
        if(!skip(col,ref.id,keys,d))put({action:"create",col,docId:ref.id,label:label(col,ref.id,null,d),changes:diff(null,d,keys)})}catch(e){}
      return ref;
    };
    // batch: dikumpulkan lalu dicatat saat commit berhasil
    for(const nm of["set","update","delete"]){
      const orig=WB[nm];
      WB[nm]=function(ref,...a){try{(this.__aud||(this.__aud=[])).push({nm,ref,a})}catch(e){}return orig.apply(this,[ref,...a])};
    }
    const oc=WB.commit;
    WB.commit=async function(...a){
      const ops=this.__aud||[];this.__aud=[];
      const r=await oc.apply(this,a);
      try{logBatch(ops)}catch(e){console.warn("Audit log:",e)}
      return r;
    };
  }

  function logDoc(c){
    const known=c.before!==undefined;let action,changes={};
    if(c.nm==="delete"){
      action="delete";const b=c.before||{};changes=diff(b,Object.fromEntries(Object.keys(b).map(k=>[k,DEL])),Object.keys(b)); // tampilkan isi dokumen yang dihapus
    }else if(c.nm==="update"){
      action="update";changes=diff(known?c.before:null,c.data,c.keys);
      if(known&&!Object.keys(changes).length)return;           // tidak ada yang benar-benar berubah
    }else{
      const after={...c.data};
      if(known&&c.before&&!c.merge)Object.keys(c.before).forEach(k=>{if(!(k in after))after[k]=DEL}); // set tanpa merge: field yang tidak ada ikut hilang
      action=known?(c.before?"update":"create"):"set";
      changes=diff(known?c.before:null,after,Object.keys(after));
      if(known&&c.before&&!Object.keys(changes).length)return;
    }
    put({action,col:c.col,docId:c.id,label:label(c.col,c.id,c.before,c.data),changes});
  }

  function logBatch(ops){
    const items=[];
    for(const o of ops){
      const seg=tpath(o.ref&&o.ref.path).split("/");if(seg.length!==2)continue;
      const[data,keys]=o.nm==="delete"?[null,[]]:o.nm==="update"?keysOfUpdate(o.a):[o.a[0]||{},Object.keys(o.a[0]||{})];
      if(skip(seg[0],seg[1],keys,data))continue;
      const it={col:seg[0],id:seg[1],label:label(seg[0],seg[1],null,data),op:o.nm};
      if(data){it.set={};keys.slice(0,8).forEach(k=>{it.set[fkey(k)]=cl(k,data[k])})}
      items.push(it);
    }
    if(!items.length)return;
    if(items.length===1){const it=items[0],ch={};Object.keys(it.set||{}).forEach(k=>{ch[k]={from:null,to:it.set[k]}});
      return put({action:it.op==="delete"?"delete":it.op==="set"?"set":"update",col:it.col,docId:it.id,label:it.label,changes:ch})}
    const cols=[...new Set(items.map(i=>i.col))];
    put({action:"batch",col:cols.length===1?cols[0]:"*",label:items.length+" dokumen",count:items.length,items:items.slice(0,40)});
  }

  // ======================= Halaman Audit Log =======================
  const AQ={rows:[],last:null,more:false,busy:false,err:""};
  const fldName=k=>{const u=typeof UF!=="undefined"&&UF.find(x=>x[0]===k);return u?u[1]:k};
  const fmtDT=t=>{const d=new Date(t||0);return d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
  const val=v=>v===DEL?"<i>(dihapus)</i>":v===null||v===undefined||v===""?"<span class=\"mut\">—</span>":esc(trunc(String(v),90));
  const valT=v=>v===DEL?"(dihapus)":v===null||v===undefined||v===""?"—":trunc(String(v),200);
  const chHtml=r=>{
    if(r.items)return`<div class="audc"><b>${r.count||r.items.length} dokumen</b> (${esc((r.col==="*"?"beberapa koleksi":COLN[r.col]||r.col))})`+r.items.slice(0,6).map(i=>`<div>${esc(COLN[i.col]||i.col)} · ${esc(i.label||i.id)}: ${esc(Object.keys(i.set||{}).map(fldName).join(", ")||i.op)}</div>`).join("")+(r.items.length>6?`<div class="mut">+${r.items.length-6} lainnya…</div>`:"")+"</div>";
    const k=Object.keys(r.changes||{});
    const hdr=r.note?`<div class="mut">${esc(r.note)}</div>`:"";
    return`<div class="audc">${hdr}${k.slice(0,8).map(f=>{const c=r.changes[f];return`<div><b>${esc(fldName(f))}</b>: ${r.action==="delete"?val(c.from):(c.from===null?"":`<s>${val(c.from)}</s> → `)+val(c.to)}</div>`}).join("")}${k.length>8?`<div class="mut">+${k.length-8} field lainnya…</div>`:""}</div>`;
  };
  const chText=r=>r.items?r.items.map(i=>`${COLN[i.col]||i.col} ${i.label||i.id}: ${Object.keys(i.set||{}).join("/")||i.op}`).join(" | "):Object.keys(r.changes||{}).map(f=>`${fldName(f)}: ${r.action==="delete"?valT(r.changes[f].from):(r.changes[f].from===null?"":valT(r.changes[f].from)+" -> ")+valT(r.changes[f].to)}`).join(" | ")+(r.note?" | "+r.note:"");

  async function audLoad(reset){
    if(AQ.busy)return;AQ.busy=true;AQ.err="";
    try{
      if(reset){AQ.rows=[];AQ.last=null}
      let q=db.collection("audit");const ord=typeof q.orderBy==="function";
      if(ord){q=q.orderBy("at","desc");if(AQ.last)q=q.startAfter(AQ.last);q=q.limit(100)}
      const s=await q.get();
      const rows=s.docs.map(d=>({id:d.id,...d.data()}));if(!ord)rows.sort((a,b)=>(b.at||0)-(a.at||0));
      AQ.rows.push(...rows);AQ.last=s.docs[s.docs.length-1]||null;AQ.more=ord&&s.size>=100;
    }catch(e){AQ.err=(e&&e.code==="permission-denied")?"Tidak ada izin membaca audit log. Publikasikan firestore.rules terbaru di Firebase Console.":(e.message||String(e))}
    AQ.busy=false;audDraw();
  }
  function audFiltered(){
    const q=(($("#aq")||{}).value||"").trim().toLowerCase(),c=($("#ac")||{}).value||"",a=($("#aa")||{}).value||"";
    return AQ.rows.filter(r=>(!c||r.col===c)&&(!a||r.action===a)&&(!q||(r.name+" "+r.label+" "+(COLN[r.col]||r.col)+" "+chText(r)).toLowerCase().includes(q)));
  }
  function audDraw(){
    const el=$("#audBody");if(!el)return;
    if(AQ.err){el.innerHTML=`<div class="box">${esc(AQ.err)}</div>`;return}
    const f=audFiltered();
    el.innerHTML=`<div class="box"><div class="tw"><table><tr><th>Waktu</th><th>Siapa</th><th>Aksi</th><th>Data</th><th>Perubahan</th></tr>`+
      (f.map(r=>`<tr><td style="white-space:nowrap">${esc(fmtDT(r.at))}</td><td>${esc(r.name||"-")}<br><small class="mut">${esc(r.role||"")}</small></td><td><span class="tag${r.action==="delete"?" no":r.action==="create"?" ok":""}">${esc(ACTN[r.action]||r.action)}</span></td><td>${esc(COLN[r.col]||r.col)}<br><small class="mut">${esc(r.label||"")}</small></td><td>${chHtml(r)}</td></tr>`).join("")||`<tr><td class="mut" colspan="5">${AQ.rows.length?"Tidak ada yang cocok dengan filter.":"Belum ada catatan."}</td></tr>`)+
      `</table></div><div class="row" style="margin-top:12px"><small class="mut">${f.length} dari ${AQ.rows.length} catatan dimuat</small>${AQ.more?`<button class="btn ghost sm" onclick="audLoad(false)">Muat lebih banyak</button>`:""}</div></div>`;
  }
  function audCsv(){
    const f=audFiltered();
    csv("audit-log-"+ymd(new Date())+".csv",[["Waktu","Siapa","Role","Aksi","Koleksi","Data","Perubahan"],...f.map(r=>[new Date(r.at||0).toISOString().replace("T"," ").slice(0,19),r.name,r.role,ACTN[r.action]||r.action,COLN[r.col]||r.col,r.label,chText(r)].map(csvSafe))]);
  }
  const csvSafe=c=>{const s=String(c??"");return /^[=+\-@\t\r]/.test(s)?"'"+s:s};

  async function auditView(){
    if(!ADMIN())return head("Audit Log")+'<div class="box">Hanya admin yang dapat membuka halaman ini.</div>';
    AFTER=()=>audLoad(true);
    return head("Audit Log","Siapa mengubah apa, dan kapan")+
    `<div class="box"><div class="fg">
      <div class="f"><label>Cari (nama, data, isi perubahan)</label><input id="aq" oninput="audDraw()" placeholder="mis. Budi, gaji, 2026-11"></div>
      <div class="f"><label>Data</label><select id="ac" onchange="audDraw()"><option value="">Semua</option>${Object.keys(COLN).filter(k=>k!=="audit"&&k!=="meta").map(k=>`<option value="${k}">${COLN[k]}</option>`).join("")}<option value="*">Massal (beberapa data)</option></select></div>
      <div class="f"><label>Aksi</label><select id="aa" onchange="audDraw()"><option value="">Semua</option>${Object.keys(ACTN).map(k=>`<option value="${k}">${ACTN[k]}</option>`).join("")}</select></div></div>
      <button class="btn ghost sm" onclick="audLoad(true)">↻ Muat ulang</button> <button class="btn ghost sm" onclick="audCsv()">⬇️ Unduh CSV</button>
      <p class="mut" style="margin-top:10px;font-size:12px">Nilai lama hanya tercatat untuk perubahan oleh admin. Password, data wajah, PIN, dan foto tidak pernah disimpan di log. Absen masuk/pulang harian tidak dicatat di sini.</p></div>
    <div id="audBody">${typeof skRows==="function"?skRows(5):'<p class="mut">Memuat...</p>'}</div>`;
  }

  // ======================= Halaman Backup =======================
  const BK=[["users","Karyawan"],["settings","Pengaturan"],["attendance","Absensi"],["requests","Pengajuan"],["schedules","Jadwal Shift"],["payslips","Slip Gaji"],["audit","Audit Log"]];
  const PHOTO_DROP=[...PHOTOK,"faceDesc","faceAt","faceDescPending","facePendingAt"];
  const jsonVal=(k,v)=>v&&typeof v==="object"&&typeof v.toMillis==="function"?{__ts:v.toMillis()}:v;

  async function bkFetch(col,withMedia,onN){
    const out={};let last=null;
    for(;;){
      let q=db.collection(col);const ord=typeof q.orderBy==="function";
      if(ord){q=q.orderBy(FS.FieldPath.documentId());if(last)q=q.startAfter(last);q=q.limit(300)}
      const s=await q.get();
      for(const d of s.docs){const x=d.data();if(!withMedia)PHOTO_DROP.forEach(k=>{delete x[k]});out[d.id]=x}
      if(onN)onN(Object.keys(out).length);
      last=s.docs[s.docs.length-1];if(!ord||s.size<300||!last)break;
    }
    return out;
  }
  function bkSave(name,text,type){
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([type==="text/csv"?"\uFEFF"+text:text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }
  async function bkNote(counts,kind){
    try{await db.collection("settings").doc("backup").set({lastAt:Date.now(),by:ME.id,byName:ME.name||"",kind,counts},{merge:true})}catch(e){}
    put({action:"export",col:"*",label:kind,note:"Ekspor data: "+Object.entries(counts).map(([k,n])=>(COLN[k]||k)+" "+n).join(", ")});
  }
  async function bkFull(){
    if(!ADMIN())return;
    const media=$("#bkMedia").checked,aud=$("#bkAud").checked,st=$("#bkSt"),btn=$("#bkBtn");
    if(media&&!await uiConfirm("Backup akan memuat foto absen/lampiran yang masih tersimpan di dokumen dan DATA WAJAH karyawan (data biometrik). File tidak terenkripsi, simpan di tempat aman. Lanjutkan?"))return;
    btn.disabled=true;
    try{
      const data={},counts={};
      for(const[c,n]of BK){
        if(c==="audit"&&!aud)continue;
        st.textContent=`Mengambil ${n}…`;
        data[c]=await bkFetch(c,media,k=>{st.textContent=`Mengambil ${n}… ${k} dokumen`});counts[c]=Object.keys(data[c]).length;
      }
      const pack={app:"absensi-web",format:1,exportedAt:new Date().toISOString(),exportedBy:{id:ME.id,name:ME.name||""},includesMedia:media,counts,
        note:"Koleksi 'credentials' (salinan password) sengaja tidak disertakan. Foto di Firebase Storage tidak ikut; hanya path-nya yang tersimpan di dokumen.",data};
      bkSave(`backup-absensi-${ymd(new Date())}.json`,JSON.stringify(pack,jsonVal),"application/json");
      await bkNote(counts,"Backup lengkap (JSON)");
      st.textContent=`Selesai: ${Object.values(counts).reduce((a,b)=>a+b,0)} dokumen dari ${Object.keys(counts).length} koleksi.`;toast("Backup diunduh");
    }catch(e){st.textContent="Gagal: "+(e.message||e)}
    btn.disabled=false;
  }
  async function bkCsv(col){
    if(!ADMIN())return;const st=$("#bkSt");st.textContent="Mengambil "+(COLN[col]||col)+"…";
    try{
      const m=await bkFetch(col,false),ids=Object.keys(m),keys=[...new Set(ids.flatMap(i=>Object.keys(m[i])))];
      const cell=v=>{v=jsonVal("",v);return csvSafe(v===null||v===undefined?"":typeof v==="object"?JSON.stringify(v):v)};
      const rows=[["id",...keys],...ids.map(i=>[i,...keys.map(k=>cell(m[i][k]))])];
      bkSave(`${col}-${ymd(new Date())}.csv`,rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv");
      await bkNote({[col]:ids.length},"Ekspor CSV "+(COLN[col]||col));st.textContent=`Selesai: ${ids.length} baris ${COLN[col]||col}.`;
    }catch(e){st.textContent="Gagal: "+(e.message||e)}
  }
  async function backupView(){
    if(!ADMIN())return head("Backup")+'<div class="box">Hanya admin yang dapat membuka halaman ini.</div>';
    let B={};try{const s=await db.collection("settings").doc("backup").get();if(s.exists)B=s.data()}catch(e){}
    const days=B.lastAt?Math.floor((Date.now()-B.lastAt)/864e5):null;
    return head("Backup & Ekspor","Simpan salinan seluruh data di luar Firebase")+
    `<div class="box"><h3>Backup lengkap (JSON)</h3>
      <p class="mut" style="margin-bottom:12px">Mengunduh satu file berisi karyawan, pengaturan, absensi, pengajuan, jadwal shift, slip gaji, dan audit log. Salinan password (koleksi <i>credentials</i>) tidak pernah ikut.</p>
      <p style="margin-bottom:12px">${B.lastAt?`Terakhir diekspor <b>${esc(fmtDT(B.lastAt))}</b>${B.byName?" oleh "+esc(B.byName):""}${days>=7?` · <span style="color:var(--bad)">sudah ${days} hari, sebaiknya backup lagi</span>`:""}`:`<span style="color:var(--bad)">Belum pernah backup.</span>`}</p>
      <label class="rem" style="display:block;margin-bottom:6px"><input type="checkbox" id="bkAud" checked> Sertakan audit log</label>
      <label class="rem" style="display:block;margin-bottom:12px"><input type="checkbox" id="bkMedia"> Sertakan foto yang tersimpan di dokumen dan data wajah (file jauh lebih besar, memuat data biometrik)</label>
      <button class="btn" id="bkBtn" onclick="bkFull()">💾 Unduh backup lengkap</button> <span id="bkSt" class="mut" style="margin-left:8px"></span></div>
    <div class="box"><h3>Ekspor per data (CSV, bisa dibuka di Excel)</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${BK.map(([c,n])=>`<button class="btn ghost sm" onclick="bkCsv('${c}')">⬇️ ${n}</button>`).join("")}</div>
      <p class="mut" style="margin-top:12px;font-size:12px">Foto di Firebase Storage tidak ikut terunduh (hanya path-nya). Untuk salinan foto, gunakan ekspor bucket Storage dari Firebase / Google Cloud Console. Untuk pemulihan otomatis jika database rusak, aktifkan juga backup terjadwal Firestore di Google Cloud.</p></div>`;
  }

  // ---------- pasang ----------
  Object.assign(window,{audLoad,audDraw,audCsv,bkFull,bkCsv});
  V.audit=auditView;V.backup=backupView;
  {const i=ADM.findIndex(n=>n[0]==="setting");ADM.splice(i<0?ADM.length:i,0,["audit","🕵️","Audit Log"],["backup","💾","Backup"])}
  install();
})();
