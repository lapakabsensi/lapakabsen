// ===== Nama lokasi dari koordinat (reverse geocoding OpenStreetMap Nominatim, gratis tanpa API key) =====
// Koordinat absen tetap disimpan apa adanya; nama jalan/daerahnya dicari saat ditampilkan, lalu disimpan di cache browser
// (dibulatkan ±11 m) supaya buka ulang langsung muncul dan tidak membebani layanan (maks 1 permintaan / detik, diantrekan).
// Tampilan: placeInline(loc) = satu baris ringkas, placeBlock(loc,extra) = nama besar + koordinat kecil + link peta (untuk dialog).
// Elemen .pl[data-ll] yang muncul di halaman diisi otomatis oleh MutationObserver di bawah.
const PL_LS="geoNameV1";let PL_C=null,PL_Q=Promise.resolve();const PL_P={};
const plLang=()=>typeof LANG!=="undefined"&&(LANG==="en"||LANG==="zh")?LANG:"id";
const plTx=k=>({
  wait:{id:"Mencari nama lokasi…",en:"Finding place name…",zh:"正在查找地点名称…"},
  none:{id:"Nama lokasi tidak tersedia",en:"Place name unavailable",zh:"无法获取地点名称"},
  open:{id:"Buka di Google Maps",en:"Open in Google Maps",zh:"在 Google 地图中打开"}}[k][plLang()]);
const plCache=()=>{if(!PL_C){try{PL_C=JSON.parse(localStorage.getItem(PL_LS)||"{}")}catch(e){PL_C={}}}return PL_C};
const plSave=()=>{try{const k=Object.keys(PL_C);if(k.length>400)k.slice(0,k.length-300).forEach(x=>delete PL_C[x]);localStorage.setItem(PL_LS,JSON.stringify(PL_C))}catch(e){}};
const plKey=(la,ln)=>plLang()+"|"+(+la).toFixed(4)+","+(+ln).toFixed(4);

// susun nama yang enak dibaca dari jawaban Nominatim: [nama gedung], jalan + no, kelurahan, kecamatan, kota
function placeName(j){
  if(!j||j.error)return"";
  const a=j.address||{},road=[a.road||a.pedestrian||a.footway||a.path,a.house_number].filter(Boolean).join(" "),
    same=[a.road,a.suburb,a.village,a.neighbourhood,a.city,a.town,a.city_district,a.county].filter(Boolean),
    poi=j.name&&!same.includes(j.name)?j.name:"",
    seen={},parts=[poi,road,a.suburb||a.village||a.neighbourhood,a.city_district||a.county||a.municipality,a.city||a.town||a.regency||a.state_district]
      .filter(x=>{if(!x)return false;const k=x.toLowerCase();if(seen[k])return false;seen[k]=1;return true});
  return parts.length?parts.join(", "):String(j.display_name||"").split(",").slice(0,3).map(s=>s.trim()).filter(Boolean).join(", ");
}
async function plFetch(la,ln){
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=${plLang()}&lat=${la}&lon=${ln}`,{signal:ctl.signal});
    if(!r.ok)throw new Error("HTTP "+r.status);return placeName(await r.json())}
  finally{clearTimeout(t)}
}
// -> nama lokasi ("" kalau gagal). Hasil bagus disimpan di cache; kegagalan tidak disimpan supaya dicoba lagi lain kali.
function geoName(la,ln){
  const C=plCache(),k=plKey(la,ln);
  if(C[k])return Promise.resolve(C[k]);
  if(PL_P[k])return PL_P[k];
  const p=PL_P[k]=PL_Q=PL_Q.then(async()=>{let n="";try{n=await plFetch(la,ln);if(n){C[k]=n;plSave()}}catch(e){}await new Promise(r=>setTimeout(r,1100));return n});
  p.then(()=>{delete PL_P[k]});return p;
}

// ---------- HTML ----------
const plLL=x=>{if(x&&typeof x==="object")x=`${(+x.lat).toFixed(5)},${(+x.lng).toFixed(5)}`;const s=String(x||"").replace(/\s/g,"");return/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(s)?s:""};
const plMap=ll=>`https://www.google.com/maps?q=${encodeURIComponent(ll)}`;
const placeInline=x=>{const ll=plLL(x);if(!ll)return x?`<span class="cal-loc">📍 ${esc(typeof x==="object"?"":x)}</span>`:"";
  return`<a class="cal-loc pl" data-ll="${ll}" data-mode="inline" target="_blank" rel="noopener" href="${plMap(ll)}" title="${ll}">📍 <span class="pl-n">${ll}</span></a>`};
const placeBlock=(x,extra)=>{const ll=plLL(x);if(!ll)return x?`<p class="mut">📍 ${esc(typeof x==="object"?"":x)}</p>`:"";
  return`<div class="pl-b"><div class="pl pl-l" data-ll="${ll}" data-mode="block">📍 <b class="pl-n mut">${plTx("wait")}</b></div><small class="mut">${ll}${extra?" · "+extra:""} · <a target="_blank" rel="noopener" href="${plMap(ll)}">${plTx("open")}</a></small></div>`};

function placeFill(root){
  const L=[...(root.querySelectorAll?root.querySelectorAll(".pl[data-ll]"):[])];if(root.matches&&root.matches(".pl[data-ll]"))L.push(root);
  L.forEach(el=>{
    if(el.dataset.pl)return;el.dataset.pl="1";const[la,ln]=el.dataset.ll.split(",");
    geoName(la,ln).then(n=>{
      if(!document.body.contains(el))return;const t=el.querySelector(".pl-n");
      if(n){t.textContent=n;t.classList.remove("mut");el.classList.add("ok");el.title=n+" ("+el.dataset.ll+")"}
      else if(el.dataset.mode==="block")t.textContent=plTx("none");
    });
  });
}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)placeFill(n)}))).observe(document.body,{childList:true,subtree:true});
placeFill(document.body);
