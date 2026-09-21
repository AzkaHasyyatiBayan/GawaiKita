const ApiService = (function () {
  // Base URL server
  const BASE_URL = window.location.protocol.startsWith('http')
    ? window.location.origin
    : 'http://localhost:5000';

  // State Varian Aktif (v0, v1, v2, v3)
  // Default ke 'v3' (Full Protection: Joi + Sanitize) untuk keamanan standar marketplace
  let currentVariant = localStorage.getItem('gawai_variant') || 'v3';

  // State Token & User
  let authToken = localStorage.getItem('gawai_token') || null;
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('gawai_user') || 'null');
    if (currentUser && (currentUser.email === 'budi@gawaikita.test' || (currentUser.name && currentUser.name.toLowerCase().includes('budi')))) {
      localStorage.removeItem('gawai_token');
      localStorage.removeItem('gawai_user');
      currentUser = null;
      authToken = null;
    }
  } catch (e) {
    currentUser = null;
  }

  function getApiPrefix(variant = currentVariant) {
    return `${BASE_URL}/api/${variant}`;
  }

  function getHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  return {
    // Getter & Setter Varian
    getVariant() {
      return currentVariant;
    },
    setVariant(variant) {
      currentVariant = variant;
      localStorage.setItem('gawai_variant', variant);
      window.dispatchEvent(new CustomEvent('variantChanged', { detail: { variant } }));
    },

    // Auth state
    getToken() {
      return authToken;
    },
    getUser() {
      return currentUser;
    },
    setAuth(token, user) {
      authToken = token;
      currentUser = user;
      localStorage.setItem('gawai_token', token);
      localStorage.setItem('gawai_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('authChanged', { detail: { user, token } }));
    },
    clearAuth() {
      authToken = null;
      currentUser = null;
      localStorage.removeItem('gawai_token');
      localStorage.removeItem('gawai_user');
      window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null, token: null } }));
    },

    // 1. PRODUCTS API
    async getProducts(filterParams = {}, variant = currentVariant) {
      const query = new URLSearchParams();
      if (filterParams.minPrice) query.append('minPrice', filterParams.minPrice);
      if (filterParams.maxPrice) query.append('maxPrice', filterParams.maxPrice);
      if (filterParams.brand) query.append('brand', filterParams.brand);
      if (filterParams.category) query.append('category', filterParams.category);
      if (filterParams.sort) query.append('sort', filterParams.sort);
      if (filterParams.q) query.append('q', filterParams.q);

      const url = `${getApiPrefix(variant)}/products?${query.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat produk');
      return data;
    },

    async getProductById(id, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products/${id}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Produk tidak ditemukan');
      return data;
    },

    async getBrands(variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/brands`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat daftar brand');
      return data;
    },

    // 2. AUTH API
    async login(credentials, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof credentials === 'string' ? credentials : JSON.stringify(credentials)
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    },

    async register(userData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal registrasi');
      return data;
    },

    async getProfile(variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/profile`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat profil');
      return data;
    },

    async updateProfile(profileData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/profile`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui profil');
      return data;
    },

    // 3. ORDERS API
    async getOrders(params = {}, variant = currentVariant) {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.userId) query.append('userId', params.userId);

      const url = `${getApiPrefix(variant)}/orders?${query.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat pesanan');
      return data;
    },

    async createOrder(orderData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/orders`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat pesanan');
      return data;
    },

    async updateOrderStatus(orderId, status, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/orders/${orderId}/status`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status');
      return data;
    },

    // 4. ADMIN API
    async getAdminUsers(search = '', variant = currentVariant) {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const url = `${getApiPrefix(variant)}/admin/users${query}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat data pengguna');
      return data;
    },

    async getAdminStats(variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/admin/stats`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat statistik');
      return data;
    },

    async addProduct(productData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambah produk');
      return data;
    },

    async updateProduct(id, productData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah produk');
      return data;
    },

    async deleteProduct(id, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus produk');
      return data;
    },

    async addProductReview(productId, reviewData, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products/${productId}/reviews`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan ulasan');
      return data;
    },

    async replyProductReview(productId, reviewId, text, variant = currentVariant) {
      const url = `${getApiPrefix(variant)}/products/${productId}/reviews/${reviewId}/reply`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membalas ulasan');
      return data;
    },

    // 5. TESTBED RESEARCH EXECUTOR (Mengukur response status, waktu ms, dan raw response)
    async executeCustomAttack(variant, path, method, rawBodyOrQuery) {
      const startTime = performance.now();
      let url = `${getApiPrefix(variant)}${path}`;
      const options = {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      if (method === 'POST') {
        options.body = rawBodyOrQuery;
      } else if (rawBodyOrQuery) {
        // Query params
        if (rawBodyOrQuery.startsWith('?') || rawBodyOrQuery.startsWith('&')) {
          url += rawBodyOrQuery;
        } else {
          url += `?${rawBodyOrQuery}`;
        }
      }

      try {
        const response = await fetch(url, options);
        const duration = Math.round(performance.now() - startTime);
        let parsedData;
        const text = await response.text();
        try {
          parsedData = JSON.parse(text);
        } catch (e) {
          parsedData = { rawText: text };
        }

        return {
          status: response.status,
          statusText: response.statusText,
          duration,
          data: parsedData,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        return {
          status: 0,
          statusText: 'Network / Connection Error',
          duration,
          data: { error: err.message }
        };
      }
    }
  };
})();
