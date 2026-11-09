// ===== Fitur tambahan: grafik dashboard, daftar karyawan (grup departemen + search), PTKP, rekening bank,
// penggajian (ceklis transfer + export CSV bank), notifikasi lonceng =====
// Dimuat setelah org.js dan sebelum app.js. Semua fungsi memakai variabel app.js (ME, SET, USERS, db, $, dst) saat runtime.
addDict({
"Notifikasi":["Notifications","通知"],"Tandai semua dibaca":["Mark all as read","全部标为已读"],"Belum ada notifikasi":["No notifications yet","暂无通知"],
"Semua":["All","全部"],"Tanpa departemen":["No department","无部门"],"Ditransfer":["Transferred","已转账"],"Transfer":["Transfer","转账"],
"Kehadiran hari ini":["Today's attendance","今日出勤"],"Karyawan per departemen":["Employees by department","各部门员工"],"Status pengajuan":["Request status","申请状态"]
});

const CAT=["#2a78d6","#eb6834","#1baf7a","#eda100","#e87ba4","#008300","#6250d6","#e34948"],NEU="#cbd5e1";
const BLN_F=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const blnFull=pm=>{const[y,m]=String(pm).split("-").map(Number);return m?BLN_F[m-1]+" "+y:String(pm)};
const dShort=s=>{const[y,m,d]=s.split("-").map(Number);return d+" "+BLN[m-1]};
const rpC=n=>n>=1e9?(n/1e9).toFixed(1).replace(/\.0$/,"")+" M":n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,"")+" jt":n>=1e3?Math.round(n/1e3)+" rb":String(Math.round(n));

// ---------- Grafik (SVG ringan, tanpa library) ----------
const dTo=x=>x.to?` class="go" data-to="${esc(JSON.stringify(x.to))}" tabindex="0" role="link"`:"";
function dashGo(t){
  if(t.panel){if(typeof tdPanel==="function")tdPanel(t.panel);return}
  if(t.RK){RK={pre:"periode",from:"",to:"",dept:"",uid:"",st:"",...t.RK};RKSEL.clear&&RKSEL.clear()}
  if(t.KF)KF={dept:"*",q:"",...t.KF};
  if(t.AP_ST!==undefined){AP_ST=t.AP_ST;AP_DEPT=""}
  if(t.PM)PM=t.PM;
  go(t.v);
  if(t.edit){EDIT=t.edit;render();scrollTo(0,0)}
}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-to]");if(!el)return;try{dashGo(JSON.parse(el.dataset.to))}catch(_){}});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.to){e.preventDefault();e.target.click()}});
function donut(items,center,sub){
  const tot=items.reduce((a,x)=>a+x.v,0);
  if(!tot)return'<p class="emp">Belum ada data</p>';
  const R=58,C=2*Math.PI*R,live=items.filter(x=>x.v>0),gap=live.length>1?2.5:0;let off=0;
  const segs=live.map(x=>{const len=x.v/tot*C,s=`<circle cx="80" cy="80" r="${R}" fill="none" stroke="${x.c}" stroke-width="24" stroke-dasharray="${Math.max(0.5,len-gap)} ${C-Math.max(0.5,len-gap)}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"${dTo(x)}><title>${esc(x.l)}: ${x.v} (${Math.round(x.v/tot*100)}%)</title></circle>`;off+=len;return s}).join("");
  return`<div class="dn"><svg viewBox="0 0 160 160" role="img" aria-label="${esc(sub||"")}"><circle cx="80" cy="80" r="${R}" fill="none" stroke="#eef2f7" stroke-width="24"/>${segs}<text class="ct" x="80" y="82" text-anchor="middle">${center}</text><text class="cs" x="80" y="98" text-anchor="middle">${esc(sub||"")}</text></svg>
  <ul class="lg">${items.map(x=>`<li${dTo(x)}><i style="background:${x.c}"></i>${esc(x.l)}<b>${x.v}</b><span>${Math.round(x.v/tot*100)}%</span></li>`).join("")}</ul></div>`;
}
// bar vertikal; series=[{n,c,v:[...]}]; stack=true menumpuk dengan jarak 2px antar segmen
function bars(cats,series,o={}){
  const fmt=o.fmt||(v=>v),W=o.W||460,H=o.H||210,L=o.left||40,T=10,B=26,R=6,pw=W-L-R,ph=H-T-B,n=cats.length;
  if(!n||!series.some(s=>s.v.some(v=>v>0)))return'<p class="emp">Belum ada data</p>';
  const tops=cats.map((_,i)=>o.stack?series.reduce((a,s)=>a+(s.v[i]||0),0):Math.max(...series.map(s=>s.v[i]||0))),mx=Math.max(...tops,1);
  const raw=mx/4,mag=Math.pow(10,Math.floor(Math.log10(raw))),st=[1,2,2.5,5,10].map(k=>k*mag).find(k=>k>=raw),top=st*Math.ceil(mx/st),y=v=>T+ph-v/top*ph;
  let g="";for(let t=0;t<=top+1e-9;t+=st)g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${fmt(t)}</text>`;
  const slot=pw/n,bw=Math.min(40,slot*.62),k=o.stack?1:series.length,sw=o.stack?bw:bw/k;
  const rr=(x,y0,w,h,r)=>{r=Math.min(r,h,w/2);return`M${x},${y0+h}V${y0+r}Q${x},${y0} ${x+r},${y0}H${x+w-r}Q${x+w},${y0} ${x+w},${y0+r}V${y0+h}Z`};
  let b="";
  cats.forEach((c,i)=>{const cx=L+slot*i+slot/2;let acc=0;
    series.forEach((s,j)=>{const v=s.v[i]||0;if(v<=0)return;
      const x0=cx-bw/2+(o.stack?0:j*sw),h=Math.max(2,v/top*ph),yy=o.stack?y(acc+v):y(v),hh=o.stack?Math.max(2,v/top*ph-(acc>0?2:0)):h,last=o.stack?series.slice(j+1).every(z=>!(z.v[i]>0)):true;
      const tt=s.to&&s.to[i],ga=tt?` class="bg go" data-to="${esc(JSON.stringify(tt))}" tabindex="0" role="link"`:` class="bg"`;
      b+=`<g${ga}><path class="bar" fill="${s.c}" d="${last?rr(x0,yy,sw-(o.stack?0:2),hh,4):`M${x0},${yy}h${sw}v${hh}h${-sw}Z`}"/><title>${esc(c)} · ${esc(s.n)}: ${fmt(v)}</title></g>`;acc+=v});
    if(n<=12||i%Math.ceil(n/12)===0)b+=`<text x="${cx}" y="${H-8}" text-anchor="middle">${esc(c)}</text>`});
  const lgd=series.length>1?`<div class="lgd">${series.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join("")}</div>`:"";
  return`<svg class="bc" viewBox="0 0 ${W} ${H}" role="img">${g}${b}</svg>${lgd}`;
}
function hbars(items,fmt=v=>v){
  const mx=Math.max(...items.map(x=>x.v),0);if(!mx)return'<p class="emp">Belum ada data</p>';
  return`<div class="hb">${items.map(x=>`<div class="r${x.to?" go":""}"${x.to?` data-to="${esc(JSON.stringify(x.to))}" tabindex="0" role="link"`:""} title="${esc(x.l)}: ${fmt(x.v)}"><span class="n">${esc(x.l)}</span><span class="t"><i style="width:${x.v/mx*100}%;background:${x.c||CAT[0]}"></i></span><b>${fmt(x.v)}</b></div>`).join("")}</div>`;
}
const chartBox=(t,sub,body,span=2)=>`<div class="box s${span}"><h3>${t}</h3><span class="sub">${sub||""}</span>${body}</div>`;

// ---------- Dashboard ----------
async function homeView(){
  if(ADMIN())return adminHome();
  const a=await myAtt(),t=a.find(x=>x.date===ymd(new Date())),ok=a.filter(x=>x.status==="normal").length,sh=shift(),late=a.length-ok;
  const lt=[...a].sort((x,y)=>x.date.localeCompare(y.date)).slice(-10).map(x=>({d:dShort(x.date),m:x.in?Math.max(0,mn(x.in)-mn(sh.in)):0}));
  return head("Hai, "+esc(ME.name),esc(ME.jabatan||""))+`<div class="box hero"><div><small>Hari ini · shift ${sh.in} - ${sh.out}</small><h2>${todayText(t)}</h2></div><button class="btn" onclick="go('absen')">📸 ${nextStep(t,punchN())?"Absen "+SL2[nextStep(t,punchN())]:"Lihat Absensi"}</button></div>
  <div class="stats"><div class="st"><b>${ok}</b>Hadir normal</div><div class="st"><b>${late}</b>Abnormal / terlambat</div><div class="st"><b>${plabel()}</b>Periode</div></div>${lateBox(a)}
  <div class="cg">${chartBox("Kehadiran periode ini",plabel(),donut([{l:"Tepat waktu",v:ok,c:CAT[0]},{l:"Terlambat",v:late,c:CAT[1]}],a.length,"hari hadir"),3)}
  ${chartBox("Keterlambatan harian","Menit setelah jam masuk "+sh.in+" · 10 hari terakhir",(lt.length&&lt.every(x=>!x.m)?'<p class="emp good">Tidak ada keterlambatan</p>':bars(lt.map(x=>x.d),[{n:"Menit terlambat",c:CAT[1],v:lt.map(x=>x.m)}],{fmt:v=>v})),3)}</div>`;
}
let ADM_DATA=null;
async function adminHome(){
  const today=ymd(new Date()),[ps]=period(),d7=new Date();d7.setDate(d7.getDate()-6);
  const from=ymd(d7)<ymd(ps)?ymd(d7):ymd(ps);
  const[us,rq,pay,att]=await Promise.all([get("users"),get("requests"),get("payslips"),db.collection("attendance").where("date",">=",from).get().then(s=>s.docs.map(d=>({id:d.id,...d.data()})))]);
  ADM_DATA={us,rq,pay,att};
  const emps=us.filter(u=>u.role!=="admin"),ids=new Set(emps.map(u=>u.id)),at=att.filter(x=>ids.has(x.uid));
  const tdy=at.filter(x=>x.date===today),tOk=tdy.filter(x=>x.status!=="abnormal").length,tLate=tdy.length-tOk,tNo=Math.max(0,emps.length-tdy.length);
  const pend=rq.filter(r=>r.status==="menunggu");
  // departemen (maks 7 + Lainnya)
  const dc={};emps.forEach(u=>{const k=u.dept||"Tanpa departemen";dc[k]=(dc[k]||0)+1});
  let dl=Object.entries(dc).sort((x,y)=>y[1]-x[1]);if(dl.length>8){const rest=dl.slice(7).reduce((a,x)=>a+x[1],0);dl=[...dl.slice(0,7),["Lainnya",rest]]}
  const dItems=dl.map(([l,v],i)=>({l,v,c:CAT[i],to:l==="Lainnya"?{v:"karyawan"}:{v:"karyawan",KF:{dept:l==="Tanpa departemen"?"":l}}}));
  // 7 hari terakhir
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return ymd(d)});
  const w=days.map(d=>{const l=at.filter(x=>x.date===d);return{ok:l.filter(x=>x.status!=="abnormal").length,late:l.filter(x=>x.status==="abnormal").length}});
  // gaji bersih per periode (hanya slip yang sudah dihitung)
  const pm={};pay.forEach(s=>{pm[s.periode]=(pm[s.periode]||0)+(s.bersih||0)});const pk=Object.keys(pm).sort().slice(-6);
  // terlambat terbanyak periode ini
  const[pe]=[period()[1]],lc={};at.filter(x=>x.status==="abnormal"&&x.date>=ymd(ps)&&x.date<=ymd(pe)).forEach(x=>lc[x.uid]=(lc[x.uid]||0)+1);
  const nm=Object.fromEntries(us.map(u=>[u.id,u.name])),top=Object.entries(lc).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([k,v])=>({l:nm[k]||"-",v,c:CAT[1],to:{v:"rekap",RK:{pre:"periode",uid:k,st:"abnormal"}}}));
  const rc=["menunggu","disetujui","ditolak"].map((k,i)=>({l:k[0].toUpperCase()+k.slice(1),v:rq.filter(r=>r.status===k).length,c:CAT[i],to:{v:"approval",AP_ST:k}}));
  return head("Dashboard","Halo, "+esc(ME.name))+`<div class="stats"><div class="st"><b>${emps.length}</b>Karyawan</div><div class="st"><b>${tdy.length}</b>Hadir hari ini</div><div class="st"><b>${pend.length}</b>Menunggu persetujuan</div></div>
  <div class="box"><b>Jadwal default:</b> ${SET.in} - ${SET.out}, toleransi ${SET.tol} menit.</div>
  <div class="cg">${chartBox("Kehadiran hari ini",dShort(today)+" · "+emps.length+" karyawan",donut([{l:"Tepat waktu",v:tOk,c:CAT[0],to:{v:"rekap",RK:{pre:"hari",st:"normal"}}},{l:"Terlambat",v:tLate,c:CAT[1],to:{v:"rekap",RK:{pre:"hari",st:"abnormal"}}},{l:"Belum absen",v:tNo,c:NEU,to:{v:"rekap",RK:{pre:"hari"}}}],tdy.length,"hadir"))}
  ${chartBox("Karyawan per departemen",emps.length+" karyawan",donut(dItems,emps.length,"karyawan"))}
  ${chartBox("Status pengajuan","Cuti, lembur, perbaikan, dll",donut(rc,rq.length,"pengajuan"))}
  ${chartBox("Kehadiran 7 hari terakhir","Tepat waktu vs terlambat",bars(days.map(dShort),[{n:"Tepat waktu",c:CAT[0],v:w.map(x=>x.ok),to:days.map(d=>({v:"rekap",RK:{pre:"custom",from:d,to:d,st:"normal"}}))},{n:"Terlambat",c:CAT[1],v:w.map(x=>x.late),to:days.map(d=>({v:"rekap",RK:{pre:"custom",from:d,to:d,st:"abnormal"}}))}],{stack:true,left:28,W:960,H:230}),6)}
  ${chartBox("Total gaji bersih per periode","Slip yang sudah dihitung · 6 periode terakhir",bars(pk.map(k=>{const[y,m]=k.split("-");return BLN[m-1]+" "+y.slice(2)}),[{n:"Gaji bersih",c:CAT[2],v:pk.map(k=>pm[k]),to:pk.map(k=>({v:"gaji",PM:k}))}],{fmt:rpC,left:52}),3)}
  ${chartBox("Terlambat terbanyak",plabel()+" · periode ini",hbars(top,v=>v+"x"),3)}</div>`;
}

// ---------- PTKP ----------
const PTKP_DESC={TK0:"Tidak kawin, 0 tanggungan",TK1:"Tidak kawin, 1 tanggungan",TK2:"Tidak kawin, 2 tanggungan",TK3:"Tidak kawin, 3 tanggungan",K0:"Kawin, 0 tanggungan",K1:"Kawin, 1 tanggungan",K2:"Kawin, 2 tanggungan",K3:"Kawin, 3 tanggungan"};
function ptkpInfo(c){
  const v=PTKP[c]||PTKP.TK0;
  return`<b>${esc(c)}</b> = ${esc(PTKP_DESC[c]||"")} → PTKP <b>${rp(v)}</b>/tahun (${rp(v/12)}/bulan).<br>
  <span class="mut">PTKP (Penghasilan Tidak Kena Pajak) adalah bagian penghasilan setahun yang tidak dikenai PPh21; makin besar PTKP, makin kecil pajaknya. <b>TK</b> = tidak kawin, <b>K</b> = kawin (pasangan tidak bekerja), angka = jumlah tanggungan (anak / orang tua sedarah, maksimal 3).</span>
  <details><summary>Lihat semua status</summary><table><tr><th>Kode</th><th>Keterangan</th><th>PTKP / tahun</th></tr>${Object.keys(PTKP).map(k=>`<tr class="${k===c?"cur":""}"><td>${k}</td><td>${PTKP_DESC[k]}</td><td>${rp(PTKP[k])}</td></tr>`).join("")}</table></details>`;
}
const ptkpField=val=>`<div class="f" style="grid-column:1/-1"><label>Status PTKP</label><select id="u_ptkp" data-search="0" style="max-width:420px" onchange="document.getElementById('ptkpInfo').innerHTML=ptkpInfo(this.value)">${Object.keys(PTKP).map(k=>`<option value="${k}"${k===val?" selected":""}>${k} — ${PTKP_DESC[k]}</option>`).join("")}</select><div class="ptk" id="ptkpInfo" style="max-width:760px">${ptkpInfo(PTKP[val]?val:"TK0")}</div></div>`;

// ---------- Daftar karyawan: grup departemen, filter Semua / departemen, search ----------
let KF={dept:"*",q:""};
const NODEPT="Tanpa departemen";
function userRow(u){
  const bank=u.rek?`${esc(u.bank||"Bank")} · ${esc(u.rek)}`:(u.role==="admin"?"-":'<span class="warn">belum diisi</span>');
  const find=[u.name,u.email,u.jabatan,u.wa,u.dept,u.bank,u.rek,u.role,u.empStatus].join(" ").toLowerCase();
  return`<tr class="u" data-d="${esc(u.dept||"")}" data-s="${esc(find)}"><td class="ck"><input type="checkbox" class="kck" value="${u.id}"${u.id===ME.id?' disabled title="Akun sendiri tidak bisa dihapus"':""} onchange="kSelUpd()"></td><td>${esc(u.name)}<br><small class="mut">${esc(u.email)}</small></td><td>${esc(u.role||"karyawan")}</td><td>${esc(u.jabatan||"-")}${u.role==="admin"?"":`<br><small class="mut">${punchN(u)}x absen / hari</small><br><small class="mut">${esc(u.empStatus||"status ?")}</small> ${u.joinDate?`<small class="mut">· masuk ${esc(u.joinDate)}</small>`:'<span class="warn">tgl masuk kosong</span>'}`}</td><td>${u.atasanName||u.hrName?`${esc(u.atasanName||"-")} → ${esc(u.hrName||"-")}`:"-"}</td><td>${u.wa?`<a href="https://wa.me/${esc(u.wa)}" target="_blank" rel="noopener">${esc(u.wa)}</a>`:"-"}</td><td>${locLabel(u)}</td><td>${u.role==="admin"?"-":u.faceDesc?"✅":"❌"}</td><td>${rp(u.pokok)}</td><td>${rp(u.tunjangan)}</td><td>${rp(u.target)}</td><td>${esc(u.ptkp||"TK0")}</td><td>${bank}</td><td><button class="btn sm" onclick="EDIT='${u.id}';render();scrollTo(0,0)">Edit</button>${u.id===ME.id?"":` <button class="btn sm red" onclick="delUser('${u.id}')">Hapus</button>`}${u.faceDesc?` <button class="btn sm red" onclick="resetFace('${u.id}')">Reset wajah</button>`:""}${u.slipPin?` <button class="btn sm ghost" onclick="resetPin('${u.id}')">Reset PIN slip</button>`:""}</td></tr>`;
}
function karyawanList(){
  const D=DEPTS().map(d=>d.name),extra=[...new Set(USERS.map(u=>u.dept).filter(d=>d&&!D.includes(d)))],order=[...D,...extra],has=USERS.some(u=>!u.dept);
  const groups=[...order.map(n=>[n,n]),...(has?[[NODEPT,""]]:[])].map(([label,key])=>({label,key,list:USERS.filter(u=>(u.dept||"")===key)})).filter(g=>g.list.length||g.key);
  const chip=(k,l,n)=>`<button type="button" class="chip2" data-d="${esc(k)}" onclick="kfDept(this.dataset.d)">${esc(l)}<small>${n}</small></button>`;
  const th='<tr><th class="ck"><input type="checkbox" id="kall" title="Pilih semua yang tampil" onchange="kSelAll(this.checked)"></th>'+"<th>Nama</th><th>Role</th><th>Jabatan</th><th>Atasan → HR</th><th>WhatsApp</th><th>Lokasi</th><th>Wajah</th><th>Pokok</th><th>Tunjangan</th><th>Target</th><th>PTKP</th><th>Rekening</th><th></th></tr>";
  return`<div class="box"><div class="kbar"><div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="kq" type="search" placeholder="Cari nama, email, jabatan, WhatsApp..." value="${esc(KF.q)}" oninput="kfSearch(this.value)"></div><small class="mut" id="kcount"></small><button type="button" class="btn sm ghost" onclick="kryPdf()">📄 Unduh PDF</button><button type="button" class="btn sm red" id="kdel" style="display:none" onclick="delUsers(kSelIds())"></button></div>
  <div class="chips" style="margin-bottom:14px">${chip("*","Semua",USERS.length)}${groups.map(g=>chip(g.key||"__none__",g.label,g.list.length)).join("")}</div>
  <div class="tw"><table id="ktab" data-pg="karyawan" data-pgq="0">${th}${groups.map(g=>`<tbody data-g="${esc(g.key||"__none__")}"><tr class="grp"><td colspan="14">🏢 ${esc(g.label)}<small>${g.list.length} anggota</small></td></tr>${g.list.map(userRow).join("")}</tbody>`).join("")}<tbody id="kempty" style="display:none"><tr><td colspan="14">${emptyBox("🔎","Tidak ada karyawan yang cocok","Coba kata kunci lain atau pilih Semua.")}</td></tr></tbody></table></div></div>`;
}
function kfApply(){
  const q=KF.q.trim().toLowerCase();let vis=0,tot=0;
  document.querySelectorAll("#ktab tbody[data-g]").forEach(tb=>{
    const g=tb.dataset.g==="__none__"?"":tb.dataset.g,gOn=KF.dept==="*"||KF.dept===g;let n=0;
    tb.querySelectorAll("tr.u").forEach(r=>{tot++;const on=gOn&&(!q||r.dataset.s.includes(q));r.dataset.f=on?"1":"0";if(!on){const k=r.querySelector(".kck");if(k)k.checked=false}if(on)n++});
    vis+=n});
  document.querySelectorAll(".chips .chip2").forEach(c=>c.classList.toggle("on",(c.dataset.d==="__none__"?"":c.dataset.d)===(KF.dept==="*"?"*":KF.dept)));
  const e=document.getElementById("kempty"),c=document.getElementById("kcount");if(e)e.style.display=vis?"none":"";if(c)c.textContent=vis+" dari "+tot+" karyawan";if(typeof tbRefresh==="function")tbRefresh("karyawan",true);kSelUpd();
}
const kSelIds=()=>[...document.querySelectorAll("#ktab .kck:checked")].filter(c=>c.closest("tr").dataset.f!=="0").map(c=>c.value);
function kSelUpd(){
  const ids=kSelIds(),b=document.getElementById("kdel"),all=[...document.querySelectorAll("#ktab .kck:not(:disabled)")].filter(c=>c.closest("tr").dataset.f!=="0"),a=document.getElementById("kall");
  if(b){b.style.display=ids.length?"":"none";b.textContent="🗑 Hapus terpilih ("+ids.length+")"}
  if(a){a.checked=all.length>0&&all.every(c=>c.checked);a.indeterminate=ids.length>0&&!a.checked}
}
function kSelAll(on){document.querySelectorAll("#ktab .kck:not(:disabled)").forEach(c=>{if(c.closest("tr").dataset.f!=="0")c.checked=on});kSelUpd()}
const kfDept=d=>{KF.dept=d==="__none__"?"":d;kfApply()};
const kfSearch=v=>{KF.q=v;kfApply()};

// ---------- Penggajian ----------
const hasSales=u=>(+u.target||0)>0;
let PAYM={};
async function gajiView(){
  USERS=(await get("users")).filter(u=>u.role!=="admin");
  PAYM=Object.fromEntries((await get("payslips","periode",PM)).map(s=>[s.uid,s]));
  const calc=USERS.filter(u=>PAYM[u.id]),paid=calc.filter(u=>PAYM[u.id].paid===true),sum=calc.reduce((a,u)=>a+(PAYM[u.id].bersih||0),0);
  const sel=(id,l,o)=>`<div class="f"><label>${l}</label><select id="${id}">${o.map(([v,t])=>`<option value="${v}">${t}</option>`).join("")}</select></div>`;
  return head("Penggajian",blnFull(PM))+`<div class="box"><div class="f" style="max-width:220px"><label>Periode</label><input type="month" id="pm" value="${PM}" onchange="PM=this.value;render()"></div><p class="mut">Periode absensi ${plabelOf(PM)}. Isi potongan lain (dan penjualan untuk karyawan yang punya target bonus), klik Hitung. Potongan terlambat dihitung otomatis dari data absensi. Bonus cair jika penjualan ≥ target. Slip yang sudah ditransfer tetap bisa diperbarui (tombol Perbarui / Sinkronkan) dan langsung ikut berubah di akun karyawan. PPh21 memakai metode TER (PMK 168/2023) untuk masa pajak biasa dan dihitung ulang setahun pada masa pajak terakhir. BPJS, lembur yang sudah disetujui, dan THR ikut dihitung (batas dan aturan ada di menu Jadwal Kerja).</p><div class="fg" style="max-width:700px;margin-top:6px"><div class="f"><label>Tanggal hari raya (acuan masa kerja THR, kosong = akhir periode)</label><input type="date" value="${THR_REF}" oninput="THR_REF=this.value"></div><div class="f"><label>Masa pajak terakhir (hitung ulang PPh21 setahun)</label><select onchange="PK_LAST=this.value"><option value="auto"${PK_LAST==="auto"?" selected":""}>Otomatis (hanya Desember)</option><option value="1"${PK_LAST==="1"?" selected":""}>Ya, bulan ini</option><option value="0"${PK_LAST==="0"?" selected":""}>Tidak</option></select></div></div><p class="mut"><small>Centang kolom THR pada karyawan yang menerima THR bulan ini, lalu klik Hitung. THR = 1 bulan upah (pokok + tunjangan) untuk masa kerja 12 bulan atau lebih, proporsional untuk 1–11 bulan.</small></p>
  <div class="sum"><button class="btn ghost sm" onclick="syncSlips()" ${calc.length?"":"disabled"} title="Perbarui semua slip periode ini sesuai data karyawan terbaru, termasuk yang sudah masuk ke akun karyawan">🔄 Sinkronkan slip ke akun karyawan</button><span>Slip dihitung: <b>${calc.length}/${USERS.length}</b></span><span>Sudah ditransfer: <b>${paid.length}/${calc.length}</b></span><span>Total gaji bersih: <b>${rp(sum)}</b></span></div></div>
  <div class="box"><h3>Export CSV untuk transfer bank</h3><p class="mut" style="margin-bottom:10px">Berisi nama, bank, no. rekening, dan nominal gaji bersih. Data rekening diisi di menu Karyawan.</p>
  <div class="bkbar">${sel("bk_fmt","Format",[["umum","Umum (lengkap)"],["ringkas","Ringkas (rekening, nama, jumlah, berita)"]])}${sel("bk_sep","Pemisah kolom",[[",","Koma ( , )"],[";","Titik koma ( ; )"]])}${sel("bk_scope","Yang diexport",[["unpaid","Belum ditransfer"],["all","Semua yang sudah dihitung"]])}<button class="btn" onclick="exportBank()">⬇️ Export CSV Bank</button></div></div>
  ${typeof gjBox==="function"?gjBox():""}
  <div class="box"><div class="kbar" style="margin:0"><div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Cari nama, bank, atau rekening..." value="${esc(typeof tbQ==='function'?tbQ("gaji"):"")}" oninput="tbSearch('gaji',this.value)"></div><small class="mut" data-tbc="gaji"></small></div></div>
  <div class="box tw gj"><table data-pg="gaji" data-pgq="0"><tr><th>Karyawan</th><th>Pokok</th><th>Tunjangan</th><th>Penjualan</th><th>Potongan lain</th><th>Bonus</th><th>Lembur</th><th>THR</th><th>Terlambat</th><th>Pot. terlambat</th><th>BPJS</th><th>PPh21</th><th>Bersih</th><th title="Centang setelah gaji ditransfer. Slip gaji lalu muncul di akun karyawan.">Ditransfer <input type="checkbox" class="ckb" title="Centang semua yang sudah dihitung" ${calc.length&&paid.length===calc.length?"checked":""} ${calc.length?"":"disabled"} onchange="paidAll(this)"></th><th></th></tr>${USERS.map(u=>{
    const s=PAYM[u.id],lock=!!(s&&s.paid),dis="",sales=hasSales(u);
    const rek=u.rek?`<small class="mut">${esc(u.bank||"Bank")} · ${esc(u.rek)}</small>`:'<small class="warn">⚠ rekening belum diisi</small>';
    return`<tr data-s="${esc([u.name,u.bank,u.rek,u.dept,u.jabatan].join(" "))}"${lock?' class="paid"':""}><td>${esc(u.name)}<br>${sales?`<small class="mut">Target ${rp(u.target)}</small><br>`:""}${rek}</td><td>${rp(u.pokok)}</td><td>${rp(u.tunjangan)}</td><td>${sales?`<input class="money" inputmode="numeric" id="s_${u.id}" ${dis} value="${(s?s.penjualan:0).toLocaleString("id-ID")}" oninput="fm(this)">`:'<span class="mut">—</span>'}</td><td><input class="money" inputmode="numeric" id="p_${u.id}" ${dis} value="${(s?s.potongan:0).toLocaleString("id-ID")}" oninput="fm(this)"></td><td>${s&&sales?rp(s.bonus):"-"}</td><td>${s&&s.lembur>0?`${rp(s.lembur)}<br><small class="mut">${s.lemburJam} jam</small>`:"-"}</td><td><label style="white-space:nowrap"><input type="checkbox" id="thr_${u.id}" ${s&&s.thr>0?"checked":""}> ${s&&s.thr>0?rp(s.thr):""}</label></td><td>${s&&s.telat!==undefined?`${s.telat}x (kena ${s.telatKena}x)`:"-"}</td><td>${s&&s.telat!==undefined?rp(s.potTelat):"-"}</td><td>${s&&s.bpjsKary>0?rp(s.bpjsKary):"-"}</td><td>${s?rp(s.pph):"-"}${s&&s.pphMetode?` <small class="mut">${esc(s.pphMetode)}</small>`:""}</td><td><b>${s?rp(s.bersih):"-"}</b></td><td>${s?`<input type="checkbox" ${lock?"checked":""} onchange="setPaid('${u.id}',this)" title="Centang jika gaji sudah ditransfer">${lock&&s.paidAt?`<br><small class="mut">${fmtD(s.paidAt)}</small>`:""}`:'<span class="mut">-</span>'}</td><td class="act"><button class="btn sm" onclick="hit('${u.id}')" title="${lock?"Hitung ulang dan perbarui slip di akun karyawan":"Hitung slip"}">${lock?"Perbarui":"Hitung"}</button>${s?`<button class="btn ghost sm" onclick="slipPdf('${s.id}')" title="Unduh slip PDF">PDF</button>`:""}</td></tr>`}).join("")}</table></div>`;
}
async function calcSlip(u,sales,pot){
  const[ps,pe]=periodOf(PM),[att,reqs,slips]=await Promise.all([get("attendance","uid",u.id),get("requests","uid",u.id),get("payslips","uid",u.id)]);
  const amOff=new Set(reqs.filter(r=>r.type==="cuti"&&r.status==="disetujui"&&r.sesi==="pagi"&&+r.hari===0.5).map(r=>r.dari)); // cuti setengah hari (masuk siang) bukan terlambat
  const late=att.filter(x=>x.date>=ymd(ps)&&x.date<=ymd(pe)&&x.status==="abnormal"&&!amOff.has(x.date)).length;
  return hitung(u,hasSales(u)?sales:0,pot,lateCalc(late),payCtx(u,reqs,slips,ps,pe));
}
// Hitung / hitung ulang satu slip. Slip yang sudah ditransfer (sudah tampil di akun karyawan) tetap berstatus ditransfer dan ikut diperbarui di akun karyawan secara langsung.
async function hit(id){
  const u=USERS.find(x=>x.id===id),ref=db.collection("payslips").doc(id+"_"+PM),ex=await ref.get(),old=ex.exists?ex.data():null,sent=!!(old&&old.paid);
  if(sent&&!await uiConfirm(`Slip ${u.name} periode ${blnFull(PM)} sudah ditransfer dan sudah tampil di akun karyawan.\nHitung ulang akan memperbarui slip di akun ${u.name} juga. Lanjutkan?`))return;
  const se=$("#s_"+id),p=await calcSlip(u,se?num(se):0,num($("#p_"+id))),now=Date.now(),d={...p,uid:id,name:u.name,periode:PM,calcAt:now};
  if(sent)Object.assign(d,{paid:true,paidAt:old.paidAt||now,paidBy:old.paidBy||null,updatedAt:now});else Object.assign(d,{paid:false,paidAt:null});
  await ref.set(d);toast(sent?"Slip diperbarui dan tersinkron ke akun karyawan.":"Slip dihitung. Centang \"Ditransfer\" setelah gaji dikirim agar slip muncul di akun karyawan.");render();
}
// Sinkronkan semua slip periode ini dengan data karyawan & absensi terbaru (penjualan dan potongan lain yang sudah diisi tetap dipakai)
async function syncSlips(){
  const l=USERS.filter(u=>PAYM[u.id]);if(!l.length)return toast("Belum ada slip yang dihitung untuk periode ini");
  const sent=l.filter(u=>PAYM[u.id].paid===true).length;
  if(!await uiConfirm(`Sinkronkan ${l.length} slip periode ${blnFull(PM)} dengan data karyawan terbaru (gaji pokok, tunjangan, PTKP, bonus, dan data absensi)?\nPenjualan & potongan lain yang sudah diisi tetap dipakai.`+(sent?`\n${sent} slip yang sudah ditransfer akan ikut diperbarui di akun karyawan.`:"")))return;
  const b=db.batch(),now=Date.now();let n=0;
  for(const u of l){const o=PAYM[u.id],p=await calcSlip(u,o.penjualan||0,o.potongan||0),upd={...p,name:u.name};
    if(Object.keys(upd).some(k=>JSON.stringify(upd[k])!==JSON.stringify(o[k]))){upd.calcAt=now;if(o.paid===true)upd.updatedAt=now;b.update(db.collection("payslips").doc(o.id),upd);n++}}
  if(n)await b.commit();toast(n?`${n} slip diperbarui dan tersinkron ke akun karyawan`:"Semua slip sudah sesuai data terbaru");render();
}
async function setPaid(id,el){
  const on=el.checked,u=USERS.find(x=>x.id===id);
  if(!await uiConfirm(on?`Tandai gaji ${u.name} sudah ditransfer?\nSlip gaji periode ${blnFull(PM)} akan muncul di akun ${u.name}.`:`Batalkan tanda transfer untuk ${u.name}?\nSlip gaji akan disembunyikan dari akun karyawan dan bisa dihitung ulang.`)){el.checked=!on;return}
  await db.collection("payslips").doc(id+"_"+PM).update({paid:on,paidAt:on?Date.now():null,paidBy:on?ME.id:null});
  toast(on?"Ditandai sudah ditransfer. Slip masuk ke akun karyawan.":"Tanda transfer dibatalkan");render();
}
async function paidAll(el){
  const on=el.checked,l=USERS.filter(u=>PAYM[u.id]&&(PAYM[u.id].paid===true)!==on);
  if(!l.length)return;
  if(!await uiConfirm(on?`Tandai ${l.length} slip sebagai sudah ditransfer?\nSlip akan muncul di akun masing-masing karyawan.`:`Batalkan tanda transfer ${l.length} slip?`)){el.checked=!on;return}
  const b=db.batch();l.forEach(u=>b.update(db.collection("payslips").doc(u.id+"_"+PM),{paid:on,paidAt:on?Date.now():null,paidBy:on?ME.id:null}));
  await b.commit();toast(`${l.length} slip diperbarui`);render();
}
// ---- Export CSV format bank ----
const bankTxt=s=>String(s??"").replace(/[^A-Za-z0-9 .\-]/g,"").replace(/\s+/g," ").trim();
const bankCell=(v,sep)=>{v=String(v??"");return v.includes(sep)||/["\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v};
async function exportBank(){
  const fmt=$("#bk_fmt").value,sep=$("#bk_sep").value,scope=$("#bk_scope").value;
  const l=USERS.filter(u=>PAYM[u.id]&&(scope==="all"||PAYM[u.id].paid!==true)&&(PAYM[u.id].bersih||0)>0);
  if(!l.length)return toast(scope==="all"?"Belum ada slip yang dihitung untuk periode ini":"Tidak ada slip yang belum ditransfer");
  const miss=l.filter(u=>!/^\d{5,20}$/.test(u.rek||"")),ok=l.filter(u=>!miss.includes(u));
  if(miss.length&&!await uiConfirm(`${miss.length} karyawan belum punya no. rekening dan dilewati:\n${miss.map(u=>"• "+u.name).join("\n")}\n\nLanjut export ${ok.length} karyawan lainnya?`))return;
  if(!ok.length)return toast("Tidak ada karyawan dengan data rekening lengkap");
  const note=("Gaji "+blnFull(PM)).slice(0,30),nm=u=>bankTxt(u.rekName||u.name),amt=u=>Math.round(PAYM[u.id].bersih);
  const rows=fmt==="ringkas"?[["No Rekening","Nama Penerima","Jumlah","Berita"],...ok.map(u=>[u.rek,nm(u),amt(u),note])]
    :[["No","Nama Karyawan","Bank","No Rekening","Nama Pemilik Rekening","Jumlah","Berita"],...ok.map((u,i)=>[i+1,bankTxt(u.name),bankTxt(u.bank),u.rek,nm(u),amt(u),note])];
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(c=>bankCell(c,sep)).join(sep)).join("\r\n")+"\r\n"],{type:"text/csv"}));
  a.download=`transfer-gaji-${PM}.csv`;a.click();
  toast(`Export ${ok.length} baris · total ${rp(ok.reduce((x,u)=>x+amt(u),0))}`);
}

// ---------- Notifikasi (lonceng) ----------
let NF=[],NF_T=0;
const nfKey=()=>"nfSeen_"+(ME&&ME.id);
const nfSeen=()=>{try{return JSON.parse(localStorage.getItem(nfKey())||"[]")}catch(e){return[]}};
const nfSave=l=>{try{localStorage.setItem(nfKey(),JSON.stringify(l.slice(-300)))}catch(e){}};
const ago=t=>{const s=Math.max(0,(Date.now()-t)/1000);return s<60?"baru saja":s<3600?Math.floor(s/60)+" menit lalu":s<86400?Math.floor(s/3600)+" jam lalu":Math.floor(s/86400)+" hari lalu"};
const REQ_LBL={cuti:"cuti",permintaan:"permintaan",perbaikan:"perbaikan absensi",lembur:"lembur",lapangan:"absensi lapangan"};
async function nfBuild(){
  const L=[],day=864e5,now=Date.now();
  try{
    if(!ADMIN()){
      const[sl,rq]=await Promise.all([get("payslips","uid",ME.id),get("requests","uid",ME.id)]);
      sl.filter(s=>s.paid===true&&s.paidAt&&now-Math.max(s.paidAt,s.updatedAt||0)<90*day).forEach(s=>{const up=s.updatedAt&&s.updatedAt>s.paidAt;L.push({id:`slip:${s.id}:${s.paidAt}:${s.updatedAt||0}`,t:up?s.updatedAt:s.paidAt,ic:up?"🔄":"💰",title:up?"Slip gaji diperbarui":"Slip gaji tersedia",text:up?`Slip periode ${blnFull(s.periode)} diperbarui admin. Gaji bersih: ${rp(s.bersih)}`:`Gaji periode ${blnFull(s.periode)} sudah ditransfer: ${rp(s.bersih)}`,go:"slip"})});
      rq.filter(r=>r.status!=="menunggu"&&r.finalAt&&now-r.finalAt<30*day).forEach(r=>{const ok=r.status==="disetujui";L.push({id:`req:${r.id}:${r.status}`,t:r.finalAt,ic:ok?"✅":"❌",title:`Pengajuan ${REQ_LBL[r.type]||r.type} ${r.status}`,text:ok?"Pengajuanmu sudah disetujui.":"Pengajuanmu ditolak"+((r.log||[]).slice(-1)[0]?.note?": "+(r.log.slice(-1)[0].note):"."),go:FORMS[r.type]?r.type:"permintaan"})});
    }
    let todo=[];
    if(ADMIN())todo=(await get("requests","status","menunggu"));
    else if(isHR()||ME.isAtasan||ME.role==="atasan"){
      todo=(await myApprovalReqs()).filter(r=>r.status==="menunggu"&&((r.step==="atasan"&&isTurnAtasan(r,ME.id))||(r.step==="hr"&&r.hrId===ME.id)));
    }
    if(todo.length)L.push({id:"todo:"+todo.map(r=>r.id).sort().join(","),t:Math.max(...todo.map(r=>r.createdAt||0)),ic:"📥",title:`${todo.length} pengajuan menunggu keputusan`,text:todo.slice(0,3).map(r=>r.name).join(", ")+(todo.length>3?" dan lainnya":""),go:"approval"});
    if(ADMIN()){
      try{const rr=await get("resetReq");if(rr.length)L.push({id:"lupa:"+rr.map(r=>r.id).sort().join(","),t:Math.max(...rr.map(r=>r.at||0)),ic:"🔑",title:`${rr.length} permintaan lupa password`,text:rr.slice(0,3).map(r=>r.email).join(", "),go:"password"})}catch(e){}
      const us=await get("users"),emp=new Set(us.filter(u=>u.role!=="admin").map(u=>u.id)),un=(await get("payslips")).filter(s=>s.paid!==true&&emp.has(s.uid));
      if(un.length)L.push({id:"unpaid:"+un.map(s=>s.id).sort().join(","),t:Math.max(...un.map(s=>s.calcAt||0),0)||now,ic:"🏦",title:`${un.length} slip gaji belum ditransfer`,text:"Centang \"Ditransfer\" di Penggajian setelah gaji dikirim agar slip masuk ke akun karyawan.",go:"gaji"});
    }
  }catch(e){}
  return L.sort((a,b)=>b.t-a.t);
}
async function nfRefresh(force){
  if(!ME||(!force&&Date.now()-NF_T<4000))return;NF_T=Date.now();NF=await nfBuild();nfPaint();
}
function nfPaint(){
  const seen=new Set(nfSeen()),un=NF.filter(n=>!seen.has(n.id)).length,b=document.getElementById("nfn");
  if(b){b.hidden=!un;b.textContent=un>9?"9+":un}
  const dd=document.getElementById("nfdd");if(!dd)return;
  dd.innerHTML=`<div class="nfh"><b>Notifikasi</b><button type="button" onclick="nfAll()">Tandai semua dibaca</button></div>`+(NF.length?NF.map((n,i)=>`<div class="nfi${seen.has(n.id)?"":" un"}" onclick="nfGo(${i})"><span class="ic">${n.ic}</span><div class="tx"><b>${esc(n.title)}</b><span>${esc(n.text)}</span><small>${ago(n.t)}</small></div></div>`).join(""):'<div class="nfe"><div class="ei">🔔</div>Belum ada notifikasi</div>');
  tr(dd);
}
function nfToggle(e){e.stopPropagation();const dd=document.getElementById("nfdd"),open=!dd.classList.contains("show");document.getElementById("umenu").classList.remove("show");dd.classList.toggle("show",open);if(open)nfRefresh(true)}
function nfAll(){nfSave([...new Set([...nfSeen(),...NF.map(n=>n.id)])]);nfPaint()}
function nfGo(i){const n=NF[i];if(!n)return;nfSave([...new Set([...nfSeen(),n.id])]);nfPaint();document.getElementById("nfdd").classList.remove("show");if(n.go)go(n.go)}
function nfInit(){NF=[];NF_T=0;nfRefresh(true);if(!nfInit.t)nfInit.t=setInterval(()=>nfRefresh(true),90000)}
document.addEventListener("click",e=>{if(!e.target.closest("#nfwrap")){const d=document.getElementById("nfdd");if(d)d.classList.remove("show")}});
