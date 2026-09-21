// Global State
const state = {
  products: [],
  selectedProduct: null,
  cart: JSON.parse(localStorage.getItem('gawai_cart') || '[]'),
  filters: {
    minPrice: '',
    maxPrice: '',
    brand: '',
    category: '',
    sort: 'terbaru',
    q: '',
    ram: ''
  },
  adminOrders: [],
  adminUsers: [],
  currentOrderTabStatus: '',
  playground: {
    endpoint: 'login',
    method: 'POST',
    path: '/login',
    payload: '{\n  "email": "admin@gawaikita.test",\n  "password": {"$ne": null}\n}'
  }
};

// Preset Payload OWASP untuk Research Playground
const PG_PRESETS = {
  login: [
    {
      name: 'Auth Bypass ($ne null)',
      type: 'attack',
      path: '/login',
      method: 'POST',
      payload: '{\n  "email": "admin@gawaikita.test",\n  "password": {"$ne": null}\n}',
      desc: 'Bypass login tanpa mengetahui password menggunakan operator $ne (not equal).'
    },
    {
      name: 'Auth Bypass ($gt empty)',
      type: 'attack',
      path: '/login',
      method: 'POST',
      payload: '{\n  "email": "admin@gawaikita.test",\n  "password": {"$gt": ""}\n}',
      desc: 'Bypass login dengan mencocokkan password bernilai string apa pun ($gt "").'
    },
    {
      name: 'Regex User Search ($regex .*)',
      type: 'attack',
      path: '/login',
      method: 'POST',
      payload: '{\n  "email": {"$regex": "admin.*"},\n  "password": {"$ne": null}\n}',
      desc: 'Pencarian pola email regex dengan password arbitrary.'
    },
    {
      name: 'Input Sah (Valid Login)',
      type: 'valid',
      path: '/login',
      method: 'POST',
      payload: '{\n  "email": "admin@gawaikita.test",\n  "password": "password123"\n}',
      desc: 'Uji False Positive: Memastikan login yang sah tetap berhasil di semua varian.'
    }
  ],
  products: [
    {
      name: 'Operator MinPrice ($gt 0)',
      type: 'attack',
      path: '/products',
      method: 'GET',
      payload: 'minPrice[$gt]=0',
      desc: 'Menyuntikkan operator $gt ke dalam parameter query minPrice.'
    },
    {
      name: 'Operator MaxPrice ($lt 20M)',
      type: 'attack',
      path: '/products',
      method: 'GET',
      payload: 'maxPrice[$lt]=20000000',
      desc: 'Operator injection pada batas atas harga.'
    },
    {
      name: 'JavaScript Injection ($where)',
      type: 'attack',
      path: '/products',
      method: 'GET',
      payload: 'brand[$where]=this.price>0',
      desc: 'Mencoba injeksi evaluasi JavaScript sisi server via $where.'
    },
    {
      name: 'Input Sah (Valid Filter)',
      type: 'valid',
      path: '/products',
      method: 'GET',
      payload: 'minPrice=2000000&maxPrice=10000000&category=Smartphone&sort=termurah',
      desc: 'Uji False Positive: Filter harga dan kategori legal.'
    }
  ],
  orders: [
    {
      name: 'Status Operator ($ne none)',
      type: 'attack',
      path: '/orders',
      method: 'GET',
      payload: 'status[$ne]=none',
      desc: 'Mengambil seluruh order dengan memaksa status != "none".'
    },
    {
      name: 'Status Operator ($exists true)',
      type: 'attack',
      path: '/orders',
      method: 'GET',
      payload: 'status[$exists]=true',
      desc: 'Injeksi operator pemeriksaan keberadaan field status.'
    },
    {
      name: 'Input Sah (Valid Status)',
      type: 'valid',
      path: '/orders',
      method: 'GET',
      payload: 'status=paid',
      desc: 'Uji False Positive: Filter status pesanan sah (paid).'
    }
  ],
  adminUsers: [
    {
      name: 'Data Exposure ($regex .*)',
      type: 'attack',
      path: '/admin/users',
      method: 'GET',
      payload: 'search[$regex]=.*',
      desc: 'Membocorkan seluruh data user dengan injeksi regex wildcard.'
    },
    {
      name: 'Operator Injection ($ne null)',
      type: 'attack',
      path: '/admin/users',
      method: 'GET',
      payload: 'search[$ne]=null',
      desc: 'Mengekstrak list user dengan operator $ne.'
    },
    {
      name: 'Input Sah (Valid Search)',
      type: 'valid',
      path: '/admin/users',
      method: 'GET',
      payload: 'search=Angga',
      desc: 'Uji False Positive: Pencarian nama sah.'
    }
  ]
};

// ============================================================
// FORMATTER UTILITIES
// ============================================================
function formatRupiah(number) {
  if (number === undefined || number === null) return 'Rp 0';
  return 'Rp ' + Number(number).toLocaleString('id-ID');
}

function showToast(message, type = 'normal') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initVariantBar();
  initAuthUI();
  initCartUI();
  initEventListeners();
  loadProducts();
  initPlayground();
});

// Sync Active Variant
function initVariantBar() {
  const current = ApiService.getVariant();
  document.querySelectorAll('.variant-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.variant === current);
  });

  document.querySelectorAll('input[name="pgVariant"]').forEach(radio => {
    radio.checked = (radio.value === current);
  });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function initEventListeners() {
  // Variant selection from top bar
  document.querySelectorAll('.variant-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.variant;
      ApiService.setVariant(v);
      initVariantBar();
      showToast(`Varian API beralih ke ${v.toUpperCase()}`, 'normal');
      loadProducts();
    });
  });

  // Radio selection inside playground
  document.querySelectorAll('input[name="pgVariant"]').forEach(radio => {
    radio.addEventListener('change', () => {
      ApiService.setVariant(radio.value);
      initVariantBar();
      loadProducts();
    });
  });

  // Open & Close Playground Drawer
  document.getElementById('openPlaygroundBtn')?.addEventListener('click', openPlayground);
  document.getElementById('closePlaygroundBtn')?.addEventListener('click', closePlayground);
  document.getElementById('playgroundOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'playgroundOverlay') closePlayground();
  });

  // Cart Drawer
  document.getElementById('cartToggleBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartDrawerOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cartDrawerOverlay') closeCartDrawer();
  });
  document.getElementById('checkoutConfirmBtn')?.addEventListener('click', handleCheckout);

  // Category Chips Bar
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.category = chip.dataset.category || '';
      loadProducts();
    });
  });

  // Brand Checkboxes
  document.querySelectorAll('input[name="brandFilter"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const checkedBrands = Array.from(document.querySelectorAll('input[name="brandFilter"]:checked'))
        .map(el => el.value);
      state.filters.brand = checkedBrands.join(',');
      loadProducts();
    });
  });

  // Spec RAM Pills
  document.querySelectorAll('.spec-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.classList.contains('active')) {
        pill.classList.remove('active');
        state.filters.ram = '';
      } else {
        document.querySelectorAll('.spec-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.filters.ram = pill.dataset.specRam;
      }
      renderProductsGrid();
    });
  });

  // Price Inputs
  const minPriceInput = document.getElementById('filterMinPrice');
  const maxPriceInput = document.getElementById('filterMaxPrice');
  const debouncedPriceFilter = debounce(() => {
    state.filters.minPrice = minPriceInput.value.trim();
    state.filters.maxPrice = maxPriceInput.value.trim();
    loadProducts();
  }, 400);

  minPriceInput?.addEventListener('input', debouncedPriceFilter);
  maxPriceInput?.addEventListener('input', debouncedPriceFilter);

  // Sort select
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    loadProducts();
  });

  // Reset Filters button
  document.getElementById('resetFilterBtn')?.addEventListener('click', resetFilters);
  document.getElementById('applyFilterBtn')?.addEventListener('click', () => {
    showToast('Filter diterapkan', 'normal');
  });

  // Search forms
  const navSearchInput = document.getElementById('navSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');

  navSearchInput?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    searchClearBtn.style.display = val ? 'block' : 'none';
  });

  document.getElementById('navSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.filters.q = navSearchInput.value.trim();
    loadProducts();
  });

  searchClearBtn?.addEventListener('click', () => {
    navSearchInput.value = '';
    searchClearBtn.style.display = 'none';
    state.filters.q = '';
    loadProducts();
  });

  // Hero Search
  const heroSearchInput = document.getElementById('heroSearchInput');
  document.getElementById('heroSearchBtn')?.addEventListener('click', () => {
    if (heroSearchInput) {
      state.filters.q = heroSearchInput.value.trim();
      navSearchInput.value = state.filters.q;
      searchClearBtn.style.display = state.filters.q ? 'block' : 'none';
      loadProducts();
      document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Auth Modal Triggers
  document.getElementById('authBtn')?.addEventListener('click', toggleAuthAction);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Orders Button
  document.getElementById('orderHistoryBtn')?.addEventListener('click', openOrdersModal);
  document.getElementById('menuOrdersBtn')?.addEventListener('click', () => {
    closeUserMenu();
    openOrdersModal();
  });

  // Admin Buttons
  document.getElementById('adminPanelBtn')?.addEventListener('click', openAdminModal);
  document.getElementById('menuAdminBtn')?.addEventListener('click', () => {
    closeUserMenu();
    openAdminModal();
  });

  // Order Status Tabs
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentOrderTabStatus = tab.dataset.status;
      loadOrders(state.currentOrderTabStatus);
    });
  });

  // Modal Quantity Stepper
  const qtyInput = document.getElementById('modalQtyInput');
  document.getElementById('modalQtyMinus')?.addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });
  document.getElementById('modalQtyPlus')?.addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    qtyInput.value = val + 1;
  });

  // Modal Cart Buttons
  document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
    if (state.selectedProduct) {
      const qty = parseInt(qtyInput.value) || 1;
      addToCart(state.selectedProduct, qty);
      closeProductModal();
    }
  });

  document.getElementById('modalBuyNowBtn')?.addEventListener('click', () => {
    if (state.selectedProduct) {
      const qty = parseInt(qtyInput.value) || 1;
      addToCart(state.selectedProduct, qty);
      closeProductModal();
      openCartDrawer();
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ============================================================
// PRODUCT FETCH & RENDER
// ============================================================
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const countText = document.getElementById('resultsCountText');

  try {
    const res = await ApiService.getProducts(state.filters);
    state.products = res.data || [];
    renderProductsGrid();
  } catch (err) {
    console.error('Error load products:', err);
    if (grid) grid.innerHTML = `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat produk dari varian ${ApiService.getVariant().toUpperCase()}: ${err.message}</div>`;
  }
}

function renderProductsGrid() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const countText = document.getElementById('resultsCountText');

  let filtered = [...state.products];

  // Client-side RAM filter if selected
  if (state.filters.ram) {
    filtered = filtered.filter(p => p.specs && p.specs.ram && p.specs.ram.includes(state.filters.ram));
  }

  if (countText) {
    countText.textContent = `Menampilkan ${filtered.length} gadget pilihan`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(prod => {
    const specsPills = [];
    if (prod.specs?.ram) specsPills.push(`<span class="card-spec-pill"><i class="fa-solid fa-memory"></i> ${prod.specs.ram}</span>`);
    if (prod.specs?.storage) specsPills.push(`<span class="card-spec-pill"><i class="fa-solid fa-hard-drive"></i> ${prod.specs.storage}</span>`);
    if (prod.specs?.battery) specsPills.push(`<span class="card-spec-pill"><i class="fa-solid fa-battery-full"></i> ${prod.specs.battery}</span>`);

    return `
      <article class="product-card" data-id="${prod._id}">
        <div class="product-card-img-wrap" onclick="openProductModalById('${prod._id}')">
          <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}" alt="${prod.name}" loading="lazy">
          <span class="badge-category">${prod.category}</span>
          <span class="badge-stock-pill ${prod.stock > 0 ? 'in-stock' : 'out-of-stock'}">
            ${prod.stock > 0 ? `${prod.stock} Tersedia` : 'Habis'}
          </span>
        </div>
        <div class="product-card-body">
          <div class="product-meta-row">
            <span class="product-brand">${prod.brand}</span>
            <div class="product-rating"><i class="fa-solid fa-star"></i> ${prod.rating || 4.5}</div>
          </div>
          <h3 class="product-title" onclick="openProductModalById('${prod._id}')">${prod.name}</h3>
          
          <div class="product-specs-pills">
            ${specsPills.join('')}
          </div>

          <div class="product-card-footer">
            <div class="product-price">${formatRupiah(prod.price)}</div>
            <button class="btn-add-cart-card" onclick="quickAddToCart('${prod._id}', event)">
              <i class="fa-solid fa-plus"></i> Keranjang
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function quickAddToCart(prodId, event) {
  event?.stopPropagation();
  const prod = state.products.find(p => p._id === prodId);
  if (prod) {
    addToCart(prod, 1);
  }
}

function quickViewProductByName(name) {
  const prod = state.products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  if (prod) {
    openProductModal(prod);
  } else {
    // Scroll to catalog and search
    state.filters.q = name;
    loadProducts();
    document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function setPriceRange(min, max) {
  const minInput = document.getElementById('filterMinPrice');
  const maxInput = document.getElementById('filterMaxPrice');
  if (minInput && maxInput) {
    minInput.value = min || '';
    maxInput.value = max || '';
    state.filters.minPrice = min ? String(min) : '';
    state.filters.maxPrice = max ? String(max) : '';
    loadProducts();
  }
}

function filterByCategory(cat) {
  document.querySelectorAll('.cat-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.category === cat);
  });
  state.filters.category = cat;
  loadProducts();
}

function resetFilters() {
  state.filters = {
    minPrice: '',
    maxPrice: '',
    brand: '',
    category: '',
    sort: 'terbaru',
    q: '',
    ram: ''
  };

  document.getElementById('filterMinPrice').value = '';
  document.getElementById('filterMaxPrice').value = '';
  document.getElementById('navSearchInput').value = '';
  document.getElementById('searchClearBtn').style.display = 'none';
  document.getElementById('sortSelect').value = 'terbaru';

  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.cat-chip[data-category=""]')?.classList.add('active');

  document.querySelectorAll('input[name="brandFilter"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.spec-pill').forEach(sp => sp.classList.remove('active'));

  loadProducts();
  showToast('Semua filter direset', 'normal');
}

// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================
function openProductModalById(id) {
  const prod = state.products.find(p => p._id === id);
  if (prod) openProductModal(prod);
}

function openProductModal(prod) {
  state.selectedProduct = prod;

  document.getElementById('modalProductImg').src = prod.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';
  document.getElementById('modalProductCategory').textContent = prod.category;
  document.getElementById('modalProductBrand').textContent = prod.brand;
  document.getElementById('modalProductRating').innerHTML = `<i class="fa-solid fa-star"></i> ${prod.rating || 4.5}`;
  document.getElementById('modalProductName').textContent = prod.name;
  document.getElementById('modalProductPrice').textContent = formatRupiah(prod.price);
  document.getElementById('modalProductStock').innerHTML = prod.stock > 0
    ? `<i class="fa-solid fa-circle-check"></i> Stok Tersedia (${prod.stock} unit)`
    : `<i class="fa-solid fa-circle-xmark" style="color: var(--red);"></i> Stok Habis`;
  document.getElementById('modalProductDesc').textContent = prod.description || 'Tidak ada deskripsi rinci.';
  document.getElementById('modalQtyInput').value = 1;

  // Specs Table
  const specs = prod.specs || {};
  const specsTable = document.getElementById('modalSpecsTable');
  specsTable.innerHTML = `
    <div class="spec-item"><span class="spec-name">RAM</span><span class="spec-value">${specs.ram || '—'}</span></div>
    <div class="spec-item"><span class="spec-name">Penyimpanan</span><span class="spec-value">${specs.storage || '—'}</span></div>
    <div class="spec-item"><span class="spec-name">Ukuran Layar</span><span class="spec-value">${specs.screenSize || '—'}</span></div>
    <div class="spec-item"><span class="spec-name">Kapasitas Baterai</span><span class="spec-value">${specs.battery || '—'}</span></div>
    <div class="spec-item"><span class="spec-name">Kondisi</span><span class="spec-value">Baru (100% Original)</span></div>
    <div class="spec-item"><span class="spec-name">Garansi</span><span class="spec-value">1 Tahun Resmi</span></div>
  `;

  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  state.selectedProduct = null;
}

// ============================================================
// CART MANAGEMENT & CHECKOUT SIMULATION
// ============================================================
function initCartUI() {
  updateCartBadge();
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cartCount');
  const drawerCount = document.getElementById('cartDrawerCount');
  if (badge) badge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;
}

function saveCart() {
  localStorage.setItem('gawai_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCartItems();
}

function addToCart(prod, qty = 1) {
  const existing = state.cart.find(item => item.product._id === prod._id);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({ product: prod, qty });
  }
  saveCart();
  showToast(`"${prod.name}" ditambahkan ke keranjang`, 'success');
}

function openCartDrawer() {
  renderCartItems();
  document.getElementById('cartDrawerOverlay').style.display = 'flex';
}

function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay').style.display = 'none';
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');

  if (state.cart.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    footer.style.opacity = '0.5';
    footer.style.pointerEvents = 'none';
    if (subtotalEl) subtotalEl.textContent = 'Rp 0';
    if (totalEl) totalEl.textContent = 'Rp 0';
    return;
  }

  empty.style.display = 'none';
  footer.style.opacity = '1';
  footer.style.pointerEvents = 'auto';

  let subtotal = 0;

  list.innerHTML = state.cart.map((item, index) => {
    const itemTotal = item.product.price * item.qty;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.product.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}" alt="${item.product.name}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.product.name}</div>
          <div class="cart-item-price">${formatRupiah(item.product.price)}</div>
          <div class="cart-item-stepper">
            <button class="cart-stepper-btn" onclick="updateCartQty(${index}, -1)">-</button>
            <span class="cart-item-qty">${item.qty}</span>
            <button class="cart-stepper-btn" onclick="updateCartQty(${index}, 1)">+</button>
            <button class="cart-item-remove" onclick="removeCartItem(${index})" title="Hapus item">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
  if (totalEl) totalEl.textContent = formatRupiah(subtotal);
}

function updateCartQty(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  showToast('Item dihapus dari keranjang', 'normal');
}

// SIMULASI CHECKOUT -> SIMPAN PESANAN KE MONGODB
async function handleCheckout() {
  if (state.cart.length === 0) return;

  const user = ApiService.getUser();
  if (!user) {
    showToast('Silakan login terlebih dahulu untuk checkout pesanan', 'error');
    openAuthModal('login');
    return;
  }

  const address = document.getElementById('checkoutAddress')?.value.trim() || 'Jl. Surya Kencana No. 45, Bandung';
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const orderPayload = {
    userId: user.id || user._id,
    customerName: user.name || 'Pelanggan GawaiKita',
    shippingAddress: address,
    items: state.cart.map(item => ({
      productId: item.product._id,
      name: item.product.name,
      qty: item.qty,
      priceAtPurchase: item.product.price
    })),
    totalPrice
  };

  try {
    const res = await ApiService.createOrder(orderPayload);
    if (res.success) {
      state.cart = [];
      saveCart();
      closeCartDrawer();
      showToast('🎉 Pesanan Berhasil! Status: PAID (Tersimpan di MongoDB)', 'success');
      // Buka riwayat pesanan untuk melihat order baru
      setTimeout(() => openOrdersModal(), 600);
    }
  } catch (err) {
    console.error('Checkout error:', err);
    showToast(`Gagal checkout: ${err.message}`, 'error');
  }
}

// ============================================================
// AUTH MODAL & USER MANAGEMENT
// ============================================================
function initAuthUI() {
  const user = ApiService.getUser();
  const authBtnText = document.getElementById('authBtnText');
  const orderHistoryBtn = document.getElementById('orderHistoryBtn');
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserRole = document.getElementById('menuUserRole');
  const menuAdminBtn = document.getElementById('menuAdminBtn');

  if (user) {
    if (authBtnText) authBtnText.textContent = user.name.split(' ')[0];
    if (orderHistoryBtn) orderHistoryBtn.style.display = 'flex';
    if (menuUserName) menuUserName.textContent = user.name;
    if (menuUserRole) menuUserRole.textContent = user.role.toUpperCase();

    if (user.role === 'admin') {
      if (adminPanelBtn) adminPanelBtn.style.display = 'flex';
      if (menuAdminBtn) menuAdminBtn.style.display = 'flex';
    } else {
      if (adminPanelBtn) adminPanelBtn.style.display = 'none';
      if (menuAdminBtn) menuAdminBtn.style.display = 'none';
    }
  } else {
    if (authBtnText) authBtnText.textContent = 'Masuk';
    if (orderHistoryBtn) orderHistoryBtn.style.display = 'none';
    if (adminPanelBtn) adminPanelBtn.style.display = 'none';
  }
}

function toggleAuthAction() {
  const user = ApiService.getUser();
  if (user) {
    // Toggle popover
    const popover = document.getElementById('userMenuPopover');
    if (popover) {
      popover.style.display = popover.style.display === 'block' ? 'none' : 'block';
    }
  } else {
    openAuthModal('login');
  }
}

function closeUserMenu() {
  const popover = document.getElementById('userMenuPopover');
  if (popover) popover.style.display = 'none';
}

// Close user menu on outside click
document.addEventListener('click', (e) => {
  const authWrap = document.querySelector('.auth-dropdown-wrapper');
  if (authWrap && !authWrap.contains(e.target)) {
    closeUserMenu();
  }
});

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('authModal').style.display = 'flex';
  const statusMsg = document.getElementById('authStatusMsg');
  if (statusMsg) statusMsg.style.display = 'none';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabReg = document.getElementById('tabRegisterBtn');
  const formLogin = document.getElementById('loginForm');
  const formReg = document.getElementById('registerForm');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.style.display = 'flex';
    formReg.style.display = 'none';
  } else {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.style.display = 'flex';
    formLogin.style.display = 'none';
  }
}

function quickFillLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  showToast(`Auto-fill: ${email}`, 'normal');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const statusMsg = document.getElementById('authStatusMsg');

  statusMsg.style.display = 'none';

  try {
    const res = await ApiService.login({ email, password });
    if (res.ok && res.data.success) {
      ApiService.setAuth(res.data.token, res.data.user);
      initAuthUI();
      closeAuthModal();
      showToast(`Selamat datang kembali, ${res.data.user.name}!`, 'success');
    } else {
      statusMsg.className = 'auth-status-msg error';
      statusMsg.textContent = res.data.message || 'Login gagal';
      statusMsg.style.display = 'block';
    }
  } catch (err) {
    statusMsg.className = 'auth-status-msg error';
    statusMsg.textContent = err.message;
    statusMsg.style.display = 'block';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value.trim();
  const statusMsg = document.getElementById('authStatusMsg');

  try {
    const res = await ApiService.register({ name, email, password, phone, role: 'customer' });
    if (res.success) {
      ApiService.setAuth(res.token, res.user);
      initAuthUI();
      closeAuthModal();
      showToast(`Registrasi berhasil. Selamat datang, ${res.user.name}!`, 'success');
    }
  } catch (err) {
    statusMsg.className = 'auth-status-msg error';
    statusMsg.textContent = err.message;
    statusMsg.style.display = 'block';
  }
}

function handleLogout() {
  ApiService.clearAuth();
  closeUserMenu();
  initAuthUI();
  showToast('Anda telah keluar', 'normal');
}

// ============================================================
// ORDERS MODAL (CUSTOMER RIWAYAT PESANAN)
// ============================================================
async function openOrdersModal() {
  document.getElementById('ordersModal').style.display = 'flex';
  await loadOrders(state.currentOrderTabStatus);
}

function closeOrdersModal() {
  document.getElementById('ordersModal').style.display = 'none';
}

async function loadOrders(statusFilter = '') {
  const container = document.getElementById('ordersListContainer');
  const user = ApiService.getUser();

  container.innerHTML = '<div class="skeleton-card" style="height: 120px;"></div>';

  try {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (user && user.role !== 'admin') params.userId = user.id || user._id;

    const res = await ApiService.getOrders(params);
    const orders = res.data || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem;">
          <i class="fa-solid fa-receipt empty-icon" style="font-size: 2.2rem;"></i>
          <h4>Belum Ada Riwayat Pesanan</h4>
          <p>Pesanan dengan status "${statusFilter || 'semua'}" tidak ditemukan.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(ord => {
      const dateStr = new Date(ord.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const itemsHtml = (ord.items || []).map(item => `
        <div class="order-item-row">
          <span>${item.name || item.productId?.name || 'Item Gadget'} × ${item.qty}</span>
          <span style="font-weight: 600;">${formatRupiah(item.priceAtPurchase * item.qty)}</span>
        </div>
      `).join('');

      return `
        <div class="order-history-card">
          <div class="order-card-header">
            <div>
              <span class="order-id">#${ord._id.slice(-6).toUpperCase()}</span>
              <span class="order-date"> • ${dateStr}</span>
            </div>
            <span class="order-status-badge ${ord.status}">${ord.status}</span>
          </div>
          <div class="order-items-preview">
            ${itemsHtml}
          </div>
          <div class="order-card-footer">
            <span>Total Pembayaran:</span>
            <span style="color: var(--navy); font-family: var(--font-heading); font-size: 1.1rem;">
              ${formatRupiah(ord.totalPrice)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Gagal memuat riwayat pesanan: ${err.message}</div>`;
  }
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function openAdminModal() {
  document.getElementById('adminModal').style.display = 'flex';
  await loadAdminStats();
  await loadAdminProducts();
}

function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

  if (tab === 'products') {
    document.getElementById('adminTabProductsBtn').classList.add('active');
    document.getElementById('adminContentProducts').style.display = 'block';
    loadAdminProducts();
  } else if (tab === 'orders') {
    document.getElementById('adminTabOrdersBtn').classList.add('active');
    document.getElementById('adminContentOrders').style.display = 'block';
    loadAdminOrders();
  } else if (tab === 'users') {
    document.getElementById('adminTabUsersBtn').classList.add('active');
    document.getElementById('adminContentUsers').style.display = 'block';
    loadAdminUsers();
  }
}

async function loadAdminStats() {
  try {
    const res = await ApiService.getAdminStats();
    if (res.success) {
      document.getElementById('adminStatProducts').textContent = res.data.totalProducts;
      document.getElementById('adminStatOrders').textContent = res.data.totalOrders;
      document.getElementById('adminStatUsers').textContent = res.data.totalUsers;
      document.getElementById('adminStatRevenue').textContent = formatRupiah(res.data.totalRevenue);
    }
  } catch (err) {
    console.error('Failed load stats:', err);
  }
}

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  tbody.innerHTML = '<tr><td colspan="6">Memuat produk...</td></tr>';

  try {
    const res = await ApiService.getProducts();
    const products = res.data || [];
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${p.brand}</td>
        <td>${formatRupiah(p.price)}</td>
        <td>${p.stock}</td>
        <td>
          <button class="btn-demo-pill" style="display:inline-flex; width:auto; padding:0.2rem 0.6rem;" onclick="openEditProduct('${p._id}')">Edit</button>
          <button class="btn-demo-pill" style="display:inline-flex; width:auto; padding:0.2rem 0.6rem; color:var(--red);" onclick="handleDeleteProduct('${p._id}')">Hapus</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-red">Gagal: ${err.message}</td></tr>`;
  }
}

function openAddProductForm() {
  document.getElementById('adminProductFormBox').style.display = 'block';
  document.getElementById('productFormTitle').textContent = 'Tambah Produk Baru';
  document.getElementById('adminProductForm').reset();
  document.getElementById('prodEditId').value = '';
}

function openEditProduct(id) {
  const p = state.products.find(item => item._id === id);
  if (!p) return;

  document.getElementById('adminProductFormBox').style.display = 'block';
  document.getElementById('productFormTitle').textContent = `Edit Produk: ${p.name}`;
  document.getElementById('prodEditId').value = p._id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodBrand').value = p.brand;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodRam').value = p.specs?.ram || '';
  document.getElementById('prodStorage').value = p.specs?.storage || '';
  document.getElementById('prodScreen').value = p.specs?.screenSize || '';
  document.getElementById('prodBattery').value = p.specs?.battery || '';
  document.getElementById('prodImageUrl').value = p.imageUrl || '';
  document.getElementById('prodDescription').value = p.description || '';
}

function closeProductForm() {
  document.getElementById('adminProductFormBox').style.display = 'none';
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodEditId').value;
  const payload = {
    name: document.getElementById('prodName').value,
    brand: document.getElementById('prodBrand').value,
    category: document.getElementById('prodCategory').value,
    price: Number(document.getElementById('prodPrice').value),
    stock: Number(document.getElementById('prodStock').value),
    specs: {
      ram: document.getElementById('prodRam').value,
      storage: document.getElementById('prodStorage').value,
      screenSize: document.getElementById('prodScreen').value,
      battery: document.getElementById('prodBattery').value
    },
    imageUrl: document.getElementById('prodImageUrl').value,
    description: document.getElementById('prodDescription').value
  };

  try {
    if (id) {
      await ApiService.updateProduct(id, payload);
      showToast('Produk berhasil diperbarui', 'success');
    } else {
      await ApiService.addProduct(payload);
      showToast('Produk baru berhasil ditambahkan', 'success');
    }
    closeProductForm();
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;
  try {
    await ApiService.deleteProduct(id);
    showToast('Produk dihapus', 'normal');
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  tbody.innerHTML = '<tr><td colspan="5">Memuat pesanan...</td></tr>';

  try {
    const res = await ApiService.getOrders();
    const orders = res.data || [];
    tbody.innerHTML = orders.map(ord => {
      const itemsText = (ord.items || []).map(i => `${i.name || 'Gadget'} (×${i.qty})`).join(', ');
      return `
        <tr>
          <td><strong>#${ord._id.slice(-6).toUpperCase()}</strong></td>
          <td>${ord.customerName || 'Pelanggan'}<br><small style="color:var(--text-muted);">${ord.shippingAddress}</small></td>
          <td>${itemsText}<br><strong>${formatRupiah(ord.totalPrice)}</strong></td>
          <td><span class="order-status-badge ${ord.status}">${ord.status}</span></td>
          <td>
            <select class="form-input" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onchange="handleAdminUpdateOrderStatus('${ord._id}', this.value)">
              <option value="pending" ${ord.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="paid" ${ord.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="shipped" ${ord.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="completed" ${ord.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-red">Gagal: ${err.message}</td></tr>`;
  }
}

async function handleAdminUpdateOrderStatus(id, status) {
  try {
    await ApiService.updateOrderStatus(id, status);
    showToast(`Status pesanan diubah ke "${status}"`, 'success');
    loadAdminOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ADMIN USER SEARCH (Titik Uji NoSQL Admin!)
async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  const searchInput = document.getElementById('adminUserSearchInput');
  const search = searchInput ? searchInput.value.trim() : '';

  tbody.innerHTML = '<tr><td colspan="6">Mencari data pengguna...</td></tr>';

  try {
    const res = await ApiService.getAdminUsers(search);
    const users = res.data || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">Tidak ada data pengguna ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge-stock-pill in-stock">${u.role}</span></td>
        <td>${u.phone || '—'}</td>
        <td>${u.address || '—'}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);">Gagal: ${err.message}</td></tr>`;
  }
}

// ============================================================
// NoSQL INJECTION RESEARCH PLAYGROUND
// ============================================================
function initPlayground() {
  handlePgEndpointChange();
}

function openPlayground() {
  initVariantBar();
  document.getElementById('playgroundOverlay').style.display = 'flex';
}

function closePlayground() {
  document.getElementById('playgroundOverlay').style.display = 'none';
}

function handlePgEndpointChange() {
  const ep = document.getElementById('pgEndpointSelect').value;
  state.playground.endpoint = ep;

  const presetsContainer = document.getElementById('pgPresetsContainer');
  const editorLabel = document.getElementById('pgEditorLabel');
  const editorNote = document.getElementById('pgEditorNote');

  const presets = PG_PRESETS[ep] || [];

  if (ep === 'login') {
    state.playground.method = 'POST';
    state.playground.path = '/login';
    editorLabel.textContent = 'Payload Body (JSON):';
    editorNote.textContent = 'Dikirim via POST body. Coba operator NoSQL seperti $ne, $gt, atau $regex.';
  } else if (ep === 'products') {
    state.playground.method = 'GET';
    state.playground.path = '/products';
    editorLabel.textContent = 'Query String (URL Parameters):';
    editorNote.textContent = 'Dikirim via GET query params. Coba minPrice[$gt]=0 atau brand[$where]=this.price>0.';
  } else if (ep === 'orders') {
    state.playground.method = 'GET';
    state.playground.path = '/orders';
    editorLabel.textContent = 'Query String (URL Parameters):';
    editorNote.textContent = 'Dikirim via GET query params. Coba status[$ne]=none.';
  } else if (ep === 'adminUsers') {
    state.playground.method = 'GET';
    state.playground.path = '/admin/users';
    editorLabel.textContent = 'Query String (URL Parameters):';
    editorNote.textContent = 'Dikirim via GET query params. Coba search[$regex]=.* untuk mengekspos semua data.';
  }

  // Populate Presets
  presetsContainer.innerHTML = presets.map((preset, idx) => `
    <button type="button" class="btn-preset-pill" onclick="applyPgPreset('${ep}', ${idx})">
      <div>
        <strong>${preset.name}</strong>
        <div style="font-size:0.7rem; color:var(--text-muted);">${preset.desc}</div>
      </div>
      <span class="preset-tag ${preset.type}">${preset.type === 'attack' ? 'Serangan' : 'Sah'}</span>
    </button>
  `).join('');

  // Apply the first preset
  if (presets.length > 0) {
    applyPgPreset(ep, 0);
  }
}

function applyPgPreset(ep, index) {
  const preset = PG_PRESETS[ep]?.[index];
  if (!preset) return;

  state.playground.method = preset.method;
  state.playground.path = preset.path;
  state.playground.payload = preset.payload;

  document.getElementById('pgPayloadEditor').value = preset.payload;
}

function resetPgEditor() {
  handlePgEndpointChange();
}

async function executePgAttack() {
  const variant = document.querySelector('input[name="pgVariant"]:checked')?.value || 'v0';
  const rawPayload = document.getElementById('pgPayloadEditor').value.trim();
  const executeBtn = document.getElementById('pgExecuteAttackBtn');
  const resultCard = document.getElementById('pgResultCard');

  executeBtn.disabled = true;
  executeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menjalankan Pengujian...';

  try {
    const res = await ApiService.executeCustomAttack(
      variant,
      state.playground.path,
      state.playground.method,
      rawPayload
    );

    renderPgResult(variant, res, rawPayload);
    resultCard.style.display = 'flex';
  } catch (err) {
    console.error('Execute attack error:', err);
    showToast(err.message, 'error');
  } finally {
    executeBtn.disabled = false;
    executeBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Kirim Payload Uji Sekarang';
  }
}

function renderPgResult(variant, res, sentPayload) {
  const statusEl = document.getElementById('pgStatusCode');
  const timeEl = document.getElementById('pgResponseTime');
  const bannerEl = document.getElementById('pgVerdictBanner');
  const iconEl = document.getElementById('pgVerdictIcon');
  const titleEl = document.getElementById('pgVerdictTitle');
  const expEl = document.getElementById('pgVerdictExplanation');
  const viewerEl = document.getElementById('pgResponseViewer');

  // Status & Time Badges
  statusEl.textContent = `${res.status} ${res.statusText || ''}`;
  statusEl.className = 'pg-status-badge';
  if (res.status === 200) statusEl.classList.add('s200');
  else if (res.status === 400) statusEl.classList.add('s400');
  else if (res.status === 401) statusEl.classList.add('s401');
  else statusEl.classList.add('s500');

  timeEl.textContent = `${res.duration} ms`;

  // Raw Viewer
  viewerEl.textContent = JSON.stringify(res.data, null, 2);

  // Evaluasi Verdict
  const isAttackPayload = sentPayload.includes('$') || sentPayload.includes('where');
  const endpoint = state.playground.endpoint;

  if (res.status === 200) {
    if (isAttackPayload) {
      // Serangan tembus! (Contoh: bypass login atau ekspos semua data)
      bannerEl.className = 'pg-verdict-banner bypassed';
      iconEl.className = 'fa-solid fa-triangle-exclamation verdict-icon';
      titleEl.textContent = `🚨 SERANGAN BERHASIL DITEMBUSKAN (${variant.toUpperCase()})`;

      if (endpoint === 'login' && res.data.token) {
        expEl.textContent = `CRITICAL: Authentication Bypass sukses! Query User.findOne menerima operator tanpa validasi dan menghasilkan token akses sah untuk ${res.data.user?.name}.`;
      } else if (endpoint === 'adminUsers' && res.data.count > 1) {
        expEl.textContent = `DATA EXPOSURE: Operator $regex atau $ne berhasil mengekspos seluruh data ${res.data.count} pengguna tanpa otentikasi ketat.`;
      } else {
        expEl.textContent = `Payload operator MongoDB diterima dan dieksekusi oleh database MongoDB pada varian ${variant.toUpperCase()}.`;
      }
    } else {
      // Input sah berhasil
      bannerEl.className = 'pg-verdict-banner valid';
      iconEl.className = 'fa-solid fa-circle-check verdict-icon';
      titleEl.textContent = `✅ INPUT SAH DITERIMA (200 OK)`;
      expEl.textContent = `Uji False Positive Lolos: Input yang valid berhasil diproses dengan benar oleh varian ${variant.toUpperCase()} tanpa penolakan keliru.`;
    }
  } else if (res.status === 400) {
    // Ditolak oleh validasi Joi
    bannerEl.className = 'pg-verdict-banner blocked';
    iconEl.className = 'fa-solid fa-shield-halved verdict-icon';
    titleEl.textContent = `🛡️ DITOLAK OLEH VALIDASI SKEMA JOI (400 Bad Request)`;
    expEl.textContent = `Skema Joi pada varian ${variant.toUpperCase()} mendeteksi objek operator/tipe tidak sah dan langsung menghentikan request sebelum query menyentuh database MongoDB.`;
  } else if (res.status === 401) {
    if (variant === 'v1' || variant === 'v3') {
      bannerEl.className = 'pg-verdict-banner blocked';
      iconEl.className = 'fa-solid fa-shield-halved verdict-icon';
      titleEl.textContent = `🛡️ DINETRALISASI OLEH SANITASI (express-mongo-sanitize)`;
      expEl.textContent = `Middleware express-mongo-sanitize membersihkan key operator '$' menjadi '_' (misal: '_ne'), sehingga MongoDB mencocokkan string harfiah dan query login gagal dengan aman (401 Unauthorized).`;
    } else {
      bannerEl.className = 'pg-verdict-banner blocked';
      iconEl.className = 'fa-solid fa-circle-xmark verdict-icon';
      titleEl.textContent = `Ditolak (401 Unauthorized)`;
      expEl.textContent = res.data.message || 'Kredensial tidak cocok.';
    }
  } else {
    bannerEl.className = 'pg-verdict-banner blocked';
    iconEl.className = 'fa-solid fa-circle-xmark verdict-icon';
    titleEl.textContent = `Status: ${res.status}`;
    expEl.textContent = res.data.message || 'Respons server diterima.';
  }
}

function copyPgResponse() {
  const viewer = document.getElementById('pgResponseViewer');
  if (viewer) {
    navigator.clipboard.writeText(viewer.textContent)
      .then(() => showToast('Response JSON disalin ke clipboard', 'success'))
      .catch(() => showToast('Gagal menyalin', 'error'));
  }
}
