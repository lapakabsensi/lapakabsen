// ===== Tabel panjang: urut dengan klik judul kolom + halaman 25/50/100 baris + pencarian =====
// Cara pakai: beri atribut data-pg="nama" pada <table>. Modul ini otomatis aktif setiap tabel itu muncul (juga setelah render ulang).
// - Klik judul kolom: urut naik -> turun -> kembali ke urutan awal. Angka (Rp, %, 3x) diurutkan sebagai angka.
// - Baris yang disembunyikan halaman tetap ada di DOM, jadi tombol simpan / unduh / pilih semua tetap mencakup semua baris.
// - Filter lain (mis. departemen di Karyawan) cukup mengisi row.dataset.f="0" lalu memanggil tbRefresh(nama,true).
const TBS={};
const tbSt=id=>TBS[id]||(TBS[id]={c:-1,d:1,size:tbSize(),page:1,q:""});
function tbSize(){try{const v=+localStorage.getItem("tbSize");if([0,25,50,100].includes(v)&&localStorage.getItem("tbSize")!==null)return v}catch(e){}return 25}
const tbNorm=s=>String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const tbQ=id=>(TBS[id]||{}).q||"";
const tbIsData=tr=>tr.tagName==="TR"&&!!tr.querySelector(":scope>td")&&!tr.classList.contains("grp")&&!("npg"in tr.dataset)&&![...tr.children].some(c=>c.colSpan>=3);
const tbRows=t=>[...t.querySelectorAll("tr")].filter(tbIsData);
const tbHead=t=>[...t.rows].find(r=>r.querySelector(":scope>th"));
function tbKey(tr,c){
  const td=tr.children[c];if(!td)return"";
  const inp=td.querySelector("input:not([type=checkbox]):not([type=radio]),select");if(inp)return String(inp.value||"").trim();
  const cb=td.querySelector("input[type=checkbox]");if(cb&&!td.textContent.trim())return cb.checked?"1":"0";
  return String(td.dataset.v!==undefined?td.dataset.v:td.textContent).replace(/\s+/g," ").trim();
}
const tbNil=s=>s===""||s==="-"||s==="—"||s==="–";
function tbNum(s){
  s=s.replace(/^-?\s*Rp\.?\s*/i,m=>/^-/.test(m)?"-":"").replace(/\s/g,"");
  if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return+s.replace(/\./g,"").replace(",",".");
  if(/^-?\d+([.,]\d+)?%?$/.test(s))return+s.replace("%","").replace(",",".");
  return NaN;
}
function tbSortable(th){return th&&th.textContent.trim()&&!th.querySelector("input,select")&&!th.classList.contains("nosort")}
function tbEnsure(t){
  if(t.dataset.pgi)return;t.dataset.pgi="1";
  const id=t.dataset.pg,S=tbSt(id),h=tbHead(t);
  tbRows(t).forEach((r,i)=>r.dataset.tbi=i);
  if(h)[...h.children].forEach((th,i)=>{if(tbSortable(th)){th.classList.add("srt");th.dataset.c=i;th.title="Klik untuk mengurutkan"}});
  const host=t.closest(".tw")||t;
  tbMobile(t,h,host,S);
  if(t.dataset.pgq!=="0"&&tbRows(t).length>=8){ // kotak cari bawaan (tabel yang sudah punya kotak cari sendiri memakai data-pgq="0")
    const w=document.createElement("div"),i=document.createElement("input"),c=document.createElement("small");w.className="tsearch";i.type="search";i.placeholder="Cari di tabel… (nama, jabatan, dll)";i.autocomplete="off";i.value=S.q;c.className="mut";c.dataset.tbc=id;
    i.oninput=()=>tbSearch(id,i.value);w.append(i,c);host.parentNode.insertBefore(w,host)}
  const pg=document.createElement("div");pg.className="pgbar";pg.dataset.for=id;host.after(pg);t.__pg=pg;
  if(S.c>=0&&!(h&&h.children[S.c]&&tbSortable(h.children[S.c])))S.c=-1;
  tbSortRows(t);tbApply(t,false);
}
// ---- HP: tabel jadi kartu per baris (label kolom dari judul), judul tabel diganti pilihan "Urutkan" ----
function tbMobile(t,h,host,S){
  if(!h)return;h.classList.add("tbh");
  const lab=[...h.children].map(th=>th.textContent.replace(/\s+/g," ").trim());
  let first=lab.findIndex((l,i)=>l&&!h.children[i].querySelector("input"));
  tbRows(t).forEach(r=>[...r.children].forEach((td,i)=>{td.dataset.l=lab[i]||"";if(i===first)td.dataset.t="1";else if(!td.querySelector("input,select,button,a")&&/^(-|—|–)?$/.test(td.textContent.trim())&&lab[i])td.dataset.e="1";
    if(lab[i]&&i!==first&&!td.classList.contains("ck")&&!td.classList.contains("ckc")&&td.childNodes.length>1&&!td.querySelector(":scope>.tdv")){const w=document.createElement("div");w.className="tdv";while(td.firstChild)w.appendChild(td.firstChild);td.appendChild(w)}}));
  const id=t.dataset.pg,opts=[...h.children].map((th,i)=>tbSortable(th)?[i,lab[i].slice(0,26)]:null).filter(Boolean);
  const cb=[...h.children].map(th=>th.querySelector('input[type=checkbox]')).find(Boolean);
  if(!opts.length&&!cb)return;
  const m=document.createElement("div");m.className="tbm";
  m.innerHTML=(opts.length?`<label>Urutkan<select data-search="0" data-tbm="${id}"><option value="-1:1">Urutan awal</option>${opts.map(([i,l])=>`<option value="${i}:1">${esc(l)} ↑</option><option value="${i}:-1">${esc(l)} ↓</option>`).join("")}</select></label>`:"")+(cb?`<label class="tbmc"><input type="checkbox" data-tbmc="${id}"> ${esc(lab[[...h.children].indexOf(cb.closest("th"))]||"Pilih semua")}</label>`:"");
  host.parentNode.insertBefore(m,host);
  const sel=m.querySelector("select");if(sel)sel.value=S.c+":"+S.d;
  t.__cb=cb;
}
function tbSortRows(t){
  const S=tbSt(t.dataset.pg),h=tbHead(t);
  if(h)[...h.children].forEach((th,i)=>{th.classList.toggle("asc",S.c===i&&S.d===1);th.classList.toggle("desc",S.c===i&&S.d===-1)});
  const all=tbRows(t);let cmp;
  if(S.c<0)cmp=(a,b)=>a.dataset.tbi-b.dataset.tbi;
  else{
    const c=S.c,ks=new Map(all.map(r=>[r,tbKey(r,c)])),num=[...ks.values()].filter(k=>!tbNil(k)).every(k=>!isNaN(tbNum(k)));
    const col=new Intl.Collator("id",{numeric:true,sensitivity:"base"});
    cmp=(a,b)=>{const x=ks.get(a),y=ks.get(b),nx=tbNil(x),ny=tbNil(y);if(nx||ny)return nx&&ny?0:nx?1:-1;
      const r=num?tbNum(x)-tbNum(y):col.compare(x,y);return r?r*S.d:a.dataset.tbi-b.dataset.tbi};
  }
  t.querySelectorAll("tbody").forEach(tb=>{
    const ch=[...tb.children],d=ch.filter(tbIsData).sort(cmp);let i=0;
    if(d.length>1)tb.append(...ch.map(x=>tbIsData(x)?d[i++]:x));
  });
  if(!t.tBodies.length){/* tabel tanpa tbody tidak mungkin: browser selalu membuatnya */}
}
function tbApply(t,reset){
  const id=t.dataset.pg,S=tbSt(id),rows=tbRows(t),qq=tbNorm(S.q).split(/\s+/).filter(Boolean),q=qq.length;
  rows.forEach(r=>{if(!q){r.dataset.q="1";return}const x=r.__tx||(r.__tx=tbNorm(r.dataset.s||r.textContent));r.dataset.q=qq.every(k=>x.includes(k))?"1":"0"});
  const vis=rows.filter(r=>r.dataset.f!=="0"&&r.dataset.q!=="0"),size=S.size||vis.length||1,pages=Math.max(1,Math.ceil(vis.length/size));
  if(reset)S.page=1;S.page=Math.min(Math.max(1,S.page),pages);
  const from=(S.page-1)*size,show=new Set(vis.slice(from,from+size));
  rows.forEach(r=>{r.style.display=show.has(r)?"":"none"});
  t.querySelectorAll("tbody").forEach(tb=>{const g=tb.querySelector("tr.grp");if(g)g.style.display=[...tb.querySelectorAll("tr")].some(r=>show.has(r))?"":"none"});
  document.querySelectorAll(`[data-tbc="${id}"]`).forEach(e=>e.textContent=q||rows.some(r=>r.dataset.f==="0")?`${vis.length} dari ${rows.length} baris`:`${rows.length} baris`);
  if(id!=="karyawan"){let em=t.__em;if(!em){em=t.__em=document.createElement("div");(t.closest(".tw")||t).after(em)}
    em.innerHTML=rows.length&&!vis.length&&typeof emptyBox==="function"?emptyBox("🔎","Tidak ada baris yang cocok","Coba kata kunci lain."):""}
  const pg=t.__pg;if(!pg)return;
  if(rows.length<=25&&S.size===25){pg.innerHTML="";pg.style.display="none";return}
  pg.style.display="";
  const P=S.page,w=[];for(let i=1;i<=pages;i++)if(i===1||i===pages||Math.abs(i-P)<=1)w.push(i);else if(w[w.length-1]!=="…")w.push("…");
  const b=(p,l,dis,on)=>`<button type="button" class="btn sm ${on?"":"ghost"}" data-tbp="${id}" data-p="${p}"${dis?" disabled":""}>${l}</button>`;
  pg.innerHTML=`<span class="mut">${vis.length?`Menampilkan <b>${from+1}–${Math.min(from+size,vis.length)}</b> dari <b>${vis.length}</b>`:"Tidak ada baris"}</span><span class="sp"></span>
   <label class="pgsz">Baris per halaman <select data-search="0" data-tbs="${id}">${[[25,"25"],[50,"50"],[100,"100"],[0,"Semua"]].map(([v,l])=>`<option value="${v}"${S.size===v?" selected":""}>${l}</option>`).join("")}</select></label>
   ${pages>1?`<span class="pgn">${b(P-1,"‹",P<=1)}${w.map(x=>x==="…"?'<span class="mut">…</span>':b(x,x,false,x===P)).join("")}${b(P+1,"›",P>=pages)}</span>`:""}`;
}
function tbRefresh(id,reset){const t=document.querySelector(`table[data-pg="${id}"]`);if(!t)return;tbEnsure(t);tbApply(t,reset)}
function tbSearch(id,v){tbSt(id).q=v;tbRefresh(id,true)}
document.addEventListener("click",e=>{
  const th=e.target.closest&&e.target.closest("th.srt");
  if(th){const t=th.closest("table[data-pg]");if(t&&e.target.tagName!=="INPUT"){const S=tbSt(t.dataset.pg),c=+th.dataset.c;
    if(S.c!==c){S.c=c;S.d=1}else if(S.d===1)S.d=-1;else{S.c=-1;S.d=1}
    tbSortRows(t);tbApply(t,true)}return}
  const b=e.target.closest&&e.target.closest("[data-tbp]");
  if(b&&!b.disabled){const t=document.querySelector(`table[data-pg="${b.dataset.tbp}"]`);if(t){tbSt(b.dataset.tbp).page=+b.dataset.p;tbApply(t,false);const w=t.closest(".tw")||t;const r=w.getBoundingClientRect();if(r.top<0)w.scrollIntoView({block:"start"})}}
});
document.addEventListener("change",e=>{
  const ms=e.target.closest&&e.target.closest("select[data-tbm]");
  if(ms){const t=document.querySelector(`table[data-pg="${ms.dataset.tbm}"]`);if(t){const[c,d]=ms.value.split(":").map(Number),S=tbSt(ms.dataset.tbm);S.c=c;S.d=d;tbSortRows(t);tbApply(t,true)}return}
  const mc=e.target.closest&&e.target.closest("input[data-tbmc]");
  if(mc){const t=document.querySelector(`table[data-pg="${mc.dataset.tbmc}"]`);if(t&&t.__cb&&t.__cb.checked!==mc.checked){t.__cb.checked=mc.checked;t.__cb.dispatchEvent(new Event("change",{bubbles:true}))}return}
  const s=e.target.closest&&e.target.closest("select[data-tbs]");if(!s)return;
  const S=tbSt(s.dataset.tbs);S.size=+s.value;try{localStorage.setItem("tbSize",String(S.size))}catch(_){}
  Object.keys(TBS).forEach(k=>TBS[k].size=S.size);tbRefresh(s.dataset.tbs,true);
});
{let q=0;const scan=()=>{q=0;document.querySelectorAll("table[data-pg]:not([data-pgi])").forEach(tbEnsure)};
 new MutationObserver(()=>{if(!q)q=requestAnimationFrame(scan)}).observe(document.body,{childList:true,subtree:true})}
