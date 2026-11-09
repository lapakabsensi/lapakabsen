// ===== Payroll lanjutan: PPh21 TER (PMK 168/2023), BPJS, lembur, THR, hari libur nasional =====
// Dimuat setelah app.js. Dipakai oleh hitung() (app.js), calcSlip() (features.js), leaveDays() (cuti.js), dsOff() (dash.js).

// --- Tabel TER bulanan, Lampiran PP 58/2023 (batas atas bruto sebulan, tarif %). A: TK/0 TK/1 K/0 | B: TK/2 TK/3 K/1 K/2 | C: K/3
const TER={
 A:[[5400000,0],[5650000,.25],[5950000,.5],[6300000,.75],[6750000,1],[7500000,1.25],[8550000,1.5],[9650000,1.75],[10050000,2],[10350000,2.25],[10700000,2.5],[11050000,3],[11600000,3.5],[12500000,4],[13750000,5],[15100000,6],[16950000,7],[19750000,8],[24150000,9],[26450000,10],[28000000,11],[30050000,12],[32400000,13],[35400000,14],[39100000,15],[43850000,16],[47800000,17],[51400000,18],[56300000,19],[62200000,20],[68600000,21],[77500000,22],[89000000,23],[103000000,24],[125000000,25],[157000000,26],[206000000,27],[337000000,28],[454000000,29],[550000000,30],[695000000,31],[910000000,32],[1400000000,33],[Infinity,34]],
 B:[[6200000,0],[6500000,.25],[6850000,.5],[7300000,.75],[9200000,1],[10750000,1.5],[11250000,2],[11600000,2.5],[12600000,3],[13600000,4],[14950000,5],[16400000,6],[18450000,7],[21850000,8],[26000000,9],[27700000,10],[29350000,11],[31450000,12],[33950000,13],[37100000,14],[41100000,15],[45800000,16],[49500000,17],[53800000,18],[58500000,19],[64000000,20],[71000000,21],[80000000,22],[93000000,23],[109000000,24],[129000000,25],[163000000,26],[211000000,27],[374000000,28],[459000000,29],[555000000,30],[704000000,31],[957000000,32],[1405000000,33],[Infinity,34]],
 C:[[6600000,0],[6950000,.25],[7350000,.5],[7800000,.75],[8850000,1],[9800000,1.25],[10950000,1.5],[11200000,1.75],[12050000,2],[12950000,3],[14150000,4],[15550000,5],[17050000,6],[19500000,7],[22700000,8],[26600000,9],[28100000,10],[30100000,11],[32600000,12],[35400000,13],[38900000,14],[43000000,15],[47400000,16],[51200000,17],[55800000,18],[60400000,19],[66700000,20],[74500000,21],[83200000,22],[95600000,23],[110000000,24],[134000000,25],[169000000,26],[221000000,27],[390000000,28],[463000000,29],[561000000,30],[709000000,31],[965000000,32],[1419000000,33],[Infinity,34]]
};
const terKat=p=>["TK0","TK1","K0"].includes(p)?"A":["TK2","TK3","K1","K2"].includes(p)?"B":"C";
const terPct=(k,b)=>{for(const[m,r]of TER[k])if(b<=m)return r;return 34};

// PPh21: bulan biasa = bruto × TER; masa pajak terakhir (Desember / bulan terakhir bekerja) = hitung ulang setahun (Pasal 17) dikurangi PPh yang sudah dipotong.
// Bruto untuk pajak = penghasilan tunai + premi yang dibayar perusahaan (JKK, JKM, BPJS Kesehatan perusahaan). Tanpa NPWP: tarif ×120%.
function pphCalc(u,bp_,bp,cx){
  const pt=u.ptkp||"TK0",f=u.npwp==="Tidak"?1.2:1,nul={pkp:null,biayaJabatan:null,pphTahun:null,pphDibayar:null,bulanPajak:null,terKat:null,terPct:null,pphCatatan:""};
  if(!cx.last){const k=terKat(pt),pc=terPct(k,bp_);return{...nul,pph:Math.floor(+(bp_*pc*f/100).toFixed(4)),pphMetode:"TER "+k,terKat:k,terPct:pc}}
  const pv=cx.prev||{n:0,bruto:0,iuran:0,pph:0},n=pv.n+1,tot=pv.bruto+bp_,bj=Math.min(tot*.05,500000*n),neto=tot-bj-(pv.iuran+bp.iuranPensiun);
  const pkp=Math.max(0,Math.floor((neto-PTKP[pt]*n/12)/1000)*1000),thn=Math.round(pphTahun(pkp)*f);
  return{...nul,pph:thn-pv.pph,pphMetode:"Tahunan",pkp,biayaJabatan:Math.round(bj),pphTahun:thn,pphDibayar:pv.pph,bulanPajak:n,pphCatatan:n<12?`Hanya ${n} bulan slip tahun ini yang tercatat; PTKP dihitung proporsional ${n}/12.`:""};
}

// BPJS (bagian karyawan dipotong dari gaji). Upah = gaji pokok + tunjangan. Kesehatan 5% (1% karyawan, batas upah 12 jt), JHT 5,7% (2%), JP 3% (1%, batas upah JP naik tiap Maret), JKK & JKM ditanggung perusahaan.
function bpjsCalc(u,base){
  const S=SET,on=S.bpjsOn!==false,kes=on&&u.bpjsKes!=="Tidak",tk=on&&u.bpjsTk!=="Tidak",r=Math.round;
  const kb=Math.min(base,+S.kesCap||12e6),jb=Math.min(base,+S.jpCap||11086300),jkkP=S.jkkPct!=null&&isFinite(+S.jkkPct)?+S.jkkPct:.24;
  const kesK=kes?r(kb*.01):0,kesP=kes?r(kb*.04):0,jhtK=tk?r(base*.02):0,jhtP=tk?r(base*.037):0,jpK=tk?r(jb*.01):0,jpP=tk?r(jb*.02):0,jkk=tk?r(base*jkkP/100):0,jkm=tk?r(base*.003):0;
  return{kesK,kesP,jhtK,jhtP,jpK,jpP,jkk,jkm,kary:kesK+jhtK+jpK,per:kesP+jhtP+jpP+jkk+jkm,premiKena:kesP+jkk+jkm,iuranPensiun:jhtK+jpK};
}

// Lembur (PP 35/2021, upah sejam = upah sebulan / 173). Hari kerja: jam 1 = 1,5x, berikutnya 2x.
// Hari libur/istirahat mingguan: 6 hari kerja = 7 jam 2x, jam ke-8 3x, ke-9 dst 4x; 5 hari kerja = 8 jam 2x, jam ke-9 3x, ke-10 dst 4x.
const otTiers=k=>k==="kerja"?[[1,1.5],[Infinity,2]]:k==="libur6"?[[7,2],[8,3],[Infinity,4]]:[[8,2],[9,3],[Infinity,4]];
const otMult=(h,t)=>{let m=0,pv=0;for(const[up,x]of t){m+=Math.max(0,Math.min(h,up)-pv)*x;pv=up;if(h<=up)break}return m};
function lemburCalc(u,reqs,ps,pe){
  const nol={jam:0,rp:0};if(u.lemburOn==="Tidak"||SET.otOn===false)return nol;
  const per=((u.pokok||0)+(u.tunjangan||0))/(+SET.otDiv||173),six=(+SET.workDays||6)!==5,by={};
  reqs.filter(r=>r.type==="lembur"&&r.status==="disetujui"&&r.mulai&&r.selesai&&r.tgl>=ymd(ps)&&r.tgl<=ymd(pe)).forEach(r=>{let h=(mn(r.selesai)-mn(r.mulai))/60;if(h<=0)h+=24;by[r.tgl]=(by[r.tgl]||0)+h});
  let jam=0,m=0;
  for(const[d,h]of Object.entries(by)){const w=new Date(d+"T00:00:00").getDay(),rest=w===0||(!six&&w===6)||isHoliday(d);jam+=h;m+=otMult(h,otTiers(rest?(six?"libur6":"libur5"):"kerja"))}
  return{jam:Math.round(jam*100)/100,rp:Math.round(per*m)};
}

// THR (Permenaker 6/2016): masa kerja >= 12 bulan = 1 bulan upah; 1-11 bulan = proporsional; < 1 bulan = tidak ada. Upah = pokok + tunjangan tetap.
function thrCalc(u,ref){
  if(!u.joinDate)return{rp:0,bln:0};
  const j=new Date(u.joinDate+"T00:00:00"),r=new Date(ref+"T00:00:00");let m=(r.getFullYear()-j.getFullYear())*12+r.getMonth()-j.getMonth();if(r.getDate()<j.getDate())m--;
  if(m<1)return{rp:0,bln:0};const b=Math.min(m,12);return{rp:Math.round(((u.pokok||0)+(u.tunjangan||0))*b/12),bln:b};
}

// Konteks hitung per karyawan (dipanggil calcSlip)
let THR_REF="",PK_LAST="auto";
function payCtx(u,reqs,slips,ps,pe){
  const cb=document.getElementById("thr_"+u.id),want=cb?cb.checked:!!(PAYM[u.id]&&PAYM[u.id].thr>0),y=PM.slice(0,4);
  const last=PK_LAST==="1"||(PK_LAST==="auto"&&PM.endsWith("-12"));
  const pv=slips.filter(s=>s.periode&&s.periode.startsWith(y)&&s.periode<PM),sum=f=>pv.reduce((a,s)=>a+(f(s)||0),0);
  return{lembur:lemburCalc(u,reqs,ps,pe),thr:want?thrCalc(u,THR_REF||ymd(pe)):{rp:0,bln:0},last,prev:{n:pv.length,bruto:sum(s=>s.brutoPajak!=null?s.brutoPajak:s.bruto),iuran:sum(s=>s.iuranPensiun),pph:sum(s=>s.pph)}};
}

// ---------- Hari libur nasional & cuti bersama (SKB 3 Menteri 2026 & 2027). L = libur nasional, C = cuti bersama ----------
const HOL_DEF=[
["2026-01-01","Tahun Baru 2026 Masehi","L"],["2026-01-16","Isra Mikraj Nabi Muhammad saw.","L"],["2026-02-16","Cuti bersama Tahun Baru Imlek","C"],["2026-02-17","Tahun Baru Imlek 2577","L"],["2026-03-18","Cuti bersama Nyepi","C"],["2026-03-19","Hari Suci Nyepi","L"],["2026-03-20","Cuti bersama Idulfitri","C"],["2026-03-21","Idulfitri 1447 H","L"],["2026-03-22","Idulfitri 1447 H","L"],["2026-03-23","Cuti bersama Idulfitri","C"],["2026-03-24","Cuti bersama Idulfitri","C"],["2026-04-03","Wafat Yesus Kristus","L"],["2026-04-05","Paskah","L"],["2026-05-01","Hari Buruh Internasional","L"],["2026-05-14","Kenaikan Yesus Kristus","L"],["2026-05-15","Cuti bersama Kenaikan Yesus Kristus","C"],["2026-05-27","Iduladha 1447 H","L"],["2026-05-28","Cuti bersama Iduladha","C"],["2026-05-31","Hari Raya Waisak","L"],["2026-06-01","Hari Lahir Pancasila","L"],["2026-06-16","1 Muharam Tahun Baru Islam","L"],["2026-08-17","Proklamasi Kemerdekaan","L"],["2026-08-25","Maulid Nabi Muhammad saw.","L"],["2026-12-24","Cuti bersama Natal","C"],["2026-12-25","Kelahiran Yesus Kristus (Natal)","L"],
["2027-01-01","Tahun Baru 2027 Masehi","L"],["2027-01-05","Isra Mikraj Nabi Muhammad saw.","L"],["2027-02-05","Cuti bersama Tahun Baru Imlek","C"],["2027-02-06","Tahun Baru Imlek 2578","L"],["2027-03-08","Hari Suci Nyepi","L"],["2027-03-09","Cuti bersama Idulfitri","C"],["2027-03-10","Idulfitri 1448 H","L"],["2027-03-11","Idulfitri 1448 H","L"],["2027-03-12","Cuti bersama Idulfitri","C"],["2027-03-15","Cuti bersama Idulfitri","C"],["2027-03-25","Cuti bersama Wafat Yesus Kristus","C"],["2027-03-26","Wafat Yesus Kristus","L"],["2027-03-28","Paskah","L"],["2027-05-01","Hari Buruh Internasional","L"],["2027-05-06","Kenaikan Yesus Kristus","L"],["2027-05-17","Iduladha 1448 H","L"],["2027-05-18","Cuti bersama Iduladha","C"],["2027-05-19","Cuti bersama Waisak","C"],["2027-05-20","Hari Raya Waisak","L"],["2027-06-01","Hari Lahir Pancasila","L"],["2027-06-06","1 Muharam Tahun Baru Islam","L"],["2027-08-15","Maulid Nabi Muhammad saw.","L"],["2027-08-17","Proklamasi Kemerdekaan","L"],["2027-12-24","Cuti bersama Natal","C"],["2027-12-25","Kelahiran Yesus Kristus (Natal)","L"],["2027-12-26","Isra Mikraj Nabi Muhammad saw.","L"]];
const holList=()=>Array.isArray(SET.holidays)?SET.holidays:HOL_DEF.map(([d,n,t])=>({d,n,t}));
const holName=d=>(holList().find(h=>h.d===d)||{}).n||"";
function isHoliday(d){const h=holList().find(x=>x.d===d);return !!h&&(h.t==="L"||SET.cbLibur!==false)}
const workDay=d=>{const w=d.getDay();return !(w===0||(w===6&&(+SET.workDays||6)===5))};
// cuti bersama memotong jatah cuti tahunan (SKB: "mengurangi hak cuti tahunan") bila diaktifkan admin
const _lb=leaveBal;
leaveBal=function(reqs,u=ME){
  const r=_lb(reqs,u);
  if(SET.cbPotong===true&&SET.cbLibur!==false&&r.aInfo.ok){const td=new Date();td.setHours(0,0,0,0);const end=new Date(Math.min(r.aInfo.end.getTime()-864e5,td.getTime()));let n=0;
    for(const h of holList())if(h.t==="C"){const d=pD(h.d);if(d>=r.aInfo.start&&d<=end&&workDay(d))n++}
    r.cbUsed=n;r.annual=Math.max(0,r.annual-n)}
  return r;
};

// ---------- Field baru di form Karyawan ----------
UF.push(["npwp","Punya NPWP / NIK terdaftar","select",["Ya","Tidak"]],["bpjsKes","Ikut BPJS Kesehatan","select",["Ya","Tidak"]],["bpjsTk","Ikut BPJS Ketenagakerjaan (JHT, JP, JKK, JKM)","select",["Ya","Tidak"]],["lemburOn","Berhak upah lembur","select",["Ya","Tidak"]]);

// ---------- Pengaturan di halaman Jadwal Kerja ----------
const _vj=V.jadwal;V.jadwal=async()=>(await _vj())+paySetBox()+holBox();
function paySetBox(){
  const yn=(id,l,v)=>fld(id,l,"select",["Ya","Tidak"],v?"Ya":"Tidak");
  return`<div class="box"><h3>Pengaturan Payroll</h3><p class="mut" style="margin-bottom:10px">Batas upah Jaminan Pensiun naik tiap Maret (Rp11.086.300 sejak 1 Maret 2026). Cek tarif & batas terbaru di BPJS Ketenagakerjaan setiap tahun, lalu ubah di sini.</p>
  <div class="fg">${yn("ps_bpjs","Potongan BPJS aktif",SET.bpjsOn!==false)}${fld("ps_kes","Batas upah BPJS Kesehatan (Rp)","money",0,SET.kesCap??12000000)}${fld("ps_jp","Batas upah Jaminan Pensiun (Rp)","money",0,SET.jpCap??11086300)}${fld("ps_jkk","Iuran JKK perusahaan (%, sesuai tingkat risiko 0,24–1,74)","text",0,String(SET.jkkPct??.24))}
  ${yn("ps_ot","Hitung upah lembur otomatis di slip",SET.otOn!==false)}${fld("ps_div","Pembagi upah sejam (lembur)","number",0,SET.otDiv??173)}${yn("ps_cbl","Perusahaan libur saat cuti bersama",SET.cbLibur!==false)}${yn("ps_cbp","Cuti bersama memotong jatah cuti tahunan",SET.cbPotong===true)}</div>
  <button class="btn" onclick="savePaySet()">Simpan</button></div>`;
}
async function savePaySet(){
  const j=parseFloat(String($("#ps_jkk").value).replace(",",".")),yes=id=>$("#"+id).value==="Ya";
  const d={bpjsOn:yes("ps_bpjs"),kesCap:num($("#ps_kes"))||12e6,jpCap:num($("#ps_jp"))||11086300,jkkPct:isFinite(j)&&j>=0?j:.24,otOn:yes("ps_ot"),otDiv:+$("#ps_div").value||173,cbLibur:yes("ps_cbl"),cbPotong:yes("ps_cbp")};
  await db.collection("settings").doc("work").set(d,{merge:true});SET={...SET,...d};toast("Pengaturan payroll tersimpan");render();
}
let HOL_Y=new Date().getFullYear();
function holBox(){
  const all=holList(),yrs=[...new Set([...all.map(h=>+h.d.slice(0,4)),HOL_Y])].sort(),l=all.filter(h=>h.d.startsWith(String(HOL_Y))).sort((a,b)=>a.d.localeCompare(b.d));
  const tj=t=>t==="C"?"Cuti bersama":"Libur nasional";
  return`<div class="box"><h3>Hari libur nasional & cuti bersama</h3><p class="mut" style="margin-bottom:10px">Bawaan: SKB 3 Menteri 2026 dan 2027. Tanggal di daftar ini tidak dihitung sebagai hari kerja untuk cuti dan "tanpa absen", dan lembur di tanggal ini dihitung tarif hari libur. Tambahkan SKB tahun berikutnya di sini saat sudah terbit.</p>
  <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:10px"><select style="width:auto" onchange="HOL_Y=+this.value;render()">${yrs.map(y=>`<option${y===HOL_Y?" selected":""}>${y}</option>`).join("")}</select><button class="btn ghost sm" onclick="holReset()">Kembalikan ke daftar bawaan</button></div>
  <div class="tw"><table><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th></th></tr>${l.map(h=>`<tr><td>${esc(h.d)}</td><td>${esc(h.n)}</td><td>${tj(h.t)}</td><td><button class="btn ghost sm" onclick="holDel('${h.d}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="4" class="mut">Belum ada data untuk tahun ini.</td></tr>'}</table></div>
  <div class="fg" style="margin-top:12px"><div class="f"><label>Tanggal</label><input type="date" id="h_d"></div><div class="f"><label>Keterangan</label><input id="h_n"></div><div class="f"><label>Jenis</label><select id="h_t"><option value="L">Libur nasional</option><option value="C">Cuti bersama</option></select></div></div><button class="btn" onclick="holAdd()">Tambah tanggal</button></div>`;
}
async function holSave(l){l.sort((a,b)=>a.d.localeCompare(b.d));await db.collection("settings").doc("work").set({holidays:l},{merge:true});SET={...SET,holidays:l};render()}
function holAdd(){const d=$("#h_d").value,n=$("#h_n").value.trim();if(!d||!n)return toast("Isi tanggal dan keterangan");holSave([...holList().filter(h=>h.d!==d),{d,n,t:$("#h_t").value}])}
const holDel=d=>holSave(holList().filter(h=>h.d!==d));
async function holReset(){if(!await uiConfirm("Kembalikan daftar hari libur ke bawaan (SKB 2026 & 2027)? Tanggal yang kamu tambahkan sendiri akan hilang.",{title:"Kembalikan hari libur?",ok:"Kembalikan",danger:true}))return;holSave(HOL_DEF.map(([d,n,t])=>({d,n,t})))}
