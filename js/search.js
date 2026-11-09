// ===== Pencarian di semua dropdown & tabel panjang =====
// 1) Setiap <select> dengan >= 7 pilihan otomatis jadi dropdown yang bisa dicari (ketik nama, panah atas/bawah, Enter).
//    <select> asli tetap ada (disembunyikan), jadi kode lama yang membaca .value / onchange tidak perlu diubah.
//    Paksa aktif: data-search="1"  |  matikan: data-search="0"
// 2) Setiap tabel dengan >= 8 baris data otomatis mendapat kotak "Cari di tabel" (matikan: data-search="0" pada <table>).
// Elemen yang muncul belakangan (hasil render() / dialog) ditangani otomatis oleh MutationObserver.
(function(){
const MIN_OPT=7,MIN_ROW=8;
const TX={id:["Cari…","Tidak ditemukan","Cari di tabel… (nama, jabatan, dll)",(n,m)=>`${n} dari ${m} baris`],
  en:["Search…","No results","Search table…",(n,m)=>`${n} of ${m} rows`],zh:["搜索…","无结果","搜索表格…",(n,m)=>`${n} / ${m} 行`]};
const tx=()=>TX[typeof LANG!=="undefined"?LANG:"id"]||TX.id;
const norm=s=>String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vd=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value"),sd=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"selectedIndex");
let POP=null;

// ---------- dropdown ----------
function hi(t,raw){                                    // sorot teks yang cocok
  const lo=t.toLowerCase(),R=[];
  if(lo.length===t.length)raw.forEach(k=>{const i=k?lo.indexOf(k):-1;if(i>=0)R.push([i,i+k.length])});
  R.sort((a,b)=>a[0]-b[0]);const M=[];R.forEach(r=>{const l=M[M.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else M.push(r)});
  let o="",p=0;M.forEach(([a,b])=>{o+=esc(t.slice(p,a))+"<mark>"+esc(t.slice(a,b))+"</mark>";p=b});return o+esc(t.slice(p));
}
function close(){if(!POP)return;POP.pop.remove();if(POP.bd)POP.bd.remove();POP=null}
function open(s,b){
  close();if(s.disabled)return;
  const mob=innerWidth<640,pop=document.createElement("div"),q=document.createElement("input"),list=document.createElement("div");
  pop.className="ss-pop"+(mob?" m":"");q.type="search";q.className="ss-q";q.placeholder=tx()[0];q.autocomplete="off";q.spellcheck=false;list.className="ss-list";list.setAttribute("role","listbox");
  pop.append(q,list);let bd=null;if(mob){bd=document.createElement("div");bd.className="ss-bd";bd.onclick=close;document.body.appendChild(bd)}
  document.body.appendChild(pop);
  const P=POP={s,b,pop,bd,list,q,items:[],hl:-1};
  P.place=()=>{
    if(!document.body.contains(b))return close();
    const r=b.getBoundingClientRect(),vh=window.visualViewport?visualViewport.height:innerHeight;
    if(mob){pop.style.cssText="left:8px;right:8px;top:8px";list.style.maxHeight=Math.min(320,vh*.6)+"px";return}
    const w=Math.min(Math.max(r.width,240),innerWidth-16),left=Math.max(8,Math.min(r.left,innerWidth-w-8)),below=vh-r.bottom-12,above=r.top-12,down=below>=240||below>=above;
    pop.style.cssText=`width:${w}px;left:${left}px;${down?`top:${r.bottom+4}px`:`bottom:${innerHeight-r.top+4}px`}`;list.style.maxHeight=Math.max(120,Math.min(320,(down?below:above)-64))+"px";
  };
  const setHl=i=>{if(P.items[P.hl])P.items[P.hl].classList.remove("hl");P.hl=i;const e=P.items[i];if(e){e.classList.add("hl");e.scrollIntoView({block:"nearest"})}};
  const pick=idx=>{const ch=s.selectedIndex!==idx;s.selectedIndex=idx;close();b.focus({preventScroll:true});if(ch){s.dispatchEvent(new Event("input",{bubbles:true}));s.dispatchEvent(new Event("change",{bubbles:true}))}};
  const build=()=>{
    const raw=q.value.toLowerCase().split(/\s+/).filter(Boolean),qq=raw.map(norm),ok=o=>qq.every(k=>norm(o.text).includes(k));
    list.innerHTML="";P.items=[];
    const add=o=>{if(!ok(o))return;const d=document.createElement("div");d.className="ss-it"+(o.index===s.selectedIndex?" on":"")+(o.disabled?" dis":"");d.innerHTML=hi(o.text,raw)||"&nbsp;";
      if(!o.disabled){d.onmousedown=e=>{e.preventDefault();pick(o.index)};d.onmousemove=()=>{const i=P.items.indexOf(d);if(i!==P.hl)setHl(i)}}
      list.appendChild(d);d._o=o;P.items.push(d)};
    [...s.children].forEach(c=>{if(c.tagName==="OPTGROUP"){const k=[...c.children].filter(ok);if(!k.length)return;const h=document.createElement("div");h.className="ss-gh";h.textContent=c.label;list.appendChild(h);k.forEach(add)}else add(c)});
    if(!P.items.length){const n=document.createElement("div");n.className="ss-no";n.textContent=tx()[1];list.appendChild(n)}
    const sel=P.items.findIndex(d=>d.classList.contains("on")&&!d._o.disabled),first=P.items.findIndex(d=>!d._o.disabled);
    P.hl=-1;setHl(raw.length?first:(sel>=0?sel:first));
  };
  q.oninput=build;
  q.onkeydown=e=>{
    const n=P.items.length,mv=d=>{let i=P.hl;for(let k=0;k<n;k++){i=(i+d+n)%n;if(!P.items[i]._o.disabled)return setHl(i)}};
    if(e.key==="ArrowDown"){e.preventDefault();mv(1)}else if(e.key==="ArrowUp"){e.preventDefault();mv(-1)}
    else if(e.key==="Enter"){e.preventDefault();const it=P.items[P.hl];if(it&&!it._o.disabled)pick(it._o.index)}
    else if(e.key==="Escape"){e.preventDefault();close();b.focus({preventScroll:true})}else if(e.key==="Tab")close();
  };
  P.place();build();q.focus({preventScroll:true});
}
function enhance(s){
  if(s.multiple||s.size>1||s.dataset.search==="0")return;
  if(s.dataset.ss){const p=s.previousElementSibling;if(p&&p.classList.contains("ss"))return;delete s.dataset.ss}   // salinan DOM tanpa pembungkus -> bangun ulang
  if(s.options.length<MIN_OPT&&s.dataset.search!=="1")return;
  const w=document.createElement("div"),b=document.createElement("button"),pe=s.parentElement;
  w.className="ss";["margin","marginLeft","marginRight","marginTop","marginBottom","maxWidth","minWidth","width","flex","gridColumn"].forEach(k=>{if(s.style[k])w.style[k]=s.style[k]});
  if(pe&&getComputedStyle(pe).display.indexOf("flex")>-1){const cs=getComputedStyle(s);w.style.flex=cs.flexGrow+" "+cs.flexShrink+" "+cs.flexBasis;w.style.minWidth="0"}
  b.type="button";b.className="ss-btn"+(s.classList.contains("langsel")?" langsel":"");b.setAttribute("aria-haspopup","listbox");
  w.appendChild(b);s.parentNode.insertBefore(w,s);s.style.display="none";s.dataset.ss="1";
  const sync=()=>{const o=s.options[s.selectedIndex],t=o?o.text:"";b.textContent=t||"\u00a0";b.title=t;b.disabled=s.disabled};
  sync();
  Object.defineProperty(s,"value",{configurable:true,get(){return vd.get.call(s)},set(v){vd.set.call(s,v);sync()}});                 // kode lain yang mengisi s.value ikut memperbarui tampilan
  Object.defineProperty(s,"selectedIndex",{configurable:true,get(){return sd.get.call(s)},set(v){sd.set.call(s,v);sync()}});
  new MutationObserver(sync).observe(s,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["disabled","selected"]});
  b.onclick=()=>POP&&POP.s===s?close():open(s,b);
  b.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();open(s,b)}};
}

// ---------- tabel ----------
const TQ={};                                           // kata kunci per tabel (bertahan selama masih di halaman yang sama, mis. setelah render ulang)
function enhanceTable(t,idx){
  if(t.dataset.search==="0"||t.dataset.ts||t.dataset.pg)return;   // tabel ber-data-pg dikelola tabel.js
  const rows=[...t.rows].filter(r=>r.querySelector("td")&&!r.querySelector("th")&&!(r.cells.length===1&&r.cells[0].colSpan>1));
  if(rows.length<MIN_ROW)return;
  t.dataset.ts="1";
  const host=t.closest(".tw")||t,key=(typeof view!=="undefined"?view:"")+":"+idx,wrap=document.createElement("div"),inp=document.createElement("input"),cnt=document.createElement("small");
  wrap.className="tsearch";inp.type="search";inp.placeholder=tx()[2];inp.autocomplete="off";cnt.className="mut";wrap.append(inp,cnt);host.parentNode.insertBefore(wrap,host);
  const texts=rows.map(r=>norm(r.textContent)),run=()=>{
    const qq=norm(inp.value).split(/\s+/).filter(Boolean);TQ[key]=inp.value;let n=0;
    rows.forEach((r,i)=>{const ok=qq.every(k=>texts[i].includes(k));r.style.display=ok?"":"none";if(ok)n++});
    cnt.textContent=qq.length?tx()[3](n,rows.length):"";
  };
  inp.oninput=run;if(TQ[key]){inp.value=TQ[key];run()}
}
const scanTables=r=>{[...r.querySelectorAll("table")].forEach((t,i)=>enhanceTable(t,i));if(r.tagName==="TABLE")enhanceTable(r,0)};

// ---------- pasang ----------
const scan=n=>{if(n.nodeType!==1)return;if(n.tagName==="SELECT")enhance(n);else if(n.querySelectorAll)n.querySelectorAll("select").forEach(enhance);scanTables(n)};
document.addEventListener("mousedown",e=>{if(POP&&!POP.pop.contains(e.target)&&!POP.b.contains(e.target))close()},true);
addEventListener("resize",()=>POP&&POP.place());
if(window.visualViewport)visualViewport.addEventListener("resize",()=>POP&&POP.place());
addEventListener("scroll",e=>{if(POP&&!POP.pop.contains(e.target))POP.place()},true);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
scan(document.body);
})();
