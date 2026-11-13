// ===== Pembuat PDF mini (tanpa library) + Slip gaji PDF + sinkronisasi slip =====
// Dimuat setelah dash.js. PDF dibuat langsung di browser: font bawaan PDF (Helvetica), logo disisipkan sebagai JPEG.
const PW=595.28,PH=841.89;
const W_REG="278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584".split(",").map(Number);
const W_BLD="278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584".split(",").map(Number);
// teks -> Latin-1 (WinAnsi). Karakter di luar Latin-1 diganti agar PDF tidak rusak.
const pdfTxt=s=>String(s??"").replace(/[–—−]/g,"-").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/·|•/g,"-").replace(/[^\x20-\x7e\xa0-\xff]/g,"").replace(/\s+/g," ");
const pdfEsc=s=>s.replace(/[\\()]/g,"\\$&");
class MiniPDF{
  constructor(land){this.W=land?PH:PW;this.H=land?PW:PH;this.pages=[];this.imgs=[];this.cur=null;this.addPage()}
  addPage(){this.cur=[];this.pages.push(this.cur)}
  w(s,size,bold){s=pdfTxt(s);const t=bold?W_BLD:W_REG;let n=0;for(const c of s){const k=c.charCodeAt(0)-32;n+=(k>=0&&k<t.length?t[k]:556)}return n*size/1000}
  color(c){const h=String(c||"#000").replace("#",""),f=h.length===3?h.split("").map(x=>x+x).join(""):h.padEnd(6,"0");return[0,2,4].map(i=>(parseInt(f.substr(i,2),16)/255).toFixed(3)).join(" ")}
  rect(x,y,w,h,fill,stroke){const o=this.cur;o.push("q");if(fill)o.push(this.color(fill)+" rg");if(stroke)o.push(this.color(stroke)+" RG 0.6 w");o.push(`${x.toFixed(2)} ${(this.H-y-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill&&stroke?"B":fill?"f":"S"}`,"Q")}
  line(x1,y1,x2,y2,col="#e2e8f0",lw=.6){this.cur.push(`q ${this.color(col)} RG ${lw} w ${x1.toFixed(2)} ${(this.H-y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H-y2).toFixed(2)} l S Q`)}
  // y = garis dasar teks dihitung dari atas halaman
  text(s,x,y,{size=10,bold=false,color="#0f172a",align="left"}={}){
    s=pdfTxt(s);if(!s)return;const wd=this.w(s,size,bold);if(align==="right")x-=wd;else if(align==="center")x-=wd/2;
    this.cur.push(`BT /${bold?"F2":"F1"} ${size} Tf ${this.color(color)} rg ${x.toFixed(2)} ${(this.H-y).toFixed(2)} Td (${pdfEsc(s)}) Tj ET`)}
  // potong teks panjang supaya muat lebar maksimum
  fit(s,max,size,bold){s=pdfTxt(s);if(this.w(s,size,bold)<=max)return s;while(s.length>1&&this.w(s+"...",size,bold)>max)s=s.slice(0,-1);return s+"..."}
  // stempel miring berbingkai (mis. "LUNAS"): pusat (cx,cy) dari atas halaman, angle derajat (negatif = naik ke kanan)
  stamp(s,cx,cy,{size=30,color="#16a34a",angle=-12}={}){
    s=pdfTxt(s);const wd=this.w(s,size,true),bw=wd+26,bh=size+16,r=angle*Math.PI/180,c=Math.cos(r).toFixed(4),n=Math.sin(r).toFixed(4),col=this.color(color);
    this.cur.push(`q ${c} ${n} ${(-Math.sin(r)).toFixed(4)} ${c} ${cx.toFixed(2)} ${(this.H-cy).toFixed(2)} cm ${col} RG 2.4 w ${(-bw/2).toFixed(2)} ${(-bh/2).toFixed(2)} ${bw.toFixed(2)} ${bh.toFixed(2)} re S ${col} RG 0.8 w ${(-bw/2+4).toFixed(2)} ${(-bh/2+4).toFixed(2)} ${(bw-8).toFixed(2)} ${(bh-8).toFixed(2)} re S BT /F2 ${size} Tf ${col} rg ${(-wd/2).toFixed(2)} ${(-size*0.35).toFixed(2)} Td (${pdfEsc(s)}) Tj ET Q`)}
  // jpeg: {data:Uint8Array,w,h}
  image(img,x,y,w,h){const i=this.imgs.push(img);this.cur.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(this.H-y-h).toFixed(2)} cm /Im${i} Do Q`)}
  build(info={}){
    const objs=[],add=b=>objs.push(b)&&objs.length; // nomor objek = indeks+1
    const bin=s=>{const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u};
    add("<< /Type /Catalog /Pages 2 0 R >>");add(null); // 1 catalog, 2 pages (diisi belakangan)
    const f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const imIds=this.imgs.map(im=>add({dict:`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>`,data:im.data}));
    const xo=imIds.length?` /XObject << ${imIds.map((id,i)=>`/Im${i+1} ${id} 0 R`).join(" ")} >>`:"";
    const kids=[];
    for(const p of this.pages){const c=bin(p.join("\n")),cid=add({dict:`<< /Length ${c.length} >>`,data:c});
      kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >>${xo} >> /Contents ${cid} 0 R >>`))}
    objs[1]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k=>k+" 0 R").join(" ")}] >>`;
    const inf=add(`<< /Title (${pdfEsc(pdfTxt(info.title||"Dokumen"))}) /Producer (Lapak Absen) >>`);
    const parts=[],offs=[];let len=0;const push=u=>{parts.push(u);len+=u.length};
    push(bin("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"));
    objs.forEach((o,i)=>{offs.push(len);if(typeof o==="string")push(bin(`${i+1} 0 obj\n${o}\nendobj\n`));else{push(bin(`${i+1} 0 obj\n${o.dict}\nstream\n`));push(o.data);push(bin("\nendstream\nendobj\n"))}});
    const xr=len;push(bin(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n${offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")}trailer\n<< /Size ${objs.length+1} /Root 1 0 R /Info ${inf} 0 R >>\nstartxref\n${xr}\n%%EOF`));
    return new Blob(parts,{type:"application/pdf"});
  }
}
function pdfSave(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
// logo (data URL / path) -> JPEG berlatar putih
function pdfLogo(src,max=160){return new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>{try{const k=Math.min(1,max/Math.max(i.width,i.height)),w=Math.max(1,Math.round(i.width*k)),h=Math.max(1,Math.round(i.height*k)),c=document.createElement("canvas");c.width=w;c.height=h;
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(i,0,0,w,h);const b=atob(c.toDataURL("image/jpeg",.9).split(",")[1]),u=new Uint8Array(b.length);for(let n=0;n<b.length;n++)u[n]=b.charCodeAt(n);ok({data:u,w,h})}catch(e){ok(null)}};i.onerror=()=>ok(null);i.src=src})}

// ---------- Slip gaji -> PDF ----------
const pdfRp=n=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
async function slipBlob(p,u){
  u=u||{};const d=new MiniPDF(),ac=(COMP&&COMP.color)||"#f97316",M=44,R=PW-M,ink="#0f172a",mut="#64748b";
  // kop
  d.rect(0,0,PW,92,ac);
  const lg=await pdfLogo((COMP&&COMP.logo)||"img/logo.png");let tx=M;
  if(lg){const k=Math.min(52/lg.w,52/lg.h),w=lg.w*k,h=lg.h*k;d.rect(M-4,20,w+8,h+8,"#ffffff");d.image(lg,M,24,w,h);tx=M+w+18}
  d.text(d.fit((COMP&&COMP.name)||"Lapak Absen",R-tx,18,true),tx,48,{size:18,bold:true,color:"#ffffff"});
  if(COMP&&COMP.address)d.text(d.fit(COMP.address,R-tx,9,false),tx,64,{size:9,color:"#ffffffd9"});
  d.text("SLIP GAJI",R,48,{size:12,bold:true,color:"#ffffff",align:"right"});d.text("Periode "+blnFull(p.periode),R,64,{size:9,color:"#ffffff",align:"right"});
  // identitas karyawan
  let y=124;const info=[["Nama",p.name||u.name||"-"],["Jabatan",u.jabatan||"-"],["Departemen",u.dept||"-"],["Periode absensi",plabelOf(p.periode)]];
  if(u.rek)info.push(["Rekening",(u.bank?u.bank+" - ":"")+u.rek]);
  info.forEach(([k,v])=>{d.text(k,M,y,{size:9.5,color:mut});d.text(":",M+92,y,{size:9.5,color:mut});d.text(d.fit(v,R-M-102,10,true),M+102,y,{size:10,bold:true});y+=17});
  y+=10;
  // tabel rincian
  const head=t=>{d.rect(M,y,R-M,22,"#f1f5f9");d.text(t,M+10,y+15,{size:10,bold:true,color:ac});y+=22};
  const row=(l,v,o={})=>{d.text(d.fit(l,R-M-150,10,!!o.b),M+10,y+16,{size:10,bold:!!o.b,color:o.c||ink});d.text(v,R-10,y+16,{size:10,bold:!!o.b,color:o.c||ink,align:"right"});y+=24;d.line(M,y,R,y)};
  head("PENDAPATAN");
  row("Gaji pokok",pdfRp(p.pokok));
  if(p.tunjanganList&&p.tunjanganList.length)p.tunjanganList.forEach(x=>row(x.nama||"Tunjangan",pdfRp(x.nominal)));else row("Tunjangan",pdfRp(p.tunjangan));
  if(p.target>0)row(`Bonus penjualan (penjualan ${pdfRp(p.penjualan)} / target ${pdfRp(p.target)}${p.capai?", tercapai":""})`,pdfRp(p.bonus));
  if(p.lembur>0)row(`Upah lembur (${p.lemburJam} jam)`,pdfRp(p.lembur));
  if(p.thr>0)row(`THR (${p.thrBln} bulan masa kerja)`,pdfRp(p.thr));
  row("Penghasilan bruto",pdfRp(p.bruto),{b:1});
  y+=12;head("POTONGAN");
  if(p.bpjsKes>0)row("BPJS Kesehatan (1%)",pdfRp(p.bpjsKes));
  if(p.bpjsJht>0)row("BPJS JHT (2%)",pdfRp(p.bpjsJht));
  if(p.bpjsJp>0)row("BPJS Jaminan Pensiun (1%)",pdfRp(p.bpjsJp));
  row(`PPh21${p.pphMetode?` (${p.pphMetode}${p.terPct!=null?" "+p.terPct+"%":""})`:""}`,pdfRp(p.pph));
  row("Potongan lain",pdfRp(p.potongan));
  if(p.telat!==undefined)row(`Potongan terlambat (${p.telat}x, kena ${p.telatKena}x)`,pdfRp(p.potTelat));
  row("Total potongan",pdfRp((p.pph||0)+(p.bpjsKary||0)+(p.potongan||0)+(p.potTelat||0)),{b:1});
  // gaji bersih
  y+=18;d.rect(M,y,R-M,50,ac);d.text("GAJI BERSIH DITERIMA",M+16,y+30,{size:11,bold:true,color:"#ffffff"});d.text(pdfRp(p.bersih),R-16,y+32,{size:20,bold:true,color:"#ffffff",align:"right"});y+=70;
  if(p.paidAt){const t=new Date(p.paidAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});d.text("Status: sudah ditransfer pada "+t,M,y,{size:9.5,color:"#166534",bold:true});y+=16}
  // catatan kaki
  d.line(M,PH-62,R,PH-62);d.text("Dokumen ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan. Rahasia - hanya untuk karyawan yang bersangkutan.",M,PH-46,{size:8,color:mut});
  d.text("Dicetak "+new Date().toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"}),M,PH-33,{size:8,color:mut});
  return d.build({title:`Slip Gaji ${p.name||""} ${blnFull(p.periode)}`});
}
const slipFile=p=>`slip-gaji-${String(p.name||"karyawan").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${p.periode}.pdf`;
async function slipPdf(id){
  try{const p=(typeof SLIPS!=="undefined"&&SLIPS[id])||(PAYM&&Object.values(PAYM).find(x=>x.id===id));if(!p)return toast("Slip tidak ditemukan");
    const u=ADMIN()?(USERS.find(x=>x.id===p.uid)||{}):ME;pdfSave(await slipBlob(p,u),slipFile(p));toast("Slip PDF diunduh")}
  catch(e){toast("Gagal membuat PDF: "+e.message)}
}

// ---------- Slip karyawan: sinkron langsung (realtime) dengan data dari admin ----------
let SLIPS={},SLIP_UNS=null,SLIP_INIT=false;
const slipStop=()=>{if(SLIP_UNS){SLIP_UNS();SLIP_UNS=null}SLIP_OPEN=new Set();clearTimeout(SLIP_TM)};
// Slip gaji dikunci PIN: yang tampil hanya daftar periode. Isi slip baru terbuka setelah PIN benar (terkunci lagi saat pindah menu / 2 menit).
let SLIP_OPEN=new Set(),SLIP_TM=null;
const slipRow=p=>SLIP_OPEN.has(p.id)?`${slipHtml(p)}<div style="text-align:right;margin:-8px 0 16px"><button class="btn ghost sm" onclick="slipClose('${p.id}')">🔒 Tutup</button></div>`
  :`<div class="box"><div class="row"><h3 style="margin:0">Periode ${esc(blnFull(p.periode))}${p.paidAt?` <small class="mut" style="font-weight:400">· ✅ Ditransfer ${fmtD(p.paidAt)}</small>`:""}${p.updatedAt?` <small class="mut" style="font-weight:400">· 🔄 Diperbarui ${fmtD(p.updatedAt)}</small>`:""}</h3><button class="btn sm" onclick="slipOpen('${p.id}')">🔒 Buka</button></div></div>`;
const slipList=l=>{SLIPS=Object.fromEntries(l.map(p=>[p.id,p]));return l.map(slipRow).join("")||'<div class="box">'+emptyBox("💸","Belum ada slip gaji","Slip muncul di sini setelah gaji ditransfer.")+'</div>'};
const slipRedraw=()=>{const el=document.getElementById("slipBox");if(el){el.innerHTML=slipList(Object.values(SLIPS).sort((a,b)=>b.periode.localeCompare(a.periode)));tr(el)}};
const slipLock=()=>{SLIP_OPEN=new Set();clearTimeout(SLIP_TM);if(view==="slip")slipRedraw()};
function slipClose(id){SLIP_OPEN.delete(id);slipRedraw()}
async function slipOpen(id){
  if(!(await pinAsk()))return;
  SLIP_OPEN.add(id);slipRedraw();clearTimeout(SLIP_TM);SLIP_TM=setTimeout(slipLock,120000);
}
// ---- PIN slip gaji (6 digit). Disimpan sebagai hash (salt+SHA-256) di dokumen user, jadi berlaku di semua perangkat. ----
const pinHash=async(pin,salt)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+":"+pin+":"+ME.id));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("")};
const pinFresh=async()=>{try{const d=await db.collection("users").doc(ME.id).get();ME.slipPin=d.exists?d.data().slipPin:undefined}catch(e){}return ME.slipPin};
function pinModal(title,sub,fields,okText,check){
  return new Promise(res=>{
    const o=document.createElement("div");o.className="pinov";
    o.innerHTML=`<div class="pinbox"><h3>${title}</h3><p class="mut" style="margin-bottom:12px">${sub}</p>${fields.map(f=>`<input type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="${f}" class="pin">`).join("")}<p class="pinerr" style="color:var(--bad);min-height:20px;margin:6px 0"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" data-x>Batal</button><button class="btn" data-ok>${okText}</button></div></div>`;
    document.body.appendChild(o);tr(o);const ins=[...o.querySelectorAll("input")],err=o.querySelector(".pinerr"),close=v=>{o.remove();res(v)};
    ins.forEach(i=>{i.oninput=()=>{i.value=i.value.replace(/\D/g,"")};i.onkeydown=e=>{if(e.key==="Enter")o.querySelector("[data-ok]").click();if(e.key==="Escape")close(null)}});ins[0].focus();
    o.querySelector("[data-x]").onclick=()=>close(null);
    o.querySelector("[data-ok]").onclick=async()=>{const v=ins.map(i=>i.value),r=await check(v);if(r===true)close(v);else{err.textContent=r;ins.forEach(i=>i.value="");ins[0].focus()}};
  });
}
async function pinSetup(){
  const r=await pinModal("Buat PIN slip gaji","Slip gaji dikunci dengan PIN 6 angka supaya tidak terbuka orang lain. Ingat PIN ini; kalau lupa, minta admin mereset.",["PIN baru (6 angka)","Ulangi PIN"],"Simpan PIN",async v=>{
    if(!/^\d{6}$/.test(v[0]))return"PIN harus 6 angka";if(v[0]!==v[1])return"Ulangi PIN tidak sama";return true});
  if(!r)return false;
  const salt=Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>x.toString(16).padStart(2,"0")).join(""),val=salt+"$"+await pinHash(r[0],salt);
  await db.collection("users").doc(ME.id).update({slipPin:val});ME.slipPin=val;toast("PIN slip gaji tersimpan");return true;
}
async function pinAsk(){
  if(!(await pinFresh()))return pinSetup();
  return !!(await pinModal("Masukkan PIN","Masukkan PIN 6 angka untuk membuka slip gaji.",["PIN"],"Buka",async v=>{
    const now=Date.now(),l=+(sessionStorage.getItem("pinLock")||0);if(l>now)return`Terlalu banyak salah. Coba lagi ${Math.ceil((l-now)/1000)} detik lagi.`;
    if(!/^\d{6}$/.test(v[0]))return"PIN harus 6 angka";
    const[salt,h]=ME.slipPin.split("$");if(await pinHash(v[0],salt)===h){sessionStorage.removeItem("pinFail");return true}
    const n=+(sessionStorage.getItem("pinFail")||0)+1;sessionStorage.setItem("pinFail",n);
    if(n>=5){sessionStorage.setItem("pinLock",now+60000);sessionStorage.setItem("pinFail",0);return"PIN salah 5x. Dikunci 1 menit."}
    return`PIN salah (${n}/5)`}));
}
async function resetPin(id){
  if(!await uiConfirm("Reset PIN slip gaji karyawan ini? Dia akan diminta membuat PIN baru saat membuka menu Slip Gaji."))return;
  await db.collection("users").doc(id).update({slipPin:firebase.firestore.FieldValue.delete()});toast("PIN slip direset");render();
}
function slipLive(){
  slipStop();SLIP_INIT=false;
  SLIP_UNS=db.collection("payslips").where("uid","==",ME.id).onSnapshot(s=>{
    const l=s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.paid===true).sort((a,b)=>b.periode.localeCompare(a.periode)),el=document.getElementById("slipBox");
    if(el&&view==="slip"){el.innerHTML=slipList(l);tr(el);
      if(SLIP_INIT&&s.docChanges().some(c=>c.type!=="removed"&&!c.doc.metadata.hasPendingWrites))toast("Slip gaji diperbarui");}
    SLIP_INIT=true;nfRefresh(true);
  },e=>{});
}
V.slip=async()=>{const l=(await get("payslips","uid",ME.id)).filter(p=>p.paid===true).sort((a,b)=>b.periode.localeCompare(a.periode));
  const t=AFTER;SLIP_OPEN=new Set();AFTER=()=>{if(t)t();slipLive();if(!ME.slipPin)pinSetup()};
  return head("Slip Gaji","Tersinkron otomatis dengan data dari admin")+`<div id="slipBox">${slipList(l)}</div>`};
