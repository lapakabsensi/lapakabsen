const firebaseConfig = {
  apiKey: "AIzaSyAGhld-uiOVCnTb6TJIzWYw3aBghBEGblY",
  authDomain: "absen-per-kepala.firebaseapp.com",
  projectId: "absen-per-kepala",
  storageBucket: "absen-per-kepala.firebasestorage.app",
  messagingSenderId: "960030564944",
  appId: "1:960030564944:web:b1e8fd543c8ddff59a6755",
  measurementId: "G-0JFRDJP8CF"
};
// ===== Panel Super Admin: memantau semua pelanggan, notifikasi permintaan lisensi, kirim token =====
// JANGAN diberikan ke pelanggan. Simpan super.html + super.js hanya di hosting milikmu.
// Aplikasi Firebase DIBERI NAMA sendiri ("superadmin"). Halaman ini dan aplikasi pelanggan berada di alamat (origin) yang sama, dan sesi login
// disimpan per nama aplikasi. Tanpa nama sendiri, login super admin dan login pelanggan saling menimpa antar-tab lalu saling mengeluarkan.
const SAPP=firebase.initializeApp(firebaseConfig,"superadmin");
const auth=SAPP.auth(),db=SAPP.firestore(),FV=firebase.firestore.FieldValue,$=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rp=n=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
const tm=t=>{const d=t&&t.toDate?t.toDate():(typeof t==="number"?new Date(t):null);return d?d.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):"-"};
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const toast=m=>{const t=$("#toast");t.textContent=m;t.style.display="block";clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display="none",5000)};
addEventListener("unhandledrejection",e=>toast("Error: "+(e.reason&&e.reason.message||e.reason)));
let SU=null,TENS=[],LIC=[],tab="lic",unsub=null,BUSY=false,first=true;const seen=new Set();
let PAY={company:"",bank:"BCA",no:"6530119465",name:"GERRI DANELTO",price:3500,wa:""};
const crand=(cs,n)=>Array.from({length:n},()=>cs[crypto.getRandomValues(new Uint32Array(1))[0]%cs.length]).join("");
const genToken=()=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return`LIC-${crand(c,4)}-${crand(c,4)}-${crand(c,4)}`};
const genCode=()=>crand("abcdefghjkmnpqrstuvwxyz23456789",8);
const base=()=>{try{return(localStorage.getItem("custBase")||"").replace(/\/+$/,"")}catch(e){return""}};
const linkOf=id=>(base()||"https://ALAMAT-WEB-PELANGGAN")+"/"+id,linkOld=id=>(base()||"https://ALAMAT-WEB-PELANGGAN")+"/?c="+id;
// Kode pelanggan = alamat link yang mudah dibaca (contoh: tokomaju), bukan acak. Nama folder bawaan web tidak boleh dipakai.
const RESERVED=["css","js","img","icons","index","admin","super","api","login","demo","www","sa"];
const slugOf=n=>String(n||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\b(pt|cv|ud|pd|toko)\b/g,m=>m==="toko"?m:"").replace(/[^a-z0-9]/g,"").slice(0,24);
const slugOk=c=>/^[a-z0-9]{3,30}$/.test(c)&&!RESERVED.includes(c)&&!c.startsWith("sa");
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.15;o.start();o.stop(a.currentTime+.25)}catch(e){}}
const copy=(t,m)=>{navigator.clipboard&&navigator.clipboard.writeText(t);toast(m||"Disalin")};


// ---------- tampilan (logo, warna, teks) ----------
let CAP="";
function newCap(){const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";CAP=Array.from({length:5},()=>ch[Math.random()*ch.length|0]).join("");
  const c=document.getElementById("cap"),x=c.getContext("2d");x.fillStyle="#eef2f7";x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<7;i++){x.strokeStyle=`hsl(${Math.random()*360},50%,60%)`;x.beginPath();x.moveTo(Math.random()*c.width,Math.random()*c.height);x.lineTo(Math.random()*c.width,Math.random()*c.height);x.stroke()}
  x.font="bold 26px monospace";x.textBaseline="middle";
  [...CAP].forEach((t,i)=>{x.save();x.translate(14+i*23,c.height/2);x.rotate((Math.random()-.5)*.5);x.fillStyle=`hsl(${Math.random()*360},60%,30%)`;x.fillText(t,0,0);x.restore()});
  document.getElementById("capIn").value=""}
function capOk(){if(document.getElementById("capIn").value.trim().toUpperCase()===CAP)return true;toast("Kode captcha salah");newCap();return false}
function eye(){const i=document.getElementById("pw"),h=i.type==="password";i.type=h?"text":"password";document.getElementById("eye").textContent=h?"🙈":"👁️"}
const PAL=[["Oranye Lapak","#f97316"],["Teal","#0d9488"],["Indigo","#4f46e5"],["Biru","#2563eb"],["Ungu","#7c3aed"],["Merah muda","#db2777"],["Merah","#dc2626"],["Oranye","#ea580c"],["Hijau","#16a34a"],["Abu gelap","#334155"]];
let BR={nama:"Super Admin",sub:"Panel Khusus Penyedia Layanan Absen Yuk",hi:"Selamat Datang",color:"#f97316",logo:""};
try{BR={...BR,...JSON.parse(localStorage.getItem("sa_brand")||"{}")}}catch(e){}
function trimImg(src,cb){const im=new Image();im.onload=()=>{try{const w=im.width,h=im.height,c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h).data;const cs=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4],bg=[0,1,2].map(k=>cs.reduce((a,i)=>a+d[i+k],0)/4),ba=cs.reduce((a,i)=>a+d[i+3],0)/4;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let q=0;q<w;q++){const i=(y*w+q)*4;if(d[i+3]>20&&(ba<20||Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>60)){if(q<x0)x0=q;if(q>x1)x1=q;if(y<y0)y0=y;if(y>y1)y1=y}}
 if(x1<0)return cb(src);const bw=x1-x0+1,bh=y1-y0+1,s=Math.min(1,256/Math.max(bw,bh)),o=document.createElement("canvas");o.width=Math.round(bw*s);o.height=Math.round(bh*s);o.getContext("2d").drawImage(c,x0,y0,bw,bh,0,0,o.width,o.height);cb(o.toDataURL("image/png"))}catch(e){cb(src)}};im.onerror=()=>cb(src);im.src=src}
function applyBrand(){
  document.documentElement.style.setProperty("--ac",BR.color);
  const lg=BR.logo?`<img src="${BR.logo}" alt="">`:"🛡️";
  $("#bLogo").innerHTML=lg;$("#sLogo").innerHTML=lg;$("#bName").textContent=BR.nama;$("#sName").textContent=BR.nama;$("#bSub").textContent=BR.sub;$("#bHi").textContent=BR.hi;
  document.title=BR.nama;
  try{localStorage.setItem("sa_brand",JSON.stringify(BR))}catch(e){}
  if(BR.logo&&BR.tr!==2){BR.tr=2;trimImg(BR.logo,u=>{BR.logo=u;applyBrand()})}
}
async function loadBrand(){try{const d=await db.collection("superMeta").doc("brand").get();if(d.exists){BR={...BR,...d.data()};applyBrand()}}catch(e){}}
applyBrand();newCap();loadBrand();
function eye(){const i=$("#pw"),h=i.type==="password";i.type=h?"text":"password";$("#eye").textContent=h?"🙈":"👁️"}
function pickColor(c){BR.color=c;$("#bcol").value=c;document.querySelectorAll(".sw button").forEach(b=>b.classList.toggle("on",b.dataset.c===c));applyBrand()}
function pickLogo(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>trimImg(r.result,u=>{BR.logo=u;BR.tr=2;$("#lgPrev").innerHTML=`<img src="${u}" alt="">`;applyBrand()});r.readAsDataURL(f)}
function delLogo(){BR.logo="";$("#lgPrev").textContent="🛡️";applyBrand()}
async function saveBrand(){BR.nama=$("#bnm").value.trim()||"Super Admin";BR.sub=$("#bsb").value.trim();BR.hi=$("#bhi").value.trim()||"Selamat Datang";BR.color=$("#bcol").value;applyBrand();try{await db.collection("superMeta").doc("brand").set(BR);toast("Tampilan tersimpan")}catch(e){toast("Gagal simpan: "+(e.code||e.message)+" (publikasikan firestore.rules terbaru)")}}
function brandBox(){return`<div class="box"><h3>Tampilan panel &amp; halaman login</h3><p class="mut" style="margin-bottom:12px">Logo, warna, dan teks di sini tampil di halaman login dan di panel ini.</p>
 <div class="lgp"><div class="sabrand" id="lgPrev">${BR.logo?`<img src="${BR.logo}" alt="">`:"🛡️"}</div><div><input type="file" id="lgf" accept="image/*" hidden onchange="pickLogo(this)"><button class="btn ghost sm" onclick="$('#lgf').click()">Ganti logo</button> <button class="btn ghost sm" onclick="delLogo()">Hapus logo</button><br><small class="mut">Gambar otomatis dikecilkan.</small></div></div>
 <label>Tema &amp; warna</label><div class="sw">${PAL.map(p=>`<button type="button" title="${p[0]}" data-c="${p[1]}" class="${p[1]===BR.color?"on":""}" style="background:${p[1]}" onclick="pickColor('${p[1]}')"></button>`).join("")}</div>
 <div class="fg"><div class="f"><label>Warna khusus</label><input id="bcol" type="color" value="${esc(BR.color)}" oninput="pickColor(this.value)" style="height:42px;padding:3px"></div><div class="f"><label>Nama panel</label><input id="bnm" value="${esc(BR.nama)}"></div><div class="f"><label>Judul sambutan login</label><input id="bhi" value="${esc(BR.hi)}"></div><div class="f"><label>Teks di bawah nama (halaman login)</label><input id="bsb" value="${esc(BR.sub)}"></div></div>
 <button class="btn" onclick="saveBrand()">Simpan tampilan</button></div>`}

const num=s=>parseInt(String(s).replace(/\D/g,""))||0;
document.addEventListener("input",e=>{const t=e.target;if(t.classList&&t.classList.contains("rpin")){const n=num(t.value);t.value=n?n.toLocaleString("id-ID"):""}});
// ---------- login ----------
// pesan galat yang mudah dipahami (Firebase mengirim kode seperti auth/invalid-credential = HTTP 400 dari identitytoolkit)
const aerr=e=>({"auth/invalid-credential":"Email atau password salah (atau akun ini belum ada di Firebase Authentication). Coba \"Lupa password?\".","auth/wrong-password":"Password salah. Coba \"Lupa password?\".","auth/user-not-found":"Email ini belum terdaftar di Firebase Authentication.","auth/invalid-email":"Format email tidak benar.","auth/too-many-requests":"Terlalu banyak percobaan. Tunggu beberapa menit atau pakai \"Lupa password?\".","auth/network-request-failed":"Tidak ada koneksi internet.","auth/user-disabled":"Akun ini dinonaktifkan di Firebase.","auth/email-already-in-use":"Email ini sudah terdaftar di Firebase (mis. sebagai akun lain). Pakai \"Lupa password?\" untuk masuk.","auth/operation-not-allowed":"Login Email/Password belum diaktifkan di Firebase Console > Authentication > Sign-in method.","auth/api-key-not-valid.-please-pass-a-valid-api-key.":"API key Firebase di super.js tidak valid."}[e.code]||(e.message||String(e)));
const lmsg=m=>{const p=$("#loginMsg");p.textContent=m||"";p.style.display=m?"block":"none"};
db.collection("superMeta").doc("init").get().then(d=>{if(!d.exists)$("#setupRow").style.display="block"}).catch(e=>lmsg("Tidak bisa membaca status setup ("+(e.code||e.message)+"). Pastikan firestore.rules terbaru sudah dipublikasikan."));
$("#bLogin").onclick=async()=>{lmsg("");if(!capOk())return;const b=$("#bLogin");b.disabled=true;try{await auth.signInWithEmailAndPassword($("#em").value.trim(),$("#pw").value)}catch(e){lmsg(aerr(e));toast(aerr(e))}b.disabled=false};
// diagnosa: memeriksa proyek, Firestore + rules, dan apakah login Email/Password aktif. Hasilnya bisa difoto untuk dicek.
$("#bDiag").onclick=async e=>{e.preventDefault();const o=["Proyek: "+firebaseConfig.projectId+" | alamat: "+location.host];lmsg("Memeriksa...");
  try{const d=await db.collection("superMeta").doc("init").get();o.push("Firestore & rules: OK. "+(d.exists?"Super admin SUDAH dibuat, jadi tautan Setup disembunyikan.":"Belum ada super admin, tautan Setup seharusnya tampil."))}catch(x){o.push("Firestore / rules: GAGAL ("+(x.code||x.message)+")"+(x.code==="permission-denied"?". Publikasikan firestore.rules di Firebase Console > Firestore > Rules.":""))}
  try{await auth.signInWithEmailAndPassword("diagnosa@example.com","diagnosa-123456")}catch(x){const c=x.code||"";o.push("Login Email/Password: "+(c==="auth/operation-not-allowed"?"BELUM DIAKTIFKAN. Aktifkan di Firebase Console > Authentication > Sign-in method > Email/Password.":/invalid-credential|user-not-found|wrong-password/.test(c)?"aktif (OK)":/api-key|referer/.test(c+x.message)?"API key bermasalah ("+c+"). Cek pembatasan API key di Google Cloud Console.":"galat ("+c+") "+(x.message||"")))}
  lmsg(o.join("\n"))};
$("#bReset").onclick=async e=>{e.preventDefault();const em=$("#em").value.trim();if(!em)return lmsg("Isi email dulu, lalu klik \"Lupa password?\" lagi.");
  try{await auth.sendPasswordResetEmail(em);lmsg("");toast("Link reset password dikirim ke "+em+". Cek kotak masuk dan folder Spam.")}catch(x){lmsg(aerr(x))}};
$("#bSetup").onclick=async e=>{e.preventDefault();const em=$("#em").value.trim(),pw=$("#pw").value;if(!em||pw.length<6)return toast("Isi email, password (min 6 karakter), dan nama");const nm=await uiPrompt("Siapa nama super admin ini?",{title:"Nama super admin",ok:"Buat akun",placeholder:"Nama lengkap"});
  if(!nm||!em||pw.length<6)return toast("Isi email, password (min 6 karakter), dan nama");
  BUSY=true;try{const c=await auth.createUserWithEmailAndPassword(em,pw),b=db.batch();b.set(db.collection("superadmins").doc(c.user.uid),{name:nm,email:em,createdAt:FV.serverTimestamp()});b.set(db.collection("superMeta").doc("init"),{uid:c.user.uid});await b.commit();location.reload()}catch(x){BUSY=false;lmsg(aerr(x)+(x.code?" ["+x.code+"]":""));toast(aerr(x))}};
["em","pw","capIn"].forEach(i=>$("#"+i).addEventListener("keydown",e=>{if(e.key==="Enter")$("#bLogin").click()}));
auth.onAuthStateChanged(async u=>{
  if(BUSY)return;
  $("#login").style.display=u?"none":"grid";$("#shell").style.display=u?"grid":"none";
  if(!u){SU=null;if(unsub)unsub();newCap();return}
  let ge=null;const d=await db.collection("superadmins").doc(u.uid).get().catch(e=>{ge=e;return null});
  if(ge){lmsg("Login berhasil, tetapi data super admin tidak bisa dibaca ("+(ge.code||ge.message)+"). Publikasikan firestore.rules terbaru di Firebase Console.");toast("Tidak bisa membaca data super admin");await auth.signOut();return}
  if(!d||!d.exists){lmsg("Login berhasil, tetapi akun ini belum terdaftar sebagai super admin (tidak ada dokumen superadmins/"+u.uid+"). Pakai email super admin yang benar.");toast("Akun ini bukan super admin");await auth.signOut();return}
  SU={id:u.uid,...d.data()};$("#who").textContent=$("#who2").textContent=SU.name||SU.email;
  try{const p=await db.collection("superMeta").doc("pay").get();if(p.exists)PAY={...PAY,...p.data()}}catch(e){}
  await loadTens();tenSyncAll(false);listen();go("lic");
});
const NAV=[["lic","🔔","Lisensi"],["ten","🏢","Pelanggan"],["bak","💾","Backup"],["set","⚙️","Pengaturan"]];
function go(t){tab=t;$("#nav").innerHTML=NAV.map(n=>`<a class="${n[0]===t?"on":""}" onclick="go('${n[0]}')"><span>${n[1]}</span>${n[2]}${n[0]==="lic"?'<span class="badge" id="badge"></span>':""}</a>`).join("");$("#ttl").textContent=(NAV.find(n=>n[0]===t)||[])[2]||"";badge();render()}
const badge=()=>{const n=LIC.filter(l=>l.status==="menunggu").length,b=$("#badge");if(b)b.textContent=n||"";document.title=(n?`(${n}) `:"")+"Super Admin";bellDraw()};
// ---- notifikasi (lonceng): permintaan lisensi menunggu + token yang segera berakhir (<= 7 hari) ----
const bellItems=()=>[...LIC.filter(l=>l.status==="menunggu").map(l=>({ic:"🔔",t:`${l.kind==="perpanjang"?"Permintaan perpanjangan":"Permintaan lisensi baru"}: <b>${esc(l.tname||tname(l.tid))}</b>`,s:`${l.qty} akun · ${lmo(l)} bln · ${rp(l.total)} · ${tm(l.ts)}${l.proof?" · bukti sudah diunggah":""}`,ts:l.ts})),
  ...LIC.filter(l=>l.kind!=="perpanjang"&&licEff(l)==="kedaluwarsa"&&l.expiresAt&&dleft(l.expiresAt)>=-14&&!LIC.some(r=>r.kind==="perpanjang"&&r.ref===l.id&&r.status==="menunggu")).map(l=>({ic:"⌛",t:`Lisensi sudah kedaluwarsa: <b>${esc(l.tname||tname(l.tid))}</b>`,s:`${l.qty} akun · berakhir ${fdate(l.expiresAt)}`,ts:l.expiresAt})),
  ...LIC.filter(l=>l.kind!=="perpanjang"&&l.status==="aktif"&&l.expiresAt&&dleft(l.expiresAt)<=7&&dleft(l.expiresAt)>0).map(l=>({ic:"⏳",t:`Lisensi segera berakhir: <b>${esc(l.tname||tname(l.tid))}</b>`,s:`${l.qty} akun · sisa ${dleft(l.expiresAt)} hari (s/d ${fdate(l.expiresAt)})`,ts:l.expiresAt}))];
function bellDraw(){
  const L=bellItems(),n=$("#bellN"),d=$("#bdd");if(n)n.textContent=L.length||"";if(!d)return;
  d.innerHTML=`<h4>Notifikasi${L.length?` (${L.length})`:""}</h4>`+(L.map(x=>`<div class="bi" onclick="bellGo()">${x.ic} ${x.t}<small>${x.s}</small></div>`).join("")||'<div class="bno">Tidak ada notifikasi baru.</div>');
}
function bellToggle(e){e&&e.stopPropagation();const d=$("#bdd");d.style.display=d.style.display==="block"?"none":"block";bellDraw()}
function bellGo(){$("#bdd").style.display="none";go("lic")}
document.addEventListener("click",e=>{const d=$("#bdd");if(d&&d.style.display==="block"&&!d.contains(e.target)&&!e.target.closest("#bell"))d.style.display="none"});
// ---- PDF invoice / token lisensi (memakai js/licpdf.js yang sama dengan sisi pelanggan) ----
const licMo=l=>lmo(l);var TEN=null,TENANT="";
Object.defineProperty(window,"LP_LOGO",{get:()=>BR.logo||"../img/logo.png"});
async function render(){const v=$("#view");v.innerHTML='<p class="mut">Memuat...</p>';try{v.innerHTML=await({lic:renderLic,ten:renderTen,bak:renderBak,set:renderSet}[tab])()}catch(e){v.innerHTML=`<div class="box">Error: ${esc(e.message)}</div>`}}
async function loadTens(){TENS=(await db.collection("tenants").get()).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name).localeCompare(String(b.name)))}
const tname=id=>(TENS.find(t=>t.id===id)||{}).name||id;

// ---------- Lisensi: notifikasi real-time ----------
function listen(){
  if(unsub)unsub();
  unsub=db.collection("licenses").orderBy("ts","desc").limit(200).onSnapshot(s=>{
    LIC=s.docs.map(d=>({id:d.id,...d.data()}));window.LICS=LIC;
    LIC.filter(l=>l.status==="menunggu").forEach(l=>{if(!seen.has(l.id)){seen.add(l.id);if(!first){beep();toast(`🔔 Permintaan lisensi baru: ${l.tname||l.tid} · ${l.qty} akun · ${rp(l.total)}`)}}});
    if(first)expSweep();first=false;badge();if(tab==="lic")render();
  },e=>toast("Listener: "+e.message));
}
const fdate=t=>t&&t.toDate?t.toDate().toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"-";
const dleft=t=>t&&t.toMillis?Math.ceil((t.toMillis()-Date.now())/864e5):null;
const lmo=l=>Math.max(1,parseInt(l&&l.months)||1);
const addM=(d,n)=>{const x=new Date(d),k=x.getDate();x.setMonth(x.getMonth()+n);if(x.getDate()<k)x.setDate(0);return x};
// status "efektif": token yang masa berlakunya sudah lewat dianggap kedaluwarsa walau dokumennya belum dirapikan (sweep jalan saat admin pelanggan / panel ini dibuka)
const licEff=l=>l.status==="aktif"&&l.expiresAt&&l.expiresAt.toMillis()<Date.now()?"kedaluwarsa":l.status;
const licTag=l=>{const e=licEff(l),d=dleft(l.expiresAt);
  if(e==="nonaktif")return'<span class="tag no">⛔ Nonaktif</span>';
  if(e==="kedaluwarsa")return'<span class="tag no">⌛ Kedaluwarsa</span>';
  if(e==="aktif"&&d!=null&&d<=7)return'<span class="tag no">⚠ Segera berakhir</span>';
  if(e==="aktif"&&d!=null&&d<=30)return'<span class="tag" style="background:#fef3c7;color:#92400e">Segera berakhir</span>';
  if(e==="aktif")return'<span class="tag ok">Aktif</span>';
  return`<span class="tag bl">${esc(e)}</span>`};
const licBerlaku=l=>{const e=licEff(l),d=dleft(l.expiresAt);
  if(l.kind==="perpanjang")return l.status==="diperpanjang"?`${fdate(l.newExpiresAt)}<br><small class="mut">perpanjangan</small>`:"-";
  if(e==="aktif"&&l.expiresAt)return`${fdate(l.expiresAt)}<br><small class="${d<=7?"":"mut"}" style="${d<=7?"color:var(--bad)":""}">${d>0?"sisa "+d+" hari":"berakhir hari ini"}</small>`;
  if(e==="kedaluwarsa")return`${fdate(l.expiresAt)}<br><small style="color:var(--bad)">berakhir ${Math.abs(d)} hari lalu</small>`;
  if(e==="nonaktif")return`<small class="mut">${l.expiresAt?"sampai "+fdate(l.expiresAt)+" · ":""}dinonaktifkan</small>`;
  if(e==="terbit")return`<small class="mut">Menunggu diaktifkan · ${lmo(l)} bln</small>`;return"-"};
// token yang masa berlakunya lewat: cabut kursinya dari kuota pelanggan (dijalankan saat panel dibuka & berkala)
async function expSweep(){
  try{for(const l of LIC.filter(x=>x.kind!=="perpanjang"&&x.status==="aktif"&&x.expiresAt&&x.expiresAt.toMillis()<Date.now())){
    const lr=db.collection("licenses").doc(l.id),R=db.collection("tenants").doc(l.tid);
    await db.runTransaction(async tx=>{const a=await tx.get(lr),t=await tx.get(R);if(!a.exists||!t.exists)return;const L=a.data();
      if(L.status!=="aktif"||!L.expiresAt||L.expiresAt.toMillis()>=Date.now())return;
      tx.update(lr,{status:"kedaluwarsa"});tx.update(R,{quota:Math.max(0,(+t.data().quota||0)-(+L.qty||0)),lastLic:l.id})})}}catch(e){}
}
setInterval(()=>{if(typeof LIC!=="undefined")expSweep()},600000);
const invNo=l=>{const d=l.ts&&l.ts.toDate?l.ts.toDate():new Date();return"INV-"+d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+"-"+String(l.id).slice(0,6).toUpperCase()};
const licRow=l=>{const ren=l.kind==="perpanjang",st=["aktif","kedaluwarsa","nonaktif"].includes(l.status)&&!ren;
  const tag=st?licTag(l):`<span class="tag ${l.status==="aktif"||l.status==="diperpanjang"?"ok":l.status==="ditolak"||l.status==="kedaluwarsa"?"no":"bl"}">${esc(l.status)}</span>`;
  const acts=l.status==="ditolak"?"":`<button class="btn ghost sm" onclick="licInvPdf('${l.id}')">🧾 Invoice</button>${l.token&&lpPaid(l)?` <button class="btn ghost sm" onclick="licTokPdf('${l.id}')">📄 Token</button>`:""}${!ren&&["aktif","terbit"].includes(l.status)?` <button class="btn red sm" onclick="licDisable('${l.id}')">⛔ Nonaktifkan</button>`:""}${!ren&&l.status==="nonaktif"?` <button class="btn ok sm" onclick="licEnable('${l.id}')">✅ Aktifkan lagi</button>`:""}${l.status!=="menunggu"?` <button class="btn ghost sm" style="color:var(--bad)" title="Hapus permanen dari database" onclick="licDelete('${l.id}')">🗑️ Hapus</button>`:""}`;
  return`<tr><td>${tm(l.ts)}</td><td>${ren?"🔁 Perpanjangan · ":""}${esc(l.tname||tname(l.tid))}<br><small class="mut">${esc(l.tid)} · ${esc(l.byName||"")} · ${invNo(l)}</small></td><td>${l.qty}</td><td>${lmo(l)} bln</td><td>${rp(l.total)}</td><td>${tag}${l.token?`<br><span class="code" style="font-size:13px">${esc(l.token)}</span> <a style="cursor:pointer;color:var(--ac)" onclick="copy('${esc(l.token)}','Token disalin')">salin</a>`:""}</td><td>${licBerlaku(l)}</td><td style="white-space:nowrap">${acts}</td></tr>`};
async function renderLic(){
  const pend=LIC.filter(l=>l.status==="menunggu"),hist=LIC.filter(l=>l.status!=="menunggu");
  return`<div class="row" style="margin-bottom:12px"><h1>Permintaan lisensi</h1><span class="mut">${pend.length} menunggu${pend.some(l=>l.kind==="perpanjang")?" · "+pend.filter(l=>l.kind==="perpanjang").length+" perpanjangan":""}</span></div>
  ${pend.map(l=>l.kind==="perpanjang"?renewCard(l):`<div class="req"><div class="row"><div><b>${esc(l.tname||tname(l.tid))}</b> <small class="mut">(${esc(l.tid)}) · ${invNo(l)}</small><br>Minta <b>${l.qty} akun</b> × ${rp(l.price)} × <select id="pm_${l.id}" class="pmsel" onchange="licMonths('${l.id}')">${[...new Set([1,2,3,4,5,6,9,12,24,lmo(l)])].sort((a,b)=>a-b).map(m=>`<option value="${m}"${m===lmo(l)?" selected":""}>${m} bulan</option>`).join("")}</select> = <b style="font-size:18px" id="pt_${l.id}">${rp(l.qty*l.price*lmo(l))}</b><br><small class="mut">Periode berlaku token, dihitung sejak tenant mengaktifkan. Harga per akun per bulan. Ubah periodenya kalau pelanggan membayar untuk periode lain.</small><br><small class="mut">${tm(l.ts)} · diajukan ${esc(l.byName||"admin")}</small></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ok" onclick="sendToken('${l.id}')">🎫 Kirim token</button><button class="btn ghost" onclick="licInvPdf('${l.id}')">🧾 Invoice PDF</button><button class="btn ghost" onclick="rejectLic('${l.id}')">Tolak</button></div></div>
    ${l.proof?`<div style="margin:8px 0"><b>Bukti pembayaran:</b><br><img src="${l.proof}" alt="Bukti" title="Klik untuk memperbesar" onclick="proofView(this.src)" style="max-width:240px;max-height:220px;border-radius:10px;border:1px solid var(--line);margin-top:4px;cursor:zoom-in"><br><small class="mut">Klik gambar untuk memperbesar</small></div>`:'<div class="mut" style="margin:6px 0"><small>Belum ada bukti pembayaran diunggah.</small></div>'}<small class="mut">Cek dulu ada transfer ${rp(l.total)} masuk ke ${esc(PAY.bank)} ${esc(PAY.no)} a.n. ${esc(PAY.name)}, baru kirim token.</small></div>`).join("")||'<div class="box mut">Tidak ada permintaan yang menunggu.</div>'}
  ${licMonitor()}
  <div class="box"><h3>Riwayat</h3><div class="tw"><table><tr><th>Waktu</th><th>Pelanggan</th><th>Akun</th><th>Periode</th><th>Total</th><th>Status</th><th>Berlaku sampai</th><th>PDF</th></tr>${hist.map(licRow).join("")||'<tr><td colspan="8" class="mut">Belum ada riwayat.</td></tr>'}</table></div></div>`;
}
const licMonths=id=>{const l=LIC.find(x=>x.id===id),m=parseInt($("#pm_"+id).value)||1;if(l&&$("#pt_"+id))$("#pt_"+id).textContent=rp(l.qty*l.price*m)};
async function sendToken(id){
  const l=LIC.find(x=>x.id===id),mo=parseInt(($("#pm_"+id)||{}).value)||lmo(l||{}),tot=l?l.qty*l.price*mo:0;
  if(!l||!await uiConfirm(`Kirim token untuk ${l.tname||l.tid}?\n${l.qty} akun × ${rp(l.price)} × ${mo} bulan = ${rp(tot)}\nBerlaku ${mo} bulan sejak tenant memasukkan token.${tot!==l.total?`\n\nNominal berubah dari ${rp(l.total)} (sesuai permintaan awal) menjadi ${rp(tot)}.`:""}\n\nPastikan pembayaran sudah masuk.`,{title:"Kirim token lisensi?",ok:"Kirim token"}))return;
  const token=genToken();
  await db.collection("licenses").doc(id).update({status:"terbit",token,months:mo,total:tot,sentAt:FV.serverTimestamp(),sentBy:SU.id});
  toast("Token terkirim ke akun admin pelanggan (notifikasi + PDF token & invoice LUNAS tersedia di akun mereka): "+token);
}
async function rejectLic(id){const n=await uiPrompt("Alasan penolakan akan dilihat admin pelanggan. Boleh dikosongkan.",{title:"Tolak permintaan?",ok:"Tolak",danger:true,placeholder:"Alasan (opsional)"});if(n===null)return;await db.collection("licenses").doc(id).update({status:"ditolak",note:n||"",sentAt:FV.serverTimestamp(),sentBy:SU.id});toast("Permintaan ditolak")}

// ---------- Pantauan masa berlaku, nonaktifkan, perpanjangan ----------
const licOf=u=>{if(u.seat!==true)return'<span class="mut">- (admin)</span>';const l=LIC.find(x=>x.id===u.licId);return l?`${invNo(l)} <small class="mut">· ${l.qty} akun</small> ${licTag(l)}`:'<span class="mut">belum tertaut</span>'};
let MON="all";
const monSet=v=>{MON=v;render()};
function licMonitor(){
  const B=LIC.filter(l=>l.kind!=="perpanjang"&&["aktif","kedaluwarsa","nonaktif"].includes(l.status)),eff=l=>{const e=licEff(l),d=dleft(l.expiresAt);return e==="aktif"&&d!=null&&d<=30?"segera":e};
  const cnt=k=>B.filter(l=>eff(l)===k).length,F=B.filter(l=>MON==="all"||eff(l)===MON||(MON==="aktif"&&eff(l)==="segera")).sort((a,b)=>(a.expiresAt?a.expiresAt.toMillis():9e15)-(b.expiresAt?b.expiresAt.toMillis():9e15));
  const chip=(k,t,n)=>`<button class="btn ${MON===k?"":"ghost"} sm" onclick="monSet('${k}')">${t} (${n})</button>`;
  return`<div class="box"><div class="row"><h3>Pantauan masa berlaku lisensi</h3><button class="btn ghost sm" onclick="tenSyncAll(true)" title="Hitung ulang masa berlaku akses pegawai tiap pelanggan">🔄 Sinkronkan akses</button></div><p class="mut" style="margin-bottom:10px">Semua lisensi yang sudah diaktifkan, diurutkan dari yang paling dulu berakhir. Lisensi <b>kedaluwarsa</b> berarti kuota akunnya sudah dicabut dari pelanggan; pegawai/HR mereka otomatis tidak bisa masuk dan admin tidak bisa menambah karyawan sampai lisensi diperpanjang atau diaktifkan lagi.</p>
  <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${chip("all","Semua",B.length)}${chip("kedaluwarsa","⌛ Kedaluwarsa",cnt("kedaluwarsa"))}${chip("segera","⚠ Segera berakhir (≤30 hari)",cnt("segera"))}${chip("aktif","Aktif",cnt("aktif")+cnt("segera"))}${chip("nonaktif","⛔ Nonaktif",cnt("nonaktif"))}</div>
  <div class="tw"><table><tr><th>Pelanggan</th><th>Lisensi</th><th>Akun</th><th>Berlaku sampai</th><th>Status</th><th></th></tr>${F.map(l=>`<tr><td>${esc(l.tname||tname(l.tid))}<br><small class="mut">${esc(l.tid)}</small></td><td>${invNo(l)}<br><small class="mut">aktif sejak ${fdate(l.activatedAt)}</small></td><td>${l.qty}</td><td>${licBerlaku(l)}</td><td>${licTag(l)}</td><td style="white-space:nowrap">${l.status==="nonaktif"?`<button class="btn ok sm" onclick="licEnable('${l.id}')">✅ Aktifkan lagi</button>`:l.status==="aktif"?`<button class="btn red sm" onclick="licDisable('${l.id}')">⛔ Nonaktifkan</button>`:""} <button class="btn ghost sm" style="color:var(--bad)" title="Hapus permanen dari database" onclick="licDelete('${l.id}')">🗑️ Hapus</button></td></tr>`).join("")||'<tr><td colspan="6" class="mut">Tidak ada lisensi pada filter ini.</td></tr>'}</table></div></div>`;
}

// ---- masa berlaku akses pegawai: tenants/<id>.licUntil = tanggal berakhir lisensi aktif TERLAMA-AKHIR (dibaca firestore.rules) ----
// Setelah lewat tanggal ini (atau 0 = tidak ada lisensi aktif) akun pegawai/HR otomatis ditolak database. Admin pelanggan tetap bisa masuk untuk memperpanjang.
async function licUntilCalc(tid){
  const s=await db.collection("licenses").where("tid","==",tid).get();let best=0,unl=false;
  s.docs.forEach(d=>{const l=d.data();if(l.kind==="perpanjang"||l.status!=="aktif")return;if(!l.expiresAt){unl=true;return}best=Math.max(best,l.expiresAt.toMillis())});
  return firebase.firestore.Timestamp.fromMillis(unl?4102444800000:best);
}
async function tenSyncLic(tid,quiet){
  try{const t=TENS.find(x=>x.id===tid),v=await licUntilCalc(tid);
    if(t&&t.licUntil&&t.licUntil.toMillis&&t.licUntil.toMillis()===v.toMillis())return false;
    await db.collection("tenants").doc(tid).update({licUntil:v});if(t)t.licUntil=v;return true}
  catch(e){if(!quiet)toast("Gagal sinkron masa berlaku akses: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message));return false}
}
async function tenSyncAll(manual){
  let n=0;for(const t of TENS){if(!manual&&t.licUntil!==undefined)continue;if(await tenSyncLic(t.id,!manual))n++}
  if(manual){toast(n?n+" pelanggan disinkronkan":"Semua pelanggan sudah sinkron");render()}
}
// hapus lisensi / riwayat permanen dari database (bukti bayar tersimpan di dokumen, jadi ini juga menghemat storage)
async function licDelete(id){
  const l=LIC.find(x=>x.id===id);if(!l)return;const ren=l.kind==="perpanjang";
  let kids=[];if(!ren){try{kids=(await db.collection("licenses").where("ref","==",id).get()).docs}catch(e){}}
  const counted=!ren&&l.status==="aktif",us=ren?[]:await licUsers(l);
  const ok=await uiConfirm(`Hapus PERMANEN ${ren?"perpanjangan ":""}${invNo(l)} milik ${l.tname||l.tid} dari database?\n${l.qty} akun · ${rp(l.total)} · status ${l.status}.\n`+
    (counted?`\nLisensi ini masih aktif: kuota pelanggan dikurangi ${l.qty} akun, dan pegawai langsung tidak bisa masuk bila tidak ada lisensi aktif lain.\n`:"")+
    (us.length?`\n${us.length} akun karyawan tertaut ke lisensi ini (akunnya tidak dihapus).\n`:"")+
    (kids.length?`\n${kids.length} permintaan perpanjangan terkait ikut dihapus.\n`:"")+
    `\nInvoice, token, dan bukti pembayaran ikut hilang dan tidak bisa dikembalikan.`,{title:"Hapus lisensi?",ok:"Hapus permanen",danger:true});
  if(!ok)return;
  try{
    await db.runTransaction(async tx=>{
      const lr=db.collection("licenses").doc(id),R=db.collection("tenants").doc(l.tid),a=await tx.get(lr);
      if(!a.exists)throw new Error("Lisensi sudah tidak ada. Muat ulang halaman.");
      const L=a.data(),cnt=L.kind!=="perpanjang"&&L.status==="aktif",t=cnt?await tx.get(R):null;
      if(t&&t.exists)tx.update(R,{quota:Math.max(0,(+t.data().quota||0)-(+L.qty||0)),lastLic:id});
      tx.delete(lr);kids.forEach(k=>tx.delete(k.ref));
    });
    await tenSyncLic(l.tid);
    toast("Lisensi dihapus dari database");render();
  }catch(e){toast("Gagal menghapus: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}
}
async function licUsers(l){try{return(await db.collection("tenants").doc(l.tid).collection("users").where("licId","==",l.id).get()).docs.map(d=>d.data().name||d.id)}catch(e){return[]}}
async function licDisable(id){
  const l=LIC.find(x=>x.id===id);if(!l)return;const us=await licUsers(l);
  if(!await uiConfirm(`Nonaktifkan lisensi ${invNo(l)} milik ${l.tname||l.tid}?\n${l.qty} akun${l.status==="aktif"?" · kuota pelanggan berkurang "+l.qty+" akun":" · token belum diaktifkan, token tidak bisa dipakai lagi"}.\n${us.length?us.length+" akun karyawan memakai lisensi ini ("+us.slice(0,6).join(", ")+(us.length>6?", ...":"")+"). Akun mereka tidak dihapus, tetapi bila pelanggan tidak punya lisensi aktif lain, semua pegawai/HR otomatis tidak bisa masuk sampai lisensi diaktifkan/diperpanjang (admin pelanggan tetap bisa masuk).":"Belum ada akun yang memakai lisensi ini."}\n\nBisa diaktifkan lagi kapan saja.`,{title:"Nonaktifkan lisensi?",ok:"Nonaktifkan",danger:true}))return;
  try{await db.runTransaction(async tx=>{const lr=db.collection("licenses").doc(id),R=db.collection("tenants").doc(l.tid),a=await tx.get(lr),t=await tx.get(R);if(!a.exists)throw new Error("Lisensi tidak ditemukan");const L=a.data();
    if(!["aktif","terbit"].includes(L.status))throw new Error("Status lisensi sudah berubah ("+L.status+"). Muat ulang halaman.");
    if(L.status==="aktif"&&t.exists)tx.update(R,{quota:Math.max(0,(+t.data().quota||0)-(+L.qty||0)),lastLic:id});
    tx.update(lr,{status:"nonaktif",disabledFrom:L.status,disabledAt:FV.serverTimestamp(),disabledBy:SU.id})});
    await tenSyncLic(l.tid);toast("Lisensi dinonaktifkan");render()}catch(e){toast("Gagal: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}
}
async function licEnable(id){
  const l=LIC.find(x=>x.id===id);if(!l)return;
  if(!await uiConfirm(`Aktifkan lagi lisensi ${invNo(l)} milik ${l.tname||l.tid}?${l.disabledFrom==="terbit"?"\nTokennya bisa dimasukkan lagi oleh admin pelanggan.":"\nKuota "+l.qty+" akun kembali ke pelanggan (kalau masa berlakunya belum lewat)."}`,{title:"Aktifkan lisensi?",ok:"Aktifkan"}))return;
  try{let out="";await db.runTransaction(async tx=>{const lr=db.collection("licenses").doc(id),R=db.collection("tenants").doc(l.tid),a=await tx.get(lr),t=await tx.get(R);if(!a.exists)throw new Error("Lisensi tidak ditemukan");const L=a.data();
    if(L.status!=="nonaktif")throw new Error("Lisensi ini tidak sedang nonaktif");
    const upd={disabledFrom:FV.delete(),disabledAt:FV.delete(),disabledBy:FV.delete()};
    if(L.disabledFrom==="terbit"){tx.update(lr,{...upd,status:"terbit"});out="Lisensi aktif lagi (menunggu token dimasukkan)"}
    else if(L.expiresAt&&L.expiresAt.toMillis()<Date.now()){tx.update(lr,{...upd,status:"kedaluwarsa"});out="Masa berlakunya sudah lewat, jadi statusnya kedaluwarsa. Setujui perpanjangan agar aktif lagi."}
    else{if(t.exists)tx.update(R,{quota:(+t.data().quota||0)+(+L.qty||0),lastLic:id});tx.update(lr,{...upd,status:"aktif"});out="Lisensi aktif lagi, kuota dikembalikan"}});
    await tenSyncLic(l.tid);toast(out);render()}catch(e){toast("Gagal: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}
}
// permintaan perpanjangan dari pelanggan: tidak ada token baru, cukup disetujui. Masa berlaku bertambah dari tanggal berakhir (atau dari hari ini bila sudah lewat).
function renewCard(l){
  const src=LIC.find(x=>x.id===l.ref)||{},cur=src.expiresAt?src.expiresAt.toMillis():0;
  return`<div class="req"><div class="row"><div><b>🔁 Perpanjangan: ${esc(l.tname||tname(l.tid))}</b> <small class="mut">(${esc(l.tid)}) · ${invNo(l)}</small><br>Lisensi <b>${src.id?invNo(src):"(tidak ditemukan)"}</b> · ${src.qty||"?"} akun · ${src.expiresAt?(cur>Date.now()?"berlaku sampai "+fdate(src.expiresAt):"<span style=\"color:var(--bad)\">sudah berakhir "+fdate(src.expiresAt)+"</span>"):"-"}${src.status&&src.status!=="aktif"?` <span class="tag no">${esc(licEff(src))}</span>`:""}<br>Minta <b>${l.qty} akun</b> × ${rp(l.price)} × <select id="pm_${l.id}" class="pmsel" onchange="renewMonths('${l.id}')">${[...new Set([1,2,3,4,5,6,9,12,24,lmo(l)])].sort((a,b)=>a-b).map(m=>`<option value="${m}"${m===lmo(l)?" selected":""}>${m} bulan</option>`).join("")}</select> = <b style="font-size:18px" id="pt_${l.id}">${rp(l.qty*l.price*lmo(l))}</b><br><small class="mut" id="pe_${l.id}">${renewPreview(l,lmo(l))}</small></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ok" onclick="renewApprove('${l.id}')">✅ Setujui perpanjangan</button><button class="btn ghost" onclick="licInvPdf('${l.id}')">🧾 Invoice PDF</button><button class="btn ghost" onclick="rejectLic('${l.id}')">Tolak</button></div></div>
    ${l.proof?`<div style="margin:8px 0"><b>Bukti pembayaran:</b><br><img src="${l.proof}" alt="Bukti" title="Klik untuk memperbesar" onclick="proofView(this.src)" style="max-width:240px;max-height:220px;border-radius:10px;border:1px solid var(--line);margin-top:4px;cursor:zoom-in"><br><small class="mut">Klik gambar untuk memperbesar</small></div>`:'<div class="mut" style="margin:6px 0"><small>Belum ada bukti pembayaran diunggah.</small></div>'}<small class="mut">Cek dulu ada transfer ${rp(l.total)} masuk ke ${esc(PAY.bank)} ${esc(PAY.no)}. Menyetujui TIDAK membuat token baru; masa berlaku lisensi yang ada langsung bertambah.</small></div>`;
}
function renewPreview(l,m){const src=LIC.find(x=>x.id===l.ref)||{},cur=src.expiresAt?src.expiresAt.toMillis():0;
  return"Setelah disetujui berlaku sampai "+addM(new Date(Math.max(Date.now(),cur)),m).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})+" · kuota pelanggan "+(src.status==="aktif"?(l.qty===src.qty?"tetap":"menjadi "+l.qty+" akun untuk lisensi ini"):"+"+l.qty+" akun (lisensi diaktifkan lagi)")}
function renewMonths(id){const l=LIC.find(x=>x.id===id);if(!l)return;const m=parseInt($("#pm_"+id).value)||1;$("#pt_"+id).textContent=rp(l.qty*l.price*m);const e=$("#pe_"+id);if(e)e.textContent=renewPreview(l,m)}
async function renewApprove(id){
  const r=LIC.find(x=>x.id===id);if(!r)return;const src=LIC.find(x=>x.id===r.ref);
  if(!src)return toast("Lisensi yang mau diperpanjang tidak ditemukan. Tolak permintaan ini.");
  if(!["aktif","kedaluwarsa"].includes(src.status))return toast(`Lisensi sumber berstatus "${src.status}", tidak bisa diperpanjang. Aktifkan dulu atau tolak permintaan ini.`);
  const mo=parseInt($("#pm_"+id).value)||lmo(r),tot=r.qty*r.price*mo,us=await licUsers(src);
  if(!await uiConfirm(`Setujui perpanjangan ${r.tname||r.tid}?\nLisensi ${invNo(src)}: ${src.qty} akun${r.qty!==src.qty?" → "+r.qty+" akun":""} · tambah ${mo} bulan · ${rp(tot)}${tot!==r.total?`\n(nominal berubah dari ${rp(r.total)})`:""}\n${r.qty<us.length?`\n⚠️ ${us.length} akun memakai lisensi ini tetapi jatah baru hanya ${r.qty} akun.\n`:""}\nTidak ada token baru. Pastikan pembayaran sudah masuk.`,{title:"Setujui perpanjangan?",ok:"Setujui"}))return;
  try{await db.runTransaction(async tx=>{
    const rr=db.collection("licenses").doc(id),lr=db.collection("licenses").doc(src.id),R=db.collection("tenants").doc(r.tid),a=await tx.get(rr),b=await tx.get(lr),t=await tx.get(R);
    if(!a.exists||a.data().status!=="menunggu")throw new Error("Permintaan ini sudah diproses.");
    if(!b.exists||!t.exists)throw new Error("Lisensi atau pelanggan tidak ditemukan.");
    const L=b.data(),T=t.data();if(!["aktif","kedaluwarsa"].includes(L.status))throw new Error("Status lisensi sudah berubah ("+L.status+"). Muat ulang halaman.");
    if(!L.expiresAt)throw new Error("Lisensi ini tanpa batas waktu, tidak perlu diperpanjang.");
    const now=Date.now(),start=Math.max(now,L.expiresAt.toMillis()),exp=firebase.firestore.Timestamp.fromDate(addM(new Date(start),mo)),counted=L.status==="aktif"?(+L.qty||0):0,nq=+r.qty||0;
    tx.update(lr,{status:"aktif",expiresAt:exp,qty:nq,renewedAt:FV.serverTimestamp(),lastRenewal:id,renewCount:FV.increment(1)});
    tx.update(R,{quota:Math.max(0,(+T.quota||0)-counted+nq),lastLic:src.id});
    tx.update(rr,{status:"diperpanjang",months:mo,total:tot,approvedAt:FV.serverTimestamp(),approvedBy:SU.id,newExpiresAt:exp,sentAt:FV.serverTimestamp(),sentBy:SU.id})});
    await tenSyncLic(r.tid);toast("Perpanjangan disetujui. Admin pelanggan langsung mendapat pemberitahuan.");
  }catch(e){toast("Gagal: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}
}

// ---------- Pelanggan ----------
// ringkasan lisensi per pelanggan: token aktif + tanggal berakhir terdekat, token yang sudah dipesan tapi belum aktif
function tenLic(id){
  const L=LIC.filter(l=>l.tid===id&&l.kind!=="perpanjang"),act=L.filter(l=>licEff(l)==="aktif"),exp=act.filter(l=>l.expiresAt).sort((a,b)=>a.expiresAt.toMillis()-b.expiresAt.toMillis())[0],
    dead=L.filter(l=>licEff(l)==="kedaluwarsa").sort((a,b)=>b.expiresAt.toMillis()-a.expiresAt.toMillis()),off=L.filter(l=>l.status==="nonaktif").length,
    wait=LIC.filter(l=>l.tid===id&&l.status==="menunggu").length,out=L.filter(l=>l.status==="terbit"),d=exp?dleft(exp.expiresAt):null;
  return(act.length?`<span class="tag ok">🎫 ${act.length} lisensi aktif</span>`:dead.length?'<span class="tag no">⌛ Lisensi kedaluwarsa</span>':'<span class="mut">Belum ada lisensi aktif</span>')+
    (exp?`<br><small ${d<=7?'style="color:var(--bad);font-weight:600"':'class="mut"'}>s/d ${fdate(exp.expiresAt)}${d>0?` · sisa ${d} hari`:" · berakhir"}</small>`:"")+
    (!act.length&&dead[0]?`<br><small style="color:var(--bad)">berakhir ${fdate(dead[0].expiresAt)}</small>`:act.length&&dead.length?`<br><small class="mut">⌛ ${dead.length} lisensi lain kedaluwarsa</small>`:"")+
    (off?`<br><small class="mut">⛔ ${off} dinonaktifkan</small>`:"")+
    (wait?`<br><small class="mut">⏳ ${wait} pesanan menunggu</small>`:"")+(out.length?`<br><small class="mut">📨 ${out.length} token belum diaktifkan: <span class="code" style="font-size:12px">${out.map(l=>esc(l.token)).join(", ")}</span></small>`:"");
}
const licWords=id=>{const L=LIC.filter(l=>l.tid===id&&l.kind!=="perpanjang").map(licEff);return[L.includes("aktif")?"aktif lisensi":"",L.includes("kedaluwarsa")?"kedaluwarsa expired berakhir":"",L.includes("nonaktif")?"dinonaktifkan":""].join(" ")};
async function renderTen(){
  await loadTens();
  return`<div class="box"><h3>Tambah pelanggan</h3><div class="fg" style="margin-bottom:18px"><div class="f"><label>Nama perusahaan</label><input id="tn" oninput="if(!$('#tc').dataset.m)$('#tc').value=slugOf(this.value);tcShow()"></div><div class="f" style="position:relative"><label>Kode / alamat link</label><input id="tc" data-search="0" autocomplete="off" placeholder="tokomaju" oninput="this.dataset.m=1;this.value=this.value.toLowerCase().replace(/[^a-z0-9]/g,'');tcShow()"><small class="mut" id="tcv" style="position:absolute;left:2px;top:100%;margin-top:2px;white-space:nowrap;font-size:12px"></small></div><div class="f"><label>Harga per akun (Rp)</label><input id="tp" type="text" inputmode="numeric" class="rpin" value="${(PAY.price||3500).toLocaleString("id-ID")}"></div><div class="f"><label>Kuota awal (gratis)</label><input id="tq" type="number" value="0"></div></div>
  <div class="fg"><div class="f"><label>Nama admin pelanggan</label><input id="an"></div><div class="f"><label>Email admin (untuk login)</label><input id="ae" type="email"></div><div class="f"><label>Password admin (min 6)</label><input id="ap" type="text" value="${crand("abcdefghjkmnpqrstuvwxyz23456789",8)}"></div></div>
  <button class="btn" onclick="tenAdd()">Buat pelanggan + akun admin</button><p class="mut" style="margin-top:8px"><small>Admin pelanggan langsung bisa login dan melihat semua fitur. Akun admin tidak memakai kuota. Super admin tidak tampil di aplikasi mereka.</small></p></div>
  <div class="box"><h3>Alamat web pelanggan</h3><div class="row"><input id="cb" style="flex:1;min-width:240px" placeholder="https://namapelanggan.wuaze.com" value="${esc(base())}"><button class="btn ghost" onclick="try{localStorage.setItem('custBase',$('#cb').value.trim())}catch(e){}toast('Tersimpan');render()">Simpan</button></div><small class="mut">Dipakai untuk membuat link pelanggan, contoh hasilnya: ${esc(base()||"https://namaweb.com")}/tokomaju</small></div>
  <div class="box"><div class="row" style="gap:10px;align-items:center;margin-bottom:10px"><h3 style="margin:0">Pelanggan (<span id="tcnt">${TENS.length}</span>)</h3><span style="flex:1"></span><input id="tsq" type="search" data-search="0" placeholder="🔍 Cari nama, kode, atau status..." oninput="tenFilter()" style="max-width:340px"></div><div class="tw"><table><tr><th>Perusahaan</th><th>Kode</th><th>Kuota</th><th>Harga/bulan</th><th>Lisensi (token)</th><th>Status</th><th></th></tr>${TENS.map(t=>`<tr data-q="${esc((t.name+" "+t.id+" "+(t.slug||"")+" "+t.status+" "+licWords(t.id)).toLowerCase())}"><td><b>${esc(t.name)}</b><br><small class="mut">${tm(t.createdAt)}</small></td><td class="code" style="font-size:14px">${esc(t.slug||t.id)}${t.slug?`<br><small class="mut" style="font-size:11px">${esc(t.id)}</small>`:""}</td><td>${+t.used||0} / ${+t.quota||0}</td><td>${rp(t.price)}</td><td>${tenLic(t.id)}</td><td><span class="tag ${t.status==="aktif"?"ok":"no"}">${esc(t.status)}</span></td>
   <td style="white-space:nowrap"><button class="btn sm" onclick="tenDetail('${t.id}')">Detail</button> <button class="btn ghost sm" onclick="tenLink('${t.id}')">Link</button> <button class="btn ghost sm" onclick="tenEdit('${t.id}')">Kuota/Harga</button> <button class="btn ${t.status==="aktif"?"red":"ok"} sm" onclick="tenToggle('${t.id}')">${t.status==="aktif"?"Nonaktifkan":"Aktifkan"}</button> <button class="btn ghost sm" style="color:#dc2626" title="Hapus pelanggan beserta seluruh datanya" onclick="tenDel('${t.id}')">🗑 Hapus</button></td></tr>`).join("")||'<tr><td colspan="8" class="mut">Belum ada pelanggan.</td></tr>'}</table></div></div>`;
}
function tcShow(){const e=$("#tcv");if(e)e.textContent=$("#tc").value?(base()||"https://alamatweb")+"/"+$("#tc").value:""}
async function tenAdd(){
  const name=$("#tn").value.trim(),an=$("#an").value.trim(),ae=$("#ae").value.trim(),ap=$("#ap").value;
  if(!name||!an||!ae||ap.length<6)return toast("Isi nama perusahaan, nama admin, email, dan password admin (min 6)");
  const want=($("#tc").value||slugOf(name)).toLowerCase();
  if(!slugOk(want))return toast("Kode link harus 3-30 huruf kecil/angka tanpa spasi, dan bukan nama yang dipakai sistem (css, js, img, icons, sa...)");
  let code="";
  if(!(await db.collection("tenants").doc(want).get()).exists)code=want;
  else{for(let i=2;i<30&&!code;i++){const c=want+i;if(!(await db.collection("tenants").doc(c).get()).exists)code=c}
    if(code)toast("Kode "+want+" sudah dipakai, otomatis jadi "+code)}
  if(!code)return toast("Kode link sudah dipakai, ganti yang lain");
  const sec=firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(firebaseConfig,"sec");
  let uid;try{uid=(await sec.auth().createUserWithEmailAndPassword(ae,ap)).user.uid;await sec.auth().signOut()}
  catch(e){return toast(e.code==="auth/email-already-in-use"?"Email admin itu sudah terdaftar. Pakai email lain.":e.message)}
  const b=db.batch(),R=db.collection("tenants").doc(code);
  b.set(R,{name,price:num($("#tp").value)||3500,quota:parseInt($("#tq").value)||0,used:0,status:"aktif",createdAt:FV.serverTimestamp()});
  b.set(R.collection("users").doc(uid),{name:an,email:ae,role:"admin",jabatan:"Admin",pwDone:true});
  await b.commit();await loadTens();toast("Pelanggan dibuat");tenLink(code,ae,ap);
}
let TLC=null;
function tenLink(id,em,pw){
  if(em)TLC={id,em,pw};else if(TLC&&TLC.id===id)({em,pw}=TLC);
  const t=TENS.find(x=>x.id===id)||{},sl=t.slug||id,cred=em?`Email: ${em}\nPassword: ${pw}\n`:"";
  $("#dmc").innerHTML=`<div class="row"><h3>Kirim ke ${esc(t.name)}</h3><button class="btn ghost sm" onclick="$('#dm').style.display='none'">Tutup</button></div>
  ${em?`<p class="mut" style="margin-bottom:6px">Akun admin pelanggan (catat sekarang, password tidak ditampilkan lagi):</p><pre>${esc(cred)}</pre>`:""}
  <p class="mut" style="margin:10px 0 8px">Cara 1: beri link ini, lalu pelanggan login dengan akun admin di atas.</p><pre>${esc(linkOf(sl))}</pre><button class="btn sm" onclick="copy('${esc(linkOf(sl))}','Link disalin')">Salin link</button>
  <p class="mut" style="margin:14px 0 6px">Kode di belakang alamat web (boleh diganti, huruf kecil/angka):</p><div class="row" style="gap:8px"><input id="tsl" data-search="0" autocomplete="off" value="${esc(sl)}" style="max-width:240px" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9]/g,'')"><button class="btn sm" onclick="tenSlug('${id}')">Simpan kode</button></div>
  <p class="mut" style="margin:10px 0 4px"><small>Kalau link di atas tidak terbuka (hosting tidak mendukung file .htaccess), pakai link cadangan: <b>${esc(linkOld(sl))}</b></small></p>
  <p class="mut" style="margin:14px 0 8px">Cara 2: kalau web diberikan sebagai paket sendiri, isi file <b>js/pelanggan.js</b> dengan:</p><pre>window.TENANT_ID="${esc(id)}";</pre><button class="btn sm" onclick="copy('window.TENANT_ID=&quot;${esc(id)}&quot;;','Disalin')">Salin isi file</button>
  <p class="mut" style="margin-top:14px"><small>Kode data (tetap, tidak bisa diganti): <b>${esc(id)}</b></small></p>`;$("#dm").style.display="block";
}
function tenFilter(){const q=($("#tsq").value||"").toLowerCase().trim().split(/\s+/).filter(Boolean);let n=0;
  document.querySelectorAll("tr[data-q]").forEach(r=>{const ok=q.every(w=>r.dataset.q.includes(w));r.style.display=ok?"":"none";if(ok)n++});const c=$("#tcnt");if(c)c.textContent=q.length?n+" dari "+TENS.length:TENS.length}
// Hapus pelanggan + seluruh datanya (Firestore, foto di Storage, token lisensi). Akun login (Firebase Auth) tidak bisa dihapus dari browser.
const TEN_COLS=["users","settings","requests","attendance","schedules","payslips","resetReq","credentials","audit","seatLog"];
let DELBUSY=false;
async function wipeCol(q){let n=0;for(;;){const s=await q.limit(400).get();if(s.empty)break;const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit();n+=s.size;if(s.size<400)break}return n}
const withTO=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error("Storage tidak merespons (waktu habis)")),ms))]);
async function wipeStore(ref){let n=0;const l=await withTO(ref.listAll(),12000);try{for(const f of l.items){try{await f.delete();n++}catch(e){}}for(const p of l.prefixes)n+=await wipeStore(p)}catch(e){}return n}
async function tenDel(id){
  if(DELBUSY)return;const t=TENS.find(x=>x.id===id);if(!t)return;
  const f=await uiForm(`Pelanggan "${t.name}" beserta SEMUA datanya (karyawan, absensi, pengajuan, slip gaji, pengaturan, foto, dan riwayat lisensi/token) akan dihapus permanen dari database. Salinan backup (.json) diunduh otomatis lebih dulu, simpan baik-baik kalau suatu saat perlu dipulihkan.\n\nKetik kode pelanggan di bawah untuk melanjutkan: ${id}`,{title:"Hapus pelanggan?",ok:"Hapus permanen",danger:true,fields:[{key:"c",label:"Kode pelanggan",value:""}]});
  if(!f)return;if(String(f.c||"").trim().toLowerCase()!==id)return toast("Kode tidak cocok, penghapusan dibatalkan");
  DELBUSY=true;const L=[];
  const show=(err)=>{$("#dmc").innerHTML=`<div class="row"><h3>Menghapus ${esc(t.name)}</h3>${err||!DELBUSY?'<button class="btn ghost sm" onclick="$(\'#dm\').style.display=\'none\'">Tutup</button>':""}</div><div style="margin:10px 0;font-size:14px;line-height:1.7">${L.map(x=>"• "+esc(x)).join("<br>")}</div>${err?`<p style="color:#dc2626;font-weight:600">Gagal pada langkah terakhir: ${esc(err)}</p><p class="mut"><small>Data yang sudah terhapus tidak bisa dikembalikan kecuali dari backup. Perbaiki penyebabnya (biasanya firestore.rules belum dipublish), lalu klik Hapus lagi untuk melanjutkan.</small></p>`:""}`;$("#dm").style.display="block"};
  const step=async(txt,fn)=>{L.push(txt+" …");show();try{const r=await fn();L[L.length-1]=txt+" ✓"+(r?" ("+r+")":"");show();return r}catch(e){L[L.length-1]=txt+" ✗";throw new Error(txt+": "+(e.code?e.code+" - ":"")+(e.message||e))}};
  try{
    await step("Mengunduh backup",()=>bkDownload([id],{aud:false,cred:false}).then(n=>n+" dokumen"));
    const R=db.collection("tenants").doc(id);
    for(const c of TEN_COLS)await step("Menghapus "+c,()=>wipeCol(R.collection(c)).then(n=>n+" dokumen"));
    await step("Menghapus lisensi/token",()=>wipeCol(db.collection("licenses").where("tid","==",id)).then(n=>n+" dokumen"));
    try{await step("Menghapus foto",async()=>{let fo=0;const st=SAPP.storage();try{st.setMaxOperationRetryTime(6000);st.setMaxUploadRetryTime(6000)}catch(e){}for(const r of["bukti","photos"])fo+=await wipeStore(st.ref(r+"/"+id));return fo+" file"})}catch(e){L.push("Foto dilewati (bisa dihapus manual di Firebase Storage folder bukti/"+id+" dan photos/"+id+")")}
    if(t.slug)await db.collection("tenantAlias").doc(t.slug).delete().catch(()=>{});
    await step("Menghapus data pelanggan",()=>R.delete());
    DELBUSY=false;L.push("Selesai.");show();toast("Pelanggan dihapus");await loadTens();render();
  }catch(e){DELBUSY=false;show(e.message);toast("Gagal menghapus, lihat keterangan di jendela");try{await loadTens()}catch(x){}render()}
}
async function tenSlug(id){
  const v=($("#tsl").value||"").trim().toLowerCase(),t=TENS.find(x=>x.id===id);if(!t)return;const old=t.slug||id;
  if(v===old)return toast("Kode tidak berubah");
  if(!slugOk(v))return toast("Kode harus 3-30 huruf kecil/angka tanpa spasi, dan bukan nama yang dipakai sistem (css, js, img, icons, sa...)");
  try{
    if(v!==id){
      if((await db.collection("tenants").doc(v).get()).exists)return toast("Kode itu sudah dipakai pelanggan lain");
      const a=await db.collection("tenantAlias").doc(v).get();if(a.exists&&a.data().id!==id)return toast("Kode itu sudah dipakai pelanggan lain");
    }
    const b=db.batch(),R=db.collection("tenants").doc(id);
    if(v===id){b.update(R,{slug:FV.delete()});}else{b.set(db.collection("tenantAlias").doc(v),{id});b.update(R,{slug:v})}
    if(t.slug&&t.slug!==v)b.delete(db.collection("tenantAlias").doc(t.slug));
    await b.commit();await loadTens();toast("Kode link disimpan");tenLink(id);render();
  }catch(e){toast("Gagal: "+(e.code==="permission-denied"?"publish dulu firestore.rules terbaru":e.message))}
}
async function tenEdit(id){const t=TENS.find(x=>x.id===id);const f=await uiForm(`${t.name} · saat ini terpakai ${+t.used||0} akun.`,{title:"Kuota & harga",ok:"Simpan",fields:[{key:"q",label:"Kuota akun",value:+t.quota||0,mode:"numeric"},{key:"p",label:"Harga per akun (Rp)",value:+t.price||3500,mode:"numeric",money:true}]});if(!f)return;
  await db.collection("tenants").doc(id).update({quota:Math.max(0,parseInt(f.q)||0),price:Math.max(0,parseInt(f.p)||3500)});toast("Tersimpan");render()}
async function tenToggle(id){const t=TENS.find(x=>x.id===id),on=t.status==="aktif";if(!await uiConfirm(on?`Nonaktifkan ${t.name}? Semua akun mereka tidak bisa dipakai sampai diaktifkan lagi.`:`Aktifkan kembali ${t.name}?`,on?{title:"Nonaktifkan pelanggan?",ok:"Nonaktifkan",danger:true}:{title:"Aktifkan pelanggan?",ok:"Aktifkan"}))return;
  await db.collection("tenants").doc(id).update({status:on?"nonaktif":"aktif"});toast("Status diubah");render()}
async function tenDetail(id){
  const t=TENS.find(x=>x.id===id)||{},R=db.collection("tenants").doc(id),td=ymd(new Date());
  const[us,at,rq,sl]=await Promise.all([R.collection("users").get(),R.collection("attendance").where("date","==",td).get(),R.collection("requests").where("status","==","menunggu").get(),R.collection("seatLog").orderBy("ts","desc").limit(100).get().catch(()=>({docs:[]}))]);
  const U=us.docs.map(d=>({id:d.id,...d.data()})),nm=Object.fromEntries(U.map(u=>[u.id,u.name]));
  $("#dmc").innerHTML=`<div class="row"><h3>${esc(t.name)} <small class="mut">(${esc(id)})</small></h3><button class="btn ghost sm" onclick="$('#dm').style.display='none'">Tutup</button></div>
  <div class="stats"><div class="st"><b>${U.length}</b>Akun</div><div class="st"><b>${+t.used||0}/${+t.quota||0}</b>Kursi terpakai</div><div class="st"><b>${at.size}</b>Absen hari ini</div><div class="st"><b>${rq.size}</b>Pengajuan menunggu</div></div>
  <h3>Karyawan</h3><div class="tw"><table><tr><th>Nama</th><th>Role</th><th>Jabatan</th><th>Email</th><th>Memakai lisensi</th></tr>${U.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.role||"")}</td><td>${esc(u.jabatan||"-")}</td><td>${esc(u.email||"")}</td><td>${licOf(u)}</td></tr>`).join("")}</table></div>
  <h3 style="margin-top:14px">Absen hari ini</h3><div class="tw"><table>${at.docs.map(d=>d.data()).map(a=>`<tr><td>${esc(nm[a.uid]||a.uid)}</td><td>${esc(a.in||"-")} - ${esc(a.out||"-")}</td><td><span class="tag ${a.status==="normal"?"ok":"no"}">${esc(a.status)}</span></td></tr>`).join("")||'<tr><td class="mut">Belum ada.</td></tr>'}</table></div>
  <h3 style="margin-top:14px">Lisensi & token</h3><div class="tw"><table><tr><th>Waktu</th><th>Pelanggan</th><th>Akun</th><th>Periode</th><th>Total</th><th>Status / token</th><th>Berlaku sampai</th><th>PDF</th></tr>${LIC.filter(l=>l.tid===id).map(licRow).join("")||'<tr><td colspan="8" class="mut">Belum ada.</td></tr>'}</table></div>
  <h3 style="margin-top:14px">Riwayat akun karyawan & lisensinya</h3><div class="tw"><table><tr><th>Waktu</th><th>Aksi</th><th>Akun</th><th>Lisensi yang dipakai</th><th>Oleh</th></tr>${sl.docs.map(d=>d.data()).map(x=>{const l=LIC.find(y=>y.id===x.licId);return`<tr><td>${tm(x.ts)}</td><td><span class="tag ${x.action==="hapus"?"no":x.action==="tambah"?"ok":"bl"}">${esc(x.action)}</span></td><td>${esc(x.name||x.uid)} <small class="mut">${esc(x.role||"")}</small></td><td>${l?invNo(l)+" · "+l.qty+" akun":'<span class="mut">-</span>'}</td><td>${esc(x.byName||"-")}</td></tr>`}).join("")||'<tr><td colspan="5" class="mut">Belum ada riwayat (tercatat sejak fitur ini aktif).</td></tr>'}</table></div>`;
  $("#dm").style.display="block";
}


// Perbesar bukti pembayaran (data: URL tidak bisa dibuka lewat link di tab baru, jadi ditampilkan di lapisan sendiri)
function proofView(src){
  const o=document.createElement("div");o.style.cssText="position:fixed;inset:0;z-index:500;background:rgba(15,23,42,.88);display:flex;align-items:center;justify-content:center;padding:16px;cursor:zoom-out";
  const im=document.createElement("img");im.src=src;im.style.cssText="max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;background:#fff";
  const x=document.createElement("button");x.textContent="✕ Tutup";x.className="btn ghost sm";x.style.cssText="position:absolute;top:14px;right:14px";
  const close=()=>{o.remove();document.removeEventListener("keydown",kd)},kd=e=>{if(e.key==="Escape")close()};
  o.onclick=close;document.addEventListener("keydown",kd);o.append(im,x);document.body.appendChild(o);
}

// ---------- Backup & pemulihan data pelanggan ----------
// File JSON berisi dokumen pelanggan + seluruh koleksinya + token lisensi. Salinan password (credentials) dan audit log hanya ikut kalau dicentang.
// Foto di Firebase Storage tidak ikut (hanya path-nya yang ada di dokumen). File TIDAK terenkripsi, simpan di tempat aman.
const BK_COLS=["users","settings","requests","attendance","schedules","payslips","resetReq","seatLog"];
const bkVal=(k,v)=>v&&typeof v==="object"&&typeof v.toMillis==="function"?{__ts:v.toMillis()}:v;
const bkRev=v=>{if(Array.isArray(v))return v.map(bkRev);if(v&&typeof v==="object"){const k=Object.keys(v);if(k.length===1&&k[0]==="__ts"&&typeof v.__ts==="number")return firebase.firestore.Timestamp.fromMillis(v.__ts);const o={};k.forEach(x=>o[x]=bkRev(v[x]));return o}return v};
async function bkCol(q){const out={};let last=null;for(;;){let p=q.orderBy(firebase.firestore.FieldPath.documentId());if(last)p=p.startAfter(last);const s=await p.limit(300).get();s.docs.forEach(d=>out[d.id]=d.data());last=s.docs[s.docs.length-1];if(s.size<300)break}return out}
async function bkTenant(id,o,say){
  const R=db.collection("tenants").doc(id),d=await R.get();if(!d.exists)throw new Error("Pelanggan "+id+" tidak ditemukan");
  const cols={},list=[...BK_COLS,...(o.aud?["audit"]:[]),...(o.cred?["credentials"]:[])];
  for(const c of list){say&&say(`${tname(id)}: mengambil ${c}…`);cols[c]=await bkCol(R.collection(c))}
  say&&say(`${tname(id)}: mengambil lisensi…`);
  return{id,tenant:d.data(),collections:cols,licenses:await bkCol(db.collection("licenses").where("tid","==",id))};
}
function bkSave(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function bkDownload(ids,o,say){
  const T=[];for(const id of ids)T.push(await bkTenant(id,o,say));
  const n=T.reduce((a,t)=>a+Object.values(t.collections).reduce((x,c)=>x+Object.keys(c).length,0)+Object.keys(t.licenses).length,0);
  const pack={app:"absensi-tenant-backup",format:1,exportedAt:new Date().toISOString(),includes:{audit:!!o.aud,credentials:!!o.cred},
    note:"Foto di Firebase Storage tidak ikut. Audit log hanya arsip (tidak dipulihkan). File tidak terenkripsi: simpan di tempat aman.",tenants:T};
  const nm=ids.length===1?ids[0]:"semua-pelanggan";bkSave(`backup-${nm}-${ymd(new Date())}.json`,JSON.stringify(pack,bkVal));
  try{const m={};ids.forEach(i=>m[i]=Date.now());await db.collection("superMeta").doc("backups").set(m,{merge:true});BKT={...BKT,...m}}catch(e){}
  return n;
}
let BKT={},BKF=null;
async function renderBak(){
  await loadTens();try{const d=await db.collection("superMeta").doc("backups").get();BKT=d.exists?d.data():{}}catch(e){}
  const ago=t=>{if(!t)return'<span style="color:#dc2626">belum pernah</span>';const d=Math.floor((Date.now()-t)/864e5);return esc(tm(t))+(d>=7?` <small style="color:#dc2626">(${d} hari lalu)</small>`:"")};
  return`<div class="box"><h3>Backup data pelanggan</h3><p class="mut" style="margin-bottom:10px">Unduh salinan seluruh data pelanggan (karyawan, absensi, pengajuan, slip gaji, pengaturan, lisensi) ke file JSON. Simpan di tempat aman, misalnya Google Drive pribadi atau hard disk.</p>
  <div class="row" style="gap:18px;flex-wrap:wrap;margin-bottom:12px"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="bkAud" style="width:auto"> Sertakan audit log (arsip)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="bkCred" style="width:auto"> Sertakan salinan password karyawan <small class="mut">(berisiko)</small></label></div>
  <button class="btn" onclick="bkRun()" ${TENS.length?"":"disabled"}>💾 Backup semua pelanggan</button> <span id="bkSt" class="mut" style="margin-left:8px"></span>
  <div class="tw" style="margin-top:14px"><table><tr><th>Perusahaan</th><th>Kode</th><th>Backup terakhir</th><th></th></tr>${TENS.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td class="code" style="font-size:14px">${esc(t.id)}</td><td>${ago(BKT[t.id])}</td><td><button class="btn ghost sm" onclick="bkRun('${t.id}')">💾 Backup</button></td></tr>`).join("")||'<tr><td colspan="4" class="mut">Belum ada pelanggan.</td></tr>'}</table></div></div>
  <div class="box"><h3>Pulihkan dari file backup</h3><p class="mut" style="margin-bottom:10px">Pilih file backup (.json) hasil unduhan di atas. Pelanggan yang sudah dihapus akan dibuat lagi dengan kode yang sama. Akun login admin harus masih ada di Firebase Authentication agar bisa masuk kembali.</p>
  <input type="file" id="rsFile" accept=".json,application/json" data-search="0" onchange="bkRead(this)"><div id="rsBox"></div></div>`;
}
async function bkRun(id){
  const st=$("#bkSt"),o={aud:$("#bkAud").checked,cred:$("#bkCred").checked};
  if(o.cred&&!await uiConfirm("File akan memuat password karyawan dalam teks biasa. Pastikan disimpan sangat aman. Lanjutkan?",{title:"Sertakan password?",ok:"Lanjutkan",danger:true}))return;
  document.querySelectorAll("#view button").forEach(b=>b.disabled=true);
  try{const n=await bkDownload(id?[id]:TENS.map(t=>t.id),o,m=>{st.textContent=m});toast("Backup diunduh");}catch(e){st.textContent="Gagal: "+(e.message||e);document.querySelectorAll("#view button").forEach(b=>b.disabled=false);return}
  render();
}
async function bkRead(inp){
  const f=inp.files[0],box=$("#rsBox");BKF=null;box.innerHTML="";if(!f)return;
  try{const j=JSON.parse(await f.text());if(j.app!=="absensi-tenant-backup"||!Array.isArray(j.tenants))throw new Error("Bukan file backup pelanggan dari menu ini");BKF=j;
    const cnt=t=>Object.values(t.collections||{}).reduce((a,c)=>a+Object.keys(c).length,0);
    box.innerHTML=`<p class="mut" style="margin:12px 0 6px">Backup tanggal <b>${esc(tm(Date.parse(j.exportedAt)))}</b> · ${j.tenants.length} pelanggan</p>
    <div class="tw"><table><tr><th></th><th>Perusahaan</th><th>Kode</th><th>Dokumen</th><th>Lisensi</th><th>Status sekarang</th></tr>${j.tenants.map((t,i)=>`<tr><td><input type="checkbox" class="rsck" data-i="${i}" checked style="width:auto"></td><td><b>${esc((t.tenant||{}).name||"-")}</b></td><td class="code" style="font-size:14px">${esc(t.id)}</td><td>${cnt(t)}</td><td>${Object.keys(t.licenses||{}).length}</td><td>${TENS.some(x=>x.id===t.id)?"ada (akan ditimpa)":'<span class="mut">tidak ada (dibuat baru)</span>'}</td></tr>`).join("")}</table></div>
    <label style="display:flex;gap:6px;align-items:center;margin:12px 0"><input type="checkbox" id="rsWipe" style="width:auto"> Kosongkan data pelanggan dulu, lalu isi dari backup <small class="mut">(pemulihan penuh; tanpa ini, data di file menimpa dokumen yang sama dan data lain dibiarkan)</small></label>
    <button class="btn" onclick="bkRestore()">♻️ Pulihkan</button> <span id="rsSt" class="mut" style="margin-left:8px"></span>`;
  }catch(e){box.innerHTML=`<p style="color:#dc2626;margin-top:10px">${esc(e.message)}</p>`}
}
async function bkRestore(){
  if(!BKF)return;const sel=[...document.querySelectorAll(".rsck:checked")].map(c=>BKF.tenants[+c.dataset.i]),wipe=$("#rsWipe").checked,st=$("#rsSt");
  if(!sel.length)return toast("Pilih minimal satu pelanggan");
  if(!await uiConfirm(`Pulihkan ${sel.length} pelanggan (${sel.map(t=>(t.tenant||{}).name||t.id).join(", ")}) dari backup?${wipe?" Data yang ada sekarang akan DIHAPUS dulu.":" Dokumen yang sama akan ditimpa."} Audit log tidak dipulihkan.`,{title:"Pulihkan data?",ok:"Pulihkan",danger:wipe}))return;
  document.querySelectorAll("#view button").forEach(b=>b.disabled=true);let tot=0;
  try{
    for(const t of sel){
      const R=db.collection("tenants").doc(t.id),nm=(t.tenant||{}).name||t.id;
      if(wipe){for(const c of Object.keys(t.collections||{}).filter(c=>c!=="audit")){st.textContent=`${nm}: mengosongkan ${c}…`;await wipeCol(R.collection(c))}
        if(Object.keys(t.licenses||{}).length){await wipeCol(db.collection("licenses").where("tid","==",t.id))}}
      await R.set(bkRev(t.tenant||{}),{merge:true});
      if((t.tenant||{}).slug)await db.collection("tenantAlias").doc(t.tenant.slug).set({id:t.id});
      const jobs=[];for(const[c,m]of Object.entries(t.collections||{})){if(c==="audit")continue;for(const[i,d]of Object.entries(m))jobs.push([R.collection(c).doc(i),d])}
      for(const[i,d]of Object.entries(t.licenses||{}))jobs.push([db.collection("licenses").doc(i),d]);
      for(let k=0;k<jobs.length;k+=400){st.textContent=`${nm}: menulis ${Math.min(k+400,jobs.length)} / ${jobs.length}…`;const b=db.batch();jobs.slice(k,k+400).forEach(([r,d])=>b.set(r,bkRev(d)));await b.commit()}
      tot+=jobs.length;
    }
    toast(`Pemulihan selesai: ${tot} dokumen`);await loadTens();render();
  }catch(e){st.textContent="Gagal: "+(e.message||e)+". Pastikan firestore.rules terbaru sudah dipublish.";document.querySelectorAll("#view button").forEach(b=>b.disabled=false)}
}

// ---------- Pengaturan ----------
async function renderSet(){
  return brandBox()+`<div class="box"><h3>Perusahaan penyedia & rekening pembayaran</h3><p class="mut" style="margin-bottom:10px">Ditampilkan ke admin pelanggan saat mengajukan lisensi, dan dicetak di PDF token & invoice. Nama perusahaan tampil sebagai penerbit dokumen; "Atas nama" hanya untuk rekening transfer.</p><div class="fg"><div class="f"><label>Nama perusahaan penyedia</label><input id="pc" maxlength="80" placeholder="mis. PT Lapak Digital Indonesia" value="${esc(PAY.company||"")}"></div><div class="f"><label>Bank</label><input id="pb" value="${esc(PAY.bank)}"></div><div class="f"><label>No. rekening</label><input id="pn" value="${esc(PAY.no)}"></div><div class="f"><label>Atas nama</label><input id="pa" value="${esc(PAY.name)}"></div><div class="f"><label>No. WhatsApp penyedia layanan</label><input id="pw2" placeholder="08123456789" inputmode="tel" value="${esc(PAY.wa||"")}"></div><div class="f"><label>Harga bawaan per akun (Rp)</label><input id="pp" type="text" inputmode="numeric" class="rpin" value="${(PAY.price||3500).toLocaleString("id-ID")}"></div></div><button class="btn" onclick="savePay()">Simpan</button></div>`;
}
async function savePay(){const n={company:$("#pc").value.trim(),bank:$("#pb").value.trim(),no:$("#pn").value.trim(),name:$("#pa").value.trim(),price:num($("#pp").value)||3500,wa:$("#pw2").value.trim()};if(!n.company)return toast("Nama perusahaan penyedia wajib diisi");if(!n.no||!n.name)return toast("Nomor rekening dan nama wajib diisi");await db.collection("superMeta").doc("pay").set(n);PAY=n;toast("Tersimpan")}
