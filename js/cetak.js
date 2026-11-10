// ===== Cetak rapi: PDF untuk Laporan (karyawan), Rekap Absensi, dan daftar Karyawan =====
// Dimuat setelah pdf.js. Memakai MiniPDF, pdfLogo, pdfSave, COMP, ME, USERS, KF, RK, RKSEL, dsPd, dsWD, dsMO, shift, mn, myAtt, rkRange, rp, toast.
// pdfReport() = pembuat laporan tabel serbaguna: kop berlogo + judul, ringkasan, satu atau beberapa tabel (header diulang tiap halaman,
// baris selang-seling, teks panjang dipotong), nomor halaman, dan keterangan cetak.
const cpDate=k=>{const d=dsPd(k);return String(d.getDate()).padStart(2,"0")+" "+dsMO.id[d.getMonth()].slice(0,3)+" "+d.getFullYear()};
const cpNow=()=>new Date().toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"});
const cpName=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

// o = {title, sub, land, fs, summary:[teks], sections:[{h, cols:[[label,bobot,"l|r|c"]], rows:[[...]], foot:[...]|null, empty}], note, file, docTitle}
async function pdfReport(o){
  const d=new MiniPDF(!!o.land),W=d.W,H=d.H,M=o.land?28:40,R=W-M,ac=(COMP&&COMP.color)||"#0d9488",ink="#0f172a",mut="#64748b",
    fs=o.fs||(o.land?7.5:8.5),RH=o.land?16:17,lg=await pdfLogo((COMP&&COMP.logo)||"img/logo.svg");
  let y=0,pg=0,cur=null;
  const al=(a,x,w)=>a==="r"?x+w-4:a==="c"?x+w/2:x+4,aa=a=>a==="r"?"right":a==="c"?"center":"left";
  const thead=()=>{d.rect(M,y,R-M,RH+2,"#f1f5f9");let x=0;cur.cols.forEach(([t,,a],i)=>{const w=cur.cw[i];d.text(d.fit(t,w-6,fs,true),al(a,M+x,w),y+RH-4,{size:fs,bold:true,color:ac,align:aa(a)});x+=w});y+=RH+2};
  const top=()=>{pg++;if(pg>1)d.addPage();d.rect(0,0,W,58,ac);let tx=M;
    if(lg){const k=Math.min(34/lg.w,34/lg.h),w=lg.w*k,h=lg.h*k;d.rect(M-3,11,w+6,h+6,"#ffffff");d.image(lg,M,14,w,h);tx=M+w+14}
    d.text(d.fit((COMP&&COMP.name)||"Lapak Absen",(R-M)*.55,15,true),tx,30,{size:15,bold:true,color:"#ffffff"});
    if(COMP&&COMP.address)d.text(d.fit(COMP.address,(R-M)*.55,8.5,false),tx,46,{size:8.5,color:"#ffffffd9"});
    d.text(o.title,R,30,{size:13,bold:true,color:"#ffffff",align:"right"});if(o.sub)d.text(d.fit(o.sub,(R-M)*.45,8.5,false),R,46,{size:8.5,color:"#ffffff",align:"right"});
    y=76;if(cur)thead()};
  top();
  (o.summary||[]).forEach(s=>{d.text(d.fit(s,R-M,9,true),M,y,{size:9,bold:true,color:ink});y+=14});if((o.summary||[]).length)y+=4;
  for(const s of o.sections){
    const sum=s.cols.reduce((a,c)=>a+c[1],0),cw=s.cols.map(c=>c[1]/sum*(R-M));
    if(y+18+RH*3>H-48){cur=null;top()}
    if(s.h){d.text(s.h,M,y+8,{size:10.5,bold:true,color:ink});y+=18}
    cur={cols:s.cols,cw};thead();
    if(!s.rows.length){d.text(s.empty||"Tidak ada data.",M+4,y+12,{size:fs,color:mut});y+=RH+4}
    const line=(arr,bold,fill)=>{if(fill)d.rect(M,y,R-M,RH,fill);let x=0;s.cols.forEach(([,,a],i)=>{const w=cw[i],t=String(arr[i]??"");d.text(d.fit(t,w-8,fs,bold),al(a,M+x,w),y+RH-5,{size:fs,bold,color:ink,align:aa(a)});x+=w});d.line(M,y+RH,R,y+RH,"#e2e8f0",.4);y+=RH};
    s.rows.forEach((r,i)=>{if(y+RH>H-48){top()}line(r,false,i%2?"#f8fafc":null)});
    if(s.foot){if(y+RH>H-48)top();line(s.foot,true,"#e2f6f2")}
    cur=null;y+=16;
  }
  (o.note?[].concat(o.note):[]).forEach(t=>{if(y+12>H-48)top();d.text(d.fit(t,R-M,7.5,false),M,y,{size:7.5,color:mut});y+=11});
  d.pages.forEach((_,i)=>{d.cur=d.pages[i];d.line(M,H-34,R,H-34);d.text(`Dicetak ${cpNow()}  -  ${o.conf||"Dokumen internal"}`,M,H-22,{size:7.5,color:mut});d.text(`Halaman ${i+1} / ${d.pages.length}`,R,H-22,{size:7.5,color:mut,align:"right"})});
  pdfSave(d.build({title:o.docTitle||o.title}),o.file);
}
const cpTry=async(f,ok)=>{try{await f();toast(ok)}catch(e){console.error(e);toast("Gagal membuat PDF: "+e.message)}};

// ---------- 1. Laporan absensi (karyawan) ----------
async function lapPdf(){
  const a=(await myAtt()).slice().sort((x,y)=>x.date.localeCompare(y.date));if(!a.length)return toast("Belum ada data absensi untuk dicetak");
  await cpTry(async()=>{
    try{await schLoad()}catch(e){}
    const x4=a.some(x=>x.mid!==undefined),ok=a.filter(x=>x.status==="normal").length,late=a.length-ok;
    let lm=0;const rows=a.map(x=>{const sh=shift(ME,x.date),tm=x.status!=="normal"&&x.in?Math.max(0,mn(x.in)-mn(sh.in)):0;lm+=tm;
      return[cpDate(x.date),dsWD.id[dsPd(x.date).getDay()],x.in||"-",...(x4?[x.mid||"-",x.aft||"-"]:[]),x.out||"-",x.status==="normal"?"Normal":"Terlambat / abnormal",tm?tm+" mnt":"-"]});
    await pdfReport({title:"LAPORAN ABSENSI",sub:`Periode ${plabel()}`,
      summary:[`${ME.name}${ME.jabatan?" - "+ME.jabatan:""}${ME.dept?" - "+ME.dept:""}`,`Hadir ${a.length} hari  |  Normal ${ok}  |  Terlambat / abnormal ${late}${lm?"  |  Total keterlambatan "+lm+" menit":""}`],
      sections:[{cols:[["Tanggal",16,"l"],["Hari",9,"l"],["Masuk",9,"c"],...(x4?[["Siang",9,"c"],["Sore",9,"c"]]:[]),["Pulang",9,"c"],["Status",20,"l"],["Telat",10,"r"]],rows}],
      note:["Normal = absen masuk tepat waktu (sesuai jadwal dan toleransi). Telat = selisih menit dari jam masuk jadwal."],
      conf:"Rahasia, hanya untuk karyawan yang bersangkutan",file:`laporan-absensi_${cpName(ME.name)}_${ymd(new Date())}.pdf`,docTitle:"Laporan Absensi "+ME.name});
  },"PDF laporan diunduh");
}

// ---------- 2. Rekap Absensi (admin / HR) ----------
async function rkPdf(){
  const D=window.__RK;if(!D)return;
  const l=(RKSEL.size?D.vis.filter(x=>RKSEL.has(x.id)):D.vis).slice().sort((x,y)=>(D.nm[x.uid]||"").localeCompare(D.nm[y.uid]||"")||x.date.localeCompare(y.date));
  if(!l.length)return toast("Tidak ada data untuk dicetak");
  await cpTry(async()=>{
    const[f,t]=rkRange(),x4=l.some(x=>x.mid!==undefined||x.aft!==undefined),ok=l.filter(x=>x.status==="normal").length,secs=[];
    if(!RK.uid&&D.rows.length)secs.push({h:"Ringkasan per orang",cols:[["Nama",30,"l"],["Divisi",22,"l"],["Jumlah absen",12,"r"],["Normal",10,"r"],["Abnormal",11,"r"],["Tepat waktu",12,"r"]],
      rows:D.rows.map(r=>[D.nm[r.uid],D.dp[r.uid]||"-",r.hari,r.ok,r.bad,(r.hari?Math.round(r.ok/r.hari*100):0)+"%"]),
      foot:["Total","",D.rows.reduce((s,r)=>s+r.hari,0),D.rows.reduce((s,r)=>s+r.ok,0),D.rows.reduce((s,r)=>s+r.bad,0),""]});
    secs.push({h:"Detail absensi"+({normal:" - hanya Normal",abnormal:" - hanya Abnormal / terlambat"}[RK.st]||"")+(RKSEL.size?" - baris terpilih":""),
      cols:[["Nama",24,"l"],["Divisi",16,"l"],["Tanggal",14,"l"],["Masuk",8,"c"],...(x4?[["Siang",8,"c"],["Sore",8,"c"]]:[]),["Pulang",8,"c"],["Status",12,"l"]],
      rows:l.map(x=>[D.nm[x.uid]||"-",D.dp[x.uid]||"-",cpDate(x.date),x.in||"-",...(x4?[x.mid||"-",x.aft||"-"]:[]),x.out||"-",x.status==="normal"?"Normal":"Abnormal"])});
    const O=D.OT;if(O&&O.sum&&O.sum.length)secs.push({h:"Ringkasan lembur (disetujui)",cols:[["Nama",30,"l"],["Divisi",22,"l"],["Jumlah lembur",13,"r"],["Total jam",10,"r"],["Estimasi upah",16,"r"],["Menunggu",10,"r"]],
      rows:O.sum.map(p=>[D.nm[p.uid],D.dp[p.uid]||"-",p.n,p.jam,pdfRp(p.rp||0),p.pend||0]),foot:["Total","",O.sum.reduce((s,p)=>s+p.n,0),Math.round(O.sum.reduce((s,p)=>s+p.jam,0)*100)/100,pdfRp(O.sum.reduce((s,p)=>s+(p.rp||0),0)),""]});
    await pdfReport({title:"REKAP ABSENSI",sub:`${cpDate(f)} - ${cpDate(t)}`,summary:[`${D.lbl}`,`${l.length} catatan absen  |  Normal ${ok}  |  Abnormal / terlambat ${l.length-ok}`],sections:secs,
      note:["Abnormal = terlambat melewati toleransi. Estimasi upah lembur mengikuti aturan lembur di Pengaturan Payroll."],conf:"Rahasia, hanya untuk HRD / manajemen",
      file:`rekap-absensi_${D.fn}${RKSEL.size?"_dipilih":RK.st?"_"+RK.st:""}.pdf`,docTitle:"Rekap Absensi "+D.lbl});
  },"PDF rekap absensi diunduh");
}

// ---------- 3. Daftar Karyawan (mengikuti filter departemen + pencarian; kalau ada yang dicentang, hanya itu) ----------
async function kryPdf(){
  const sel=new Set(typeof kSelIds==="function"?kSelIds():[]),vis=[...document.querySelectorAll("#ktab tr.u")].filter(r=>r.dataset.f!=="0").map(r=>r.querySelector(".kck")&&r.querySelector(".kck").value).filter(Boolean);
  const ids=sel.size?vis.filter(i=>sel.has(i)):vis,byId=Object.fromEntries(USERS.map(u=>[u.id,u])),list=ids.map(i=>byId[i]).filter(Boolean);
  if(!list.length)return toast("Tidak ada karyawan untuk dicetak");
  await cpTry(async()=>{
    const order=[...new Set(list.map(u=>u.dept||""))].sort((a,b)=>(a==="")-(b===""))||[],grp=order.map(k=>[k,list.filter(u=>(u.dept||"")===k).sort((a,b)=>a.name.localeCompare(b.name))]);
    const cols=[["No",4,"c"],["Nama",19,"l"],["Jabatan",15,"l"],["Role",7,"l"],["Status",8,"l"],["Tgl masuk",9,"l"],["WhatsApp",11,"l"],["Pokok",9,"r"],["Tunjangan",9,"r"],["PTKP",5,"c"],["Rekening",16,"l"]];
    const secs=grp.map(([k,l])=>({h:`${k||"Tanpa departemen"}  (${l.length} orang)`,cols,rows:l.map((u,i)=>[i+1,u.name,u.jabatan||"-",u.role||"karyawan",u.empStatus||"-",u.joinDate?cpDate(u.joinDate):"-",u.wa||"-",u.role==="admin"?"-":Math.round(u.pokok||0).toLocaleString("id-ID"),u.role==="admin"?"-":Math.round(u.tunjangan||0).toLocaleString("id-ID"),u.ptkp||"-",u.rek?(u.bank?u.bank+" ":"")+u.rek:"-"])}));
    const dn=KF.dept==="*"?"Semua departemen":(KF.dept||"Tanpa departemen");
    await pdfReport({title:"DAFTAR KARYAWAN",sub:`${dn}${KF.q.trim()?' - cari "'+KF.q.trim()+'"':""}${sel.size?" - terpilih":""}`,land:true,
      summary:[`${list.length} karyawan di ${grp.length} departemen`],sections:secs,note:["Nominal gaji pokok dan tunjangan dalam Rupiah per bulan."],conf:"Rahasia, hanya untuk HRD / manajemen",
      file:`daftar-karyawan_${ymd(new Date())}.pdf`,docTitle:"Daftar Karyawan"});
  },"PDF daftar karyawan diunduh");
}
