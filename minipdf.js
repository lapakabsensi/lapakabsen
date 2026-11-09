// Inti pembuat PDF (salinan dari ../js/pdf.js tanpa bagian slip gaji) untuk panel Super Admin.
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
    const inf=add(`<< /Title (${pdfEsc(pdfTxt(info.title||"Dokumen"))}) /Producer (Absensi & Payroll) >>`);
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

const pdfRp=n=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
