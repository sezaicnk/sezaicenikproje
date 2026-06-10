const CART_KEY = 'altugyapi_cart';

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
  if (!cartItemsEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Sepetiniz boş</p>
      </div>`;
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
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

  try {
    await submitOrder(cart);
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
