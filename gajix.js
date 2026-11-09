// ===== Rekap gaji bulanan untuk keuangan: Excel (.xlsx) dan PDF landscape =====
// Dimuat setelah pdf.js. Memakai PAYM (slip periode PM), USERS, PM, COMP, MiniPDF, loadXlsx, blnFull, plabelOf, rp, toast.
const GJ_COLS=["No","Nama","Divisi","Jabatan","Gaji Pokok","Tunjangan","Bonus","Lembur","THR","Penghasilan Bruto","BPJS Karyawan","PPh 21","Pot. Terlambat","Potongan Lain","Gaji Bersih","BPJS Perusahaan","Status Transfer","Bank","No Rekening"];
function gjData(scope){
  const l=USERS.filter(u=>PAYM[u.id]&&(scope==="all"||PAYM[u.id].paid===true)).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  const rows=l.map((u,i)=>{const s=PAYM[u.id],n=k=>Math.round(+s[k]||0);
    return{u,v:[i+1,u.name||"",u.dept||"",u.jabatan||"",n("pokok"),n("tunjangan"),n("bonus"),n("lembur"),n("thr"),n("bruto"),n("bpjsKary"),n("pph"),n("potTelat"),n("potongan"),n("bersih"),n("bpjsPer"),s.paid===true?"Sudah":"Belum",u.bank||"",u.rek||""]}});
  const tot=Array(GJ_COLS.length).fill("");tot[1]="TOTAL ("+rows.length+" karyawan)";for(let c=4;c<=15;c++)tot[c]=rows.reduce((a,r)=>a+r.v[c],0);
  return{rows,tot};
}
const gjScope=()=>(document.getElementById("gj_scope")||{}).value||"all";
async function gjXlsx(){
  const{rows,tot}=gjData(gjScope());if(!rows.length)return toast("Belum ada slip yang dihitung untuk periode ini");
  try{await loadXlsx()}catch(e){return toast(e.message)}
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([GJ_COLS,...rows.map(r=>r.v),tot]);
  ws["!cols"]=[5,26,18,18,14,14,13,13,13,16,14,13,14,14,16,15,14,12,18].map(w=>({wch:w}));
  ws["!autofilter"]={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:GJ_COLS.length-1}})};
  XLSX.utils.book_append_sheet(wb,ws,"Rekap Gaji");
  const dv={};rows.forEach(r=>{const k=r.v[2]||"(Tanpa departemen)",d=dv[k]=dv[k]||Array(9).fill(0);d[0]++;[9,10,11,12,13,14,15].forEach((c,i)=>d[i+1]+=r.v[c])});
  const H2=["Divisi","Jumlah Karyawan","Penghasilan Bruto","BPJS Karyawan","PPh 21","Pot. Terlambat","Potongan Lain","Gaji Bersih","BPJS Perusahaan"],keys=Object.keys(dv).sort(),
    t2=H2.map((_,i)=>i?keys.reduce((a,k)=>a+dv[k][i-1],0):"TOTAL");
  const ws2=XLSX.utils.aoa_to_sheet([H2,...keys.map(k=>[k,...dv[k].slice(0,8)]),t2]);ws2["!cols"]=[24,16,18,15,13,15,15,16,16].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws2,"Ringkasan per Divisi");
  XLSX.writeFile(wb,`rekap-gaji_${PM}${gjScope()==="paid"?"_ditransfer":""}.xlsx`);
  toast(`Excel rekap gaji diunduh (${rows.length} karyawan · total bersih ${rp(tot[14])})`);
}
async function gjPdf(){
  const{rows,tot}=gjData(gjScope());if(!rows.length)return toast("Belum ada slip yang dihitung untuk periode ini");
  try{
    const d=new MiniPDF(true),W=d.W,H=d.H,M=28,R=W-M,ac=(COMP&&COMP.color)||"#0d9488",ink="#0f172a",mut="#64748b";
    const cols=[["No",20,"c"],["Nama",108,"l"],["Divisi",62,"l"],["Pokok",58,"r"],["Tunjangan",54,"r"],["Bonus",48,"r"],["Lembur",50,"r"],["THR",48,"r"],["Bruto",64,"r"],["BPJS",50,"r"],["PPh 21",48,"r"],["Pot.",50,"r"],["Bersih",66,"r"],["Trf",30,"c"]],
      src=[0,1,2,4,5,6,7,8,9,10,11,null,14,16],num=n=>Math.round(n).toLocaleString("id-ID"),RH=16,per=blnFull(PM),lg=await pdfLogo((COMP&&COMP.logo)||"img/logo.svg");
    const val=(v,ci)=>{if(ci===11)return num(v[12]+v[13]);if(ci===13)return v[16]==="Sudah"?"Ya":"-";const x=v[src[ci]];return typeof x==="number"&&ci>2?num(x):String(x)};
    let y=0,pg=0;
    const top=()=>{pg++;if(pg>1)d.addPage();d.rect(0,0,W,58,ac);let tx=M;
      if(lg){const k=Math.min(34/lg.w,34/lg.h),w=lg.w*k,h=lg.h*k;d.rect(M-3,11,w+6,h+6,"#ffffff");d.image(lg,M,14,w,h);tx=M+w+14}
      d.text(d.fit((COMP&&COMP.name)||"Absensi & Payroll",420,15,true),tx,30,{size:15,bold:true,color:"#ffffff"});
      d.text("Periode absensi "+plabelOf(PM),tx,46,{size:8.5,color:"#ffffffd9"});
      d.text("REKAP GAJI",R,30,{size:13,bold:true,color:"#ffffff",align:"right"});d.text(per+(gjScope()==="paid"?" - hanya yang sudah ditransfer":""),R,46,{size:8.5,color:"#ffffff",align:"right"});
      y=72;d.rect(M,y,R-M,RH+2,"#f1f5f9");let x=M;
      cols.forEach(([t,w,a])=>{d.text(t,a==="r"?x+w-4:a==="c"?x+w/2:x+4,y+12,{size:7.5,bold:true,color:ac,align:a==="r"?"right":a==="c"?"center":"left"});x+=w});y+=RH+2};
    const line=(arr,bold,fill)=>{if(fill)d.rect(M,y,R-M,RH,fill);let x=M;cols.forEach(([t,w,a],ci)=>{const s=arr[ci];
      d.text(a==="l"?d.fit(s,w-8,7.5,bold):s,a==="r"?x+w-4:a==="c"?x+w/2:x+4,y+11,{size:7.5,bold,color:ink,align:a==="r"?"right":a==="c"?"center":"left"});x+=w});
      d.line(M,y+RH,R,y+RH,"#e2e8f0",.4);y+=RH};
    top();
    rows.forEach((r,i)=>{if(y+RH>H-52){top()}line(cols.map((_,ci)=>val(r.v,ci)),false,i%2?"#f8fafc":null)});
    if(y+RH*2>H-52)top();
    line(cols.map((_,ci)=>ci===1?tot[1]:ci===11?num(tot[12]+tot[13]):ci===13||ci===0||ci===2?"":num(tot[src[ci]])),true,"#e2f6f2");
    y+=14;d.text(`Total gaji bersih: ${rp(tot[14])}  |  Sudah ditransfer: ${rows.filter(r=>r.v[16]==="Sudah").length} dari ${rows.length} karyawan  |  BPJS perusahaan (di luar gaji bersih): ${rp(tot[15])}`,M,y,{size:8.5,bold:true,color:ink});
    y+=12;d.text("Pot. = potongan terlambat + potongan lain. Bruto = pokok + tunjangan + bonus + lembur + THR. Trf = sudah ditransfer.",M,y,{size:7.5,color:mut});
    d.pages.forEach((_,i)=>{d.cur=d.pages[i];d.text(`Dicetak ${new Date().toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"})}  -  Rahasia, hanya untuk keuangan/HRD`,M,H-22,{size:7.5,color:mut});d.text(`Halaman ${i+1} / ${d.pages.length}`,R,H-22,{size:7.5,color:mut,align:"right"})});
    pdfSave(d.build({title:"Rekap Gaji "+per}),`rekap-gaji_${PM}${gjScope()==="paid"?"_ditransfer":""}.pdf`);toast("PDF rekap gaji diunduh");
  }catch(e){console.error(e);toast("Gagal membuat PDF: "+e.message)}
}
const gjBox=()=>`<div class="box"><h3>Rekap gaji bulanan (untuk keuangan)</h3><p class="mut" style="margin-bottom:10px">Seluruh komponen gaji periode ${blnFull(PM)} dalam satu tabel beserta total dan ringkasan per divisi: gaji pokok, tunjangan, bonus, lembur, THR, BPJS, PPh 21, potongan, gaji bersih, dan status transfer.</p>
  <div class="bkbar"><div class="f"><label>Yang dimasukkan</label><select id="gj_scope"><option value="all">Semua yang sudah dihitung</option><option value="paid">Hanya yang sudah ditransfer</option></select></div><button class="btn" onclick="gjXlsx()">📗 Unduh Excel</button><button class="btn ghost" onclick="gjPdf()">📄 Unduh PDF</button></div></div>`;
