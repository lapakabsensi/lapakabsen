// ===== Rekap Absensi: rekap lembur + unduh Excel (.xlsx) =====
// Dimuat setelah payroll.js (pakai lemburCalc, loadXlsx, mn, rp, esc, RK, RKSEL, csv, toast).
// Lembur diambil dari pengajuan "Lembur" yang DISETUJUI pada rentang tanggal & filter (divisi / karyawan) yang sama dengan rekap absensi.
async function rkLembur(us,nm,dp,f,t){
  let rq=[];
  try{rq=(await db.collection("requests").where("type","==","lembur").get()).docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn("Rekap lembur:",e)}
  rq=rq.filter(r=>r.tgl>=f&&r.tgl<=t&&r.uid in nm&&(r.status==="disetujui"||r.status==="menunggu")&&r.mulai&&r.selesai);
  if(RK.dept)rq=rq.filter(r=>RK.dept==="__none__"?!dp[r.uid]:dp[r.uid]===RK.dept);
  if(RK.uid)rq=rq.filter(r=>r.uid===RK.uid);
  rq.forEach(r=>{let h=(mn(r.selesai)-mn(r.mulai))/60;if(h<=0)h+=24;r.jam=Math.round(h*100)/100});
  rq.sort((x,y)=>y.tgl.localeCompare(x.tgl)||(nm[x.uid]||"").localeCompare(nm[y.uid]||""));
  const uMap=Object.fromEntries(us.map(u=>[u.id,u])),per={};
  rq.forEach(r=>{const p=per[r.uid]=per[r.uid]||{uid:r.uid,n:0,jam:0,pend:0};if(r.status==="disetujui"){p.n++;p.jam+=r.jam}else p.pend++});
  const ps=new Date(f+"T00:00:00"),pe=new Date(t+"T00:00:00");
  Object.values(per).forEach(p=>{p.jam=Math.round(p.jam*100)/100;p.rp=typeof lemburCalc==="function"?lemburCalc(uMap[p.uid]||{},rq.filter(r=>r.uid===p.uid),ps,pe).rp:0});
  return{det:rq,sum:Object.values(per).sort((x,y)=>(nm[x.uid]||"").localeCompare(nm[y.uid]||""))};
}
function rkOtHtml(D){
  const O=D.OT;if(!O)return"";
  const ap=O.det.filter(r=>r.status==="disetujui"),jam=Math.round(ap.reduce((s,r)=>s+r.jam,0)*100)/100,upah=O.sum.reduce((s,p)=>s+(p.rp||0),0),pend=O.det.length-ap.length;
  return`<div class="box" id="rkOt"><div class="row" style="flex-wrap:wrap"><h3 style="margin:0">Rekap Lembur · ${esc(D.lbl)}</h3>${O.det.length?`<button type="button" class="btn ghost sm" onclick="rkOtCsv()">Unduh CSV lembur</button>`:""}</div>
  <p class="mut" style="margin:8px 0 12px"><b style="color:var(--ink)">${ap.length}</b> lembur disetujui · <b style="color:var(--ink)">${jam}</b> jam · estimasi upah <b style="color:var(--ink)">${rp(upah)}</b>${pend?` · ${pend} masih menunggu persetujuan (tidak dihitung)`:""}</p>
  ${O.det.length?`<div class="tw"><table data-pg="rklsum"><tr><th>Nama</th><th>Divisi</th><th>Jumlah lembur</th><th>Total jam</th><th>Estimasi upah</th><th>Menunggu</th></tr>${O.sum.map(p=>`<tr><td>${esc(D.nm[p.uid])}</td><td>${esc(D.dp[p.uid]||"-")}</td><td>${p.n}</td><td>${p.jam}</td><td>${rp(p.rp)}</td><td>${p.pend||"-"}</td></tr>`).join("")}</table></div>
  <h3 style="margin:18px 0 8px">Detail lembur</h3><div class="tw"><table data-pg="rkldet"><tr><th>Nama</th><th>Tanggal</th><th>Mulai</th><th>Selesai</th><th>Jam</th><th>Keterangan</th><th>Status</th></tr>${O.det.map(r=>`<tr><td>${esc(D.nm[r.uid]||"-")}</td><td>${r.tgl}</td><td>${r.mulai}</td><td>${r.selesai}</td><td>${r.jam}</td><td>${esc(r.ket||"-")}</td><td>${tag(r.status)}</td></tr>`).join("")}</table></div>`
  :`${emptyBox("⏱️","Tidak ada lembur","Pada rentang waktu dan filter ini.")}`}
  <p class="mut" style="margin-top:10px;font-size:12px">Estimasi upah memakai aturan lembur di Pengaturan Payroll (hari kerja / hari libur, pembagi upah sejam) dan gaji pokok + tunjangan karyawan; karyawan dengan lembur dimatikan dihitung Rp 0.</p></div>`;
}
const rkOtRows=D=>D.OT.det.map(r=>[D.nm[r.uid],D.dp[r.uid]||"",r.tgl,r.mulai,r.selesai,r.jam,r.ket||"",r.status]);
const RK_OT_H=["Nama","Divisi","Tanggal","Mulai","Selesai","Jam","Keterangan","Status"];
function rkOtCsv(){const D=window.__RK;if(!D||!D.OT||!D.OT.det.length)return toast("Tidak ada data lembur");csv(`rekap-lembur_${D.fn}.csv`,[RK_OT_H,...rkOtRows(D)]);toast(`${D.OT.det.length} baris lembur diunduh`)}

// ---- Excel: satu file, beberapa sheet (detail absensi mengikuti filter status / baris terpilih) ----
async function rkXlsx(){
  const D=window.__RK;if(!D)return;
  try{await loadXlsx()}catch(e){return toast(e.message)}
  const l=RKSEL.size?D.vis.filter(x=>RKSEL.has(x.id)):D.vis,x4=l.some(x=>x.mid!==undefined||x.aft!==undefined);
  const wb=XLSX.utils.book_new(),add=(name,rows,w)=>{const ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=w.map(c=>({wch:c}));if(rows.length>1)ws["!autofilter"]={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length-1,c:rows[0].length-1}})};XLSX.utils.book_append_sheet(wb,ws,name)};
  add("Detail Absensi",[["Nama","Divisi","Tanggal",...(x4?["Masuk","Siang","Sore","Pulang"]:["Masuk","Pulang"]),"Status"],...l.map(x=>[D.nm[x.uid],D.dp[x.uid]||"",x.date,...(x4?[x.in||"",x.mid||"",x.aft||"",x.out||""]:[x.in||"",x.out||""]),x.status])],x4?[26,18,12,9,9,9,9,12]:[26,18,12,9,9,12]);
  add("Ringkasan Absensi",[["Nama","Divisi","Jumlah Absen","Normal","Abnormal","Tepat Waktu (%)"],...D.rows.map(r=>[D.nm[r.uid],D.dp[r.uid]||"",r.hari,r.ok,r.bad,r.hari?Math.round(r.ok/r.hari*100):0])],[26,18,14,10,10,16]);
  const O=D.OT||{det:[],sum:[]};
  add("Ringkasan Lembur",[["Nama","Divisi","Jumlah Lembur (disetujui)","Total Jam","Estimasi Upah (Rp)","Menunggu Persetujuan"],...O.sum.map(p=>[D.nm[p.uid],D.dp[p.uid]||"",p.n,p.jam,p.rp||0,p.pend||0])],[26,18,24,12,18,20]);
  add("Detail Lembur",[RK_OT_H,...O.det.map(r=>[D.nm[r.uid],D.dp[r.uid]||"",r.tgl,r.mulai,r.selesai,r.jam,r.ket||"",r.status])],[26,18,12,9,9,8,40,12]);
  XLSX.writeFile(wb,`rekap-absensi_${D.fn}${RKSEL.size?"_dipilih":RK.st?"_"+RK.st:""}.xlsx`);
  toast(`Excel diunduh (${l.length} baris absensi, ${O.det.length} lembur)`);
}
