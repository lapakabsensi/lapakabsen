// ===== Absensi Lapangan: absen dari luar area lock lokasi =====
// Alur: klik jam Masuk/Pulang -> di luar jangkauan -> Absensi Lapangan -> scan wajah -> Next (baca lokasi terkini) -> Next (kirim)
// -> pengajuan masuk ke alur persetujuan Atasan -> HR (koleksi "requests", type "lapangan"). Setelah HR/admin menyetujui, absen tercatat di "attendance".
// Dimuat setelah app.js dan dash.js.
addDict({
"Absensi Lapangan":["Field Attendance","外勤打卡"],"Kembali ke Beranda":["Back to Home","返回首页"],"Pengajuan terkirim":["Request sent","已提交"],
"Keterangan (opsional)":["Note (optional)","备注（可选）"],"Baca ulang lokasi":["Read location again","重新定位"],"Lokasi terbaca":["Location detected","已获取位置"],
"Wajah dikenali":["Face recognized","人脸已识别"],"Menunggu persetujuan":["Waiting for approval","等待审批"]
});
FORMS.lapangan=["Absensi Lapangan",[["slotLbl","Absen"],["tgl","Tanggal"],["jam","Jam"],["ket","Keterangan"]]];
let FLD=null,ABSEN_BUSY=false;

// Dipanggil saat karyawan klik kotak jam Masuk / Pulang di Beranda.
// Kalau ada lock lokasi dan posisi saat ini di luar radius -> langsung diarahkan ke Absensi Lapangan, selain itu ke layar scan biasa.
async function absenGo(){
  if(ABSEN_BUSY)return;
  if(needSetup())return go("setup");
  if(ADMIN()&&!(ME.faceDesc&&ME.faceDesc.length>=128)){toast("Rekam wajah dulu untuk bisa absen");return go("setup")}
  const g=geoFor();
  if(!g||!navigator.geolocation)return go("rekam");
  ABSEN_BUSY=true;toast("📍 Memeriksa lokasi…");
  try{
    const pos=await getPos();
    if(pos&&distM(pos,g)>g.rad){fieldChoice(Math.round(distM(pos,g)),g,pos);return}
  }finally{ABSEN_BUSY=false}
  go("rekam");
}

// Pilihan yang langsung muncul saat terdeteksi di luar jangkauan lokasi absen
function fieldChoice(d,g,pos){
  if(pos)LASTPOS={...pos,t:Date.now()};stopCam();clearTimeout(toast.h);$("#toast").style.display="none";
  const o=document.createElement("div");o.className="zoom absd";
  o.innerHTML=`<div class="box absd-c" onclick="event.stopPropagation()" style="text-align:center"><div style="font-size:42px">📍</div><h3 style="margin:6px 0">${dsL("Kamu di luar area absen","You are outside the clock-in area","你不在打卡范围内")}</h3>
  <p class="mut" style="margin-bottom:14px">${d} m ${dsL("dari titik absen (maksimal","from the clock-in point (max","距离打卡点（最大")} ${g.rad} m).<br>${dsL("Kamu bisa mengajukan absen lapangan: scan wajah, lalu ajukan dan tunggu persetujuan atasan & HR.","You can request a field attendance: scan your face, submit, then wait for approval.","可申请外勤打卡：人脸识别后提交，等待审批。")}</p>
  <button class="btn" style="width:100%;margin-bottom:8px" onclick="this.closest('.absd').remove();go('lapangan')">🧭 ${dsL("Absen Lapangan","Field Attendance","外勤打卡")}</button>
  <button class="btn ghost" style="width:100%" onclick="this.closest('.absd').remove();if(view!=='home')go('home')">${dsL("Batal","Cancel","取消")}</button></div>`;
  o.onclick=()=>o.remove();document.body.appendChild(o);tr(o);
}

// ---------- Tampilan di halaman persetujuan & beranda ----------
function photoZoom(src){const d=document.createElement("div");d.className="zoom";d.onclick=()=>d.remove();d.innerHTML=`<img src="${src}" alt="">`;document.body.appendChild(d)}
const fieldInfo=r=>r.type!=="lapangan"?"":`<div class="fph" style="margin-top:8px">${r.photo?`<img src="${phSrc(r.photo)}"${phAttr(r.photo)} alt="" onclick="photoZoom(this.src)" style="cursor:zoom-in">`:""}<div>${placeBlock(r.lat+","+r.lng)}<small class="mut">${r.jarak!=null?`${r.jarak} m dari titik absen (maks ${r.rad} m) · `:""}akurasi ±${r.acc||"?"} m${r.faceDist!=null?` · wajah cocok ${simPct(r.faceDist)}%`:""}</small></div></div>`;
async function fieldBanner(){
  try{
    const l=(await get("requests","uid",ME.id)).filter(r=>r.type==="lapangan"&&r.tgl===ymd(new Date())&&r.status!=="disetujui");
    if(!l.length)return"";
    const note=r=>{const x=(r.log||[]).slice(-1)[0];return x&&x.note?`: ${esc(x.note)}`:""};
    return`<div class="box" onclick="go('lapangan')" style="cursor:pointer">${l.map(r=>r.status==="menunggu"?`⏳ Absen lapangan <b>${esc(r.slotLbl)}</b> (${esc(r.jam)}) menunggu persetujuan`:`❌ Absen lapangan <b>${esc(r.slotLbl)}</b> (${esc(r.jam)}) ditolak${note(r)}`).join("<br>")}</div>`;
  }catch(e){return""}
}

// ---------- Saat disetujui (persetujuan terakhir): tulis ke absensi ----------
async function applyField(r){
  const u=(await db.collection("users").doc(r.uid).get()).data()||{},sh=await shiftFor(r.uid,u,r.tgl),n=punchN(u),slot=r.slot,
    ref=db.collection("attendance").doc(`${r.uid}_${r.tgl}`),s=await ref.get(),t=s.exists?s.data():null;
  if(t&&t[slot])return;                      // sudah terisi (mis. sudah absen normal), jangan ditimpa
  const loc=`${(+r.lat).toFixed(5)},${(+r.lng).toFixed(5)}`;
  if(slot==="in")await ref.set({uid:r.uid,date:r.tgl,in:r.jam,out:null,...(n===4?{mid:null,aft:null}:{}),inLoc:loc,inPhoto:r.photo||"",inDist:r.faceDist??null,inField:true,
    status:mn(r.jam)>mn(sh.in)+sh.tol?"abnormal":"normal"},{merge:true});
  else{
    if(!t||!t.in)throw new Error("Absen masuk karyawan ini belum tercatat, tidak bisa menyetujui absen "+r.slotLbl);
    await ref.set({[slot]:r.jam,[slot+"Loc"]:loc,[slot+"Photo"]:r.photo||"",[slot+"Dist"]:r.faceDist??null,[slot+"Field"]:true},{merge:true});
  }
}

// ---------- Halaman Absensi Lapangan (karyawan) ----------
async function lapanganView(){
  await refreshMe();
  const today=ymd(new Date()),n=punchN(),
    [s,all]=await Promise.all([db.collection("attendance").doc(`${ME.id}_${today}`).get().catch(()=>null),get("requests","uid",ME.id)]),
    t=s&&s.exists?s.data():null,st=nextStep(t,n),mine=all.filter(r=>r.type==="lapangan").sort((a,b)=>b.createdAt-a.createdAt),
    pend=mine.find(r=>r.status==="menunggu"&&r.tgl===today&&r.slot===st);
  FLD={slot:st,step:1,pos:LASTPOS&&Date.now()-(LASTPOS.t||0)<300000?LASTPOS:null};
  let body;
  if(!st)body=`<div class="box"><p>✅ Semua absen hari ini (${n}x) sudah tercatat.</p></div>`;
  else if(pend)body=`<div class="box"><h3>⏳ Menunggu persetujuan</h3><p>Absen <b>${esc(SL2[st])}</b> jam <b>${esc(pend.jam)}</b> sudah dikirim.</p><small class="mut" style="display:block;margin-top:6px">${chainBar(pend)}</small></div>`;
  else{body=`<div class="box" id="fbox"></div>`;AFTER=fieldPaint}
  const hist=mine.slice(0,10).map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row"><span><b>${esc(r.slotLbl)}</b> · ${esc(r.tgl)} ${esc(r.jam)}${r.jarak!=null?` <small class="mut">· ${r.jarak} m dari titik</small>`:""}</span>${reqStatus(r)}</div><small class="mut" style="display:block">${chainBar(r)}</small>${logLines(r)}</div>`).join("");
  return head("Absensi Lapangan",st?"Absen "+SL2[st]:"")+`<div class="box mut">Kamu berada di luar area absen. Absen dari lokasi ini perlu persetujuan atasan dan HR: <b>scan wajah → Ajukan</b>. Statusnya ("menunggu approval") bisa dilihat di menu Absensi.</div>`+flowBox()+body
    +`<div class="box"><h3>Riwayat absensi lapangan</h3>${hist||emptyBox("📍","Belum ada absen lapangan","Absen dari luar area akan tercatat di sini.")}</div>`;
}
function fieldPaint(){
  const b=$("#fbox");if(!b||!FLD)return;const F=FLD,lbl=SL2[F.slot];
  if(F.step===1){
    b.innerHTML=`<h3>1. Scan wajah · Absen ${lbl}</h3><p class="mut" style="margin-bottom:10px">Wajahmu dicocokkan dengan data yang terdaftar.</p>${scanBox()}<div style="text-align:center"><button class="btn" id="snap" disabled>📸 Mulai Scan Wajah</button></div>`;
    tr(b);fieldCam();return;
  }
  if(F.step===2){
    b.innerHTML=`<h3>2. Wajah dikenali ✅</h3><div class="fph"><img src="${F.photo}" alt=""><div><b>${esc(ME.name)}</b><br><span class="mut">Kecocokan ${F.pct}%</span></div></div><p class="mut" style="margin:12px 0">Tekan <b>Next</b> untuk membaca lokasi kamu saat ini.</p><button class="btn" id="fNext" onclick="fieldLoc('fNext')">Next ›</button>`;
    tr(b);return;
  }
  if(F.step===3){
    const g=geoFor(),p=F.pos,d=g?Math.round(distM(p,g)):null,a=ME.atasanName,h=ME.hrName;
    b.innerHTML=`<h3>2. Wajah dikenali ✅ · Ajukan absen lapangan</h3><div class="fph" style="margin-bottom:12px"><img src="${F.photo}" alt=""><div><b>${esc(ME.name)}</b><br><span class="mut">Kecocokan ${F.pct}%</span></div></div><p class="mut" style="margin-bottom:6px">📍 Lokasi terbaca</p><div id="fmap" style="height:220px;border-radius:12px;border:1px solid var(--line);isolation:isolate;margin-bottom:10px"></div>
    ${placeBlock(p.lat.toFixed(6)+","+p.lng.toFixed(6),"akurasi ±"+Math.round(p.acc)+" m")}${d!=null?`<p class="mut">${d} m dari titik absen (maksimal ${g.rad} m)</p>`:""}
    <div class="f" style="margin-top:10px"><label>Keterangan (opsional)</label><textarea id="fKet" rows="2" placeholder="Mis. kunjungan ke klien, service di lokasi pelanggan"></textarea></div>
    <p class="mut" style="margin:8px 0">Setelah dikirim, absen ${lbl} jam ${hm(new Date())} menunggu persetujuan: Atasan${a?` (${esc(a)})`:""} → HR${h?` (${esc(h)})`:""}.</p>
    <button class="btn" id="fSend" onclick="fieldSend()">📨 Ajukan</button> <button class="btn ghost" id="fRe" onclick="fieldLoc('fRe')">↻ Baca ulang lokasi</button>`;
    tr(b);fieldMap();return;
  }
  b.innerHTML=`<div style="text-align:center;padding:10px 0"><div style="font-size:44px">✅</div><h3>Pengajuan terkirim</h3><p class="mut" style="margin:6px 0 12px">Absen <b>${lbl}</b> jam <b>${esc(F.jam)}</b> menunggu persetujuan<br>${chainBar({...atasanFields(ME),hrId:ME.hrId,hrName:ME.hrName,status:"menunggu",step:chainStart(ME),log:[]})}</p><button class="btn" onclick="go('absen')">Lihat di Riwayat Absensi</button> <button class="btn ghost" onclick="go('home')">Kembali ke Beranda</button></div>`;
  tr(b);
}
async function fieldCam(){
  const b=$("#snap"),st=m=>{const e=$("#fst");if(e)e.textContent=m};
  st("⏳ Menyiapkan kamera & pengenalan wajah...");scanSet("load","Menyiapkan kamera…");
  try{await Promise.all([loadFace(),openCam()]);if(view!=="lapangan")return stopCam()}
  catch(e){st("⚠️ "+e.message);toast(e.message);if(b){b.textContent="Coba lagi";b.disabled=false;b.onclick=()=>render()}return}
  st("");scanStart();b.disabled=false;b.onclick=fieldScan;
}
function fieldScan(){
  const b=$("#snap");if(!SC||!$("#cam").videoWidth)return toast("Kamera belum siap");
  b.disabled=true;const my=SC;my.pos=null;my.stable=0;my.armAt=Date.now();my.onPass=fieldPassed;
  my.fin=()=>{b.disabled=false;b.textContent="🔄 Scan ulang"};my.arm=true;scanSet("warn","Posisikan wajah di dalam bingkai");
}
async function fieldPassed(photo,dist,pct){
  if(!FLD)return;FLD.photo=photo;FLD.dist=dist;FLD.pct=pct;FLD.step=2;
  await sleep(700);if(view!=="lapangan")return;stopCam();
  // lokasi dibaca otomatis supaya setelah scan langsung tinggal menekan Ajukan
  if(!(FLD.pos&&Date.now()-(FLD.pos.t||0)<120000)){const pos=await getPos();if(pos)FLD.pos={...pos,t:Date.now()}}
  if(view!=="lapangan")return;if(FLD.pos)FLD.step=3;fieldPaint();
}
async function fieldLoc(id){
  const b=document.getElementById(id),old=b?b.textContent:"";if(b){b.disabled=true;b.textContent="📍 Membaca lokasi…"}
  const pos=await getPos();
  if(!pos){toast("Lokasi tidak terbaca. Aktifkan GPS & izinkan akses lokasi, lalu coba lagi.");if(b){b.disabled=false;b.textContent=old}return}
  FLD.pos={...pos,t:Date.now()};FLD.step=3;fieldPaint();
}
async function fieldMap(){
  const el=$("#fmap");if(!el||!FLD||!FLD.pos)return;const p=FLD.pos,g=geoFor();
  try{await loadLeaflet()}catch(e){el.innerHTML=`<p class="mut" style="padding:14px">⚠️ Peta tidak termuat. <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${p.lat},${p.lng}">Buka di Google Maps</a></p>`;return}
  if(!document.body.contains(el))return;
  const ac=getComputedStyle(document.documentElement).getPropertyValue("--ac").trim()||"#0d9488",pin=e=>L.divIcon({className:"",html:`<div style="font-size:30px;line-height:30px">${e}</div>`,iconSize:[30,30],iconAnchor:[15,28]});
  const M=L.map(el).setView([p.lat,p.lng],17);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(M);
  const me=L.circle([p.lat,p.lng],{radius:Math.max(10,p.acc||10),color:"#2563eb",weight:1,fillColor:"#2563eb",fillOpacity:.12}).addTo(M);L.marker([p.lat,p.lng],{icon:pin("📍")}).addTo(M);
  if(g){const of=L.circle([g.lat,g.lng],{radius:g.rad,color:ac,weight:2,fillColor:ac,fillOpacity:.15}).addTo(M);L.marker([g.lat,g.lng],{icon:pin("🏢")}).addTo(M);M.fitBounds(L.featureGroup([me,of]).getBounds().pad(.15))}
  setTimeout(()=>M.invalidateSize(),200);
}
async function fieldSend(){
  const b=$("#fSend");if(!FLD||!FLD.pos||!FLD.photo)return;b.disabled=true;
  try{
    const now=new Date(),slot=FLD.slot,p=FLD.pos,g=geoFor();
    const dup=(await get("requests","uid",ME.id)).find(r=>r.type==="lapangan"&&r.status==="menunggu"&&r.tgl===ymd(now)&&r.slot===slot);
    if(dup)throw new Error("Sudah ada pengajuan absen "+SL2[slot]+" yang menunggu persetujuan");
    await db.collection("requests").add({uid:ME.id,name:ME.name,type:"lapangan",status:"menunggu",createdAt:Date.now(),dept:ME.dept||"",...atasanFields(ME),hrId:ME.hrId||"",hrName:ME.hrName||"",step:chainStart(ME),log:[],
      slot,slotLbl:SL2[slot],tgl:ymd(now),jam:hm(now),lat:p.lat,lng:p.lng,acc:Math.round(p.acc||0),jarak:g?Math.round(distM(p,g)):null,rad:g?g.rad:null,
      photo:await savePhoto(FLD.photo,`lap_${Date.now()}.jpg`),faceDist:FLD.dist,ket:(($("#fKet")||{}).value||"").trim()});
    FLD.jam=hm(now);FLD.step=4;fieldPaint();
  }catch(e){toast(errMsg(e));if(b)b.disabled=false}
}
V.lapangan=lapanganView;
