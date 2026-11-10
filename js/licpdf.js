// ===== PDF Token Lisensi + Invoice (sisi tenant/admin pelanggan) =====
// Dimuat setelah pdf.js (MiniPDF) dan license.js (PAY, TEN, window.LICS). Data diambil dari daftar permintaan lisensi yang sedang tampil
// di menu Lisensi (window.LICS), jadi tidak ada pembacaan Firestore tambahan.
// Nomor invoice dibentuk dari tanggal permintaan + 6 huruf pertama id dokumen, sehingga sama persis dengan yang tampil di panel Super Admin.
const LP_AC="#0d9488",LP_INK="#0f172a",LP_MUT="#64748b",LP_LINE="#e2e8f0";
const lpDt=t=>t&&t.toDate?t.toDate():(t instanceof Date?t:null);
const lpLong=t=>{const d=lpDt(t);return d?d.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"-"};
const lpWhen=t=>{const d=lpDt(t);return d?d.toLocaleString("id-ID",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"};
const lpInvNo=l=>{const d=lpDt(l.ts)||new Date();return"INV-"+d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+"-"+String(l.id).slice(0,6).toUpperCase()};
const lpPaid=l=>["terbit","aktif","kedaluwarsa","nonaktif","diperpanjang"].includes(l.status);       // token sudah dikirim = pembayaran sudah diverifikasi
const lpFind=id=>(window.LICS||[]).find(x=>x.id===id);

async function lpHead(d,title,sub){
  d.rect(0,0,PW,92,LP_AC);
  const lg=await pdfLogo(window.LP_LOGO||"img/logo.svg");let tx=44;
  if(lg){const k=Math.min(52/lg.w,52/lg.h),w=lg.w*k,h=lg.h*k;d.rect(40,20,w+8,h+8,"#ffffff");d.image(lg,44,24,w,h);tx=44+w+18}
  const co=String(PAY.company||"").trim();                                    // nama perusahaan penyedia (Pengaturan Super Admin)
  d.text(d.fit(co||"Lapak Absen",PW-44-tx-150,18,true),tx,48,{size:18,bold:true,color:"#ffffff"});
  if(co)d.text("Penyedia layanan Lapak Absen",tx,64,{size:9,color:"#ffffff"});
  d.text(title,PW-44,48,{size:12,bold:true,color:"#ffffff",align:"right"});d.text(sub,PW-44,64,{size:9,color:"#ffffff",align:"right"});
}
// pasangan label : nilai berjajar ke bawah; mengembalikan y berikutnya
function lpRows(d,rows,x,y,lw,max){
  rows.forEach(([k,v])=>{d.text(k,x,y,{size:9.5,color:LP_MUT});d.text(d.fit(v,max-lw,10,true),x+lw,y,{size:10,bold:true});y+=18});
  return y;
}
const lpFoot=d=>{d.line(44,PH-60,PW-44,PH-60);d.text((String(PAY.company||"").trim()?"Diterbitkan oleh "+String(PAY.company).trim()+". ":"")+"Dokumen dibuat otomatis oleh sistem pada "+lpWhen(new Date())+" dan sah tanpa tanda tangan.",PW/2,PH-44,{size:8,color:LP_MUT,align:"center"})};

// ---------- PDF Token Lisensi ----------
async function licTokBlob(l){
  const d=new MiniPDF(),M=44,R=PW-M,mo=licMo(l),tn=l.tname||(TEN&&TEN.name)||TENANT;
  await lpHead(d,"TOKEN LISENSI","Lisensi akun karyawan");
  let y=128;
  d.text("Perusahaan",M,y,{size:11,bold:true,color:LP_AC});y+=8;d.line(M,y,R,y);y+=20;
  y=lpRows(d,[["Nama perusahaan",tn],["Kode perusahaan",l.tid||TENANT],["Diminta oleh",l.byName||"-"],["Tanggal permintaan",lpLong(l.ts)]],M,y,140,R-M);
  y+=14;
  // kotak token
  d.rect(M,y,R-M,104,"#f0fdfa","#99f6e4");
  d.text("TOKEN LISENSI",PW/2,y+26,{size:9.5,bold:true,color:LP_MUT,align:"center"});
  d.text(String(l.token||"-"),PW/2,y+68,{size:30,bold:true,color:"#0f766e",align:"center"});
  d.text("Rahasiakan token ini. Hanya berlaku untuk perusahaan di atas dan hanya bisa dipakai satu kali.",PW/2,y+90,{size:8.5,color:LP_MUT,align:"center"});
  y+=104+28;
  d.text("Rincian lisensi",M,y,{size:11,bold:true,color:LP_AC});y+=8;d.line(M,y,R,y);y+=20;
  const st=l.status==="aktif"?`Aktif sejak ${lpLong(l.activatedAt)}`:l.status==="kedaluwarsa"?"Berakhir":"Menunggu diaktifkan";
  y=lpRows(d,[["Jumlah akun karyawan",l.qty+" akun"],["Masa berlaku",mo+" bulan sejak token diaktifkan"],["Token dikirim",lpWhen(l.sentAt)],["Status",st],
    ...(l.expiresAt?[["Berlaku sampai",lpLong(l.expiresAt)]]:[]),["No. invoice",lpInvNo(l)]],M,y,170,R-M);
  y+=14;
  d.text("Cara mengaktifkan",M,y,{size:11,bold:true,color:LP_AC});y+=8;d.line(M,y,R,y);y+=20;
  ["Masuk ke aplikasi sebagai admin, lalu buka menu Lisensi.","Pada permintaan lisensi ini, isi kolom \"Masukkan token\" dengan token di atas.","Tekan Aktifkan. Kuota akun bertambah "+l.qty+" akun dan masa berlaku "+mo+" bulan mulai dihitung."]
    .forEach((s,i)=>{d.rect(M,y-10,16,16,LP_AC);d.text(String(i+1),M+8,y+2,{size:9,bold:true,color:"#ffffff",align:"center"});d.text(d.fit(s,R-M-28,10,false),M+26,y+2,{size:10});y+=24});
  lpFoot(d);
  return d.build({title:"Token Lisensi "+tn});
}
async function licTokPdf(id){
  const l=lpFind(id);if(!l||!l.token)return toast("Token belum tersedia");
  try{pdfSave(await licTokBlob(l),`Token-Lisensi_${(l.tid||TENANT)}_${String(l.id).slice(0,6).toUpperCase()}.pdf`);toast("PDF token lisensi diunduh")}catch(e){toast("Gagal membuat PDF: "+e.message)}
}

// ---------- PDF Invoice (dengan tanda LUNAS) ----------
async function licInvBlob(l){
  const d=new MiniPDF(),M=44,R=PW-M,mo=licMo(l),tn=l.tname||(TEN&&TEN.name)||TENANT,paid=lpPaid(l),proof=!!l.proof;
  const stTxt=paid?"LUNAS":l.status==="ditolak"?"DIBATALKAN":proof?"MENUNGGU VERIFIKASI":"BELUM DIBAYAR",stCol=paid?"#16a34a":l.status==="ditolak"?"#dc2626":proof?"#2563eb":"#d97706";
  await lpHead(d,"INVOICE",lpInvNo(l));
  let y=128;
  // dua kolom: ditagihkan kepada | detail invoice
  d.text("DITAGIHKAN KEPADA",M,y,{size:8.5,bold:true,color:LP_MUT});d.text("DETAIL INVOICE",PW/2+10,y,{size:8.5,bold:true,color:LP_MUT});y+=18;
  d.text(d.fit(tn,PW/2-M-10,13,true),M,y,{size:13,bold:true});
  const y1=lpRows(d,[["Kode perusahaan",l.tid||TENANT],["Admin",l.byName||"-"]],M,y+20,96,PW/2-M-10);
  const y2=lpRows(d,[["No. invoice",lpInvNo(l)],["Tanggal",lpLong(l.ts)],["Status",stTxt]],PW/2+10,y,74,R-(PW/2+10));
  y=Math.max(y1,y2)+10;
  // tabel item
  d.rect(M,y,R-M,24,LP_AC);
  const cx=[M+10,M+270,M+330,M+425,R-10];
  d.text("Deskripsi",cx[0],y+16,{size:9,bold:true,color:"#ffffff"});d.text("Akun",cx[1],y+16,{size:9,bold:true,color:"#ffffff",align:"right"});
  d.text("Periode",cx[2],y+16,{size:9,bold:true,color:"#ffffff",align:"right"});d.text("Harga/akun/bln",cx[3],y+16,{size:9,bold:true,color:"#ffffff",align:"right"});d.text("Subtotal",cx[4],y+16,{size:9,bold:true,color:"#ffffff",align:"right"});
  y+=24;
  const tot=l.total!=null?+l.total:(+l.qty||0)*(+l.price||0)*mo;
  d.text(l.kind==="perpanjang"?"Perpanjangan lisensi akun karyawan (Lapak Absen)":"Lisensi akun karyawan (Lapak Absen)",cx[0],y+20,{size:10});d.text(String(l.qty),cx[1],y+20,{size:10,align:"right"});d.text(mo+" bln",cx[2],y+20,{size:10,align:"right"});
  d.text(pdfRp(l.price),cx[3],y+20,{size:10,align:"right"});d.text(pdfRp(tot),cx[4],y+20,{size:10,align:"right"});
  d.text(l.kind==="perpanjang"?`Perpanjangan ${mo} bulan, ditambahkan ke masa berlaku lisensi yang ada.`:`Token berlaku ${mo} bulan sejak diaktifkan oleh admin.`,cx[0],y+35,{size:8.5,color:LP_MUT});
  y+=48;d.line(M,y,R,y);y+=26;
  d.text("TOTAL",R-170,y,{size:11,bold:true,color:LP_MUT,align:"right"});d.text(pdfRp(tot),R-10,y,{size:18,bold:true,color:LP_AC,align:"right"});
  const sy=y;y+=104;                                                        // pita kosong di bawah total untuk stempel
  // informasi pembayaran
  d.text("Informasi pembayaran",M,y,{size:11,bold:true,color:LP_AC});y+=8;d.line(M,y,R,y);y+=20;
  if(paid)y=lpRows(d,[["Status","Pembayaran diterima dan diverifikasi"],l.kind==="perpanjang"?["Perpanjangan disetujui",lpWhen(l.approvedAt)]:["Token dikirim",lpWhen(l.sentAt)],...(proof&&l.proofAt?[["Bukti transfer diunggah",lpWhen(l.proofAt)]]:[])],M,y,150,R-M);
  else if(l.status==="ditolak")y=lpRows(d,[["Status","Permintaan ditolak"],...(l.note?[["Alasan",l.note]]:[])],M,y,150,R-M);
  else y=lpRows(d,[["Transfer ke",`${PAY.bank||"-"} ${PAY.no||""}`],["Atas nama",PAY.name||"-"],["Nominal",pdfRp(tot)],...(proof?[["Bukti transfer",`Terunggah ${lpWhen(l.proofAt)}, menunggu verifikasi`]]:[])],M,y,150,R-M);
  y+=8;
  d.text(paid?(l.kind==="perpanjang"?"Terima kasih. Masa berlaku lisensi sudah diperpanjang.":"Terima kasih. Token lisensi tersedia pada dokumen Token Lisensi dan di menu Lisensi."):"Setelah transfer, unggah bukti pembayaran di menu Lisensi agar token segera diproses.",M,y+4,{size:9,color:LP_MUT});
  d.stamp(stTxt,R-120,sy+54,{size:stTxt.length>9?20:34,color:stCol,angle:-10});
  lpFoot(d);
  return d.build({title:"Invoice "+lpInvNo(l)});
}
async function licInvPdf(id){
  const l=lpFind(id);if(!l)return;
  try{pdfSave(await licInvBlob(l),`Invoice_${lpInvNo(l)}.pdf`);toast("PDF invoice diunduh")}catch(e){toast("Gagal membuat PDF: "+e.message)}
}

// tombol di kartu permintaan lisensi (dipanggil dari license.js)
const licDocs=l=>{
  if(!l||l.status==="ditolak")return"";
  const paid=lpPaid(l);
  return`<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${l.token&&paid?`<button class="btn ghost sm" onclick="licTokPdf('${l.id}')">📄 PDF Token</button>`:""}<button class="btn ghost sm" onclick="licInvPdf('${l.id}')">🧾 ${paid?"Invoice (LUNAS)":"Invoice / tagihan"}</button><small class="mut" style="align-self:center">${esc(lpInvNo(l))}</small></div>`;
};
