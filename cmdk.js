// ===== Pencarian global (Ctrl+K / Cmd+K / tombol kaca pembesar): ketik nama menu atau nama karyawan, Enter untuk loncat =====
// Memakai NAV_ALL (diisi buildNav), go(), ADMIN(), get(), esc, EDIT, render. Karyawan hanya untuk admin.
let CK={open:false,items:[],sel:0,users:null,at:0};
const ckNorm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
async function ckUsers(){
  if(!ADMIN())return[];
  if(!CK.users||Date.now()-CK.at>60000){try{CK.users=await get("users");CK.at=Date.now()}catch(e){CK.users=CK.users||[]}}
  return CK.users;
}
function ckOpen(){
  if(!ME||CK.open)return;CK.open=true;
  const o=document.createElement("div");o.id="ckov";o.onclick=e=>{if(e.target===o)ckClose()};
  o.innerHTML=`<div class="ckbox" role="dialog" aria-label="Pencarian"><div class="ckin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="ckq" type="text" autocomplete="off" placeholder="${ADMIN()?"Cari menu atau nama karyawan...":"Cari menu..."}" oninput="ckFind()" onkeydown="ckKey(event)"><kbd>Esc</kbd></div><div id="ckl" class="ckl"></div><div class="ckft"><span>↑↓ pilih</span><span>Enter buka</span><span>Esc tutup</span></div></div>`;
  document.body.appendChild(o);const q=document.getElementById("ckq");q.focus();ckFind();
  ckUsers().then(()=>{if(CK.open)ckFind()});
}
function ckClose(){CK.open=false;const o=document.getElementById("ckov");if(o)o.remove()}
function ckFind(){
  const q=ckNorm((document.getElementById("ckq")||{}).value).trim(),words=q.split(/\s+/).filter(Boolean),hit=t=>words.every(w=>t.includes(w));
  const menu=(window.NAV_ALL||[]).map(n=>({k:"m",id:n[0],ic:n[1],t:n[2],s:"Menu",cur:n[0]===view,h:ckNorm(n[2])})).filter(x=>!words.length||hit(x.h));
  const us=!words.length?[]:(CK.users||[]).map(u=>({k:"u",id:u.id,ic:"👤",t:u.name||u.email,s:[u.jabatan,u.dept,u.email].filter(Boolean).join(" · "),h:ckNorm([u.name,u.email,u.jabatan,u.dept,u.wa].join(" "))})).filter(x=>hit(x.h)).slice(0,8);
  CK.items=[...menu,...us];CK.sel=0;ckDraw();
}
function ckDraw(){
  const l=document.getElementById("ckl");if(!l)return;
  l.innerHTML=CK.items.length?CK.items.map((x,i)=>`<div class="cki${i===CK.sel?" on":""}" data-i="${i}" onmousemove="ckHover(${i})" onclick="ckGo(${i})"><span class="cki-i">${x.ic}</span><span class="cki-t">${esc(x.t)}${x.cur?' <small class="mut">(sedang dibuka)</small>':""}<small>${esc(x.s)}</small></span><small class="cki-k">${x.k==="u"?"Karyawan":"Menu"}</small></div>`).join(""):`<div class="ckno">Tidak ada hasil.</div>`;
  const a=l.querySelector(".cki.on");if(a)a.scrollIntoView({block:"nearest"});
}
function ckHover(i){if(CK.sel===i)return;CK.sel=i;document.querySelectorAll("#ckl .cki").forEach((e,j)=>e.classList.toggle("on",j===i))}
function ckKey(e){
  const n=CK.items.length;
  if(e.key==="ArrowDown"){e.preventDefault();if(n){CK.sel=(CK.sel+1)%n;ckDraw()}}
  else if(e.key==="ArrowUp"){e.preventDefault();if(n){CK.sel=(CK.sel-1+n)%n;ckDraw()}}
  else if(e.key==="Enter"){e.preventDefault();ckGo(CK.sel)}
}
function ckGo(i){
  const x=CK.items[i];if(!x)return;ckClose();
  if(x.k==="m")return go(x.id);
  go("karyawan");EDIT=x.id;render();scrollTo(0,0);
}
addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==="k"){e.preventDefault();CK.open?ckClose():ckOpen()}
  else if(e.key==="Escape"&&CK.open)ckClose();
});
