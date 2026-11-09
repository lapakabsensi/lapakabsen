// ===== Cuti: jenis cuti, tanggal masuk & status karyawan, jatah cuti tahunan (baru bisa setelah 1 tahun kerja) =====
// Dimuat setelah features.js dan sebelum app.js. Memakai variabel app.js (ME, SET, db, $, get, fld, head, flowBox, ...) saat runtime.
addDict({
"Cuti Tahunan":["Annual Leave","年假"],"Sakit dengan Surat Dokter":["Sick Leave with Medical Certificate","病假（有医生证明）"],"Sakit tanpa Surat Dokter":["Sick leave without Medical Certificate","病假（无医生证明）"],
"Cuti di Luar Tanggungan (Unpaid)":["Unpaid Leave","无薪假"],"Cuti Menikah":["Marriage leave","婚假"],"Menikahkan Anak":["Child marriage leave","子女结婚假"],"Khitanan Anak":["Circumcision leave","子女割礼假"],
"Pembaptisan Anak":["Child Baptism Leave","子女受洗假"],"Duka Cita (Keluarga Inti)":["Bereavement leave","丧假"],"Duka Cita (Anggota Keluarga Serumah)":["Bereavement leave – household member","丧假（同住家庭成员）"],
"Replacement Off":["Replacement Off","补休"],"Istri Melahirkan (Paternity)":["Paternity leave","陪产假"],"Cuti Melahirkan (Maternity)":["Maternity leave","产假"],
"Jenis Cuti":["Leave type","假期类型"],"Tanggal masuk kerja":["Join date","入职日期"],"Status karyawan":["Employment status","员工状态"],"Masa kerja":["Length of service","工龄"],"Hari: ":["Days: ","天数: "],
"Tanggal masuk":["Join date","入职日期"],
"Durasi":["Duration","时长"],"Seharian":["Full day","全天"],"Setengah hari - pagi libur (masuk siang)":["Half day - morning off (start after lunch)","半天 - 上午休（下午上班）"],"Setengah hari - siang libur (pulang siang)":["Half day - afternoon off (leave at lunch)","半天 - 下午休（中午下班）"]
});

// ---------- Status karyawan & masa kerja ----------
const EMP_ST=[["","— Belum diisi —"],["PKWTT","PKWTT (Karyawan tetap)"],["PKWT","PKWT (Kontrak)"],["Probation","Probation (Percobaan)"],["Magang","Magang"],["Harian","Harian lepas"]];
const NO_ANNUAL=["Probation","Magang","Harian"]; // status yang tidak mendapat cuti tahunan
const pD=s=>{const[y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d)};
const addY=(d,n)=>new Date(d.getFullYear()+n,d.getMonth(),d.getDate());
const fDate=d=>d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});
const svcYears=(j,at)=>{let y=at.getFullYear()-j.getFullYear();if(addY(j,y)>at)y--;return Math.max(0,y)};
function svcText(joinDate,at=new Date()){
  const j=pD(joinDate),m=Math.max(0,(at.getFullYear()-j.getFullYear())*12+at.getMonth()-j.getMonth()-(at.getDate()<j.getDate()?1:0));
  return (m>=12?Math.floor(m/12)+" th ":"")+(m%12)+" bln";
}

// ---------- Jenis cuti. max = batas hari per pengajuan (ketentuan umum UU Ketenagakerjaan); kind = jenis yang punya saldo ----------
const LEAVE=[
  {n:"Cuti Tahunan",kind:"annual",half:true},
  {n:"Sakit dengan Surat Dokter",doc:true,half:true},
  {n:"Sakit tanpa Surat Dokter",half:true},
  {n:"Cuti di Luar Tanggungan (Unpaid)",half:true},
  {n:"Cuti Menikah",max:3},
  {n:"Menikahkan Anak",max:2},
  {n:"Khitanan Anak",max:2},
  {n:"Pembaptisan Anak",max:2},
  {n:"Duka Cita (Keluarga Inti)",max:2},
  {n:"Duka Cita (Anggota Keluarga Serumah)",max:1},
  {n:"Replacement Off",kind:"off",half:true},
  {n:"Istri Melahirkan (Paternity)",max:2},
  {n:"Cuti Melahirkan (Maternity)",max:90}
];

// jumlah hari kerja dari tanggal a s/d b (inklusif). Minggu selalu libur; Sabtu libur jika hari kerja = 5/minggu. Hari libur nasional (dan cuti bersama bila perusahaan libur) tidak dihitung.
function leaveDays(a,b){
  if(!a||!b)return 0;const d=pD(a),e=pD(b);if((e-d)/864e5>800)return 999;
  const six=(+SET.workDays||6)!==5;let n=0;
  for(;d<=e;d.setDate(d.getDate()+1)){const w=d.getDay();if(w===0||(w===6&&!six)||(typeof isHoliday==="function"&&isHoliday(ymd(d))))continue;n++}
  return n;
}

// Cuti tahunan: baru berhak setelah 1 tahun kerja sejak tanggal masuk. Jatah (default 12 hari) berlaku per siklus, mulai tiap ulang tahun masa kerja.
function annualInfo(u=ME,at=new Date()){
  const quota=+SET.cutiQuota||12,today=new Date(at.getFullYear(),at.getMonth(),at.getDate());
  if(!u.joinDate)return{ok:false,quota,why:"Tanggal masuk kerja belum diisi admin, jadi cuti tahunan belum bisa dihitung."};
  if(NO_ANNUAL.includes(u.empStatus))return{ok:false,quota,why:`Status ${u.empStatus} belum mendapat cuti tahunan.`};
  const j=pD(u.joinDate),y=svcYears(j,today);
  if(y<1)return{ok:false,quota,why:"Cuti tahunan bisa diajukan setelah 1 tahun kerja, mulai "+fDate(addY(j,1))+".",from:addY(j,1)};
  return{ok:true,quota,start:addY(j,y),end:addY(j,y+1)};
}
const isAnn=r=>r.jenis==="Cuti Tahunan"||r.jenis==="Tahunan";
const liveReq=r=>r.type==="cuti"&&r.status!=="ditolak"; // yang menunggu ikut dihitung supaya tidak bisa mengajukan melebihi jatah
const reqDays=r=>+r.hari||leaveDays(r.dari,r.sampai);
function leaveBal(reqs,u=ME){
  const a=annualInfo(u);
  const used=a.ok?reqs.filter(r=>liveReq(r)&&isAnn(r)&&r.dari&&pD(r.dari)>=a.start&&pD(r.dari)<a.end).reduce((x,r)=>x+reqDays(r),0):0;
  const offUsed=reqs.filter(r=>liveReq(r)&&r.jenis==="Replacement Off").reduce((x,r)=>x+reqDays(r),0);
  return{aInfo:a,annual:a.ok?Math.max(0,a.quota-used):0,off:Math.max(0,(+u.offGrant||0)-offUsed)};
}

// ---------- Halaman Cuti ----------
let CUTI_BAL=null,CUTI_IMG=null,CUTI_REQS=[];const SURAT={};
const SESI={pagi:"Setengah hari - pagi libur (masuk siang)",siang:"Setengah hari - siang libur (pulang siang)"};
const dayTxt=n=>String(n).replace(".",","); // 0.5 -> "0,5"
async function cutiView(){
  const h=(await get("requests","uid",ME.id)).filter(r=>r.type==="cuti").sort((a,b)=>b.createdAt-a.createdAt),b=CUTI_BAL=leaveBal(h),a=b.aInfo;CUTI_IMG=null;CUTI_REQS=h;
  const lb=x=>x.kind==="annual"?`${x.n} (${TT("Sisa","Left","剩余")} ${dayTxt(b.annual)} ${TT("Hari","days","天")})`:x.kind==="off"?`${x.n} (${TT("Sisa","Left","剩余")} ${dayTxt(b.off)} ${TT("Hari","days","天")})`:x.n;
  const info=`<div class="box"><div class="row" style="flex-wrap:wrap;gap:6px 24px"><span><small class="mut">Tanggal masuk kerja</small><br><b>${ME.joinDate?fDate(pD(ME.joinDate)):"-"}</b></span><span><small class="mut">Masa kerja</small><br><b>${ME.joinDate?svcText(ME.joinDate):"-"}</b></span><span><small class="mut">Status karyawan</small><br><b>${esc(ME.empStatus||"-")}</b></span><span><small class="mut">Cuti tahunan</small><br><b>${a.ok?`${dayTxt(b.annual)} / ${a.quota} hari`:"Belum berhak"}</b></span></div>
    <p class="mut" style="margin-top:8px"><small>${a.ok?`Periode ${fDate(a.start)} – ${fDate(new Date(a.end.getTime()-864e5))}. Jatah baru diperbarui di ulang tahun masa kerja berikutnya.`:esc(a.why)}</small></p></div>`;
  return head("Pengajuan Cuti")+info+flowBox()
   +`<div class="two"><div class="box"><div class="fg"><div class="f"><label>Jenis Cuti</label><select id="f_jenis" onchange="cutiHint()">${LEAVE.map(x=>`<option value="${esc(x.n)}">${esc(lb(x))}</option>`).join("")}</select></div>
    <div class="f"><label>Dari</label><input id="f_dari" type="date" onchange="cutiHint()"></div><div class="f"><label>Sampai</label><input id="f_sampai" type="date" onchange="cutiHint()"></div>
    <div class="f" id="fSesi" style="display:none"><label>Durasi</label><select id="f_sesi" onchange="cutiHint()"><option value="">Seharian</option><option value="pagi">${SESI.pagi}</option><option value="siang">${SESI.siang}</option></select></div>
    <div class="f"><label>Alasan</label><textarea id="f_ket" rows="3"></textarea></div>
    <div class="f" id="fSurat" style="display:none"><label>Foto surat dokter *</label><input id="f_surat" type="file" accept="image/*" onchange="cutiPick(this)"><img id="f_suratP" alt="" style="display:none;max-width:220px;margin-top:8px;border-radius:8px;border:1px solid var(--line)"></div></div>
    <p id="cHint" class="mut" style="margin:0 0 12px"></p><button class="btn" id="cSend" onclick="sendCuti()">Kirim</button></div>
   <div class="box"><h3>Riwayat</h3>${h.map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row"><span>${reqInfo(r)} ${suratBtn(r)}</span>${reqStatus(r)}</div><small class="mut" style="display:block">${chainBar(r)}</small>${logLines(r)}</div>`).join("")||emptyBox("📝","Belum ada pengajuan","Isi formulir lalu klik Kirim.")}</div></div>`;
}
// validasi pengajuan; mengembalikan {err} atau {hari,msg}
function cutiCheck(){
  const jn=$("#f_jenis").value,dr=$("#f_dari").value,sp=$("#f_sampai").value,t=LEAVE.find(x=>x.n===jn),b=CUTI_BAL;
  if(!t||!b)return{err:"Pilih jenis cuti"};
  if(t.kind==="annual"&&!b.aInfo.ok)return{err:b.aInfo.why};
  if(!dr||!sp)return{err:"Isi tanggal Dari dan Sampai",soft:true};
  if(sp<dr)return{err:"Tanggal Sampai tidak boleh sebelum Dari"};
  if(t.doc&&!CUTI_IMG)return{err:"Upload foto surat dokter dulu."};
  let n=leaveDays(dr,sp);
  if(n<1)return{err:"Rentang tanggal itu hanya berisi hari libur, tidak ada hari kerja yang dipotong."};
  const se=($("#f_sesi")||{}).value||"";
  if(se){
    if(dr!==sp)return{err:"Setengah hari hanya untuk satu tanggal. Samakan tanggal Dari dan Sampai."};
    if(!t.half)return{err:`${t.n} tidak bisa diajukan setengah hari.`};
    n=0.5;
  }
  const clash=CUTI_REQS.filter(r=>liveReq(r)&&r.dari&&r.sampai&&r.dari<=sp&&r.sampai>=dr&&!(se&&+r.hari===0.5&&r.sesi&&r.sesi!==se&&r.dari===dr&&r.sampai===dr));
  if(clash.length)return{err:`Tanggal itu sudah ada pengajuan cuti (${clash[0].jenis}${+clash[0].hari===0.5?", setengah hari":""}, ${clash[0].dari}${clash[0].sampai!==clash[0].dari?" s/d "+clash[0].sampai:""}).`};
  if(t.max&&n>t.max)return{err:`${t.n} maksimal ${t.max} hari per pengajuan (kamu mengajukan ${n} hari).`};
  if(t.kind==="annual"){
    const a=b.aInfo;
    if(pD(dr)<a.start||pD(sp)>=a.end)return{err:`Cuti tahunan harus di dalam periode berjalan: ${fDate(a.start)} – ${fDate(new Date(a.end.getTime()-864e5))}.`};
    if(n>b.annual)return{err:`Sisa cuti tahunan ${dayTxt(b.annual)} hari, pengajuanmu ${dayTxt(n)} hari.`};
    return{hari:n,se,msg:`${dayTxt(n)} hari kerja${se?" (setengah hari)":""} · sisa setelah pengajuan ini: ${dayTxt(b.annual-n)} hari`};
  }
  if(t.kind==="off"){
    if(n>b.off)return{err:`Sisa Replacement Off ${dayTxt(b.off)} hari, pengajuanmu ${dayTxt(n)} hari.`};
    return{hari:n,se,msg:`${dayTxt(n)} hari kerja${se?" (setengah hari)":""} · sisa setelah pengajuan ini: ${dayTxt(b.off-n)} hari`};
  }
  return{hari:n,se,msg:`${dayTxt(n)} hari kerja${se?" (setengah hari)":""}`};
}
function cutiHint(){
  const el=$("#cHint");if(!el)return;const fs=$("#fSurat"),jt=LEAVE.find(x=>x.n===$("#f_jenis").value);if(fs)fs.style.display=jt&&jt.doc?"":"none";const fz=$("#fSesi"),one=$("#f_dari").value&&$("#f_dari").value===$("#f_sampai").value;if(fz){fz.style.display=jt&&jt.half&&one?"":"none";if(!(jt&&jt.half&&one))$("#f_sesi").value=""}const c=cutiCheck();
  el.style.color=c.err&&!c.soft?"var(--bad)":"";el.textContent=c.err?(c.soft?"":c.err):"✓ "+c.msg;
}
async function sendCuti(){
  const c=cutiCheck();if(c.err)return toast(c.err);
  const btn=$("#cSend");btn.disabled=true;
  try{
    await db.collection("requests").add({uid:ME.id,name:ME.name,type:"cuti",status:"menunggu",createdAt:Date.now(),dept:ME.dept||"",...atasanFields(ME),hrId:ME.hrId||"",hrName:ME.hrName||"",step:chainStart(ME),log:[],
      jenis:$("#f_jenis").value,dari:$("#f_dari").value,sampai:$("#f_sampai").value,hari:c.hari,...(c.se?{sesi:c.se,sesiLbl:SESI[c.se]}:{}),ket:$("#f_ket").value,...(LEAVE.find(x=>x.n===$("#f_jenis").value).doc?{surat:await savePhoto(CUTI_IMG,`req_${Date.now()}_surat.jpg`)}:{})});
    toast("Pengajuan terkirim");render();
  }catch(e){btn.disabled=false;toast(errMsg(e))}
}

// ---------- Foto surat dokter (disimpan kecil di dokumen pengajuan; jpeg maks 1000 px) ----------
async function cutiPick(inp){
  const f=inp.files[0],pv=$("#f_suratP");CUTI_IMG=null;if(pv)pv.style.display="none";if(!f)return cutiHint();
  try{const d=await imgData(f,1000,false,"image/jpeg");if(d.length>900000)throw new Error("Foto terlalu besar, coba foto ulang dengan resolusi lebih kecil.");
    CUTI_IMG=d;if(pv){pv.src=d;pv.style.display="block"}}
  catch(e){toast(e.message||"File harus berupa foto (JPG/PNG).");inp.value=""}
  cutiHint();
}
const suratBtn=r=>{let h="";if(r.surat){SURAT[r.id]=r.surat;h+=`<button type="button" class="btn sm ghost" onclick="viewSurat('${r.id}')">📎 Surat dokter</button>`}
  if(r.lampiran){SURAT[r.id+"_l"]=r.lampiran;h+=` <button type="button" class="btn sm ghost" onclick="viewSurat('${r.id}_l')">📎 Foto bukti</button>`}return h};
async function viewSurat(id){
  let s=SURAT[id];if(!s)return;
  try{s=await phUrl(s)}catch(e){return toast(phGone(e)?"Foto sudah dihapus otomatis (lebih dari 3 bulan)":"Foto tidak dapat dimuat")}
  const o=document.createElement("div");
  o.style.cssText="position:fixed;inset:0;background:#000d;z-index:9999;display:grid;place-items:center;padding:12px;cursor:zoom-out";
  o.innerHTML=`<img src="${s}" alt="Lampiran" style="max-width:100%;max-height:100%;border-radius:8px;background:#fff">`;o.onclick=()=>o.remove();document.body.appendChild(o);
}
