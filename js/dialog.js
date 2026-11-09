// ===== Dialog konfirmasi / peringatan / isian yang seragam dengan tema aplikasi (pengganti confirm / alert / prompt bawaan browser) =====
// Semua fungsi mengembalikan Promise:  if(!await uiConfirm("Hapus data ini?"))return;
//   uiConfirm(pesan,{title,ok,cancel,danger}) -> true / false      uiAlert(pesan,{title,ok}) -> selesai saat ditutup
//   uiPrompt(pesan,{title,ok,danger,placeholder,value}) -> teks / null (dibatalkan)
// Pesan memakai \n untuk baris baru dan selalu di-escape (aman dari HTML).
(function(){
  const H=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const t=(i,e,z)=>typeof TT==="function"?TT(i,e,z):i;
  const ICON={ask:"❓",danger:"⚠️",info:"ℹ️"};
  const X=s=>typeof trs==="function"?trs(s):s;
  function show(o){
    o={...o,msg:X(o.msg),title:X(o.title),ok:o.ok&&X(o.ok),cancel:o.cancel&&X(o.cancel),fields:o.fields&&o.fields.map(f=>({...f,label:X(f.label)}))};
    return new Promise(res=>{
      const prev=document.activeElement,ov=document.createElement("div");
      ov.className="dlg";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");
      const kind=o.kind||(o.danger?"danger":"ask");
      ov.innerHTML=`<div class="dlgb"><div class="dlgh"><span class="dlgi ${kind}">${ICON[kind]||ICON.ask}</span><h3>${H(o.title)}</h3></div>`+
        `<p class="dlgm">${H(o.msg)}</p>`+(o.fields?`<div class="dlgf">${o.fields.map(f=>`<div><label>${H(f.label||"")}</label><input class="dlgin" data-k="${H(f.key)}"${f.money?" data-m=\"1\"":""} type="text" maxlength="300" inputmode="${H(f.mode||"text")}" placeholder="${H(X(f.placeholder)||"")}" value="${H(f.money&&f.value!==""&&f.value!=null?(+String(f.value).replace(/\D/g,"")||0).toLocaleString("id-ID"):f.value==null?"":f.value)}"></div>`).join("")}</div>`:o.input?`<input class="dlgin" type="text" maxlength="300" inputmode="${H(o.mode||"text")}" placeholder="${H(X(o.placeholder)||"")}" value="${H(o.value||"")}">`:"")+
        `<div class="dlga">${o.cancel===null?"":`<button type="button" class="btn ghost" data-r="0">${H(o.cancel||t("Batal","Cancel","取消"))}</button>`}<button type="button" class="btn${o.danger?" red":""}" data-r="1">${H(o.ok||t("OK","OK","确定"))}</button></div></div>`;
      const inp=ov.querySelector(".dlgin"),isIn=()=>document.activeElement&&document.activeElement.classList.contains("dlgin"),bOk=ov.querySelector("[data-r='1']"),bNo=ov.querySelector("[data-r='0']");
      let shut=false;
      const done=v=>{if(shut)return;shut=true;document.removeEventListener("keydown",kd,true);ov.classList.remove("in");setTimeout(()=>ov.remove(),160);
        try{prev&&prev.focus&&prev.focus()}catch(e){}res(o.fields?(v?Object.fromEntries([...ov.querySelectorAll(".dlgin")].map(i=>[i.dataset.k,i.dataset.m?i.value.replace(/\D/g,""):i.value.trim()])):null):o.input?(v?inp.value.trim():null):!!v)};
      function kd(e){
        if(e.key==="Escape"){e.preventDefault();e.stopPropagation();done(false)}
        else if(e.key==="Enter"&&inp&&isIn()){e.preventDefault();done(true)}
        else if(e.key==="Tab"){const f=[...ov.querySelectorAll("input,button")],i=f.indexOf(document.activeElement);e.preventDefault();const n=f[(i+(e.shiftKey?-1:1)+f.length)%f.length];n.focus();if(n.select&&n.tagName==="INPUT")n.select()}
      }
      ov.addEventListener("mousedown",e=>{if(e.target===ov)done(false)});
      ov.querySelectorAll(".dlgin[data-m]").forEach(i=>i.addEventListener("input",()=>{const n=i.value.replace(/\D/g,"");i.value=n?(+n).toLocaleString("id-ID"):""}));
      ov.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>done(b.dataset.r==="1"));
      document.addEventListener("keydown",kd,true);
      document.body.appendChild(ov);requestAnimationFrame(()=>{ov.classList.add("in");(inp||(o.danger&&bNo)||bOk).focus();if(inp&&inp.select)inp.select()});
    });
  }
  // judul & label tombol otomatis dari isi pesan: "Hapus ..." / "Reset ..." tampil merah dengan tombol yang sesuai
  const auto=m=>/^\s*hapus/i.test(m)?{danger:true,ok:t("Hapus","Delete","删除"),title:t("Hapus data?","Delete?","删除？")}:
    /^\s*reset/i.test(m)?{danger:true,ok:"Reset",title:"Reset?"}:{ok:t("Lanjutkan","Continue","继续"),title:t("Konfirmasi","Confirm","确认")};
  window.uiConfirm=(msg,o={})=>show({msg:String(msg),...auto(String(msg)),...o});
  window.uiAlert=(msg,o={})=>show({msg:String(msg),kind:"info",title:t("Informasi","Information","提示"),ok:t("Mengerti","Got it","知道了"),cancel:null,...o});
  // uiForm(pesan,{title,ok,fields:[{key,label,value,mode:"numeric"}]}) -> {key:teks} / null
  window.uiForm=(msg,o={})=>show({msg:String(msg),title:t("Isi data","Enter data","填写数据"),ok:t("Simpan","Save","保存"),...o});
  window.uiPrompt=(msg,o={})=>show({msg:String(msg),input:true,title:t("Isi keterangan","Enter details","填写说明"),ok:t("Kirim","Submit","提交"),...o});
})();
