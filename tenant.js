// ===== Kode perusahaan (tenant): satu proyek Firebase untuk banyak pelanggan =====
// Seluruh data tiap pelanggan disimpan di tenants/<kode>/... (users, attendance, requests, dst). db.collection("users") di seluruh aplikasi
// otomatis diarahkan ke sana lewat Proxy di bawah, jadi kode fitur lain tidak perlu diubah. Dimuat setelah demo.js, sebelum app.js.
let TENANT=(function(){
  if(window.DEMO_ON)return"demo";
  // Link rapi https://alamatweb/nerovision: .htaccess menyajikan index.html, tetapi alamat di browser tetap /nerovision (location.search kosong), jadi kode dibaca dari path.
  const pq=(location.pathname.match(/^\/([a-z0-9]+)\/?$/i)||[])[1]||"",q=new URLSearchParams(location.search).get("c")||pq,fix=window.TENANT_ID||"";let s="";try{s=localStorage.getItem("tenantId")||""}catch(e){}
  const t=String(q||fix||s).trim().toLowerCase().replace(/[^a-z0-9]/g,"");
  try{if(t)localStorage.setItem("tenantId",t)}catch(e){}
  return t;
})();
const tdb=raw=>window.DEMO_ON?raw:new Proxy(raw,{get:(t,k)=>k==="collection"?n=>t.collection("tenants").doc(TENANT||"_").collection(n):(typeof t[k]==="function"?t[k].bind(t):t[k])});
function tenantGate(msg){
  if(document.getElementById("tgate"))return;
  const d=document.createElement("div");d.id="tgate";d.style.cssText="position:fixed;inset:0;z-index:9999;background:#0f172a;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif";
  d.innerHTML=`<div style="background:#fff;border-radius:16px;padding:28px;max-width:380px;width:100%"><h2 style="margin:0 0 6px">Kode perusahaan</h2><p style="color:#64748b;margin:0 0 14px;font-size:14px">${msg||"Masukkan kode perusahaan yang diberikan penyedia layanan."}</p><input id="tgc" placeholder="contoh: k7m2xq9a" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;margin-bottom:12px"><button id="tgb" style="width:100%;padding:12px;border:0;border-radius:10px;background:#0d9488;color:#fff;font:inherit;font-weight:600;cursor:pointer">Lanjut</button></div>`;
  document.body.appendChild(d);
  const go=()=>{const v=document.getElementById("tgc").value.trim().toLowerCase().replace(/[^a-z0-9]/g,"");if(!v)return;try{localStorage.setItem("tenantId",v)}catch(e){}location.href=location.pathname+"?c="+v};
  document.getElementById("tgb").onclick=go;document.getElementById("tgc").addEventListener("keydown",e=>{if(e.key==="Enter")go()});
}

// Alias kode: Super Admin bisa memberi nama link yang mudah dibaca (mis. nerosmart) untuk pelanggan yang kodenya sudah acak.
// Alias disimpan di Firestore tenantAlias/<alias> = {id:<kode asli>}. Dipanggil app.js setelah konfigurasi Firebase siap (sekali per 12 jam per alias, hasilnya di-cache).
function tenResolve(t,cfg){
  if(window.DEMO_ON||!t||!/^[a-z0-9]+$/.test(t)||!cfg)return t;
  const K="tenAlias_"+t;let c=null;try{c=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}
  if(c&&c.id&&Date.now()-c.ts<432e5)return c.id;
  if(navigator.onLine===false)return(c&&c.id)||t;
  let id=t,ok=false;
  try{const x=new XMLHttpRequest();x.open("GET","https://firestore.googleapis.com/v1/projects/"+cfg.projectId+"/databases/(default)/documents/tenantAlias/"+t+"?key="+cfg.apiKey,false);x.send();
    if(x.status===200){const f=((JSON.parse(x.responseText)||{}).fields||{}).id;if(f&&f.stringValue){id=String(f.stringValue).toLowerCase().replace(/[^a-z0-9]/g,"")||t}ok=true}
    else if(x.status===404||x.status===403)ok=true}catch(e){}
  if(ok){try{localStorage.setItem(K,JSON.stringify({id,ts:Date.now()}))}catch(e){}}
  try{if(id)localStorage.setItem("tenantId",id)}catch(e){}
  return id;
}
