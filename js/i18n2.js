// ===== Terjemahan tambahan (English / 中文): teks halaman, placeholder, tooltip, notifikasi & dialog =====
// Format: [teks Indonesia, English, 中文]. Kunci panjang dicocokkan lebih dulu. EX = cocok persis (untuk kata pendek yang
// berisiko jika diganti sebagai potongan kalimat). R = pola dinamis (angka/nama di dalam kalimat).
(function(){
const A=a=>{for(const [i,e,z] of a)DICT[i]=[e,z];KEYS.length=0;KEYS.push(...Object.keys(DICT).sort((a,b)=>b.length-a.length))};
const X=a=>{for(const [i,e,z] of a)EX[i]=[e,z]};
const R=(re,e,z)=>REGS.push([re,e,z]);
X([
["Lisensi","License","许可证"],["Pajak PPh 21","Income Tax (PPh 21)","个人所得税 (PPh 21)"],["Akun saya","My account","我的账号"],["Absen Saya","My Attendance","我的考勤"],
["Perlu tindakan hari ini","Needs action today","今日待处理"],["Tidak ada permintaan","No requests","暂无申请"],["Pengajuan menunggu","Pending requests","待审批申请"],
["Semua sudah diputuskan","All have been decided","全部已处理"],["Slip belum ditransfer","Slips not yet transferred","未转账的工资条"],["Semua sudah ditransfer","All have been transferred","全部已转账"],
["Aman 30 hari ke depan","Safe for the next 30 days","未来30天无风险"],["Jadwal default:","Default schedule:","默认班次："],["hadir","present","出勤"],["karyawan","employees","员工"],
["Cuti, lembur, perbaikan, dll","Leave, overtime, corrections, etc.","请假、加班、补卡等"],["Belum ada data","No data yet","暂无数据"],["Kehadiran 7 hari terakhir","Attendance, last 7 days","近7天出勤"],
["Tepat waktu vs terlambat","On time vs late","准时 vs 迟到"],["Total gaji bersih per periode","Total net pay per period","每期净工资总额"],["Slip yang sudah dihitung · 6 periode terakhir","Calculated slips · last 6 periods","已计算工资条 · 最近6期"],
["Kode","Code","代码"],["Hapus","Delete","删除"],["belum diisi","not filled in","未填写"],["Rekening","Bank account","银行账号"],["Akun","Account","账号"],["Kamu","You","你"],["Data","Data","数据"],
["Hari","Day","日"],["Minggu","Sunday","星期日"],["Senin","Monday","星期一"],["Selasa","Tuesday","星期二"],["Rabu","Wednesday","星期三"],["Kamis","Thursday","星期四"],["Jumat","Friday","星期五"],["Sabtu","Saturday","星期六"],
["Tampilan","View","显示"],["Bulan","Month","月份"],["Catatan","Notes","备注"],["Sisa","Remaining","剩余"],["bukan","not","否"],["hari","days","天"],
["Minggu / hari libur","Sunday / day off","星期日 / 休息日"],["Libur sesuai jadwal","Off per schedule","按排班休息"],["Belum Dimulai","Not started","未开始"],["Jam Masuk","Clock-in time","上班时间"],["Jam Pulang","Clock-out time","下班时间"],
["Jam In","Time in","上班时间"],["Jam Out","Time out","下班时间"],["Diperbarui","Updated","已更新"],["Tersimpan","Saved","已保存"],["Hapus data ini?","Delete this data?","删除此数据？"],
["Tahun pajak","Tax year","纳税年度"],["Total","Total","合计"],["Nama","Name","姓名"],["Tanggal","Date","日期"],["Masuk","In","上班"],["Pulang","Out","下班"],["Status","Status","状态"],
["Slip dihitung:","Slips calculated:","已算工资条："],["Sudah ditransfer:","Already transferred:","已转账："],["Total gaji bersih:","Total net pay:","净工资合计："],["Yang diexport","Included in export","导出内容"],["Yang dimasukkan","Included","包含内容"],
["Jumlah absen","Attendance count","考勤次数"],["Periode cuti","Leave period","假期周期"],["sisa / jatah","remaining / quota","剩余 / 额度"],["Belum berhak","Not yet eligible","尚无资格"],["Berhak cuti tahunan","Eligible for annual leave","享有年假"],
["Rata-rata sisa (hari)","Average remaining (days)","平均剩余（天）"],["Karyawan","Employee","员工"],["Status & masa kerja","Status & length of service","状态与工龄"],["Bulan ","Month ","月份 "],["Sudah dipotong","Already withheld","已扣缴"],
["Hapus sekarang","Delete now","立即删除"],["🧹 Hapus sekarang","🧹 Delete now","🧹 立即删除"],["Warna solid","Solid color","纯色"],["Gradasi sendiri:","Custom gradient:","自定义渐变："],
["Logo untuk latar gelap","Logo for dark background","深色背景用标志"],["Hapus logo gelap","Remove dark logo","删除深色标志"],["Hapus foto lama otomatis","Auto-delete old photos","自动删除旧照片"],["Simpan foto selama","Keep photos for","照片保留"],
["Lihat semua status","See all statuses","查看全部状态"],["Tambah tanggal","Add date","添加日期"],["Shift bergilir per tanggal","Rotating shifts by date","按日期轮班"],["＋ Shift baru","＋ New shift","＋ 新班次"],
["📋 Salin dari minggu lalu","📋 Copy from last week","📋 复制上周"],["Cari karyawan","Search employee","搜索员工"],["Cari","Search","搜索"],["Buat PIN slip gaji","Create payslip PIN","创建工资条PIN"],
["Belum pernah backup.","No backup yet.","尚未备份。"],["Belum ada catatan.","No records yet.","暂无记录。"],["Siapa mengubah apa, dan kapan","Who changed what, and when","谁在何时修改了什么"],
["Cari (nama, data, isi perubahan)","Search (name, data, change content)","搜索（姓名、数据、修改内容）"],["Penerima","Recipient","收件人"],["⬇️ Pengajuan","⬇️ Requests","⬇️ 申请"],
]);
A([
["Tandai belum absen setelah jam","Mark as not checked in after","超过此时间标记为未打卡："],
["Kontrak berakhir (isi untuk PKWT / Probation / Magang)","Contract ends (fill for fixed-term / probation / internship)","合同到期（定期合同/试用期/实习填写）"],
["Jatah Replacement Off (hari, total)","Replacement Off quota (days, total)","调休额度（天，合计）"],
["Jatah cuti tahunan khusus (hari, kosong = ikut pengaturan)","Special annual leave quota (days, blank = follow settings)","专属年假额度（天，留空=按公司设置）"],
["= Tidak kawin, 0 tanggungan → PTKP","= Single, 0 dependents → PTKP","= 未婚，0名家属 → PTKP"],
["/tahun (Rp 4.500.000/bulan).","/year (Rp 4,500,000/month).","/年（Rp 4.500.000/月）。"],
["PTKP (Penghasilan Tidak Kena Pajak) adalah bagian penghasilan setahun yang tidak dikenai PPh21; makin besar PTKP, makin kecil pajaknya.","PTKP (non-taxable income) is the part of yearly income not subject to PPh 21; the higher the PTKP, the lower the tax.","PTKP（免税收入）是全年收入中不征收PPh21的部分；PTKP越高，税越少。"],
["= tidak kawin,","= single,","= 未婚，"],
["= kawin (pasangan tidak bekerja), angka = jumlah tanggungan (anak / orang tua sedarah, maksimal 3).","= married (spouse not working), the number = dependents (children / blood-related parents, max 3).","= 已婚（配偶不工作），数字 = 家属人数（子女/直系父母，最多3人）。"],
["PTKP / tahun","PTKP / year","PTKP / 年"],["Tidak kawin, 0 tanggungan","Single, 0 dependents","未婚，0名家属"],["Tidak kawin, 1 tanggungan","Single, 1 dependent","未婚，1名家属"],
["Tidak kawin, 2 tanggungan","Single, 2 dependents","未婚，2名家属"],["Tidak kawin, 3 tanggungan","Single, 3 dependents","未婚，3名家属"],
["No. rekening (untuk transfer gaji)","Account no. (for salary transfer)","银行账号（用于转账工资）"],["Nama pemilik rekening (jika beda)","Account holder name (if different)","户名（如不同）"],
["Berhak upah lembur","Eligible for overtime pay","享有加班费"],["NIK (untuk bukti potong PPh 21)","NIK (for PPh 21 withholding slip)","NIK（用于PPh 21扣缴凭证）"],
["Lock lokasi di Jadwal Kerja belum aktif","Location lock in Work Schedule is not active","工作班次中的位置锁定未启用"],
["1) Unduh template → 2) isi satu baris per karyawan → 3) unggah file di sini. Akun, departemen, atasan, dan HR langsung dibuat. Password yang dikosongkan dibuatkan otomatis.","1) Download the template → 2) fill one row per employee → 3) upload the file here. Accounts, departments, supervisors and HR are created right away. Blank passwords are generated automatically.","1）下载模板 → 2）每位员工填一行 → 3）在此上传文件。账号、部门、上级和HR将立即创建。留空的密码会自动生成。"],
["📄 Unduh PDF","📄 Download PDF","📄 下载PDF"],["tgl masuk kosong","join date empty","入职日期为空"],
["Cari di tabel… (nama, jabatan, dll)","Search table… (name, position, etc.)","搜索表格…（姓名、职位等）"],["Cari nama, email, jabatan, WhatsApp...","Search name, email, position, WhatsApp...","搜索姓名、邮箱、职位、WhatsApp..."],
["Pilih semua yang tampil","Select all shown","选择全部显示项"],["Klik untuk mengurutkan","Click to sort","点击排序"],["Akun sendiri tidak bisa dihapus","You cannot delete your own account","不能删除自己的账号"],
["Kelola password semua akun, termasuk akun admin","Manage the passwords of all accounts, including the admin account","管理所有账号的密码，包括管理员账号"],
["Setiap akun bisa mengganti passwordnya sendiri lewat menu foto profil →","Every account can change its own password via the profile photo menu →","每个账号都可通过头像菜单自行修改密码 →"],
[". Perubahan itu otomatis tersinkron ke halaman ini. Admin juga bisa mengganti password akun mana pun (termasuk admin sendiri) di sini.",". The change syncs to this page automatically. Admins can also change any account's password (including their own) here.","。修改后会自动同步到此页面。管理员也可以在此修改任何账号（包括自己）的密码。"],
["Password saat ini","Current password","当前密码"],["belum tersinkron","not synced yet","尚未同步"],["muncul otomatis setelah akun ini login / ganti password","appears automatically after this account logs in / changes password","该账号登录/改密码后会自动显示"],
["Cari nama, email, role...","Search name, email, role...","搜索姓名、邮箱、角色..."],
["Alur pengajuan (cuti, lembur, dll): Karyawan → Atasan langsung → HR → selesai","Request flow (leave, overtime, etc.): Employee → Direct supervisor → HR → done","申请流程（请假、加班等）：员工 → 直属上级 → HR → 完成"],
["Kepala departemen otomatis jadi atasan default dan HR departemen jadi persetujuan terakhir saat karyawan baru dimasukkan ke departemen ini.","The department head automatically becomes the default supervisor and the department HR the final approver when a new employee is added to this department.","新员工加入该部门时，部门负责人自动成为默认上级，部门HR成为最终审批人。"],
["Nama departemen baru, mis. Sales","New department name, e.g. Sales","新部门名称，例如 Sales"],
["Berlaku untuk semua karyawan (kecuali yang punya jam khusus)","Applies to all employees (except those with special hours)","适用于所有员工（有特殊工时者除外）"],
["Tanggal mulai periode (1 = bulan kalender, 21 = 21 s/d 20)","Period start date (1 = calendar month, 21 = 21st to 20th)","周期起始日（1 = 自然月，21 = 21日至次月20日）"],
["Jatah cuti tahunan (hari / tahun, setelah 1 tahun kerja)","Annual leave quota (days / year, after 1 year of service)","年假额度（天/年，工作满1年后）"],
["Hari kerja per minggu (untuk hitung hari cuti)","Working days per week (for counting leave days)","每周工作天数（用于计算请假天数）"],
["Zona waktu perusahaan (UTC+ : WIB 7, WITA 8, WIT 9)","Company time zone (UTC+ : WIB 7, WITA 8, WIT 9)","公司时区（UTC+：WIB 7、WITA 8、WIT 9）"],
["Contoh: batas 3 dan potongan Rp 50.000 → terlambat ke-1 sampai ke-3 tidak dipotong, mulai ke-4 dipotong Rp 50.000 per kejadian. Isi potongan 0 untuk menonaktifkan.","Example: limit 3 and deduction Rp 50,000 → the 1st to 3rd late arrival is not deducted, from the 4th on Rp 50,000 is deducted each time. Enter 0 to disable.","例如：次数上限3、扣款 Rp 50.000 → 第1至第3次迟到不扣，第4次起每次扣 Rp 50.000。扣款填0即停用。"],
["Batas upah Jaminan Pensiun naik tiap Maret (Rp11.086.300 sejak 1 Maret 2026). Cek tarif & batas terbaru di BPJS Ketenagakerjaan setiap tahun, lalu ubah di sini.","The Pension Security wage cap rises every March (Rp11,086,300 since 1 March 2026). Check the latest rates & caps at BPJS Ketenagakerjaan every year, then update them here.","养老保险工资上限每年3月上调（自2026年3月1日起为 Rp11.086.300）。请每年到BPJS Ketenagakerjaan查看最新费率和上限，然后在此修改。"],
["Potongan BPJS aktif","BPJS deduction active","启用BPJS扣款"],["Batas upah BPJS Kesehatan (Rp)","BPJS Health wage cap (Rp)","BPJS健康保险工资上限（Rp）"],["Batas upah Jaminan Pensiun (Rp)","Pension Security wage cap (Rp)","养老保险工资上限（Rp）"],
["Iuran JKK perusahaan (%, sesuai tingkat risiko 0,24–1,74)","Company JKK contribution (%, by risk level 0.24–1.74)","公司JKK缴费（%，按风险等级 0.24–1.74）"],
["Hitung upah lembur otomatis di slip","Calculate overtime pay automatically on the slip","在工资条上自动计算加班费"],["Pembagi upah sejam (lembur)","Hourly wage divisor (overtime)","时薪除数（加班）"],
["Perusahaan libur saat cuti bersama","Company closed during collective leave","集体休假期间公司休息"],["Cuti bersama memotong jatah cuti tahunan","Collective leave deducts annual leave quota","集体休假扣减年假额度"],
["Hari libur nasional & cuti bersama","National holidays & collective leave","法定节假日与集体休假"],
["Bawaan: SKB 3 Menteri 2026 dan 2027. Tanggal di daftar ini tidak dihitung sebagai hari kerja untuk cuti dan \"tanpa absen\", dan lembur di tanggal ini dihitung tarif hari libur. Tambahkan SKB tahun berikutnya di sini saat sudah terbit.","Default: 2026 and 2027 Joint Ministerial Decree (SKB 3 Menteri). Dates in this list are not counted as working days for leave and \"no attendance\", and overtime on these dates is paid at the holiday rate. Add next year's SKB here once it is published.","默认：2026与2027年三部长联合决定（SKB 3 Menteri）。此列表中的日期不计为请假和“未打卡”的工作日，这些日期的加班按节假日费率计算。明年的SKB发布后请在此添加。"],
["Tahun Baru 2026 Masehi","New Year 2026","2026年元旦"],["Cuti bersama Tahun Baru Imlek","Collective leave for Chinese New Year","春节集体休假"],["Tahun Baru Imlek 2577","Chinese New Year 2577","春节 2577"],
["Hari Suci Nyepi","Nyepi (Balinese Day of Silence)","静居日 (Nyepi)"],["Hari Buruh Internasional","International Labour Day","国际劳动节"],["Hari Raya Waisak","Vesak Day","卫塞节"],["Hari Lahir Pancasila","Pancasila Day","建国五项原则日"],
["1 Muharam Tahun Baru Islam","1 Muharram Islamic New Year","伊斯兰新年（1 Muharam）"],
["Perubahan tersimpan otomatis. Sel kosong (—) = karyawan memakai jam default (Jadwal Kerja / jam khusus di data karyawan). Tanggal = tanggal shift dimulai.","Changes are saved automatically. Empty cell (—) = the employee uses the default hours (Work Schedule / special hours in the employee data). Date = the date the shift starts.","更改会自动保存。空格（—）= 员工使用默认工时（工作班次 / 员工资料中的特殊工时）。日期 = 班次开始日期。"],
["Jatah, terpakai, dan sisa cuti tahunan per karyawan","Annual leave quota, used and remaining per employee","每位员工的年假额度、已用和剩余"],
["tgl masuk belum diisi","join date not filled in","入职日期未填写"],
["Tanggal masuk kerja belum diisi admin, jadi cuti tahunan belum bisa dihitung.","The join date has not been filled in by the admin, so annual leave cannot be calculated yet.","管理员尚未填写入职日期，因此无法计算年假。"],
["Terpakai = cuti yang sudah disetujui (termasuk potongan cuti bersama bila diaktifkan). Menunggu = pengajuan yang belum diputuskan, sudah mengurangi sisa supaya tidak bisa melebihi jatah. Jatah per orang bisa diatur di data karyawan; kosong = ikut pengaturan perusahaan.","Used = approved leave (including collective-leave deductions if enabled). Pending = requests not yet decided; they already reduce the remainder so it cannot exceed the quota. The quota per person can be set in the employee data; blank = follow the company settings.","已用 = 已批准的假期（若启用则包含集体休假扣减）。待定 = 尚未处理的申请，已从剩余中扣除以免超出额度。每人额度可在员工资料中设置；留空 = 按公司设置。"],
["nama…","name…","姓名…"],
["Periode absensi 21 Okt - 20 Nov. Isi potongan lain (dan penjualan untuk karyawan yang punya target bonus), klik Hitung. Potongan terlambat dihitung otomatis dari data absensi. Bonus cair jika penjualan ≥ target. Slip yang sudah ditransfer tetap bisa diperbarui (tombol Perbarui / Sinkronkan) dan langsung ikut berubah di akun karyawan. PPh21 memakai metode TER (PMK 168/2023) untuk masa pajak biasa dan dihitung ulang setahun pada masa pajak terakhir. BPJS, lembur yang sudah disetujui, dan THR ikut dihitung (batas dan aturan ada di menu Jadwal Kerja).","Attendance period 21 Oct - 20 Nov. Fill in other deductions (and sales for employees with a bonus target), then click Calculate. Late deductions are calculated automatically from attendance data. The bonus is paid if sales ≥ target. Slips already transferred can still be updated (Update / Sync buttons) and change in the employee's account right away. PPh21 uses the TER method (PMK 168/2023) for regular tax periods and is recalculated for the full year in the last tax period. BPJS, approved overtime and THR are included (limits and rules are in the Work Schedule menu).","考勤周期 10月21日 - 11月20日。填写其他扣款（有奖金目标的员工还需填写销售额），然后点击“计算”。迟到扣款由考勤数据自动计算。销售额 ≥ 目标时发放奖金。已转账的工资条仍可更新（“更新/同步”按钮），并立即同步到员工账号。PPh21 在一般纳税期使用TER方法（PMK 168/2023），在最后一个纳税期按全年重新计算。BPJS、已批准的加班和THR均计入（上限与规则见“工作班次”菜单）。"],
["Tanggal hari raya (acuan masa kerja THR, kosong = akhir periode)","Holiday date (reference for THR length of service, blank = end of period)","节日日期（THR工龄基准，留空 = 周期末）"],
["Masa pajak terakhir (hitung ulang PPh21 setahun)","Last tax period (recalculate full-year PPh21)","最后纳税期（按全年重新计算PPh21）"],
["Centang kolom THR pada karyawan yang menerima THR bulan ini, lalu klik Hitung. THR = 1 bulan upah (pokok + tunjangan) untuk masa kerja 12 bulan atau lebih, proporsional untuk 1–11 bulan.","Tick the THR column for employees receiving THR this month, then click Calculate. THR = 1 month's wage (basic + allowances) for 12 months of service or more, prorated for 1–11 months.","在本月领取THR的员工处勾选THR列，然后点击“计算”。工龄满12个月：THR = 1个月工资（基本工资+津贴）；1–11个月按比例计算。"],
["🔄 Sinkronkan slip ke akun karyawan","🔄 Sync slips to employee accounts","🔄 同步工资条到员工账号"],
["Export CSV untuk transfer bank","Export CSV for bank transfer","导出CSV用于银行转账"],
["Berisi nama, bank, no. rekening, dan nominal gaji bersih. Data rekening diisi di menu Karyawan.","Contains name, bank, account no. and net salary amount. Bank account data is filled in the Employees menu.","包含姓名、银行、账号和净工资金额。银行账号资料在“员工”菜单中填写。"],
["Rekap gaji bulanan (untuk keuangan)","Monthly payroll recap (for finance)","月度工资汇总（财务用）"],
["Seluruh komponen gaji periode November 2026 dalam satu tabel beserta total dan ringkasan per divisi: gaji pokok, tunjangan, bonus, lembur, THR, BPJS, PPh 21, potongan, gaji bersih, dan status transfer.","All salary components for the November 2026 period in one table with totals and a per-division summary: basic salary, allowances, bonus, overtime, THR, BPJS, PPh 21, deductions, net pay and transfer status.","2026年11月周期的所有工资项目汇总在一张表中，含合计及各部门小计：基本工资、津贴、奖金、加班、THR、BPJS、PPh 21、扣款、净工资及转账状态。"],
["📗 Unduh Excel","📗 Download Excel","📗 下载Excel"],["⚠ rekening belum diisi","⚠ bank account not filled in","⚠ 银行账号未填写"],
["Perbarui semua slip periode ini sesuai data karyawan terbaru, termasuk yang sudah masuk ke akun karyawan","Update all slips of this period with the latest employee data, including those already in the employee's account","按最新员工资料更新本期所有工资条，包括已进入员工账号的"],
["Cari nama, bank, atau rekening...","Search name, bank, or account...","搜索姓名、银行或账号..."],
["Centang setelah gaji ditransfer. Slip gaji lalu muncul di akun karyawan.","Tick after the salary has been transferred. The payslip then appears in the employee's account.","工资转账后勾选。工资条随后会出现在员工账号中。"],
["Centang semua yang sudah dihitung","Tick all calculated","勾选所有已计算项"],["Centang jika gaji sudah ditransfer","Tick if the salary has been transferred","工资已转账则勾选"],
["Hitung ulang dan perbarui slip di akun karyawan","Recalculate and update the slip in the employee's account","重新计算并更新员工账号中的工资条"],["Unduh slip PDF","Download payslip PDF","下载工资条PDF"],["Hitung slip","Calculate slip","计算工资条"],
["Ringkasan bukti potong tahunan (1721-A1)","Annual withholding slip summary (1721-A1)","年度扣缴凭证汇总 (1721-A1)"],
["Dihitung dari slip gaji tahun 2026. Gunakan ringkasan ini untuk mengisi","Calculated from the 2026 payslips. Use this summary to fill in","根据2026年工资条计算。请用此汇总填写"],
["di Coretax (atau memeriksa isiannya); bukti potong resmi tetap diterbitkan lewat Coretax. Urutan kolom di Excel mengikuti layar isian BP A1 (informasi umum, penghasilan bruto, pengurang, penghitungan PPh). Ini","in Coretax (or to check what was entered); the official withholding slip is still issued through Coretax. The Excel column order follows the BP A1 entry screen (general information, gross income, deductions, PPh calculation). This","于Coretax（或核对所填内容）；正式扣缴凭证仍由Coretax开具。Excel列顺序与BP A1填写界面一致（基本信息、总收入、扣除项、PPh计算）。此"],
["Nama penandatangan bukti potong","Name of the withholding slip signatory","扣缴凭证签署人姓名"],["📄 PDF semua karyawan","📄 PDF of all employees","📄 全体员工PDF"],
["NIK kosong · TK0","NIK empty · TK0","NIK为空 · TK0"],
["Slip masa pajak terakhir (Desember / bulan terakhir bekerja) belum dihitung dengan metode tahunan; PPh terutang di bawah adalah perkiraan","The last tax-period slip (December / last month worked) has not been calculated with the annual method; the PPh payable below is an estimate","最后纳税期（12月/最后工作月份）的工资条尚未按全年方法计算；下方应缴PPh为估算值"],
["NIK belum diisi di menu Karyawan","NIK has not been filled in the Employees menu","尚未在“员工”菜单填写NIK"],
["Catatan absen","Attendance notes","考勤备注"],["Tampilkan semua","Show all","显示全部"],["Klik untuk memfilter","Click to filter","点击筛选"],["Lihat ringkasan per orang","See summary per person","查看个人汇总"],
["Ringkasan per orang · Semua karyawan","Summary per person · All employees","个人汇总 · 全体员工"],["Detail absensi · Semua karyawan","Attendance details · All employees","考勤明细 · 全体员工"],
["⬇️ Unduh CSV (","⬇️ Download CSV (","⬇️ 下载CSV（"],["Rekap Lembur · Semua karyawan","Overtime Recap · All employees","加班汇总 · 全体员工"],
["lembur disetujui ·","overtime approved ·","加班已批准 ·"],["jam · estimasi upah","hours · estimated pay","小时 · 预计加班费"],
["Estimasi upah memakai aturan lembur di Pengaturan Payroll (hari kerja / hari libur, pembagi upah sejam) dan gaji pokok + tunjangan karyawan; karyawan dengan lembur dimatikan dihitung Rp 0.","The estimated pay uses the overtime rules in Payroll Settings (working day / holiday, hourly wage divisor) and each employee's basic salary + allowances; employees with overtime switched off are counted as Rp 0.","预计加班费按“薪资设置”中的加班规则（工作日/节假日、时薪除数）及员工基本工资+津贴计算；已关闭加班的员工按 Rp 0 计。"],
["Nilai lama hanya tercatat untuk perubahan oleh admin. Password, data wajah, PIN, dan foto tidak pernah disimpan di log. Absen masuk/pulang harian tidak dicatat di sini.","Old values are only recorded for changes made by an admin. Passwords, face data, PINs and photos are never stored in the log. Daily clock-in/out is not recorded here.","旧值仅记录管理员所做的修改。密码、人脸数据、PIN和照片绝不会保存在日志中。每日上下班打卡不记录在此。"],
["Cari (nama, data, isi perubahan)","Search (name, data, change content)","搜索（姓名、数据、修改内容）"],["mis. Budi, gaji, 2026-11","e.g. Budi, salary, 2026-11","例如 Budi、工资、2026-11"],
["Simpan salinan seluruh data di luar Firebase","Save a copy of all data outside Firebase","在Firebase之外保存全部数据副本"],
["Mengunduh satu file berisi karyawan, pengaturan, absensi, pengajuan, jadwal shift, slip gaji, dan audit log. Salinan password (koleksi","Downloads one file containing employees, settings, attendance, requests, shift schedules, payslips and the audit log. The password copy (collection","下载一个文件，包含员工、设置、考勤、申请、轮班表、工资条和审计日志。密码副本（集合"],
[") tidak pernah ikut.",") is never included.","）绝不包含在内。"],
["Sertakan foto yang tersimpan di dokumen dan data wajah (file jauh lebih besar, memuat data biometrik)","Include photos stored in documents and face data (much larger file, contains biometric data)","包含保存在文档中的照片和人脸数据（文件大得多，含生物识别数据）"],
["💾 Unduh backup lengkap","💾 Download full backup","💾 下载完整备份"],["Ekspor per data (CSV, bisa dibuka di Excel)","Export per data set (CSV, can be opened in Excel)","按数据导出（CSV，可用Excel打开）"],
["Foto di Firebase Storage tidak ikut terunduh (hanya path-nya). Untuk salinan foto, gunakan ekspor bucket Storage dari Firebase / Google Cloud Console.","Photos in Firebase Storage are not downloaded (only their paths). For a copy of the photos, use the Storage bucket export from the Firebase / Google Cloud Console.","Firebase Storage中的照片不会被下载（仅含路径）。如需照片副本，请从Firebase / Google Cloud控制台导出Storage存储桶。"],
["Pratinjau di sidebar (latar gelap). Kosong = logo utama otomatis diberi bingkai terang. Unggah versi terang/putih agar tampil polos.","Preview in the sidebar (dark background). Empty = the main logo automatically gets a light frame. Upload a light/white version to show it plain.","侧边栏预览（深色背景）。留空 = 主标志自动加浅色边框。上传浅色/白色版本可显示为纯色。"],
["Ikon dan nama aplikasi yang terpasang di HP dibaca dari file di server, bukan dari pengaturan di atas. Setelah mengganti logo atau nama: simpan dulu, unduh paket ini, ekstrak ke folder website (timpa folder","The icon and name of the app installed on the phone are read from files on the server, not from the settings above. After changing the logo or name: save first, download this package, extract it into the website folder (overwrite the folder","手机上已安装应用的图标和名称取自服务器上的文件，而不是上面的设置。更改标志或名称后：先保存，下载此包，解压到网站文件夹（覆盖文件夹"],
["dan file","and file","和文件"],["), lalu hapus dan pasang ulang aplikasi di HP.","), then remove and reinstall the app on the phone.","），然后在手机上删除并重新安装应用。"],
["⬇️ Unduh paket ikon aplikasi","⬇️ Download app icon package","⬇️ 下载应用图标包"],
["Daftar pilihan saat mengisi tunjangan karyawan. Nama baru yang diketik di form karyawan juga otomatis masuk ke daftar ini.","Options list when filling in employee allowances. New names typed in the employee form are also added to this list automatically.","填写员工津贴时的选项列表。在员工表单中输入的新名称也会自动加入此列表。"],
["Foto absen, absen lapangan, dan lampiran pengajuan yang sudah lebih dari batas hari di bawah dihapus otomatis (dicek sekali sehari saat admin membuka aplikasi), supaya database tetap ringan. Data absen (jam, status, lokasi) tetap utuh. Foto profil dan foto wajah tidak ikut dihapus.","Attendance photos, field-attendance photos and request attachments older than the number of days below are deleted automatically (checked once a day when an admin opens the app) to keep the database light. Attendance data (time, status, location) stays intact. Profile and face photos are not deleted.","超过下方天数的打卡照片、外勤打卡照片和申请附件会被自动删除（管理员每天打开应用时检查一次），以保持数据库轻量。考勤数据（时间、状态、位置）保持完整。头像和人脸照片不会被删除。"],
["Warna lain","Other color","其他颜色"],["Warna awal","Start color","起始颜色"],["Warna akhir","End color","结束颜色"],
["Lisensi perusahaan sudah berakhir atau dinonaktifkan. Akun pegawai tidak bisa dipakai sampai lisensi diperpanjang atau diaktifkan lagi. Silakan hubungi admin perusahaan Anda.","The company license has expired or been deactivated. Employee accounts cannot be used until the license is renewed or reactivated. Please contact your company admin.","公司许可证已到期或被停用。在许可证续期或重新启用前，员工账号无法使用。请联系贵公司管理员。"],
["Tersinkron otomatis dengan data dari admin","Synced automatically with data from the admin","与管理员数据自动同步"],
["Slip gaji dikunci dengan PIN 6 angka supaya tidak terbuka orang lain. Ingat PIN ini; kalau lupa, minta admin mereset.","The payslip is locked with a 6-digit PIN so nobody else can open it. Remember this PIN; if you forget it, ask the admin to reset it.","工资条以6位PIN锁定，防止他人查看。请牢记此PIN；如忘记，请联系管理员重置。"],
["PIN baru (6 angka)","New PIN (6 digits)","新PIN（6位数字）"],
["Kamu → Atasan (belum diatur) → HR (belum diatur)","You → Supervisor (not set) → HR (not set)","你 → 上级（未设置）→ HR（未设置）"],
["Atasan & HR belum diatur, pengajuan akan diputuskan admin.","Supervisor & HR are not set; the request will be decided by the admin.","未设置上级和HR，申请将由管理员决定。"],
["📎 Lampiran foto bukti (opsional)","📎 Proof photo attachment (optional)","📎 证明照片附件（可选）"],
]);
// ---- notifikasi (toast), dialog, dan pesan lain ----
A([
["Ketik alamat atau nama tempat dulu","Type an address or place name first","请先输入地址或地点名称"],
["Tempat tidak ditemukan. Coba kata kunci lain, atau klik langsung di peta.","Place not found. Try another keyword, or click directly on the map.","找不到该地点。请换个关键词，或直接在地图上点击。"],
["Pencarian gagal: ","Search failed: ","搜索失败："],["Mencari lokasi...","Searching for location...","正在搜索位置..."],
["Lokasi tidak bisa diambil. Izinkan akses lokasi di browser.","Location could not be retrieved. Allow location access in the browser.","无法获取位置。请在浏览器中允许位置访问。"],
["Pilih titik lokasi di peta dulu","Pick a location point on the map first","请先在地图上选择位置点"],["Radius minimal 20 meter","Minimum radius is 20 meters","半径至少20米"],
["Wajah tidak terposisi dengan baik, coba lagi","Face is not positioned properly, try again","人脸位置不正确，请重试"],
["Tersimpan ✅ Lanjutkan langkah yang tersisa","Saved ✅ Continue with the remaining steps","已保存 ✅ 请继续完成剩余步骤"],
["Setup selesai, selamat bekerja! 🎉","Setup complete, happy working! 🎉","设置完成，祝工作顺利！🎉"],
["Isi password lama","Enter the old password","请输入旧密码"],["Password baru minimal 6 karakter","New password must be at least 6 characters","新密码至少6个字符"],
["Ulangi password baru tidak sama","The repeated new password does not match","两次输入的新密码不一致"],["Password baru harus berbeda dari yang lama","The new password must differ from the old one","新密码必须与旧密码不同"],
["Kamera belum siap","Camera is not ready","相机尚未就绪"],
["Hapus data wajah karyawan ini? Dia wajib rekam wajah ulang saat login berikutnya.","Delete this employee's face data? They must record their face again at the next login.","删除此员工的人脸数据？下次登录时需重新录入人脸。"],
["Data wajah direset","Face data has been reset","人脸数据已重置"],["Slip tidak ditemukan","Payslip not found","找不到工资条"],["Slip PDF diunduh","Payslip PDF downloaded","工资条PDF已下载"],
["Gagal membuat PDF: ","Failed to create PDF: ","生成PDF失败："],["PIN slip gaji tersimpan","Payslip PIN saved","工资条PIN已保存"],
["Reset PIN slip gaji karyawan ini? Dia akan diminta membuat PIN baru saat membuka menu Slip Gaji.","Reset this employee's payslip PIN? They will be asked to create a new PIN when opening the Payslip menu.","重置此员工的工资条PIN？其打开“工资条”菜单时需创建新PIN。"],
["PIN slip direset","Payslip PIN reset","工资条PIN已重置"],["Slip gaji diperbarui","Payslip updated","工资条已更新"],
["Contoh shift dibuat, sesuaikan jamnya","Sample shifts created, adjust the hours","已创建示例班次，请调整时间"],["Nama shift wajib diisi","Shift name is required","班次名称必填"],
["Isi jam masuk dan jam pulang","Fill in the clock-in and clock-out time","请填写上班和下班时间"],["Jam masuk dan jam pulang tidak boleh sama","Clock-in and clock-out time cannot be the same","上班和下班时间不能相同"],
["Nama shift sudah dipakai","Shift name is already used","班次名称已被使用"],["Shift tersimpan","Shift saved","班次已保存"],["Shift dihapus","Shift deleted","班次已删除"],
["Minggu lalu belum ada jadwal untuk disalin","There is no schedule from last week to copy","上周没有可复制的排班"],["Jadwal disalin","Schedule copied","排班已复制"],["Aplikasi terpasang 🎉","App installed 🎉","应用已安装 🎉"],
["Cara pasang di iPhone/iPad:\n\n1. Buka halaman ini di Safari (bukan di dalam aplikasi lain)\n2. Ketuk tombol Bagikan (kotak dengan panah ke atas)\n3. Pilih \"Tambahkan ke Layar Utama\"\n4. Ketuk Tambah","How to install on iPhone/iPad:\n\n1. Open this page in Safari (not inside another app)\n2. Tap the Share button (the square with an up arrow)\n3. Choose \"Add to Home Screen\"\n4. Tap Add","在iPhone/iPad上安装的方法：\n\n1. 在Safari中打开此页面（不要在其他应用内）\n2. 点击分享按钮（带向上箭头的方框）\n3. 选择“添加到主屏幕”\n4. 点击添加"],
["Halaman ini terbuka di dalam aplikasi lain (WhatsApp/Instagram/dll) sehingga tidak bisa dipasang.\n\nBuka menu ⋮ lalu pilih \"Buka di Chrome\" / \"Open in browser\", kemudian tekan tombol Pasang lagi.","This page is open inside another app (WhatsApp/Instagram/etc.) so it cannot be installed.\n\nOpen the ⋮ menu and choose \"Open in Chrome\" / \"Open in browser\", then press the Install button again.","此页面是在其他应用（WhatsApp/Instagram等）内打开的，无法安装。\n\n请打开 ⋮ 菜单并选择“在Chrome中打开”/“Open in browser”，然后再次点击安装按钮。"],
["Aplikasi hanya bisa dipasang jika alamat web memakai HTTPS (gembok).","The app can only be installed if the web address uses HTTPS (padlock).","只有网址使用HTTPS（锁图标）时才能安装应用。"],
["Buka menu browser (⋮) lalu pilih \"Instal aplikasi\" atau \"Tambahkan ke layar utama\".\n\nJika menu itu tidak ada, tutup lalu buka ulang Chrome dan muat ulang halaman ini sekali.","Open the browser menu (⋮) and choose \"Install app\" or \"Add to home screen\".\n\nIf that option is not there, close and reopen Chrome and reload this page once.","打开浏览器菜单（⋮），选择“安装应用”或“添加到主屏幕”。\n\n如果没有该选项，请关闭并重新打开Chrome，再刷新此页面一次。"],
["Menyiapkan paket ikon...","Preparing the icon package...","正在准备图标包..."],["Paket ikon diunduh","Icon package downloaded","图标包已下载"],["Gagal: ","Failed: ","失败："],
["Pengajuan sudah diputuskan","The request has already been decided","该申请已处理"],["Bukan giliran kamu untuk memutuskan","It is not your turn to decide","还没轮到你审批"],["Alasan penolakan (opsional):","Reason for rejection (optional):","拒绝原因（可选）："],
["Isi nama departemen","Enter the department name","请输入部门名称"],["Departemen sudah ada","The department already exists","部门已存在"],["Nama departemen wajib diisi","Department name is required","部门名称必填"],
["Nama departemen sudah dipakai","Department name is already used","部门名称已被使用"],["Departemen tersimpan","Department saved","部门已保存"],["Masih ada anggota di departemen ini. Pindahkan dulu.","There are still members in this department. Move them first.","该部门仍有成员，请先转移。"],
["Semua anggota sudah punya atasan & HR","All members already have a supervisor & HR","所有成员均已有上级和HR"],["Akun dibuat, tapi atasan/HR gagal disusun: ","Account created, but supervisor/HR could not be set: ","账号已创建，但上级/HR设置失败："],
["Pengajuan terkirim","Request sent","申请已提交"],["Akun belum didaftarkan admin","Account has not been registered by the admin","账号尚未由管理员注册"],["Nama wajib diisi","Name is required","姓名必填"],
["No. WhatsApp wajib diisi dengan benar (contoh 0812xxxxxxxx)","WhatsApp no. must be filled in correctly (e.g. 0812xxxxxxxx)","请正确填写WhatsApp号码（例如 0812xxxxxxxx）"],["Format No. WhatsApp tidak valid","Invalid WhatsApp no. format","WhatsApp号码格式无效"],
["No. rekening harus berupa angka 5-20 digit","Account no. must be 5-20 digits","银行账号必须为5-20位数字"],["Tulis nama departemen barunya","Write the new department name","请输入新部门名称"],
["Email dan password (min 6 karakter) wajib","Email and password (min 6 characters) are required","邮箱和密码（至少6个字符）必填"],["Tersimpan, tetapi atasan/departemen belum tersusun: ","Saved, but supervisor/department were not set: ","已保存，但上级/部门未设置："],
["Jadwal tersimpan","Schedule saved","班次已保存"],["Tidak ada data untuk diunduh","No data to download","没有可下载的数据"],["Token belum tersedia","Token is not available yet","令牌尚未生成"],
["PDF token lisensi diunduh","License token PDF downloaded","许可证令牌PDF已下载"],["PDF invoice diunduh","Invoice PDF downloaded","发票PDF已下载"],["Isi email dengan benar","Enter a valid email","请填写正确的邮箱"],
["Gagal mengirim permintaan: ","Failed to send the request: ","发送申请失败："],["Jika email terdaftar, link reset sudah dikirim. Cek kotak masuk / spam.","If the email is registered, a reset link has been sent. Check your inbox / spam.","如果该邮箱已注册，重置链接已发送。请检查收件箱/垃圾邮件。"],
["Hapus permintaan ini?","Delete this request?","删除此申请？"],["Permintaan dihapus","Request deleted","申请已删除"],["Email belum terdaftar sebagai akun","The email is not registered as an account","该邮箱尚未注册为账号"],["Link reset dikirim ke ","Reset link sent to ","重置链接已发送至 "],
["Audit log gagal tersimpan. Publikasikan firestore.rules terbaru di Firebase Console.","The audit log failed to save. Publish the latest firestore.rules in the Firebase Console.","审计日志保存失败。请在Firebase控制台发布最新的firestore.rules。"],
["Backup akan memuat foto absen/lampiran yang masih tersimpan di dokumen dan DATA WAJAH karyawan (data biometrik). File tidak terenkripsi, simpan di tempat aman. Lanjutkan?","The backup will include attendance photos/attachments still stored in documents and employees' FACE DATA (biometric data). The file is not encrypted, store it in a safe place. Continue?","备份将包含仍保存在文档中的打卡照片/附件以及员工的人脸数据（生物识别数据）。文件未加密，请妥善保管。继续吗？"],
["Backup diunduh","Backup downloaded","备份已下载"],["Tidak ada data lembur","No overtime data","没有加班数据"],["Rekam wajah dulu untuk bisa absen","Record your face first to be able to clock in","请先录入人脸才能打卡"],
["📍 Memeriksa lokasi…","📍 Checking location…","📍 正在检查位置…"],["Lokasi tidak terbaca. Aktifkan GPS & izinkan akses lokasi, lalu coba lagi.","Location could not be read. Turn on GPS & allow location access, then try again.","无法读取位置。请开启GPS并允许位置访问，然后重试。"],
["Library Firebase Storage belum termuat. Muat ulang halaman.","The Firebase Storage library has not loaded. Reload the page.","Firebase Storage库尚未加载。请刷新页面。"],
["Pindahkan semua foto lama ke Firebase Storage sekarang?\nPastikan aturan Storage (storage.rules) sudah dipublikasikan.","Move all old photos to Firebase Storage now?\nMake sure the Storage rules (storage.rules) have been published.","现在将所有旧照片迁移到Firebase Storage？\n请确认Storage规则（storage.rules）已发布。"],
["Migrasi berhenti: ","Migration stopped: ","迁移已停止："],["NPWP harus 15 atau 16 digit","NPWP must be 15 or 16 digits","NPWP必须为15或16位数字"],["NITKU harus 22 digit (NPWP 16 digit + 6 digit)","NITKU must be 22 digits (16-digit NPWP + 6 digits)","NITKU必须为22位（16位NPWP + 6位）"],
["Identitas pemotong tersimpan","Withholder identity saved","扣缴人信息已保存"],["Belum ada data","No data yet","暂无数据"],["Excel pajak ","Tax Excel ","税务Excel "],["PDF diunduh","PDF downloaded","PDF已下载"],
["Belum ada slip yang dihitung untuk periode ini","No slips have been calculated for this period yet","本期尚未计算任何工资条"],["PDF rekap gaji diunduh","Payroll recap PDF downloaded","工资汇总PDF已下载"],
["Belum ada data absensi untuk dicetak","No attendance data to print yet","暂无可打印的考勤数据"],["Tidak ada data untuk dicetak","No data to print","没有可打印的数据"],["Tidak ada karyawan untuk dicetak","No employees to print","没有可打印的员工"],
["Pengaturan payroll tersimpan","Payroll settings saved","薪资设置已保存"],["Isi tanggal dan keterangan","Fill in the date and description","请填写日期和说明"],
["Kembalikan daftar hari libur ke bawaan (SKB 2026 & 2027)? Tanggal yang kamu tambahkan sendiri akan hilang.","Restore the holiday list to default (SKB 2026 & 2027)? Dates you added yourself will be lost.","将节假日列表恢复为默认（SKB 2026 与 2027）？您自己添加的日期将丢失。"],
["Tidak ada karyawan dengan data rekening lengkap","No employees with complete bank account data","没有银行账号资料完整的员工"],["Nomor WhatsApp penyedia layanan belum diisi","The service provider's WhatsApp number has not been filled in","服务提供方的WhatsApp号码尚未填写"],
["Pilih file gambar (foto / screenshot bukti transfer)","Choose an image file (photo / screenshot of the transfer proof)","请选择图片文件（转账凭证照片/截图）"],
["Bukti pembayaran terkirim. Hubungi penyedia layanan lewat WhatsApp agar cepat diproses.","Payment proof sent. Contact the service provider via WhatsApp so it is processed quickly.","付款凭证已发送。请通过WhatsApp联系服务提供方以便尽快处理。"],["Gagal mengirim bukti: ","Failed to send the proof: ","发送凭证失败："],
["Tidak ada kursi lisensi kosong. Ajukan atau perpanjang lisensi dulu.","There are no free license seats. Request or renew a license first.","没有空余的许可证名额。请先申请或续期许可证。"],["Jumlah akun harus 1 sampai 1000","The number of accounts must be 1 to 1000","账号数量必须为1至1000"],
["Permintaan perpanjangan terkirim. Silakan transfer sesuai petunjuk, lalu unggah bukti pembayaran.","Renewal request sent. Please transfer as instructed, then upload the payment proof.","续期申请已发送。请按指示转账，然后上传付款凭证。"],["Gagal mengirim: ","Failed to send: ","发送失败："],
["Permintaan terkirim. Silakan transfer sesuai petunjuk.","Request sent. Please transfer as instructed.","申请已发送。请按指示转账。"],["Lisensi ini tidak bisa diaktifkan","This license cannot be activated","此许可证无法激活"],["Token salah. Periksa kembali.","Wrong token. Please check again.","令牌错误，请重新检查。"],
["🔒 Lisensi tidak aktif: akun pegawai & HR tidak bisa masuk sampai lisensi diperpanjang atau diaktifkan lagi. Buka menu Lisensi.","🔒 License inactive: employee & HR accounts cannot log in until the license is renewed or reactivated. Open the License menu.","🔒 许可证未激活：在许可证续期或重新激活前，员工和HR账号无法登录。请打开“许可证”菜单。"],
["🎫 Lisensi baru diterima. Buka menu Lisensi lalu masukkan token untuk mengaktifkan.","🎫 New license received. Open the License menu and enter the token to activate it.","🎫 已收到新许可证。请打开“许可证”菜单并输入令牌激活。"],
["Gagal menyalin, klik 👁️ lalu salin manual","Copy failed, click 👁️ then copy manually","复制失败，请点击 👁️ 后手动复制"],["Isi password saat ini (atau kirim email reset)","Enter the current password (or send a reset email)","请输入当前密码（或发送重置邮件）"],
["Email reset terkirim ke","Reset email sent to","重置邮件已发送至"],["Password disalin","Password copied","密码已复制"],["Error: ","Error: ","错误："],
["Lokasi diambil (akurasi ±","Location captured (accuracy ±","已获取位置（精度 ±"],
]);
// ---- pola dinamis (angka / nama di dalam kalimat) ----
const MON=[["Jan","Jan","1月"],["Feb","Feb","2月"],["Mar","Mar","3月"],["Apr","Apr","4月"],["Jun","Jun","6月"],["Jul","Jul","7月"],["Sep","Sep","9月"],["Nov","Nov","11月"],["Januari","January","1月"],["Februari","February","2月"],["Maret","March","3月"],["April","April","4月"],["Mei","May","5月"],["Juni","June","6月"],["Juli","July","7月"],["Agustus","August","8月"],["September","September","9月"],["Oktober","October","10月"],["November","November","11月"],["Desember","December","12月"],["Agu","Aug","8月"],["Okt","Oct","10月"],["Des","Dec","12月"],["Mei","May","5月"]];
R(/(\d+) dari (\d+) karyawan/g,(m,a,b)=>`${a} of ${b} employees`,(m,a,b)=>`${a}/${b} 名员工`);
R(/(\d+) dari (\d+) catatan dimuat/g,(m,a,b)=>`${a} of ${b} records loaded`,(m,a,b)=>`已加载 ${a}/${b} 条记录`);
R(/\(Sisa (\d+) Hari\)/g,(m,a)=>`(Remaining ${a} days)`,(m,a)=>`（剩余 ${a} 天）`);
R(/Slip mulai (\S+) \(karyawan masuk tanggal belum diisi\)/g,(m,a)=>`Slips start ${a} (employee join date not filled in)`,(m,a)=>`工资条自 ${a} 起（员工入职日期未填写）`);
R(/Periode absensi ([^.]*?)\. /g,(m,a)=>`Attendance period ${a}. `,(m,a)=>`考勤周期 ${a}。`);
R(/Absen (masuk|pulang|istirahat|selesai istirahat) tercatat/gi,(m,a)=>`Clock-${/masuk/i.test(a)?"in":"out"} recorded`,(m,a)=>`${/masuk/i.test(a)?"上班":"下班"}打卡已记录`);
R(/(\d+) anggota diperbarui/g,(m,a)=>`${a} members updated`,(m,a)=>`已更新 ${a} 名成员`);
R(/(\d+) foto dipindah ke Storage/g,(m,a)=>`${a} photos moved to Storage`,(m,a)=>`${a} 张照片已迁移到Storage`);
R(/(\d+) baris diunduh/g,(m,a)=>`${a} rows downloaded`,(m,a)=>`已下载 ${a} 行`);
R(/(\d+) slip diperbarui/g,(m,a)=>`${a} slips updated`,(m,a)=>`已更新 ${a} 份工资条`);
R(/Hapus departemen (.+)\?/g,(m,a)=>`Delete department ${a}?`,(m,a)=>`删除部门 ${a}？`);
R(/Hapus shift "(.+?)"\? Jadwal hari ini dan ke depan yang memakai shift ini akan dikosongkan \(riwayat lama tidak berubah\)\./g,(m,a)=>`Delete shift "${a}"? Today's and future schedules using this shift will be cleared (past history does not change).`,(m,a)=>`删除班次“${a}”？今天及以后使用此班次的排班将被清空（历史记录不变）。`);
R(/Salin (\d+) jadwal dari minggu lalu ke minggu ini\? Sel yang sudah terisi dan punya padanan minggu lalu akan ditimpa\./g,(m,a)=>`Copy ${a} schedules from last week to this week? Cells that are already filled and have a counterpart last week will be overwritten.`,(m,a)=>`将上周的 ${a} 条排班复制到本周？已填写且上周有对应项的单元格将被覆盖。`);
R(/Buat (\d+) akun karyawan sekarang\?/g,(m,a)=>`Create ${a} employee accounts now?`,(m,a)=>`现在创建 ${a} 个员工账号？`);
R(/Kirim email reset password ke (\S+)\?/g,(m,a)=>`Send a password reset email to ${a}?`,(m,a)=>`向 ${a} 发送密码重置邮件？`);
R(/Hapus semua foto absen & lampiran yang lebih dari (\d+) hari\? Data absen tetap ada, hanya fotonya yang hilang\. Tidak bisa dibatalkan\./g,(m,a)=>`Delete all attendance photos & attachments older than ${a} days? Attendance data remains, only the photos are removed. This cannot be undone.`,(m,a)=>`删除所有超过 ${a} 天的打卡照片和附件？考勤数据保留，仅删除照片。此操作无法撤销。`);
R(/Kuota akun tidak cukup \(sisa (\d+), dibutuhkan (\d+)\)\. Ajukan lisensi dulu\./g,(m,a,b)=>`Not enough account quota (${a} left, ${b} needed). Request a license first.`,(m,a,b)=>`账号额度不足（剩余 ${a}，需要 ${b}）。请先申请许可证。`);
R(/Ajukan (\d+) akun untuk (\d+) bulan\?\nTotal (Rp [\d.,]+) \((Rp [\d.,]+) per akun per bulan\)\./g,(m,a,b,t,p)=>`Request ${a} accounts for ${b} months?\nTotal ${t} (${p} per account per month).`,(m,a,b,t,p)=>`申请 ${a} 个账号，${b} 个月？\n合计 ${t}（每账号每月 ${p}）。`);
R(/Lisensi aktif: kuota bertambah (\d+) akun, berlaku (\d+) bulan/g,(m,a,b)=>`License active: quota increased by ${a} accounts, valid for ${b} months`,(m,a,b)=>`许可证已激活：额度增加 ${a} 个账号，有效期 ${b} 个月`);
R(/🎫 Token lisensi dikirim: (\d+) akun · (\d+) bulan\. Buka menu Lisensi untuk melihat token, unduh PDF & invoice\./g,(m,a,b)=>`🎫 License token sent: ${a} accounts · ${b} months. Open the License menu to see the token, download the PDF & invoice.`,(m,a,b)=>`🎫 许可证令牌已发送：${a} 个账号 · ${b} 个月。请打开“许可证”菜单查看令牌、下载PDF和发票。`);
R(/✅ Perpanjangan disetujui: lisensi berlaku sampai (.+)\./g,(m,a)=>`✅ Renewal approved: the license is valid until ${a}.`,(m,a)=>`✅ 续期已批准：许可证有效期至 ${a}。`);
R(/⌛ Lisensi sudah berakhir \((.+?)\)\. Buka menu Lisensi lalu klik Perpanjang\./g,(m,a)=>`⌛ The license expired (${a}). Open the License menu and click Renew.`,(m,a)=>`⌛ 许可证已到期（${a}）。请打开“许可证”菜单并点击“续期”。`);
R(/⌛ Token lisensi berakhir (dalam (\d+) hari|hari ini) \((.+?)\)\. Ajukan perpanjangan di menu Lisensi\./g,(m,w,d,a)=>`⌛ The license token expires ${d?"in "+d+" days":"today"} (${a}). Request a renewal in the License menu.`,(m,w,d,a)=>`⌛ 许可证令牌将于${d?d+"天后":"今天"}到期（${a}）。请在“许可证”菜单申请续期。`);
R(/Reset (.+?)\?\nPassword/g,(m,a)=>m,(m,a)=>m);
A([["Halo, ","Hello, ","你好，"],["periode ini","this period","本期"],["Cari (Ctrl+K)","Search (Ctrl+K)","搜索 (Ctrl+K)"],
["perlu dicek sebelum dipakai (lihat kolom Catatan).","needs checking before use (see the Notes column).","需在使用前核对（见备注列）。"],
["Jadwal Masuk","Clock-in schedule","上班班次"],["Jadwal Pulang","Clock-out schedule","下班班次"]]);
X([["Kode perusahaan","Company code","公司代码"],["Kode perusahaan tidak ditemukan","Company code not found","找不到公司代码"],["Lanjut","Continue","继续"],["Tidak","No","否"],["Ubah","Edit","修改"],
["Pengajuan","Requests","申请"],["Pilih semua","Select all","全选"],["Per minggu","Per week","按周"],["Per bulan","Per month","按月"],["Minggu ini","This week","本周"],["Bulan ini","This month","本月"],["Bulan lalu","Last month","上月"],
["Semua karyawan","All employees","全体员工"],["Belum ditransfer","Not yet transferred","未转账"],["Baru saja","Just now","刚刚"],["baru saja","just now","刚刚"],["Ya, bulan ini","Yes, this month","是，本月"],
["Izin keluar","Exit permit","外出许可"],["Slip gaji tersedia","Payslip available","工资条已发布"],["Ganti kode","Change code","更换代码"],["Ketik kode","Enter code","输入代码"],
["— Tidak ada —","— None —","— 无 —"],["— Belum diisi —","— Not filled in —","— 未填写 —"],["Rekening","Bank account","银行账号"]]);
A([
["atau coba dulu tanpa login","or try it first without logging in","或先免登录试用"],
["Akun demo memakai data contoh yang terpisah dari data asli. Semua perubahan hilang saat halaman dimuat ulang.","The demo account uses sample data separate from the real data. All changes are lost when the page is reloaded.","演示账号使用与真实数据分开的示例数据。页面刷新后所有更改都会丢失。"],
["Belum ada titik. Cari alamat, klik peta, atau tekan Lokasi saya. Pin juga bisa digeser.","No point yet. Search an address, click the map, or press My location. The pin can also be dragged.","尚无位置点。可搜索地址、点击地图，或点击“我的位置”。图钉也可以拖动。"],
["✏️ Tulis departemen baru…","✏️ Write a new department…","✏️ 输入新部门…"],["Jika atasan lebih dari satu","If there is more than one supervisor","如果有多位上级"],["Salah satu atasan cukup","Any one supervisor is enough","任意一位上级即可"],
["Ketik nama departemen baru","Type the new department name","输入新部门名称"],["Hapus atasan ini","Remove this supervisor","移除此上级"],["Cari alamat / nama tempat...","Search address / place name...","搜索地址 / 地点名称..."],
["Otomatis (hanya Desember)","Automatic (December only)","自动（仅12月）"],["Ringkas (rekening, nama, jumlah, berita)","Compact (account, name, amount, note)","简要（账号、姓名、金额、备注）"],
["Semua yang sudah dihitung","All that have been calculated","所有已计算的"],["Hanya yang sudah ditransfer","Only those already transferred","仅已转账的"],["Pilih tanggal sendiri…","Pick your own dates…","自选日期…"],
["Massal (beberapa data)","Bulk (several records)","批量（多条数据）"],["Foto surat dokter *","Doctor's note photo *","医生证明照片 *"],["Tulis departemen baru","Write a new department","输入新部门"],
]);
R(/Gaji periode (.+?) sudah ditransfer: (Rp [\d.,]+)/g,(m,p,a)=>`Salary for ${p} has been transferred: ${a}`,(m,p,a)=>`${p}工资已转账：${a}`);
R(/(\d+) menit lalu/g,(m,a)=>`${a} min ago`,(m,a)=>`${a}分钟前`);R(/(\d+) jam lalu/g,(m,a)=>`${a} h ago`,(m,a)=>`${a}小时前`);R(/(\d+) hari lalu/g,(m,a)=>`${a} days ago`,(m,a)=>`${a}天前`);
R(/Hapus terpilih \((\d+)\)/g,(m,a)=>`Delete selected (${a})`,(m,a)=>`删除所选（${a}）`);
X([["Replacement Offsisa / jatah","Replacement Off remaining / quota","补休 剩余 / 额度"],["Otomatis (hanya Desember)","Automatic (December only)","自动（仅12月）"]]);
R(/Slip (.+?) periode (.+?) sudah ditransfer dan sudah tampil di akun karyawan\.\nHitung ulang akan memperbarui slip di akun (.+?) juga\. Lanjutkan\?/g,(m,a,p,b)=>`${a}'s slip for ${p} has been transferred and is already shown in the employee's account.\nRecalculating will also update the slip in ${b}'s account. Continue?`,(m,a,p,b)=>`${a} ${p} 的工资条已转账并已显示在员工账号中。\n重新计算也会更新 ${b} 账号中的工资条。继续吗？`);
R(/Sinkronkan (\d+) slip periode (.+?) dengan data karyawan terbaru \(gaji pokok, tunjangan, PTKP, bonus, dan data absensi\)\?\nPenjualan & potongan lain yang sudah diisi tetap dipakai\./g,(m,n,p)=>`Sync ${n} slips for ${p} with the latest employee data (basic salary, allowances, PTKP, bonus and attendance data)?\nSales & other deductions already entered are kept.`,(m,n,p)=>`将 ${p} 的 ${n} 份工资条与最新员工资料同步（基本工资、津贴、PTKP、奖金和考勤数据）？\n已填写的销售额和其他扣款会保留。`);
R(/(\d+) karyawan belum punya no\. rekening dan dilewati:\n([\s\S]*?)\n\nLanjut export (\d+) karyawan lainnya\?/g,(m,a,l,b)=>`${a} employees have no account no. and are skipped:\n${l}\n\nContinue exporting the other ${b} employees?`,(m,a,l,b)=>`${a} 名员工没有银行账号，将被跳过：\n${l}\n\n继续导出其余 ${b} 名员工？`);
R(/Export (\d+) baris · total (Rp [\d.,]+)/g,(m,a,b)=>`Export ${a} rows · total ${b}`,(m,a,b)=>`导出 ${a} 行 · 合计 ${b}`);
R(/Excel diunduh \((\d+) baris absensi, (\d+) lembur\)/g,(m,a,b)=>`Excel downloaded (${a} attendance rows, ${b} overtime)`,(m,a,b)=>`Excel已下载（${a} 行考勤，${b} 条加班）`);
R(/(\d+) baris lembur diunduh/g,(m,a)=>`${a} overtime rows downloaded`,(m,a)=>`已下载 ${a} 行加班数据`);
R(/Excel rekap gaji diunduh \((\d+) karyawan · total bersih (Rp [\d.,]+)\)/g,(m,a,b)=>`Payroll recap Excel downloaded (${a} employees · total net ${b})`,(m,a,b)=>`工资汇总Excel已下载（${a} 名员工 · 净工资合计 ${b}）`);
R(/Buat kode reset untuk (.+?)\?\nPassword akun ini akan diganti kode acak baru dan (.+?) wajib membuat password baru saat login\. Kirim kodenya lewat WhatsApp\./g,(m,a,b)=>`Create a reset code for ${a}?\nThis account's password will be replaced with a new random code and ${b} must create a new password at login. Send the code via WhatsApp.`,(m,a,b)=>`为 ${a} 生成重置码？\n此账号的密码将被替换为新的随机码，${b} 登录时必须设置新密码。请通过WhatsApp发送该码。`);
R(/(\d+) akun ditautkan ke lisensi aktif/g,(m,a)=>`${a} ${+a===1?"account":"accounts"} linked to the active license`,(m,a)=>`${a} 个账号已关联到有效许可证`);
R(/\. (\d+) akun belum dapat kursi \(kuota kurang\)/g,(m,a)=>`. ${a} ${+a===1?"account":"accounts"} did not get a seat (not enough quota)`,(m,a)=>`。${a} 个账号未分到名额（额度不足）`);
X([["Atasan","Supervisor","上级"],["Kehadiran","Attendance","考勤"],["Sistem","System","系统"],["Audit Log","Audit Log","审计日志"],["Backup","Backup","备份"],["Lupa password","Forgot password","忘记密码"],
["Kontrak segera habis","Contract ending soon","合同即将到期"],["Tepat waktu","On time","准时"],["atasan","supervisor","上级"],["Magang","Internship","实习"],["Harian lepas","Casual daily worker","日结临时工"],
["PKWT (Kontrak)","PKWT (Fixed-term contract)","PKWT（定期合同）"],["Probation (Percobaan)","Probation","试用期"],["Laki-laki","Male","男"],["Perempuan","Female","女"],["Urutkan","Sort","排序"],["Urutan awal","Original order","原始顺序"],
["Menunggu","Pending","待处理"],["Disetujui","Approved","已批准"],["Ditolak","Rejected","已拒绝"],["Saldo habis","Balance used up","额度已用完"],["Jatah","Quota","额度"],["Terpakai","Used","已用"],["Format","Format","格式"],
["Umum (lengkap)","General (full)","通用（完整）"],["Pemisah kolom","Column separator","列分隔符"],["Koma ( , )","Comma ( , )","逗号 ( , )"],["Titik koma ( ; )","Semicolon ( ; )","分号 ( ; )"],["Perbarui","Update","更新"],
["Waktu","Time","时间"],["Divisi","Division","部门"],["Divisi / departemen","Division / department","部门 / 科室"],["Normal","Normal","正常"],["Aksi","Action","操作"],["Massal","Bulk","批量"],["Ekspor","Export","导出"],
["↻ Muat ulang","↻ Reload","↻ 重新加载"],["Siapa","Who","操作人"],["Perubahan","Changes","变更"],["Terakhir diubah","Last changed","最后修改"],["Kelola departemen","Manage departments","管理部门"],["Kepala:","Head:","负责人："],
["Kembalikan ke daftar bawaan","Restore to default list","恢复为默认列表"],["Bruto setahun","Gross income (yearly)","全年总收入"],["PKP","Taxable income (PKP)","应税收入 (PKP)"],["PPh terutang","PPh payable","应缴PPh"],["Selisih","Difference","差额"],
["Identitas pemotong","Withholder identity","扣缴人信息"],["Backup & Ekspor","Backup & Export","备份与导出"],["Backup lengkap (JSON)","Full backup (JSON)","完整备份 (JSON)"],["Sertakan audit log","Include audit log","包含审计日志"],["⬇️ Audit Log","⬇️ Audit Log","⬇️ 审计日志"],
["Ikon aplikasi di HP","App icon on the phone","手机上的应用图标"],["Gradasi","Gradient","渐变"],["Logo utama","Main logo","主标志"],["Pratinjau di latar terang.","Preview on a light background.","浅色背景预览。"],["(opsional)","(optional)","（可选）"],
["Fungsi Umum","General Functions","通用功能"],["Statistik Pribadi","Personal Statistics","个人统计"],["Kehadiran Normal","Normal Attendance","正常出勤"],["Akses dikunci","Access locked","访问已锁定"],
["Min","Sun","日"],["Sen","Mon","一"],["Sel","Tue","二"],["Rab","Wed","三"],["Kam","Thu","四"],["Jum","Fri","五"],["Sab","Sat","六"],["Alpa","Absent","旷工"],["Menunggu approval","Pending approval","待审批"],["🔒 Buka","🔒 Unlock","🔒 解锁"],
["Dinas luar","Business trip","外勤出差"],["Pasang aplikasi","Install app","安装应用"],["Pasang aplikasi di HP","Install the app on your phone","在手机上安装应用"],["🧭 Atasan","🧭 Supervisor","🧭 上级"],["Atasan → HR","Supervisor → HR","上级 → HR"],
["Isra Mikraj Nabi Muhammad saw.","Isra Mi'raj of Prophet Muhammad","先知穆罕默德夜行登霄节"],["Idulfitri 1447 H","Eid al-Fitr 1447 H","开斋节 1447 H"],["Wafat Yesus Kristus","Good Friday","耶稣受难日"],["Paskah","Easter","复活节"],
["Kenaikan Yesus Kristus","Ascension of Jesus Christ","耶稣升天节"],["Iduladha 1447 H","Eid al-Adha 1447 H","宰牲节 1447 H"],["Proklamasi Kemerdekaan","Independence Day","独立日"],["Maulid Nabi Muhammad saw.","Prophet Muhammad's Birthday","先知穆罕默德诞辰"],
["Kelahiran Yesus Kristus (Natal)","Christmas Day","圣诞节"],
["Hijau","Green","绿色"],["Biru","Blue","蓝色"],["Ungu","Purple","紫色"],["Merah","Red","红色"],["Oranye","Orange","橙色"],["Coklat","Brown","棕色"],["Aurora","Aurora","极光"],["Samudra","Ocean","海洋"],["Senja","Dusk","黄昏"],["Api","Fire","火焰"],["Hutan","Forest","森林"],["Emas","Gold","金色"],["Malam","Night","夜晚"]]);
A([["Kawin, 0 tanggungan","Married, 0 dependents","已婚，0名家属"],["Kawin, 1 tanggungan","Married, 1 dependent","已婚，1名家属"],["Kawin, 2 tanggungan","Married, 2 dependents","已婚，2名家属"],["Kawin, 3 tanggungan","Married, 3 dependents","已婚，3名家属"],
["Punya NPWP / NIK terdaftar","Has a registered NPWP / NIK","拥有已登记的NPWP / NIK"],["Ikut BPJS Kesehatan","Enrolled in BPJS Health","参加BPJS健康保险"],["Ikut BPJS Ketenagakerjaan (JHT, JP, JKK, JKM)","Enrolled in BPJS Employment (JHT, JP, JKK, JKM)","参加BPJS劳工保险（JHT、JP、JKK、JKM）"],
["⬇️ Template Excel (.xlsx)","⬇️ Excel template (.xlsx)","⬇️ Excel模板 (.xlsx)"],["Template CSV","CSV template","CSV模板"],["⬇️ Export CSV Bank","⬇️ Export Bank CSV","⬇️ 导出银行CSV"],
["file impor XML resmi DJP.","the official DJP XML import file.","DJP官方XML导入文件。"],["NPWP pemberi kerja (15/16 digit)","Employer NPWP (15/16 digits)","雇主NPWP（15/16位）"],["NITKU (NPWP 16 digit + 6 digit unit)","NITKU (16-digit NPWP + 6-digit unit)","NITKU（16位NPWP + 6位单位码）"],
["📗 Excel isian Coretax","📗 Coretax entry Excel","📗 Coretax填写用Excel"],["Pilih semua yang tampil","Select all shown","选择全部显示项"]]);
R(/Terakhir dicek (.+)/g,(m,a)=>`Last checked ${a}`,(m,a)=>`最后检查 ${a}`);
R(/(\d+) anggota\b/g,(m,a)=>`${a} ${+a===1?"member":"members"}`,(m,a)=>`${a} 名成员`);
R(/(\d+)x \(kena (\d+)x\)/g,(m,a,b)=>`${a}x (penalized ${b}x)`,(m,a,b)=>`${a}次（扣款 ${b}次）`);
R(/Atasan: (.+?) · HR: (.+)/g,(m,a,b)=>`Supervisor: ${a} · HR: ${b}`,(m,a,b)=>`上级：${a} · HR：${b}`);
A([["Ulangi PIN tidak sama","The repeated PIN does not match","两次输入的PIN不一致"],["Ulangi PIN","Repeat PIN","重复PIN"],["PIN harus 6 angka","PIN must be 6 digits","PIN必须为6位数字"],
["Masukkan PIN 6 angka untuk membuka slip gaji.","Enter the 6-digit PIN to open the payslip.","请输入6位PIN以打开工资条。"],["Masukkan PIN","Enter PIN","输入PIN"],["Simpan PIN","Save PIN","保存PIN"],
["PIN salah 5x. Dikunci 1 menit.","Wrong PIN 5 times. Locked for 1 minute.","PIN错误5次，已锁定1分钟。"],["Buat dulu minimal satu jenis shift di atas.","First create at least one shift type above.","请先在上方创建至少一种班次。"],
["Tidak ada karyawan.","No employees.","没有员工。"]]);
// pola umum (angka + kata) dipasang paling akhir supaya kalimat spesifik di atas dicocokkan lebih dulu
for(const [i,e,z] of MON)R(new RegExp("\\b"+i+"\\b","g"),()=>e,()=>z);
R(/(\d+) karyawan\b/g,(m,a)=>`${a} ${+a===1?"employee":"employees"}`,(m,a)=>`${a} 名员工`);
R(/(\d+) akun\b/g,(m,a)=>`${a} ${+a===1?"account":"accounts"}`,(m,a)=>`${a} 个账号`);
R(/(\d+) baris\b/g,(m,a)=>`${a} ${+a===1?"row":"rows"}`,(m,a)=>`${a} 行`);
R(/(\d+) departemen\b/g,(m,a)=>`${a} ${+a===1?"department":"departments"}`,(m,a)=>`${a} 个部门`);
})();
