let barChartInstance = null;
let pieChartInstance = null;
let currentProducts = [];
let currentManagingProductId = null;

// ============================================================
// FORMATTER & TOAST
// ============================================================
function formatRupiah(number) {
  if (number === undefined || number === null) return 'Rp 0';
  return 'Rp ' + Number(number).toLocaleString('id-ID');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showAdminToast(message, type = 'normal') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <i class="fa-solid ${icon}" style="font-size:1.1rem; color:${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#1D4ED8'};"></i>
      <span>${message}</span>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ============================================================
// INITIALIZATION & AUTH GUARD
// ============================================================
function initAdminApp() {
  checkAdminAuth();
  initNavbarNavigation();
  initSearchInputs();
  initImageInputHandlers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}

function checkAdminAuth() {
  const user = ApiService.getUser();
  const token = ApiService.getToken();
  const overlay = document.getElementById('authGuardOverlay');

  if (!token || !user || user.role !== 'admin') {
    if (overlay) overlay.style.display = 'flex';
  } else {
    if (overlay) overlay.style.display = 'none';
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = (user.name || '').replace(/^admin\s+/i, '') || user.name || 'GawaiKita';
    loadDashboardData();
  }
}

async function loginAsAdminDemo() {
  try {
    const res = await ApiService.login('admin@gawaikita.test', 'password123');
    if (res.success && res.user.role === 'admin') {
      ApiService.setAuth(res.token, res.user);
      document.getElementById('authGuardOverlay').style.display = 'none';
      const nameEl = document.getElementById('adminName');
      if (nameEl) nameEl.textContent = (res.user.name || '').replace(/^admin\s+/i, '') || res.user.name || 'GawaiKita';
      showAdminToast(`Selamat datang di Panel Manajemen, ${res.user.name}!`, 'success');
      loadDashboardData();
    } else {
      showAdminToast('Akun ini bukan administrator', 'error');
    }
  } catch (err) {
    showAdminToast('Gagal masuk sebagai admin: ' + err.message, 'error');
  }
}

function handleAdminLogout() {
  ApiService.clearAuth();
  window.location.href = '/';
}

document.getElementById('adminLogoutBtn')?.addEventListener('click', handleAdminLogout);

// ============================================================
// TOP NAVBAR NAVIGATION
// ============================================================
function initNavbarNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab, .nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const titleEl = document.getElementById('pageTitle');
  const subEl = document.getElementById('pageSubtitle');

  const titles = {
    dashboard: { title: 'Dashboard Analisis Penjualan', sub: 'Ringkasan performa omzet dan inventaris toko GawaiKita' },
    products: { title: 'Manajemen Katalog Produk', sub: 'Kelola penambahan, data spesifikasi, harga, ulasan, dan stok gadget' },
    orders: { title: 'Manajemen Pesanan Masuk', sub: 'Pantau transaksi, validasi pembayaran WhatsApp, dan status pengiriman' },
    users: { title: 'Data Pengguna Terdaftar', sub: 'Daftar akun pelanggan dan penelusuran data pengguna' }
  };

  navTabs.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      navTabs.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.style.display = 'none');
      const activeSection = document.getElementById(`section-${target}`);
      if (activeSection) activeSection.style.display = 'block';

      if (titles[target] && titleEl && subEl) {
        titleEl.textContent = titles[target].title;
        subEl.textContent = titles[target].sub;
      }

      if (target === 'dashboard') loadDashboardData();
      if (target === 'products') loadProductsTable();
      if (target === 'orders') loadOrdersTable();
      if (target === 'users') loadUsersTable();
    });
  });
}

function refreshCurrentSection() {
  const activeTab = document.querySelector('.nav-tab.active');
  const target = activeTab?.dataset.section || 'dashboard';
  if (target === 'dashboard') loadDashboardData();
  if (target === 'products') loadProductsTable();
  if (target === 'orders') loadOrdersTable();
  if (target === 'users') loadUsersTable();
  showAdminToast('Data berhasil diperbarui!', 'success');
}

function initSearchInputs() {
  // Product Search
  document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    filterProductsTable(val);
  });

  // User Search
  document.getElementById('userSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadUsersTable();
  });
}

// ============================================================
// IMAGE INPUT HANDLERS (GOOGLE DRIVE LINK & LOCAL FILE UPLOAD)
// ============================================================
function convertGoogleDriveLink(url) {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    // Official public thumbnail cache (avoids cross-site tracking prevention block)
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
}

function initImageInputHandlers() {
  const urlInput = document.getElementById('formProdImageUrl');
  const fileInput = document.getElementById('formProdFileInput');
  const previewWrap = document.getElementById('formImagePreviewWrap');
  const previewImg = document.getElementById('formImagePreview');

  // 1. Google Drive / URL input
  urlInput?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const converted = convertGoogleDriveLink(val);
    if (converted !== val) {
      e.target.value = converted;
      showAdminToast('Link Google Drive berhasil dikonversi ke stream URL!', 'normal');
    }
    if (converted && previewImg) {
      previewImg.src = converted;
      if (previewWrap) previewWrap.style.display = 'block';
    } else if (previewWrap) {
      previewWrap.style.display = 'none';
    }
  });

  // 2. Local File Upload via FileReader (Base64 data URL)
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAdminToast('Harap pilih file gambar (JPG, PNG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      if (urlInput) urlInput.value = dataUrl;
      if (previewImg) previewImg.src = dataUrl;
      if (previewWrap) previewWrap.style.display = 'block';
      showAdminToast('File gambar lokal siap diunggah!', 'success');
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// SECTION 1: DASHBOARD & CHARTS
// ============================================================
async function loadDashboardData() {
  try {
    const res = await ApiService.getAdminStats();
    if (res.success) {
      const stats = res.data;
      document.getElementById('kpiRevenue').textContent = formatRupiah(stats.totalRevenue);
      document.getElementById('kpiOrders').textContent = `${stats.totalOrders} Pesanan`;
      document.getElementById('kpiProducts').textContent = `${stats.totalProducts} Item`;
      document.getElementById('kpiUsers').textContent = `${stats.totalUsers} Pengguna`;

      renderCharts(stats.statusDistribution || {}, stats.categoryDistribution || {});
    }
  } catch (err) {
    console.error('Error load admin stats:', err);
    showAdminToast('Gagal memuat analitik penjualan: ' + err.message, 'error');
  }
}

function renderCharts(orderStatuses, categories) {
  // 1. Order Status Bar Chart
  const ctxBar = document.getElementById('orderStatusBarChart');
  if (ctxBar) {
    if (barChartInstance) barChartInstance.destroy();

    const labels = ['Pending (Menunggu)', 'Paid (Terbayar)', 'Shipped (Dikirim)', 'Completed (Selesai)'];
    const dataValues = [
      orderStatuses.pending || 0,
      orderStatuses.paid || 0,
      orderStatuses.shipped || 0,
      orderStatuses.completed || 0
    ];

    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Jumlah Transaksi',
          data: dataValues,
          backgroundColor: [
            'rgba(245, 158, 11, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(2, 132, 199, 0.85)',
            'rgba(22, 101, 52, 0.85)'
          ],
          borderRadius: 6,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'Inter', size: 11 } },
            grid: { color: '#F1F5F9' }
          },
          x: {
            ticks: { font: { family: 'Inter', size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // 2. Category Pie / Doughnut Chart
  const ctxPie = document.getElementById('categoryPieChart');
  if (ctxPie) {
    if (pieChartInstance) pieChartInstance.destroy();

    const catLabels = ['Smartphone', 'Laptop', 'Wearable', 'Aksesoris'];
    const catData = [
      categories.Smartphone || 0,
      categories.Laptop || 0,
      categories.Wearable || 0,
      categories.Aksesoris || 0
    ];

    pieChartInstance = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: [
            '#1D4ED8',
            '#10B981',
            '#F59E0B',
            '#8B5CF6'
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 }
          }
        },
        cutout: '65%'
      }
    });
  }
}

// ============================================================
// SECTION 2: PRODUCT CRUD
// ============================================================
async function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;">Memuat daftar produk...</td></tr>';

  try {
    const res = await ApiService.getProducts();
    currentProducts = res.data || [];
    renderProductsTable(currentProducts);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="color:red; text-align:center;">Gagal memuat produk: ${err.message}</td></tr>`;
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;">Tidak ada produk ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(prod => {
    const reviewsCount = (prod.reviews || []).length;
    return `
      <tr>
        <td>
          <img class="table-thumbnail" src="${prod.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}" alt="${prod.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';">
        </td>
        <td><strong>${prod.name}</strong></td>
        <td><span class="badge-tag" style="background:#F1F5F9; color:var(--text-dark);">${prod.category}</span></td>
        <td>${prod.brand}</td>
        <td><strong>${formatRupiah(prod.price)}</strong></td>
        <td>${prod.stock} unit</td>
        <td><i class="fa-solid fa-star" style="color:#F59E0B;"></i> ${prod.rating || 4.5}</td>
        <td>
          <button class="btn-table-review" onclick="openReviewsAdminModal('${prod._id}')" title="Lihat & Balas Ulasan">
            <i class="fa-solid fa-comments"></i> ${reviewsCount} Ulasan
          </button>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.35rem;">
            <button class="btn-table-edit" onclick="openEditProductModal('${prod._id}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn-table-delete" onclick="handleDeleteProduct('${prod._id}')">
              <i class="fa-solid fa-trash"></i> Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProductsTable(query) {
  if (!query) {
    renderProductsTable(currentProducts);
    return;
  }
  const filtered = currentProducts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.brand.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
  renderProductsTable(filtered);
}

function openAddProductModal() {
  const titleEl = document.getElementById('formModalTitle');
  if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-box-open text-blue"></i> Tambah Produk Baru';
  document.getElementById('productForm')?.reset();
  const editIdEl = document.getElementById('editProductId');
  if (editIdEl) editIdEl.value = '';
  const previewWrap = document.getElementById('formImagePreviewWrap');
  if (previewWrap) previewWrap.style.display = 'none';
  const modalEl = document.getElementById('productFormModal');
  if (modalEl) modalEl.style.display = 'flex';
}

function openEditProductModal(id) {
  const prod = currentProducts.find(p => p._id === id);
  if (!prod) return;

  const titleEl = document.getElementById('formModalTitle');
  if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square text-blue"></i> Edit Produk: ${prod.name}`;

  const setVal = (elemId, val) => {
    const el = document.getElementById(elemId);
    if (el) el.value = val || '';
  };

  setVal('editProductId', prod._id);
  setVal('formProdName', prod.name);
  setVal('formProdBrand', prod.brand);
  setVal('formProdCategory', prod.category);
  setVal('formProdPrice', prod.price);
  setVal('formProdStock', prod.stock);
  setVal('formProdRam', prod.specs?.ram);
  setVal('formProdStorage', prod.specs?.storage);
  setVal('formProdScreen', prod.specs?.screenSize);
  setVal('formProdBattery', prod.specs?.battery);
  setVal('formProdImageUrl', prod.imageUrl);
  setVal('formProdDesc', prod.description);

  const previewWrap = document.getElementById('formImagePreviewWrap');
  const previewImg = document.getElementById('formImagePreview');
  if (previewImg && prod.imageUrl) {
    previewImg.src = prod.imageUrl;
    if (previewWrap) previewWrap.style.display = 'block';
  } else if (previewWrap) {
    previewWrap.style.display = 'none';
  }

  const modalEl = document.getElementById('productFormModal');
  if (modalEl) modalEl.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productFormModal').style.display = 'none';
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const rawImgUrl = document.getElementById('formProdImageUrl').value.trim();
  const cleanImgUrl = convertGoogleDriveLink(rawImgUrl);

  const payload = {
    name: document.getElementById('formProdName').value.trim(),
    brand: document.getElementById('formProdBrand').value.trim(),
    category: document.getElementById('formProdCategory').value,
    price: Number(document.getElementById('formProdPrice').value),
    stock: Number(document.getElementById('formProdStock').value),
    specs: {
      ram: document.getElementById('formProdRam').value.trim(),
      storage: document.getElementById('formProdStorage').value.trim(),
      screenSize: document.getElementById('formProdScreen').value.trim(),
      battery: document.getElementById('formProdBattery').value.trim()
    },
    imageUrl: cleanImgUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    description: document.getElementById('formProdDesc').value.trim()
  };

  try {
    if (id) {
      await ApiService.updateProduct(id, payload);
      showAdminToast('Produk berhasil diperbarui di database!', 'success');
    } else {
      await ApiService.addProduct(payload);
      showAdminToast('Produk baru berhasil ditambahkan ke database!', 'success');
    }
    localStorage.setItem('gawai_catalog_synced', Date.now().toString());
    closeProductModal();
    loadProductsTable();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari database MongoDB?')) return;

  try {
    await ApiService.deleteProduct(id);
    localStorage.setItem('gawai_catalog_synced', Date.now().toString());
    showAdminToast('Produk berhasil dihapus dari database.', 'normal');
    loadProductsTable();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

// ============================================================
// SECTION 3: ORDERS MANAGEMENT & VALIDASI PEMBAYARAN
// ============================================================
async function loadOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Memuat daftar transaksi...</td></tr>';

  try {
    const res = await ApiService.getOrders();
    const orders = res.data || [];

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Belum ada pesanan masuk.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(ord => {
      const itemsText = (ord.items || []).map(i => `${i.name || 'Item'} (${i.qty}x)`).join(', ');

      // Quick action for pending orders (Validasi Pembayaran)
      let validateBtn = '';
      if (ord.status === 'pending') {
        validateBtn = `
          <button class="btn-action-validate" onclick="changeOrderStatus('${ord._id}', 'paid')" title="Tandai pesanan lunas setelah verifikasi dana">
            <i class="fa-solid fa-check"></i> Validasi Bayar (Set Lunas)
          </button>
        `;
      }

      return `
        <tr>
          <td><strong>#GWK-${ord._id.slice(-6).toUpperCase()}</strong></td>
          <td><strong>${escapeHtml(ord.customerName || 'Pelanggan')}</strong></td>
          <td><small style="color:var(--text-muted);">${escapeHtml(ord.shippingAddress || 'Alamat tidak diisi')}</small></td>
          <td>${itemsText}</td>
          <td><strong>${formatRupiah(ord.totalPrice)}</strong></td>
          <td><span class="badge-tag ${ord.status}">${ord.status.toUpperCase()}</span></td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              ${validateBtn}
              <select class="form-input" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;" onchange="changeOrderStatus('${ord._id}', this.value)">
                <option value="pending" ${ord.status === 'pending' ? 'selected' : ''}>Pending (Menunggu Bayar)</option>
                <option value="paid" ${ord.status === 'paid' ? 'selected' : ''}>Paid (Terbayar/Lunas)</option>
                <option value="shipped" ${ord.status === 'shipped' ? 'selected' : ''}>Shipped (Sedang Dikirim)</option>
                <option value="completed" ${ord.status === 'completed' ? 'selected' : ''}>Completed (Selesai)</option>
              </select>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Gagal memuat pesanan: ${err.message}</td></tr>`;
  }
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    await ApiService.updateOrderStatus(orderId, newStatus);
    showAdminToast(`Status pesanan #GWK-${orderId.slice(-6).toUpperCase()} berhasil diubah menjadi "${newStatus.toUpperCase()}".`, 'success');
    loadOrdersTable();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

// ============================================================
// SECTION 4: USERS MANAGEMENT
// ============================================================
async function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const searchInput = document.getElementById('userSearchInput');
  const searchVal = searchInput ? searchInput.value.trim() : '';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Memuat data pengguna...</td></tr>';

  try {
    const res = await ApiService.getAdminUsers(searchVal);
    const users = res.data || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Tidak ada pengguna ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const regDate = new Date(u.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      return `
        <tr>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge-tag ${u.role === 'admin' ? 'paid' : 'shipped'}">${u.role.toUpperCase()}</span></td>
          <td>${escapeHtml(u.phone || '—')}</td>
          <td><small style="color:var(--text-muted);">${escapeHtml(u.address || '—')}</small></td>
          <td>${regDate}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Gagal memuat pengguna: ${err.message}</td></tr>`;
  }
}

// ============================================================
// ADMIN REVIEWS & REPLY MANAGEMENT
// ============================================================
function openReviewsAdminModal(productId) {
  currentManagingProductId = productId;
  const prod = currentProducts.find(p => p._id === productId);
  if (!prod) return;

  const titleEl = document.getElementById('adminReviewProdTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-comments text-blue"></i> Ulasan Produk: ${prod.name}`;
  }
  const container = document.getElementById('adminReviewsListContainer');
  if (!container) return;

  const reviews = prod.reviews || [];

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted); background:#F8FAFC; border-radius:var(--radius-md); border:1px dashed var(--border);">
        <i class="fa-regular fa-comment-dots" style="font-size: 2.2rem; margin-bottom: 0.5rem; display:block; color:var(--text-light);"></i>
        Belum ada ulasan dari pembeli untuk gadget ini.
      </div>
    `;
  } else {
    container.innerHTML = reviews.map(r => {
      const ratingNum = r.rating || 5;
      const filledStars = '<i class="fa-solid fa-star text-amber"></i>'.repeat(ratingNum);
      const emptyStars = '<i class="fa-regular fa-star" style="color:#CBD5E1;"></i>'.repeat(Math.max(0, 5 - ratingNum));
      const dateStr = new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

      let replyHtml = '';
      if (r.adminReply && r.adminReply.text) {
        replyHtml = `
          <div class="admin-reply-box">
            <strong style="color:var(--primary);"><i class="fa-solid fa-shield-halved"></i> Respon Resmi Toko Anda:</strong>
            <p style="margin-top: 0.25rem; color:var(--text-dark);">${escapeHtml(r.adminReply.text)}</p>
          </div>
        `;
      } else {
        replyHtml = `
          <div class="admin-reply-form" id="replyForm-${r._id}">
            <input type="text" id="replyInput-${r._id}" placeholder="Tulis balasan resmi untuk ulasan ini..." />
            <button onclick="submitReply('${prod._id}', '${r._id}')">
              <i class="fa-solid fa-reply"></i> Balas
            </button>
          </div>
        `;
      }

      return `
        <div class="admin-review-item">
          <div class="admin-review-head">
            <div>
              <span class="admin-review-user">${escapeHtml(r.userName || 'Pelanggan')}</span>
              <span style="font-size:0.75rem; color:var(--text-light);"> • ${dateStr}</span>
            </div>
            <div class="admin-review-stars">${filledStars}${emptyStars}</div>
          </div>
          <div class="admin-review-body">${escapeHtml(r.comment || 'Produk sangat memuaskan dan bergaransi resmi.')}</div>
          ${replyHtml}
        </div>
      `;
    }).join('');
  }

  const modalEl = document.getElementById('adminReviewsModal');
  if (modalEl) modalEl.style.display = 'flex';
}

function closeAdminReviewsModal() {
  document.getElementById('adminReviewsModal').style.display = 'none';
  currentManagingProductId = null;
}

async function submitReply(productId, reviewId) {
  const input = document.getElementById(`replyInput-${reviewId}`);
  const text = input ? input.value.trim() : '';
  if (!text) {
    showAdminToast('Silakan ketik teks balasan', 'error');
    return;
  }

  try {
    const res = await ApiService.replyProductReview(productId, reviewId, text);
    if (res.success) {
      showAdminToast('Balasan toko berhasil diposting!', 'success');
      // Refresh current products cache
      await loadProductsTable();
      openReviewsAdminModal(productId);
    }
  } catch (err) {
    showAdminToast(`Gagal mengirim balasan: ${err.message}`, 'error');
  }
}
