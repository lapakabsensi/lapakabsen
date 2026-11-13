// Service worker sederhana: aplikasi tetap bisa dibuka (tampilan) saat sinyal lemah. Data Firebase tidak di-cache.
const V="absensi-v80",FC="absensi-face",SHELL=["./","index.html","css/style.css","js/demo.js","js/password.js","js/lupa.js","js/demo-ui.js","js/ui.js","js/i18n2.js","js/dialog.js","js/extra.js","js/org.js","js/features.js","js/cuti.js","js/shift.js","js/pelanggan.js","js/tenant.js","js/app.js","js/auditabsen.js","js/license.js","js/payroll.js","js/rekapx.js","js/gajix.js","js/pajak.js","js/saldo.js","js/tabel.js","js/todo.js","js/kosong.js","js/dash.js","js/field.js","js/storage.js","js/pdf.js","js/cetak.js","js/licpdf.js","js/cmdk.js","js/search.js","js/place.js","js/audit.js","js/pwa.js","manifest.json","icons/icon-512.png","img/logo.svg","icons/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==FC).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET")return;
  // library + model pengenalan wajah (±7 MB): cache-first supaya scan siap cepat setelah pemakaian pertama
  if(u.hostname==="cdn.jsdelivr.net"&&u.pathname.startsWith("/npm/@vladmandic/face-api@")){
    e.respondWith(caches.open(FC).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}))));return;
  }
  if(u.origin!==location.origin)return;
  // network-first untuk file aplikasi sendiri (selalu dapat versi terbaru), cache sebagai cadangan offline
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match("index.html"))));
});
