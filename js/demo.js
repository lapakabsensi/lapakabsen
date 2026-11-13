// ===== Mode DEMO: Firebase tiruan (Auth + Firestore) yang hidup hanya di memori browser =====
// Dimuat SESUDAH library Firebase dan SEBELUM app.js. Kalau mode demo aktif, objek `firebase` diganti dengan versi tiruan,
// jadi aplikasi tidak pernah menyentuh database asli: semua data demo hilang saat halaman dimuat ulang (= kembali ke tampilan awal).
// Mode demo aktif lewat tombol "Coba Demo" di halaman login atau alamat ...?demo
(function(){
  const K="absensiDemo",qs=/[?&]demo(=|&|$)/.test(location.search);
  const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del(k){try{sessionStorage.removeItem(k)}catch(e){}}};
  if(qs)ss.set(K,"1");
  const ON=ss.get(K)==="1"||qs;
  window.DEMO_ON=ON;
  window.demoEnter=as=>{ss.set(K,"1");ss.set(K+"As",as||"admin@demo.id");location.href=location.pathname};
  window.demoExit=()=>{ss.del(K);ss.del(K+"As");location.href=location.pathname};
  if(!ON)return;

  // jangan biarkan mode demo menulis pengaturan tampilan / "simpan kata sandi" ke penyimpanan browser yang dipakai akun asli
  const _set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){if(this===window.localStorage&&(k==="brand"||k==="rem"||k==="remEmail"))return;return _set.apply(this,arguments)};

  // ---------- util ----------
  const pad=n=>String(n).padStart(2,"0"),ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const err=(code,msg)=>Object.assign(new Error(msg||code),{code});
  class FV{constructor(t,a){this.t=t;this.a=a}}

  // ---------- Firestore tiruan ----------
  const S={},LIS=new Set();let SEQ=0;
  const col=c=>S[c]||(S[c]={});
  function apply(old,data,merge){
    const r=merge&&old?clone(old):{};
    for(const k of Object.keys(data)){
      const v=data[k];
      if(v instanceof FV){
        if(v.t==="del")delete r[k];
        else if(v.t==="union"){const a=Array.isArray(r[k])?r[k]:[];v.a.forEach(x=>{if(!a.some(y=>same(x,y)))a.push(clone(x))});r[k]=a}
      }else if(v!==undefined)r[k]=clone(v);
    }
    return r;
  }
  const notify=()=>setTimeout(()=>LIS.forEach(f=>f()),0);
  const OPS={"==":(a,b)=>same(a,b),"!=":(a,b)=>!same(a,b),">=":(a,b)=>a!=null&&a>=b,"<=":(a,b)=>a!=null&&a<=b,">":(a,b)=>a!=null&&a>b,"<":(a,b)=>a!=null&&a<b,
    "array-contains":(a,b)=>Array.isArray(a)&&a.some(x=>same(x,b)),"in":(a,b)=>Array.isArray(b)&&b.some(x=>same(x,a))};
  const snap=(c,id,d)=>({id,exists:d!==undefined,ref:docRef(c,id),data:()=>clone(d)});
  function docRef(c,id){
    return{id,path:c+"/"+id,
      async get(){return snap(c,id,col(c)[id])},
      async set(data,o){col(c)[id]=apply(col(c)[id],data,!!(o&&o.merge));notify()},
      async update(data){if(!col(c)[id])throw err("not-found","No document to update: "+c+"/"+id);col(c)[id]=apply(col(c)[id],data,true);notify()},
      async delete(){delete col(c)[id];notify()},
      onSnapshot(cb){const f=()=>cb(snap(c,id,col(c)[id]));LIS.add(f);setTimeout(f,0);return()=>LIS.delete(f)}};
  }
  function query(c,fl){
    const run=()=>Object.keys(col(c)).filter(id=>fl.every(([f,op,v])=>OPS[op](col(c)[id][f],v))).map(id=>snap(c,id,col(c)[id]));
    const mk=docs=>({docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)});
    return{where:(f,op,v)=>query(c,[...fl,[f,op,v]]),
      async get(){return mk(run())},
      onSnapshot(cb){const f=()=>cb(mk(run()));LIS.add(f);setTimeout(f,0);return()=>LIS.delete(f)}};
  }
  const db={
    collection:c=>({...query(c,[]),doc:id=>docRef(c,id||("d"+Date.now().toString(36)+(++SEQ))),
      async add(d){const id="d"+Date.now().toString(36)+(++SEQ);col(c)[id]=apply(null,d,false);notify();return docRef(c,id)}}),
    batch(){const ops=[];return{
      set(r,d,o){ops.push(()=>r.set(d,o));return this},update(r,d){ops.push(()=>r.update(d));return this},delete(r){ops.push(()=>r.delete());return this},
      async commit(){for(const f of ops)await f()}}}
  };

  // ---------- Auth tiruan ----------
  const ACC={};                      // email(huruf kecil) -> {uid,email,pw}
  const em=e=>String(e||"").trim().toLowerCase();
  function authInst(primary){
    let cur=null;const cbs=[];
    const user=a=>({uid:a.uid,email:a.email,
      async reauthenticateWithCredential(c){if(!ACC[em(a.email)]||ACC[em(a.email)].pw!==c.pw)throw err("auth/invalid-credential","The supplied auth credential is incorrect.")},
      async updatePassword(p){if(String(p).length<6)throw err("auth/weak-password","Password should be at least 6 characters");ACC[em(a.email)].pw=p}});
    const fire=()=>setTimeout(()=>cbs.forEach(f=>f(cur)),0);
    return{
      get currentUser(){return cur},
      onAuthStateChanged(cb){cbs.push(cb);return()=>{const i=cbs.indexOf(cb);if(i>=0)cbs.splice(i,1)}},
      async signInWithEmailAndPassword(e,p){const a=ACC[em(e)];if(!a||a.pw!==p)throw err("auth/invalid-credential","The supplied auth credential is incorrect.");cur=user(a);fire();return{user:cur}},
      async createUserWithEmailAndPassword(e,p){
        if(!em(e)||!/.+@.+/.test(e))throw err("auth/invalid-email","The email address is badly formatted.");
        if(String(p).length<6)throw err("auth/weak-password","Password should be at least 6 characters");
        if(ACC[em(e)])throw err("auth/email-already-in-use","The email address is already in use by another account.");
        const a=ACC[em(e)]={uid:"u_demo"+Date.now().toString(36)+(++SEQ),email:String(e).trim(),pw:p};cur=user(a);return{user:cur}},
      async sendPasswordResetEmail(e){if(!ACC[em(e)])throw err("auth/user-not-found","There is no user record for this email.")},
      // di aplikasi, "Keluar" saat demo = keluar dari mode demo
      async signOut(){if(primary){window.demoExit();return}cur=null},
      _as(email){const a=ACC[em(email)];if(!a)return;cur=user(a);fire()}
    };
  }
  let DA=null;const defAuth=()=>DA||(DA=authInst(true));
  const fb={apps:[],
    initializeApp(cfg,name){const app={name:name||"[DEFAULT]",options:cfg};let ai=null;app.auth=()=>name?(ai||(ai=authInst(false))):defAuth();app.firestore=()=>db;fb.apps.push(app);return app},
    auth:Object.assign(()=>defAuth(),{EmailAuthProvider:{credential:(email,pw)=>({email,pw})}}),
    firestore:Object.assign(()=>db,{FieldValue:{delete:()=>new FV("del"),arrayUnion:(...a)=>new FV("union",a),serverTimestamp:()=>Date.now()}})};
  try{Object.defineProperty(window,"firebase",{value:fb,configurable:true,writable:true})}catch(e){window.firebase=fb}

  // ---------- Data awal ----------
  const PW="demo123";
  const rng=s=>{let a=0;for(const ch of String(s))a=(a*31+ch.charCodeAt(0))>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
  const face=Array.from({length:128},(_,i)=>+(Math.sin(i)*.12).toFixed(4));
  const avatarSvg=(t,c)=>"data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='240' height='240' fill='${c}'/><circle cx='120' cy='96' r='46' fill='#ffffffcc'/><rect x='52' y='156' width='136' height='90' rx='56' fill='#ffffffcc'/></svg>`);
  const base=(o,c)=>({role:"karyawan",wa:"0812"+String(Math.abs([...o.email].reduce((a,x)=>a*7+x.charCodeAt(0),3))).padStart(8,"3").slice(0,8),empStatus:"PKWTT",absenMode:"Otomatis (sales/teknisi = 4x)",ptkp:"TK0",
    bank:"BCA",rek:String(1000000000+Math.abs([...o.email].reduce((a,x)=>a*13+x.charCodeAt(0),5))%899999999),locMode:"default",pwDone:true,faceDesc:face,facePhoto:avatarSvg("",c||"#0d9488"),faceAt:Date.now(),
    atasanId:"",atasanIds:[],atasanName:"",atasanMode:"any",hrId:"",hrName:"",tunjangan:0,tunjanganList:[],...o});
  const tj=l=>({tunjanganList:l.map(([nama,nominal])=>({nama,nominal})),tunjangan:l.reduce((a,x)=>a+x[1],0)});
  const AT={atasanId:"u_atasan",atasanIds:["u_atasan"],atasanName:"Budi Santoso",hrId:"u_hr",hrName:"Sari Wulandari"};
  const USERS=[
    base({id:"u_admin",name:"Admin Demo",email:"admin@demo.id",role:"admin",jabatan:"Pemilik / Admin",joinDate:"2020-01-02",dept:"",rek:"",bank:""},"#0f172a"),
    base({id:"u_hr",name:"Sari Wulandari",email:"hr@demo.id",role:"hr",jabatan:"HR Manager",dept:"HRD",joinDate:"2021-02-01",pokok:9000000,...tj([["Tunjangan Jabatan",1500000],["Tunjangan Transport",500000]]),ptkp:"K1"},"#db2777"),
    base({id:"u_atasan",name:"Budi Santoso",email:"atasan@demo.id",role:"atasan",isAtasan:true,jabatan:"Operations Manager",dept:"Operasional",joinDate:"2021-06-15",pokok:10000000,...tj([["Tunjangan Jabatan",2000000],["Tunjangan Transport",600000]]),ptkp:"K2",hrId:"u_hr",hrName:"Sari Wulandari"},"#2563eb"),
    base({id:"u_rina",name:"Rina Kartika",email:"karyawan@demo.id",jabatan:"Staff Administrasi",dept:"Operasional",joinDate:"2023-03-01",pokok:5500000,...tj([["Tunjangan Transport",400000],["Tunjangan Makan",600000]]),ptkp:"TK0",offGrant:2,...AT},"#0d9488"),
    base({id:"u_andi",name:"Andi Pratama",email:"andi@demo.id",jabatan:"Sales Executive",dept:"Penjualan",joinDate:"2024-01-08",pokok:4500000,...tj([["Tunjangan Transport",500000],["Tunjangan Komunikasi",250000]]),ptkp:"K1",target:50000000,bonusPct:2,bonusFlat:500000,...AT},"#ea580c"),
    base({id:"u_dewi",name:"Dewi Lestari",email:"dewi@demo.id",jabatan:"Desainer Grafis",dept:"Operasional",joinDate:"2025-07-01",empStatus:"PKWT",pokok:6000000,...tj([["Tunjangan Makan",500000]]),ptkp:"TK1",...AT},"#7c3aed"),
    base({id:"u_fajar",name:"Fajar Nugroho",email:"fajar@demo.id",jabatan:"Teknisi Lapangan",dept:"Operasional",joinDate:"2022-09-12",pokok:5000000,...tj([["Tunjangan Transport",700000],["Tunjangan Kehadiran",300000]]),ptkp:"K0",...AT},"#16a34a")
  ];
  const now=Date.now(),day=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)},ts=n=>now+n*864e5;
  function seed(){
    USERS.forEach(u=>{const{id,...d}=u;col("users")[id]=clone(d);ACC[em(u.email)]={uid:id,email:u.email,pw:PW};
      col("credentials")[id]={pw:PW,email:u.email,updatedAt:now-9*864e5,by:"admin"}});
    col("meta").setup={done:true};
    col("settings").work={in:"09:00",out:"18:00",tol:10,cutoff:1,lateFree:3,latePenalty:50000,cutiQuota:12,workDays:6,geoOn:false,
      shifts:[{id:"s_pagi",name:"Pagi",in:"07:00",out:"15:00",tol:null,color:"#0d9488"},{id:"s_siang",name:"Siang",in:"15:00",out:"23:00",tol:null,color:"#2563eb"},{id:"s_malam",name:"Malam",in:"23:00",out:"07:00",tol:null,color:"#7c3aed"}],
      depts:[{name:"Operasional",headId:"u_atasan",hrId:"u_hr"},{name:"Penjualan",headId:"u_atasan",hrId:"u_hr"},{name:"HRD",headId:"",hrId:"u_hr"}]};
    col("settings").company={name:"Demo Lapak Absen",address:"Jl. Contoh No. 1, Jakarta",logo:"img/logo-lapak.png"};
    // absensi 95 hari terakhir (Senin-Sabtu), hasil acak tetap per karyawan
    USERS.filter(u=>u.role!=="admin").forEach(u=>{
      const r=rng(u.id),n4=/sales|teknisi/i.test(u.jabatan),hm=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
      for(let k=95;k>=0;k--){
        const d=new Date();d.setDate(d.getDate()-k);if(d.getDay()===0)continue;
        const date=ymd(d),id=u.id+"_"+date;
        if(k===0){ // hari ini: sebagian sudah absen, Rina & Fajar belum (supaya bisa dicoba absen)
          const T={u_atasan:"08:52",u_hr:"08:47",u_andi:"08:55",u_dewi:"09:24"}[u.id];if(!T)continue;
          const m=+T.slice(0,2)*60+ +T.slice(3);
          col("attendance")[id]={uid:u.id,date,in:T,out:null,...(n4?{mid:null,aft:null}:{}),status:m>550?"abnormal":"normal"};continue;
        }
        if(r()<.04)continue;
        const late=r()<.14,inM=late?551+Math.floor(r()*35):515+Math.floor(r()*34),outM=1080+Math.floor(r()*28);
        col("attendance")[id]={uid:u.id,date,in:hm(inM),out:hm(outM),...(n4?{mid:hm(725+Math.floor(r()*20)),aft:hm(905+Math.floor(r()*25))}:{}),status:inM>550?"abnormal":"normal"};
      }
    });
    // jadwal shift bergilir contoh (hari ini s/d 13 hari ke depan): Rina & Dewi bergilir, Minggu libur
    {const sh={s_pagi:["Pagi","07:00","15:00","#0d9488"],s_siang:["Siang","15:00","23:00","#2563eb"],s_malam:["Malam","23:00","07:00","#7c3aed"]},ids=Object.keys(sh);
      [["u_rina",0],["u_dewi",1]].forEach(([u,o])=>{for(let k=0;k<14;k++){const d=new Date();d.setDate(d.getDate()+k);const date=ymd(d),id=u+"_"+date;
        if(d.getDay()===0){col("schedules")[id]={uid:u,date,off:true,name:"Libur"};continue}
        const sid=ids[(Math.floor(k/7)+o)%3],x=sh[sid];col("schedules")[id]={uid:u,date,shiftId:sid,name:x[0],in:x[1],out:x[2],tol:null,color:x[3]}}})}
    // pengajuan
    const rq=(u,type,f,st,step,log,ago)=>{const a=USERS.find(x=>x.id===u);col("requests")["rq"+(++SEQ)]={uid:u,name:a.name,type,status:st,createdAt:ts(-ago),dept:a.dept,atasanId:a.atasanId,atasanName:a.atasanName,atasanIds:a.atasanIds,atasanMode:"any",aIdx:0,hrId:a.hrId,hrName:a.hrName,step,log,...f,...(st!=="menunggu"?{finalAt:ts(-ago+1)}:{})}};
    const lg=(by,name,as,ok,note,ago)=>({by,name,as,ok,note:note||"",at:ts(-ago)});
    rq("u_rina","cuti",{jenis:"Cuti Tahunan",dari:day(10),sampai:day(11),hari:"2",ket:"Acara keluarga"},"menunggu","atasan",[],1);
    rq("u_andi","lembur",{tgl:day(-1),mulai:"18:00",selesai:"21:00",ket:"Closing penawaran klien"},"menunggu","hr",[lg("u_atasan","Budi Santoso","atasan",true,"",1)],2);
    rq("u_dewi","perbaikan",{tgl:day(-2),masuk:"08:58",pulang:"18:05",ket:"Lupa absen karena mati listrik"},"menunggu","atasan",[],1);
    rq("u_fajar","permintaan",{jenis:"Izin keluar",tgl:day(-6),ket:"Mengurus perpanjangan SIM"},"disetujui","selesai",[lg("u_atasan","Budi Santoso","atasan",true,"",7),lg("u_hr","Sari Wulandari","hr",true,"",6)],7);
    rq("u_rina","permintaan",{jenis:"Dinas luar",tgl:day(-12),ket:"Antar dokumen ke kantor pajak"},"ditolak","selesai",[lg("u_atasan","Budi Santoso","atasan",false,"Sudah diwakilkan kurir",13)],13);
    rq("u_dewi","cuti",{jenis:"Sakit dengan Surat Dokter",dari:day(-20),sampai:day(-19),hari:"2",ket:"Demam"},"disetujui","selesai",[lg("u_atasan","Budi Santoso","atasan",true,"",21),lg("u_hr","Sari Wulandari","hr",true,"",20)],21);
  }
  seed();

  // dipakai demo-ui.js
  window.DEMO={db,S,ACC,PW,USERS,fb,
    users:()=>USERS.map(u=>({id:u.id,email:u.email,name:u.name,role:u.role})),
    pwOf:e=>(ACC[em(e)]||{}).pw,
    put:(c,id,d)=>{col(c)[id]=clone(d)},
    start(){const as=ss.get(K+"As")||"admin@demo.id";defAuth()._as(ACC[em(as)]?as:"admin@demo.id")},
    as(email){ss.set(K+"As",email);defAuth()._as(email)}
  };
})();
