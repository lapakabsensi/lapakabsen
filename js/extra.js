// ===== Tambahan: No. WhatsApp, lock lokasi, setup akun (ganti password + rekam wajah), absen dengan verifikasi wajah =====
// Dimuat setelah ui.js dan sebelum app.js. Semua fungsi dipakai saat runtime, jadi aman memakai variabel dari app.js (ME, SET, db, $, dst).
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function addDict(o){Object.assign(DICT,o);KEYS.length=0;KEYS.push(...Object.keys(DICT).sort((a,b)=>b.length-a.length))}
addDict({
"Setup Akun":["Account Setup","账号设置"],"Lengkapi 2 langkah ini sebelum mulai absen":["Complete these 2 steps before clocking in","开始打卡前请完成以下 2 步"],
"1. Ganti password":["1. Change password","1. 修改密码"],"2. Rekam wajah":["2. Register your face","2. 录入人脸"],
"Password lama (dari admin)":["Current password (from admin)","当前密码（管理员提供）"],"Password baru (min 6)":["New password (min 6)","新密码（至少6位）"],"Ulangi password baru":["Repeat new password","重复新密码"],
"Simpan Password":["Save Password","保存密码"],"Rekam Wajah":["Record Face","录入人脸"],"Password sudah diganti":["Password changed","密码已修改"],"Wajah sudah terekam":["Face registered","人脸已录入"],
"Wajah":["Face","人脸"],"Reset wajah":["Reset face","重置人脸"],"Scan Wajah & Absen":["Scan Face & Clock","扫脸打卡"],
"No. WhatsApp":["WhatsApp number","WhatsApp 号码"],"WhatsApp":["WhatsApp","WhatsApp"],"Lokasi":["Location","位置"],
"Lock lokasi absen":["Attendance location lock","打卡位置锁定"],"Ikut lock lokasi Jadwal Kerja":["Follow Work Schedule location lock","沿用工作时间的位置锁定"],
"Lokasi khusus karyawan ini":["Custom location for this employee","该员工专用位置"],"Bebas (tanpa lock lokasi)":["Free (no location lock)","不限制位置"],
"Nonaktif (absen bebas di mana saja)":["Off (clock in anywhere)","关闭（可在任意位置打卡）"],"Aktif (wajib absen di area ini)":["On (must clock in inside this area)","开启（必须在此区域内打卡）"],
"Radius (meter)":["Radius (meters)","半径（米）"],"Pakai lokasi saya sekarang":["Use my current location","使用我当前的位置"],"Latitude":["Latitude","纬度"],"Longitude":["Longitude","经度"],
"Ikut jadwal":["Default","默认"],"Khusus":["Custom","专用"],"Bebas":["Free","不限"],"Coba lagi":["Try again","重试"],
"Terlambat":["Late","迟到"],"Pot. terlambat":["Late deduction","迟到扣款"],"Potongan terlambat":["Late deduction","迟到扣款"],"Batas terlambat tanpa potongan (kali / periode)":["Free late limit (times / period)","免扣款迟到次数（次/周期）"],"Potongan per terlambat di atas batas (Rp)":["Deduction per late above limit (Rp)","超出次数每次迟到扣款（Rp）"],"Siang":["Noon","中午"],"Sore":["Evening","傍晚"],"Absen Siang":["Clock Noon","中午打卡"],"Absen Sore":["Clock Evening","傍晚打卡"],"Mode absensi":["Attendance mode","考勤模式"],
"Otomatis (sales/teknisi = 4x)":["Auto (sales/technician = 4x)","自动（销售/技术员 = 4次）"],"2x sehari (masuk-pulang)":["2x a day (in-out)","每天2次（上下班）"],"4x sehari (masuk-siang-sore-pulang)":["4x a day (in-noon-evening-out)","每天4次（上班-中午-傍晚-下班）"],
"x absen / hari":["x clock-ins / day","次打卡 / 天"],"4x absen / hari":["4x clock-ins / day","每天4次打卡"]
});

// ---------- Mode absensi: 2x (masuk-pulang) atau 4x (masuk-siang-sore-pulang, untuk sales/teknisi lapangan) ----------
const ABSEN_OPT=["Otomatis (sales/teknisi = 4x)","2x sehari (masuk-pulang)","4x sehari (masuk-siang-sore-pulang)"];
const SL={in:"MASUK",mid:"SIANG",aft:"SORE",out:"PULANG"},SL2={in:"Masuk",mid:"Siang",aft:"Sore",out:"Pulang"};
const punchN=(u=ME)=>{const v=String(u.absenMode||"");if(v.startsWith("4"))return 4;if(v.startsWith("2"))return 2;return/sales|teknisi/i.test(u.jabatan||"")?4:2};
// langkah absen berikutnya hari ini: "in" | "mid" | "aft" | "out" | null (sudah lengkap)
function nextStep(t,n){if(!t||!t.in)return"in";if(t.out)return null;if(n===4){if(!t.mid)return"mid";if(!t.aft)return"aft"}return"out"}
const todayText=(t,all)=>{if(!t&&!all)return"Belum absen";return[["in",t&&t.in],["mid",t&&t.mid],["aft",t&&t.aft],["out",t&&t.out]].filter(p=>all||p[1]).map(p=>SL2[p[0]]+" "+(p[1]||"-")).join(" · ")};

// ---------- Terlambat & potongan gaji ----------
// Periode untuk bulan gaji PM ("YYYY-MM"). cutoff 1 = bulan kalender; cutoff 21 = 21 bulan sebelumnya s/d 20 bulan PM.
function periodOf(pm){const[y,m]=pm.split("-").map(Number),c=+SET.cutoff||1;
  return c===1?[new Date(y,m-1,1),new Date(y,m,0)]:[new Date(y,m-2,c),new Date(y,m-1,c-1)]}
const plabelOf=pm=>{const[s,e]=periodOf(pm);return`${s.getDate()} ${BLN[s.getMonth()]} - ${e.getDate()} ${BLN[e.getMonth()]}`};
// n kali terlambat -> {n, kena (yang dipotong), rp (total potongan)}; hanya kejadian di atas batas bebas yang dipotong
function lateCalc(n){const free=+SET.lateFree||0,pen=+SET.latePenalty||0,kena=Math.max(0,n-free);return{n,kena,rp:kena*pen}}
function lateBox(a){const pen=+SET.latePenalty||0;if(!pen)return"";const c=lateCalc(a.filter(x=>x.status==="abnormal").length);
  return`<div class="box">⏰ Terlambat periode ini: <b>${c.n}x</b> (batas ${+SET.lateFree||0}x bebas potongan) · ${c.kena?`terkena potongan <b>${rp(c.rp)}</b> (${c.kena}x × ${rp(pen)})`:"belum ada potongan"}</div>`}

// ---------- No. WhatsApp ----------
const normWA=s=>{let d=String(s||"").replace(/\D/g,"");if(d.startsWith("0"))d="62"+d.slice(1);else if(d.startsWith("8"))d="62"+d;return d};
const waOk=d=>/^\d{9,15}$/.test(d);

// ---------- Lock lokasi ----------
const distM=(a,b)=>{const R=6371000,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
// Aturan lokasi untuk 1 karyawan: null = bebas, selain itu {lat,lng,rad}
function geoFor(u=ME){
  const m=u.locMode||"default",n=Number.isFinite;
  if(m==="free")return null;
  if(m==="custom"&&n(u.locLat)&&n(u.locLng))return{lat:u.locLat,lng:u.locLng,rad:u.locRad||100};
  if(SET.geoOn&&n(SET.geoLat)&&n(SET.geoLng))return{lat:SET.geoLat,lng:SET.geoLng,rad:SET.geoRad||100};
  return null;
}
const locLabel=u=>u.role==="admin"?"-":u.locMode==="custom"?`Khusus (${u.locRad||100} m)`:u.locMode==="free"?"Bebas":"Ikut jadwal";
const getPos=()=>new Promise(r=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy,t:Date.now()}),()=>r(null),{enableHighAccuracy:true,timeout:10000,maximumAge:0}):r(null));
// ---- Peta pemilih lokasi (Leaflet + OpenStreetMap / Esri Satelit, tanpa API key) ----
const LF="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/";let LF_P=null;
function loadLeaflet(){
  if(LF_P)return LF_P;
  LF_P=new Promise((ok,no)=>{const c=document.createElement("link");c.rel="stylesheet";c.href=LF+"leaflet.css";document.head.appendChild(c);
    const j=document.createElement("script");j.src=LF+"leaflet.js";j.onload=ok;j.onerror=()=>{LF_P=null;no(new Error("Gagal memuat peta. Cek koneksi internet."))};document.head.appendChild(j)});
  return LF_P;
}
const geoRad=p=>Math.max(20,parseInt(document.getElementById(p+"_rad").value)||100);
function setGeo(p,la,ln,fit){
  la=+la;ln=+ln;const g=id=>document.getElementById(p+"_"+id),el=g("map"),M=el&&el._lf;
  g("lat").value=la.toFixed(6);g("lng").value=ln.toFixed(6);g("txt").textContent=`📌 Titik terpilih: ${la.toFixed(6)}, ${ln.toFixed(6)}`;
  if(!M)return;
  if(!el._mk){
    const ac=getComputedStyle(document.documentElement).getPropertyValue("--ac").trim()||"#0d9488";
    el._mk=L.marker([la,ln],{draggable:true,icon:L.divIcon({className:"",html:'<div style="font-size:32px;line-height:32px">📍</div>',iconSize:[32,32],iconAnchor:[16,30]})}).addTo(M);
    el._mk.on("dragend",()=>{const c=el._mk.getLatLng();setGeo(p,c.lat,c.lng)});
    el._ci=L.circle([la,ln],{radius:geoRad(p),color:ac,weight:2,fillColor:ac,fillOpacity:.18}).addTo(M);
  }else{el._mk.setLatLng([la,ln]);el._ci.setLatLng([la,ln])}
  el._ci.setRadius(geoRad(p));
  if(fit)M.fitBounds(el._ci.getBounds(),{maxZoom:18});
}
const geoCircle=p=>{const el=document.getElementById(p+"_map");if(el&&el._ci)el._ci.setRadius(geoRad(p))};
async function geoInit(p){
  const el=document.getElementById(p+"_map");if(!el||el.offsetParent===null)return;
  if(el._lf){el._lf.invalidateSize();return}
  if(el._busy)return;el._busy=true;
  try{await loadLeaflet()}catch(e){el._busy=false;el.innerHTML=`<p class="mut" style="padding:14px">⚠️ ${esc(e.message)}</p>`;return}
  if(!document.body.contains(el))return;
  const la=parseFloat(document.getElementById(p+"_lat").value),ln=parseFloat(document.getElementById(p+"_lng").value),has=Number.isFinite(la)&&Number.isFinite(ln);
  const M=L.map(el).setView(has?[la,ln]:[-2.5,118],has?17:5);
  const osm=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(M),
    sat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Tiles © Esri"});
  L.control.layers({"🗺️ Peta":osm,"🛰️ Satelit":sat}).addTo(M);
  el._lf=M;M.on("click",e=>setGeo(p,e.latlng.lat,e.latlng.lng));
  if(has)setGeo(p,la,ln,true);
  setTimeout(()=>M.invalidateSize(),200);
}
const geoInitAll=()=>document.querySelectorAll("[data-geo]").forEach(e=>geoInit(e.dataset.geo));
async function geoSearch(p){
  const q=document.getElementById(p+"_q").value.trim();if(!q)return toast("Ketik alamat atau nama tempat dulu");
  try{const r=await(await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(q))).json();
    if(!r.length)return toast("Tempat tidak ditemukan. Coba kata kunci lain, atau klik langsung di peta.");
    setGeo(p,r[0].lat,r[0].lon,true)}catch(e){toast("Pencarian gagal: "+e.message)}
}
// Blok form lock lokasi. p = prefix id, user=true untuk form karyawan, false untuk Jadwal Kerja.
function geoBlock(p,user,s){
  const o=user?[["default","Ikut lock lokasi Jadwal Kerja"],["custom","Lokasi khusus karyawan ini"],["free","Bebas (tanpa lock lokasi)"]]
    :[["off","Nonaktif (absen bebas di mana saja)"],["on","Aktif (wajib absen di area ini)"]];
  const on=user?"custom":"on",nv=v=>Number.isFinite(v)?v:"",has=Number.isFinite(s.lat)&&Number.isFinite(s.lng);
  const dg=SET.geoOn&&Number.isFinite(SET.geoLat)?`Default saat ini: ${SET.geoLat}, ${SET.geoLng} · radius ${SET.geoRad||100} m`:"Lock lokasi di Jadwal Kerja belum aktif";
  return `<div class="f"><label>🔒 Lock lokasi absen</label><select id="${p}_m" onchange="geoToggle('${p}')">${o.map(([v,l])=>`<option value="${v}"${v===s.mode?" selected":""}>${l}</option>`).join("")}</select>
  <div id="${p}_box" style="margin-top:10px;display:${s.mode===on?"block":"none"}">
    <div class="row" style="gap:8px;margin-bottom:8px"><input id="${p}_q" style="flex:1;min-width:0" placeholder="Cari alamat / nama tempat..." onkeydown="if(event.key==='Enter')geoSearch('${p}')"><button type="button" class="btn sm" onclick="geoSearch('${p}')">Cari</button><button type="button" class="btn ghost sm" style="white-space:nowrap" onclick="useMyLoc('${p}')">📍 Lokasi saya</button></div>
    <div id="${p}_map" data-geo="${p}" style="height:340px;border-radius:12px;border:1px solid var(--line);isolation:isolate"></div>
    <input type="hidden" id="${p}_lat" value="${nv(s.lat)}"><input type="hidden" id="${p}_lng" value="${nv(s.lng)}">
    <p class="mut" style="margin:8px 0"><small id="${p}_txt">${has?`📌 Titik terpilih: ${(+s.lat).toFixed(6)}, ${(+s.lng).toFixed(6)}`:"Belum ada titik. Cari alamat, klik peta, atau tekan Lokasi saya. Pin juga bisa digeser."}</small></p>
    <div class="f" style="max-width:260px"><label>Radius (meter)</label><input id="${p}_rad" type="number" min="20" value="${s.rad||100}" oninput="geoCircle('${p}')"></div>
  </div>${user?`<p class="mut"><small>${dg}</small></p>`:""}</div>`;
}
const geoToggle=p=>{const m=document.getElementById(p+"_m").value,on=m==="custom"||m==="on";document.getElementById(p+"_box").style.display=on?"block":"none";if(on)geoInit(p)};
async function useMyLoc(p){toast("Mencari lokasi...");const pos=await getPos();if(!pos)return toast("Lokasi tidak bisa diambil. Izinkan akses lokasi di browser.");
  setGeo(p,pos.lat,pos.lng,true);toast(`Lokasi diambil (akurasi ±${Math.round(pos.acc)} m)`)}
// Baca blok lock lokasi -> objek siap simpan, atau false kalau tidak valid
function geoRead(p,user){
  const v=id=>document.getElementById(p+"_"+id).value.trim(),mode=v("m"),need=user?mode==="custom":mode==="on";
  const lat=parseFloat(v("lat")),lng=parseFloat(v("lng")),rad=parseInt(v("rad")),ll=Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
  if(need&&!ll){toast("Pilih titik lokasi di peta dulu");return false}
  if(need&&!(rad>=20)){toast("Radius minimal 20 meter");return false}
  const o=user?{locMode:mode}:{geoOn:mode==="on"},k=user?["locLat","locLng","locRad"]:["geoLat","geoLng","geoRad"];
  if(ll){o[k[0]]=lat;o[k[1]]=lng}if(rad>=20)o[k[2]]=rad;
  return o;
}

// ---------- Pengenalan wajah (face-api.js, dimuat saat dibutuhkan) ----------
const FACE_MAX=.6,FACE_CDN="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12";
let FACE_P=null,WATCH=null,LASTPOS=null;
function loadFace(){
  if(FACE_P)return FACE_P;
  FACE_P=(async()=>{
    if(!window.faceapi)await new Promise((ok,no)=>{const s=document.createElement("script");s.src=FACE_CDN+"/dist/face-api.js";s.onload=ok;s.onerror=()=>no(new Error("Gagal memuat library wajah. Cek koneksi internet."));document.head.appendChild(s)});
    const u=FACE_CDN+"/model";
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(u),faceapi.nets.faceLandmark68Net.loadFromUri(u),faceapi.nets.faceRecognitionNet.loadFromUri(u)]);
  })().catch(e=>{FACE_P=null;throw e});
  return FACE_P;
}
async function grabFace(v){
  const r=await faceapi.detectAllFaces(v,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.4})).withFaceLandmarks().withFaceDescriptors();
  drawFace($("#ov"),r.length===1?r[0]:null,"#38e8c6",true);
  if(!r.length)return{err:"Wajah tidak terdeteksi. Hadap kamera dan pastikan cahaya cukup."};
  if(r.length>1)return{err:"Terdeteksi lebih dari 1 wajah. Pastikan hanya kamu di kamera."};
  if(r[0].detection.box.width<v.videoWidth*.16)return{err:"Wajah terlalu jauh. Dekatkan ke kamera."};
  return{desc:r[0].descriptor};
}
const euc=(a,b,o=0)=>{let s=0;for(let i=0;i<128;i++){const d=a[i]-b[o+i];s+=d*d}return Math.sqrt(s)};
// jarak terkecil antara wajah di kamera dan semua sampel wajah tersimpan milik ME (makin kecil makin mirip)
function faceDist(desc){const L=ME.faceDesc;let best=9;for(let i=0;i+128<=L.length;i+=128)best=Math.min(best,euc(desc,L,i));return best}
function snap(v,w){const c=document.createElement("canvas");c.width=w;c.height=Math.round(w*v.videoHeight/v.videoWidth);const x=c.getContext("2d");x.translate(c.width,0);x.scale(-1,1);x.drawImage(v,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.6)}
async function openCam(){
  stopCam();
  try{STREAM=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:960},height:{ideal:720}},audio:false})}catch(e){throw new Error("Kamera tidak bisa dibuka: "+e.message)}
  try{camCheck()}catch(e){stopCam();throw e}
  const v=$("#cam");if(!v){stopCam();return}v.srcObject=STREAM;
  await new Promise(r=>{if(v.videoWidth)return r();v.onloadedmetadata=()=>r()});
}
async function refreshMe(){
  const[s,p]=await Promise.all([db.collection("settings").doc("work").get(),db.collection("users").doc(ME.id).get()]);
  if(s.exists)SET={...SET,...s.data()};if(p.exists)ME={id:ME.id,...p.data()};
}


// ---------- Scanner wajah (tampilan face recognition): bingkai oval, landmark, panduan posisi, scan multi-frame ----------
const scanBox=()=>`<div class="scan" id="scan" data-s="load"><video id="cam" autoplay playsinline muted></video><canvas id="ov"></canvas><div class="oval"></div><div class="sline"></div><div class="pbar"><i id="pb"></i></div><div class="score" id="sc"></div><div class="chip" id="chip">⏳ Menyiapkan kamera…</div></div><p id="fst" class="mut" style="margin-bottom:10px;text-align:center"></p>`;
let SC=null;
function scanSet(s,msg){
  const e=$("#scan");if(e)e.dataset.s=s;const c=$("#chip");if(c&&msg!=null)c.textContent=msg;
  const sc=$("#sc");if(sc&&s!=="pass"&&s!=="fail")sc.style.display="none";
  if(s!=="scan"&&s!=="pass")scanProg(0);
}
function scanProg(p){const b=$("#pb");if(b)b.style.width=Math.round(p*100)+"%"}
function scanScore(t){const sc=$("#sc");if(sc){sc.textContent=t;sc.style.display="block"}}
const simPct=d=>Math.max(0,Math.min(99,Math.round(d<=FACE_MAX?100-30*d/FACE_MAX:70*(1-(d-FACE_MAX)/.3))));
function drawFace(cv,det,col,strong){
  if(!cv)return;const x=cv.getContext("2d");x.clearRect(0,0,cv.width,cv.height);if(!det)return;
  const b=det.detection.box,k=cv.width/480,L=Math.min(b.width,b.height)*.24;
  x.strokeStyle=col;x.fillStyle=col;x.lineWidth=3.5*k;x.lineCap="round";x.lineJoin="round";
  [[b.x,b.y,1,1],[b.x+b.width,b.y,-1,1],[b.x,b.y+b.height,1,-1],[b.x+b.width,b.y+b.height,-1,-1]].forEach(([px,py,dx,dy])=>{x.beginPath();x.moveTo(px,py+dy*L);x.lineTo(px,py);x.lineTo(px+dx*L,py);x.stroke()});
  x.globalAlpha=strong?.95:.6;
  det.landmarks.positions.forEach(p=>{x.beginPath();x.arc(p.x,p.y,(strong?2.4:1.7)*k,0,7);x.fill()});
  x.globalAlpha=1;
}
// panduan: apakah wajah sudah pas di dalam bingkai oval?
function scanGuide(ds,v){
  if(!ds.length)return{ok:false,m:"Wajah tidak terdeteksi · hadap kamera"};
  if(ds.length>1)return{ok:false,m:"Terdeteksi lebih dari 1 wajah"};
  const b=ds[0].detection.box,W=v.videoWidth,H=v.videoHeight,h=b.height/H,cx=(b.x+b.width/2)/W,cy=(b.y+b.height/2)/H;
  if(h<.2)return{ok:false,m:"Dekatkan wajah ke kamera"};
  if(h>.92)return{ok:false,m:"Mundur sedikit"};
  if(Math.abs(cx-.5)>.26||Math.abs(cy-.5)>.3)return{ok:false,m:"Pusatkan wajah di dalam bingkai"};
  return{ok:true,m:"ok"};
}
function scanStart(){scanStop();const my=SC={on:true,ok:false,arm:null,job:null,fin:null,stable:0,busy:false,armAt:0,pos:null};scanLoop(my)}
function scanStop(){if(SC){SC.on=false;SC=null}}
const scanAlive=my=>SC===my&&my.on&&document.body.contains($("#cam"));
// satu frame: deteksi + gambar overlay + hitung panduan
async function scanTick(my,lx,opt){
  const v=$("#cam"),cv=$("#ov");if(!v||!cv)return;
  const ds=await faceapi.detectAllFaces(v,opt).withFaceLandmarks();if(!scanAlive(my))return;my.ds=ds;
  lx.drawImage(v,0,0,32,24);const px=lx.getImageData(0,0,32,24).data;let s=0;for(let i=0;i<px.length;i+=4)s+=px[i]*.3+px[i+1]*.59+px[i+2]*.11;
  let g=scanGuide(ds,v);if(g.ok&&s/(px.length/4)<30)g={ok:false,m:"Cahaya kurang terang"};
  my.ok=g.ok;
  drawFace(cv,ds.length===1?ds[0]:null,my.busy?"#38e8c6":g.ok?"#22c55e":"#f59e0b",my.busy);
  if(!my.busy)scanSet(g.ok?"ok":"warn",g.ok?(my.arm?"Tahan posisi…":"✓ Posisi bagus · tekan Mulai Scan"):g.m);
}
async function scanLoop(my){
  const v=$("#cam"),cv=$("#ov");if(!v||!cv)return;
  cv.width=v.videoWidth;cv.height=v.videoHeight;$("#scan").style.aspectRatio=`${v.videoWidth}/${v.videoHeight}`;
  const lc=document.createElement("canvas");lc.width=32;lc.height=24;my.lx=lc.getContext("2d",{willReadFrequently:true});
  my.opt=new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.4});
  while(scanAlive(my)){
    const t0=performance.now();
    try{
      await scanTick(my,my.lx,my.opt);if(!scanAlive(my))break;
      if(my.arm){
        my.stable=my.ok?my.stable+1:0;
        if(Date.now()-my.armAt>25000){my.arm=null;scanSet("warn","Waktu habis · coba lagi");toast("Wajah tidak terposisi dengan baik, coba lagi");if(my.fin)my.fin()}
        else if(my.stable>=1){my.arm=null;my.stable=0;my.busy=true;try{await captureJob(my)}finally{my.busy=false}}
      }else if(my.job){const j=my.job;my.job=null;my.busy=true;try{await j()}finally{my.busy=false}}
    }catch(e){}
    await sleep(Math.max(10,60-(performance.now()-t0)));
  }
}
// tunggu sambil tetap menggambar overlay (dipanggil dari dalam job)
async function scanWait(ms){const my=SC,t=Date.now()+ms;while(my&&scanAlive(my)&&Date.now()<t){try{await scanTick(my,my.lx,my.opt)}catch(e){}await sleep(60)}}
// ---------- Verifikasi gerakan nyata (anti foto / video / kamera virtual) ----------
// Sebelum wajah dicocokkan, karyawan diminta menoleh ke arah ACAK (kiri/kanan) lalu kembali menghadap depan. Foto atau video rekaman
// tidak bisa menebak arahnya. Admin bisa mematikannya di Jadwal Kerja (SET.liveOff). Catatan: ini dikerjakan di browser/APK,
// jadi hanya menahan kamera virtual dan foto di aplikasi ASLI; APK yang sudah dimodifikasi tetap bisa melewatinya.
const VCAM=/virtual|\bobs\b|manycam|droidcam|iriun|epoccam|xsplit|snap ?camera|vcam|fake|loopback|splitcam|youcam|mmhmm|streamlabs|screen ?(cap|shar)/i;
function camCheck(){
  const t=STREAM&&STREAM.getVideoTracks&&STREAM.getVideoTracks()[0];if(!t||SET.liveOff)return;
  const l=t.label||"";if(VCAM.test(l))throw new Error(`Kamera virtual terdeteksi (${l}). Gunakan kamera depan bawaan HP.`);
}
// posisi hidung di antara tepi rahang kiri-kanan pada gambar kamera asli (tidak dicerminkan): ~0.5 = menghadap lurus
const lmYaw=p=>{const a=p[0].x,w=p[16].x-a;return w>0?(p[30].x-a)/w:.5};
async function liveCheck(my){
  if(SET.liveOff||window.DEMO_ON)return true;
  const v=$("#cam"),c=document.createElement("canvas");c.width=48;c.height=36;const x=c.getContext("2d",{willReadFrequently:true});
  let prev=null,dsum=0,dn=0;
  const read=()=>{x.drawImage(v,0,0,48,36);const d=x.getImageData(0,0,48,36).data,g=new Float32Array(1728);
    for(let i=0,j=0;i<d.length;i+=4,j++)g[j]=d[i]*.3+d[i+1]*.59+d[i+2]*.11;
    if(prev){let s=0;for(let j=0;j<g.length;j++)s+=Math.abs(g[j]-prev[j]);dsum+=s/g.length;dn++}prev=g};
  const yaw=()=>{const f=my.ds&&my.ds.length===1?my.ds[0]:null;return f?lmYaw(f.landmarks.positions):null};
  const step=async()=>{await scanTick(my,my.lx,my.opt);read();return yaw()};
  // 1) pose awal: menghadap depan (sekaligus memastikan gambar kamera benar-benar bergerak/hidup)
  scanSet("scan","Hadap lurus ke kamera");scanProg(.1);
  const base=[];for(let t=Date.now()+1400;scanAlive(my)&&Date.now()<t;){const y=await step();if(y!=null)base.push(y);await sleep(40)}
  if(!scanAlive(my))return"Dibatalkan";
  if(base.length<4)return"Wajah tidak terdeteksi. Hadap kamera dan pastikan cahaya cukup.";
  if(dn>=8&&dsum/dn<.12)return"Gambar kamera tidak bergerak seperti foto. Gunakan kamera depan asli.";
  base.sort((a,b)=>a-b);const b0=base[base.length>>1];
  // 2) tantangan acak. Pada gambar asli, menoleh ke kanan (sisi kanan pengguna) menggeser hidung ke kiri gambar => nilai turun.
  const turn=Math.random()<.5?"kanan":"kiri",sg=turn==="kanan"?-1:1;
  scanSet("scan",`Toleh ke ${turn}, lalu kembali ke depan`);scanProg(.3);
  let moved=false,back=false;
  for(let t=Date.now()+7000;scanAlive(my)&&Date.now()<t&&!back;){
    const y=await step();
    if(y!=null){if(!moved&&(y-b0)*sg>=.09){moved=true;scanProg(.6)}else if(moved&&Math.abs(y-b0)<=.05)back=true}
    await sleep(30);
  }
  if(!scanAlive(my))return"Dibatalkan";
  if(!moved)return`Gerakan "toleh ke ${turn}" tidak terdeteksi. Ulangi dan toleh pelan ke arah ${turn} badanmu.`;
  if(!back)return"Setelah menoleh, hadap lurus kembali ke kamera.";
  scanProg(.8);return true;
}
// ambil sampel wajah, berhenti begitu ada yang cocok dengan data terdaftar (biasanya cukup 1 sampel); maksimal 3 percobaan
const errMsg=e=>e&&(e.code==="permission-denied"||/missing or insufficient permissions/i.test(e.message||""))?"Absen ditolak server. Kemungkinan: (1) jam HP tidak sesuai waktu server (selisih maks. 3 menit) → setel jam & zona waktu HP ke otomatis; (2) firestore.rules terbaru belum dipublikasikan (admin: Firebase Console → Firestore → Rules).":(e&&e.message)||String(e);
async function captureJob(my){
  const v=$("#cam");let tries=0,err="",best=9;
  const fail=async m=>{scanSet("fail","✗ "+m);toast(m);await sleep(1500);if(scanAlive(my)&&my.fin)my.fin()};
  const lv=await liveCheck(my);if(lv!==true){if(scanAlive(my))await fail(lv);return}
  scanSet("scan","Memindai wajah…");scanProg(.3);
  while(tries<3&&scanAlive(my)){
    tries++;const r=await grabFace(v);
    if(!r.desc){err=r.err;continue}
    const d=faceDist(r.desc);best=Math.min(best,d);scanProg(.3+tries*.2);
    if(d<=FACE_MAX){
      const pct=simPct(d),photo=snap(v,320);
      scanSet("pass",`✓ Dikenali · ${ME.name}`);scanProg(1);scanScore(`Kecocokan ${pct}%`);
      await sleep(120);if(!scanAlive(my))return;
      try{await(my.onPass?my.onPass(photo,+d.toFixed(2),pct):punch(photo,my.pos?`${my.pos.lat.toFixed(5)},${my.pos.lng.toFixed(5)}`:"",+d.toFixed(2)))}
      catch(e){const m=errMsg(e);toast(m);scanSet("fail","✗ "+m.slice(0,60));await sleep(1800);if(scanAlive(my)&&my.fin)my.fin()}
      return;
    }
  }
  if(!scanAlive(my))return;
  if(best>=9)return fail(err||"Wajah tidak terdeteksi, coba lagi");
  const pct=simPct(best);scanScore(`Kecocokan ${pct}%`);
  return fail(`Wajah tidak cocok dengan data terdaftar (${pct}%). Coba lagi dengan cahaya lebih terang.`);
}

// ---------- Setup akun karyawan (ganti password + rekam wajah) ----------
const needSetup=()=>!!ME&&!ADMIN()&&(!ME.pwDone||!(ME.faceDesc&&ME.faceDesc.length>=128));
async function setupView(){
  const pwOk=!!ME.pwDone||ADMIN(),faceOk=!!(ME.faceDesc&&ME.faceDesc.length>=128);
  if(!faceOk)AFTER=startEnroll;
  return head(ADMIN()?"Rekam Wajah":"Setup Akun",ADMIN()?"Rekam wajahmu dulu supaya bisa absen":"Lengkapi 2 langkah ini sebelum mulai absen")
  +(ADMIN()?"":`<div class="box"><h3>1. Ganti password ${pwOk?"✅":""}</h3>`+(pwOk?`<p class="mut">Password sudah diganti</p>`
    :`<div class="fg">${fld("sp_old","Kode / password lama (dari admin)","password")}${fld("sp_new","Password baru (min 6)","password")}${fld("sp_new2","Ulangi password baru","password")}</div><button class="btn" onclick="savePw()">Simpan Password</button>`)+`</div>`)
  +`<div class="box"><h3>${ADMIN()?"":"2. "}Rekam wajah ${faceOk?"✅":""}</h3>`+(faceOk?`<p class="mut">Wajah sudah terekam</p>`
    :`<p class="mut" style="margin-bottom:10px">Wajah ini disimpan sebagai data pembanding saat absen. Pastikan wajah terlihat jelas, cahaya cukup, tanpa masker atau kacamata hitam.</p>${scanBox()}<button class="btn" id="bEnroll" disabled onclick="enrollFace()">📸 Rekam Wajah</button>`)+`</div>`;
}
function afterSetup(){
  if(needSetup()){toast("Tersimpan ✅ Lanjutkan langkah yang tersisa");render();return}
  toast("Setup selesai, selamat bekerja! 🎉");stopCam();buildNav();go(ADMIN()?"myhome":"home");
}
async function savePw(){
  const o=$("#sp_old").value,n=$("#sp_new").value,n2=$("#sp_new2").value,u=auth.currentUser;
  if(!o)return toast("Isi password lama");
  if(n.length<6)return toast("Password baru minimal 6 karakter");
  if(n!==n2)return toast("Ulangi password baru tidak sama");
  if(n===o)return toast("Password baru harus berbeda dari yang lama");
  try{await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,o));await u.updatePassword(n)}
  catch(e){return toast(["auth/wrong-password","auth/invalid-credential"].includes(e.code)?"Password lama salah":e.message)}
  await credSync(n,ME.id,u.email,"self");await db.collection("users").doc(ME.id).update({pwDone:true});ME.pwDone=true;afterSetup();
}
async function startEnroll(){
  const b=$("#bEnroll"),st=m=>{const e=$("#fst");if(e)e.textContent=m};
  st("⏳ Menyiapkan kamera & model wajah (pertama kali bisa beberapa detik)...");scanSet("load","Menyiapkan kamera…");
  try{await Promise.all([loadFace(),openCam()]);if(view!=="setup")return stopCam()}
  catch(e){st("⚠️ "+e.message);toast(e.message);if(b){b.textContent="Coba lagi";b.disabled=false;b.onclick=()=>render()}return}
  st("Siap. Klik Rekam Wajah, lalu ikuti instruksi di layar.");scanStart();b.disabled=false;
}
function enrollFace(){
  if(!SC||!$("#cam").videoWidth)return toast("Kamera belum siap");
  $("#bEnroll").disabled=true;SC.job=enrollJob;
}
async function enrollJob(){
  const v=$("#cam"),b=$("#bEnroll"),st=m=>{const e=$("#fst");if(e)e.textContent=m};
  const steps=["Hadap lurus ke kamera","Tersenyum","Miringkan kepala sedikit"],S=[];let photo="";
  try{
    const lv=await liveCheck(SC);if(lv!==true)throw new Error(lv);
    for(let k=0;k<steps.length;k++){
      scanSet("scan",`(${k+1}/${steps.length}) ${steps[k]}`);scanProg(k/steps.length);st(`(${k+1}/${steps.length}) ${steps[k]}...`);await scanWait(1800);
      let r;for(let i=0;i<5;i++){r=await grabFace(v);if(r.desc)break;await scanWait(500)}
      if(!r.desc)throw new Error(r.err);
      S.push(r.desc);if(!photo)photo=snap(v,240);
    }
    for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++)if(euc(S[i],S[j])>.5)throw new Error("Sampel wajah tidak konsisten. Ulangi dengan posisi stabil dan cahaya cukup.");
    const flat=S.flatMap(d=>Array.from(d,x=>+x.toFixed(4)));
    const fp=await savePhoto(photo,`face_${Date.now()}.jpg`);await db.collection("users").doc(ME.id).update({faceDesc:flat,facePhoto:fp,faceAt:Date.now()});
    ME.faceDesc=flat;ME.facePhoto=fp;scanSet("pass","✓ Wajah terekam");scanProg(1);await sleep(900);afterSetup();
  }catch(e){scanSet("fail","✗ "+e.message);toast(e.message);st("⚠️ "+e.message);if(b)b.disabled=false;await sleep(1800)}
}
async function resetFace(id){
  if(!await uiConfirm("Hapus data wajah karyawan ini? Dia wajib rekam wajah ulang saat login berikutnya."))return;
  const D=firebase.firestore.FieldValue.delete();
  await db.collection("users").doc(id).update({faceDesc:D,facePhoto:D,faceAt:D});toast("Data wajah direset");render();
}

// ---------- Absen: cek lokasi + cocokkan wajah ----------
function paintGeo(){
  const el=$("#loc"),p=LASTPOS;if(!el||!p)return;
  const g=geoFor(),acc=` · ±${Math.round(p.acc)} m`;
  if(!g){el.textContent=`📍 ${p.lat.toFixed(5)},${p.lng.toFixed(5)}${acc}`;return}
  const d=Math.round(distM(p,g));
  el.textContent=d<=g.rad?`✅ Dalam area absen (${d} m dari titik)${acc}`:`❌ Di luar area absen (${d} m, maksimal ${g.rad} m)${acc}`;
}
function startGeo(){
  const el=$("#loc");LASTPOS=null;
  if(!navigator.geolocation){if(el)el.textContent="📍 Browser tidak mendukung lokasi";return}
  WATCH=navigator.geolocation.watchPosition(p=>{LASTPOS={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy,t:Date.now()};paintGeo()},
    ()=>{if(el)el.textContent="📍 Lokasi tidak tersedia. Aktifkan GPS & izinkan akses lokasi."},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
}
async function startCam(){
  const b=$("#snap"),st=m=>{const e=$("#fst");if(e)e.textContent=m};
  st("⏳ Menyiapkan kamera & pengenalan wajah...");scanSet("load","Menyiapkan kamera…");
  try{await refreshMe();if(needSetup())return go("setup");await Promise.all([loadFace(),openCam()]);if(view!=="rekam")return stopCam()}
  catch(e){st("⚠️ "+e.message);toast(e.message);if(b){b.textContent="Coba lagi";b.disabled=false;b.onclick=()=>render()}return}
  startGeo();st("");scanStart();b.disabled=false;b.onclick=startScan;
}
// tombol Mulai Scan: cek lokasi dulu, lalu scanner menunggu wajah pas di bingkai dan memindai otomatis
async function startScan(){
  const b=$("#snap"),st=m=>{const e=$("#fst");if(e)e.textContent=m};
  if(!SC||!$("#cam").videoWidth)return toast("Kamera belum siap");
  b.disabled=true;st("");
  try{
    await refreshMe();if(needSetup())return go("setup");
    const g=geoFor();let pos=LASTPOS;
    if(g){
      if(!pos||Date.now()-pos.t>30000)pos=await getPos();
      if(!pos)throw new Error("Lokasi tidak terdeteksi. Aktifkan GPS & izinkan akses lokasi.");
      const d=Math.round(distM(pos,g));
      if(d>g.rad){fieldChoice(d,g,pos);return}
    }
    const my=SC;my.pos=pos;my.stable=0;my.armAt=Date.now();my.fin=()=>{b.disabled=false;b.textContent="🔄 Scan ulang"};my.arm=true;
    scanSet("warn","Posisikan wajah di dalam bingkai");
  }catch(e){toast(e.message);st("⚠️ "+e.message);b.disabled=false}
}
async function punch(photo,loc,dist){
  const now=new Date(),dtz=-now.getTimezoneOffset()/60,ctz=Number.isFinite(+SET.tz)?+SET.tz:7,ts=()=>firebase.firestore.FieldValue.serverTimestamp();
  if(dtz!==ctz)throw new Error(`Zona waktu HP (UTC${dtz>=0?"+":""}${dtz}) berbeda dengan zona waktu perusahaan (UTC${ctz>=0?"+":""}${ctz}). Setel zona waktu HP ke otomatis, lalu coba lagi.`);
  await schLoad(true); // jadwal shift terbaru (aturan server memakai jadwal yang sama untuk menilai terlambat)
  let ref=db.collection("attendance").doc(`${ME.id}_${ymd(now)}`);const s=await ref.get().catch(()=>null);let t=s&&s.exists?s.data():null;
  if(!t){const o=await openRec([]);if(o){t=o;ref=db.collection("attendance").doc(`${ME.id}_${o.date}`)}} // shift malam: absen pulang masuk ke dokumen kemarin
  const n=punchN(),step=nextStep(t,n),sh=shift();
  if(!step)throw new Error("Semua absen hari ini sudah tercatat");
  const pth=await savePhoto(photo,`att_${ref.id.slice(ME.id.length+1)}_${step}.jpg`); // foto ke Firebase Storage, dokumen hanya menyimpan path
  if(step==="in")await ref.set({uid:ME.id,date:ymd(now),in:hm(now),out:null,...(n===4?{mid:null,aft:null}:{}),inLoc:loc,inPhoto:pth,inDist:dist,inAt:ts(),status:mn(hm(now))>mn(sh.in)+sh.tol?"abnormal":"normal"},{merge:true});
  else await ref.update({[step]:hm(now),[step+"Loc"]:loc,[step+"Photo"]:pth,[step+"Dist"]:dist,[step+"At"]:ts()});
  toast(`Absen ${SL2[step].toLowerCase()} tercatat`);go("home");
}
