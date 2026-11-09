// ===== Jadwal Shift bergilir: jenis shift + kalender per tanggal per karyawan =====
// Dimuat setelah cuti.js dan sebelum app.js. Memakai variabel app.js (ME, SET, db, $, get, fld, head, V, ...) saat runtime.
// Data:
//  - settings/work.shifts = [{id,name,in,out,tol,color}]  (jenis shift, diatur admin)
//  - schedules/{uid}_{YYYY-MM-DD} = {uid,date,shiftId,name,in,out,tol,color} atau {uid,date,off:true,name:"Libur"}
//    (salinan jam shift saat dijadwalkan; tanggal = tanggal shift DIMULAI). Tanpa jadwal -> jam default karyawan / Jadwal Kerja.
addDict({
"Jadwal Shift":["Shift Schedule","排班表"],"Libur":["Off","休息"],"Jenis shift":["Shift types","班次类型"],"Nama shift":["Shift name","班次名称"],
"Jadwal Shift 7 Hari":["Shift schedule (7 days)","7天排班"]
});
const SH_COL=["#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#16a34a","#475569"];
const shiftList=()=>Array.isArray(SET.shifts)?SET.shifts:[];
const shErr=e=>e&&e.code==="permission-denied"?"Ditolak server. Pastikan aturan database (firestore.rules) yang baru sudah dipublikasikan: ada koleksi baru \"schedules\".":(e&&e.message)||String(e);
const shiftNight=s=>!s.off&&mn(s.out)<=mn(s.in); // shift lintas tengah malam, mis. 23:00 - 07:00

// ---------- Sisi karyawan ----------
// Muat jadwal milik ME ke cache SCH (dipakai shift() di app.js). Gagal (mis. aturan database belum diperbarui) -> abaikan, jam default dipakai.
async function schLoad(force){
  if(!ME||(!force&&Date.now()-SCH_T<15000))return;SCH_T=Date.now();
  try{const l=await get("schedules","uid",ME.id),m={};l.forEach(s=>m[s.id]=s);SCH=m}catch(e){}
}
// shift milik karyawan lain (dipakai saat HR/admin menyetujui absen lapangan)
async function shiftFor(uid,u,date){
  const k=uid+"_"+date;
  if(!SCH[k]){try{const s=await db.collection("schedules").doc(k).get();if(s.exists)SCH[k]={id:k,...s.data()}}catch(e){}}
  return shift({...u,id:uid},date);
}
// Rekaman absen yang sedang berjalan: hari ini, atau kemarin kalau shift malam (lintas hari) belum absen pulang dan belum lewat 4 jam dari jam pulang.
async function openRec(a){
  const now=new Date(),td=ymd(now),t=a.find(x=>x.date===td);if(t)return t;
  const y=new Date(now);y.setDate(y.getDate()-1);const yk=ymd(y),sh=shift(ME,yk);
  if(!shiftNight(sh)||mn(hm(now))>mn(sh.out)+240)return null;
  let r=a.find(x=>x.date===yk);
  if(!r){try{const s=await db.collection("attendance").doc(`${ME.id}_${yk}`).get();if(s.exists)r={id:s.id,...s.data()}}catch(e){}}
  return r&&r.in&&!r.out?r:null;
}
// kotak "Jadwal 7 hari ke depan" di beranda (kosong kalau belum ada jadwal)
function schStrip(){
  const l=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const k=ymd(d),s=SCH[ME.id+"_"+k];if(s)l.push([k,d,s])}
  if(!l.length)return"";
  return`<div class="box"><h3>${dsL("Jadwal Shift 7 Hari","Shift schedule (7 days)","7天排班")}</h3>${l.map(([k,d,s])=>`<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)"><span><b>${dsWD[LANG][d.getDay()]}</b> ${dsDate(k).slice(0,LANG==="zh"?99:6)}</span><span class="shchip" style="--c:${esc(s.color||"#64748b")}">${esc(s.off?"Libur":s.name+" "+s.in+"-"+s.out)}</span></div>`).join("")}</div>`;
}

// ---------- Sisi admin ----------
let SHF={mode:"week",from:new Date(),dept:"",form:null,color:SH_COL[0],map:{}};
function shRange(){
  const b=new Date(SHF.from);
  if(SHF.mode==="month")return[new Date(b.getFullYear(),b.getMonth(),1),new Date(b.getFullYear(),b.getMonth()+1,0)];
  const s=new Date(b.getFullYear(),b.getMonth(),b.getDate()-((b.getDay()+6)%7)),e=new Date(s.getFullYear(),s.getMonth(),s.getDate()+6);return[s,e];
}
const shDays=()=>{const[s,e]=shRange(),l=[];for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1))l.push(new Date(d));return l};
const shCommit=async fns=>{for(let i=0;i<fns.length;i+=400){const b=db.batch();fns.slice(i,i+400).forEach(f=>f(b));await b.commit()}};
function shDoc(u,d,v){
  if(!v||v==="x")return null;if(v==="off")return{uid:u,date:d,off:true,name:"Libur"};
  const s=shiftList().find(x=>x.id===v);return s?{uid:u,date:d,shiftId:s.id,name:s.name,in:s.in,out:s.out,tol:s.tol??null,color:s.color||""}:null;
}
// ops = [[uid, tanggal, nilai]]; nilai: "" / "x" = kosongkan, "off" = libur, selain itu id shift
async function schWrite(ops){
  await shCommit(ops.map(([u,d,v])=>b=>{const k=u+"_"+d,ref=db.collection("schedules").doc(k),doc=shDoc(u,d,v);
    if(doc){b.set(ref,doc);SHF.map[k]={id:k,...doc}}else{b.delete(ref);delete SHF.map[k]}}));
}
async function shiftView(){
  if(!ADMIN())return'<div class="box">Hanya admin yang bisa mengatur jadwal shift.</div>';
  const us=(await get("users")).filter(u=>u.role!=="admin").sort((a,b)=>(a.name||"").localeCompare(b.name||"")),L=shiftList(),[s,e]=shRange();
  SHF.map={};(await db.collection("schedules").where("date",">=",ymd(s)).where("date","<=",ymd(e)).get()).docs.forEach(d=>SHF.map[d.id]={id:d.id,...d.data()});
  const depts=[...new Set([...DEPTS().map(d=>d.name),...us.map(u=>u.dept).filter(Boolean)])].sort(),emps=us.filter(u=>!SHF.dept||(SHF.dept==="__none__"?!u.dept:u.dept===SHF.dept)),days=shDays();
  const lbl=SHF.mode==="month"?`${dsMO.id[s.getMonth()]} ${s.getFullYear()}`:`${dsDate(ymd(s))} – ${dsDate(ymd(e))}`;
  const opt=v=>`<option value="">—</option><option value="off"${v==="off"?" selected":""}>Libur</option>`+L.map(x=>`<option value="${esc(x.id)}"${v===x.id?" selected":""}>${esc(x.name)}</option>`).join("");
  const cell=(u,d)=>{const k=ymd(d),c=SHF.map[u.id+"_"+k],v=c?(c.off?"off":c.shiftId||""):"",orph=c&&!c.off&&!L.some(x=>x.id===c.shiftId);
    return`<td${d.getDay()===0?' class="sun"':""}><select data-search="0" data-u="${esc(u.id)}" data-d="${k}" onchange="schCell(this)" style="${c&&!c.off&&c.color?`--c:${esc(c.color)}`:c&&c.off?"--c:#94a3b8":""}" class="${c?"shon":""}">${opt(v)}${orph?`<option value="${esc(c.shiftId)}" selected>${esc(c.name)} (dihapus)</option>`:""}</select></td>`};
  const sel=(l,o,v,fn)=>`<div class="f"><label>${l}</label><select data-search="0" onchange="${fn}">${o.map(([a,b])=>`<option value="${esc(a)}"${a===v?" selected":""}>${esc(b)}</option>`).join("")}</select></div>`;
  const grid=!L.length?'<p class="mut">Buat dulu minimal satu jenis shift di atas.</p>':!emps.length?'<p class="mut">Tidak ada karyawan.</p>'
   :`<div class="tw"><table class="shgrid" data-search="0"><tr><th class="stk">Karyawan</th>${days.map(d=>`<th${d.getDay()===0?' class="sun"':""}>${dsWD.id[d.getDay()]}<br><small>${d.getDate()}</small></th>`).join("")}</tr>
    ${emps.map(u=>`<tr><td class="stk"><b>${esc(u.name)}</b>${u.dept?`<br><small class="mut">${esc(u.dept)}</small>`:""}<br><select data-search="0" class="shfill" onchange="schRow('${esc(u.id)}',this)"><option value="">⚡ Isi baris…</option>${L.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}<option value="off">Libur</option><option value="x">Kosongkan</option></select></td>${days.map(d=>cell(u,d)).join("")}</tr>`).join("")}</table></div>`;
  return head("Jadwal Shift","Shift bergilir per tanggal")+shTypes(L)
   +`<div class="box"><div class="row" style="flex-wrap:wrap;gap:8px"><span><button class="btn ghost sm" onclick="shNav(-1)">‹</button> <button class="btn ghost sm" onclick="shNav(1)">›</button> <b style="margin-left:6px">${lbl}</b></span>
    ${SHF.mode==="week"?'<button class="btn ghost sm" onclick="shCopy()">📋 Salin dari minggu lalu</button>':""}</div>
    <div class="fg" style="margin:12px 0 4px">${sel("Tampilan",[["week","Per minggu"],["month","Per bulan"]],SHF.mode,"shMode(this.value)")}${sel("Departemen",[["","Semua departemen"],...depts.map(d=>[d,d]),["__none__","Tanpa departemen"]],SHF.dept,"shDept(this.value)")}</div>
    <p class="mut" style="margin:0 0 10px"><small>Perubahan tersimpan otomatis. Sel kosong (—) = karyawan memakai jam default (Jadwal Kerja / jam khusus di data karyawan). Tanggal = tanggal shift dimulai.</small></p>${grid}</div>`;
}
function shTypes(L){
  const f=SHF.form,e=f?L.find(x=>x.id===f)||{}:{};
  const form=f===null?"":`<div class="box" style="background:#f8fafc;margin-top:12px"><h3>${f?"Edit shift":"Shift baru"}</h3><div class="fg">${fld("sh_name","Nama shift","text",0,e.name||"")}${fld("sh_in","Jam masuk","time",0,e.in||"")}${fld("sh_out","Jam pulang (lebih kecil dari jam masuk = lewat tengah malam)","time",0,e.out||"")}${fld("sh_tol","Toleransi terlambat (menit, kosong = ikut default)","number",0,e.tol??"")}</div>
    <div class="f"><label>Warna</label><div id="shcol" style="display:flex;gap:8px;flex-wrap:wrap">${SH_COL.map(c=>`<span class="swc${c===SHF.color?" on":""}" data-c="${c}" style="background:${c}" onclick="shColor('${c}')"></span>`).join("")}</div></div>
    <p class="mut" style="margin:0 0 10px"><small>Untuk shift malam, isi jam masuk sebelum tengah malam (mis. 23:00 sampai 07:00). Absen pulangnya otomatis tercatat di hari shift dimulai. Mengubah jam shift ikut memperbarui jadwal hari ini dan ke depan.</small></p>
    <button class="btn" onclick="saveShift()">Simpan</button> <button class="btn ghost" onclick="SHF.form=null;render()">Batal</button></div>`;
  return`<div class="box"><div class="row" style="flex-wrap:wrap"><h3 style="margin:0">Jenis shift</h3><span>${L.length?"":'<button class="btn ghost sm" onclick="shSeed()">✨ Buat contoh (Pagi, Siang, Malam)</button> '}<button class="btn sm" onclick="shOpen('')">＋ Shift baru</button></span></div>
   ${L.length?`<div class="tw"><table><tr><th>Shift</th><th>Jam</th><th>Toleransi</th><th></th></tr>${L.map(x=>`<tr><td><span class="shdot" style="background:${esc(x.color||"#64748b")}"></span> <b>${esc(x.name)}</b></td><td>${x.in} - ${x.out}${shiftNight(x)?' <span class="tag">lewat tengah malam</span>':""}</td><td>${x.tol!=null?x.tol+" mnt":'<span class="mut">default</span>'}</td><td><button class="btn ghost sm" onclick="shOpen('${esc(x.id)}')">Edit</button> <button class="btn ghost sm" onclick="shDel('${esc(x.id)}')">Hapus</button></td></tr>`).join("")}</table></div>`:'<p class="mut" style="margin-top:8px">Belum ada jenis shift.</p>'}${form}</div>`;
}
function shColor(c){SHF.color=c;document.querySelectorAll("#shcol .swc").forEach(x=>x.classList.toggle("on",x.dataset.c===c))}
function shOpen(id){SHF.form=id;SHF.color=(shiftList().find(x=>x.id===id)||{}).color||SH_COL[shiftList().length%SH_COL.length];render()}
async function shSeed(){
  const L=[["Pagi","07:00","15:00"],["Siang","15:00","23:00"],["Malam","23:00","07:00"]].map(([name,i,o],n)=>({id:"s"+Date.now().toString(36)+n,name,in:i,out:o,tol:null,color:SH_COL[n]}));
  await db.collection("settings").doc("work").set({shifts:L},{merge:true});SET.shifts=L;toast("Contoh shift dibuat, sesuaikan jamnya");render();
}
async function shSave(L){await db.collection("settings").doc("work").set({shifts:L},{merge:true});SET.shifts=L}
async function saveShift(){
  const n=$("#sh_name").value.trim(),i=$("#sh_in").value,o=$("#sh_out").value,t=$("#sh_tol").value.trim();
  if(!n)return toast("Nama shift wajib diisi");if(!i||!o)return toast("Isi jam masuk dan jam pulang");if(i===o)return toast("Jam masuk dan jam pulang tidak boleh sama");
  const L=[...shiftList()];if(L.some(x=>x.id!==SHF.form&&x.name.toLowerCase()===n.toLowerCase()))return toast("Nama shift sudah dipakai");
  const s={id:SHF.form||"s"+Date.now().toString(36),name:n,in:i,out:o,tol:t===""?null:Math.max(0,+t||0),color:SHF.color},x=L.findIndex(y=>y.id===s.id);
  try{
    x<0?L.push(s):L[x]=s;await shSave(L);
    if(x>=0){const td=ymd(new Date()),f=(await get("schedules","shiftId",s.id)).filter(d=>d.date>=td); // jadwal hari ini dan ke depan ikut jam baru
      await shCommit(f.map(d=>b=>b.update(db.collection("schedules").doc(d.id),{name:s.name,in:s.in,out:s.out,tol:s.tol,color:s.color})))}
    SHF.form=null;toast("Shift tersimpan");render();
  }catch(e){toast(shErr(e))}
}
async function shDel(id){
  const s=shiftList().find(x=>x.id===id);if(!s)return;
  if(!await uiConfirm(`Hapus shift "${s.name}"? Jadwal hari ini dan ke depan yang memakai shift ini akan dikosongkan (riwayat lama tidak berubah).`))return;
  try{
    const td=ymd(new Date()),f=(await get("schedules","shiftId",id)).filter(d=>d.date>=td);
    await shCommit(f.map(d=>b=>b.delete(db.collection("schedules").doc(d.id))));await shSave(shiftList().filter(x=>x.id!==id));
    toast("Shift dihapus");render();
  }catch(e){toast(shErr(e))}
}
function shNav(n){const d=new Date(SHF.from);SHF.from=SHF.mode==="month"?new Date(d.getFullYear(),d.getMonth()+n,1):new Date(d.getFullYear(),d.getMonth(),d.getDate()+7*n);render()}
function shMode(v){SHF.mode=v;render()}
function shDept(v){SHF.dept=v;render()}
async function schCell(el){
  try{await schWrite([[el.dataset.u,el.dataset.d,el.value]]);const c=SHF.map[el.dataset.u+"_"+el.dataset.d];
    el.className=c?"shon":"";el.style.cssText=c?`--c:${c.off?"#94a3b8":c.color||"#64748b"}`:"";if(el.dataset.u===ME.id)SCH_T=0}
  catch(e){toast(shErr(e));render()}
}
async function schRow(uid,el){
  const v=el.value;if(!v)return;el.value="";
  const days=shDays().filter(d=>v==="x"||!dsOff(d)); // isi semua hari kerja (Minggu / Sabtu libur mengikuti pengaturan hari kerja)
  try{await schWrite(days.map(d=>[uid,ymd(d),v]));render()}catch(e){toast(shErr(e))}
}
async function shCopy(){
  const[s]=shRange(),p=new Date(s.getFullYear(),s.getMonth(),s.getDate()-7),pe=new Date(s.getFullYear(),s.getMonth(),s.getDate()-1);
  try{
    const q=(await db.collection("schedules").where("date",">=",ymd(p)).where("date","<=",ymd(pe)).get()).docs.map(d=>d.data()),
      ids=new Set((await get("users")).filter(u=>u.role!=="admin"&&(!SHF.dept||(SHF.dept==="__none__"?!u.dept:u.dept===SHF.dept))).map(u=>u.id)),
      ops=q.filter(x=>ids.has(x.uid)).map(x=>{const d=new Date(x.date+"T00:00:00");d.setDate(d.getDate()+7);return[x.uid,ymd(d),x.off?"off":x.shiftId]}).filter(o=>o[2]==="off"||shiftList().some(y=>y.id===o[2]));
    if(!ops.length)return toast("Minggu lalu belum ada jadwal untuk disalin");
    if(!await uiConfirm(`Salin ${ops.length} jadwal dari minggu lalu ke minggu ini? Sel yang sudah terisi dan punya padanan minggu lalu akan ditimpa.`))return;
    await schWrite(ops);toast("Jadwal disalin");render();
  }catch(e){toast(shErr(e))}
}
