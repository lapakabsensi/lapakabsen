// Diisi saat paket web diberikan ke pelanggan: kode perusahaan dari panel Super Admin (menu Pelanggan).
// Kalau dikosongkan, aplikasi membaca kode dari alamat (...?c=KODE) atau meminta kode saat dibuka pertama kali.
window.TENANT_ID="";
// Firebase Storage butuh paket berbayar (Blaze). Selama masih gratis biarkan true: foto absen/profil disimpan kecil (±20 KB) langsung di database.
// Kalau nanti Storage sudah aktif, ubah jadi false.
window.NO_STORAGE=true;
