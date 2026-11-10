// ===== Bahasa, jam, captcha, avatar, pengaturan perusahaan =====
const DICT={"Beranda":["Home","首页"],"Dashboard":["Dashboard","仪表盘"],"Absensi":["Attendance","考勤"],"Slip Gaji":["Payslip","工资单"],"Permintaan":["Requests","申请"],"Cuti":["Leave","请假"],"Perbaikan":["Correction","补卡"],"Lembur":["Overtime","加班"],"Laporan":["Report","报表"],"Karyawan":["Employees","员工"],"Jadwal Kerja":["Work Schedule","工作时间"],"Persetujuan":["Approvals","审批"],"Penggajian":["Payroll","薪资"],"Rekap Absensi":["Attendance Summary","考勤汇总"],"Pengaturan":["Settings","设置"],"Keluar":["Logout","退出"],"Ganti foto":["Change photo","更换头像"],"Admin":["Admin","管理员"],
"Selamat datang":["Welcome","欢迎"],"Sudahkah Anda absen hari ini?":["Have you clocked in today?","今天打卡了吗？"],"Masuk dengan akun dari admin":["Sign in with the account from your admin","请使用管理员提供的账号登录"],"Masuk Sekarang":["Sign in","登录"],"Setup admin pertama":["First admin setup","首次管理员设置"],"Kode captcha":["Captcha code","验证码"],"Email":["Email","邮箱"],"Password":["Password","密码"],
"Hai":["Hi","你好"],"Hari ini":["Today","今天"],"shift":["shift","班次"],"Shift":["Shift","班次"],"Belum absen":["Not clocked in","未打卡"],"Absen Masuk":["Clock In","上班打卡"],"Absen Pulang":["Clock Out","下班打卡"],"Lihat Absensi":["View Attendance","查看考勤"],"Masuk":["In","上班"],"Pulang":["Out","下班"],"Hadir normal":["On time","正常出勤"],"Abnormal / terlambat":["Abnormal / late","异常 / 迟到"],"Periode":["Period","周期"],"Hadir hari ini":["Present today","今日出勤"],"Menunggu persetujuan":["Pending approval","待审批"],
"abnormal":["abnormal","异常"],"normal":["normal","正常"],"menunggu":["pending","待处理"],"disetujui":["approved","已批准"],"ditolak":["rejected","已拒绝"],
"Riwayat":["History","记录"],"Kirim":["Submit","提交"],"Simpan":["Save","保存"],"Batal":["Cancel","取消"],"Edit":["Edit","编辑"],"Setujui":["Approve","批准"],"Tolak":["Reject","拒绝"],"Unduh CSV":["Download CSV","下载CSV"],
"Tanggal":["Date","日期"],"Status":["Status","状态"],"Nama":["Name","姓名"],"Jabatan":["Position","职位"],"Gaji pokok":["Basic salary","基本工资"],"Pokok":["Basic","基本"],"Tunjangan":["Allowance","津贴"],"Penjualan":["Sales","销售额"],"Potongan lain":["Other deductions","其他扣款"],"Bonus":["Bonus","奖金"],"Bersih":["Net","实发"],"Gaji bersih":["Net salary","实发工资"],"Penghasilan bruto":["Gross income","税前收入"],"Hitung":["Calculate","计算"],"Target":["Target","目标"],
"Jam masuk khusus (opsional)":["Custom start time (optional)","特殊上班时间（可选）"],"Jam pulang khusus (opsional)":["Custom end time (optional)","特殊下班时间（可选）"],"Jam masuk":["Start time","上班时间"],"Jam pulang":["End time","下班时间"],
"Dari":["From","从"],"Sampai":["To","至"],"Alasan":["Reason","原因"],"Keterangan":["Notes","备注"],"Jenis":["Type","类型"],"Mulai":["Start","开始"],"Selesai":["End","结束"],
"Memuat...":["Loading...","加载中..."],"Belum ada data":["No data yet","暂无数据"],"Belum ada":["None yet","暂无"],"Tidak ada pengajuan.":["No requests.","没有申请。"],"Ambil Foto & Absen":["Take Photo & Clock","拍照并打卡"],
"Nama perusahaan":["Company name","公司名称"],"Alamat":["Address","地址"],"Logo perusahaan":["Company logo","公司标志"],"Warna tema":["Theme color","主题颜色"],"Tampilan & identitas perusahaan":["Appearance & company identity","外观与公司信息"],
"Daftarkan karyawan baru":["Register new employee","注册新员工"],"Role":["Role","角色"],"Status PTKP":["PTKP status","PTKP状态"],"Target penjualan / bulan":["Sales target / month","每月销售目标"],"Bonus % dari penjualan (jika capai target)":["Bonus % of sales (if target met)","奖金比例（达标时）"],"Bonus tetap (jika capai target)":["Fixed bonus (if target met)","固定奖金（达标时）"],"Password awal (min 6)":["Initial password (min 6)","初始密码（至少6位）"],
"Toleransi terlambat (menit)":["Late tolerance (minutes)","迟到容忍（分钟）"],"Pengajuan Cuti":["Leave Request","请假申请"],"Perbaikan Absensi":["Attendance Correction","考勤补卡"],"Payroll":["Payroll","薪资"]};
const KEYS=Object.keys(DICT).sort((a,b)=>b.length-a.length);
let LANG=localStorage.getItem("lang")||"id",COMP={},LOGO=null,CAP="";
const li=()=>LANG==="en"?0:1;
// terjemah satu teks: pola dinamis (REGS, diisi di i18n2.js) lalu kamus frasa (DICT). Dipakai juga oleh toast & dialog.
const REGS=[],EX={};
function trs(s){if(LANG==="id"||s==null||s==="")return s;s=String(s);{const t=s.trim();if(EX[t])return s.replace(t,EX[t][li()]);const sm=t.match(/^(.+) ([↑↓])$/);if(sm&&!EX[t])return s.replace(t,trs(sm[1])+" "+sm[2])}
  for(const k of KEYS){if(k.length<30)break;if(s.includes(k))s=s.split(k).join(DICT[k][li()])}   // kalimat panjang dulu
  for(const r of REGS)s=s.replace(r[0],(...m)=>r[li()+1](...m));                                  // lalu pola dinamis (angka/nama)
  for(const k of KEYS){if(k.length>=30)continue;if(s.includes(k))s=s.split(k).join(DICT[k][li()])}return s}
function tr(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){if(n.__o===undefined)n.__o=n.nodeValue;const s=LANG==="id"?n.__o:trs(n.__o);if(n.nodeValue!==s)n.nodeValue=s}
  // placeholder & tooltip (title) ikut diterjemahkan
  const els=root.querySelectorAll?[...root.querySelectorAll("[placeholder],[title]")]:[];if(root.matches&&root.matches("[placeholder],[title]"))els.push(root);
  for(const e of els)for(const a of ["placeholder","title"]){if(!e.hasAttribute(a))continue;const k="__o_"+a;if(e[k]===undefined)e[k]=e.getAttribute(a);const s=LANG==="id"?e[k]:trs(e[k]);if(e.getAttribute(a)!==s){e["__ts_"+a]=s;e.setAttribute(a,s)}}
}

// konten yang dirender belakangan (tabel diurutkan, filter, muat async, dll) ikut diterjemahkan otomatis
(function(){let q=new Set(),t=0;const flush=()=>{t=0;const a=[...q];q.clear();if(LANG==="id")return;for(const n of a)if(n.isConnected)tr(n)};
  new MutationObserver(ms=>{if(LANG==="id")return;for(const m of ms){if(m.type==="attributes"){if(m.target.getAttribute(m.attributeName)!==m.oldValue&&m.target.getAttribute(m.attributeName)!==m.target["__ts_"+m.attributeName]){delete m.target["__o_"+m.attributeName];q.add(m.target)}continue}for(const n of m.addedNodes){const e=n.nodeType===1?n:n.nodeType===3?n.parentNode:null;if(e)q.add(e)}}if(q.size&&!t)t=requestAnimationFrame(flush)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["placeholder","title"],attributeOldValue:true})})();
function setLang(l){LANG=l;localStorage.setItem("lang",l);document.querySelectorAll(".langsel").forEach(s=>s.value=l);tick();tr(document.body);if(typeof ME!=="undefined"&&ME)render()}
function tick(){const d=new Date(),c=document.getElementById("clk");if(!c)return;const p=n=>String(n).padStart(2,"0");
  c.innerHTML=`<b>${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}</b><small>${d.toLocaleDateString({id:"id-ID",en:"en-US",zh:"zh-CN"}[LANG],{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</small>`}
// captcha
function newCap(){const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";CAP=Array.from({length:5},()=>ch[Math.random()*ch.length|0]).join("");
  const c=document.getElementById("cap"),x=c.getContext("2d");x.fillStyle="#eef2f7";x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<7;i++){x.strokeStyle=`hsl(${Math.random()*360},50%,60%)`;x.beginPath();x.moveTo(Math.random()*c.width,Math.random()*c.height);x.lineTo(Math.random()*c.width,Math.random()*c.height);x.stroke()}
  x.font="bold 26px monospace";x.textBaseline="middle";
  [...CAP].forEach((t,i)=>{x.save();x.translate(14+i*23,c.height/2);x.rotate((Math.random()-.5)*.5);x.fillStyle=`hsl(${Math.random()*360},60%,30%)`;x.fillText(t,0,0);x.restore()});
  document.getElementById("capIn").value=""}
function capOk(){if(document.getElementById("capIn").value.trim().toUpperCase()===CAP)return true;toast({id:"Kode captcha salah",en:"Wrong captcha code",zh:"验证码错误"}[LANG]);newCap();return false}
function eye(){const i=document.getElementById("pw"),h=i.type==="password";i.type=h?"text":"password";document.getElementById("eye").textContent=h?"🙈":"👁️"}
// foto: resize ke canvas, simpan sebagai base64
const imgData=(f,max,sq,type="image/jpeg")=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{
  let sx=0,sy=0,sw=i.width,sh=i.height,cw,ch;if(sq){const m=Math.min(sw,sh);sx=(sw-m)/2;sy=(sh-m)/2;sw=sh=m;cw=ch=max}else{const k=Math.min(1,max/sw);cw=Math.round(sw*k);ch=Math.round(sh*k)}
  const c=document.createElement("canvas");c.width=cw;c.height=ch;const g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(i,sx,sy,sw,sh,0,0,cw,ch);ok(c.toDataURL(type,.85))};i.onerror=no;i.src=r.result};r.onerror=no;r.readAsDataURL(f)});
const toggleMenu=()=>{const d=document.getElementById("nfdd");if(d)d.classList.remove("show");document.getElementById("umenu").classList.toggle("show")};
document.addEventListener("click",e=>{if(!e.target.closest("#avwrap"))document.getElementById("umenu").classList.remove("show")});
function userUI(){document.getElementById("av").innerHTML=ME.avatar?`<img src="${phSrc(ME.avatar)}"${phAttr(ME.avatar)} alt="">`:esc((ME.name||"?").slice(0,2).toUpperCase());
  document.getElementById("umName").textContent=ME.name+" · "+(ADMIN()?"Admin":(ME.jabatan||"Karyawan"));tr(document.body)}
// setAvatar ada di js/storage.js (foto profil disimpan di Firebase Storage)
// perusahaan
let LOGO_CLS="";
const cacheBrand=()=>{try{localStorage.setItem("brand",JSON.stringify({...COMP,tone:LOGO_CLS}))}catch(e){}};
async function loadCompany(){try{const d=await db.collection("settings").doc("company").get();COMP=d.exists?d.data():{};cacheBrand()}catch(e){}applyBrand()}
// ---- tema: warna solid atau gradasi (--ac = warna utama, --grad = isian tombol/menu aktif/hero) ----
function applyTheme(c1,c2,grad){const r=document.documentElement.style;r.setProperty("--ac",c1);
  if(grad&&c2&&c2.toLowerCase()!==c1.toLowerCase()){r.setProperty("--ac2",c2);r.setProperty("--grad",`linear-gradient(135deg,${c1},${c2})`);r.setProperty("--hero",`linear-gradient(120deg,${c1},${c2})`);r.setProperty("--lbg",`linear-gradient(160deg,${c1},${c2})`)}
  else["--ac2","--grad","--hero","--lbg"].forEach(k=>r.removeProperty(k))}
// ---- logo adaptif: deteksi logo gelap lalu beri bingkai terang supaya tetap terlihat di sidebar gelap ----
function logoTone(src){return new Promise(ok=>{const i=new Image();i.onload=()=>{try{const n=40,c=document.createElement("canvas");c.width=c.height=n;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(i,0,0,n,n);
  const d=x.getImageData(0,0,n,n).data;let a=0,l=0,ea=0,en=0;
  for(let y=0;y<n;y++)for(let u=0;u<n;u++){const k=(y*n+u)*4,al=d[k+3]/255;l+=(d[k]*.299+d[k+1]*.587+d[k+2]*.114)/255*al;a+=al;if(y<3||y>n-4||u<3||u>n-4){ea+=al;en++}}
  ok({dark:a>0&&l/a<.45,opaque:ea/en>.8})}catch(e){ok(null)}};i.onerror=()=>ok(null);i.src=src})}
const toneCls=t=>t&&t.dark?(t.opaque?"lg-ring":"lg-chip"):"";
// potong margin kosong (transparan / putih / abu tipis) di sekeliling logo, khusus untuk tampilan layar agar logo memenuhi bingkainya
const TRIMC={};
function trimLogo(src){if(!src||src.slice(0,5)!=="data:")return Promise.resolve(src);const k=src.length+src.slice(-40);if(TRIMC[k])return Promise.resolve(TRIMC[k]);
  return new Promise(ok=>{const im=new Image();im.onload=()=>{let out=src;try{const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h).data;
    const cs=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4],bg=[0,1,2].map(q=>cs.reduce((a,i)=>a+d[i+q],0)/4),ba=cs.reduce((a,i)=>a+d[i+3],0)/4;let x0=w,y0=h,x1=-1,y1=-1;
    for(let y=0;y<h;y++)for(let q=0;q<w;q++){const i=(y*w+q)*4;if(d[i+3]>20&&(ba<20||Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>60)){if(q<x0)x0=q;if(q>x1)x1=q;if(y<y0)y0=y;if(y>y1)y1=y}}
    if(x1>=0){const bw=x1-x0+1,bh=y1-y0+1;if(bw*bh<w*h*0.92){const o=document.createElement("canvas");o.width=bw;o.height=bh;o.getContext("2d").drawImage(c,x0,y0,bw,bh,0,0,bw,bh);out=o.toDataURL("image/png")}}}catch(e){}
    TRIMC[k]=out;ok(out)};im.onerror=()=>ok(src);im.src=src})}
async function applyLogos(){const lg=COMP.logo||"img/logo.svg",im=document.querySelector(".brand img");if(!im)return;
  im.src=COMP.logoDark||lg;LOGO_CLS=COMP.logoDark?"":toneCls(await logoTone(lg));im.className=LOGO_CLS;const ll=document.getElementById("lLogo");if(ll)ll.className=LOGO_CLS;cacheBrand();
  trimLogo(COMP.logoDark||lg).then(u=>{if(u!==im.src)im.src=u});if(ll)trimLogo(lg).then(u=>{if(u!==ll.src)ll.src=u})}
function applyBrand(){const n=COMP.name||"Lapak Absen",lg=COMP.logo||"img/logo.svg";document.title=n;const fi=document.querySelector("link[rel=icon]");if(fi){fi.removeAttribute("type");fi.href=lg;}
  if(COMP.color)applyTheme(COMP.color,COMP.color2,COMP.grad);
  document.getElementById("lLogo").src=lg;document.getElementById("lName").textContent=n;document.getElementById("lAddr").textContent=COMP.address||"";
  document.querySelector(".brand").innerHTML=`<img src="${COMP.logoDark||lg}" alt="" class="${LOGO_CLS}">${esc(COMP.name||"Absensi")}`;applyLogos();if(typeof pwaBrand==="function")pwaBrand()}
let LOGOD=null;
async function settingView(){LOGO=COMP.logo||null;LOGOD=COMP.logoDark||null;THEME={c1:COMP.color||"#0d9488",c2:COMP.color2||COMP.color||"#0d9488",grad:!!COMP.grad};
  AFTER=prevLogos;
  return head("Pengaturan","Tampilan & identitas perusahaan")+`<div class="box"><div class="fg">${fld("c_name","Nama perusahaan","text",0,COMP.name||"")}${fld("c_addr","Alamat","text",0,COMP.address||"")}${colorField()}</div>
  <div class="f"><label>Logo perusahaan</label><div class="lgrow">
  <div class="lgcard"><b class="lgt">Logo utama</b><small class="mut lgh">Pratinjau di latar terang.</small><div class="lgprev"><div class="lgtile"><img id="c_prev" src="${COMP.logo||"img/logo.svg"}" alt=""></div></div><div class="lgact"><input type="file" accept="image/*" onchange="pickLogo(this)"></div></div>
  <div class="lgcard"><b class="lgt">Logo untuk latar gelap <span class="mut">(opsional)</span></b><small class="mut lgh">Pratinjau di sidebar (latar gelap). Kosong = logo utama otomatis diberi bingkai terang. Unggah versi terang/putih agar tampil polos.</small><div class="lgprev"><div class="lgtile dk"><img id="c_prevd" src="${COMP.logoDark||COMP.logo||"img/logo.svg"}" alt=""></div><button type="button" class="btn ghost sm" onclick="LOGOD=null;prevLogos()">Hapus logo gelap</button></div><div class="lgact"><input type="file" accept="image/*" onchange="pickLogoDark(this)"></div></div></div></div><button class="btn" onclick="saveCompany()">Simpan</button></div>`+pwaIconBox()+tjMasterBox()}
async function prevLogos(){const a=document.getElementById("c_prev"),b=document.getElementById("c_prevd");if(!a||!b)return;
  a.src=LOGO||"img/logo.svg";b.src=LOGOD||LOGO||"img/logo.svg";b.className=LOGOD?"":toneCls(await logoTone(LOGO||"img/logo.svg"))}
// logo disimpan tajam (hingga 720px) tapi tetap muat di dokumen Firestore (<~300 KB per logo)
async function logoData(f){let d;for(const m of [720,560,420,320,256]){d=await imgData(f,m,false,"image/png");if(d.length<300000)break}return d}
async function pickLogo(i){if(i.files[0]){LOGO=await logoData(i.files[0]);prevLogos()}}
async function pickLogoDark(i){if(i.files[0]){LOGOD=await logoData(i.files[0]);prevLogos()}}
async function saveCompany(){COMP={name:$("#c_name").value.trim(),address:$("#c_addr").value.trim(),color:THEME.c1,color2:THEME.grad?THEME.c2:THEME.c1,grad:!!THEME.grad,logo:LOGO||"",logoDark:LOGOD||""};
  await db.collection("settings").doc("company").set(COMP);cacheBrand();applyBrand();tr(document.body);toast(TT("Pengaturan tersimpan","Settings saved","设置已保存"))}
function startUI(){newCap();tick();setInterval(tick,1000);document.querySelectorAll(".langsel").forEach(s=>s.value=LANG);tr(document.body);
  ["em","pw","capIn"].forEach(id=>document.getElementById(id).addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("bLogin").click()}))}

// ===== Tunjangan multi-baris =====
const TJ_DEF=["Tunjangan Jabatan","Tunjangan Transport","Tunjangan Makan","Tunjangan Komunikasi","Tunjangan Kesehatan","Tunjangan Keluarga","Tunjangan Kehadiran","Tunjangan Shift"];
const tjTypes=()=>SET.tjTypes&&SET.tjTypes.length?SET.tjTypes:TJ_DEF;
const tjRow=(n="",v="")=>`<div class="tjr"><input class="tjn" list="tjTypes" value="${esc(n)}"><input class="money tjv" inputmode="numeric" value="${v===""?"":Number(v).toLocaleString("id-ID")}" oninput="fm(this);tjTot()"><button type="button" class="btn ghost sm" onclick="this.parentNode.remove();tjTot()">✕</button></div>`;
function tjBlock(e){AFTER=tjTot;const l=e.tunjanganList||(e.tunjangan?[{nama:"Tunjangan",nominal:e.tunjangan}]:[]);
  return `<div class="f"><label>Tunjangan</label><datalist id="tjTypes">${tjTypes().map(x=>`<option value="${esc(x)}">`).join("")}</datalist><div id="tjList">${l.map(x=>tjRow(x.nama,x.nominal)).join("")}</div><button type="button" class="btn ghost sm" onclick="addTj()">+ Tambah tunjangan</button><b id="tjTot" style="margin-left:12px"></b></div>`}
function addTj(){document.getElementById("tjList").insertAdjacentHTML("beforeend",tjRow());tjTot()}
const tjRead=()=>[...document.querySelectorAll("#tjList .tjr")].map(r=>({nama:r.querySelector(".tjn").value.trim(),nominal:num(r.querySelector(".tjv"))})).filter(x=>x.nama&&x.nominal>0);
function tjTot(){const el=document.getElementById("tjTot");if(el)el.textContent="Total: "+rp(tjRead().reduce((a,x)=>a+x.nominal,0))}
async function tjLearn(l){const nw=[...new Set(l.map(x=>x.nama).filter(n=>!tjTypes().includes(n)))];if(!nw.length)return;const all=[...tjTypes(),...nw];await db.collection("settings").doc("work").set({tjTypes:all},{merge:true});SET.tjTypes=all}
const tjMasterBox=()=>`<div class="box"><h3>Jenis tunjangan</h3><p class="mut" style="margin-bottom:10px">Daftar pilihan saat mengisi tunjangan karyawan. Nama baru yang diketik di form karyawan juga otomatis masuk ke daftar ini.</p><div>${tjTypes().map((x,i)=>`<span class="tag ok" style="margin:0 6px 6px 0;display:inline-block">${esc(x)} <a style="cursor:pointer" onclick="tjDel(${i})">✕</a></span>`).join("")}</div><div class="row" style="margin-top:8px;max-width:420px"><input id="tjNew"><button class="btn" onclick="tjAdd()">Tambah</button></div></div>`;
async function tjSave(l){await db.collection("settings").doc("work").set({tjTypes:l},{merge:true});SET.tjTypes=l;render()}
const tjAdd=()=>{const v=document.getElementById("tjNew").value.trim();if(v)tjSave([...tjTypes(),v])};
const tjDel=i=>tjSave(tjTypes().filter((_,j)=>j!==i));
Object.assign(DICT,{"Tambah tunjangan":["Add allowance","添加津贴"],"Jenis tunjangan":["Allowance types","津贴类型"],"Tambah":["Add","添加"],"Total":["Total","合计"]});
Object.assign(DICT,{"Toleransi terlambat khusus (menit, opsional)":["Custom late tolerance (minutes, optional)","特殊迟到容忍（分钟，可选）"],"toleransi":["tolerance","容忍"],"menit":["min","分钟"]});

const TT=(i,e,z)=>({id:i,en:e,zh:z}[LANG]);
const COLORS=[["#0d9488","Teal"],["#16a34a","Hijau"],["#0891b2","Cyan"],["#2563eb","Biru"],["#4f46e5","Indigo"],["#7c3aed","Ungu"],["#db2777","Pink"],["#dc2626","Merah"],["#ea580c","Oranye"],["#d97706","Amber"],["#92400e","Coklat"],["#475569","Slate"]];
const GRADS=[["Aurora","#06b6d4","#7c3aed"],["Samudra","#0ea5e9","#1d4ed8"],["Senja","#f97316","#db2777"],["Api","#f59e0b","#dc2626"],["Hutan","#16a34a","#0d9488"],["Mint","#10b981","#0891b2"],["Berry","#db2777","#7c3aed"],["Royal","#4f46e5","#9333ea"],["Emas","#f59e0b","#c2410c"],["Malam","#475569","#1e293b"]];
let THEME={c1:"#0d9488",c2:"#0d9488",grad:false};
const themeKey=()=>THEME.grad?"g:"+THEME.c1.toLowerCase()+"|"+THEME.c2.toLowerCase():"s:"+THEME.c1.toLowerCase();
function colorField(){const k=themeKey();
  return `<div class="f" style="grid-column:1/-1"><label>Warna tema</label><div class="sw"><span class="swl">Warna solid</span>${COLORS.map(c=>`<span class="swc${k==="s:"+c[0]?" on":""}" data-k="s:${c[0]}" style="background:${c[0]}" title="${c[1]}" onclick="pickColor('${c[0]}')"></span>`).join("")}<input type="color" id="c_color" value="${THEME.c1}" oninput="pickColor(this.value)" title="Warna lain">
  <span class="swl">Gradasi</span>${GRADS.map((g,i)=>`<span class="swc swg${k==="g:"+g[1]+"|"+g[2]?" on":""}" data-k="g:${g[1]}|${g[2]}" style="background:linear-gradient(135deg,${g[1]},${g[2]})" title="${g[0]}" onclick="pickGrad(${i})"></span>`).join("")}</div>
  <div class="gcus"><small class="mut">Gradasi sendiri:</small><input type="color" id="g1" value="${THEME.c1}" oninput="customGrad()" title="Warna awal"><span class="mut">→</span><input type="color" id="g2" value="${THEME.grad?THEME.c2:"#7c3aed"}" oninput="customGrad()" title="Warna akhir"><span class="gprev" id="gprev"></span></div></div>`}
function markTheme(){const k=themeKey();document.querySelectorAll(".swc").forEach(e=>e.classList.toggle("on",e.dataset.k===k));
  const a=document.getElementById("c_color"),b=document.getElementById("g1"),c=document.getElementById("g2");if(a)a.value=THEME.c1;if(b)b.value=THEME.c1;if(c&&THEME.grad)c.value=THEME.c2}
function setTheme(c1,c2,grad){THEME={c1,c2,grad};applyTheme(c1,c2,grad);markTheme()}
const pickColor=c=>setTheme(c,c,false);
const pickGrad=i=>setTheme(GRADS[i][1],GRADS[i][2],true);
const customGrad=()=>setTheme(document.getElementById("g1").value,document.getElementById("g2").value,true);

// textarea: tinggi mengikuti isi (maks 220px, selebihnya scroll di dalam kotak). Ukurannya tidak bisa ditarik manual.
addEventListener("input",e=>{const t=e.target;if(t&&t.tagName==="TEXTAREA"){t.style.height="auto";t.style.height=Math.min(t.scrollHeight+2,220)+"px"}});
