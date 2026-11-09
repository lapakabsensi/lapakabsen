// ===== Dashboard admin: kartu "Perlu tindakan hari ini" (klik langsung ke menu / daftar orangnya) =====
// Dimuat setelah tabel.js. Data diambil dari adminHome() (ADM_DATA) supaya tidak membaca database dua kali.
// Kartu: belum absen (setelah jam batas), permintaan lupa password, pengajuan menunggu, slip belum ditransfer, kontrak segera habis.
let TD={list:{},open:""};
const tdCutGet=()=>{try{return localStorage.getItem("tdCut")||""}catch(e){return""}};
const tdCut=()=>tdCutGet()||SET.in||"09:00";
const tdNow=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const tdWa=(n,t)=>{let d=String(n||"").replace(/\D/g,"");if(d.startsWith("0"))d="62"+d.slice(1);else if(d.startsWith("8"))d="62"+d;return d?`https://wa.me/${d}?text=${encodeURIComponent(t)}`:""};
const tdDays=s=>Math.round((new Date(s+"T00:00:00")-new Date(ymd(new Date())+"T00:00:00"))/864e5);

async function todoCards(){
  const D=ADM_DATA;if(!D)return"";
  const{us,rq,pay,att}=D,today=ymd(new Date()),emps=us.filter(u=>u.role!=="admin"),ids=new Set(emps.map(u=>u.id));
  // 1) belum absen (yang cuti disetujui hari ini tidak dihitung; hari libur tidak ada tagihan absen)
  const off=typeof dsOff==="function"?dsOff(new Date()):new Date().getDay()===0,
    did=new Set(att.filter(x=>x.date===today).map(x=>x.uid)),
    leave=new Set(rq.filter(r=>r.type==="cuti"&&r.status==="disetujui"&&r.dari&&r.dari<=today&&(r.sampai||r.dari)>=today).map(r=>r.uid)),
    belum=off?[]:emps.filter(u=>!did.has(u.id)&&!leave.has(u.id)),cut=tdCut(),late=tdNow()>=cut;
  // 2) lupa password
  let lupa=[];try{lupa=await get("resetReq")}catch(e){}
  // 3) pengajuan menunggu
  const pend=rq.filter(r=>r.status==="menunggu");
  // 4) slip belum ditransfer
  const un=pay.filter(s=>s.paid!==true&&ids.has(s.uid)),per={};un.forEach(s=>per[s.periode]=(per[s.periode]||0)+1);
  const perTop=Object.keys(per).sort().slice(-1)[0];
  // 5) kontrak segera habis (<= 30 hari, termasuk yang sudah lewat)
  const kon=emps.filter(u=>u.kontrakAkhir&&["PKWT","Probation","Magang"].includes(u.empStatus||"PKWT")).map(u=>({u,d:tdDays(u.kontrakAkhir)})).filter(x=>x.d<=30).sort((a,b)=>a.d-b.d),
    noEnd=emps.filter(u=>["PKWT","Probation","Magang"].includes(u.empStatus)&&!u.kontrakAkhir).length;
  const nm=(l,f)=>{const a=l.map(f);return a.slice(0,3).map(esc).join(", ")+(a.length>3?` +${a.length-3}`:"")};
  TD.list={
    belum:{t:`Belum absen · ${belum.length} orang`,sub:late?`Sampai jam ${cut} belum ada catatan absen. Yang cuti disetujui tidak dihitung.`:`Belum lewat jam batas ${cut}; daftar ini masih bisa berubah.`,
      items:belum.map(u=>({n:u.name,s:[u.jabatan,u.dept].filter(Boolean).join(" · "),a:tdWa(u.wa,`Halo ${u.name}, kamu belum absen hari ini. Mohon segera absen ya.`),al:"💬 Ingatkan"}))},
    kontrak:{t:`Kontrak segera habis · ${kon.length} orang`,sub:noEnd?`${noEnd} karyawan kontrak belum diisi tanggal berakhirnya (isi di menu Karyawan).`:"Kontrak yang berakhir dalam 30 hari atau sudah lewat.",
      items:kon.map(({u,d})=>({n:u.name,s:`${u.empStatus||"PKWT"} · berakhir ${u.kontrakAkhir} · ${d<0?`lewat ${-d} hari`:d===0?"hari ini":`${d} hari lagi`}`,e:u.id,al:"✏️ Buka"}))}
  };
  const urgent=kon.some(x=>x.d<=7);
  const card=(ic,n,tt,sub,tone,to)=>`<button type="button" class="tdc ${tone} go" data-to="${esc(JSON.stringify(to))}"><span class="tdi">${ic}</span><b>${n}</b><span class="tdt">${tt}</span><small>${sub}</small></button>`;
  const cards=[
    card("🕘",off?"–":belum.length,"Belum absen",off?"Hari libur":late?(belum.length?esc(nm(belum,u=>u.name)):"Semua sudah absen"):`Belum jam ${cut}`,off||!belum.length?"ok":late?"bad":"mut",{panel:"belum"}),
    card("🔑",lupa.length,"Lupa password",lupa.length?esc(nm(lupa,r=>r.email)):"Tidak ada permintaan",lupa.length?"warn":"ok",{v:"password"}),
    card("📥",pend.length,"Pengajuan menunggu",pend.length?esc(nm(pend,r=>r.name)):"Semua sudah diputuskan",pend.length?"warn":"ok",{v:"approval",AP_ST:"menunggu"}),
    card("🏦",un.length,"Slip belum ditransfer",un.length?`Periode ${blnFull(perTop)}${Object.keys(per).length>1?` +${Object.keys(per).length-1} periode lain`:""}`:"Semua sudah ditransfer",un.length?"warn":"ok",perTop?{v:"gaji",PM:perTop}:{v:"gaji"}),
    card("📄",kon.length,"Kontrak segera habis",kon.length?esc(nm(kon,x=>x.u.name)):noEnd?`${noEnd} belum diisi tanggal akhir`:"Aman 30 hari ke depan",kon.length?(urgent?"bad":"warn"):"ok",{panel:"kontrak"})
  ].join("");
  const all0=!belum.length&&!lupa.length&&!pend.length&&!un.length&&!kon.length;
  return`<div class="box tdbox"><div class="row" style="flex-wrap:wrap;gap:10px"><h3 style="margin:0">Perlu tindakan hari ini</h3>${all0?'<span class="tag ok">✅ Semua beres</span>':""}<span class="sp"></span>
    <label class="tdcut">Tandai belum absen setelah jam <input type="time" value="${cut}" onchange="tdSetCut(this.value)"></label></div>
   <div class="tdg">${cards}</div><div id="tdPanel"></div></div>`;
}
function tdSetCut(v){try{if(v)localStorage.setItem("tdCut",v);else localStorage.removeItem("tdCut")}catch(e){}render()}
function tdPanel(k){
  const el=document.getElementById("tdPanel"),P=TD.list[k];if(!el||!P)return;
  if(TD.open===k){TD.open="";el.innerHTML="";return}
  TD.open=k;
  el.innerHTML=`<div class="tdp"><div class="row" style="flex-wrap:wrap;gap:8px"><b>${esc(P.t)}</b><button type="button" class="btn ghost sm" onclick="tdPanel('${k}')">Tutup</button></div><p class="mut" style="margin:4px 0 8px"><small>${esc(P.sub)}</small></p>
   ${P.items.length?P.items.map((x,i)=>`<div class="tdr"><span><b>${esc(x.n)}</b><br><small class="mut">${esc(x.s||"-")}</small></span>${x.e?`<button type="button" class="btn sm ghost go" data-to="${esc(JSON.stringify({v:"karyawan",edit:x.e}))}">${x.al}</button>`:x.a?`<a class="btn sm ghost" href="${esc(x.a)}" target="_blank" rel="noopener">${x.al}</a>`:'<small class="mut">tanpa nomor WA</small>'}</div>`).join(""):'<p class="mut">Tidak ada.</p>'}</div>`;
  el.scrollIntoView({block:"nearest",behavior:"smooth"});
}
// sisipkan kartu di dashboard admin (di atas ringkasan angka & grafik)
{const _ah=adminHome;adminHome=async function(){
  const h=await _ah(),c=await todoCards(),i=h.indexOf('<div class="stats">');TD.open="";
  return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
