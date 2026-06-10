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

async function loadOrders() {
  try {
    const orders = await apiRequest('/api/orders');
    renderOrdersTable(orders);
    return orders;
  } catch (error) {
    showAdminAlert(error.message, 'error');
    return [];
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTable');
  const summaryEl = document.getElementById('ordersSummary');
  if (!tbody) return;

  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const itemCount = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card"><div class="stat-number">${totalOrders}</div><div class="stat-label">Toplam Sipariş</div></div>
      <div class="stat-card"><div class="stat-number">${itemCount}</div><div class="stat-label">Ürün Adedi</div></div>
      <div class="stat-card"><div class="stat-number">${formatPrice(totalValue)}</div><div class="stat-label">Toplam Tutar</div></div>`;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>#${order.id}</strong></td>
      <td>${formatPrice(order.total || 0)}</td>
      <td>${(order.items || []).length} ürün</td>
      <td>${order.payment?.cardHolder || '—'}<br><small>${order.payment?.cardNumberLast4 ? '**** ' + order.payment.cardNumberLast4 : 'Kart bilgisi yok'}</small></td>
      <td>${new Date(order.created_at).toLocaleString('tr-TR')}</td>
      <td><button class="btn btn-primary btn-sm" onclick="showOrderDetail(${order.id})">Detay</button></td>
    </tr>`).join('');
}

function showOrderDetail(orderId) {
  const detailCard = document.getElementById('orderDetailCard');
  const detailContent = document.getElementById('orderDetailContent');
  const orders = getOrdersCache || [];
  const order = orders.find(item => item.id === Number(orderId));

  if (!order || !detailCard || !detailContent) return;

  const itemsHtml = (order.items || []).map(item => `
    <li style="margin-bottom:8px;">${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}</li>`).join('');

  detailContent.innerHTML = `
    <p><strong>Sipariş No:</strong> #${order.id}</p>
    <p><strong>Tarih:</strong> ${new Date(order.created_at).toLocaleString('tr-TR')}</p>
    <p><strong>Toplam Tutar:</strong> ${formatPrice(order.total || 0)}</p>
    <p><strong>Kart Sahibi:</strong> ${order.payment?.cardHolder || 'Belirtilmedi'}</p>
    <p><strong>Kart Son 4 Hane:</strong> ${order.payment?.cardNumberLast4 || 'Belirtilmedi'}</p>
    <p><strong>Son Kullanma:</strong> ${order.payment?.expiry || 'Belirtilmedi'}</p>
    <p><strong>Adres:</strong> ${order.shippingAddress?.address || 'Belirtilmedi'}</p>
    <p><strong>Şehir:</strong> ${order.shippingAddress?.city || 'Belirtilmedi'}</p>
    <p><strong>Telefon:</strong> ${order.shippingAddress?.phone || 'Belirtilmedi'}</p>
    <p><strong>Alıcı:</strong> ${order.shippingAddress?.fullName || 'Belirtilmedi'}</p>
    <ul style="padding-left:18px; margin-top:12px;">${itemsHtml}</ul>`;
  detailCard.style.display = 'block';
}

let getOrdersCache = [];

function populateOrderProductOptions() {
  const select = document.getElementById('orderProduct');
  if (!select) return;

  const products = getProducts();
  select.innerHTML = products.map(product => `<option value="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>${product.name} — ${formatPrice(product.price)} (${product.stock} adet)</option>`).join('');
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
  if (tabName === 'new-order') populateOrderProductOptions();
  if (tabName === 'orders') {
    loadOrders().then(orders => {
      getOrdersCache = orders;
      renderOrdersTable(orders);
    });
  }
}

async function initAdmin() {
  const loginScreen = document.getElementById('loginScreen');
  const adminPanel = document.getElementById('adminPanel');

  if (isLoggedIn()) {
    await initProducts();
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    populateOrderProductOptions();
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
      populateOrderProductOptions();
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

  document.getElementById('createOrderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = Number(document.getElementById('orderProduct').value);
    const quantity = Math.max(1, parseInt(document.getElementById('orderQty').value, 10) || 1);
    const product = getProductById(productId);

    if (!product) {
      showAdminAlert('Lütfen geçerli bir ürün seçin.', 'error');
      return;
    }

    try {
      const order = await apiRequest('/api/orders/admin', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ id: product.id, quantity }],
          payment: {
            cardHolder: document.getElementById('orderCardHolder').value,
            cardNumber: document.getElementById('orderCardNumber').value,
            expiry: document.getElementById('orderExpiry').value,
            cvv: document.getElementById('orderCvv').value
          },
          shippingAddress: {
            fullName: document.getElementById('orderFullName').value,
            phone: document.getElementById('orderPhone').value,
            address: document.getElementById('orderAddress').value,
            city: document.getElementById('orderCity').value,
            note: document.getElementById('orderNote').value
          }
        })
      });

      e.target.reset();
      populateOrderProductOptions();
      showAdminAlert(`Sipariş kaydı oluşturuldu: #${order.id}`, 'success');
      switchTab('orders');
      await loadOrders();
    } catch (error) {
      showAdminAlert(error.message, 'error');
    }
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
