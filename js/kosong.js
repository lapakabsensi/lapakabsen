// ===== Keadaan kosong (ikon + petunjuk) dan kerangka abu-abu saat memuat =====
// Dimuat setelah todo.js. emptyBox() dipakai di semua tempat yang tadinya hanya menulis "Belum ada"; skel() dipakai render() saat halaman memuat.
addDict({"Belum ada pengajuan":["No requests yet","暂无申请"],"Isi formulir lalu klik Kirim.":["Fill in the form, then press Send.","填写表单后点击提交。"],
 "Belum ada absen lapangan":["No field attendance yet","暂无外勤打卡"],"Absen dari luar area akan tercatat di sini.":["Attendance from outside the area will appear here.","区域外打卡将显示在这里。"],
 "Tidak ada pengajuan yang menunggu keputusanmu":["Nothing waiting for your decision","没有待你审批的申请"],"Pengajuan baru akan muncul di sini.":["New requests will appear here.","新申请会显示在这里。"],
 "Belum ada riwayat":["No history yet","暂无记录"],"Pengajuan yang sudah diputuskan tampil di sini.":["Decided requests are listed here.","已处理的申请会列在这里。"],
 "Tidak ada permintaan lupa password":["No password reset requests","没有忘记密码的请求"],"Belum ada slip gaji":["No payslips yet","暂无工资条"],"Slip muncul di sini setelah gaji ditransfer.":["Payslips appear here once salary is transferred.","工资转账后工资条会显示在这里。"],
 "Tidak ada lembur":["No overtime","没有加班"],"Pada rentang waktu dan filter ini.":["For this date range and filter.","在此日期范围和筛选条件下。"],
 "Tidak ada data absensi":["No attendance data","没有考勤数据"],"Coba ubah filter status.":["Try changing the status filter.","请尝试更改状态筛选。"],"Coba ubah rentang waktu atau filter.":["Try changing the date range or filters.","请尝试更改日期范围或筛选。"],
 "Tidak ada karyawan yang cocok":["No matching employees","没有匹配的员工"],"Coba kata kunci lain atau pilih Semua.":["Try another keyword or pick All.","请尝试其他关键词或选择全部。"],
 "Tidak ada baris yang cocok":["No matching rows","没有匹配的行"],"Coba kata kunci lain.":["Try another keyword.","请尝试其他关键词。"],"Belum ada karyawan":["No employees yet","暂无员工"],"Tambahkan lewat form di atas atau import Excel.":["Add one with the form above or import from Excel.","请使用上方表单添加或从 Excel 导入。"]});
const emptyBox=(ic,t,h="")=>`<div class="empty"><div class="ei" aria-hidden="true">${ic}</div><b>${t}</b>${h?`<p>${h}</p>`:""}</div>`;

// ---- kerangka memuat ----
const sk=(w,h=14,x="")=>`<i class="sk" style="width:${w};height:${h}px;${x}"></i>`;
const skRows=n=>[...Array(n)].map((_,i)=>`<div class="skr">${sk("38px",38,"border-radius:50%;flex:none")}<div style="flex:1;display:grid;gap:7px">${sk(["62%","48%","70%","54%"][i%4])}${sk(["34%","42%","28%","38%"][i%4],10)}</div>${sk("64px",22,"border-radius:20px")}</div>`).join("");
const skBox=(l=3)=>`<div class="box">${sk("34%",18,"margin-bottom:16px")}${[...Array(l)].map((_,i)=>sk(["96%","82%","90%","70%"][i%4],12,"display:block;margin-bottom:11px")).join("")}</div>`;
const skHead=()=>`<div class="hd">${sk("180px",28)}${sk("120px",14)}</div>`;
function skel(v){
  const adm=typeof ADMIN==="function"&&ADMIN();let h;
  if(v==="home"&&adm)h=skHead()+`<div class="box">${sk("230px",18,"margin-bottom:14px")}<div class="tdg">${[...Array(5)].map(()=>sk("100%",92,"border-radius:14px")).join("")}</div></div><div class="stats">${[...Array(3)].map(()=>`<div class="st">${sk("40%",26,"margin-bottom:8px;display:block")}${sk("60%",12)}</div>`).join("")}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">${[...Array(3)].map(()=>`<div class="box" style="margin:0">${sk("50%",16,"margin-bottom:14px")}${sk("120px",120,"border-radius:50%;margin:0 auto;display:block")}</div>`).join("")}</div>`;
  else if(v==="home"||v==="myhome")h=skHead()+`<div class="box hero skhero">${sk("45%",16,"background:#ffffff55;margin-bottom:12px;display:block")}${sk("65%",30,"background:#ffffff55;display:block")}</div>`+skBox(3)+skBox(2);
  else if(["karyawan","gaji","rekap","saldo","audit","password","absen","rekam"].includes(v)&&v!=="absen"&&v!=="rekam")h=skHead()+`<div class="box"><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">${sk("min(320px,100%)",40,"border-radius:10px")}${sk("70px",34,"border-radius:20px")}${sk("90px",34,"border-radius:20px")}${sk("110px",34,"border-radius:20px")}</div>${skRows(6)}</div>`;
  else h=skHead()+skBox(3)+skBox(4);
  return`<div class="skel" role="status" aria-busy="true" aria-label="Memuat">${h}</div>`;
}
