// ===== Audit keaslian absen (HR / admin) =====
// Mencari tanda-tanda absen yang tidak wajar pada rekap yang sedang tampil: koordinat persis sama berhari-hari, selisih wajah nyaris 0,
// foto yang sama dipakai berulang (atau dipakai akun lain), dan foto absen yang identik dengan foto rekam wajah.
// Ini PETUNJUK untuk dicek manusia, bukan bukti. Dimuat setelah app.js; dipanggil dari rekapView lewat auditBox().
const AUD_K=["in","mid","aft","out"],AUD_NM={in:"Masuk",mid:"Siang",aft:"Sore",out:"Pulang"},AUD_MAX=240,AUD_HAM=2;
const audLoc=v=>!v?"":typeof v==="object"?(v.lat!=null&&v.lng!=null?`${(+v.lat).toFixed(5)},${(+v.lng).toFixed(5)}`:""):String(v).trim();
function audRows(D){
  const R=[];D.a.forEach(x=>AUD_K.forEach(k=>{if(x[k]&&(x[k+"Photo"]||x[k+"Dist"]!=null))R.push({uid:x.uid,date:x.date,k,t:x[k],photo:x[k+"Photo"]||"",dist:x[k+"Dist"],loc:audLoc(x[k+"Loc"])})}));
  return R;
}
// tahap 1 (langsung, hanya dari data dokumen): lokasi & selisih wajah
function audFlags(rows,nm){
  const F=[],by={};rows.forEach(r=>(by[r.uid]=by[r.uid]||[]).push(r));
  const add=(r,sev,why)=>F.push({uid:r.uid,name:nm[r.uid]||"-",date:r.date,k:r.k,sev,why});
  Object.values(by).forEach(L=>{
    const loc={};L.forEach(r=>{if(r.loc)(loc[r.loc]=loc[r.loc]||[]).push(r)});
    Object.entries(loc).forEach(([l,A])=>{const d=new Set(A.map(r=>r.date)).size;if(d>=3)A.forEach(r=>add(r,"Sedang",`Koordinat persis sama (${l}) di ${d} hari berbeda. GPS asli biasanya bergeser sedikit tiap hari.`))});
    L.forEach(r=>{if(typeof r.dist==="number"&&r.dist<=.08)add(r,"Tinggi",`Selisih wajah hanya ${r.dist}: hampir identik dengan data rekam, tidak lazim dari kamera langsung.`)});
    const dd={};L.forEach(r=>{if(typeof r.dist==="number")(dd[r.dist]=dd[r.dist]||[]).push(r)});
    Object.entries(dd).forEach(([v,A])=>{if(A.length>=5&&A.length>=L.length*.5)A.forEach(r=>add(r,"Sedang",`Selisih wajah ${v} muncul ${A.length}x dari ${L.length} absen. Nilai dari kamera asli biasanya bervariasi.`))});
  });
  return F;
}
// tahap 2: perbandingan foto
function audDh(img){
  const c=document.createElement("canvas");c.width=9;c.height=8;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(img,0,0,9,8);
  const d=x.getImageData(0,0,9,8).data,g=i=>d[i]*.3+d[i+1]*.59+d[i+2]*.11;let h="";
  for(let y=0;y<8;y++)for(let i=0;i<8;i++){const a=(y*9+i)*4;h+=g(a)>g(a+4)?"1":"0"}return h;
}
const audHam=(a,b)=>{let n=0;for(let i=0;i<64;i++)if(a[i]!==b[i])n++;return n};
const audImg=src=>new Promise((ok,no)=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>ok(im);im.onerror=()=>no(new Error("img"));im.src=src});
async function audKey(p){
  if(!p)return{};
  try{const im=await audImg(phInline(p)?p:await phUrl(p));return{h:audDh(im)}}catch(e){}            // gambar bisa dibaca → sidik visual
  if(!phInline(p)){try{const m=await sref(p).getMetadata();if(m.md5Hash)return{md5:m.md5Hash}}catch(e){}}  // CORS bucket belum dipasang → pakai hash file (hanya menangkap file yang byte-nya sama)
  return{};
}
const audSame=(a,b)=>(a.h&&b.h&&audHam(a.h,b.h)<=AUD_HAM)||(a.md5&&b.md5&&a.md5===b.md5);
async function audPool(items,n,fn){let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<items.length){const j=i++;await fn(items[j],j)}}))}

async function auditRun(){
  const D=window.__RK;if(!D||AUD.busy)return;AUD.busy=true;
  const out=$("#audOut"),st=m=>{if($("#audSt"))$("#audSt").textContent=m};
  try{
    const rows=audRows(D);let F=audFlags(rows,D.nm);AUD.F=F;audDraw();
    const ph=rows.filter(r=>r.photo).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,AUD_MAX);
    const us=await get("users"),U=Object.fromEntries(us.map(u=>[u.id,u]));
    const ek={};await audPool(Object.keys(D.nm).filter(id=>U[id]&&U[id].facePhoto&&rows.some(r=>r.uid===id)),4,async id=>{ek[id]=await audKey(U[id].facePhoto)});
    let n=0;await audPool(ph,6,async r=>{r.key=await audKey(r.photo);st(`Memeriksa foto ${++n}/${ph.length}…`)});
    let none=0;
    ph.forEach(r=>{if(!r.key.h&&!r.key.md5)none++});
    for(let i=0;i<ph.length;i++){
      const r=ph[i];
      if(ek[r.uid]&&audSame(r.key,ek[r.uid]))F.push({uid:r.uid,name:D.nm[r.uid]||"-",date:r.date,k:r.k,sev:"Tinggi",why:"Foto absen identik dengan foto saat rekam wajah (kemungkinan memakai foto/gambar yang sama)."});
      for(let j=i+1;j<ph.length;j++){
        const q=ph[j];if(q.uid===r.uid&&q.date===r.date&&q.k===r.k)continue;
        if(!audSame(r.key,q.key))continue;
        const same=q.uid===r.uid;
        F.push({uid:r.uid,name:D.nm[r.uid]||"-",date:r.date,k:r.k,sev:"Tinggi",why:same?`Foto sama dengan absen ${AUD_NM[q.k].toLowerCase()} ${q.date}. Kamera asli tidak menghasilkan dua foto yang sama.`:`Foto sama dengan absen ${D.nm[q.uid]||"akun lain"} (${q.date}). Foto dipakai bersama / titip absen.`});
      }
    }
    AUD.F=F;AUD.note=none?`${none} foto tidak bisa dibandingkan (tidak terbaca).${ph.length<rows.filter(r=>r.photo).length?` Hanya ${AUD_MAX} foto terbaru yang diperiksa.`:""}`:(ph.length<rows.filter(r=>r.photo).length?`Hanya ${AUD_MAX} foto terbaru yang diperiksa.`:"");
    AUD.done=true;
  }catch(e){toast("Audit gagal: "+e.message)}
  AUD.busy=false;audDraw();
}
const AUD={F:[],busy:false,done:false,note:""};
function audDraw(){
  const o=$("#audOut");if(!o)return;
  const F=AUD.F.slice().sort((a,b)=>(a.sev===b.sev?0:a.sev==="Tinggi"?-1:1)||b.date.localeCompare(a.date));
  // gabungkan temuan identik (orang+tanggal+langkah+alasan)
  const seen=new Set(),L=F.filter(f=>{const k=f.uid+f.date+f.k+f.why;if(seen.has(k))return false;seen.add(k);return true});
  o.innerHTML=(AUD.busy?`<p class="mut" id="audSt">Memeriksa…</p>`:"")+(L.length?`<div class="tw"><table><tr><th>Tingkat</th><th>Nama</th><th>Tanggal</th><th>Absen</th><th>Temuan</th><th></th></tr>${L.map(f=>`<tr><td><span class="tag ${f.sev==="Tinggi"?"no":""}">${f.sev}</span></td><td>${esc(f.name)}</td><td>${esc(f.date)}</td><td>${AUD_NM[f.k]}</td><td>${esc(f.why)}</td><td><button class="btn ghost sm" onclick="audCompare('${esc(f.uid)}')">🖼 Banding foto</button></td></tr>`).join("")}</table></div>`
    :AUD.busy?"":`<p class="mut">${AUD.done?"Tidak ada temuan mencurigakan pada rekap ini. ✅":"Belum diperiksa."}</p>`)
    +(AUD.note&&!AUD.busy?`<p class="mut"><small>${esc(AUD.note)}</small></p>`:"");
  const b=$("#audBtn");if(b)b.disabled=AUD.busy;
}
function auditBox(){
  AUD.F=[];AUD.done=false;AUD.note="";
  return`<div class="box" id="audBox"><div class="row" style="flex-wrap:wrap"><h3 style="margin:0">🔍 Audit keaslian absen</h3><button class="btn ghost sm" id="audBtn" onclick="auditRun()">Periksa absen mencurigakan</button></div>
  <p class="mut" style="margin:8px 0 12px"><small>Mencari koordinat yang persis sama berhari-hari, selisih wajah yang tidak wajar, dan foto yang sama dipakai berulang atau oleh akun lain, pada rekap yang sedang tampil. Temuan hanyalah petunjuk untuk dicek, bukan bukti.</small></p><div id="audOut"></div></div>`;
}
// foto rekam wajah berdampingan dengan foto absen terbaru satu karyawan
async function audCompare(uid){
  const D=window.__RK;if(!D)return;
  const u=(await get("users")).find(x=>x.id===uid)||{},rows=audRows(D).filter(r=>r.uid===uid&&r.photo).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
  const flag=new Set(AUD.F.filter(f=>f.uid===uid).map(f=>f.date+f.k));
  const img=p=>`<img src="${phSrc(p)}"${phAttr(p)} alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block;cursor:zoom-in;background:#e2e8f0" onclick="photoZoom(this.src)">`;
  const o=document.createElement("div");o.className="zoom absd";
  o.innerHTML=`<div class="box absd-c" style="max-width:760px;width:94%;max-height:90vh;overflow:auto" onclick="event.stopPropagation()"><div class="row"><h3 style="margin:0">Banding foto · ${esc(u.name||D.nm[uid]||"")}</h3><button class="btn ghost sm" onclick="this.closest('.absd').remove()">✕</button></div>
  <p class="mut" style="margin:6px 0 10px"><small>Foto saat rekam wajah (kiri atas) dibandingkan dengan ${rows.length} absen terbaru. Bingkai merah = ada temuan.</small></p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
  <div><b style="font-size:12px">Foto rekam wajah</b>${u.facePhoto?img(u.facePhoto):'<p class="mut">Tidak ada</p>'}</div>
  ${rows.map(r=>`<div style="${flag.has(r.date+r.k)?"outline:3px solid #dc2626;outline-offset:2px;border-radius:10px":""}"><b style="font-size:12px">${esc(r.date)} · ${AUD_NM[r.k]} ${esc(r.t||"")}</b>${img(r.photo)}<small class="mut">selisih ${r.dist??"-"}${r.loc?" · "+esc(r.loc):""}</small></div>`).join("")}</div></div>`;
  o.onclick=()=>o.remove();document.body.appendChild(o);
}
