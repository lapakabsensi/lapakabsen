// ===== Dashboard minimalis + menu Absensi (kalender & statistik kehadiran) =====
// Dimuat setelah app.js. Layar scan wajah = view "rekam" (dibuka dari kotak jam Masuk/Pulang di Beranda, lewat absenGo()); menu "Absensi" sekarang hanya kalender + statistik.
addDict({"Rekam Absen":["Clock In/Out","打卡"]});
const dsL=(i,e,z)=>LANG==="en"?e:LANG==="zh"?z:i;
const dsWD={id:["Min","Sen","Sel","Rab","Kam","Jum","Sab"],en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],zh:["日","一","二","三","四","五","六"]};
const dsMO={id:["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],en:["January","February","March","April","May","June","July","August","September","October","November","December"],zh:["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]};
const dsFN=[["absen","📅","Absensi"],["slip","🧾","Slip Gaji"],["permintaan","📝","Permintaan"],["cuti","🏖️","Cuti"],["perbaikan","🛠️","Perbaikan Absensi"],["lembur","🌙","Lembur"],["laporan","📊","Laporan"]];
const dsPd=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const dsOff=d=>{const w=d.getDay();return w===0||((+SET.workDays||6)===5&&w===6)||(typeof isHoliday==="function"&&isHoliday(ymd(d)))};
// penanda hari libur di kalender: Minggu / hari libur nasional (merah), cuti bersama yang tidak dihitung libur (garis merah), libur sesuai jadwal shift (abu)
const dsHolName=k=>typeof holName==="function"?holName(k):"";
const dsHolTag=d=>{const k=ymd(d),n=dsHolName(k),sun=d.getDay()===0,off=dsOff(d);
  if(n)return `<span class="tag ${off?"no":""}">${off?"🎌 ":""}${esc(n)}${off?"":" ("+dsL("tidak libur","not a day off","非休息日")+")"}</span>`;
  return sun?`<span class="tag no">${dsL("Minggu","Sunday","星期日")}</span>`:off?`<span class="tag no">${dsL("Hari libur","Day off","休息日")}</span>`:""};
const dsDate=s=>{const d=dsPd(s);return LANG==="zh"?`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`:`${pad(d.getDate())} ${dsMO[LANG][d.getMonth()].slice(0,3)} ${d.getFullYear()}`};
let DSC=null,DSA=[],DSTODAY=null,DSF=[],DSL=[];
// pengajuan absen lapangan yang belum disetujui (menunggu / ditolak) ditampilkan di riwayat absensi
const dsFq=(date,slot)=>DSF.filter(r=>r.tgl===date&&(!slot||r.slot===slot)).sort((a,b)=>b.createdAt-a.createdAt)[0];
const dsFTag=r=>r.status==="menunggu"?`<span class="tag">⏳ ${dsL("Menunggu approval","Waiting for approval","等待审批")}</span>`:`<span class="tag no">${dsL("Ditolak","Rejected","已拒绝")}</span>`;

// ---------- Beranda karyawan (minimalis) ----------
const dsHomeOld=V.home,dsRekam=V.absen;
async function dsHome(){
  await schLoad();const a=await myAtt(),t=await openRec(a),sh=shift(),n=punchN(),fb=await fieldBanner();
  const ok=a.filter(x=>x.status==="normal").length,bad=a.length-ok,deg=a.length?Math.round(ok/a.length*360):0;
  DSTODAY=t||null;
  const slot=(k,l)=>`<button class="hm-b" onclick="${t&&t[k]?`absenDetail('${k}')`:"absenGo()"}"><span>${l}</span><b>${(t&&t[k])||"--:--"}</b></button>`;
  return `<div class="hm">
  <div class="hm-top"><div class="hm-av">${ME.avatar?`<img src="${phSrc(ME.avatar)}"${phAttr(ME.avatar)} alt="">`:esc((ME.name||"?").slice(0,2).toUpperCase())}</div><div><div class="hm-hi">${dsL("Hai","Hi","你好")}, ${esc(ME.name)}</div><div class="mut">${esc([ME.jabatan,COMP&&COMP.name].filter(Boolean).join(" · "))}</div></div></div>
  <div class="hm-c"><div class="hm-l"><div class="hm-card"><div class="hm-t">${dsL("Absensi","Attendance","考勤")}</div><small>${sh.off?dsL("Jadwal hari ini: LIBUR","Scheduled off today","今日排休")+" · ":""}Shift ${sh.name&&!sh.off?esc(sh.name)+" ":""}${sh.in} - ${sh.out}</small>
    <div class="hm-two">${slot("in",dsL("Masuk","In","上班"))}${slot("out",dsL("Pulang","Out","下班"))}</div>
    ${n===4?`<div class="hm-mid">${dsL("Siang","Noon","午间")} ${(t&&t.mid)||"--:--"} · ${dsL("Sore","Afternoon","下午")} ${(t&&t.aft)||"--:--"}</div>`:""}</div>
  ${fb}${schStrip()}<div class="box"><h3>${dsL("Fungsi Umum","Quick menu","常用功能")}</h3><div class="hm-grid">${dsFN.filter(f=>!ADMIN()||["absen","laporan"].includes(f[0])).map(f=>`<div onclick="go('${f[0]}')"><span>${f[1]}</span>${f[2]}</div>`).join("")}</div></div>
</div>
  <div class="hm-r"><div class="box"><div class="row" onclick="go('absen')" style="cursor:pointer"><h3 style="margin:0">${dsL("Statistik Pribadi","My statistics","个人统计")}</h3><span class="mut">${plabel()} ›</span></div>
    <div class="hm-st"><div class="hm-dn" style="background:${a.length?`conic-gradient(#16a34a 0 ${deg}deg,var(--bad) ${deg}deg 360deg)`:"#e2e8f0"}"><i></i></div>
    <div class="hm-lg"><div><i style="background:#16a34a"></i>${dsL("Kehadiran Normal","Normal attendance","正常出勤")}<b>${ok}</b></div><div><i style="background:var(--bad)"></i>${dsL("Abnormal","Abnormal","异常")}<b>${bad}</b></div></div></div></div>
  ${typeof lateBox==="function"?lateBox(a):""}<div class="box hm-hist"><h3>${dsL("Riwayat Absensi","Recent attendance","最近考勤")}</h3>${attTable(a.slice(0,6))}</div></div></div></div>`;
}

// ---------- Menu Absensi: kalender + statistik kehadiran ----------
async function dsAbsen(){
  await schLoad();DSA=await get("attendance","uid",ME.id);const rq=await get("requests","uid",ME.id);DSF=rq.filter(r=>r.type==="lapangan"&&r.status!=="disetujui");DSL=rq.filter(r=>r.type==="cuti"&&r.status==="disetujui"&&r.dari);const n=new Date();
  DSC={y:n.getFullYear(),m:n.getMonth(),sel:ymd(n),tab:"hari"};AFTER=dsPaint;
  return head("Absensi",esc(ME.name))+`<div class="cal-tabs" id="ctabs"></div><div id="cbody"></div>`;
}
// jenis hari untuk kalender: ok (tepat waktu), late (terlambat), cuti (cuti disetujui), alpa (hari kerja lewat tanpa absen & tanpa cuti), "" (libur / belum terjadi / belum ada data)
const dsLeave=k=>DSL.find(r=>r.dari<=k&&(r.sampai||r.dari)>=k);
function dsKind(k,d,r,first){
  const lv=dsLeave(k),half=lv&&+lv.hari===0.5;
  if(r)return r.status==="normal"||(half&&lv.sesi==="pagi")?"ok":"late"; // cuti setengah hari pagi: masuk siang bukan terlambat
  const sc=SCH[ME.id+"_"+k];
  if(dsOff(d)||(sc&&sc.off))return"";
  if(lv&&!half)return"cuti"; // cuti setengah hari tanpa absen tetap dihitung tidak hadir separuhnya (alpa)
  if(k>=ymd(new Date())||k<=first||k<(ME.joinDate||""))return"";
  if(DSF.some(q=>q.tgl===k&&q.status==="menunggu"))return"";
  return"alpa";
}
const dsFirst=()=>DSA.reduce((x,a)=>a.date<x?a.date:x,"9999");
function dsRange(from,to){
  const m=Object.fromEntries(DSA.map(a=>[a.date,a])),first=dsFirst(),c={ok:0,late:0,alpa:0,cuti:0};
  for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1)){const k=ymd(d),t=dsKind(k,d,m[k],first);if(t)c[t]++}
  return{ok:c.ok,bad:c.late,none:c.alpa,cuti:c.cuti};
}
const dsStats=s=>`<div class="stats s4"><div class="st"><b>${s.ok}</b>${dsL("Tepat waktu","On time","准时")}</div><div class="st"><b>${s.bad}</b>${dsL("Terlambat","Late","迟到")}</div><div class="st"><b>${s.none}</b>${dsL("Alpa","Absent","旷工")}</div><div class="st"><b>${s.cuti}</b>${dsL("Cuti","Leave","请假")}</div></div>`;
function dsPaint(){
  const b=$("#cbody");if(!b)return;const T=[["hari",dsL("Hari","Day","日")],["minggu",dsL("Minggu","Week","周")],["bulan",dsL("Bulan","Month","月")]];
  $("#ctabs").innerHTML=T.map(t=>`<button class="${DSC.tab===t[0]?"on":""}" onclick="dsTab('${t[0]}')">${t[1]}</button>`).join("");
  b.innerHTML=DSC.tab==="hari"?dsDay():DSC.tab==="minggu"?dsWeek():dsMonth();tr($("#view"));
}
const dsTab=t=>{DSC.tab=t;dsPaint()};
function dsPick(k){const d=dsPd(k);DSC.sel=k;DSC.y=d.getFullYear();DSC.m=d.getMonth();dsPaint()}
function dsMove(n){const d=new Date(DSC.y,DSC.m+n,1),td=new Date();DSC.y=d.getFullYear();DSC.m=d.getMonth();DSC.sel=ymd(d.getMonth()===td.getMonth()&&d.getFullYear()===td.getFullYear()?td:d);dsPaint()}
function dsWk(n){const d=dsPd(DSC.sel);d.setDate(d.getDate()+n*7);dsPick(ymd(d))}
const dsTitle=()=>LANG==="zh"?`${DSC.y}年${DSC.m+1}月`:`${dsMO[LANG][DSC.m]} ${DSC.y}`;
const dsNav=(t,f)=>`<div class="row"><b class="cal-t">${t}</b><span><button class="btn ghost sm" onclick="${f}(-1)">‹</button> <button class="btn ghost sm" onclick="${f}(1)">›</button></span></div>`;
function dsDay(){
  const m=Object.fromEntries(DSA.map(a=>[a.date,a])),td=ymd(new Date()),first=dsFirst(),f=new Date(DSC.y,DSC.m,1).getDay(),dim=new Date(DSC.y,DSC.m+1,0).getDate(),cells=Math.ceil((f+dim)/7)*7;let g="";
  const KT={ok:dsL("Tepat waktu","On time","准时"),late:dsL("Terlambat","Late","迟到"),alpa:dsL("Alpa (tidak ada absen)","Absent (no record)","旷工（无记录）"),cuti:dsL("Cuti","Leave","请假")};
  for(let i=0;i<cells;i++){const d=new Date(DSC.y,DSC.m,1-f+i),k=ymd(d),r=m[k],cur=d.getMonth()===DSC.m;
    const hn=dsHolName(k),off=dsOff(d),sc=SCH[ME.id+"_"+k],so=!off&&sc&&sc.off,kd=cur?dsKind(k,d,r,first):"";
    const ttl=kd?KT[kd]+(kd==="cuti"?": "+esc(dsLeave(k).jenis||""):"")+(kd==="late"&&r.in?" ("+r.in+")":""):hn||(d.getDay()===0?dsL("Minggu","Sunday","星期日"):so?dsL("Libur sesuai jadwal","Scheduled off","排休"):"");
    g+=`<button class="cal-d${cur?"":" o"}${k===DSC.sel?" sel":""}${k===td?" td":""}${off?" hol":""}${hn&&!off?" cb":""}${so?" soff":""}${kd?" c-"+kd:""}"${ttl?` title="${ttl}"`:""} onclick="dsPick('${k}')">${d.getDate()}${hn?'<b class="hd"></b>':""}${!r&&DSF.some(q=>q.tgl===k&&q.status==="menunggu")?'<i class="wait"></i>':""}</button>`}
  const lg=(c,t)=>`<span><i class="lgc c-${c}"></i>${t}</span>`;
  return `<div class="box">${dsNav(dsTitle(),"dsMove")}<div class="cal-w">${dsWD[LANG].map(x=>`<span>${x}</span>`).join("")}</div><div class="cal-g">${g}</div>
    <div class="cal-lg">${lg("ok",KT.ok)}${lg("late",KT.late)}${lg("alpa",dsL("Alpa","Absent","旷工"))}${lg("cuti",KT.cuti)}<span><i style="background:#f59e0b;border-radius:50%"></i>${dsL("Menunggu approval","Pending","待审批")}</span><span><i class="lg-hol"></i>${dsL("Minggu / hari libur","Sunday / holiday","周日 / 假日")}</span><span><i class="lg-cb"></i>${dsL("Cuti bersama","Collective leave","集体休假")}</span><span><i class="lg-so"></i>${dsL("Libur sesuai jadwal","Scheduled off","排休")}</span></div></div>${dsDayCard(m[DSC.sel])}`;
}
// label status hari terpilih di kartu detail
function dsKindTag(k){
  const d=dsPd(k),r=DSA.find(a=>a.date===k),t=dsKind(k,d,r,dsFirst());
  if(t==="ok")return`<span class="tag ok">${dsL("Tepat waktu","On time","准时")}</span>`;
  if(t==="late")return`<span class="tag" style="background:#fef3c7;color:#92400e">${dsL("Terlambat","Late","迟到")}</span>`;
  if(t==="alpa")return`<span class="tag no">${dsL("Alpa","Absent","旷工")}</span>`;
  if(t==="cuti"){const l=dsLeave(k);return`<span class="tag" style="background:#dbeafe;color:#1d4ed8">${dsL("Cuti","Leave","请假")}${l&&l.jenis?": "+esc(l.jenis):""}</span>`}
  return"";
}
function dsDayCard(r){
  const k=DSC.sel,sh=shift(ME,k),n=punchN(),td=ymd(new Date()),sj=dsL("Jadwal Masuk","Scheduled in","应上班"),sp=dsL("Jadwal Pulang","Scheduled out","应下班");
  const steps=n===4?[["in",sj+" "+sh.in],["mid",dsL("Absen Siang","Noon check","午间打卡")],["aft",dsL("Absen Sore","Afternoon check","下午打卡")],["out",sp+" "+sh.out]]:[["in",sj+" "+sh.in],["out",sp+" "+sh.out]];
  const loc=x=>placeInline(x);
  const rows=steps.map(([s,lb])=>{const v=r&&r[s],late=s==="in"&&v&&r.status==="abnormal"?` <span class="tag no">${dsL("Terlambat","Late","迟到")} ${Math.max(0,mn(v)-mn(sh.in))} ${dsL("mnt","min","分钟")}</span>`:"";
    return `<div class="cal-s${v?" on":""}"><i></i><div><div class="${v?"":"mut"}">${lb}</div>${v?`<b class="cal-tm">${v}</b>${late}${r[s+"Field"]?` <span class="tag">${dsL("Lapangan","Field","外勤")}</span>`:""}${loc(r[s+"Loc"])}`:`${(()=>{const q=dsFq(k,s);return q?`<b class="cal-tm">${esc(q.jam)}</b> ${dsFTag(q)} <span class="tag">${dsL("Lapangan","Field","外勤")}</span>${q.photo?`<br><img src="${phSrc(q.photo)}"${phAttr(q.photo)} alt="" onclick="photoZoom(this.src)" style="width:64px;height:64px;border-radius:10px;object-fit:cover;margin-top:6px;cursor:zoom-in">`:""}${q.status==="ditolak"&&(q.log||[]).slice(-1)[0]&&q.log.slice(-1)[0].note?`<br><small class="mut">${esc(q.log.slice(-1)[0].note)}</small>`:""}<br><small class="mut">${q.status==="menunggu"?chainBar(q):""}</small>`:`<span class="mut cal-nt">${k>=td?dsL("Belum Dimulai","Not started","未开始"):dsL("Tidak ada catatan","No record","无记录")}</span>`})()}`}</div></div>`}).join("");
  return `<div class="box"><h3>${dsDate(k)} ${dsHolTag(dsPd(k))} ${dsKindTag(k)}</h3><p class="mut" style="margin:-6px 0 14px">${sh.off?dsL("Libur (sesuai jadwal)","Scheduled off","排休"):"Shift "+(sh.name?esc(sh.name)+" ":"")+sh.in+" - "+sh.out}${!r&&!sh.off&&!SCH[ME.id+"_"+k]&&dsOff(dsPd(k))?" · "+dsL("Hari libur","Day off","休息日"):""}</p><div class="cal-tl">${rows}</div></div>`;
}
function dsWeek(){
  const s=dsPd(DSC.sel);s.setDate(s.getDate()-s.getDay());const e=new Date(s);e.setDate(e.getDate()+6);
  const m=Object.fromEntries(DSA.map(a=>[a.date,a]));let rows="";
  for(let i=0;i<7;i++){const d=new Date(s);d.setDate(s.getDate()+i);const k=ymd(d),r=m[k];
    const sc=SCH[ME.id+"_"+k],hn=dsHolName(k),off=dsOff(d),
      st=r?`${r.in||"-"} - ${r.out||"-"} ${tag(r.status)}`:(()=>{const q=dsFq(k);return q?`${esc(q.slotLbl||"")} ${esc(q.jam)} ${dsFTag(q)}`:""})()||`<span class="mut">${off?dsL("Libur","Off","休息"):k<ymd(new Date())?dsL("Tidak ada catatan","No record","无记录"):"-"}</span>`;
    rows+=`<div class="wk${off?" hol-r":""}"><div class="wk-d"><b>${dsWD[LANG][i]}</b><small>${dsDate(k).slice(0,LANG==="zh"?99:6)}</small></div><div class="wk-c">${hn?`<span class="tag${off?" no":""}">${esc(hn)}</span>`:""}${sc?`<span class="shchip"${sc.color?` style="--c:${esc(sc.color)}"`:""}>${esc(sc.off?"Libur":sc.name+" "+sc.in+"-"+sc.out)}</span>`:""}</div><div class="wk-s">${st}</div></div>`}
  return `<div class="box">${dsNav(dsDate(ymd(s))+" – "+dsDate(ymd(e)),"dsWk")}</div>${dsStats(dsRange(s,e))}<div class="box">${rows}</div>`;
}
function dsMonth(){
  const s=new Date(DSC.y,DSC.m,1),e=new Date(DSC.y,DSC.m+1,0),k0=ymd(s),k1=ymd(e),st=dsRange(s,e),tot=st.ok+st.bad+st.none,deg=tot?Math.round(st.ok/tot*360):0,deg2=tot?Math.round((st.ok+st.bad)/tot*360):0;
  const rec=DSA.filter(a=>a.date>=k0&&a.date<=k1).sort((a,b)=>b.date.localeCompare(a.date)),ins=rec.filter(a=>a.in).map(a=>mn(a.in)),avg=ins.length?Math.round(ins.reduce((x,y)=>x+y,0)/ins.length):null;
  return `<div class="box">${dsNav(dsTitle(),"dsMove")}<div class="hm-st"><div class="hm-dn" style="background:${tot?`conic-gradient(#16a34a 0 ${deg}deg,var(--bad) ${deg}deg ${deg2}deg,#cbd5e1 ${deg2}deg 360deg)`:"#e2e8f0"}"><i></i></div><div class="hm-lg"><div><i style="background:#16a34a"></i>${dsL("Kehadiran Normal","Normal attendance","正常出勤")}<b>${st.ok}</b></div><div><i style="background:var(--bad)"></i>${dsL("Abnormal","Abnormal","异常")}<b>${st.bad}</b></div><div><i style="background:#cbd5e1"></i>${dsL("Tanpa absen","No record","无记录")}<b>${st.none}</b></div></div></div>
  ${avg!=null?`<p class="mut" style="margin-top:12px">${dsL("Rata-rata jam masuk","Average clock-in","平均上班时间")}: <b style="color:var(--ink)">${pad(Math.floor(avg/60))}:${pad(avg%60)}</b></p>`:""}</div>
  ${(()=>{const w=DSF.filter(q=>q.tgl>=k0&&q.tgl<=k1).sort((x,y)=>y.createdAt-x.createdAt);return w.length?`<div class="box"><h3>${dsL("Absen Lapangan","Field attendance","外勤打卡")}</h3>${w.map(q=>`<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)"><span><b>${esc(q.slotLbl||"")}</b> · ${q.tgl} ${esc(q.jam)}</span>${dsFTag(q)}</div>`).join("")}</div>`:""})()}
  <div class="box"><h3>${dsL("Riwayat","History","记录")}</h3>${attTable(rec)}</div>`;
}
V.myhome=dsHome;V.rekam=dsRekam;V.absen=dsAbsen;V.home=()=>ADMIN()?dsHomeOld():dsHome();

// ---------- Detail absen yang sudah tercatat (hanya lihat, tidak bisa diubah / scan ulang) ----------
function absenDetail(k){
  const r=DSTODAY;if(!r||!r[k])return;
  const nm={in:dsL("Masuk","Clock in","上班"),mid:dsL("Siang","Noon","午间"),aft:dsL("Sore","Afternoon","下午"),out:dsL("Pulang","Clock out","下班")}[k],sh=shift(ME,r.date);
  let loc=r[k+"Loc"];if(loc&&typeof loc==="object")loc=`${(+loc.lat).toFixed(5)},${(+loc.lng).toFixed(5)}`;
  const late=k==="in"&&r.status==="abnormal"?` <span class="tag no">${dsL("Terlambat","Late","迟到")} ${Math.max(0,mn(r.in)-mn(sh.in))} ${dsL("mnt","min","分钟")}</span>`:"",
    ph=r[k+"Photo"],dist=r[k+"Dist"];
  const o=document.createElement("div");o.className="zoom absd";
  o.innerHTML=`<div class="box absd-c" onclick="event.stopPropagation()"><div class="row"><h3 style="margin:0">${dsL("Absen","Clock","打卡")} ${nm}</h3><button class="btn ghost sm" onclick="this.closest('.absd').remove()">✕</button></div>
  <div class="absd-t">${esc(r[k])}${late}${r[k+"Field"]?` <span class="tag">${dsL("Lapangan","Field","外勤")}</span>`:""}</div><p class="mut" style="margin:0 0 12px">${dsDate(r.date)} · Shift ${sh.name&&!sh.off?esc(sh.name)+" ":""}${sh.in} - ${sh.out}</p>
  ${ph?`<img class="absd-p" src="${phSrc(ph)}"${phAttr(ph)} alt="" onclick="photoZoom(this.src)">`:`<p class="mut">${dsL("Tidak ada foto","No photo","无照片")}</p>`}
  ${placeBlock(r[k+"Loc"])}
  ${dist!=null&&dist!==""?`<p class="mut" style="margin-top:6px"><small>${dsL("Selisih kecocokan wajah","Face match distance","人脸差值")}: ${esc(dist)}</small></p>`:""}
  <p class="mut" style="margin-top:10px"><small>🔒 ${dsL("Data absen tidak dapat diubah. Salah catat? Ajukan Perbaikan Absensi.","Attendance records can't be edited. Wrong entry? Submit an Attendance Correction.","考勤记录无法修改，如有错误请提交补卡申请。")}</small></p></div>`;
  o.onclick=()=>o.remove();document.body.appendChild(o);tr(o);
}
