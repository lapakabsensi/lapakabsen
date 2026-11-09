// ===== Pajak akhir tahun: ringkasan bukti potong PPh 21 (1721-A1) per karyawan, Excel isian Coretax, PDF =====
// Dimuat setelah gajix.js. Sumber data: slip gaji (koleksi payslips) satu tahun pajak. Memakai get, USERS, PTKP, pphTahun, terKat,
// COMP, SET, MiniPDF, pdfSave, pdfLogo, pdfRp, loadXlsx, BLN_F, rp, esc, head, toast, fld, db.
// CATATAN: ini ringkasan untuk membantu mengisi bukti potong di Coretax (eBupot > BP A1). Dokumen resmi tetap diterbitkan lewat Coretax.

UF.push(["nik","NIK (untuk bukti potong PPh 21)","text"],["gender","Jenis kelamin","select",["","Laki-laki","Perempuan"]],["alamat","Alamat (sesuai KTP)","text"]);

const TAXY={y:new Date().getFullYear(),rows:[],users:[]};
const PJ_BLN=n=>String(n).padStart(2,"0");

// Hitung ringkasan setahun satu karyawan dari slip-slipnya. Mengembalikan null jika tidak ada slip.
function pjYear(u,slips,year){
  const sl=slips.filter(s=>s.periode&&s.periode.startsWith(year+"-")).sort((a,b)=>a.periode.localeCompare(b.periode));
  if(!sl.length)return null;
  const S=k=>Math.round(sl.reduce((a,s)=>a+(+s[k]||0),0)),n=sl.length,last=sl[n-1],warn=[];
  const bruto=S("brutoPajak")||S("bruto"),premi=S("premiKena"),pokok=S("pokok"),bonus=S("bonus"),lembur=S("lembur"),thr=S("thr"),iuran=S("iuranPensiun")||(S("bpjsJht")+S("bpjsJp"));
  const tunj=bruto-pokok-bonus-lembur-thr-premi; // tunjangan tetap & lainnya (sisa), supaya jumlah komponen = bruto
  const bj=Math.round(Math.min(bruto*.05,500000*n)),neto=bruto-bj-iuran,ptkpYr=Math.round((PTKP[u.ptkp||"TK0"]||PTKP.TK0)*n/12);
  const pkp=Math.max(0,Math.floor((neto-ptkpYr)/1000)*1000),f=u.npwp==="Tidak"?1.2:1,thn=Math.round(pphTahun(pkp)*f),dip=S("pph");
  const mons=sl.map(s=>+s.periode.slice(5)),miss=[];for(let m=mons[0];m<=mons[n-1];m++)if(!mons.includes(m))miss.push(BLN_F[m-1]);
  const jn=u.joinDate&&u.joinDate.startsWith(year+"-")?+u.joinDate.slice(5,7):1;
  if(mons[0]>jn&&mons[0]>1)warn.push("Slip mulai "+BLN_F[mons[0]-1]+" (karyawan masuk "+(u.joinDate||"tanggal belum diisi")+")");
  if(miss.length)warn.push("Slip belum ada: "+miss.join(", "));
  if(last.pphMetode!=="Tahunan")warn.push("Slip masa pajak terakhir (Desember / bulan terakhir bekerja) belum dihitung dengan metode tahunan; PPh terutang di bawah adalah perkiraan");
  if(!u.nik)warn.push("NIK belum diisi di menu Karyawan");
  if(u.npwp==="Tidak")warn.push("Tanpa NPWP: tarif ×120%");
  return{u,year,sl,n,awal:mons[0],akhir:mons[n-1],pokok,tunj,lembur,bonus,thr,premi,bruto,bj,iuran,neto,ptkp:ptkpYr,pkp,pphTahun:thn,pphDipotong:dip,selisih:thn-dip,
    penuh:n===12,warn,miskin:!!miss.length};
}
async function pajakView(){
  USERS=(await get("users")).filter(u=>u.role!=="admin");
  const all=await get("payslips"),by={};all.forEach(s=>{(by[s.uid]=by[s.uid]||[]).push(s)});
  const ys=[...new Set(all.map(s=>(s.periode||"").slice(0,4)).filter(Boolean).concat(String(new Date().getFullYear())))].sort().reverse();
  if(!ys.includes(String(TAXY.y)))TAXY.y=+ys[0];
  TAXY.rows=USERS.map(u=>pjYear(u,by[u.id]||[],TAXY.y)).filter(Boolean).sort((a,b)=>(a.u.name||"").localeCompare(b.u.name||""));
  const R=TAXY.rows,tot=k=>R.reduce((a,r)=>a+r[k],0),w=R.filter(r=>r.warn.length).length;
  return head("Pajak PPh 21","Ringkasan bukti potong tahunan (1721-A1)")+`<div class="box"><div class="bkbar"><div class="f" style="max-width:160px"><label>Tahun pajak</label><select onchange="TAXY.y=+this.value;render()">${ys.map(y=>`<option${+y===TAXY.y?" selected":""}>${y}</option>`).join("")}</select></div></div>
  <p class="mut">Dihitung dari slip gaji tahun ${TAXY.y}. Gunakan ringkasan ini untuk mengisi <b>eBupot &gt; BP A1</b> di Coretax (atau memeriksa isiannya); bukti potong resmi tetap diterbitkan lewat Coretax. Urutan kolom di Excel mengikuti layar isian BP A1 (informasi umum, penghasilan bruto, pengurang, penghitungan PPh). Ini <b>bukan</b> file impor XML resmi DJP.</p></div>
  <div class="box"><h3>Identitas pemotong</h3><div class="fg">${fld("tx_npwp","NPWP pemberi kerja (15/16 digit)","text",0,SET.taxNpwp||"")}${fld("tx_nitku","NITKU (NPWP 16 digit + 6 digit unit)","text",0,SET.taxNitku||"")}${fld("tx_ttd","Nama penandatangan bukti potong","text",0,SET.taxTtd||"")}</div><button class="btn" onclick="pajakSaveId()">Simpan identitas</button></div>
  <div class="box"><div class="row" style="gap:8px;flex-wrap:wrap"><h3 style="margin:0">Karyawan (${R.length})</h3><span style="flex:1"></span><button class="btn ghost" onclick="pajakXlsx()" ${R.length?"":"disabled"}>📗 Excel isian Coretax</button><button class="btn" onclick="pajakPdf()" ${R.length?"":"disabled"}>📄 PDF semua karyawan</button></div>
  ${w?`<p class="warn" style="margin:10px 0 0">⚠ ${w} karyawan perlu dicek sebelum dipakai (lihat kolom Catatan).</p>`:""}
  <div class="tw gj" style="margin-top:10px"><table><tr><th>Karyawan</th><th>Bulan</th><th>Bruto setahun</th><th>PKP</th><th>PPh terutang</th><th>Sudah dipotong</th><th>Selisih</th><th>Catatan</th><th></th></tr>${R.map((r,i)=>`<tr><td>${esc(r.u.name)}<br><small class="mut">${esc(r.u.nik||"NIK kosong")} · ${esc(r.u.ptkp||"TK0")}</small></td><td>${r.n}/12</td><td>${rp(r.bruto)}</td><td>${rp(r.pkp)}</td><td>${rp(r.pphTahun)}</td><td>${rp(r.pphDipotong)}</td><td>${r.selisih?rp(r.selisih):"-"}</td><td style="min-width:240px;white-space:normal">${r.warn.length?`<small class="warn">${r.warn.map(esc).join("<br>")}</small>`:'<small class="mut">OK</small>'}</td><td class="act"><button class="btn ghost sm" onclick="pajakPdf(${i})">PDF</button></td></tr>`).join("")||'<tr><td class="mut" colspan="9">Belum ada slip gaji untuk tahun ini. Hitung slip di menu Penggajian dulu.</td></tr>'}
  ${R.length?`<tr><td><b>Total</b></td><td></td><td><b>${rp(tot("bruto"))}</b></td><td></td><td><b>${rp(tot("pphTahun"))}</b></td><td><b>${rp(tot("pphDipotong"))}</b></td><td><b>${rp(tot("selisih"))}</b></td><td></td><td></td></tr>`:""}</table></div></div>`;
}
V.pajak=pajakView;
async function pajakSaveId(){
  const d={taxNpwp:$("#tx_npwp").value.replace(/[^0-9]/g,""),taxNitku:$("#tx_nitku").value.replace(/[^0-9]/g,""),taxTtd:$("#tx_ttd").value.trim()};
  if(d.taxNpwp&&![15,16].includes(d.taxNpwp.length))return toast("NPWP harus 15 atau 16 digit");
  if(d.taxNitku&&d.taxNitku.length!==22)return toast("NITKU harus 22 digit (NPWP 16 digit + 6 digit)");
  await db.collection("settings").doc("work").set(d,{merge:true});SET={...SET,...d};toast("Identitas pemotong tersimpan");
}
const pjTgl=(y,m)=>`${PJ_BLN(m)}/${y}`;
async function pajakXlsx(){
  const R=TAXY.rows;if(!R.length)return toast("Belum ada data");
  try{await loadXlsx()}catch(e){return toast(e.message)}
  const H=["No","NIK","Nama","Alamat","Jenis Kelamin","Status PTKP (1 Jan)","Jabatan","Masa Awal","Masa Akhir","Jenis Pemotongan","Jumlah Bulan","Punya NPWP",
    "Gaji Pokok","Tunjangan Lainnya","Uang Lembur","Premi Asuransi dibayar Pemberi Kerja","Bonus","THR","Jumlah Penghasilan Bruto",
    "Biaya Jabatan","Iuran Pensiun/JHT (pegawai)","Jumlah Pengurang","Penghasilan Neto","PTKP","PKP","PPh 21 Terutang Setahun","PPh 21 Sudah Dipotong","Kurang/(Lebih) Potong","Catatan"];
  const rows=R.map((r,i)=>[i+1,r.u.nik||"",r.u.name||"",r.u.alamat||"",r.u.gender||"",r.u.ptkp||"TK0",r.u.jabatan||"",pjTgl(r.year,r.awal),pjTgl(r.year,r.akhir),r.penuh?"Setahun Penuh":"Kurang dari Setahun",r.n,r.u.npwp==="Tidak"?"Tidak":"Ya",
    r.pokok,r.tunj,r.lembur,r.premi,r.bonus,r.thr,r.bruto,r.bj,r.iuran,r.bj+r.iuran,r.neto,r.ptkp,r.pkp,r.pphTahun,r.pphDipotong,r.selisih,r.warn.join("; ")]);
  const tot=H.map((_,c)=>c===2?"TOTAL":(c>=12&&c<=27)?rows.reduce((a,r)=>a+(+r[c]||0),0):"");
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([H,...rows,tot]);ws["!cols"]=H.map((h,i)=>({wch:i===2?26:i===28?60:i===3?30:15}));
  XLSX.utils.book_append_sheet(wb,ws,"BPA1 tahunan");
  const B=[["Masa Pajak (YYYYMM)","NIK","Nama","Status PTKP","Penghasilan Bruto (dasar PPh)","Metode","Tarif TER (%)","PPh 21 dipotong"]];
  R.forEach(r=>r.sl.forEach(s=>B.push([r.year+PJ_BLN(+s.periode.slice(5)),r.u.nik||"",r.u.name||"",r.u.ptkp||"TK0",Math.round(s.brutoPajak||s.bruto||0),s.pphMetode||"",s.terPct??"",Math.round(s.pph||0)])));
  const wb2=XLSX.utils.aoa_to_sheet(B);wb2["!cols"]=[18,20,26,12,22,12,12,16].map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,wb2,"Bulanan");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Pemberi kerja / pemotong",(COMP&&COMP.name)||""],["NPWP",SET.taxNpwp||""],["NITKU",SET.taxNitku||""],["Penandatangan",SET.taxTtd||""],["Tahun pajak",TAXY.y],[],
    ["Catatan","Urutan kolom mengikuti layar isian eBupot BP A1 di Coretax. Ini bukan template impor XML resmi DJP; unduh template/converter resmi di pajak.go.id/reformdjp/coretax/template-xml-dan-converter-excel-ke-xml jika ingin impor massal."]]),"Pemotong");
  XLSX.writeFile(wb,`pajak-pph21-A1_${TAXY.y}.xlsx`);toast("Excel pajak "+TAXY.y+" diunduh ("+R.length+" karyawan)");
}
// PDF: satu halaman per karyawan. i = indeks baris, kosong = semua.
async function pajakPdf(i){
  const L=i==null?TAXY.rows:[TAXY.rows[i]];if(!L.length||!L[0])return toast("Belum ada data");
  try{
    const d=new MiniPDF(),W=d.W,H=d.H,M=44,Rr=W-M,ac=(COMP&&COMP.color)||"#0d9488",ink="#0f172a",mut="#64748b",lg=await pdfLogo((COMP&&COMP.logo)||"img/logo.svg");
    L.forEach((r,k)=>{
      if(k)d.addPage();
      d.rect(0,0,W,78,ac);let tx=M;
      if(lg){const q=Math.min(44/lg.w,44/lg.h),w=lg.w*q,h=lg.h*q;d.rect(M-4,14,w+8,h+8,"#ffffff");d.image(lg,M,18,w,h);tx=M+w+16}
      d.text(d.fit((COMP&&COMP.name)||"Perusahaan",Rr-tx-120,16,true),tx,40,{size:16,bold:true,color:"#ffffff"});
      d.text("NPWP pemotong: "+(SET.taxNpwp||"-")+"   NITKU: "+(SET.taxNitku||"-"),tx,58,{size:8.5,color:"#ffffffd9"});
      d.text("RINGKASAN BUKTI POTONG A1",Rr,38,{size:12,bold:true,color:"#ffffff",align:"right"});d.text("Tahun pajak "+r.year,Rr,56,{size:9,color:"#ffffff",align:"right"});
      let y=104;const row=(a,b,o={})=>{if(o.fill)d.rect(M,y-12,Rr-M,18,o.fill);d.text(a,M+6,y,{size:9.5,bold:o.bold,color:ink});d.text(b,Rr-6,y,{size:9.5,bold:o.bold,color:ink,align:"right"});d.line(M,y+6,Rr,y+6,"#e2e8f0",.4);y+=19};
      const sec=t=>{y+=6;d.text(t,M,y,{size:10,bold:true,color:ac});y+=14};
      sec("A. Penerima penghasilan");
      row("Nama",r.u.name||"-");row("NIK",r.u.nik||"(belum diisi)");row("Status PTKP (1 Januari)",r.u.ptkp||"TK0");row("Jabatan",r.u.jabatan||"-");row("Masa penghasilan",`${BLN_F[r.awal-1]} - ${BLN_F[r.akhir-1]} ${r.year} (${r.n} bulan)`);row("Jenis pemotongan",r.penuh?"Setahun penuh":"Kurang dari setahun");
      sec("B. Penghasilan bruto");
      row("Gaji pokok",pdfRp(r.pokok));row("Tunjangan lainnya",pdfRp(r.tunj));row("Uang lembur",pdfRp(r.lembur));row("Premi asuransi dibayar pemberi kerja",pdfRp(r.premi));row("Bonus",pdfRp(r.bonus));row("THR",pdfRp(r.thr));row("Jumlah penghasilan bruto",pdfRp(r.bruto),{bold:1,fill:"#f1f5f9"});
      sec("C. Pengurang");
      row("Biaya jabatan (5%, maks. Rp500.000/bulan)",pdfRp(r.bj));row("Iuran pensiun / JHT + JP (pegawai)",pdfRp(r.iuran));row("Penghasilan neto",pdfRp(r.neto),{bold:1,fill:"#f1f5f9"});
      sec("D. Penghitungan PPh Pasal 21");
      row("PTKP"+(r.n<12?` (${r.n}/12 bulan)`:""),pdfRp(r.ptkp));row("Penghasilan kena pajak (PKP)",pdfRp(r.pkp));row("PPh 21 terutang setahun"+(r.u.npwp==="Tidak"?" (tarif x120%)":""),pdfRp(r.pphTahun));row("PPh 21 sudah dipotong (Jan - masa terakhir)",pdfRp(r.pphDipotong));row(r.selisih<0?"Lebih potong":"PPh 21 kurang dipotong",pdfRp(Math.abs(r.selisih)),{bold:1,fill:"#e2f6f2"});
      if(r.warn.length){y+=10;d.text("Perlu dicek:",M,y,{size:8.5,bold:true,color:"#b91c1c"});y+=12;r.warn.forEach(t=>{d.text("- "+d.fit(t,Rr-M-10,8,false),M+6,y,{size:8,color:"#b91c1c"});y+=11})}
      d.text("Ringkasan ini dihasilkan dari slip gaji untuk membantu pengisian. Bukan bukti potong resmi: terbitkan Bukti Pemotongan A1 melalui Coretax (eBupot).",M,H-40,{size:7.5,color:mut});
      if(SET.taxTtd)d.text("Penandatangan: "+SET.taxTtd,M,H-28,{size:7.5,color:mut});
    });
    pdfSave(d.build({title:"Ringkasan Bukti Potong A1 "+TAXY.y}),i==null?`ringkasan-A1_${TAXY.y}.pdf`:`ringkasan-A1_${TAXY.y}_${String(L[0].u.name||"karyawan").replace(/\W+/g,"-")}.pdf`);toast("PDF diunduh");
  }catch(e){console.error(e);toast("Gagal membuat PDF: "+e.message)}
}
{const i=ADM.findIndex(n=>n[0]==="gaji");ADM.splice(i<0?ADM.length:i+1,0,["pajak","🧾","Pajak PPh 21"])}
