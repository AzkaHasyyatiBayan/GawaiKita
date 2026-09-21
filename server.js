require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const createApiRouter = require('./routes/apiFactory');

const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());

// Melayani file frontend static dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// Rute langsung untuk halaman Admin & Research
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/research', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'research.html'));
});

app.get('/testbed', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'research.html'));
});

// ============================================================
// 4 VARIAN TESTBED — inilah objek utama eksperimen riset
// Semua varian menunjuk ke MODEL & LOGIKA yang sama persis
// (lihat routes/apiFactory.js) — hanya proteksinya yang beda.
// ============================================================
app.use('/api/v0', createApiRouter({ sanitize: false, validate: false })); // V0: Baseline (tanpa proteksi)
app.use('/api/v1', createApiRouter({ sanitize: true, validate: false }));  // V1: express-mongo-sanitize saja
app.use('/api/v2', createApiRouter({ sanitize: false, validate: true }));  // V2: Validasi Joi saja
app.use('/api/v3', createApiRouter({ sanitize: true, validate: true }));   // V3: Kombinasi sanitize + Joi

// Endpoint info & status testbed
app.get('/api/info', (req, res) => {
  res.json({
    project: 'GawaiKita Marketplace & NoSQL Injection Research Testbed',
    variants: {
      v0: { path: '/api/v0', name: 'V0 — Baseline', sanitize: false, validate: false },
      v1: { path: '/api/v1', name: 'V1 — Sanitize Only', sanitize: true, validate: false },
      v2: { path: '/api/v2', name: 'V2 — Joi Schema Only', sanitize: false, validate: true },
      v3: { path: '/api/v3', name: 'V3 — Combination (Sanitize + Joi)', sanitize: true, validate: true }
    },
    testEndpoints: [
      { method: 'POST', path: '/login', target: 'Auth bypass via $ne, $gt, $regex' },
      { method: 'GET', path: '/products?minPrice=&maxPrice=&brand=&category=&sort=', target: 'Operator injection ($gt, $lt, $where)' },
      { method: 'GET', path: '/orders?status=', target: 'Operator injection pada status order ($ne)' },
      { method: 'GET', path: '/admin/users?search=', target: 'Admin data exposure ($regex, $or)' }
    ]
  });
});

// Fallback untuk SPA jika rute bukan /api
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gawaikita';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Terhubung ke MongoDB (mongodb://127.0.0.1:27017/gawaikita)');
    app.listen(PORT, () => {
      console.log(`- Server GawaiKita berjalan di http://localhost:${PORT}`);
      console.log(`- Toko Utama: http://localhost:${PORT}/`);
      console.log(`- Panel Admin: http://localhost:${PORT}/admin`);
      console.log(`- Lab Riset Testbed: http://localhost:${PORT}/research`);
    });
  })
  .catch((err) => {
    console.error('❌ Gagal koneksi ke MongoDB:', err.message);
  });
