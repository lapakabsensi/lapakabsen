// ===== Saldo cuti per karyawan (admin / HR / atasan) + jatah cuti tahunan per orang + penjagaan saldo saat persetujuan =====
// Dimuat setelah payroll.js. Memakai fungsi cuti.js (annualInfo, leaveBal, reqDays, isAnn, pD, fDate, svcText) dan org.js (decide, atasanList).
// - Jatah cuti tahunan bisa diatur per karyawan (kolom "Jatah cuti tahunan khusus" di data karyawan); kosong = ikut pengaturan perusahaan (default 12).
// - Menu "Saldo Cuti": jatah, terpakai (disetujui), menunggu, sisa, dan Replacement Off untuk setiap karyawan. Admin melihat semua, HR / atasan hanya timnya.
// - Persetujuan cuti yang melebihi saldo diblokir otomatis (sisi penyetuju), jadi pengajuan yang lolos dari pengecekan form tetap tidak bisa disetujui.
addDict({"Saldo Cuti":["Leave Balances","假期余额"]});

// jatah khusus per karyawan
{const i=UF.findIndex(f=>f[0]==="offGrant");UF.splice(i+1,0,["cutiQuota","Jatah cuti tahunan khusus (hari, kosong = ikut pengaturan)","number"])}
const _ai=annualInfo;
annualInfo=function(u=ME,at){const r=_ai(u,at),q=+u.cutiQuota;if(q>0)r.quota=q;return r};

// ringkasan saldo satu karyawan dari daftar pengajuannya
function cutiStat(u,reqs){
  const a=annualInfo(u),b=leaveBal(reqs,u),cuti=reqs.filter(r=>r.type==="cuti"),sum=l=>l.reduce((x,r)=>x+reqDays(r),0);
  const ann=a.ok?cuti.filter(r=>isAnn(r)&&r.dari&&pD(r.dari)>=a.start&&pD(r.dari)<a.end):[],off=cuti.filter(r=>r.jenis==="Replacement Off");
  return{a,quota:a.quota,used:sum(ann.filter(r=>r.status==="disetujui"))+(b.cbUsed||0),wait:sum(ann.filter(r=>r.status==="menunggu")),left:b.annual,
    offGrant:+u.offGrant||0,offUsed:sum(off.filter(r=>r.status==="disetujui")),offWait:sum(off.filter(r=>r.status==="menunggu")),offLeft:b.off};
}

// pengajuan cuti milik karyawan dalam jangkauan peminta (admin: semua; HR / atasan: yang rantai persetujuannya melewati dia). Gagal baca -> kosong.
async function cutiScopeReqs(){
  if(ADMIN())return(await db.collection("requests").where("type","==","cuti").get()).docs.map(d=>({id:d.id,...d.data()}));
  const m=new Map();
  for(const[f,op]of[["hrId","=="],["atasanId","=="],["atasanIds","array-contains"]]){
    try{(await db.collection("requests").where(f,op,ME.id).get()).docs.forEach(d=>{if(d.data().type==="cuti")m.set(d.id,{id:d.id,...d.data()})})}catch(e){}
  }
  return[...m.values()];
}

// ---------- Halaman Saldo Cuti ----------
let SAL={dept:"",q:"",rows:[]};
async function saldoView(){
  const us=(await get("users")).filter(u=>u.role!=="admin"&&(ADMIN()||u.hrId===ME.id||atasanList(u).includes(ME.id))).sort((a,b)=>String(a.name).localeCompare(String(b.name))),
    all=await cutiScopeReqs(),by={};all.forEach(r=>(by[r.uid]=by[r.uid]||[]).push(r));
  SAL.rows=us.map(u=>({u,s:cutiStat(u,by[u.id]||[])}));
  const depts=[...new Set(us.map(u=>u.dept).filter(Boolean))].sort();
  AFTER=saldoDraw;
  return head("Saldo Cuti","Jatah, terpakai, dan sisa cuti tahunan per karyawan")
   +`<div class="box"><div class="fg"><div class="f"><label>Departemen</label><select data-search="0" onchange="SAL.dept=this.value;saldoDraw()"><option value="">Semua departemen</option>${depts.map(d=>`<option value="${esc(d)}"${SAL.dept===d?" selected":""}>${esc(d)}</option>`).join("")}</select></div>
    <div class="f"><label>Cari karyawan</label><input type="search" value="${esc(SAL.q)}" placeholder="nama…" oninput="SAL.q=this.value;saldoDraw()"></div></div>
    <div class="row" style="flex-wrap:wrap;gap:8px"><small class="mut" id="salN"></small><button class="btn ghost sm" onclick="saldoCsv()">⬇️ Unduh CSV</button></div></div>
   <div id="salSum"></div><div class="box tw" id="salTbl"></div>
   <p class="mut"><small>Terpakai = cuti yang sudah disetujui (termasuk potongan cuti bersama bila diaktifkan). Menunggu = pengajuan yang belum diputuskan, sudah mengurangi sisa supaya tidak bisa melebihi jatah. Jatah per orang bisa diatur di data karyawan; kosong = ikut pengaturan perusahaan.</small></p>`;
}
const salList=()=>SAL.rows.filter(({u})=>(!SAL.dept||u.dept===SAL.dept)&&(!SAL.q.trim()||String(u.name).toLowerCase().includes(SAL.q.trim().toLowerCase())));
function saldoDraw(){
  const l=salList(),t=$("#salTbl");if(!t)return;
  const ok=l.filter(x=>x.s.a.ok),low=ok.filter(x=>x.s.left<=0).length,avg=ok.length?(ok.reduce((a,x)=>a+x.s.left,0)/ok.length):0;
  $("#salN").textContent=`${l.length} karyawan`;
  $("#salSum").innerHTML=`<div class="stats"><div class="st"><b>${ok.length}</b>Berhak cuti tahunan</div><div class="st"><b>${avg.toFixed(1).replace(".",",")}</b>Rata-rata sisa (hari)</div><div class="st"><b>${low}</b>Saldo habis</div></div>`;
  const chip=(n,q)=>`<span class="tag ${n<=0?"no":n<=2?"":"ok"}">${dayTxt(n)} hari</span>`;
  t.innerHTML=`<table data-search="0" data-pg="saldo" data-pgq="0"><tr><th>Karyawan</th><th>Status &amp; masa kerja</th><th>Periode cuti</th><th>Jatah</th><th>Terpakai</th><th>Menunggu</th><th>Sisa</th><th>Replacement Off<br><small class="mut">sisa / jatah</small></th></tr>
   ${l.map(({u,s})=>`<tr><td><b>${esc(u.name)}</b><br><small class="mut">${esc([u.jabatan,u.dept].filter(Boolean).join(" · "))}</small></td><td>${esc(u.empStatus||"-")}<br><small class="mut">${u.joinDate?svcText(u.joinDate):"tgl masuk belum diisi"}</small></td>
   ${s.a.ok?`<td><small>${fDate(s.a.start)} –<br>${fDate(new Date(s.a.end.getTime()-864e5))}</small></td><td>${s.quota}${+u.cutiQuota>0?' <small class="mut">(khusus)</small>':""}</td><td>${dayTxt(s.used)}</td><td>${s.wait?dayTxt(s.wait):"-"}</td><td>${chip(s.left)}</td>`:`<td colspan="5"><span class="mut">Belum berhak</span><br><small class="mut">${esc(s.a.why)}</small></td>`}
   <td>${s.offGrant||s.offUsed||s.offWait?`${dayTxt(s.offLeft)} / ${s.offGrant}${s.offWait?` <small class="mut">(${dayTxt(s.offWait)} menunggu)</small>`:""}`:'<span class="mut">-</span>'}</td></tr>`).join("")||`<tr><td colspan="8">${emptyBox("👥","Belum ada karyawan","Tambahkan lewat form di atas atau import Excel.")}</td></tr>`}</table>`;
}
function saldoCsv(){
  csv(`saldo-cuti_${ymd(new Date())}.csv`,[["Nama","Departemen","Status","Tanggal masuk","Periode mulai","Periode akhir","Jatah tahunan","Terpakai","Menunggu","Sisa tahunan","RO jatah","RO terpakai","RO menunggu","RO sisa","Keterangan"],
   ...salList().map(({u,s})=>[u.name,u.dept||"",u.empStatus||"",u.joinDate||"",s.a.ok?ymd(s.a.start):"",s.a.ok?ymd(new Date(s.a.end.getTime()-864e5)):"",s.a.ok?s.quota:"",s.a.ok?s.used:"",s.a.ok?s.wait:"",s.a.ok?s.left:"",s.offGrant,s.offUsed,s.offWait,s.offLeft,s.a.ok?"":s.a.why])]);
}
V.saldo=saldoView;

// ---------- Blokir persetujuan yang melebihi saldo ----------
// Mengembalikan pesan kalau menyetujui pengajuan ini membuat saldo minus; "" kalau aman. Gagal membaca data -> "" (tidak menghalangi persetujuan).
async function cutiGuard(id){
  try{
    const r=(await db.collection("requests").doc(id).get()).data();
    if(!r||r.type!=="cuti"||r.status!=="menunggu")return"";
    const ro=r.jenis==="Replacement Off";if(!isAnn(r)&&!ro)return"";
    const u=(await db.collection("users").doc(r.uid).get()).data()||{},n=reqDays(r);
    let reqs;
    if(ADMIN())reqs=(await get("requests","uid",r.uid)).filter(x=>x.type==="cuti");
    else{const m=new Map();for(const x of await cutiScopeReqs())if(x.uid===r.uid)m.set(x.id,x);reqs=[...m.values()]}
    const b=leaveBal(reqs.filter(x=>x.id!==id),u);
    if(ro)return n>b.off?`Saldo Replacement Off ${u.name} tidak cukup (sisa ${b.off} hari, diajukan ${n} hari). Tolak pengajuan ini, atau tambah jatahnya di data karyawan.`:"";
    const a=b.aInfo;if(!a.ok)return`${u.name}: ${a.why} Pengajuan cuti tahunan ini tidak bisa disetujui.`;
    const d=pD(r.dari);if(d<a.start||d>=a.end)return"";
    return n>b.annual?`Saldo cuti tahunan ${u.name} tidak cukup (sisa ${b.annual} hari, diajukan ${n} hari). Tolak pengajuan ini, atau ubah jatahnya di data karyawan.`:"";
  }catch(e){return""}
}
const _decide=decide;
decide=async function(id,ok){
  if(ok){const m=await cutiGuard(id);if(m)return toast(m)}
  return _decide(id,ok);
};
