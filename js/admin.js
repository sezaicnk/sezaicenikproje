function showAdminAlert(message, type = 'success') {
  const alertEl = document.getElementById('adminAlert');
  if (!alertEl) return;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.classList.remove('hidden');
  setTimeout(() => alertEl.classList.add('hidden'), 3000);
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTable');
  const countEl = document.getElementById('productCount');
  if (!tbody) return;

  const products = getProducts();
  if (countEl) countEl.textContent = `${products.length} ürün`;

  tbody.innerHTML = products.map(p => {
    const status = getStockStatus(p.stock);
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="stock-badge ${status.class}">${p.stock} adet</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct(${p.id})">Sil</button>
        </td>
      </tr>`;
  }).join('');
}

function renderStockTable() {
  const tbody = document.getElementById('stockTable');
  const summaryEl = document.getElementById('stockSummary');
  if (!tbody) return;

  const products = getProducts();
  const inStock = products.filter(p => p.stock > 10).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card"><div class="stat-number" style="color:var(--success)">${inStock}</div><div class="stat-label">Stokta</div></div>
      <div class="stat-card"><div class="stat-number" style="color:var(--accent)">${lowStock}</div><div class="stat-label">Az Stok</div></div>
      <div class="stat-card"><div class="stat-number" style="color:var(--danger)">${outOfStock}</div><div class="stat-label">Tükendi</div></div>
      <div class="stat-card"><div class="stat-number">${products.length}</div><div class="stat-label">Toplam Ürün</div></div>`;
  }

  tbody.innerHTML = products.map(p => {
    const status = getStockStatus(p.stock);
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.stock} adet</td>
        <td><span class="stock-badge ${status.class}">${status.label}</span></td>
        <td>
          <input type="number" class="stock-input" id="stock-${p.id}" value="${p.stock}" min="0">
          <button class="btn btn-primary btn-sm" onclick="handleUpdateStock(${p.id})" style="margin-left:8px">Güncelle</button>
        </td>
      </tr>`;
  }).join('');
}

async function handleDeleteProduct(id) {
  const product = getProductById(id);
  if (!product) return;

  if (confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
    try {
      await deleteProduct(id);
      renderProductsTable();
      renderStockTable();
      showAdminAlert('Ürün başarıyla silindi.');
    } catch (error) {
      showAdminAlert(error.message, 'error');
    }
  }
}

async function handleUpdateStock(id) {
  const input = document.getElementById(`stock-${id}`);
  if (!input) return;

  try {
    await updateStock(id, input.value);
    renderProductsTable();
    renderStockTable();
    showAdminAlert('Stok güncellendi.');
  } catch (error) {
    showAdminAlert(error.message, 'error');
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.add('hidden'));
  document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');

  document.querySelectorAll('.admin-nav button[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  if (tabName === 'products') renderProductsTable();
  if (tabName === 'stock') renderStockTable();
}

async function initAdmin() {
  const loginScreen = document.getElementById('loginScreen');
  const adminPanel = document.getElementById('adminPanel');

  if (isLoggedIn()) {
    await initProducts();
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    renderProductsTable();
  }

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const alertEl = document.getElementById('loginAlert');

    try {
      await loginAdmin(user, pass);
      await initProducts();
      loginScreen.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      alertEl.classList.add('hidden');
      renderProductsTable();
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.classList.remove('hidden');
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutAdmin();
    location.reload();
  });

  document.querySelectorAll('.admin-nav button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const product = {
      name: document.getElementById('productName').value,
      category: document.getElementById('productCategory').value,
      price: parseFloat(document.getElementById('productPrice').value),
      stock: parseInt(document.getElementById('productStock').value, 10),
      description: document.getElementById('productDesc').value,
      image: document.getElementById('productImage').value ||
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
    };

    try {
      await addProduct(product);
      e.target.reset();
      showAdminAlert('Ürün başarıyla eklendi!');
      switchTab('products');
    } catch (error) {
      showAdminAlert(error.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', initAdmin);
