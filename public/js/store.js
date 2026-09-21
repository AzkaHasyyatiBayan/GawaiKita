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
  currentOrderTabStatus: ''
};

// ============================================================
// FORMATTER & TOAST UTILITIES
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

function showToast(message, type = 'normal') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${icon}"></i>
    </div>
    <div class="toast-msg">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) scale(0.96)';
    setTimeout(() => toast.remove(), 250);
  }, 3800);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ============================================================
// INITIALIZATION
// ============================================================
function initApp() {
  initAuthUI();
  initCartUI();
  initEventListeners();
  loadDynamicBrandsFilter();
  loadProducts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function initEventListeners() {
  initStarPicker();

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

  // Brand Checkboxes (Delegated pada container dinamis)
  const brandListContainer = document.getElementById('brandCheckboxList');
  brandListContainer?.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'brandFilter') {
      const checkedBrands = Array.from(document.querySelectorAll('input[name="brandFilter"]:checked'))
        .map(el => el.value);
      state.filters.brand = checkedBrands.join(',');
      loadProducts();
    }
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

  // Orders & Profile Button
  document.getElementById('orderHistoryBtn')?.addEventListener('click', openOrdersModal);
  document.getElementById('menuOrdersBtn')?.addEventListener('click', () => {
    closeUserMenu();
    openOrdersModal();
  });
  document.getElementById('menuProfileBtn')?.addEventListener('click', () => {
    closeUserMenu();
    openProfileModal();
  });
  document.getElementById('profileModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'profileModal') closeProfileModal();
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
    if (grid) grid.innerHTML = `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat produk: ${err.message}</div>`;
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

  // Render Reviews & Official Admin Replies
  const reviews = prod.reviews || [];
  const reviewsCountEl = document.getElementById('modalReviewsCount');
  if (reviewsCountEl) reviewsCountEl.textContent = reviews.length;
  const reviewsListEl = document.getElementById('modalReviewsList');
  if (reviewsListEl) {
    if (reviews.length === 0) {
      reviewsListEl.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.84rem; padding: 1rem 0; background: var(--bg-subtle); border-radius: var(--radius-sm);">
          Belum ada ulasan untuk gadget ini. Jadilah pembeli pertama yang memberikan ulasan!
        </div>
      `;
    } else {
      reviewsListEl.innerHTML = reviews.map(r => {
        const dateStr = new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const ratingNum = r.rating || 5;
        const filledStars = '<i class="fa-solid fa-star" style="color:var(--amber);"></i>'.repeat(ratingNum);
        const emptyStars = '<i class="fa-regular fa-star" style="color:#CBD5E1;"></i>'.repeat(Math.max(0, 5 - ratingNum));
        const adminReplyHtml = r.adminReply && r.adminReply.text ? `
          <div class="admin-reply-box">
            <div class="admin-reply-header">
              <i class="fa-solid fa-shield-halved text-blue"></i> Respon Resmi Toko GawaiKita
            </div>
            <div class="admin-reply-text">${escapeHtml(r.adminReply.text)}</div>
          </div>
        ` : '';

        return `
          <div class="review-card">
            <div class="review-header">
              <div>
                <span class="review-user-name">${escapeHtml(r.userName || 'Pelanggan GawaiKita')}</span>
                <span class="badge-verified"><i class="fa-solid fa-circle-check"></i> Pembeli Terverifikasi</span>
                <span class="review-date"> • ${dateStr}</span>
              </div>
              <div class="review-stars">${filledStars}${emptyStars}</div>
            </div>
            <div class="review-comment">${escapeHtml(r.comment || 'Produk sangat memuaskan dan original.')}</div>
            ${adminReplyHtml}
          </div>
        `;
      }).join('');
    }
  }

  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  state.selectedProduct = null;
}

// ============================================================
// CART MANAGEMENT & STRICT CHECKOUT AUTH GUARD
// ============================================================
function initCartUI() {
  const user = ApiService.getUser();
  const cartBtn = document.getElementById('cartToggleBtn');

  // Admin tidak berbelanja (tidak ada keranjang untuk admin)
  if (user && user.role === 'admin') {
    if (cartBtn) cartBtn.style.display = 'none';
  } else {
    if (cartBtn) cartBtn.style.display = 'flex';
  }

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
  const user = ApiService.getUser();
  if (user && user.role === 'admin') {
    showToast('Akun Administrator tidak dapat berbelanja produk.', 'error');
    return;
  }

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
  const user = ApiService.getUser();
  const addressInput = document.getElementById('checkoutAddress');

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

  // Auto-fill address if customer logged in
  if (user && user.address && addressInput && !addressInput.value) {
    addressInput.value = user.address;
  }

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

// CHECKOUT AUTH GUARD: User HARUS login sebelum bisa membuat pesanan!
async function handleCheckout() {
  if (state.cart.length === 0) return;

  const user = ApiService.getUser();

  // AUTH GUARD: Jika belum login, hentikan dan buka modal login!
  if (!user) {
    showToast('Anda harus masuk (login) ke akun terlebih dahulu sebelum dapat melakukan pesanan.', 'error');
    openAuthModal('login');
    const statusMsg = document.getElementById('authStatusMsg');
    if (statusMsg) {
      statusMsg.className = 'auth-status-msg error';
      statusMsg.textContent = 'Silakan masuk ke akun Anda terlebih dahulu untuk menyelesaikan pesanan.';
      statusMsg.style.display = 'block';
    }
    return;
  }

  // Jika akun adalah admin, tidak boleh checkout
  if (user.role === 'admin') {
    showToast('Akun Administrator tidak dapat melakukan pemesanan pelanggan.', 'error');
    return;
  }

  const addressInput = document.getElementById('checkoutAddress');
  const address = addressInput ? addressInput.value.trim() : '';
  if (!address) {
    showToast('Silakan lengkapi alamat pengiriman Anda.', 'error');
    addressInput?.focus();
    return;
  }

  const totalPrice = state.cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const orderPayload = {
    userId: user.id || user._id,
    customerName: user.name,
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
      showToast('Pesanan berhasil dibuat. Silakan konfirmasi pembayaran via WhatsApp.', 'success');
      openWaPaymentModal(res.data);
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
  const adminDirectBtn = document.getElementById('adminDirectBtn');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserRole = document.getElementById('menuUserRole');
  const menuAdminLink = document.getElementById('menuAdminLink');
  const menuOrdersBtn = document.getElementById('menuOrdersBtn');
  const cartBtn = document.getElementById('cartToggleBtn');

  if (user) {
    if (authBtnText) authBtnText.textContent = user.name.split(' ')[0];
    if (menuUserName) menuUserName.textContent = user.name;
    if (menuUserRole) menuUserRole.textContent = user.role.toUpperCase();

    if (user.role === 'admin') {
      // Jika Admin: Sembunyikan keranjang, tampilkan tombol panel admin
      if (cartBtn) cartBtn.style.display = 'none';
      if (orderHistoryBtn) orderHistoryBtn.style.display = 'none';
      if (menuOrdersBtn) menuOrdersBtn.style.display = 'none';
      if (adminDirectBtn) adminDirectBtn.style.display = 'flex';
      if (menuAdminLink) menuAdminLink.style.display = 'flex';
    } else {
      // Jika Customer
      if (cartBtn) cartBtn.style.display = 'flex';
      if (orderHistoryBtn) orderHistoryBtn.style.display = 'flex';
      if (menuOrdersBtn) menuOrdersBtn.style.display = 'flex';
      if (adminDirectBtn) adminDirectBtn.style.display = 'none';
      if (menuAdminLink) menuAdminLink.style.display = 'none';
    }
  } else {
    if (authBtnText) authBtnText.textContent = 'Masuk';
    if (orderHistoryBtn) orderHistoryBtn.style.display = 'none';
    if (adminDirectBtn) adminDirectBtn.style.display = 'none';
    if (cartBtn) cartBtn.style.display = 'flex';
  }
}

function toggleAuthAction() {
  const user = ApiService.getUser();
  if (user) {
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
  showToast(`Akun dipilih: ${email}`, 'normal');
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

      if (res.data.user.role === 'admin') {
        showToast('Login berhasil sebagai Administrator. Mengarahkan ke Panel Admin...', 'success');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 800);
      } else {
        showToast(`Selamat datang, ${res.data.user.name}!`, 'success');
      }
    } else {
      statusMsg.className = 'auth-status-msg error';
      statusMsg.textContent = res.data.message || 'Email atau password salah';
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
      showToast(`Registrasi berhasil. Selamat berbelanja, ${res.user.name}!`, 'success');
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
  showToast('Anda telah keluar dari akun.', 'normal');
}

// ============================================================
// PROFILE MANAGEMENT (EDIT USERNAME, ADDRESS, PHONE)
// ============================================================
async function openProfileModal() {
  const user = ApiService.getUser();
  if (!user) {
    showToast('Silakan login terlebih dahulu.', 'error');
    openAuthModal('login');
    return;
  }

  // Isi data awal dari state auth lokal
  const nameInput = document.getElementById('profileNameInput');
  const phoneInput = document.getElementById('profilePhoneInput');
  const addressInput = document.getElementById('profileAddressInput');
  const emailInput = document.getElementById('profileEmailInput');
  const headerName = document.getElementById('profileHeaderName');
  const headerRole = document.getElementById('profileHeaderRole');
  const avatarInit = document.getElementById('profileAvatarInitial');

  if (nameInput) nameInput.value = user.name || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (addressInput) addressInput.value = user.address || '';
  if (emailInput) emailInput.value = user.email || '';
  if (headerName) headerName.textContent = user.name || 'Pelanggan';
  if (headerRole) headerRole.textContent = (user.role || 'customer').toUpperCase();
  if (avatarInit) avatarInit.textContent = (user.name ? user.name[0] : 'U').toUpperCase();

  document.getElementById('profileModal').style.display = 'flex';

  // Ambil data paling mutakhir dari database MongoDB
  try {
    const res = await ApiService.getProfile();
    if (res.success && res.data) {
      const u = res.data;
      if (nameInput) nameInput.value = u.name || '';
      if (phoneInput) phoneInput.value = u.phone || '';
      if (addressInput) addressInput.value = u.address || '';
      if (emailInput) emailInput.value = u.email || '';
      if (headerName) headerName.textContent = u.name || 'Pelanggan';
      if (avatarInit) avatarInit.textContent = (u.name ? u.name[0] : 'U').toUpperCase();
    }
  } catch (err) {
    console.warn('Gagal memuat detail profil:', err);
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.style.display = 'none';
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const nameInput = document.getElementById('profileNameInput');
  const phoneInput = document.getElementById('profilePhoneInput');
  const addressInput = document.getElementById('profileAddressInput');
  const btn = document.getElementById('btnSaveProfile');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  if (!name) {
    showToast('Nama lengkap / username wajib diisi', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const res = await ApiService.updateProfile({ name, phone, address });
    if (res.success) {
      ApiService.setAuth(res.token, res.user);
      initAuthUI();
      closeProfileModal();
      showToast('Profil Anda berhasil diperbarui!', 'success');
      localStorage.setItem('gawai_profile_synced', Date.now().toString());
    }
  } catch (err) {
    showToast(`Gagal menyimpan profil: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
  }
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
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const itemsHtml = (ord.items || []).map(it => `
        <div class="order-item-row" style="display:flex; justify-content:space-between; margin-bottom:0.3rem; font-size:0.85rem;">
          <span>${it.name || 'Produk'} × ${it.qty}</span>
          <span style="font-weight:600;">${formatRupiah(it.priceAtPurchase * it.qty)}</span>
        </div>
      `).join('');

      const statusLabels = {
        pending: { text: 'Menunggu Pembayaran', badgeClass: 'pending' },
        paid: { text: 'Terbayar (Diproses)', badgeClass: 'paid' },
        shipped: { text: 'Sedang Dikirim', badgeClass: 'shipped' },
        completed: { text: 'Selesai', badgeClass: 'completed' }
      };

      const curStatus = statusLabels[ord.status] || { text: ord.status, badgeClass: ord.status };

      // Action buttons based on status
      let actionButtons = '';
      if (ord.status === 'pending') {
        const orderIdShort = ord._id.slice(-6).toUpperCase();
        const waMsg = encodeURIComponent(
          `Halo Admin GawaiKita, saya ingin konfirmasi pembayaran pesanan saya #GWK-${orderIdShort} sebesar ${formatRupiah(ord.totalPrice)}.`
        );
        actionButtons = `
          <a href="https://wa.me/6281298765432?text=${waMsg}" target="_blank" class="btn-sm" style="background:#25D366; color:#FFF; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.75rem; border-radius:var(--radius-sm); font-size:0.78rem; font-weight:700;">
            <i class="fa-brands fa-whatsapp"></i> Konfirmasi WA
          </a>
        `;
      } else if (ord.status === 'shipped') {
        actionButtons = `
          <button class="btn-sm" onclick="confirmOrderReceived('${ord._id}')" style="background:var(--navy); color:#FFF; border:none; padding:0.35rem 0.75rem; border-radius:var(--radius-sm); font-size:0.78rem; font-weight:700; cursor:pointer;">
            <i class="fa-solid fa-box-open"></i> Konfirmasi Barang Diterima
          </button>
        `;
      } else if (ord.status === 'completed') {
        const firstItem = ord.items && ord.items[0];
        if (firstItem) {
          const pId = firstItem.productId?._id || firstItem.productId;
          const pName = firstItem.name || 'Produk Gadget';
          actionButtons = `
            <button class="btn-sm" onclick="openReviewModal('${pId}', '${pName}')" style="background:var(--amber); color:var(--text-main); border:none; padding:0.35rem 0.75rem; border-radius:var(--radius-sm); font-size:0.78rem; font-weight:700; cursor:pointer;">
              <i class="fa-solid fa-star"></i> Beri Ulasan
            </button>
          `;
        }
      }

      return `
        <div class="order-history-card">
          <div class="order-card-header">
            <div>
              <span class="order-id">#GWK-${ord._id.slice(-6).toUpperCase()}</span>
              <span class="order-date"> • ${dateStr}</span>
            </div>
            <span class="order-status-badge ${curStatus.badgeClass}">${curStatus.text}</span>
          </div>
          <div class="order-items-preview">
            ${itemsHtml}
          </div>
          <div class="order-card-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:0.8rem; color:var(--text-muted);">Total: </span>
              <span style="color: var(--navy); font-family: var(--font-heading); font-size: 1.1rem; font-weight:700;">
                ${formatRupiah(ord.totalPrice)}
              </span>
            </div>
            <div>
              ${actionButtons}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Gagal memuat riwayat pesanan: ${err.message}</div>`;
  }
}

// ============================================================
// WHATSAPP PAYMENT MODAL LOGIC
// ============================================================
function openWaPaymentModal(order) {
  const orderIdShort = order._id.slice(-6).toUpperCase();
  const formattedPrice = formatRupiah(order.totalPrice);
  document.getElementById('waOrderCode').textContent = `Order #GWK-${orderIdShort}`;
  document.getElementById('waOrderTotal').textContent = formattedPrice;

  const waMessage = encodeURIComponent(
    `Halo Admin GawaiKita, saya ingin konfirmasi pembayaran pesanan baru:\n\n` +
    `• Nomor Pesanan: #GWK-${orderIdShort}\n` +
    `• Nama Pembeli: ${order.customerName}\n` +
    `• Total Tagihan: ${formattedPrice}\n` +
    `• Alamat Pengiriman: ${order.shippingAddress}\n\n` +
    `Mohon info instruksi rekening transfer/rekening pembayaran dan verifikasi pesanan saya. Terima kasih!`
  );

  const waUrl = `https://wa.me/6281298765432?text=${waMessage}`;
  const linkEl = document.getElementById('waChatLink');
  if (linkEl) linkEl.href = waUrl;

  document.getElementById('waPaymentModal').style.display = 'flex';
}

function closeWaPaymentModal() {
  document.getElementById('waPaymentModal').style.display = 'none';
}

// ============================================================
// CONFIRM RECEIVED & REVIEW SYSTEM
// ============================================================
async function confirmOrderReceived(orderId) {
  if (!confirm('Apakah produk pesanan Anda sudah sampai dan diterima dengan kondisi baik?')) return;
  try {
    const res = await ApiService.updateOrderStatus(orderId, 'completed');
    if (res.success) {
      showToast('Pesanan telah selesai! Terima kasih telah berbelanja di GawaiKita.', 'success');
      loadOrders(state.currentOrderTabStatus);
    }
  } catch (err) {
    showToast(`Gagal konfirmasi pesanan: ${err.message}`, 'error');
  }
}

let selectedStarRating = 5;

function initStarPicker() {
  const stars = document.querySelectorAll('#starPicker .star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedStarRating = Number(star.dataset.rating);
      updateStarPickerUI();
    });
    star.addEventListener('mouseenter', () => {
      const hoverRating = Number(star.dataset.rating);
      updateStarPickerUI(hoverRating);
    });
  });
  document.getElementById('starPicker')?.addEventListener('mouseleave', () => {
    updateStarPickerUI();
  });
}

function updateStarPickerUI(hoverVal = null) {
  const ratingToDisplay = hoverVal || selectedStarRating;
  const stars = document.querySelectorAll('#starPicker .star');
  const labels = [
    '',
    '1 dari 5 Bintang — Sangat Kecewa',
    '2 dari 5 Bintang — Kurang Puas',
    '3 dari 5 Bintang — Cukup Baik',
    '4 dari 5 Bintang — Puas & Sesuai Ekspektasi',
    '5 dari 5 Bintang — Sangat Puas & Rekomendasi'
  ];
  stars.forEach(star => {
    const r = Number(star.dataset.rating);
    if (r <= ratingToDisplay) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
  const label = document.getElementById('starPickerLabel');
  if (label) {
    label.innerHTML = `<i class="fa-solid fa-star" style="color:var(--amber);"></i> ${labels[ratingToDisplay] || ''}`;
  }
}

function appendReviewTag(tag) {
  const input = document.getElementById('reviewCommentInput');
  if (!input) return;
  const cur = input.value.trim();
  if (cur.includes(tag)) return;
  input.value = cur ? `${cur} ${tag}` : tag;
  updateReviewCharCount(input);
}

function updateReviewCharCount(el) {
  const counter = document.getElementById('reviewCharCounter');
  if (counter) counter.textContent = `${el.value.length} / 500 karakter`;
}

function openReviewModal(productId, productName) {
  const user = ApiService.getUser();
  if (!user) {
    showToast('Silakan masuk (login) terlebih dahulu untuk memberikan ulasan.', 'error');
    openAuthModal('login');
    return;
  }
  document.getElementById('reviewProductId').value = productId;
  document.getElementById('reviewProductName').textContent = productName;
  const commentEl = document.getElementById('reviewCommentInput');
  if (commentEl) commentEl.value = '';
  selectedStarRating = 5;
  updateStarPickerUI();
  updateReviewCharCount({ value: '' });
  document.getElementById('reviewModal').style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
}

async function submitProductReview() {
  const productId = document.getElementById('reviewProductId').value;
  const comment = document.getElementById('reviewCommentInput').value.trim();
  const user = ApiService.getUser();
  if (!user) {
    showToast('Silakan login terlebih dahulu.', 'error');
    return;
  }
  const btn = document.getElementById('btnSubmitReview');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim Ulasan...';

  try {
    const res = await ApiService.addProductReview(productId, {
      userId: user.id || user._id,
      userName: user.name,
      rating: selectedStarRating,
      comment: comment || 'Produk original, mulus, dan pengiriman aman bergaransi resmi.'
    });
    if (res.success) {
      showToast('Ulasan berhasil diterbitkan. Terima kasih atas penilaian Anda!', 'success');
      closeReviewModal();
      loadProducts();
      if (state.selectedProduct && state.selectedProduct._id === productId) {
        openProductModal(res.data);
      }
    }
  } catch (err) {
    showToast(`Gagal mengirim ulasan: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Ulasan';
  }
}

// ============================================================
// DYNAMIC BRANDS FILTER & REAL-TIME CROSS-TAB SYNC
// ============================================================
async function loadDynamicBrandsFilter() {
  const container = document.getElementById('brandCheckboxList');
  if (!container) return;

  try {
    const res = await ApiService.getBrands();
    const brands = res.data || [];

    // Pertahankan filter yang sedang dicentang oleh user
    const currentChecked = new Set(
      Array.from(document.querySelectorAll('input[name="brandFilter"]:checked')).map(el => el.value)
    );

    if (brands.length === 0) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 0.25rem 0;">Belum ada brand terdaftar</div>';
      return;
    }

    container.innerHTML = brands.map(brand => {
      const isChecked = currentChecked.has(brand);
      return `
        <label class="custom-checkbox">
          <input type="checkbox" name="brandFilter" value="${brand}" ${isChecked ? 'checked' : ''}>
          <span class="checkbox-indicator"></span>
          <span class="checkbox-label">${brand}</span>
        </label>
      `;
    }).join('');
  } catch (err) {
    console.error('Gagal memuat dynamic brands filter:', err);
  }
}

// Auto-sync jika admin mengedit/menambah/menghapus brand di tab Admin
window.addEventListener('storage', (e) => {
  if (e.key === 'gawai_catalog_synced') {
    loadDynamicBrandsFilter();
    loadProducts();
  }
  if (e.key === 'gawai_profile_synced') {
    initAuthUI();
  }
});

// Auto-refresh brand dan katalog saat user kembali fokus ke tab toko
window.addEventListener('focus', () => {
  loadDynamicBrandsFilter();
});

