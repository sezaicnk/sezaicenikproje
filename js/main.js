function renderUserProfile() {
  const profileNav = document.getElementById('profileNavItem');
  if (!profileNav) return;

  const user = getCurrentUser?.();

  if (!user) {
    profileNav.innerHTML = '<a href="login.html" class="profile-chip profile-chip--login">Giriş Yap</a>';
    return;
  }

  const label = user.role === 'admin' ? '👑 Admin' : '👤 ' + (user.name || 'Profil');
  const adminLink = user.role === 'admin'
    ? ' <a href="admin.html" class="profile-chip profile-chip--admin">Admin Panel</a>'
    : '';

  profileNav.innerHTML = `
    <span class="profile-chip">${label}</span>
    ${adminLink}
    <button class="profile-chip profile-chip--ghost" type="button" onclick="logoutAdmin(); window.location.reload();">Çıkış</button>
  `;
}

function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

function renderProductCard(product) {
  const stockStatus = getStockStatus(product.stock);
  return `
    <div class="product-card">
      <div class="product-image" style="background-image: url('${product.image}')">
        <span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-to-cart" ${product.stock <= 0 ? 'disabled' : ''} 
            onclick="addToCart(${product.id}); renderCartSidebar();">
            ${product.stock <= 0 ? 'Tükendi' : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderProducts(containerId, filter = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let products = getProducts();

  if (filter.category && filter.category !== 'all') {
    products = products.filter(p => p.category === filter.category);
  }

  if (filter.search) {
    const search = filter.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }

  if (products.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #7f8c8d;">Ürün bulunamadı.</p>';
    return;
  }

  container.innerHTML = products.map(renderProductCard).join('');
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      await submitContact({
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
      });
      showToast('Mesajınız alındı! En kısa sürede dönüş yapacağız.');
      form.reset();
    } catch (error) {
      showToast(error.message);
    }
  });
}

function initMagazaPage() {
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  if (!categoryFilter) return;

  categoryFilter.innerHTML = '<option value="all">Tüm Kategoriler</option>';
  getCategories().forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  function applyFilters() {
    renderProducts('productsGrid', {
      category: categoryFilter.value,
      search: searchInput?.value || ''
    });
  }

  categoryFilter.addEventListener('change', applyFilters);
  searchInput?.addEventListener('input', applyFilters);
  applyFilters();
}

async function initApp() {
  // Handle GitHub OAuth Redirect login params
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('oauth_token');
  const oauthName = urlParams.get('oauth_name');
  const oauthEmail = urlParams.get('oauth_email');

  if (oauthToken && oauthName) {
    sessionStorage.setItem('altugyapi_admin', oauthToken);
    sessionStorage.setItem('altugyapi_user', JSON.stringify({
      role: 'user',
      name: decodeURIComponent(oauthName),
      email: decodeURIComponent(oauthEmail || ''),
      token: oauthToken
    }));
    // Clean URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  initNavigation();
  renderUserProfile();
  initCart();
  initContactForm();

  const needsProducts = document.getElementById('featuredProducts') ||
    document.getElementById('productsGrid');

  if (needsProducts) {
    await initProducts();

    const featured = document.getElementById('featuredProducts');
    if (featured) {
      featured.innerHTML = getProducts().slice(0, 4).map(renderProductCard).join('');
    }

    if (document.getElementById('productsGrid')) {
      initMagazaPage();
    }
  }
}

document.addEventListener('DOMContentLoaded', initApp);
