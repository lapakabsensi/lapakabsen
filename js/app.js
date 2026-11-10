const firebaseConfig = {
  apiKey: "AIzaSyAGhld-uiOVCnTb6TJIzWYw3aBghBEGblY",
  authDomain: "absen-per-kepala.firebaseapp.com",
  projectId: "absen-per-kepala",
  storageBucket: "absen-per-kepala.firebasestorage.app",
  messagingSenderId: "960030564944",
  appId: "1:960030564944:web:b1e8fd543c8ddff59a6755",
  measurementId: "G-0JFRDJP8CF"
};
firebase.initializeApp(firebaseConfig);
try{TENANT=tenResolve(TENANT,firebaseConfig)}catch(e){}
const auth=firebase.auth(),db=tdb(firebase.firestore()),$=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,"0"),ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,hm=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const mn=t=>{const[a,b]=t.split(":");return+a*60+ +b};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rp=n=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
const BLN=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const PTKP={TK0:54e6,TK1:58.5e6,TK2:63e6,TK3:67.5e6,K0:58.5e6,K1:63e6,K2:67.5e6,K3:72e6};
let ME,SET={in:"09:00",out:"18:00",tol:0,cutoff:1,tz:7},view="home",STREAM,EDIT=null,AFTER=null,BUSY=false,PM=ymd(new Date()).slice(0,7),USERS=[];
const ADMIN=()=>ME&&ME.role==="admin";
const toast=m=>{const t=$("#toast");t.textContent=typeof trs==="function"?trs(m):m;t.style.display="block";clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display="none",3500)};
addEventListener("unhandledrejection",e=>toast("Error: "+(e.reason?.message||e.reason)));
const get=async(c,f,v)=>(await(f?db.collection(c).where(f,"==",v):db.collection(c)).get()).docs.map(d=>({id:d.id,...d.data()}));
// Jadwal shift bergilir: koleksi "schedules" (id = uid_tanggal) menimpa jam default untuk tanggal itu. SCH = cache jadwal milik ME (diisi schLoad, js/shift.js).
// Tanpa jadwal (atau jadwal "Libur") dipakai jam default karyawan / Jadwal Kerja. Tanggal = tanggal shift DIMULAI.
let SCH={},SCH_T=0;
const shift=(u=ME,date)=>{
  const b={in:u.shiftIn||SET.in,out:u.shiftOut||SET.out,tol:u.tol!=null?+u.tol:(+SET.tol||0)},s=SCH[u.id+"_"+(date||ymd(new Date()))];
  if(!s)return b;if(s.off)return{...b,off:true,name:"Libur"};
  return{in:s.in,out:s.out,tol:s.tol!=null?+s.tol:b.tol,name:s.name||"",sid:s.shiftId||""};
};
function period(){const n=new Date(),c=+SET.cutoff||1,s=new Date(n.getFullYear(),n.getDate()>=c?n.getMonth():n.getMonth()-1,c);return[s,new Date(s.getFullYear(),s.getMonth()+1,c-1)]}
const plabel=()=>{const[s,e]=period();return`${s.getDate()} ${BLN[s.getMonth()]} - ${e.getDate()} ${BLN[e.getMonth()]}`};
const myAtt=async()=>{const[s,e]=period();return(await get("attendance","uid",ME.id)).filter(a=>a.date>=ymd(s)&&a.date<=ymd(e)).sort((a,b)=>b.date.localeCompare(a.date))};
const head=(t,s="")=>`<div class="hd"><h1>${t}</h1><span class="mut">${s}</span></div>`;
const tag=s=>`<span class="tag ${s==="disetujui"||s==="normal"?"ok":s==="ditolak"||s==="abnormal"?"no":""}">${esc(s)}</span>`;
function csv(name,rows){const l=document.createElement("a");l.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv"}));l.download=name;l.click()}
const num=el=>+String(el.value).replace(/\D/g,"")||0;
const fm=el=>{const d=el.value.replace(/\D/g,"");el.value=d?(+d).toLocaleString("id-ID"):""};
const fld=(id,l,t,o,v="")=>`<div class="f"><label>${l}</label>`+(t==="select"?`<select id="${id}">${o.map(x=>`<option value="${x}"${x==v?" selected":""}>${x}</option>`).join("")}</select>`:t==="textarea"?`<textarea id="${id}" rows="3">${esc(v)}</textarea>`:t==="money"?`<input id="${id}" class="money" inputmode="numeric" value="${v===""?"":Number(v).toLocaleString("id-ID")}" oninput="fm(this)">`:`<input id="${id}" type="${t}" value="${esc(v)}">`)+"</div>";
const fv=(x,k)=>esc(x[k]||"-")+(x[k+"Field"]?'<sup title="Absen lapangan (disetujui atasan & HR)">L</sup>':"");
const attTable=(a,nm)=>{const x4=a.some(x=>x.mid!==undefined);return`<div class="tw"><table><tr>${nm?"<th>Nama</th>":""}<th>Tanggal</th><th>Masuk</th>${x4?"<th>Siang</th><th>Sore</th>":""}<th>Pulang</th><th>Status</th></tr>${a.map(x=>`<tr>${nm?`<td>${esc(nm[x.uid]||"-")}</td>`:""}<td>${x.date}</td><td>${fv(x,"in")}</td>${x4?`<td>${fv(x,"mid")}</td><td>${fv(x,"aft")}</td>`:""}<td>${fv(x,"out")}</td><td>${tag(x.status)}</td></tr>`).join("")||'<tr><td class="mut">Belum ada data</td></tr>'}</table></div>`};

// ---- Hitung gaji, bonus sales, PPh21 (tarif progresif tahunan, disederhanakan) ----
function pphTahun(p){let t=0;for(const[w,r]of[[60e6,.05],[190e6,.15],[250e6,.25],[4.5e9,.3],[Infinity,.35]]){const x=Math.min(p,w);t+=x*r;p-=x;if(p<=0)break}return t}
function hitung(u,sales,pot,tl={n:0,kena:0,rp:0},cx={}){
  const pokok=u.pokok||0,tunjangan=u.tunjangan||0,target=u.target||0,capai=target>0&&sales>=target;
  const bonus=capai?Math.round((u.bonusFlat||0)+(u.bonusPct||0)/100*sales):0;
  const lm=cx.lembur||{jam:0,rp:0},th=cx.thr||{rp:0,bln:0},bruto=pokok+tunjangan+bonus+lm.rp+th.rp;
  const bp=bpjsCalc(u,pokok+tunjangan),brutoPajak=bruto+bp.premiKena,tx=pphCalc(u,brutoPajak,bp,cx);
  return{pokok,tunjangan,tunjanganList:u.tunjanganList||[],penjualan:sales,target,capai,bonus,lembur:lm.rp,lemburJam:lm.jam,thr:th.rp,thrBln:th.bln,bruto,
    bpjsKes:bp.kesK,bpjsJht:bp.jhtK,bpjsJp:bp.jpK,bpjsKary:bp.kary,bpjsPer:bp.per,premiKena:bp.premiKena,iuranPensiun:bp.iuranPensiun,brutoPajak,
    ...tx,potongan:pot,telat:tl.n,telatKena:tl.kena,potTelat:tl.rp,bersih:bruto-bp.kary-tx.pph-pot-tl.rp};
}
const slipHtml=p=>`<div class="box"><div class="row"><h3>Periode ${esc(blnFull(p.periode))}${p.paidAt?` <small class="mut" style="font-weight:400">· ✅ Ditransfer ${fmtD(p.paidAt)}</small>`:""}${p.updatedAt?` <small class="mut" style="font-weight:400">· 🔄 Diperbarui ${fmtD(p.updatedAt)}</small>`:""}</h3><span class="slipact"><b class="big">${rp(p.bersih)}</b><button class="btn ghost sm" onclick="slipPdf('${p.id}')" title="Unduh slip gaji (PDF)">⬇️ PDF</button></span></div><div class="tw"><table>
<tr><td>Gaji pokok</td><td>${rp(p.pokok)}</td></tr>${p.tunjanganList&&p.tunjanganList.length?p.tunjanganList.map(x=>`<tr><td>${esc(x.nama)}</td><td>${rp(x.nominal)}</td></tr>`).join(""):`<tr><td>Tunjangan</td><td>${rp(p.tunjangan)}</td></tr>`}
${p.target>0?`<tr><td>Penjualan ${rp(p.penjualan)} / target ${rp(p.target)} ${p.capai?"✅":""}</td><td>Bonus ${rp(p.bonus)}</td></tr>`:""}
${p.lembur>0?`<tr><td>Upah lembur (${p.lemburJam} jam)</td><td>${rp(p.lembur)}</td></tr>`:""}${p.thr>0?`<tr><td>THR (${p.thrBln} bulan masa kerja)</td><td>${rp(p.thr)}</td></tr>`:""}<tr><td><b>Penghasilan bruto</b></td><td><b>${rp(p.bruto)}</b></td></tr>${p.bpjsKes>0?`<tr><td>BPJS Kesehatan (1%)</td><td>- ${rp(p.bpjsKes)}</td></tr>`:""}${p.bpjsJht>0?`<tr><td>BPJS JHT (2%)</td><td>- ${rp(p.bpjsJht)}</td></tr>`:""}${p.bpjsJp>0?`<tr><td>BPJS Jaminan Pensiun (1%)</td><td>- ${rp(p.bpjsJp)}</td></tr>`:""}<tr><td>PPh21${p.pphMetode?` (${esc(p.pphMetode)}${p.terPct!=null?" "+p.terPct+"%":""})`:""}</td><td>${p.pph<0?"+ "+rp(-p.pph)+" (kelebihan potong)":"- "+rp(p.pph)}</td></tr>
<tr><td>Potongan lain</td><td>- ${rp(p.potongan)}</td></tr>${p.telat!==undefined?`<tr><td>Potongan terlambat (${p.telat}x, kena ${p.telatKena}x)</td><td>- ${rp(p.potTelat)}</td></tr>`:""}<tr><td><b>Gaji bersih</b></td><td><b>${rp(p.bersih)}</b></td></tr>${p.bpjsPer>0?`<tr><td colspan="2"><small class="mut">Iuran BPJS ditanggung perusahaan: ${rp(p.bpjsPer)}${p.premiKena>0?` (JKK, JKM, dan BPJS Kesehatan perusahaan ${rp(p.premiKena)} ikut dihitung sebagai penghasilan untuk PPh21)`:""}</small></td></tr>`:""}${p.pphCatatan?`<tr><td colspan="2"><small class="mut">${esc(p.pphCatatan)}</small></td></tr>`:""}</table></div></div>`;

// ---- Auth ----
// Form login: dikosongkan setiap logout (captcha juga diganti), kecuali user mencentang "Simpan kata sandi" saat login.
// Kata sandi tidak disimpan di aplikasi; disimpan lewat pengelola kata sandi browser (Credential Management API).
const REM=()=>{try{return localStorage.getItem("rem")==="1"}catch(e){return false}};
async function loginReset(){
  const r=REM(),em=$("#em"),pw=$("#pw");
  em.value=r?(localStorage.getItem("remEmail")||""):"";pw.value="";pw.type="password";$("#eye").textContent="👁️";
  em.autocomplete=r?"username":"off";pw.autocomplete=r?"current-password":"new-password";
  $("#remember").checked=r;newCap();
  if(r&&navigator.credentials&&window.PasswordCredential){try{const c=await navigator.credentials.get({password:true,mediation:"silent"});if(c&&c.password&&(!em.value||em.value===c.id)){em.value=c.id;pw.value=c.password}}catch(e){}}
}
$("#bLogin").onclick=async()=>{if(!capOk())return;const em=$("#em").value.trim(),pw=$("#pw").value,keep=$("#remember").checked;
  try{await auth.signInWithEmailAndPassword(em,pw)}catch(e){toast(e.message);newCap();return}
  try{await credSync(pw,null,em,"self")}catch(e){} // sinkronkan password terbaru ke daftar admin
  try{if(keep){localStorage.setItem("rem","1");localStorage.setItem("remEmail",em);if(navigator.credentials&&window.PasswordCredential)await navigator.credentials.store(new PasswordCredential({id:em,password:pw}))}
    else{localStorage.removeItem("rem");localStorage.removeItem("remEmail");if(navigator.credentials&&navigator.credentials.preventSilentAccess)await navigator.credentials.preventSilentAccess()}}catch(e){}};
const reveal=()=>document.documentElement.classList.remove("boot");
auth.onAuthStateChanged(async u=>{
  if(BUSY)return;
  $("#login").style.display=u?"none":"grid";$("#shell").style.display=u?"grid":"none";
  if(!u){loginReset();return reveal()}
  let p;
  try{p=await db.collection("users").doc(u.uid).get()}
  catch(e){if(e.code==="permission-denied"&&typeof licGuard==="function"&&await licGuard(true))return;throw e}
  if(!p.exists){reveal();toast("Akun belum didaftarkan admin");return auth.signOut()}
  ME={id:u.uid,...p.data()};
  if(!ADMIN()&&typeof licGuard==="function"){if(await licGuard(false))return;licGuardWatch()}
  const s=await db.collection("settings").doc("work").get();if(s.exists)SET={...SET,...s.data()};
  buildNav();
  userUI();if(typeof licBoot==="function")licBoot();nfInit();await schLoad(true);
  go("home");reveal();backInit();
  if(!ADMIN())setTimeout(()=>loadFace().catch(()=>{}),1200);
  else setTimeout(()=>{if(typeof purgeFoto==="function")purgeFoto(false).catch(e=>console.warn("Hapus foto lama:",e))},4000);
});
const EMP=[["home","🏠","Beranda"],["absen","📅","Absensi"],["slip","🧾","Slip Gaji"],["permintaan","📝","Permintaan"],["cuti","🏖️","Cuti"],["perbaikan","🛠️","Perbaikan"],["lembur","🌙","Lembur"],["laporan","📊","Laporan"]];
const ADM=[["home","🏠","Dashboard"],["karyawan","👥","Karyawan"],["password","🔑","Password"],["wajah","🙂","Persetujuan Wajah"],["struktur","🏢","Struktur"],["jadwal","⏰","Jadwal Kerja"],["shift","🔁","Jadwal Shift"],["approval","✅","Persetujuan"],["saldo","🏖️","Saldo Cuti"],["gaji","💰","Penggajian"],["rekap","📊","Rekap Absensi"],["setting","⚙️","Pengaturan"]];
function buildNav(){const l=needSetup()?[["setup","🔐","Setup Akun"]]:ADMIN()?[...ADM,["myhome","🙋","Absen Saya"],["absen","📅","Riwayat Saya"]]:[...EMP,...(isHR()||ME.isAtasan||ME.role==="atasan"?[["approval","✅","Persetujuan"],["saldo","🏖️","Saldo Cuti"]]:[]),...(isHR()?[["struktur","🏢","Struktur"]]:[])];
  // HP: hanya 4 menu utama + "Lainnya" (sisanya di lembar bawah). Desktop tetap menampilkan semua di sidebar.
  const pri=ADMIN()?["home","karyawan","approval","gaji"]:["home","absen","slip","approval","permintaan"],main=pri.filter(id=>l.some(n=>n[0]===id));
  l.forEach(n=>{if(main.length<4&&!main.includes(n[0]))main.push(n[0])});const mm=main.slice(0,4);
  const more=l.length>5?l.filter(n=>!mm.includes(n[0])):[];
  const item=(n,g)=>`<a data-v="${n[0]}"${g?` data-grp="${g}"`:""} class="${more.some(m=>m[0]===n[0])?"mx":""}" onclick="go('${n[0]}')"><span>${n[1]}</span>${n[2]}</a>`,mb=more.length?`<a class="mmore" onclick="moreOpen()"><span>⋯</span>Lainnya</a>`:"";
  // Admin: sidebar desktop dikelompokkan (Karyawan, Kehadiran, Penggajian, Sistem). Di HP tetap bar bawah 4 menu + Lainnya.
  $("#nav").innerHTML=ADMIN()&&!needSetup()?navGrouped(l,item)+mb:l.map(n=>item(n)).join("")+mb;
  window.NAV_MORE=more;window.NAV_ALL=l;navMark()}
const NAV_GRP=[["kar","Karyawan",["karyawan","password","wajah","struktur"]],["hdr","Kehadiran",["jadwal","shift","approval","saldo","rekap"]],["gj","Penggajian",["gaji","pajak"]],["sys","Sistem",["setting","audit","backup"]],["me","Akun saya",["myhome","absen"]]];
const grpOf=id=>{const g=NAV_GRP.find(x=>x[2].includes(id));return g?g[0]:id==="home"?"":"sys"}; // menu baru yang belum terdaftar masuk Sistem
const navClosed=()=>{try{return JSON.parse(localStorage.getItem("navc")||"[]")}catch(e){return[]}};
function navGrouped(l,item){
  const cl=navClosed(),top=l.filter(n=>grpOf(n[0])==="").map(n=>item(n)).join("");
  return top+NAV_GRP.map(([k,t])=>{const ord=NAV_GRP.find(x=>x[0]===k)[2],m=l.filter(n=>grpOf(n[0])===k).sort((x,y)=>(ord.indexOf(x[0])+1||99)-(ord.indexOf(y[0])+1||99));if(!m.length)return"";
    return`<div class="ng${cl.includes(k)?" c":""}" data-g="${k}" role="button" tabindex="0" onclick="ngToggle('${k}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();ngToggle('${k}')}"><b>${t}</b><i>▾</i></div>`+m.map(n=>item(n,k)).join("")}).join("");
}
function ngToggle(k){let c=navClosed();c=c.includes(k)?c.filter(x=>x!==k):[...c,k];try{localStorage.setItem("navc",JSON.stringify(c))}catch(e){}ngApply()}
function ngApply(){const c=navClosed(),cur=grpOf(view);document.querySelectorAll("aside .ng").forEach(h=>h.classList.toggle("c",c.includes(h.dataset.g)&&h.dataset.g!==cur));document.querySelectorAll("aside a[data-grp]").forEach(a=>a.classList.toggle("gcl",c.includes(a.dataset.grp)&&a.dataset.grp!==cur))}
function navMark(){ngApply();document.querySelectorAll("aside a[data-v]").forEach(a=>a.classList.toggle("on",a.dataset.v===view));const m=document.querySelector("aside .mmore");if(m)m.classList.toggle("on",!!document.querySelector("aside a.mx.on"))}
function moreOpen(){
  moreClose();const o=document.createElement("div");o.id="msheet";o.onclick=e=>{if(e.target===o)moreClose()};
  o.innerHTML=`<div class="msb">${moreHtml()}</div>`;
  document.body.appendChild(o);tr(o);
}
function moreHtml(){
  const b=n=>`<button class="${n[0]===view?"on":""}" onclick="moreClose();go('${n[0]}')"><span>${n[1]}</span>${n[2]}</button>`,m=window.NAV_MORE||[];
  if(!ADMIN())return`<div class="msg">${m.map(b).join("")}</div>`;
  const sec=(t,a)=>a.length?(t?`<div class="mgt">${t}</div>`:"")+`<div class="msg">${a.map(b).join("")}</div>`:"";
  return sec("",m.filter(n=>grpOf(n[0])===""))+NAV_GRP.map(([k,t])=>sec(t,m.filter(n=>grpOf(n[0])===k))).join("");
}
const moreClose=()=>{const o=document.getElementById("msheet");if(o)o.remove()};
function go(v){if(v==="out")return auth.signOut();if(needSetup())v="setup";stopCam();if(typeof slipStop==="function")slipStop();view=v;EDIT=null;render()}
async function render(){
  navMark();
  const el=$("#view");el.innerHTML=typeof skel==="function"?skel(view):'<p class="mut">Memuat...</p>';AFTER=null;
  try{el.innerHTML=await V[view]();tr(el);if(AFTER)AFTER();geoInitAll();nfRefresh()}catch(e){el.innerHTML=`<div class="box">Error: ${esc(e.message)}</div>`}
}

// ---- Tombol back HP: dari halaman mana pun kembali ke menu utama; di menu utama tekan back 2x untuk keluar ----
// Cara kerja: ada 1 entri riwayat "penjaga" di atas halaman dasar. Back = turun ke halaman dasar -> kita tangani -> history.forward() naik lagi ke penjaga.
// Back kedua dalam 2 detik di menu utama tidak ditangani, jadi keluar seperti biasa. (forward() tidak butuh sentuhan user, jadi tidak diblokir Chrome.)
let BACKON=false,BACKAT=0;
const atRoot=()=>view==="home"||(view==="setup"&&needSetup());
function armGuard(){if(ME&&!(history.state&&history.state.g))history.pushState({g:1},"")}
function backInit(){
  if(!BACKON){BACKON=true;addEventListener("popstate",backPop);addEventListener("pointerdown",armGuard,true)}
  armGuard();
}
function backPop(e){
  if(!ME||(e.state&&e.state.g))return;
  const dd=document.querySelector("#nfdd.show,#umenu.show");
  if(dd){dd.classList.remove("show");history.forward();return}
  if(!atRoot()){go("home");history.forward();return}
  if(Date.now()-BACKAT<2000){BACKAT=0;history.back();return}
  BACKAT=Date.now();toast(TT("Tekan back sekali lagi untuk keluar","Press back again to exit","再按一次返回键退出"));history.forward();
}

// ---- Kamera & absen ----
const stopCam=()=>{scanStop();if(STREAM){STREAM.getTracks().forEach(t=>t.stop());STREAM=null}if(WATCH!=null){navigator.geolocation.clearWatch(WATCH);WATCH=null}};
// startCam, doPunch, punch (cek lokasi + scan wajah) ada di js/extra.js

// ---- Form pengajuan ----
const FORMS={
  cuti:["Pengajuan Cuti",[["jenis","Jenis","select",[]],["dari","Dari","date"],["sampai","Sampai","date"],["hari","Hari","number"],["sesiLbl","Durasi","text"],["ket","Alasan","textarea"]]],
  permintaan:["Permintaan",[["jenis","Jenis","select",["Izin keluar","Dinas luar","Lainnya"]],["tgl","Tanggal","date"],["ket","Keterangan","textarea"]]],
  perbaikan:["Perbaikan Absensi",[["tgl","Tanggal","date"],["masuk","Jam Masuk","time"],["pulang","Jam Pulang","time"],["ket","Alasan","textarea"]]],
  lembur:["Lembur",[["tgl","Tanggal","date"],["mulai","Mulai","time"],["selesai","Selesai","time"],["ket","Keterangan","textarea"]]]
};
const reqInfo=r=>(FORMS[r.type]?FORMS[r.type][1]:[]).map(([k,l])=>r[k]?`${l}: ${esc(r[k])}`:"").filter(Boolean).join(" · ");
let REQ_IMG=null;
// foto bukti/lampiran opsional untuk semua pengajuan (jpeg maks 1000 px, disimpan kecil di dokumen pengajuan)
async function reqPick(inp){
  const f=inp.files[0],pv=$("#f_lampiranP");REQ_IMG=null;if(pv)pv.style.display="none";if(!f)return;
  try{const d=await imgData(f,1000,false,"image/jpeg");if(d.length>900000)throw new Error("Foto terlalu besar, coba foto ulang dengan resolusi lebih kecil.");
    REQ_IMG=d;if(pv){pv.src=d;pv.style.display="block"}}
  catch(e){toast(e.message||"File harus berupa foto (JPG/PNG).");inp.value=""}
}
async function formView(k){REQ_IMG=null;
  const[t,f]=FORMS[k],h=(await get("requests","uid",ME.id)).filter(r=>r.type===k).sort((a,b)=>b.createdAt-a.createdAt);
  return head(t)+flowBox()+`<div class="two"><div class="box"><div class="fg">${f.map(x=>fld("f_"+x[0],x[1],x[2],x[3])).join("")}<div class="f att"><label>📎 Lampiran foto bukti (opsional)</label><input id="f_lampiran" type="file" accept="image/*" onchange="reqPick(this)"><img id="f_lampiranP" alt="" style="display:none;max-width:240px;margin-top:8px;border-radius:8px;border:1px solid var(--line)"></div></div><button class="btn" onclick="sendForm('${k}')">Kirim</button></div>
  <div class="box"><h3>Riwayat</h3>${h.map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row"><span>${reqInfo(r)}</span>${reqStatus(r)}</div><small class="mut" style="display:block">${chainBar(r)}</small>${logLines(r)}</div>`).join("")||emptyBox("📝","Belum ada pengajuan","Isi formulir lalu klik Kirim.")}</div></div>`;
}
async function sendForm(k){const d={uid:ME.id,name:ME.name,type:k,status:"menunggu",createdAt:Date.now(),dept:ME.dept||"",...atasanFields(ME),hrId:ME.hrId||"",hrName:ME.hrName||"",step:chainStart(ME),log:[]};FORMS[k][1].forEach(([n])=>d[n]=$("#f_"+n).value);if(REQ_IMG)d.lampiran=await savePhoto(REQ_IMG,`req_${Date.now()}.jpg`);
  await db.collection("requests").add(d);toast("Pengajuan terkirim");render()}

// ---- Karyawan (admin) ----
const UF=[["name","Nama","text"],["email","Email","email"],["pw","Password awal (min 6)","password"],["wa","No. WhatsApp","tel"],["role","Role","select",["karyawan","atasan","hr","admin"]],["jabatan","Jabatan","text"],["joinDate","Tanggal masuk kerja","date"],["empStatus","Status karyawan","select",[]],["kontrakAkhir","Kontrak berakhir (isi untuk PKWT / Probation / Magang)","date"],["offGrant","Jatah Replacement Off (hari, total)","number"],["absenMode","Mode absensi","select",ABSEN_OPT],["pokok","Gaji pokok","money"],["ptkp","Status PTKP","select",Object.keys(PTKP)],["target","Target penjualan / bulan","money"],["bonusPct","Bonus % dari penjualan (jika capai target)","number"],["bonusFlat","Bonus tetap (jika capai target)","money"],["bank","Nama bank (mis. BCA, Mandiri)","text"],["rek","No. rekening (untuk transfer gaji)","tel"],["rekName","Nama pemilik rekening (jika beda)","text"],["shiftIn","Jam masuk khusus (opsional)","time"],["shiftOut","Jam pulang khusus (opsional)","time"],["tol","Toleransi terlambat khusus (menit, opsional)","number"]];
async function saveUser(){
  const d={};UF.forEach(([k,,t])=>{const el=$("#u_"+k);if(el)d[k]=t==="money"?num(el):t==="number"?+el.value||0:el.value.trim()});
  if(!d.name)return toast("Nama wajib diisi");
  d.wa=normWA(d.wa);if(d.role!=="admin"&&!waOk(d.wa))return toast("No. WhatsApp wajib diisi dengan benar (contoh 0812xxxxxxxx)");
  if(d.wa&&!waOk(d.wa))return toast("Format No. WhatsApp tidak valid");
  d.rek=String(d.rek||"").replace(/\D/g,"");if(d.rek&&!/^\d{5,20}$/.test(d.rek))return toast("No. rekening harus berupa angka 5-20 digit");
  if(($("#u_dept")||{}).value==="__new__"&&!(($("#u_deptNew")||{}).value||"").trim())return toast("Tulis nama departemen barunya");
  const g=geoRead("ul",true);if(g===false)return;Object.assign(d,g,orgRead());
  if($("#u_tol")&&$("#u_tol").value==="")d.tol=null;d.tunjanganList=tjRead();d.tunjangan=d.tunjanganList.reduce((a,x)=>a+x.nominal,0);await tjLearn(d.tunjanganList);
  let uid=EDIT;
  if(EDIT)await db.collection("users").doc(EDIT).update(d);
  else{if(!d.email||(d.pw||"").length<6)return toast("Email dan password (min 6 karakter) wajib");
    if(!await seatGuard())return;
    const a2=firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(firebaseConfig,"sec"),pw=d.pw;delete d.pw;
    const c=await mkAuth(a2,d.email,pw);
    await addUserDoc(c.user.uid,d);uid=c.user.uid;await credSync(pw,uid,d.email,"admin")}
  try{await orgAfterSave(uid,d)}catch(e){toast("Tersimpan, tetapi atasan/departemen belum tersusun: "+(e.message||e));EDIT=null;return render()}
  toast("Tersimpan");EDIT=null;render();
}
async function saveJadwal(){
  const g=geoRead("jg",false);if(g===false)return;
  const d={in:$("#j_in").value,out:$("#j_out").value,tol:+$("#j_tol").value||0,cutoff:+$("#j_cutoff").value||1,lateFree:Math.max(0,parseInt($("#j_free").value)||0),latePenalty:num($("#j_pen")),cutiQuota:Math.max(0,Number.isFinite(parseInt($("#j_cuti").value))?parseInt($("#j_cuti").value):12),workDays:+$("#j_wd").value===5?5:6,liveOff:$("#j_live").value==="0",tz:Math.min(14,Math.max(-12,Number.isFinite(parseInt($("#j_tz").value))?parseInt($("#j_tz").value):7)),...g};
  await db.collection("settings").doc("work").set(d,{merge:true});SET={...SET,...d};toast("Jadwal tersimpan");
}

// ---- Halaman ----
const V={
  home:async()=>{
    if(ADMIN()){const[us,rq,at]=await Promise.all([get("users"),get("requests","status","menunggu"),get("attendance","date",ymd(new Date()))]);
      return head("Dashboard","Halo, "+esc(ME.name))+`<div class="stats"><div class="st"><b>${us.filter(u=>u.role!=="admin").length}</b>Karyawan</div><div class="st"><b>${at.length}</b>Hadir hari ini</div><div class="st"><b>${rq.length}</b>Menunggu persetujuan</div></div><div class="box"><b>Jadwal default:</b> ${SET.in} - ${SET.out}, toleransi ${SET.tol} menit.</div>`}
    const a=await myAtt(),t=a.find(x=>x.date===ymd(new Date())),ok=a.filter(x=>x.status==="normal").length,sh=shift();
    return head("Hai, "+esc(ME.name),esc(ME.jabatan||""))+`<div class="box hero"><div><small>Hari ini · shift ${sh.in} - ${sh.out}</small><h2>${todayText(t)}</h2></div><button class="btn" onclick="go('absen')">📸 ${nextStep(t,punchN())?"Absen "+SL2[nextStep(t,punchN())]:"Lihat Absensi"}</button></div>
    <div class="stats"><div class="st"><b>${ok}</b>Hadir normal</div><div class="st"><b>${a.length-ok}</b>Abnormal / terlambat</div><div class="st"><b>${plabel()}</b>Periode</div></div>${lateBox(a)}`},
  absen:async()=>{
    await schLoad();const a=await myAtt(),t=await openRec(a),n=punchN(),st=nextStep(t,n),mode=st?SL[st]:"",sh=shift();if(mode)AFTER=startCam;
    return head("Absensi",`${sh.off?"Jadwal hari ini: LIBUR (jam default) · ":""}Shift ${sh.name&&!sh.off?sh.name+" ":""}${sh.in} - ${sh.out} · toleransi ${sh.tol} menit${n===4?" · 4x absen / hari":""}`)+`<div class="box">`+(n===4?`<p class="mut" style="margin-bottom:10px">Hari ini: ${todayText(t,true)}</p>`:"")+(mode?`${scanBox()}<p id="loc" class="mut" style="margin-bottom:10px;text-align:center">📍 mencari lokasi...</p><div style="text-align:center"><button class="btn" id="snap" disabled>📸 Mulai Scan Wajah · Absen ${mode}</button></div>`:`<p>✅ Semua absen hari ini (${n}x) sudah tercatat.</p>`)+`</div><div class="box"><h3>Riwayat ${plabel()}</h3>${attTable(a)}</div>`},
  permintaan:()=>formView("permintaan"),cuti:()=>formView("cuti"),perbaikan:()=>formView("perbaikan"),lembur:()=>formView("lembur"),
  laporan:async()=>{const a=await myAtt();window.dl=()=>csv("laporan-absensi.csv",[["Tanggal","Masuk","Siang","Sore","Pulang","Status"],...a.map(x=>[x.date,x.in,x.mid,x.aft,x.out,x.status])]);
    return head("Laporan",plabel())+`<div class="box">${attTable(a)}<br><button class="btn" onclick="dl()">Unduh CSV</button> <button class="btn ghost" onclick="lapPdf()">📄 Unduh PDF</button></div>`},
  karyawan:async()=>{
    USERS=await get("users");const e=USERS.find(u=>u.id===EDIT)||{};
    const html=head("Karyawan",USERS.length+" akun")+`<div class="box"><h3>${EDIT?"Edit "+esc(e.name):"Daftarkan karyawan baru"}</h3><div class="fg">${UF.filter(f=>!EDIT||!["email","pw"].includes(f[0])).map(f=>(f[0]==="ptkp"?ptkpField(e.ptkp||"TK0"):f[0]==="empStatus"?optSel("u_empStatus",f[1],EMP_ST,e.empStatus||""):fld("u_"+f[0],f[1],f[2],f[3],e[f[0]]??""))+(f[0]==="jabatan"?orgFields(e):"")).join("")}</div>${tjBlock(e)}${geoBlock("ul",true,{mode:e.locMode||"default",lat:e.locLat,lng:e.locLng,rad:e.locRad})}<button class="btn" onclick="saveUser()">Simpan</button>${EDIT?' <button class="btn ghost" onclick="EDIT=null;render()">Batal</button>':""}</div>${EDIT?"":importBox()}${karyawanList()}`;
    const t=AFTER;AFTER=()=>{if(t)t();kfApply();atRefresh()};return html},
  jadwal:async()=>head("Jadwal Kerja","Berlaku untuk semua karyawan (kecuali yang punya jam khusus)")+`<div class="box"><div class="fg">${fld("j_in","Jam masuk","time",0,SET.in)}${fld("j_out","Jam pulang","time",0,SET.out)}${fld("j_tol","Toleransi terlambat (menit)","number",0,SET.tol)}${fld("j_cutoff","Tanggal mulai periode (1 = bulan kalender, 21 = 21 s/d 20)","number",0,SET.cutoff)}${fld("j_free","Batas terlambat tanpa potongan (kali / periode)","number",0,SET.lateFree||0)}${fld("j_pen","Potongan per terlambat di atas batas (Rp)","money",0,SET.latePenalty||0)}${fld("j_cuti","Jatah cuti tahunan (hari / tahun, setelah 1 tahun kerja)","number",0,SET.cutiQuota||12)}${fld("j_wd","Hari kerja per minggu (untuk hitung hari cuti)","select",["5","6"],String(SET.workDays||6))}${fld("j_tz","Zona waktu perusahaan (UTC+ : WIB 7, WITA 8, WIT 9)","number",0,SET.tz??7)}<div class="f"><label>Verifikasi gerakan wajah saat absen (anti foto &amp; kamera virtual)</label><select id="j_live"><option value="1"${SET.liveOff?"":" selected"}>Aktif (disarankan)</option><option value="0"${SET.liveOff?" selected":""}>Nonaktif</option></select></div></div><p class="mut" style="margin:-4px 0 14px"><small>Contoh: batas 3 dan potongan Rp 50.000 → terlambat ke-1 sampai ke-3 tidak dipotong, mulai ke-4 dipotong Rp 50.000 per kejadian. Isi potongan 0 untuk menonaktifkan.</small></p>${geoBlock("jg",false,{mode:SET.geoOn?"on":"off",lat:SET.geoLat,lng:SET.geoLng,rad:SET.geoRad})}<button class="btn" onclick="saveJadwal()">Simpan</button></div>`,
  approval:approvalView,
  rekap:rekapView
};

// ---- Rekap absensi (admin): pilih rentang waktu, divisi, dan karyawan ----
let RK={pre:"periode",from:"",to:"",dept:"",uid:"",st:""},RKSEL=new Set();
function rkRange(){
  const t=new Date(),td=ymd(t),d0=(y,m,d)=>ymd(new Date(y,m,d));
  if(RK.pre==="hari")return[td,td];
  if(RK.pre==="minggu"){const s=new Date(t);s.setDate(t.getDate()-((t.getDay()+6)%7));const e=new Date(s);e.setDate(s.getDate()+6);return[ymd(s),ymd(e)]}
  if(RK.pre==="bulan")return[d0(t.getFullYear(),t.getMonth(),1),d0(t.getFullYear(),t.getMonth()+1,0)];
  if(RK.pre==="bulanlalu")return[d0(t.getFullYear(),t.getMonth()-1,1),d0(t.getFullYear(),t.getMonth(),0)];
  if(RK.pre==="custom"){let f=RK.from||td,e=RK.to||td;if(f>e)[f,e]=[e,f];return[f,e]}
  const[a,b]=period();return[ymd(a),ymd(b)];
}
function rkSet(k,v){
  if(k==="pre"&&v==="custom"&&!RK.from){[RK.from,RK.to]=rkRange()}
  RK[k]=v;if(k==="dept")RK.uid="";render();
}
async function rekapView(){
  const us=await get("users"),nm=Object.fromEntries(us.map(u=>[u.id,u.name])),dp=Object.fromEntries(us.map(u=>[u.id,u.dept||""])),[f,t]=rkRange();
  let a=(await db.collection("attendance").where("date",">=",f).where("date","<=",t).get()).docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.uid in nm);
  if(RK.dept)a=a.filter(x=>(RK.dept==="__none__"?!dp[x.uid]:dp[x.uid]===RK.dept));
  if(RK.uid)a=a.filter(x=>x.uid===RK.uid);
  a.sort((x,y)=>y.date.localeCompare(x.date)||(nm[x.uid]||"").localeCompare(nm[y.uid]||""));
  const depts=[...new Set([...DEPTS().map(d=>d.name),...us.map(u=>u.dept).filter(Boolean)])].sort(),
    pick=us.filter(u=>!RK.dept||(RK.dept==="__none__"?!u.dept:u.dept===RK.dept)).sort((x,y)=>x.name.localeCompare(y.name)),
    per={};a.forEach(x=>{const r=per[x.uid]=per[x.uid]||{uid:x.uid,hari:0,ok:0,bad:0};r.hari++;x.status==="normal"?r.ok++:r.bad++});
  const rows=Object.values(per).sort((x,y)=>nm[x.uid].localeCompare(nm[y.uid])),ok=a.filter(x=>x.status==="normal").length,fn=`${f}_sd_${t}`,lbl=RK.uid?nm[RK.uid]:RK.dept?(RK.dept==="__none__"?"Tanpa departemen":RK.dept):"Semua karyawan";
  const OT=await rkLembur(us,nm,dp,f,t);
  window.__RK={a,nm,dp,fn,lbl,vis:a,rows,OT};RKSEL=new Set();
  window.dl=rkDl;
  window.dl2=()=>csv(`rekap-per-orang_${fn}.csv`,[["Nama","Divisi","Jumlah Absen","Normal","Abnormal"],...rows.map(r=>[nm[r.uid],dp[r.uid]||"",r.hari,r.ok,r.bad])]);
  const sel=(id,l,o,v,fn)=>`<div class="f"><label>${l}</label><select${id==="nosearch"?' data-search="0"':""} onchange="${fn}">${o.map(([a,b])=>`<option value="${esc(a)}"${a===v?" selected":""}>${esc(b)}</option>`).join("")}</select></div>`;
  const PRE=[["hari","Hari ini"],["minggu","Minggu ini"],["periode","Periode gajian berjalan ("+plabel()+")"],["bulan","Bulan ini"],["bulanlalu","Bulan lalu"],["custom","Pilih tanggal sendiri…"]];
  AFTER=rkDraw;
  return head("Rekap Absensi",`${dsDate(f)} – ${dsDate(t)}`)
   +`<div class="box"><div class="fg">${sel("nosearch","Waktu",PRE,RK.pre,"rkSet('pre',this.value)")}${RK.pre==="custom"?`<div class="f"><label>Dari tanggal</label><input type="date" value="${f}" onchange="rkSet('from',this.value)"></div><div class="f"><label>Sampai tanggal</label><input type="date" value="${t}" onchange="rkSet('to',this.value)"></div>`:""}
   ${sel("","Divisi / departemen",[["","Semua divisi"],...depts.map(d=>[d,d]),["__none__","Tanpa departemen"]],RK.dept,"rkSet('dept',this.value)")}${sel("","Karyawan",[["","Semua karyawan"],...pick.map(u=>[u.id,u.name])],RK.uid,"rkSet('uid',this.value)")}</div></div>
   <div class="stats"><button type="button" class="st stb${RK.st===""?" on":""}" data-st="" onclick="rkStat('')"><b>${a.length}</b>Catatan absen<small>Tampilkan semua</small></button><button type="button" class="st stb${RK.st==="normal"?" on":""}" data-st="normal" onclick="rkStat('normal')"><b>${ok}</b>Normal<small>Klik untuk memfilter</small></button><button type="button" class="st stb${RK.st==="abnormal"?" on":""}" data-st="abnormal" onclick="rkStat('abnormal')"><b>${a.length-ok}</b>Abnormal / terlambat<small>Klik untuk memfilter</small></button><button type="button" class="st stb" onclick="${RK.uid?"rkSet('uid','')":"rkJump()"}"><b>${rows.length}</b>Karyawan<small>${RK.uid?"Tampilkan semua karyawan":"Lihat ringkasan per orang"}</small></button></div>
   ${!RK.uid&&rows.length?`<div class="box" id="rkSum"><div class="row" style="flex-wrap:wrap"><h3 style="margin:0">Ringkasan per orang · ${esc(lbl)}</h3><button class="btn ghost sm" onclick="dl2()">Unduh CSV ringkasan</button></div><div class="tw"><table data-pg="rksum"><tr><th>Nama</th><th>Divisi</th><th>Jumlah absen</th><th>Normal</th><th>Abnormal</th><th>Tepat waktu</th></tr>${rows.map(r=>`<tr><td>${esc(nm[r.uid])}</td><td>${esc(dp[r.uid]||"-")}</td><td>${r.hari}</td><td>${r.ok}</td><td>${r.bad}</td><td>${Math.round(r.ok/r.hari*100)}%</td></tr>`).join("")}</table></div></div>`:""}
   ${typeof auditBox==="function"?auditBox():""}<div class="box" id="rkDet"></div>${rkOtHtml(window.__RK)}`;
}

// ---- Rekap: filter status lewat kartu, ceklis baris, unduh CSV (hanya yang dipilih / yang tampil) ----
const rkVis=()=>{const D=window.__RK;if(!D)return[];return RK.st==="normal"?D.a.filter(x=>x.status==="normal"):RK.st==="abnormal"?D.a.filter(x=>x.status!=="normal"):D.a};
function rkStat(v){
  RK.st=RK.st===v?"":v;RKSEL=new Set();
  document.querySelectorAll(".stb[data-st]").forEach(b=>b.classList.toggle("on",b.dataset.st===RK.st));rkDraw();
}
function rkJump(){const e=document.getElementById("rkSum");if(e)e.scrollIntoView({behavior:"smooth",block:"start"})}
function rkDraw(){
  const D=window.__RK,el=$("#rkDet");if(!D||!el)return;
  const l=rkVis(),x4=l.some(x=>x.mid!==undefined),ttl={normal:" · hanya Normal",abnormal:" · hanya Abnormal / terlambat"}[RK.st]||"";
  D.vis=l;RKSEL=new Set([...RKSEL].filter(id=>l.some(x=>x.id===id)));
  el.innerHTML=`<h3>Detail absensi · ${esc(D.lbl)}${ttl}</h3><div class="rkbar" id="rkBar"></div><div class="tw"><table data-pg="rkdet"><tr><th class="ckc"><input type="checkbox" class="ck" id="rkAll" title="Pilih semua yang tampil" onchange="rkAll(this.checked)"></th><th>Nama</th><th>Tanggal</th><th>Masuk</th>${x4?"<th>Siang</th><th>Sore</th>":""}<th>Pulang</th><th>Status</th></tr>`+
    (l.map(x=>`<tr data-id="${esc(x.id)}" class="${RKSEL.has(x.id)?"sel":""}"><td class="ckc"><input type="checkbox" class="ck" ${RKSEL.has(x.id)?"checked":""} onchange="rkTog(this)"></td><td>${esc(D.nm[x.uid]||"-")}</td><td>${x.date}</td><td>${fv(x,"in")}</td>${x4?`<td>${fv(x,"mid")}</td><td>${fv(x,"aft")}</td>`:""}<td>${fv(x,"out")}</td><td>${tag(x.status)}</td></tr>`).join("")||`<tr><td colspan="${x4?8:6}">${emptyBox("🔎","Tidak ada data absensi",RK.st?"Coba ubah filter status.":"Coba ubah rentang waktu atau filter.")}</td></tr>`)+`</table></div>`;
  rkBar();
}
function rkBar(){
  const D=window.__RK,b=$("#rkBar");if(!D||!b)return;const n=RKSEL.size,t=D.vis.length;
  b.innerHTML=`<span class="mut">${n?`<b style="color:var(--ink)">${n}</b> dari ${t} baris dipilih`:`${t} baris`}</span>${n?`<button type="button" class="btn ghost sm" onclick="rkAll(false)">Batal pilih</button>`:""}<span class="sp"></span><button type="button" class="btn sm" onclick="rkXlsx()" ${t?"":"disabled"}>📗 Unduh Excel${n?` (${n} terpilih)`:""}</button><button type="button" class="btn ghost sm" onclick="rkPdf()" ${t?"":"disabled"}>📄 Unduh PDF${n?` (${n})`:""}</button><button type="button" class="btn ghost sm" onclick="rkDl()" ${t?"":"disabled"}>⬇️ ${n?`Unduh ${n} baris terpilih (CSV)`:`Unduh CSV (${t} baris${RK.st?" sesuai filter":""})`}</button>`;
  const all=$("#rkAll");if(all){all.checked=t>0&&n===t;all.indeterminate=n>0&&n<t}
}
function rkTog(cb){const tr=cb.closest("tr"),id=tr.dataset.id;cb.checked?RKSEL.add(id):RKSEL.delete(id);tr.classList.toggle("sel",cb.checked);rkBar()}
function rkAll(on){
  RKSEL=on?new Set(window.__RK.vis.map(x=>x.id)):new Set();
  document.querySelectorAll("#rkDet tr[data-id]").forEach(tr=>{tr.classList.toggle("sel",on);tr.querySelector(".ck").checked=on});rkBar();
}
function rkDl(){
  const D=window.__RK;if(!D)return;
  const l=RKSEL.size?D.vis.filter(x=>RKSEL.has(x.id)):D.vis;if(!l.length)return toast("Tidak ada data untuk diunduh");
  const sfx=RKSEL.size?"_dipilih":RK.st?"_"+RK.st:"";
  csv(`rekap-absensi_${D.fn}${sfx}.csv`,[["Nama","Divisi","Tanggal","Masuk","Siang","Sore","Pulang","Status"],...l.map(x=>[D.nm[x.uid],D.dp[x.uid]||"",x.date,x.in,x.mid,x.aft,x.out,x.status])]);
  toast(`${l.length} baris diunduh`);
}

V.cuti=cutiView;V.shift=shiftView;V.home=homeView;V.gaji=gajiView;V.setting=settingView;V.setup=setupView;V.struktur=strukturView;V.wajah=faceApprovView;loadCompany();startUI();
