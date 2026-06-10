const API_BASE = '';
const SESSION_KEY = 'altugyapi_admin';

let productsCache = [];

function getAuthHeaders() {
  const token = sessionStorage.getItem(SESSION_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Bir hata oluştu');
  }

  return data;
}

async function loadProducts() {
  productsCache = await apiRequest('/api/products');
  return productsCache;
}

async function initProducts() {
  try {
    await loadProducts();
    return true;
  } catch (error) {
    console.error('Ürünler yüklenemedi:', error);
    showToast?.('Sunucuya bağlanılamadı. npm start ile sunucuyu başlatın.');
    return false;
  }
}

function getProducts() {
  return productsCache;
}

function getProductById(id) {
  return productsCache.find(p => p.id === Number(id));
}

async function addProduct(product) {
  const newProduct = await apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });
  await loadProducts();
  return newProduct;
}

async function updateProduct(id, updates) {
  const product = await apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  await loadProducts();
  return product;
}

async function deleteProduct(id) {
  await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
  await loadProducts();
}

async function updateStock(id, stock) {
  const product = await apiRequest(`/api/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: Math.max(0, parseInt(stock, 10) || 0) })
  });
  await loadProducts();
  return product;
}

function getCategories() {
  return [...new Set(productsCache.map(p => p.category))];
}

function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
}

function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Tükendi', class: 'stock-out' };
  if (stock <= 10) return { label: 'Az Stok', class: 'stock-low' };
  return { label: 'Stokta', class: 'stock-in' };
}

async function loginAdmin(username, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  sessionStorage.setItem(SESSION_KEY, data.token);
  return data;
}

function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

async function submitContact(formData) {
  return apiRequest('/api/contact', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

async function submitOrder(items) {
  return apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}
