const CART_KEY = 'altugyapi_cart';
const PAYMENT_KEY = 'altugyapi_payment';
const ADDRESS_KEY = 'altugyapi_address';

function getCart() {
  const stored = localStorage.getItem(CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product || product.stock <= 0) return false;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + quantity > product.stock) {
    showToast('Stok yetersiz!');
    return false;
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  saveCart(cart);
  showToast(`${product.name} sepete eklendi`);
  return true;
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  const product = getProductById(productId);
  if (!product) return;

  if (quantity <= 0) {
    removeFromCart(productId);
    renderCartSidebar();
    return;
  }

  if (quantity > product.stock) {
    showToast('Stok yetersiz!');
    return;
  }

  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
    renderCartSidebar();
  }
}

function getCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const product = getProductById(item.id);
    return product ? total + product.price * item.quantity : total;
  }, 0);
}

function getCartCount() {
  return getCart().reduce((count, item) => count + item.quantity, 0);
}

function clearCart() {
  saveCart([]);
  localStorage.removeItem(PAYMENT_KEY);
  localStorage.removeItem(ADDRESS_KEY);
}

function getPaymentData() {
  const stored = localStorage.getItem(PAYMENT_KEY);
  return stored ? JSON.parse(stored) : {};
}

function savePaymentData(data) {
  localStorage.setItem(PAYMENT_KEY, JSON.stringify(data));
}

function getAddressData() {
  const stored = localStorage.getItem(ADDRESS_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveAddressData(data) {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(data));
}

function updateCartCount() {
  const countEl = document.querySelector('.cart-count');
  if (countEl) {
    const count = getCartCount();
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'flex' : 'none';
  }
}

function renderCartSidebar() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartFooter = document.querySelector('.cart-footer');
  if (!cartItemsEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Sepetiniz boş</p>
      </div>`;
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
    if (cartFooter) cartFooter.querySelector('.payment-card-section')?.remove();
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => {
    const product = getProductById(item.id);
    if (!product) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-img" style="background-image: url('${product.image}')"></div>
        <div class="cart-item-details">
          <h4>${product.name}</h4>
          <div class="cart-item-price">${formatPrice(product.price)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            <button class="remove-item" onclick="removeFromCart(${item.id}); renderCartSidebar();">Kaldır</button>
          </div>
        </div>
      </div>`;
  }).join('');

  if (cartTotalEl) cartTotalEl.textContent = formatPrice(getCartTotal());

  if (cartFooter) {
    cartFooter.querySelector('.payment-card-section')?.remove();
    cartFooter.insertAdjacentHTML('afterbegin', `
      <div class="payment-card-section admin-card" style="padding:16px; margin-bottom:16px; box-shadow:none; border:1px solid #eee;">
        <h4 style="margin-bottom:10px; font-size:1rem; color:var(--secondary);">💳 Kredi Kartı Bilgileri</h4>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="cardHolder">Kart Sahibi</label>
          <input id="cardHolder" type="text" placeholder="Ad Soyad" value="${(getPaymentData().cardHolder || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="cardNumber">Kart Numarası</label>
          <input id="cardNumber" type="text" inputmode="numeric" maxlength="19" placeholder="1111 2222 3333 4444" value="${(getPaymentData().cardNumber || '').replace(/"/g, '&quot;')}" />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="margin-bottom:0;">
            <label for="cardExpiry">Son Kullanma</label>
            <input id="cardExpiry" type="text" maxlength="5" placeholder="AA/YY" value="${(getPaymentData().expiry || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label for="cardCvv">CVV</label>
            <input id="cardCvv" type="password" maxlength="4" placeholder="***" value="${(getPaymentData().cvv || '').replace(/"/g, '&quot;')}" />
          </div>
        </div>
        <h4 style="margin:14px 0 10px; font-size:1rem; color:var(--secondary);">📍 Teslimat Adresi</h4>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="shippingName">Ad Soyad</label>
          <input id="shippingName" type="text" placeholder="Ali Yılmaz" value="${(getAddressData().fullName || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="shippingPhone">Telefon</label>
          <input id="shippingPhone" type="tel" placeholder="0555 123 45 67" value="${(getAddressData().phone || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="shippingAddress">Adres</label>
          <textarea id="shippingAddress" placeholder="Mahalle/Sokak, Apt No, Daire No">${(getAddressData().address || '').replace(/"/g, '&quot;')}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
          <label for="shippingCity">Şehir</label>
          <input id="shippingCity" type="text" placeholder="İstanbul" value="${(getAddressData().city || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label for="shippingNote">Not</label>
          <textarea id="shippingNote" placeholder="Kapı girişine bilgi verin...">${(getAddressData().note || '').replace(/"/g, '&quot;')}</textarea>
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:10px;" onclick="completeOrder()">Siparişi Tamamla</button>
      </div>`);

    const paymentInputs = ['cardHolder', 'cardNumber', 'cardExpiry', 'cardCvv'];
    paymentInputs.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        savePaymentData({
          ...getPaymentData(),
          [id === 'cardHolder' ? 'cardHolder' : id === 'cardNumber' ? 'cardNumber' : id === 'cardExpiry' ? 'expiry' : 'cvv']: el.value
        });
      });
    });

    ['shippingName', 'shippingPhone', 'shippingAddress', 'shippingCity', 'shippingNote'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        saveAddressData({
          ...getAddressData(),
          [id === 'shippingName' ? 'fullName' : id === 'shippingPhone' ? 'phone' : id === 'shippingAddress' ? 'address' : id === 'shippingCity' ? 'city' : 'note']: el.value
        });
      });
    });
  }
}

function openCart() {
  renderCartSidebar();
  document.getElementById('cartOverlay')?.classList.add('active');
  document.getElementById('cartSidebar')?.classList.add('active');
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('active');
  document.getElementById('cartSidebar')?.classList.remove('active');
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function completeOrder() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Sepetiniz boş!');
    return;
  }

  const payment = {
    cardHolder: document.getElementById('cardHolder')?.value?.trim() || '',
    cardNumber: document.getElementById('cardNumber')?.value?.trim() || '',
    expiry: document.getElementById('cardExpiry')?.value?.trim() || '',
    cvv: document.getElementById('cardCvv')?.value?.trim() || ''
  };
  const shippingAddress = {
    fullName: document.getElementById('shippingName')?.value?.trim() || '',
    phone: document.getElementById('shippingPhone')?.value?.trim() || '',
    address: document.getElementById('shippingAddress')?.value?.trim() || '',
    city: document.getElementById('shippingCity')?.value?.trim() || '',
    note: document.getElementById('shippingNote')?.value?.trim() || ''
  };

  if (!payment.cardHolder || !payment.cardNumber || !payment.expiry || !payment.cvv) {
    showToast('Kredi kartı bilgileri eksik. Lütfen tüm alanları doldurun.');
    return;
  }

  if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city) {
    showToast('Teslimat adresi bilgileri eksik. Lütfen tüm alanları doldurun.');
    return;
  }

  try {
    await submitOrder(cart, payment, shippingAddress);
    clearCart();
    await loadProducts();
    renderCartSidebar();
    showToast('Siparişiniz alındı! Teşekkür ederiz.');
    closeCart();

    if (document.getElementById('productsGrid')) {
      renderProducts('productsGrid', {
        category: document.getElementById('categoryFilter')?.value || 'all',
        search: document.getElementById('searchInput')?.value || ''
      });
    }

    if (document.getElementById('featuredProducts')) {
      const products = getProducts().slice(0, 4);
      document.getElementById('featuredProducts').innerHTML =
        products.map(renderProductCard).join('');
    }
  } catch (error) {
    showToast(error.message);
  }
}

function initCart() {
  updateCartCount();
}
