// ===== Tampilan mode demo =====
// Dimuat paling akhir. Di luar mode demo: hanya menambah tombol "Coba Demo" di halaman login.
// Di mode demo: chip "DEMO" di header (ganti peran, reset, keluar), kamera & scan wajah disimulasikan, slip gaji contoh.
(function(){
  const ROLE_LBL={admin:"Admin",hr:"HR",atasan:"Atasan",karyawan:"Karyawan"};

  if(!window.DEMO_ON){
    const lc=document.querySelector("#login .lc"),b=document.getElementById("bLogin");
    if(lc&&b){
      const d=document.createElement("div");d.className="demo-sec";
      d.innerHTML=`<div class="demo-or"><span>atau coba dulu tanpa login</span></div>
        <div class="demo-roles"><button type="button" class="btn ghost sm" onclick="demoEnter('admin@demo.id')">👑 Admin</button><button type="button" class="btn ghost sm" onclick="demoEnter('hr@demo.id')">🧑‍💼 HR</button><button type="button" class="btn ghost sm" onclick="demoEnter('atasan@demo.id')">🧭 Atasan</button><button type="button" class="btn ghost sm" onclick="demoEnter('karyawan@demo.id')">🙋 Karyawan</button></div>
        <p class="mut demo-hint">Akun demo memakai data contoh yang terpisah dari data asli. Semua perubahan hilang saat halaman dimuat ulang.</p>`;
      b.insertAdjacentElement("afterend",d);
    }
    return;
  }

  // ---------- mode demo ----------
  document.title="[DEMO] "+document.title;
  const top=document.querySelector("header.top"),sp=top&&top.querySelector(".sp");
  if(top){
    const w=document.createElement("div");w.id="demoWrap";
    w.innerHTML=`<button type="button" class="demo-chip" onclick="demoMenu(event)">🎮 DEMO ▾</button>
      <div class="dd" id="demoDd"><div><b>Mode demo</b><br>Data contoh ini hanya ada di browser kamu dan kembali ke awal setiap halaman dimuat ulang. Data asli tidak tersentuh.</div>
      <div>Masuk sebagai:</div>${DEMO.users().map(u=>`<button type="button" onclick="demoAs('${u.email}')">${u.name} <small class="mut">· ${ROLE_LBL[u.role]||u.role}</small></button>`).join("")}
      <button type="button" onclick="location.reload()">↺ Reset data ke awal</button><button type="button" onclick="demoExit()">⏏ Keluar dari demo</button></div>`;
    top.insertBefore(w,sp||null);
    document.addEventListener("click",e=>{if(!e.target.closest("#demoWrap"))document.getElementById("demoDd").classList.remove("show")});
  }
  window.demoMenu=e=>{e.stopPropagation();const m=document.getElementById("umenu"),n=document.getElementById("nfdd");if(m)m.classList.remove("show");if(n)n.classList.remove("show");document.getElementById("demoDd").classList.toggle("show")};
  window.demoAs=email=>{document.getElementById("demoDd").classList.remove("show");DEMO.as(email);setTimeout(()=>toast("Masuk sebagai "+email+" (demo)"),400)};

  // kamera & pengenalan wajah disimulasikan (tidak butuh izin kamera / unduhan model)
  window.loadFace=()=>Promise.resolve();
  window.startCam=async function(){
    const b=$("#snap"),st=m=>{const e=$("#fst");if(e)e.textContent=m},sc=$("#scan");
    if(sc)sc.style.aspectRatio="4/3";const lo=$("#loc");if(lo)lo.textContent="📍 Demo: lokasi disimulasikan · dalam area absen";
    scanSet("ok","🎮 Demo: kamera disimulasikan");st("Mode demo: scan wajah disimulasikan. Tekan tombol di bawah untuk absen.");
    if(!b)return;b.disabled=false;
    b.onclick=async()=>{
      b.disabled=true;scanSet("scan","Memindai wajah…");
      for(const p of[.25,.55,.85]){scanProg(p);await sleep(350)}
      scanSet("pass","✓ Dikenali · "+ME.name);scanProg(1);scanScore("Kecocokan 97%");await sleep(600);
      try{await punch("","-6.17511,106.82715",.31)}catch(e){toast(errMsg(e));b.disabled=false}
    };
  };

  // slip gaji contoh 3 bulan terakhir (dihitung dengan rumus asli aplikasi dari absensi contoh)
  function seedSlips(){
    try{
      const us=DEMO.USERS.filter(u=>u.role!=="admin"),pm=n=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-n);return d.getFullYear()+"-"+pad(d.getMonth()+1)};
      for(let n=1;n<=3;n++){
        const P=pm(n),[y,m]=P.split("-").map(Number),a=ymd(new Date(y,m-1,1)),z=ymd(new Date(y,m,0));
        us.forEach(u=>{
          const late=Object.values(DEMO.S.attendance).filter(x=>x.uid===u.id&&x.date>=a&&x.date<=z&&x.status==="abnormal").length;
          const sales=u.target?u.target+(n%2?6e6:-8e6):0,pot=u.id==="u_dewi"&&n===2?150000:0,p=hitung(u,sales,pot,lateCalc(late)),t=new Date(y,m,2).getTime();
          DEMO.put("payslips",u.id+"_"+P,{...p,uid:u.id,name:u.name,periode:P,calcAt:t,paid:true,paidAt:t,paidBy:"u_admin"});
        });
      }
    }catch(e){console.warn("seed slip demo gagal",e)}
  }
  const pad=n=>String(n).padStart(2,"0");
  seedSlips();
  DEMO.start();
  setTimeout(()=>toast("🎮 Mode demo aktif · data contoh, hilang saat dimuat ulang"),1200);
})();
