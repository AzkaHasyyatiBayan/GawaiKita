# Walkthrough: Pembaruan Desain, Alur Transaksi WhatsApp, & Fitur Real-Marketplace GawaiKita

Semua revisi dan penyempurnaan fitur yang diminta telah berhasil dieksekusi dan diverifikasi secara menyeluruh pada aplikasi **GawaiKita** di `d:\project\gawaikita`.

---

## 1. Ringkasan Perubahan yang Diterapkan

### A. Estetika & Palet Warna Modern Marketplace
- **Latar Belakang Putih Bersih (`#FFFFFF`)**: Mengubah background utama dari warna warm grey menjadi putih bersih ala toko online resmi.
- **Warna Pendukung Cream & Abu-abu Lembut (`#F8F9FA` / `#FAF9F5`)**: Memberi kontras yang teduh dan elegan pada kartu gadget, sidebar filter, dan kontainer sekunder.
- **Warna Biru Baru (*Vibrant Tech Royal Blue*)**:
  - Warna biru disesuaikan menjadi sedikit lebih gelap, lebih tegas, dan jenuh (*saturated*) sehingga tidak terkesan pudar/kusam, namun tetap segar (*fresh*) dan bernuansa modern tech marketplace premium:
  - Utama (`--navy` / `--primary`): `#1D4ED8` (Rich Royal Blue)
  - Hover / Aksen Terang (`--navy-light` / `--primary-hover`): `#2563EB` (Bright Electric Tech Blue)
  - Deep / Kontras (`--navy-dark` / `--primary-dark`): `#1E40AF`
  - Soft Tint (`--blue-soft` / `--primary-soft`): `#EFF6FF` (Ice Blue Subtle)
  - Border Accent (`--blue-border`): `#BFDBFE`
- **Warna Aksen Tetap**: Kuning/Oranye (`#FFB703` & `#FB8500`) untuk harga dan rating bintang, serta Hijau (`#10B981`) untuk ketersediaan stok.

### B. Penyesuaian Tombol "Panel Admin" di Navbar
- Ukuran kotak tombol disesuaikan menjadi **horizontal pill** yang ramping, compact, dan proporsional (`0.3rem 0.65rem`, font `0.76rem`), menyatu harmonis dengan elemen navbar lainnya tanpa terkesan terlalu besar.

### C. Redesain Panel Admin: Top Navbar Horizontal (Tanpa Sidebar)
- **Struktur Layout Baru**: Sidebar vertikal dihapus dan digantikan oleh **Top Horizontal Navbar** yang bersih dan modern.
  - Tab Navigasi: **Dashboard**, **Katalog Produk**, **Pesanan Pelanggan**, dan **Data Pengguna**.
  - Sisi Kanan: Tautan *"Kunjungi Toko"*, profil administrator, dan tombol keluar.
- **Dashboard Analisis Proporsional**:
  - Ukuran kartu KPI (Omzet, Pesanan, Item, Pengguna) dan angka diperkecil secara harmonis (`font-size: 1.45rem`, padding `1rem`), menjadikannya compact dan nyaman dipandang.
  - Dua grafik Chart.js (Status Pesanan & Kategori Produk) disesuaikan tingginya (~250px) agar rapi.

### D. Tabel Responsif dengan Horizontal Scroll (Anti-Terpotong)
- Seluruh tabel di panel admin (Katalog Produk, Pesanan, dan Pengguna) dibungkus dengan kontainer `.table-responsive-wrapper` yang memiliki `overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: 900px;`.
- Tabel dapat digeser ke samping dengan mulus saat layar diperkecil atau window browser tidak dalam mode *fullscreen*, sehingga seluruh kolom informasi (harga, stok, tombol aksi) tetap utuh dan tidak terpotong.

### E. Alur Transaksi & Pembayaran WhatsApp (Real-Case Marketplace)
- **Status Awal Pesanan**: Saat customer menekan Checkout, pesanan otomatis dicatat ke MongoDB dengan status `pending` (bukan langsung lunas).
- **Modal Konfirmasi WhatsApp**:
  - Muncul modal popup dengan nomor pesanan resmi (misal: `#GWK-B74A21`), rincian tagihan, dan tombol hijau besar **"Konfirmasi ke WhatsApp Admin"**.
  - Mengarahkan langsung ke `https://wa.me/6281298765432` dengan pesan otomatis terisi nomor pesanan dan total harga.
- **Validasi Pembayaran oleh Admin**:
  - Di Panel Admin, pesanan berstatus `pending` dilengkapi tombol aksi cepat: **"✅ Validasi Bayar (Set Lunas)"**.
  - Admin dapat memperbarui status pesanan secara bertahap: `pending` → `paid` → `shipped` → `completed`.

### F. Konfirmasi Barang Diterima & Sistem Ulasan + Balasan Resmi Toko
- **Konfirmasi Penerimaan**: Customer pada tab Riwayat Pesanan dapat menekan tombol **"📦 Konfirmasi Barang Diterima"** saat pesanan berstatus `shipped` untuk mengubah status menjadi `completed`.
- **Beri Ulasan**: Customer dapat menekan **"⭐ Beri Ulasan"** untuk memberikan rating bintang (1–5) interaktif dan komentar pengalaman produk.
- **Balasan Resmi Toko (Admin Reply)**:
  - Admin dapat melihat ulasan pembeli di Panel Admin dan membalas ulasan tersebut.
  - Balasan admin tampil dengan lencana **🛡️ Balasan Resmi Toko** di modal detail produk pada etalase toko.

### G. Penanganan Gambar: Auto-Convert Google Drive & Upload File Lokal
- **Google Drive Link Converter**: Admin cukup menempel link Google Drive (misal: `https://drive.google.com/file/d/.../view?usp=sharing`), sistem secara otomatis mengonversinya menjadi URL stream gambar langsung (`https://lh3.googleusercontent.com/d/...`).
- **Upload File Lokal**: Admin dapat memilih file gambar langsung dari perangkat laptop/PC melalui input file lokal, yang otomatis diproses via FileReader Base64 lengkap dengan *Live Image Thumbnail Preview*.

### H. Redesain Pop-up Notifikasi (Toast)
- Notifikasi toast diubah menjadi gaya **floating modern card / glassmorphism** di pojok kanan atas dengan latar transparan halus, ikon bulat berwarna lembut (sukses/error/info), teks pesan yang rapi, dan tombol *close*.

---

## 2. Hasil Pengujian Fungsional & E2E

Seluruh skenario pengujian baru telah dieksekusi dan diverifikasi 100% berhasil:

```
=== STARTING E2E VERIFICATION TEST ===
1. Admin login...                                               ✅ Token diterima
2. Customer login...                                            ✅ Angga Yunandana masuk
3. Create Product with Google Drive Link auto-conversion...      ✅ Auto-converted ke direct stream URL
4. Customer Checkout (Order Status PENDING)...                  ✅ Status awal PENDING
5. Admin Validates Payment (pending -> paid)...                 ✅ Status tervalidasi PAID
6. Admin Dispatches Order (paid -> shipped)...                  ✅ Status diperbarui SHIPPED
7. Customer Confirms Goods Received (shipped -> completed)...   ✅ Status diselesaikan COMPLETED
8. Customer Submits Review (5 Stars + Comment)...               ✅ Ulasan tersimpan
9. Admin Replies to Customer Review...                          ✅ Balasan resmi toko tersimpan
```

### I. Perbaikan SyntaxError & Safeguard Inisialisasi DOM (Resolved)
- **Penyebab Loading Berputar & Tombol Masuk Tidak Merespons**:
  - Pada fungsi `loadOrders()` di [store.js](file:///d:/project/gawaikita/public/js/store.js#L860), deklarasi pembuka `orders.map(ord => {` sempat terlewat saat penggabungan baris, menyebabkan `Uncaught SyntaxError: Missing catch or finally after try`.
  - Kesalahan sintaksis tersebut menghentikan parsing skrip JavaScript secara keseluruhan, sehingga `DOMContentLoaded` tidak terpicu, etalase tertahan pada *skeleton loading*, dan *event listener* tombol modal login "Masuk" tidak terpasang.
- **Solusi yang Diterapkan**:
  - Blok mapping `orders.map` dan format rincian item pesanan diperbaiki secara tuntas (`node -c public/js/store.js` lolos 100% tanpa error).
  - Ditambahkan **lifecycle readyState safeguard**:
    ```javascript
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
    ```
    sehingga fungsi inisialisasi dijamin langsung berjalan kapan pun skrip dimuat (baik saat reload cepat, cache, maupun DOM siap).

### J. Redesain Total Layout Admin (Top Horizontal Navbar) & Perbaikan TypeError
- **Penyebab Tampilan Admin Berantakan & Tombol Edit/Ulasan Error**:
  - File [admin.html](file:///d:/project/gawaikita/public/admin.html) sebelumnya masih menggunakan tag `<aside class="admin-sidebar">` lama, sehingga aturan CSS untuk `.admin-navbar` tidak terpasang dengan pas dan navbar tampak seperti HTML polos tanpa CSS.
  - Elemen modal review admin (`#adminReviewsModal`, `#adminReviewProdTitle`, `#adminReviewsListContainer`) dan elemen pratinjau gambar (`#formImagePreviewWrap`, `#formImagePreview`) belum terdefinisi di HTML, memicu `TypeError: Cannot set properties of null` saat membuka modal edit maupun modal ulasan.
- **Solusi yang Diterapkan**:
  - [admin.html](file:///d:/project/gawaikita/public/admin.html) direkonstruksi penuh dengan struktur **Top Horizontal Navbar**: brand logo, tab navigasi pil tengah, profil admin, dan tombol *refresh*.
  - Menambahkan modal `#adminReviewsModal` lengkap dengan wadah daftar ulasan dan formulir balasan resmi toko.
  - Menambahkan input file lokal `#formProdFileInput` dan wadah *live preview thumbnail* `#formImagePreviewWrap`.
  - Membungkus seluruh tabel (Katalog, Pesanan, Pengguna) dengan `.table-responsive-wrapper` sehingga dapat di-scroll horizontal tanpa kolom terpotong.

### K. Peningkatan Pengalaman Ulasan Pelanggan (*Customer Review UX*)
- **Pemilihan Rating Bintang Interaktif**: Bintang kini merespons *hover mouse* dengan animasi transisi halus dan menampilkan label sentimen dinamis (misal: *5 dari 5 Bintang — Sangat Puas & Rekomendasi*).
- **Chip Keunggulan Cepat (*Quick Tags*)**: Pengguna dapat sekali klik menambahkan poin apresiasi ke ulasan (`+ Original & Segel`, `+ Baterai Awet`, `+ Layar Jernih`, `+ Packing Aman`).
- **Hitungan Karakter Real-time**: Indikator batas karakter `0 / 500 karakter` yang diperbarui saat mengetik.
- **Lencana Pembeli Terverifikasi & Balasan Toko**: Ulasan pelanggan pada modal etalase menampilkan lencana centang hijau `<i class="fa-solid fa-circle-check"></i> Pembeli Terverifikasi` dan kotak balasan resmi berlogo tameng.

### L. Penanganan Gambar Google Drive & Tracking Prevention
- Tautan Google Drive kini dikonversi otomatis ke stream URL publik resmi: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`.
- Ditambahkan atribut `loading="lazy" referrerpolicy="no-referrer"` dan fallback placeholder otomatis pada seluruh elemen gambar `<img>`, mencegah peringatan *Tracking Prevention* browser terkait penyimpanan pihak ketiga.

### M. Eliminasi 100% Emoji Menjadi Ikon Vektor SVG
- Seluruh emoji mentah (seperti ⭐, 🛡️, 📦, ✅, 🚨, 🎉) telah digantikan 100% dengan ikon FontAwesome berbasis SVG/Webfont (`<i class="fa-solid ..."></i>`), menghadirkan visual marketplace yang jauh lebih rapi, profesional, dan seragam di semua sistem operasi.

### N. Penyempurnaan Minimalis Navbar Administrator
- **Menu Navigasi Ringan & Bersih**: Wadah abu-abu (*capsule box*) di belakang tab menu admin telah dihapus. Tab menu kini mengambang bebas secara alami (*transparent*), berjarak lega, dengan efek *hover* halus dan garis aksen indikator aktif tipis (*bottom accent line*).
- **Pembersihan Lencana "ADMIN" Berulang**:
  - Lencana kecil `ADMIN` di samping kanan logo "GawaiKita" telah dihilangkan.
  - Redundansi teks pada profil kanan telah dirapikan: baris atas menampilkan nama entitas toko `GawaiKita` dan baris bawah bertindak sebagai lencana role `Administrator`, sehingga kata "Admin" tidak lagi muncul bertumpuk secara berulang.
- **Penyesuaian Proporsi Tombol "Kunjungi Toko"**:
  - Ukuran kotak tombol dan ukuran *font* (`font-size: 0.72rem`, padding `0.26rem 0.55rem`) telah diperkecil agar proporsional, ramping, dan tidak mencolok saat layar dalam mode penuh (*fullscreen*).

### O. Filter Brand Toko 100% Dinamis & Real-Time Cross-Tab Sync
- **Penyebab Masalah Sebelumnya**:
  - Pilihan kotak centang (*checkbox*) brand di sidebar toko ([index.html](file:///d:/project/gawaikita/public/index.html)) sebelumnya ditulis secara statis/hardcoded (`Neonix`, `Kaira`, `Verlite`, `Zenoro`, `Buddi`, `Orinis`).
  - Ketika nama brand salah satu produk diedit atau ditambah melalui Panel Admin, opsi filter di halaman depan toko tidak ikut berubah karena daftar brand belum dimuat secara dinamis dari database MongoDB.
- **Solusi yang Diterapkan**:
  1. **Endpoint Backend Dinamis (`GET /api/:variant/brands`)**:
     - Ditambahkan endpoint di [apiFactory.js](file:///d:/project/gawaikita/routes/apiFactory.js) yang mengambil seluruh nilai brand unik yang tersimpan di MongoDB secara otomatis menggunakan `Product.distinct('brand')`, diurutkan secara alfabetis (A-Z).
     - Berjalan di seluruh varian penelitian (V0–V3).
  2. **Rendering Otomatis di Sisi Klien ([store.js](file:///d:/project/gawaikita/public/js/store.js))**:
     - Checkbox statis di HTML dihapus dan digantikan oleh fungsi `loadDynamicBrandsFilter()`.
     - Fungsi ini memuat seluruh brand aktif langsung dari MongoDB dan merender checkbox secara dinamis.
     - Status centang user yang sedang aktif tetap dipertahankan (*state-preserved*).
     - Menggunakan *delegated event listener* pada kontainer `#brandCheckboxList` sehingga penambahan/perubahan brand baru tetap merespons klik dengan akurat.
  3. **Sinkronisasi Lintas Tab Otomatis (*Zero-Refresh Cross-Tab Sync*)**:
     - Setiap kali admin mengedit, menambah, atau menghapus produk di Panel Admin ([admin.js](file:///d:/project/gawaikita/public/js/admin.js)), sinyal `localStorage.setItem('gawai_catalog_synced', Date.now())` dipancarkan.
     - Tab toko secara instan menangkap sinyal melalui *event* `window.addEventListener('storage')` dan me-refresh daftar brand serta katalog tanpa perlu memuat ulang halaman secara manual (*hard refresh*).
     - Ditambahkan pula *event* `window.addEventListener('focus')` agar setiap kali user berpindah kembali ke tab toko, daftar brand selalu tersinkronisasi paling mutakhir.

### P. Audit Menyeluruh & Penguatan Keamanan Standar E-Commerce (*Production-Grade Security*)
Sistem telah diaudit secara mendalam untuk memastikan bahwa platform tidak naif atau lemah terhadap serangan e-commerce umum, sekaligus tetap menjaga keaslian objek penelitian testbed (V0–V3):
1. **Pencegahan Ekskalasi Hak Akses (*Privilege Escalation*)**:
   - Rute registrasi publik (`POST /register`) kini memaksa role menjadi `customer`. Payload penyerang yang menyisipkan `role: "admin"` secara otomatis ditolak dan dipaksa menjadi customer biasa (menutup celah *Mass Assignment*).
   - Panjang password minimal 6 karakter ditegakkan di sisi server.
2. **Otorisasi Ketat Operasi Administrator (*RBAC Access Control*)**:
   - Operasi penambahan produk (`POST /products`), pengeditan produk (`PUT /products/:id`), penghapusan produk (`DELETE /products/:id`), balasan ulasan toko (`POST .../reply`), dan ringkasan statistik omzet (`GET /admin/stats`) kini dilindungi oleh middleware `requireAdminRole`.
   - Permintaan tanpa token ditolak `401 Unauthorized`. Permintaan dari akun non-admin ditolak `403 Forbidden`.
3. **Perhitungan Harga Sisi Server (*Anti Price-Tampering*)**:
   - Pada rute checkout (`POST /orders`), server tidak lagi mempercayai `totalPrice` atau `priceAtPurchase` yang dikirim dari browser.
   - Server mengambil harga resmi langsung dari database MongoDB untuk setiap item, menghitung subtotal secara matematis di backend, dan menolak pesanan jika produk tidak ada. Upaya memanipulasi tagihan (misal Rp 1.000 untuk laptop Rp 15 Juta) otomatis digagalkan.
4. **Validasi Stok & Pencegahan *Overselling***:
   - Server mengecek ketersediaan stok (`prod.stock >= qty`) sebelum membuat order. Jika stok tidak mencukupi, server membatalkan pesanan dengan pesan informatif `400 Bad Request` dan mencegah stok bernilai negatif.
5. **Kontrol Transisi Status Pesanan (*State-Machine Authorization*)**:
   - Hanya Administrator yang memiliki hak mengubah status menjadi `paid` (Validasi Pembayaran) atau `shipped` (Pengiriman).
   - Pembeli hanya berhak melakukan konfirmasi barang diterima (`shipped` -> `completed`) khusus untuk pesanannya sendiri.
6. **Perbaikan Skema Validasi Joi (*Zero False-Positives*)**:
   - Memperbaiki skema `brand` agar mendukung spasi ("Google Pixel"), tanda koma untuk pemilihan multi-brand ("Google,Neonix"), serta nilai kosong saat reset filter tanpa memicu galat `400 Bad Request`.
   - Memperbaiki skema `email` agar mendukung TLD testing (`.test`).
7. **Pencegahan *Stored XSS***:
   - Menambahkan utilitas `escapeHtml()` pada [store.js](file:///d:/project/gawaikita/public/js/store.js) dan [admin.js](file:///d:/project/gawaikita/public/js/admin.js) untuk menyaring karakter berbahaya (`<`, `>`, `"`, `'`, `&`) pada ulasan pembeli, komentar, alamat, dan balasan toko.
8. **Default Varian Produksi (V3)**:
   - Frontend etalase toko kini secara default menggunakan `/api/v3` yang mengaktifkan *Defense-in-Depth* (Sanitasi MongoDB + Validasi Skema Joi), sementara halaman `/research` tetap bebas menguji seluruh varian V0, V1, V2, dan V3 secara komparatif.

### Q. Pembersihan Akun Pengujian, Update Nama Angga Yunandana, & Fitur Edit Profil Pengguna
1. **Pembersihan Akun Dump / Pengujian**:
   - Akun uji coba penyerang (`attacker_1789984073755@test.com` dan `attacker_1789984122581@test.com`) telah dihapus secara permanen dari database MongoDB.
   - Daftar pengguna di Panel Admin kini bersih dan hanya berisi akun resmi: `Admin GawaiKita`, `Angga Yunandana`, dan `Eve`.
2. **Penggantian Nama Pelanggan Resmi & Email (Budi Santoso $\rightarrow$ Angga Yunandana)**:
   - Akun pelanggan utama di database telah diperbarui menjadi **Angga Yunandana** dengan email resmi **`angga@gawaikita.test`**, alamat `Jl. Kemang Raya No. 18, Jakarta Selatan`, dan nomor telepon `081312345678`.
   - File [seed.js](file:///d:/project/gawaikita/utils/seed.js), tombol login cepat di [index.html](file:///d:/project/gawaikita/public/index.html), dan draf pencarian [research.js](file:///d:/project/gawaikita/public/js/research.js) telah disinkronisasikan menggunakan akun Angga Yunandana (`angga@gawaikita.test`).
3. **Pembersihan Data Penjualan Dump**:
   - Seluruh data transaksi sampah/dump hasil pengujian telah dipangkas menjadi **4 transaksi realistis** yang mencakup siklus lengkap e-commerce:
     - `#GWK-0A397F`: Status **Completed** (Rp 3.499.000 — Neonix Aria 12)
     - `#GWK-0A3981`: Status **Shipped** (Rp 7.899.000 — Kaira X1 Pro)
     - `#GWK-0A3983`: Status **Paid** (Rp 8.999.000 — Verlite Book 14)
     - `#GWK-0A3985`: Status **Pending** (Rp 449.000 — Neonix PowerCore 20000)
4. **Fitur Pengaturan Profil Pengguna (*User Profile Management*)**:
   - **Backend API (`GET /api/:variant/profile` & `PUT /api/:variant/profile`)**:
     - Pengguna dapat membaca dan memperbarui **Nama Lengkap / Username**, **Nomor Telepon / WhatsApp**, dan **Alamat Pengiriman Utama**.
     - **Keamanan Ketat (Email & Role Immutability)**: Bidang `email` dan `role` terkunci secara mutlak di backend. Upaya memanipulasi email login atau menaikkan role menjadi admin akan diabaikan/dilewati oleh server.
     - Server menerbitkan token JWT baru yang membawa pembaruan nama pengguna secara *real-time*.
   - **Antarmuka Pengguna Modal Profil**:
     - Ditambahkan menu **"Pengaturan Profil"** pada popover dropdown akun di navbar.
     - Modal interaktif `#profileModal` menampilkan inisial avatar pengguna, nama pengguna, lencana akun terverifikasi, input nama, input no telepon, textarea alamat, serta field email yang terkunci (*disabled/readonly*) berikon gembok demi keamanan kredensial.

### R. Ekstensi Spektrum Serangan Nyata (*Advanced Attack Taxonomy*)
1. **ReDoS (Regular Expression Denial of Service)**:
   - Pengujian pola backtracking katastropik (`q=(a+)+$`) pada pencarian.
   - V0 & V1 meloloskan regex mentah ke engine MongoDB (rentan freeze CPU).
   - V2 & V3 menolak pola regex tidak aman secara preventif di gerbang API dengan kode HTTP 400.
2. **Mass Assignment / Privilege Escalation**:
   - Pengujian injeksi atribut terlarang `{"role": "admin"}` saat registrasi akun publik.
   - V0 meloloskan atribut role ke database (akun langsung berstatus admin).
   - V1 (Sanitasi) juga meloloskan role karena payload tidak memiliki simbol `$`.
   - V2 & V3 (Joi) menolak tegas request dengan pesan `"role" is not allowed` (HTTP 400).
3. **HTTP Parameter Pollution (Array Injection)**:
   - Pengujian parameter duplikat `?minPrice=1000000&minPrice=2000000` yang diparsing Express menjadi tipe array.
   - V0 & V1 memicu error 500 (CastError) di Mongoose.
   - V2 & V3 memotong array dan mengembalikan HTTP 400 bersih.
4. **Time-based / Blind NoSQL Injection**:
   - Pengujian injeksi JavaScript arbitrary `$where` pada filter produk.
   - V1 menetralkan key `$where` menjadi `_where`.
   - V2 & V3 menolak objek operator secara komprehensif.

### S. Metrik Ilmiah Standar Jurnal Internasional (IEEE / ACM / Elsevier)
| Varian API | Lapisan Proteksi | TP / FN | TN / FP | Recall (Block) | Precision | F1-Score | Throughput (RPS) | p95 Latensi | Status Ketahanan |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **V0** | Baseline (Tanpa Proteksi) | 5 / 4 | 4 / 0 | 56% | 100.0% | 0.714 | 443 Req/s | 64 ms | Rentan (Vulnerable) |
| **V1** | Sanitasi Saja (express-mongo-sanitize) | 6 / 3 | 4 / 0 | 67% | 100.0% | 0.800 | 530 Req/s | 54 ms | Cukup Baik (Moderate) |
| **V2** | Validasi Skema Joi Saja | 9 / 0 | 4 / 0 | 100% | 100.0% | 1.000 | 556 Req/s | 52 ms | Sangat Tangguh (Hardened) |
| **V3** | Kombinasi (Defense-in-Depth) | 9 / 0 | 4 / 0 | 100% | 100.0% | 1.000 | 601 Req/s | 49 ms | Sangat Tangguh (Hardened) |

### T. Fitur Ekspor Data Benchmark, Diagram Interaktif, & Modal Edukasi Serangan
1. **Modal Edukasi Variasi Serangan (Tombol `[i]` pada Setiap Preset)**:
   - Setiap preset serangan (Auth Bypass `$ne`, `$gt`, ReDoS, Blind NoSQL `$where`, Mass Assignment, Parameter Pollution, dll.) kini dilengkapi tombol info `[i]`.
   - Mengklik tombol membuka modal interaktif bertema *dark glassmorphism* yang memuat:
     - **Kategori OWASP**: Klasifikasi ancaman resmi (misal: *A03:2021 — Injection*, *API3:2023 — Broken Object Property Level Authorization*, dll.).
     - **Konsep & Mekanisme Serangan**: Penjelasan komprehensif bagaimana serangan bekerja di lapisan protokol HTTP dan basis data MongoDB.
     - **Contoh Payload di Dunia Nyata**: Potongan kode payload mentah (*JSON body* atau *query parameter*).
     - **Analisis Dampak Risiko (CIA Triad)**: Kerahasiaan, Integritas, dan Ketersediaan sistem.
     - **Rekomendasi Mitigasi & Pertahanan**: Mengapa sanitasi berhasil/gagal dan bagaimana validasi skema Joi mencegahnya.
2. **Visualisasi Metrik Ilmiah Interaktif (Chart.js)**:
   - Setelah benchmark otomatis dieksekusi di halaman riset, 3 kanvas diagram interaktif langsung dirender:
     - **Diagram 1 (Daya Tangkal & Akurasi)**: *Grouped bar chart* membandingkan Recall / Block Rate (%), Precision (%), dan F1-Score (%) antar varian V0, V1, V2, dan V3.
     - **Diagram 2 (Kinerja Konkurensi)**: *Dual-axis chart* membandingkan Throughput (Req/Detik) dan p95 Latensi (ms).
     - **Diagram 3 (Distribusi Status Serangan)**: *Stacked bar chart* yang memperlihatkan rasio serangan yang berhasil ditangkal (*Blocked / TP*) vs yang lolos menembus database (*Exploited / FN*).
3. **Fitur Ekspor / Unduh Hasil Analisis**:
   - **Download CSV (Excel / Google Sheets)**: Mengekspor seluruh tabel metrik 10 kolom berstandar RFC 4180 lengkap dengan stempel waktu pengujian.
   - **Download JSON (Raw Data)**: Mengekspor seluruh struktur data mentah metrik, detail confusion matrix (TP, FN, TN, FP), persentase akurasi, dan performa konkurensi.
   - **Cetak / Simpan PDF (`window.print()`)**: Format cetak ramah cetak (*clean print media style*) yang menyembunyikan navigasi dan menampilkan tabel serta grafik untuk lampiran dokumen skripsi.

---

## 3. Cara Menguji Pembaruan di Browser & Terminal

Server aktif berjalan di `http://localhost:5000`:

1. **Terminal Benchmark Otomatis Ilmiah**:
   ```bash
   node utils/benchmark.js
   ```
2. **Laboratorium Riset Testbed**: 👉 **[http://localhost:5000/research](http://localhost:5000/research)**
   - Coba tombol info `[i]` pada preset serangan untuk membaca edukasi taksonomi ancaman.
   - Tekan tombol **"Jalankan Benchmark Sekarang"**:
     - Amati tabel metrik 10 kolom terisi.
     - Amati 3 diagram Chart.js terender secara dinamis di bawah tabel.
     - Gunakan tombol **"Download CSV"** atau **"Download JSON"** untuk mengunduh berkas laporan hasil pengujian.
3. **Etalase Toko**: 👉 **[http://localhost:5000/](http://localhost:5000/)**
4. **Panel Administrator**: 👉 **[http://localhost:5000/admin](http://localhost:5000/admin)**

