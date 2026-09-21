const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  productFilterSchema,
  orderFilterSchema,
  adminUserSearchSchema
} = require('../middleware/schemas');

/**
 * Factory ini membuat 1 set endpoint yang IDENTIK secara logika,
 * tapi proteksinya bisa di-toggle lewat `options`:
 *   { sanitize: boolean, validate: boolean }
 *
 * V0 -> { sanitize: false, validate: false }  (baseline, tanpa proteksi)
 * V1 -> { sanitize: true,  validate: false }  (express-mongo-sanitize saja)
 * V2 -> { sanitize: false, validate: true }   (Joi validation saja)
 * V3 -> { sanitize: true,  validate: true }   (kombinasi keduanya)
 *
 * Isolasi variabel ini penting secara metodologis: satu-satunya yang
 * berbeda antar varian adalah proteksinya, bukan logika bisnisnya.
 */
function createApiRouter(options = {}) {
  const { sanitize = false, validate: useValidate = false } = options;
  const router = express.Router();

  // --- Middleware sanitasi (kalau varian ini mengaktifkannya) ---
  if (sanitize) {
    router.use(
      mongoSanitize({
        replaceWith: '_', // ganti karakter terlarang ($ dan .) dengan underscore
        onSanitize: ({ req, key }) => {
          console.warn(`[SANITIZED] key "${key}" dibersihkan pada ${req.originalUrl}`);
        }
      })
    );
  }

  // Helper: pasang validasi Joi HANYA kalau useValidate true, else pass-through
  const maybeValidate = (schema, source) =>
    useValidate ? validate(schema, source) : (req, res, next) => next();

  // ============================================================
  // 1. AUTH: REGISTER & LOGIN
  // ============================================================
  router.post('/register', maybeValidate(registerSchema, 'body'), async (req, res) => {
    try {
      const { name, email, password, phone = '', address = '' } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }

      // Pada V0 (baseline tanpa validasi), jika penyerang menyisipkan role 'admin',
      // sistem rentan terhadap Mass Assignment / Privilege Escalation.
      // Pada V2/V3, Joi sudah memblokir request di awal jika ada field 'role'.
      let assignedRole = 'customer';
      if (!useValidate && req.body.role) {
        assignedRole = req.body.role;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        phone,
        address
      });

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // TARGET UJI 1: LOGIN (Auth bypass via $ne, $gt, $regex)
  router.post('/login', maybeValidate(loginSchema, 'body'), async (req, res) => {
    try {
      const { email, password } = req.body;

      // Query ini SENGAJA dibuat rentan (langsung pakai input user tanpa
      // pengecekan tipe manual) — supaya efektivitas proteksi terlihat
      // murni dari middleware, bukan dari validasi manual di controller.
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Email atau password salah' });
      }

      // Kalau `password` berhasil masuk sebagai objek operator (mis. {"$ne": null})
      // dan lolos ke titik ini, bcrypt.compare akan throw/gagal secara aman
      // karena bcrypt expects string — jadi bypass NoSQL paling sering terjadi
      // di query User.findOne, bukan di compare ini. Baris ini tetap dijaga wajar.
      const isMatch = await bcrypt.compare(String(password), user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email atau password salah' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // Helper otentikasi pengguna
  function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026');
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
    }
  }

  // Ambil Data Profil Pengguna
  router.get('/profile', requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }
      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal memuat profil', error: err.message });
    }
  });

  // Perbarui Profil Pengguna (Edit username, alamat, no telepon — email & role terkunci permanen)
  router.put('/profile', requireAuth, async (req, res) => {
    try {
      const { name, phone, address } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Nama lengkap / username wajib diisi' });
      }

      const updateData = {
        name: String(name).trim()
      };
      if (phone !== undefined) updateData.phone = String(phone).trim();
      if (address !== undefined) updateData.address = String(address).trim();

      // updateData sengaja tidak memasukkan 'email' atau 'role' untuk mencegah modifikasi email & role
      const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }

      const token = jwt.sign(
        { id: updatedUser._id, role: updatedUser.role, name: updatedUser.name },
        process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        token,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          role: updatedUser.role
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui profil', error: err.message });
    }
  });

  // ============================================================
  // 2. TARGET UJI 2: FILTER/SEARCH PRODUK (Operator injection $gt/$lt/$where/$regex)
  // ============================================================
  router.get('/products', maybeValidate(productFilterSchema, 'query'), async (req, res) => {
    try {
      const { minPrice, maxPrice, brand, category, sort, q } = req.query;
      const filter = {};

      // Sengaja dibuat "naif": nilai dari req.query langsung dipakai
      // sebagai operator MongoDB tanpa pengecekan tipe tambahan di sini.
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice !== undefined && minPrice !== '') filter.price.$gte = minPrice;
        if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = maxPrice;
      }
      if (brand) {
        if (typeof brand === 'string') {
          const brands = brand.split(',').map(b => b.trim()).filter(Boolean);
          if (brands.length > 1) {
            filter.brand = { $in: brands };
          } else if (brands.length === 1) {
            filter.brand = brands[0];
          }
        } else if (typeof brand === 'object') {
          // Pada V0 (naif), objek operator MongoDB langsung diteruskan ke filter
          filter.brand = brand;
        }
      }
      if (category) filter.category = category;
      if (q) {
        filter.$or = [
          { name: { $regex: String(q), $options: 'i' } },
          { brand: { $regex: String(q), $options: 'i' } },
          { description: { $regex: String(q), $options: 'i' } }
        ];
      }

      let query = Product.find(filter);

      if (sort === 'termurah') query = query.sort({ price: 1 });
      else if (sort === 'termahal') query = query.sort({ price: -1 });
      else if (sort === 'terbaru') query = query.sort({ createdAt: -1 });
      else query = query.sort({ createdAt: -1 });

      const products = await query.exec();
      res.json({ success: true, count: products.length, data: products });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // 2B. DAFTAR BRAND UNIK (Dinamis untuk Filter Toko)
  router.get('/brands', async (req, res) => {
    try {
      const brands = await Product.distinct('brand');
      const cleanBrands = brands
        .filter(Boolean)
        .map(b => String(b).trim())
        .filter(Boolean);
      const uniqueBrands = [...new Set(cleanBrands)].sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      res.json({ success: true, count: uniqueBrands.length, data: uniqueBrands });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal memuat daftar brand', error: err.message });
    }
  });

  router.get('/products/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // Helper konversi Google Drive link ke direct image URL
  function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const gDriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (gDriveMatch && gDriveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w1000`;
    }
    return url;
  }

  // Helper otentikasi role administrator
  function requireAdminRole(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Silakan login sebagai administrator.' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026');
      if (decoded.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Operasi ini hanya untuk Administrator' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
    }
  }

  // CRUD Produk (Khusus Administrator)
  router.post('/products', requireAdminRole, async (req, res) => {
    try {
      const { name, brand, category, price, stock, specs, description, imageUrl, rating } = req.body;
      const cleanImg = normalizeImageUrl(imageUrl) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';
      const newProduct = await Product.create({
        name,
        brand,
        category,
        price: Number(price),
        stock: Number(stock) || 0,
        specs: specs || {},
        description,
        imageUrl: cleanImg,
        rating: Number(rating) || 4.5
      });
      res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', data: newProduct });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal menambah produk', error: err.message });
    }
  });

  router.put('/products/:id', requireAdminRole, async (req, res) => {
    try {
      if (req.body.imageUrl) {
        req.body.imageUrl = normalizeImageUrl(req.body.imageUrl);
      }
      const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      res.json({ success: true, message: 'Produk berhasil diperbarui', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal mengubah produk', error: err.message });
    }
  });

  router.delete('/products/:id', requireAdminRole, async (req, res) => {
    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal menghapus produk', error: err.message });
    }
  });

  // Tambah Ulasan Produk (Customer)
  router.post('/products/:id/reviews', async (req, res) => {
    try {
      const { userId, userName, rating, comment } = req.body;
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

      const newReview = {
        userId: userId || null,
        userName: userName || 'Pelanggan GawaiKita',
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        comment: comment || '',
        createdAt: new Date()
      };

      if (!product.reviews) product.reviews = [];
      product.reviews.unshift(newReview);

      // Recalculate average rating
      const totalRating = product.reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
      product.rating = Number((totalRating / product.reviews.length).toFixed(1));

      await product.save();
      res.status(201).json({ success: true, message: 'Ulasan berhasil ditambahkan', data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan ulasan', error: err.message });
    }
  });

  // Balas Ulasan Produk (Admin Reply - Khusus Administrator)
  router.post('/products/:id/reviews/:reviewId/reply', requireAdminRole, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ success: false, message: 'Teks balasan wajib diisi' });

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

      const review = product.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ success: false, message: 'Ulasan tidak ditemukan' });

      review.adminReply = {
        text,
        repliedAt: new Date()
      };

      await product.save();
      res.json({ success: true, message: 'Balasan ulasan berhasil disimpan', data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal membalas ulasan', error: err.message });
    }
  });

  // ============================================================
  // 3. TARGET UJI 3: FILTER RIWAYAT PESANAN (Operator injection pada field status)
  // ============================================================
  router.get('/orders', maybeValidate(orderFilterSchema, 'query'), async (req, res) => {
    try {
      const { status, userId } = req.query;
      const filter = {};
      if (status) filter.status = status; // rentan kalau status berupa objek operator mis. {"$ne": "none"}
      if (userId) filter.userId = userId;

      const orders = await Order.find(filter)
        .populate('items.productId', 'name price imageUrl')
        .sort({ createdAt: -1 });
      res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // Buat Pesanan Baru (Checkout - Server-Side Price Verification & Anti-Overselling)
  router.post('/orders', async (req, res) => {
    try {
      const { userId, customerName, shippingAddress, items } = req.body;

      if (!userId || !items || !items.length) {
        return res.status(400).json({ success: false, message: 'User dan item pesanan wajib disertakan' });
      }

      // Verifikasi user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Pengguna tidak valid. Silakan login terlebih dahulu.' });
      }

      // Validasi produk, kalkulasi harga murni dari database, dan ketersediaan stok
      let calculatedTotalPrice = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = Math.max(1, parseInt(item.qty) || 1);
        const prod = await Product.findById(item.productId);
        if (!prod) {
          return res.status(404).json({ success: false, message: `Produk dengan ID ${item.productId} tidak ditemukan` });
        }
        if (prod.stock < qty) {
          return res.status(400).json({
            success: false,
            message: `Stok untuk "${prod.name}" tidak mencukupi (Tersedia: ${prod.stock}, dipesan: ${qty})`
          });
        }
        calculatedTotalPrice += prod.price * qty;
        validatedItems.push({
          productId: prod._id,
          name: prod.name,
          qty: qty,
          priceAtPurchase: prod.price
        });
      }

      // Buat order dengan status awal PENDING dan total harga server-side murni
      const order = await Order.create({
        userId,
        customerName: customerName || user.name || 'Pelanggan GawaiKita',
        shippingAddress: shippingAddress || user.address || 'Alamat Pengiriman',
        items: validatedItems,
        totalPrice: calculatedTotalPrice,
        status: 'pending'
      });

      // Kurangi stok produk secara aman
      for (const item of validatedItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Pesanan berhasil dibuat (Menunggu Pembayaran via WhatsApp)',
        data: order
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal membuat pesanan', error: err.message });
    }
  });

  // Update Status Pesanan (Admin Validasi Pembayaran/Pengiriman & Customer Konfirmasi Penerimaan)
  router.patch('/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'paid', 'shipped', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid' });
      }

      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

      // Verifikasi hak akses status:
      // Validasi pembayaran ('paid') atau pengiriman ('shipped') HANYA boleh dilakukan oleh admin
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gawaikita_super_secret_jwt_key_2026');
          if ((status === 'paid' || status === 'shipped') && decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Hanya administrator yang berwenang mengubah status ke ' + status });
          }
          if (status === 'completed' && decoded.role !== 'admin' && String(decoded.id) !== String(order.userId)) {
            return res.status(403).json({ success: false, message: 'Anda tidak berwenang mengonfirmasi pesanan pengguna lain' });
          }
        } catch (tokenErr) {
          return res.status(401).json({ success: false, message: 'Token otentikasi tidak valid' });
        }
      }

      order.status = status;
      await order.save();

      res.json({ success: true, message: 'Status pesanan berhasil diubah', data: order });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal mengubah status', error: err.message });
    }
  });

  // ============================================================
  // 4. TARGET UJI 4: ADMIN — SEARCH USER (Operator injection + data exposure via $regex)
  // ============================================================
  router.get('/admin/users', maybeValidate(adminUserSearchSchema, 'query'), async (req, res) => {
    try {
      const { search } = req.query;
      const filter = {};

      // Titik paling rawan: search langsung dipakai sebagai regex/objek
      // tanpa disaring — skenario umum panel admin yang jarang di-hardening.
      if (search) {
        filter.$or = [{ name: search }, { email: search }];
      }

      const users = await User.find(filter).select('-password');
      res.json({ success: true, count: users.length, data: users });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  // Ringkasan Statistik untuk Admin Dashboard (Khusus Administrator)
  router.get('/admin/stats', requireAdminRole, async (req, res) => {
    try {
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalUsers = await User.countDocuments();
      const orders = await Order.find({ status: { $in: ['paid', 'shipped', 'completed'] } });
      const totalRevenue = orders.reduce((sum, ord) => sum + (ord.totalPrice || 0), 0);

      // Kategori produk distribution
      const products = await Product.find({});
      const categoryDistribution = {
        Smartphone: 0,
        Laptop: 0,
        Wearable: 0,
        Aksesoris: 0
      };
      products.forEach(p => {
        if (categoryDistribution[p.category] !== undefined) {
          categoryDistribution[p.category]++;
        } else {
          categoryDistribution[p.category] = 1;
        }
      });

      // Status order distribution
      const allOrders = await Order.find({});
      const statusDistribution = {
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0
      };
      allOrders.forEach(o => {
        if (statusDistribution[o.status] !== undefined) {
          statusDistribution[o.status]++;
        }
      });

      res.json({
        success: true,
        data: {
          totalProducts,
          totalOrders,
          totalUsers,
          totalRevenue,
          categoryDistribution,
          statusDistribution
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  });

  return router;
}

module.exports = createApiRouter;
