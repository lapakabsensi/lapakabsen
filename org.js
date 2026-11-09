// ===== Struktur perusahaan per departemen, alur persetujuan (Atasan -> HR), import karyawan =====
// Dimuat setelah extra.js dan sebelum app.js. Fungsi memakai variabel app.js (ME, SET, USERS, db, $, dst) saat runtime.
addDict({
"Lainnya":["More","更多"],
"Simpan kata sandi":["Remember password","记住密码"],
"Struktur":["Structure","架构"],"Struktur Perusahaan":["Company Structure","公司架构"],"Departemen":["Department","部门"],
"Atasan langsung (persetujuan 1)":["Direct supervisor (approval 1)","直属上级（第1级审批）"],"HR (persetujuan terakhir)":["HR (final approval)","人事（最终审批）"],
"Mulai Scan Wajah":["Start Face Scan","开始人脸扫描"],"Perlu keputusan saya":["Needs my decision","待我审批"],"Sedang diproses pihak lain":["Being processed by others","他人处理中"],
"Alur persetujuan":["Approval flow","审批流程"],"Import karyawan dari Excel / CSV":["Import employees from Excel / CSV","从 Excel / CSV 导入员工"]
});
const DEPTS=()=>Array.isArray(SET.depts)?SET.depts:[];
const isHR=()=>!!ME&&ME.role==="hr";
const uname=id=>{const u=USERS.find(x=>x.id===id);return u?u.name:""};
const optSel=(id,label,opts,val,extra="")=>`<div class="f"><label>${label}</label><select id="${id}" ${extra}>${opts.map(([v,l])=>`<option value="${esc(v)}"${v===val?" selected":""}>${esc(l)}</option>`).join("")}</select></div>`;
const fmtD=t=>new Date(t).toLocaleDateString("id-ID",{day:"numeric",month:"short"});

// ---------- Field organisasi di form karyawan ----------
// daftar atasan seorang karyawan (mendukung data lama yang hanya punya atasanId)
const atasanList=u=>Array.isArray(u&&u.atasanIds)&&u.atasanIds.length?u.atasanIds:(u&&u.atasanId?[u.atasanId]:[]);
const atasanFields=u=>{const l=atasanList(u);return{atasanId:l[0]||"",atasanName:u.atasanName||"",atasanIds:l,atasanMode:u.atasanMode||"any",aIdx:0}};
const ROLE_OPT=["karyawan","atasan","hr","admin"];
const aSelOpts=v=>[["","— Tidak ada —"],...USERS.filter(u=>u.id!==EDIT).map(u=>[u.id,u.name+(u.jabatan?" · "+u.jabatan:"")+(u.role&&u.role!=="karyawan"?" ("+u.role+")":"")])].map(([a,b])=>`<option value="${esc(a)}"${a===v?" selected":""}>${esc(b)}</option>`).join("");
const aRow=v=>`<div class="atr"><select class="u_at">${aSelOpts(v)}</select><button type="button" class="btn ghost sm atx" onclick="atDel(this)" title="Hapus atasan ini">✕</button></div>`;
function orgFields(e){
  const us=USERS.filter(u=>u.id!==EDIT),D=DEPTS();
  const dOpt=[["","— Tanpa departemen —"],...D.map(d=>[d.name,d.name])];
  if(e.dept&&!D.some(d=>d.name===e.dept))dOpt.push([e.dept,e.dept]);
  dOpt.push(["__new__","✏️ Tulis departemen baru…"]);
  const hOpt=[["","— Tidak ada —"],...us.filter(u=>u.role==="hr"||u.role==="admin").map(u=>[u.id,u.name+" ("+u.role+")"])],al=atasanList(e);
  return optSel("u_dept","Departemen",dOpt,e.dept||"",'onchange="deptPick()"').replace(/<\/div>$/,'<input id="u_deptNew" placeholder="Ketik nama departemen baru" style="display:none;margin-top:6px"></div>')
   +`<div class="f atw"><label>Atasan langsung (persetujuan 1)</label><div id="u_atBox">${(al.length?al:[""]).map(aRow).join("")}</div>
     <button type="button" class="btn ghost sm" onclick="atAdd()" style="margin-top:6px">＋ Tambah atasan</button>
     <div id="u_atModeW" style="margin-top:8px"><label>Jika atasan lebih dari satu</label><select id="u_atasanMode"><option value="any"${(e.atasanMode||"any")==="any"?" selected":""}>Salah satu atasan cukup</option><option value="all"${e.atasanMode==="all"?" selected":""}>Semua atasan menyetujui (berurutan)</option></select></div></div>`
   +optSel("u_hrId","HR (persetujuan terakhir)",hOpt,e.hrId||"");
}
function atRefresh(){const rows=document.querySelectorAll("#u_atBox .atr"),w=document.getElementById("u_atModeW");if(w)w.style.display=rows.length>1?"":"none";rows.forEach(r=>r.querySelector(".atx").style.display=rows.length>1?"":"none")}
function atAdd(){const b=document.getElementById("u_atBox");if(!b)return;b.insertAdjacentHTML("beforeend",aRow(""));atRefresh()}
function atDel(btn){btn.closest(".atr").remove();atRefresh()}
// pilih departemen -> isi otomatis atasan & HR default departemen itu (tetap bisa diubah)
function deptPick(){
  const v=$("#u_dept").value,nw=$("#u_deptNew");if(nw){nw.style.display=v==="__new__"?"":"none";if(v==="__new__")nw.focus()}
  const d=DEPTS().find(x=>x.name===v);if(!d)return;
  if(d.headId){const f=document.querySelector("#u_atBox .u_at");if(f&&!f.value)f.value=d.headId!==EDIT?d.headId:""}
  if(d.hrId)$("#u_hrId").value=d.hrId!==EDIT?d.hrId:"";
}
// nama departemen yang dipilih / ditulis sendiri (disamakan dengan departemen yang sudah ada tanpa membedakan huruf besar-kecil)
function deptValue(){
  const v=($("#u_dept")||{}).value||"";if(v!=="__new__")return v;
  const n=(($("#u_deptNew")||{}).value||"").trim().replace(/\s+/g," ");if(!n)return"";
  const ex=DEPTS().find(d=>d.name.toLowerCase()===n.toLowerCase());return ex?ex.name:n;
}
function orgRead(){
  const g=id=>($("#"+id)||{}).value||"",h=g("u_hrId"),at=[...new Set([...document.querySelectorAll("#u_atBox .u_at")].map(x=>x.value).filter(Boolean))];
  return{dept:deptValue(),atasanId:at[0]||"",atasanIds:at,atasanName:at.map(uname).filter(Boolean).join(", "),atasanMode:at.length>1?g("u_atasanMode")||"any":"any",hrId:h,hrName:uname(h)};
}
// setelah simpan: departemen baru ikut masuk Struktur Perusahaan, tandai atasan (agar menu Persetujuan muncul) & sinkron nama yang disalin ke dokumen lain
async function orgAfterSave(id,d){
  if(d.dept&&!DEPTS().some(x=>x.name===d.dept))await dSaveAll([...DEPTS(),{name:d.dept,headId:"",hrId:""}]);
  for(const a of atasanList(d))await db.collection("users").doc(a).update({isAtasan:true});
  if(EDIT&&d.name){
    const all=await get("users"),nm=Object.fromEntries(all.map(u=>[u.id,u.id===id?d.name:u.name]));
    await Promise.all(all.filter(x=>x.id!==id).map(x=>{const up={},al=atasanList(x);
      if(al.includes(id)){const n=al.map(a=>nm[a]).filter(Boolean).join(", ");if(n!==x.atasanName)up.atasanName=n}
      if(x.hrId===id&&x.hrName!==d.name)up.hrName=d.name;
      return Object.keys(up).length?db.collection("users").doc(x.id).update(up):null}));
  }
}

// ---------- Alur persetujuan ----------
const chainStart=u=>atasanList(u).length?"atasan":u.hrId?"hr":"admin";
// giliran atasan: mode "any" = salah satu atasan; mode "all" = berurutan sesuai urutan daftar
const isTurnAtasan=(r,id)=>{const l=atasanList(r);return r.atasanMode==="all"&&l.length>1?l[r.aIdx||0]===id:l.includes(id)};
function reqStatus(r){
  if(r.status==="ditolak"||r.status==="disetujui")return tag(r.status);
  const w=r.step==="atasan"?"Menunggu atasan"+(r.atasanName?` (${r.atasanName})`:""):r.step==="hr"?"Menunggu HR"+(r.hrName?` (${r.hrName})`:""):"Menunggu admin";
  return`<span class="tag">${esc(w)}</span>`;
}
function chainBar(r){
  const L=r.log||[],st=a=>{const x=L.find(l=>l.as===a);return x?(x.ok?"✅":"❌"):(r.status==="menunggu"&&r.step===a?"⏳":"•")},p=[];
  const na=atasanList(r).length,prog=r.atasanMode==="all"&&na>1?` ${Math.min(L.filter(l=>l.as==="atasan"&&l.ok).length,na)}/${na}`:"";
  if(na||L.some(l=>l.as==="atasan"))p.push(`${st("atasan")} Atasan${r.atasanName?" ("+esc(r.atasanName)+")":""}${prog}`);
  if(r.hrId||L.some(l=>l.as==="hr"))p.push(`${st("hr")} HR${r.hrName?" ("+esc(r.hrName)+")":""}`);
  if(L.some(l=>l.as==="admin")||r.step==="admin")p.push(`${st("admin")} Admin`);
  return p.join(" → ")||"—";
}
const logLines=r=>(r.log||[]).map(l=>`<small class="mut" style="display:block">${l.ok?"✓ Disetujui":"✕ Ditolak"} oleh ${esc(l.name)} (${esc(l.as)}) · ${fmtD(l.at)}${l.note?" · “"+esc(l.note)+"”":""}</small>`).join("");
const flowBox=()=>`<div class="box"><b>Alur persetujuan:</b> Kamu → Atasan${ME.atasanName?" ("+esc(ME.atasanName)+")":" (belum diatur)"} → HR${ME.hrName?" ("+esc(ME.hrName)+")":" (belum diatur)"}${!ME.atasanId&&!ME.hrId?'<br><small class="mut">Atasan & HR belum diatur, pengajuan akan diputuskan admin.</small>':""}</div>`;

async function decide(id,ok){
  const ref=db.collection("requests").doc(id),r=(await ref.get()).data();
  if(r.status!=="menunggu"){toast("Pengajuan sudah diputuskan");return render()}
  const as=ADMIN()?"admin":r.step==="atasan"&&isTurnAtasan(r,ME.id)?"atasan":r.step==="hr"&&r.hrId===ME.id?"hr":null;
  if(!as)return toast("Bukan giliran kamu untuk memutuskan");
  let note="";if(!ok){note=await uiPrompt("Alasan penolakan (opsional):",{title:"Tolak pengajuan",ok:"Tolak",danger:true,placeholder:"Tulis alasan…"});if(note===null)return}
  const upd={log:firebase.firestore.FieldValue.arrayUnion({by:ME.id,name:ME.name,as,ok,note:note||"",at:Date.now()})};
  if(!ok)Object.assign(upd,{status:"ditolak",step:"selesai",finalAt:Date.now()});
  else if(as==="atasan"){const l=atasanList(r);if(r.atasanMode==="all"&&l.length>1&&(r.aIdx||0)+1<l.length)upd.aIdx=(r.aIdx||0)+1;else upd.step=r.hrId?"hr":"admin"}
  else Object.assign(upd,{status:"disetujui",step:"selesai",finalAt:Date.now()});
  if(upd.status==="disetujui"&&r.type==="perbaikan")await db.collection("attendance").doc(`${r.uid}_${r.tgl}`).set({uid:r.uid,date:r.tgl,in:r.masuk||null,out:r.pulang||null,status:"normal",note:"perbaikan disetujui"},{merge:true});
  if(upd.status==="disetujui"&&r.type==="lapangan"){try{await applyField(r)}catch(e){return toast(errMsg(e))}}
  await ref.update(upd);toast("Diperbarui");render();
}
let AP_DEPT="",AP_ST="";
// semua pengajuan yang melibatkan saya sebagai atasan (satu atau beberapa) atau HR
async function myApprovalReqs(){
  const c=db.collection("requests"),q=await Promise.all([c.where("atasanId","==",ME.id).get(),c.where("atasanIds","array-contains",ME.id).get(),c.where("hrId","==",ME.id).get()]),m={};
  q.forEach(s=>s.docs.forEach(d=>m[d.id]={id:d.id,...d.data()}));return Object.values(m);
}
async function approvalView(){
  let l;
  if(ADMIN())l=await get("requests");
  else l=await myApprovalReqs()
  if(AP_DEPT)l=l.filter(r=>(r.dept||"")===AP_DEPT);
  if(AP_ST)l=l.filter(r=>r.status===AP_ST);
  const mine=r=>r.status==="menunggu"&&(ADMIN()||(r.step==="atasan"&&isTurnAtasan(r,ME.id))||(r.step==="hr"&&r.hrId===ME.id));
  const todo=l.filter(mine).sort((a,b)=>a.createdAt-b.createdAt),wait=l.filter(r=>r.status==="menunggu"&&!mine(r)).sort((a,b)=>a.createdAt-b.createdAt),done=l.filter(r=>r.status!=="menunggu").sort((a,b)=>(b.finalAt||b.createdAt)-(a.finalAt||a.createdAt)).slice(0,30);
  const item=(r,act)=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row" style="flex-wrap:wrap"><span><b>${esc(r.name)}</b>${r.dept?` <small class="mut">· ${esc(r.dept)}</small>`:""} · ${esc(FORMS[r.type]?.[0]||r.type)}<br><small class="mut">${reqInfo(r)}</small> ${suratBtn(r)}${fieldInfo(r)}</span>${act?`<span><button class="btn sm" onclick="decide('${r.id}',true)">Setujui</button> <button class="btn sm red" onclick="decide('${r.id}',false)">Tolak</button></span>`:reqStatus(r)}</div><small class="mut" style="display:block;margin-top:4px">${chainBar(r)}</small>${logLines(r)}</div>`;
  const stSel=`<select class="langsel" onchange="AP_ST=this.value;render()"><option value="">Semua status</option>${["menunggu","disetujui","ditolak"].map(k=>`<option value="${k}"${k===AP_ST?" selected":""}>${k[0].toUpperCase()+k.slice(1)}</option>`).join("")}</select>`;
  const depSel=ADMIN()?`<select class="langsel" style="margin-left:auto" onchange="AP_DEPT=this.value;render()"><option value="">Semua departemen</option>${DEPTS().map(d=>`<option${d.name===AP_DEPT?" selected":""}>${esc(d.name)}</option>`).join("")}</select>`:"";
  return head("Persetujuan",todo.length+" menunggu keputusan"+(ADMIN()?"":" kamu"))+`<div class="row" style="margin-bottom:10px;gap:8px;justify-content:flex-end">${stSel}${depSel.replace(' style="margin-left:auto"',"")}</div>`
   +`<div class="box"><h3>Perlu keputusan saya</h3>${todo.map(r=>item(r,true)).join("")||emptyBox("✅","Tidak ada pengajuan yang menunggu keputusanmu","Pengajuan baru akan muncul di sini.")}</div>`
   +(wait.length?`<div class="box"><h3>Sedang diproses pihak lain</h3>${wait.map(r=>item(r,false)).join("")}</div>`:"")
   +`<div class="box"><h3>Riwayat</h3>${done.map(r=>item(r,false)).join("")||emptyBox("🗂️","Belum ada riwayat","Pengajuan yang sudah diputuskan tampil di sini.")}</div>`;
}

// ---------- Struktur perusahaan ----------
function orgTree(members,head){
  const ids=new Set(members.map(m=>m.id)),done=new Set(),kids=id=>members.filter(m=>m.atasanId===id&&m.id!==id);
  const node=u=>`<div class="nd${u.id===head?" head":""}" title="Atasan: ${esc(u.atasanName||"-")} · HR: ${esc(u.hrName||"-")}"><div class="av2">${esc((u.name||"?").slice(0,2).toUpperCase())}</div><div><b>${esc(u.name)}</b>${u.id===head?' <span class="tag ok">Kepala</span>':""}${u.role==="hr"?' <span class="tag">HR</span>':""}${u.role==="atasan"?' <span class="tag">Atasan</span>':""}<br><small class="mut">${esc(u.jabatan||"-")}</small></div></div>`;
  const rec=u=>{done.add(u.id);const k=kids(u.id).filter(x=>!done.has(x.id));return`<li>${node(u)}${k.length?`<ul>${k.map(rec).join("")}</ul>`:""}</li>`};
  const roots=members.filter(m=>!m.atasanId||!ids.has(m.atasanId)).sort((a,b)=>(b.id===head)-(a.id===head));
  let h=roots.map(r=>done.has(r.id)?"":rec(r)).join("");
  members.forEach(m=>{if(!done.has(m.id))h+=rec(m)});
  return`<ul class="tree">${h}</ul>`;
}
async function strukturView(){
  USERS=await get("users");const D=DEPTS(),adm=ADMIN(),staff=USERS.filter(u=>u.role!=="admin"||u.dept);
  const per=n=>staff.filter(u=>u.dept===n),none=USERS.filter(u=>u.role!=="admin"&&!u.dept&&!D.some(d=>d.name===u.dept));
  const us=USERS.map(u=>[u.id,u.name+(u.role!=="karyawan"?" ("+u.role+")":"")]),hrs=USERS.filter(u=>u.role==="hr"||u.role==="admin").map(u=>[u.id,u.name+" ("+u.role+")"]);
  const so=(arr,v)=>[["","— Belum diatur —"],...arr].map(([a,b])=>`<option value="${esc(a)}"${a===v?" selected":""}>${esc(b)}</option>`).join("");
  const mgmt=adm?`<div class="box"><h3>Kelola departemen</h3><p class="mut" style="margin-bottom:12px">Kepala departemen otomatis jadi atasan default dan HR departemen jadi persetujuan terakhir saat karyawan baru dimasukkan ke departemen ini.</p>
    ${D.map((d,i)=>`<div class="drow"><div class="f"><label>Nama departemen</label><input id="d_n_${i}" value="${esc(d.name)}"></div><div class="f"><label>Kepala departemen (atasan default)</label><select id="d_h_${i}">${so(us,d.headId||"")}</select></div><div class="f"><label>HR persetujuan terakhir</label><select id="d_r_${i}">${so(hrs,d.hrId||"")}</select></div><div class="drow-b"><button class="btn sm" onclick="deptSave(${i})">Simpan</button> <button class="btn sm ghost" onclick="deptApply(${i})" title="Isi atasan/HR anggota yang masih kosong">Terapkan ke anggota</button> <button class="btn sm red" onclick="deptDel(${i})">Hapus</button></div></div>`).join("")||'<p class="mut">Belum ada departemen.</p>'}
    <div class="row" style="margin-top:12px;max-width:460px"><input id="d_new" placeholder="Nama departemen baru, mis. Sales"><button class="btn" onclick="deptAdd()">Tambah</button></div></div>`:"";
  const card=(n,list,d)=>`<div class="box"><div class="dh"><div><h3 style="margin:0">🏢 ${esc(n)}</h3><small class="mut">${list.length} anggota</small></div><div class="chain">Kepala: <b>${esc(d&&d.headId?uname(d.headId)||"-":"-")}</b><br>HR: <b>${esc(d&&d.hrId?uname(d.hrId)||"-":"-")}</b></div></div>${list.length?orgTree(list,d&&d.headId):'<p class="mut">Belum ada anggota.</p>'}</div>`;
  return head("Struktur Perusahaan",esc(COMP.name||"")+" · "+D.length+" departemen")
   +`<div class="box" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="nd head"><div class="av2">🏛</div><div><b>${esc(COMP.name||"Perusahaan")}</b><br><small class="mut">${USERS.filter(u=>u.role!=="admin").length} karyawan</small></div></div><span class="chain">Alur pengajuan (cuti, lembur, dll): Karyawan → Atasan langsung → HR → selesai</span></div>`
   +mgmt+D.map(d=>card(d.name,per(d.name),d)).join("")+(none.length?card("Tanpa departemen",none,null):"");
}
const dGet=i=>({n:$("#d_n_"+i).value.trim(),h:$("#d_h_"+i).value,r:$("#d_r_"+i).value});
const dSaveAll=async l=>{await db.collection("settings").doc("work").set({depts:l},{merge:true});SET.depts=l};
async function deptAdd(){
  const n=$("#d_new").value.trim();if(!n)return toast("Isi nama departemen");
  if(DEPTS().some(d=>d.name.toLowerCase()===n.toLowerCase()))return toast("Departemen sudah ada");
  await dSaveAll([...DEPTS(),{name:n,headId:"",hrId:""}]);render();
}
async function deptSave(i){
  const D=DEPTS().map(d=>({...d})),o=D[i].name,g=dGet(i);if(!g.n)return toast("Nama departemen wajib diisi");
  if(g.n!==o&&D.some((d,j)=>j!==i&&d.name.toLowerCase()===g.n.toLowerCase()))return toast("Nama departemen sudah dipakai");
  D[i]={name:g.n,headId:g.h,hrId:g.r};
  if(g.n!==o){const m=USERS.filter(u=>u.dept===o);for(let k=0;k<m.length;k+=400){const b=db.batch();m.slice(k,k+400).forEach(u=>b.update(db.collection("users").doc(u.id),{dept:g.n}));await b.commit()}}
  await dSaveAll(D);if(g.h)await db.collection("users").doc(g.h).update({isAtasan:true});toast("Departemen tersimpan");render();
}
async function deptDel(i){
  const d=DEPTS()[i];if(USERS.some(u=>u.dept===d.name))return toast("Masih ada anggota di departemen ini. Pindahkan dulu.");
  if(!await uiConfirm(`Hapus departemen ${d.name}?`))return;await dSaveAll(DEPTS().filter((_,j)=>j!==i));render();
}
async function deptApply(i){
  const g=dGet(i),n=DEPTS()[i].name,m=USERS.filter(u=>u.dept===n);let c=0;
  const b=db.batch();
  m.forEach(u=>{const up={};
    if(!atasanList(u).length&&g.h&&u.id!==g.h){up.atasanId=g.h;up.atasanIds=[g.h];up.atasanName=uname(g.h)}
    if(!u.hrId&&g.r&&u.id!==g.r){up.hrId=g.r;up.hrName=uname(g.r)}
    if(Object.keys(up).length){b.update(db.collection("users").doc(u.id),up);c++}});
  if(!c)return toast("Semua anggota sudah punya atasan & HR");
  if(g.h)b.update(db.collection("users").doc(g.h),{isAtasan:true});
  await b.commit();toast(`${c} anggota diperbarui`);render();
}

// ---------- Import karyawan (template Excel / CSV) ----------
const IMP_COLS=[["Nama","name"],["Email","email"],["Password Awal","pw"],["No WhatsApp","wa"],["Role","role"],["Jabatan","jabatan"],["Departemen","dept"],["Email Atasan","atasanEmail"],["Email HR","hrEmail"],["Mode Absensi","mode"],["Gaji Pokok","pokok"],["Status PTKP","ptkp"],["Target Penjualan","target"],["Bonus %","bonusPct"],["Bonus Tetap","bonusFlat"],["Jam Masuk Khusus","shiftIn"],["Jam Pulang Khusus","shiftOut"],["Toleransi Terlambat (menit)","tol"],["Bank","bank"],["No Rekening","rek"],["Atas Nama Rekening","rekName"],["Tanggal Masuk","joinDate"],["Status Karyawan","empStatus"]];
const normH=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const IMP_MAP={...Object.fromEntries(IMP_COLS.map(c=>[normH(c[0]),c[1]])),password:"pw",whatsapp:"wa",wa:"wa",phone:"wa",department:"dept",departement:"dept",bonuspersen:"bonusPct",atasan:"atasanEmail",hr:"hrEmail"};
let IMP=[],XL_P=null;
function loadXlsx(){
  if(window.XLSX)return Promise.resolve();if(XL_P)return XL_P;
  XL_P=new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";s.onload=ok;s.onerror=()=>{XL_P=null;no(new Error("Gagal memuat library Excel. Cek koneksi internet."))};document.head.appendChild(s)});
  return XL_P;
}
const importBox=()=>`<div class="box"><h3>Import karyawan dari Excel / CSV</h3><p class="mut" style="margin-bottom:12px">1) Unduh template → 2) isi satu baris per karyawan → 3) unggah file di sini. Akun, departemen, atasan, dan HR langsung dibuat. Password yang dikosongkan dibuatkan otomatis.</p><div class="row" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button class="btn" onclick="dlTemplate()">⬇️ Template Excel (.xlsx)</button><button class="btn ghost" onclick="dlTemplate(true)">Template CSV</button><input type="file" id="impF" accept=".xlsx,.xls,.csv" onchange="impPick(this)" style="max-width:320px"></div><div id="impPrev" style="margin-top:14px"></div></div>`;
async function dlTemplate(csvOnly){
  try{await loadXlsx()}catch(e){return toast(e.message)}
  const head=IMP_COLS.map(c=>c[0]),ex=[
    ["(Contoh) Budi Santoso","budi@contoh.com","rahasia123","081234567890","karyawan","Staff Sales",(DEPTS()[0]||{name:"Sales"}).name,"atasan@contoh.com","hr@contoh.com","Otomatis",5000000,"TK0",50000000,2,0,"","","","BCA","1234567890","Budi Santoso","2024-01-15","PKWTT"],
    ["(Contoh) Sari Dewi","sari@contoh.com","","085711112222","karyawan","Admin","Operasional","","","2x sehari",4500000,"K0",0,0,0,"08:00","17:00",10,"Mandiri","1300012345678","Sari Dewi","2025-06-01","PKWT"]];
  const ws=XLSX.utils.aoa_to_sheet([head,...ex]);ws["!cols"]=head.map(h=>({wch:Math.max(14,h.length+2)}));
  if(csvOnly){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+XLSX.utils.sheet_to_csv(ws)],{type:"text/csv"}));a.download="template-import-karyawan.csv";a.click();return}
  const gd=[["PANDUAN PENGISIAN"],[""],["Sheet 'Karyawan': 1 baris = 1 karyawan. Hapus 2 baris contoh (email @contoh.com otomatis ditolak)."],
    ["Wajib: Nama, Email, No WhatsApp (kecuali role admin). Kolom lain boleh kosong."],["Password Awal: minimal 6 karakter. Kosong = dibuatkan otomatis. Karyawan wajib menggantinya saat login pertama."],
    ["Role: karyawan / hr / admin (kosong = karyawan)"],["Departemen: nama bebas, departemen baru otomatis dibuat. Daftar saat ini: "+(DEPTS().map(d=>d.name).join(", ")||"(belum ada)")],
    ["Email Atasan / Email HR: email karyawan yang sudah ada ATAU ada di file ini. Kosong = ikut default departemen. Email HR harus ber-role hr/admin."],
    ["Mode Absensi: Otomatis / 2x sehari / 4x sehari"],["Status PTKP: "+Object.keys(PTKP).join(", ")+" (kosong = TK0)"],
    ["Bank, No Rekening, Atas Nama Rekening: untuk export transfer gaji (opsional, bisa diisi nanti di menu Karyawan). No rekening hanya angka."],["Gaji Pokok, Target Penjualan, Bonus Tetap: angka rupiah tanpa teks (boleh pakai titik pemisah). Bonus %: angka, mis. 2 atau 2,5"],
    ["Jam Masuk/Pulang Khusus: format HH:MM (24 jam), kosong = ikut Jadwal Kerja. Toleransi: menit, kosong = ikut Jadwal Kerja."],
    ["Tanggal Masuk: format YYYY-MM-DD (mis. 2024-01-15) atau DD/MM/YYYY. Cuti tahunan baru bisa diajukan setelah 1 tahun sejak tanggal ini. Status Karyawan: PKWTT / PKWT / Probation / Magang / Harian (Probation, Magang, Harian belum dapat cuti tahunan)."],
    ["Tunjangan, lokasi absen khusus, dan rekam wajah diatur setelah import (wajah direkam karyawan sendiri saat login pertama)."]];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Karyawan");const wg=XLSX.utils.aoa_to_sheet(gd);wg["!cols"]=[{wch:130}];XLSX.utils.book_append_sheet(wb,wg,"Panduan");
  XLSX.writeFile(wb,"template-import-karyawan.xlsx");
}
const impTime=s=>{const m=String(s||"").trim().match(/^(\d{1,2})[:.](\d{2})$/);return m&&+m[1]<24&&+m[2]<60?pad(+m[1])+":"+m[2]:null};
const impDate=s=>{s=String(s||"").trim();if(!s)return"";let y,m,d,x;
  if(x=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/)){y=+x[1];m=+x[2];d=+x[3]}
  else if(x=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/)){let a=+x[1],b=+x[2];y=+x[3];if(y<100)y+=2000;if(a<=12&&b>12){m=a;d=b}else{d=a;m=b}}
  else return null;
  const t=new Date(y,m-1,d);return t.getFullYear()===y&&t.getMonth()===m-1&&t.getDate()===d&&y>1970&&y<2100?`${y}-${pad(m)}-${pad(d)}`:null};
const impStatus=s=>{const v=String(s||"").trim().toLowerCase();if(!v)return"";if(v.startsWith("pkwtt")||v.startsWith("tetap"))return"PKWTT";if(v.startsWith("pkwt")||v.startsWith("kontrak"))return"PKWT";
  if(v.startsWith("prob")||v.startsWith("percobaan"))return"Probation";if(v.startsWith("magang")||v.startsWith("intern"))return"Magang";if(v.startsWith("harian")||v.startsWith("freelance"))return"Harian";return null};
const impMoney=s=>+String(s||"").replace(/[^\d]/g,"")||0;
const impPw=()=>{const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",a=new Uint32Array(8);crypto.getRandomValues(a);return Array.from(a,x=>c[x%c.length]).join("")};
function impBuild(raw){
  const rows=raw.map((o,i)=>{const r={_n:i+2};for(const k in o){const f=IMP_MAP[normH(k)];if(f)r[f]=String(o[k]??"").trim()}return r}).filter(r=>IMP_COLS.some(c=>r[c[1]]));
  const exist=Object.fromEntries(USERS.filter(u=>u.email).map(u=>[u.email.toLowerCase(),u])),seen={},fileRole={};
  rows.forEach(r=>{if(r.email)fileRole[r.email.toLowerCase()]=(r.role||"karyawan").toLowerCase()});
  return rows.map(r=>{
    const e=[],em=(r.email||"").toLowerCase(),role=(r.role||"karyawan").toLowerCase();
    if(!r.name)e.push("Nama kosong");
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))e.push("Email tidak valid");
    else if(em.endsWith("@contoh.com"))e.push("Baris contoh, hapus/ganti");
    else if(exist[em])e.push("Email sudah terdaftar");
    else if(seen[em])e.push("Email dobel di file (baris "+seen[em]+")");
    seen[em]=seen[em]||r._n;
    if(!ROLE_OPT.includes(role))e.push("Role harus karyawan/atasan/hr/admin");
    const wa=normWA(r.wa);if(role!=="admin"&&!waOk(wa))e.push("No WhatsApp tidak valid");
    if(r.pw&&r.pw.length<6)e.push("Password min 6 karakter");
    const pt=(r.ptkp||"TK0").toUpperCase();if(!PTKP[pt])e.push("PTKP tidak dikenal");
    const si=r.shiftIn?impTime(r.shiftIn):"",so=r.shiftOut?impTime(r.shiftOut):"";if(si===null||so===null)e.push("Format jam harus HH:MM");
    const chk=(mail,lbl,needHr)=>{const m=(mail||"").toLowerCase();if(!m||m===em)return;
      const rl=exist[m]?exist[m].role:fileRole[m];if(!rl)return e.push(lbl+" tidak ditemukan: "+mail);if(needHr&&!["hr","admin"].includes(rl))e.push(lbl+" harus ber-role hr/admin")};
    chk(r.atasanEmail,"Atasan",false);chk(r.hrEmail,"HR",true);
    const jd=impDate(r.joinDate),es=impStatus(r.empStatus);
    if(jd===null)e.push("Tanggal masuk tidak valid (pakai YYYY-MM-DD)");if(es===null)e.push("Status karyawan tidak dikenal (PKWTT/PKWT/Probation/Magang/Harian)");
    const m=String(r.mode||"").toLowerCase();
    const d={name:r.name,email:em,wa,role,jabatan:r.jabatan||"",dept:r.dept||"",absenMode:m.startsWith("4")?ABSEN_OPT[2]:m.startsWith("2")?ABSEN_OPT[1]:ABSEN_OPT[0],
      pokok:impMoney(r.pokok),ptkp:PTKP[pt]?pt:"TK0",target:impMoney(r.target),bonusPct:parseFloat(String(r.bonusPct||"").replace(",","."))||0,bonusFlat:impMoney(r.bonusFlat),
      bank:r.bank||"",rek:String(r.rek||"").replace(/\D/g,""),rekName:r.rekName||"",joinDate:jd||"",empStatus:es||"",shiftIn:si||"",shiftOut:so||"",tol:r.tol===""||r.tol===undefined?null:(+r.tol||0),tunjangan:0,tunjanganList:[],locMode:"default",atasanId:"",atasanName:"",hrId:"",hrName:""};
    return{...r,d,pw:r.pw||impPw(),genPw:!r.pw,err:e};
  });
}
async function impPick(inp){
  const f=inp.files[0],box=$("#impPrev");if(!f)return;box.innerHTML='<p class="mut">Membaca file...</p>';
  try{await loadXlsx();const wb=XLSX.read(await f.arrayBuffer(),{type:"array"}),ws=wb.Sheets["Karyawan"]||wb.Sheets[wb.SheetNames[0]];
    IMP=impBuild(XLSX.utils.sheet_to_json(ws,{defval:"",raw:false}));
  }catch(e){IMP=[];box.innerHTML=`<p style="color:var(--bad)">${esc(e.message)}</p>`;return}
  inp.value="";impShow();
}
function impShow(){
  const box=$("#impPrev"),ok=IMP.filter(r=>!r.err.length).length;
  if(!IMP.length){box.innerHTML='<p class="mut">Tidak ada baris data di file. Pastikan header sama seperti template.</p>';return}
  box.innerHTML=`<p style="margin-bottom:8px"><b>${ok}</b> baris siap diimpor${IMP.length-ok?` · <span style="color:var(--bad)"><b>${IMP.length-ok}</b> baris bermasalah (dilewati)</span>`:""}</p>
  <div class="tw" style="max-height:320px;overflow:auto"><table><tr><th>#</th><th>Nama</th><th>Email</th><th>Role</th><th>Departemen</th><th>Atasan</th><th>HR</th><th>Hasil</th></tr>${IMP.map(r=>`<tr><td>${r._n}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.d.role)}</td><td>${esc(r.dept||"-")}</td><td>${esc(r.atasanEmail||"default")}</td><td>${esc(r.hrEmail||"default")}</td><td>${r.err.length?`<span style="color:var(--bad)">${esc(r.err.join("; "))}</span>`:'<span class="tag ok">OK</span>'}</td></tr>`).join("")}</table></div>
  <div style="margin-top:12px"><button class="btn" id="impGo" onclick="doImport()" ${ok?"":"disabled"}>Import ${ok} karyawan</button> <span id="impSt" class="mut"></span></div><div id="impOut"></div>`;
}
async function doImport(){
  const ok=IMP.filter(r=>!r.err.length);if(!ok.length)return;
  if(!await seatGuard(ok.length))return;
  if(!await uiConfirm(`Buat ${ok.length} akun karyawan sekarang?`))return;
  const st=m=>$("#impSt").textContent=m,btn=$("#impGo");btn.disabled=true;
  const a2=firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(firebaseConfig,"sec"),res=[],ids={};
  USERS.forEach(u=>{if(u.email)ids[u.email.toLowerCase()]=u.id});
  const D=[...DEPTS()];ok.forEach(r=>{if(r.d.dept&&!D.some(x=>x.name===r.d.dept))D.push({name:r.d.dept,headId:"",hrId:""})});
  for(let i=0;i<ok.length;i++){const r=ok[i];st(`Membuat akun ${i+1}/${ok.length}: ${r.d.name}`);
    try{const c=await mkAuth(a2,r.d.email,r.pw);await addUserDoc(c.user.uid,r.d);await credSync(r.pw,c.user.uid,r.d.email,"admin");ids[r.d.email]=c.user.uid;r.id=c.user.uid;res.push({r,ok:true})}
    catch(e){try{await a2.auth().signOut()}catch(_){}res.push({r,ok:false,msg:e.code==="auth/email-already-in-use"?"Email sudah terdaftar di sistem login":e.message})}}
  const made=res.filter(x=>x.ok).map(x=>x.r),nm=Object.fromEntries([...USERS.map(u=>[u.id,u.name]),...made.map(r=>[r.id,r.d.name])]),flag=new Set();
  st("Menyusun atasan & HR...");
  try{
    for(const r of made){const dp=D.find(x=>x.name===r.d.dept)||{};
      const sf=x=>x===r.id?"":x,a=sf(ids[(r.atasanEmail||"").toLowerCase()])||(dp.headId&&dp.headId!==r.id?dp.headId:""),h=sf(ids[(r.hrEmail||"").toLowerCase()])||(dp.hrId&&dp.hrId!==r.id?dp.hrId:"");
      if(a||h){await db.collection("users").doc(r.id).update({atasanId:a,atasanIds:a?[a]:[],atasanName:nm[a]||"",hrId:h,hrName:nm[h]||""});if(a)flag.add(a)}}
    for(const id of flag)await db.collection("users").doc(id).update({isAtasan:true});
    if(D.length!==DEPTS().length)await dSaveAll(D);
  }catch(e){toast("Akun dibuat, tapi atasan/HR gagal disusun: "+e.message)}
  window.IMP_RES=res;const bad=res.filter(x=>!x.ok);st("");
  $("#impOut").innerHTML=`<div class="box" style="margin-top:14px;background:#f0fdf4"><b>✅ ${made.length} akun berhasil dibuat</b>${bad.length?` · <span style="color:var(--bad)">${bad.length} gagal</span>`:""}<p class="mut" style="margin:6px 0 10px">Simpan daftar akun di bawah dan bagikan password ke karyawan secara aman. Mereka wajib mengganti password dan merekam wajah saat login pertama.</p>${bad.map(x=>`<div style="color:var(--bad)">${esc(x.r.d.name)} — ${esc(x.msg)}</div>`).join("")}<button class="btn" onclick="impCsv()">⬇️ Unduh daftar akun (CSV)</button> <button class="btn ghost" onclick="IMP=[];render()">Selesai</button></div>`;
}
const impCsv=()=>csv("akun-karyawan-baru.csv",[["Nama","Email","Password","Status"],...window.IMP_RES.map(x=>[x.r.d.name,x.r.d.email,x.ok?x.r.pw:"",x.ok?"dibuat":x.msg])]);

// ---------- Buat akun login (pakai ulang akun lama yang dokumennya pernah dihapus, jika password cocok) ----------
async function mkAuth(a2,email,pw){
  try{const c=await a2.auth().createUserWithEmailAndPassword(email,pw);await a2.auth().signOut();return c}
  catch(e){
    if(e.code!=="auth/email-already-in-use")throw e;
    try{const c=await a2.auth().signInWithEmailAndPassword(email,pw);await a2.auth().signOut();return c}
    catch(_){throw new Error("Email ini masih terdaftar di sistem login (akun lama yang pernah dihapus). Pakai password lama akun itu, atau hapus dulu di Firebase Console → Authentication.")}
  }
}
// ---------- Hapus karyawan ----------
const delUser=id=>delUsers([id]);
async function delUsers(ids){
  ids=[...new Set(ids)].filter(id=>id!==ME.id&&USERS.some(x=>x.id===id));if(!ids.length)return;
  const gone=new Set(ids),nm=ids.map(id=>USERS.find(x=>x.id===id).name);
  if(!await uiConfirm(ids.length===1?`Hapus ${nm[0]}?\nAkun ini tidak bisa login lagi. Data absensi & slip gaji lamanya tetap tersimpan.`:`Hapus ${ids.length} karyawan?\n${nm.slice(0,8).join(", ")}${nm.length>8?", dan "+(nm.length-8)+" lainnya":""}\nAkun mereka tidak bisa login lagi. Data absensi & slip gaji lamanya tetap tersimpan.`))return;
  const ref=x=>db.collection("users").doc(x);
  // bersihkan referensi atasan/HR pada karyawan yang tetap ada
  const ups=[];
  USERS.forEach(x=>{if(gone.has(x.id))return;const up={};if(atasanList(x).some(a=>gone.has(a))){const l=atasanList(x).filter(a=>!gone.has(a)),n=l.map(a=>(USERS.find(z=>z.id===a)||{}).name).filter(Boolean).join(", ");Object.assign(up,{atasanIds:l,atasanId:l[0]||"",atasanName:n})}if(gone.has(x.hrId)){up.hrId="";up.hrName=""}if(Object.keys(up).length)ups.push(["u",x.id,up])});
  ids.forEach(id=>{ups.push(["c",id])});
  for(let i=0;i<ups.length;i+=400){const b=db.batch();ups.slice(i,i+400).forEach(([t,id,up])=>t==="u"?b.update(ref(id),up):t==="d"?b.delete(ref(id)):b.delete(db.collection("credentials").doc(id)));await b.commit()}
  for(const id of ids)await delUserDoc(id);
  const D=DEPTS().map(d=>({...d,headId:gone.has(d.headId)?"":d.headId,hrId:gone.has(d.hrId)?"":d.hrId}));
  if(JSON.stringify(D)!==JSON.stringify(DEPTS()))await dSaveAll(D);
  toast(ids.length>1?ids.length+" karyawan dihapus":"Karyawan dihapus");if(gone.has(EDIT))EDIT=null;render();
}
