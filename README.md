# GawaiKita — Gadget Marketplace & NoSQL Injection Research Testbed

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-8.5-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![Joi](https://img.shields.io/badge/Joi-17.13-20C997?style=for-the-badge&logo=joi&logoColor=white)
![OWASP](https://img.shields.io/badge/Security-OWASP%20API%20Top%2010-blue?style=for-the-badge&logo=owasp&logoColor=white)

<p align="center">
  <strong>Platform Marketplace Gadget Modern & Testbed Eksperimental Komparatif Keamanan REST API MongoDB</strong><br>
</p>

[Fitur Marketplace](#-fitur-utama-marketplace) •
[Teknologi](#-teknologi-dan-dependensi) •
[Arsitektur 4 Varian](#-arsitektur-4-varian-testbed-api) •
[Hasil Benchmark](#-hasil-evaluasi-benchmark-empiris) •
[Panduan Instalasi](#-panduan-instalasi--menjalankan-proyek) •
[Skenario Uji](#-spektrum-vektor-serangan-uji)

</div>

---

## Gambaran Umum Proyek

**GawaiKita** adalah proyek ganda (*dual-purpose platform*) yang mengintegrasikan:
1. **Aplikasi Marketplace Gadget**: Pengalaman belanja e-commerce lengkap (katalog gadget, pencarian pintar, filter dinamis multi-kriteria, keranjang, checkout pesanan terintegrasi basis data, sistem ulasan pembeli, dan portal dashboard administrator).
2. **Laboratorium Riset Keamanan (Research Testbed)**: Lingkungan pengujian komparatif terkontrol untuk mengevaluasi efektivitas mitigasi kerentanan **NoSQL Injection (NoSQLi)** dan *logic bypass* pada REST API berbasis Express.js dan MongoDB.

---

## Teknologi dan Dependensi

Sistem dibangun dengan arsitektur modern berkinerja tinggi tanpa ketergantungan berlebih (*lean and clean architecture*):

### 1. Backend & Server Runtime
| Teknologi | Versi | Peran & Fungsi |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | Runtime environment komputasi JavaScript sisi server berbasis mesin V8. |
| **Express.js** | `^4.19.2` | Minimalist web framework untuk routing REST API dan manajemen pipeline middleware. |
| **MongoDB** | `>= 6.0` | Basis data NoSQL dokumen berkinerja tinggi untuk persistensi data produk, user, dan transaksi. |
| **Mongoose** | `^8.5.0` | Object Data Modeling (ODM) library untuk pemodelan skema, casting query, dan interaksi MongoDB. |
| **Joi** | `^17.13.3` | Powerful schema description language & data validator untuk validasi ketat input API (Positive Security Model). |
| **express-mongo-sanitize** | `^2.2.0` | Middleware sanitasi rekursif untuk mendeteksi dan melucuti karakter operator `$` dan `.`. |
| **jsonwebtoken (JWT)** | `^9.0.2` | Autentikasi stateless berbasis bearer token dengan penandatanganan kriptografis aman. |
| **bcryptjs** | `^2.4.3` | Pustaka hashing password satu arah dengan garam adaptif (*adaptive salted hashing*). |
| **CORS** | `^2.8.5` | Konfigurasi Cross-Origin Resource Sharing untuk pembatasan asal permintaan. |
| **dotenv** | `^16.4.5` | Manajemen variabel lingkungan (*environment variables*) terisolasi. |

### 2. Frontend & User Interface
| Teknologi | Kategori | Peran & Fungsi |
| :--- | :--- | :--- |
| **HTML5 Semantic** | Markup | Struktur dokumen ramah SEO dan standar aksesibilitas web (a11y). |
| **Vanilla CSS3** | Desain & Styling | Desain kustom berorientasi visual modern, tema dark-mode cyber lab, glassmorphism, CSS Grid, dan tata letak responsif adaptif. |
| **Vanilla JavaScript (ES6+)** | Logika Klien | Logika asinkron Fetch API murni tanpa bloatware framework untuk performa rendering instan. |
| **Chart.js** | Visualisasi Grafik | Rendering diagram batang komparatif interaktif, perbandingan konkurensi, dan status serangan. |
| **jsPDF & jsPDF-AutoTable** | Mesin Laporan PDF | Pustaka pembuatan dokumen PDF vektor murni programatik 2 halaman standar A4 tanpa blank-canvas. |
| **FontAwesome 6.5** | Iconography | Set ikon antarmuka grafis vektor terstandarisasi. |
| **Google Fonts** | Tipografi | Font modern *Space Grotesk* (Heading), *Inter* (Body UI), dan *Fira Code* (Monospace Payload). |

### 3. Testing & Benchmarking Tooling
- **Automated CLI Benchmark Runner** (`utils/benchmark.js`): Eksekutor stress test konkurensi paralel (hingga 30 concurrent connections), penghitung metrik Confusion Matrix, dan pemantau konsumsi RAM Node.js Heap / RSS.
- **Web Live Security Playground** (`/research`): Portal interaktif untuk menguji payload secara langsung terhadap 4 varian API secara *real-time*.

---

## Fitur Utama Marketplace

- **Katalog Gadget Lengkap**: Kategori Smartphone, Laptop, Tablet, Aksesoris, dan Wearable.
- **Multi-Filter & Multi-Sort Dinamis**: Filter rentang harga (Min-Max), filter brand otomatis dari database, filter kategori, serta pengurutan harga/tanggal.
- **Pencarian Real-Time**: Pencarian teks cerdas pada nama produk, brand, dan deskripsi spesifikasi.
- **Detail Produk Interaktif**: Modal spesifikasi teknis (RAM, ROM/Storage, Ukuran Layar, Kapasitas Baterai, Prosesor, Garansi).
- **Keranjang Belanja & Checkout**: Keranjang dinamis dengan proteksi stok barang dan penyimpanan pesanan ke MongoDB.
- **Riwayat Transaksi Pelanggan**: Daftar pesanan akun pelanggan dilengkapi filter status (*Pending, Paid, Shipped, Delivered, Cancelled*) dan konfirmasi pesanan selesai.
- **Sistem Ulasan Pembeli**: Verifikasi pembeli terverifikasi (*verified buyer*) untuk menerbitkan rating bintang dan ulasan produk.
- **Panel Administrator**: Dashboard analitik toko, manajemen inventaris produk (CRUD), update status pengiriman pesanan, dan pencarian data pengguna.

---

## Arsitektur 4 Varian Testbed API

Untuk mengisolasi efektivitas middleware secara objektif, seluruh varian menggunakan basis data dan logika model yang **100% identik**:

```
                              [ Incoming HTTP Request ]
                                         │
        ┌──────────────────┬─────────────┴────────────┬──────────────────┐
        ▼                  ▼                          ▼                  ▼
  [ /api/v0 ]        [ /api/v1 ]                [ /api/v2 ]        [ /api/v3 ]
  (Baseline)         (Sanitasi)                 (Joi Only)         (Kombinasi)
        │                  │                          │                  │
   Tanpa Guard    express-mongo-sanitize      Validasi Skema Joi   Validasi Skema Joi
        │                  │                          │                  │
        │                  │                          │        express-mongo-sanitize
        │                  │                          │                  │
        └──────────────────┴─────────────┬────────────┴──────────────────┘
                                         ▼
                             [ Mongoose Query Engine ]
                                         │
                                         ▼
                               [ MongoDB Database ]
```

1. **Varian V0 — Baseline (`/api/v0`)**: Tanpa sanitasi dan tanpa validasi skema Joi. Berfungsi sebagai titik acuan kerentanan (*ground zero*).
2. **Varian V1 — Sanitize Only (`/api/v1`)**: Hanya menerapkan middleware `express-mongo-sanitize`. Melucuti karakter kunci `$` dan `.`.
3. **Varian V2 — Joi Only (`/api/v2`)**: Hanya menerapkan validasi skema ketat `Joi` di lapisan gerbang rute API. Menolak tipe non-skalar dan atribut tak terdaftar.
4. **Varian V3 — Kombinasi (`/api/v3`)**: Menerapkan arsitektur pertahanan berlapis (*Defense-in-Depth*) dengan menggabungkan Validasi Joi (Primer) dan Sanitasi Operator (Sekunder).

---

## Spektrum Vektor Serangan Uji

Testbed mengevaluasi 9 vektor eksploitasi NoSQL injection dunia nyata dan 4 lalu lintas legal:

| No | Kategori Serangan | Endpoint Target | Contoh Payload Nyata | Dampak Keamanan |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Auth Bypass (`$ne null`)** | `POST /login` | `{"email": "admin@...", "password": {"$ne": null}}` | Pengambilalihan akun administrator tanpa kredensial sah. |
| **2** | **Auth Bypass (`$gt empty`)** | `POST /login` | `{"email": "admin@...", "password": {"$gt": ""}}` | Bypass autentikasi via operator relasional string. |
| **3** | **Price Filter Injection** | `GET /products` | `?minPrice[$gt]=0` | Manipulasi logika filter katalog harga produk. |
| **4** | **Orders Status Injection** | `GET /orders` | `?status[$ne]=none` | Penerobosan kontrol akses status transaksi pesanan. |
| **5** | **User Data Exposure (`$regex`)** | `GET /admin/users` | `?search[$regex]=.*` | *Data harvesting* / pencurian massal data PII pengguna. |
| **6** | **Blind / Time-based NoSQLi** | `GET /products` | `?brand[$where]=this.price>0` | Eksekusi kode arbitrary JavaScript di sisi basis data. |
| **7** | **ReDoS Denial of Service** | `GET /products` | `?q=(((((a%2B)%2B)ba%2B)b)%2B)%24` | *Catastrophic backtracking* yang membekukan CPU server. |
| **8** | **Mass Assignment Escalation** | `POST /register` | `{"name": "...", "role": "admin"}` | Eskalasi hak akses langsung menjadi akun Administrator. |
| **9** | **HTTP Parameter Pollution** | `GET /products` | `?minPrice=100&minPrice=200` | Injeksi array tak terduga memicu runtime exception (HTTP 500). |
| **10**| **Legitimate Traffic (4 Kasus)**| Login, Search, Filter | Input alfanumerik legal sesuai kontrak bisnis API | Verifikasi *Zero False Positive* (tidak salah blokir). |

---

## Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **MongoDB**: MongoDB Community Server aktif di lokal port `27017` ([Unduh MongoDB](https://www.mongodb.com/try/download/community))
- **Git**: Untuk manajemen versi source code

### 2. Kloning Repositori
```bash
git clone https://github.com/username/gawaikita.git
cd gawaikita
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi pada file `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gawaikita
JWT_SECRET=gawaikita_super_secret_jwt_key_2026
```

### 5. Seed Database (Katalog Produk & Akun Pengujian)
Jalankan seeder untuk mengisi katalog gadget dan akun demo:
```bash
npm run seed
```

### 6. Menjalankan Server Aplikasi
```bash
npm start
```
Akses platform melalui browser:
- **Marketplace Toko**: [http://localhost:5000](http://localhost:5000)
- **Panel Administrator**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Security Research Testbed**: [http://localhost:5000/research](http://localhost:5000/research)

### 7. Menjalankan Uji Benchmark Otomatis (CLI)
Untuk menjalankan suite pengujian ilmiah otomatis melalui terminal:
```bash
npm run benchmark
```

---

## Struktur Direktori Proyek

```plaintext
gawaikita/
├── middleware/
│   ├── auth.js               # Verifikasi JWT token & kontrol hak akses RBAC
│   └── validate.js           # Middleware komparatif (express-mongo-sanitize & skema Joi)
├── models/
│   ├── Order.js              # Model data pesanan & transaksi pelanggan
│   ├── Product.js            # Model data katalog gadget & spesifikasi teknis
│   ├── Review.js             # Model ulasan & rating pembeli terverifikasi
│   └── User.js               # Model akun pengguna, role admin/customer, hash bcrypt
├── public/
│   ├── css/
│   │   ├── admin.css         # Styling antarmuka panel administrator
│   │   ├── research.css      # Styling responsif laboratorium riset dark-mode
│   │   └── style.css         # Styling responsif etalase marketplace toko
│   ├── js/
│   │   ├── admin.js          # Logika frontend manajemen inventaris & pesanan admin
│   │   ├── api.js            # Client HTTP fetch wrapper untuk komunikasi API
│   │   ├── app.js            # Komponen umum & utilitas UI
│   │   ├── research.js       # Engine live playground, grafik Chart.js & export PDF
│   │   └── store.js          # Logika etalase, keranjang belanja, filter & checkout
│   ├── admin.html            # Halaman Web Panel Administrator
│   ├── index.html            # Halaman Web Toko Marketplace Utama
│   └── research.html         # Halaman Web Laboratorium Riset Keamanan
├── routes/
│   ├── admin.js              # Rute endpoint operasional administrator
│   ├── apiFactory.js         # Factory generator 4 varian rute API (/v0, /v1, /v2, /v3)
│   ├── auth.js               # Rute autentikasi akun (register, login, profile)
│   ├── orders.js             # Rute pemrosesan transaksi & riwayat pesanan
│   ├── products.js           # Rute katalog, pencarian, filter, dan ulasan produk
│   └── users.js              # Rute manajemen data profil pengguna
├── utils/
│   ├── benchmark.js          # Suite benchmark otomatis & stress test konkurensi CLI
│   └── seed.js               # Data seeder katalog produk dan akun demo
├── .env.example              # Template variabel lingkungan
├── .gitignore                # Berkas pengecualian Git
├── package.json              # Manifes dependensi dan script npm
└── server.js                 # Entrypoint server HTTP Express & koneksi MongoDB
```

---